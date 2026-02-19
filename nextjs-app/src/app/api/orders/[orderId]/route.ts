import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_req: Request, { params }: { params: { orderId: string } }) {
  const order = await prisma.order.findUnique({
    where: { id: params.orderId },
    include: {
      items: {
        include: {
          menuItem: { select: { name: true, category: true } },
          vendor: { select: { id: true, name: true, collectionPoint: true } },
        },
      },
      vendor: true,
    },
  });
  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(order);
}

export async function PATCH(req: Request, { params }: { params: { orderId: string } }) {
  const { status } = await req.json();
  const updated = await prisma.order.update({
    where: { id: params.orderId },
    data: { status },
  });
  return NextResponse.json(updated);
}
