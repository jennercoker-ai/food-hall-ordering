import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import VendorMenuPage from '@/components/customer/VendorMenuPage';

export const dynamic = 'force-dynamic';

export default async function VendorPage({ params }: { params: { vendorId: string } }) {
  const [vendor, menuItems] = await Promise.all([
    prisma.vendor.findUnique({ where: { id: params.vendorId } }),
    prisma.menuItem.findMany({
      where: { vendorId: params.vendorId, available: true },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    }),
  ]);

  if (!vendor) notFound();

  return <VendorMenuPage vendor={vendor} menuItems={menuItems} />;
}
