import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, OrderType } from "@prisma/client";

const prisma = new PrismaClient();

type CartItem = {
  id?: string;
  name: string;
  price: number;
  quantity?: number;
  vendorId?: string;
  vendorName?: string;
  guestName?: string;
};

type HandoffBody = {
  cart: CartItem[];
  orderType?: "DINE_IN" | "DELIVERY";
  deliveryAddress?: string;
  guestName?: string;
  customerPhone?: string;
  specialInstructions?: string;
};

export async function POST(request: NextRequest) {
  try {
    const body: HandoffBody = await request.json();
    const {
      cart,
      orderType = "DINE_IN",
      deliveryAddress,
      guestName: defaultGuestName,
      customerPhone,
      specialInstructions,
    } = body;

    if (!cart?.length) {
      return NextResponse.json(
        { error: "Cart is empty" },
        { status: 400 }
      );
    }

    const deliveryFee = orderType === "DELIVERY" ? 4.99 : 0;

    // Group cart items by vendor (vendorId or vendorName as fallback key)
    const byVendor = new Map<string | null, CartItem[]>();
    for (const item of cart) {
      const qty = Math.max(1, item.quantity ?? 1);
      const key = item.vendorId ?? item.vendorName ?? null;
      const entry = byVendor.get(key) ?? [];
      entry.push({ ...item, quantity: qty });
      byVendor.set(key, entry);
    }

    const orders: { id: string; orderNumber: number; vendorId: string | null; totalAmount: number }[] = [];
    let deliveryFeeApplied = false;

    for (const [vendorKey, items] of byVendor.entries()) {
      const subtotal = items.reduce((sum, i) => sum + (i.price ?? 0) * (i.quantity ?? 1), 0);
      const addFee = orderType === "DELIVERY" && !deliveryFeeApplied;
      if (addFee) deliveryFeeApplied = true;
      const totalAmount = subtotal + (addFee ? deliveryFee : 0);

      // Resolve vendorId if we only have vendorName (look up by name)
      let vendorId: string | null = typeof vendorKey === "string" && vendorKey.startsWith("cuid") ? vendorKey : null;
      if (vendorKey && !vendorId) {
        const vendor = await prisma.vendor.findFirst({
          where: { name: vendorKey },
        });
        vendorId = vendor?.id ?? null;
      }

      const orderNumber = Math.floor(100 + Math.random() * 900);

      const order = await prisma.order.create({
        data: {
          orderNumber,
          orderType: orderType as OrderType,
          status: "PENDING",
          totalAmount,
          deliveryAddress: orderType === "DELIVERY" ? deliveryAddress ?? null : null,
          deliveryFee: addFee ? 4.99 : 0,
          customerPhone: customerPhone ?? null,
          specialInstructions: specialInstructions ?? null,
          vendorId,
          items: {
            create: items.map((i) => ({
              name: i.name,
              price: i.price,
              quantity: i.quantity ?? 1,
              vendorName: i.vendorName ?? "Vendor",
              vendorId: vendorId ?? undefined,
              guestName: i.guestName ?? defaultGuestName ?? null,
            })),
          },
        },
        include: { items: true },
      });

      orders.push({
        id: order.id,
        orderNumber: order.orderNumber ?? orderNumber,
        vendorId,
        totalAmount: order.totalAmount,
      });
    }

    return NextResponse.json({
      success: true,
      orders,
      message: orders.length > 1 ? `${orders.length} orders created (multi-vendor)` : "Order created",
    });
  } catch (e) {
    console.error("Handoff error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Order handoff failed" },
      { status: 500 }
    );
  }
}
