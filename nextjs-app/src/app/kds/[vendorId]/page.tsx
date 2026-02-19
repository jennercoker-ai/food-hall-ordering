import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import KDSBoard from '@/components/kds/KDSBoard';

export const dynamic = 'force-dynamic';

/**
 * Simple header-based gate for the KDS.
 * Access via: /kds/[vendorId]?key=YOUR_KDS_SECRET
 * In production replace with proper session auth.
 */
export default async function KDSPage({
  params,
  searchParams,
}: {
  params: { vendorId: string };
  searchParams: { key?: string };
}) {
  const secret = process.env.KDS_SECRET ?? 'dev';
  if (searchParams.key !== secret && process.env.NODE_ENV !== 'development') {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-5xl mb-4">🔒</p>
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-slate-400">Append <code className="text-orange-400">?key=YOUR_KDS_SECRET</code> to the URL</p>
        </div>
      </div>
    );
  }

  const vendor = await prisma.vendor.findUnique({ where: { id: params.vendorId } });
  if (!vendor) notFound();

  const orderItems = await prisma.orderItem.findMany({
    where: { vendorId: params.vendorId, status: { not: 'COLLECTED' } },
    include: {
      order: {
        select: {
          id: true, specialInstructions: true, tableNumber: true, orderType: true, createdAt: true,
        },
      },
      menuItem: { select: { name: true } },
    },
    orderBy: [{ status: 'asc' }, { order: { createdAt: 'asc' } }],
  });

  const items = orderItems.map((i) => ({
    id: i.id,
    orderId: i.orderId,
    orderNumber: i.orderId.slice(-4).toUpperCase(),
    name: i.menuItem?.name ?? '—',
    quantity: i.quantity,
    guestName: i.guestName,
    status: i.status as 'RECEIVED' | 'PREPARING' | 'READY' | 'COLLECTED',
    order: {
      specialInstructions: i.order?.specialInstructions,
      tableNumber: i.order?.tableNumber,
      orderType: i.order?.orderType,
      createdAt: i.order?.createdAt?.toISOString(),
    },
  }));

  return (
    <KDSBoard
      vendorId={vendor.id}
      vendorName={vendor.name}
      collectionPoint={vendor.collectionPoint}
      initialItems={items}
    />
  );
}
