/**
 * Module-level SSE connection registry.
 * In production, replace with Redis pub/sub for multi-instance deployments.
 */

type SSEController = ReadableStreamDefaultController<Uint8Array>;

// orderId → set of controllers
const orderConnections = new Map<string, Set<SSEController>>();
// customerPhone → set of controllers
const customerConnections = new Map<string, Set<SSEController>>();
// groupId → set of controllers
const groupConnections = new Map<string, Set<SSEController>>();

function encode(data: object): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`);
}

// ─── Registration ─────────────────────────────────────────────────────────────
export function registerOrderSSE(orderId: string, controller: SSEController) {
  if (!orderConnections.has(orderId)) orderConnections.set(orderId, new Set());
  orderConnections.get(orderId)!.add(controller);
}

export function registerCustomerSSE(phone: string, controller: SSEController) {
  if (!customerConnections.has(phone)) customerConnections.set(phone, new Set());
  customerConnections.get(phone)!.add(controller);
}

export function registerGroupSSE(groupId: string, controller: SSEController) {
  if (!groupConnections.has(groupId)) groupConnections.set(groupId, new Set());
  groupConnections.get(groupId)!.add(controller);
}

// ─── Deregistration ───────────────────────────────────────────────────────────
export function unregisterOrderSSE(orderId: string, controller: SSEController) {
  orderConnections.get(orderId)?.delete(controller);
}

export function unregisterCustomerSSE(phone: string, controller: SSEController) {
  customerConnections.get(phone)?.delete(controller);
}

export function unregisterGroupSSE(groupId: string, controller: SSEController) {
  groupConnections.get(groupId)?.delete(controller);
}

// ─── Broadcast helpers ────────────────────────────────────────────────────────
function broadcast(controllers: Set<SSEController> | undefined, data: object) {
  if (!controllers) return;
  const chunk = encode(data);
  Array.from(controllers).forEach((ctrl) => {
    try {
      ctrl.enqueue(chunk);
    } catch {
      controllers.delete(ctrl);
    }
  });
}

export function notifyOrderSSE(orderId: string, data: object) {
  broadcast(orderConnections.get(orderId), data);
}

export function notifyCustomerSSE(phone: string, data: object) {
  broadcast(customerConnections.get(phone), data);
}

export function notifyGroupSSE(groupId: string, data: object) {
  broadcast(groupConnections.get(groupId), data);
}

// ─── SSE Response factory ─────────────────────────────────────────────────────
export function createSSEStream(
  onConnect: (controller: SSEController) => void,
  onClose: (controller: SSEController) => void,
): Response {
  let controller: SSEController;

  const stream = new ReadableStream<Uint8Array>({
    start(ctrl) {
      controller = ctrl;
      onConnect(ctrl);
      // Send initial heartbeat
      ctrl.enqueue(encode({ type: 'CONNECTED' }));
    },
    cancel() {
      onClose(controller);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
