import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { v4 as uuid } from 'uuid';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const phone = searchParams.get('customerPhone');
  const groupId = searchParams.get('groupId');
  const status = searchParams.get('status');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};
  if (phone) where.customerPhone = phone;
  if (groupId) where.groupId = groupId;
  if (status) where.status = status;

  const orders = await prisma.order.findMany({
    where,
    include: {
      items: {
        include: {
          menuItem: { select: { name: true } },
          vendor: { select: { name: true, collectionPoint: true } },
        },
      },
      vendor: { select: { id: true, name: true, collectionPoint: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(orders);
}

export async function POST(req: Request) {
  const body = await req.json();
  const {
    items,          // CartItem[]
    groupId,
    orderType = 'DINE_IN',
    tableNumber,
    deliveryAddress,
    deliveryFee = 0,
    customerPhone,
    customerName,
    specialInstructions,
  } = body;

  if (!items || items.length === 0) {
    return NextResponse.json({ error: 'No items provided' }, { status: 400 });
  }

  // Group cart items by vendor
  const byVendor: Record<string, typeof items> = {};
  for (const item of items) {
    if (!byVendor[item.vendorId]) byVendor[item.vendorId] = [];
    byVendor[item.vendorId].push(item);
  }

  const sharedGroupId = groupId ?? uuid();
  const createdOrders = [];

  for (const [vendorId, vendorItems] of Object.entries(byVendor)) {
    const vendorTotal = (vendorItems as typeof items).reduce(
      (s: number, i: { price: number; quantity: number }) => s + i.price * i.quantity,
      0,
    );

    const order = await prisma.order.create({
      data: {
        groupId: sharedGroupId,
        orderType,
        tableNumber: orderType === 'DINE_IN' ? tableNumber : null,
        deliveryAddress: orderType === 'DELIVERY' ? deliveryAddress : null,
        deliveryFee: orderType === 'DELIVERY' ? deliveryFee : 0,
        customerPhone,
        customerName,
        specialInstructions,
        vendorId,
        totalAmount: vendorTotal,
        status: 'PENDING',
        items: {
          create: (vendorItems as Array<{ menuItemId: string; quantity: number; price: number; guestName?: string }>).map((i) => ({
            menuItemId: i.menuItemId,
            vendorId,
            quantity: i.quantity,
            price: i.price,
            guestName: i.guestName ?? null,
            status: 'RECEIVED',
          })),
        },
      },
      include: {
        items: { include: { menuItem: { select: { name: true } }, vendor: { select: { name: true } } } },
        vendor: true,
      },
    });

    createdOrders.push(order);
  }

  return NextResponse.json({ orders: createdOrders, groupId: sharedGroupId }, { status: 201 });
}
