import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: { vendorId: string } }) {
  const { searchParams } = new URL(req.url);
  const statusParam = searchParams.get('status');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { vendorId: params.vendorId };

  if (statusParam) {
    where.status = statusParam;
  } else {
    where.status = { not: 'COLLECTED' };
  }

  const items = await prisma.orderItem.findMany({
    where,
    include: {
      order: { select: { id: true, customerPhone: true, specialInstructions: true, groupId: true, createdAt: true, orderType: true, tableNumber: true } },
      menuItem: { select: { id: true, name: true, price: true, category: true } },
      vendor: { select: { id: true, name: true, collectionPoint: true } },
    },
    orderBy: [{ status: 'asc' }, { order: { createdAt: 'asc' } }],
  });

  return NextResponse.json(
    items.map((item) => ({
      ...item,
      orderNumber: item.orderId.slice(-4).toUpperCase(),
      name: item.menuItem?.name ?? '—',
    })),
  );
}
