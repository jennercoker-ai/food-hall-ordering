import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_req: Request, { params }: { params: { vendorId: string } }) {
  const vendor = await prisma.vendor.findUnique({ where: { id: params.vendorId } });
  if (!vendor) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(vendor);
}
