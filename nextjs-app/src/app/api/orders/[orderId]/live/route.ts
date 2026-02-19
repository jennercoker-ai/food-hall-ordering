import {
  createSSEStream,
  registerOrderSSE,
  unregisterOrderSSE,
} from '@/lib/sse';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export function GET(_req: Request, { params }: { params: { orderId: string } }) {
  return createSSEStream(
    (ctrl) => registerOrderSSE(params.orderId, ctrl),
    (ctrl) => unregisterOrderSSE(params.orderId, ctrl),
  );
}
