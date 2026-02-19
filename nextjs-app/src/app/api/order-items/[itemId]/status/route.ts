import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  notifyOrderSSE,
  notifyCustomerSSE,
  notifyGroupSSE,
} from '@/lib/sse';

export async function PATCH(req: Request, { params }: { params: { itemId: string } }) {
  const { status } = await req.json();

  const updated = await prisma.orderItem.update({
    where: { id: params.itemId },
    data: { status },
    include: {
      order: {
        select: {
          id: true,
          groupId: true,
          customerPhone: true,
          status: true,
          items: { select: { status: true } },
        },
      },
      menuItem: { select: { name: true } },
      vendor: { select: { name: true, collectionPoint: true } },
    },
  });

  const order = updated.order;
  const readyItems = order.items.filter((i) => i.status === 'READY');
  const allReady = readyItems.length === order.items.length;

  // Auto-complete order when all items ready
  if (allReady) {
    await prisma.order.update({ where: { id: order.id }, data: { status: 'COMPLETED' } });
  }

  const payload = {
    type: 'ITEM_UPDATE',
    orderId: order.id,
    orderItemId: updated.id,
    itemStatus: updated.status,
    itemName: updated.menuItem?.name,
    vendorName: updated.vendor?.name,
    station: updated.vendor?.collectionPoint,
    readyCount: readyItems.length,
    totalItems: order.items.length,
    allReady,
  };

  notifyOrderSSE(order.id, payload);
  if (order.customerPhone) notifyCustomerSSE(order.customerPhone, payload);
  if (order.groupId) notifyGroupSSE(order.groupId, payload);

  return NextResponse.json({ ...updated, allReady, readyCount: readyItems.length, totalItems: order.items.length });
}
