import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import OrderStatusPage from '@/components/customer/OrderStatusPage';

export const dynamic = 'force-dynamic';

export default async function OrderPage({ params }: { params: { orderId: string } }) {
  const order = await prisma.order.findUnique({
    where: { id: params.orderId },
    include: {
      items: {
        include: {
          menuItem: { select: { name: true } },
          vendor: { select: { id: true, name: true, collectionPoint: true } },
        },
      },
      vendor: true,
    },
  });

  if (!order) notFound();

  return <OrderStatusPage order={JSON.parse(JSON.stringify(order))} />;
}
