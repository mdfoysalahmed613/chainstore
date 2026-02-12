import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    // Authenticate the user via Supabase session
    const supabaseAuth = await createServerClient();
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { template_id } = body;

    if (!template_id) {
      return NextResponse.json(
        { error: "template_id is required" },
        { status: 400 },
      );
    }

    // Use service role for backend operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    // Fetch the template
    const { data: template, error: templateError } = await supabase
      .from("templates")
      .select("id, name, price, hotpay_item_id")
      .eq("id", template_id)
      .eq("is_active", true)
      .single();

    if (templateError || !template) {
      return NextResponse.json(
        { error: "template_not_found" },
        { status: 404 },
      );
    }

    // Check if user already has a completed purchase for this template
    const { data: existingPurchase } = await supabase
      .from("purchases")
      .select("id, payment_status, memo")
      .eq("user_id", user.id)
      .eq("template_id", template_id)
      .single();

    if (existingPurchase) {
      if (existingPurchase.payment_status === "completed") {
        return NextResponse.json(
          { error: "already_purchased" },
          { status: 409 },
        );
      }

      // If there's a pending purchase, reuse it with the existing memo
      if (
        existingPurchase.payment_status === "pending" &&
        existingPurchase.memo
      ) {
        const paymentUrl = buildPaymentUrl(
          template.hotpay_item_id,
          template.price,
          existingPurchase.memo,
        );

        return NextResponse.json({
          order_id: existingPurchase.id,
          memo: existingPurchase.memo,
          payment_url: paymentUrl,
        });
      }
    }

    // Generate a unique memo for this order
    const memo = crypto.randomUUID();

    if (existingPurchase) {
      // Update the existing pending/failed purchase with a new memo
      await supabase
        .from("purchases")
        .update({
          memo,
          payment_status: "pending",
          amount: template.price,
        })
        .eq("id", existingPurchase.id);

      const paymentUrl = buildPaymentUrl(
        template.hotpay_item_id,
        template.price,
        memo,
      );

      return NextResponse.json({
        order_id: existingPurchase.id,
        memo,
        payment_url: paymentUrl,
      });
    }

    // Create a new purchase record
    const { data: purchase, error: purchaseError } = await supabase
      .from("purchases")
      .insert({
        user_id: user.id,
        template_id: template.id,
        amount: template.price,
        currency: "USD",
        payment_status: "pending",
        memo,
      })
      .select("id")
      .single();

    if (purchaseError) {
      return NextResponse.json(
        { error: "failed_to_create_order" },
        { status: 500 },
      );
    }

    const paymentUrl = buildPaymentUrl(
      template.hotpay_item_id,
      template.price,
      memo,
    );

    return NextResponse.json({
      order_id: purchase.id,
      memo,
      payment_url: paymentUrl,
    });
  } catch {
    return NextResponse.json(
      { error: "internal_server_error" },
      { status: 500 },
    );
  }
}

function buildPaymentUrl(
  hotpayItemId: string | null,
  amount: number,
  memo: string,
): string {
  const baseUrl =
    process.env.NEXT_PUBLIC_HOTPAY_BASE_URL || "https://pay.hot-labs.org";
  const itemId = hotpayItemId || process.env.NEXT_PUBLIC_HOTPAY_ITEM_ID || "";
  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL || ""}/api/hotpay/webhook`;
  const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL || ""}/payment/status?memo=${memo}`;

  const params = new URLSearchParams({
    item_id: itemId,
    amount: amount.toString(),
    memo,
    webhook_url: webhookUrl,
    redirect_url: redirectUrl,
  });

  return `${baseUrl}/payment?${params.toString()}`;
}
