import { NextResponse } from 'next/server';
import {
  createSSEStream,
  registerGroupSSE,
  unregisterGroupSSE,
} from '@/lib/sse';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(_req: Request, { params }: { params: { groupId: string } }) {
  // Fetch current group state to send as initial snapshot
  const orders = await prisma.order.findMany({
    where: { groupId: params.groupId },
    include: {
      items: {
        include: {
          menuItem: { select: { name: true } },
          vendor: { select: { name: true, collectionPoint: true } },
        },
      },
    },
  });

  return createSSEStream(
    (ctrl) => {
      registerGroupSSE(params.groupId, ctrl);
      // Send current snapshot immediately
      const encoder = new TextEncoder();
      ctrl.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({ type: 'GROUP_UPDATE', orders })}\n\n`,
        ),
      );
    },
    (ctrl) => unregisterGroupSSE(params.groupId, ctrl),
  );
}

// Allow vendor dashboards to push a manual refresh to group SSE
export async function POST(req: Request, { params }: { params: { groupId: string } }) {
  const body = await req.json();
  const { notifyGroupSSE } = await import('@/lib/sse');
  notifyGroupSSE(params.groupId, body);
  return NextResponse.json({ ok: true });
}
