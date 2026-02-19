import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_req: Request, { params }: { params: { vendorId: string } }) {
  const items = await prisma.menuItem.findMany({
    where: { vendorId: params.vendorId, available: true },
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
  });
  return NextResponse.json(items);
}
