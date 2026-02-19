import { prisma } from '@/lib/prisma';
import CustomerShell from '@/components/customer/CustomerShell';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const vendors = await prisma.vendor.findMany({ orderBy: { name: 'asc' } });
  return <CustomerShell vendors={vendors} />;
}
