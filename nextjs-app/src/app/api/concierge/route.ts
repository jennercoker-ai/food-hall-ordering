import { NextResponse } from 'next/server';
import { processMessage } from '@/lib/concierge';

export async function POST(req: Request) {
  const { message, groupId, isGroupSession } = await req.json();
  if (!message?.trim()) {
    return NextResponse.json({ error: 'Message required' }, { status: 400 });
  }
  const response = await processMessage(message, { groupId, isGroupSession });
  return NextResponse.json(response);
}
