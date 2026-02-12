import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // HOT Pay webhook payload fields per documentation
    const { memo, status, near_trx, sender_id, amount, item_id } = body;

    if (!memo || !status) {
      return NextResponse.json(
        { error: "Missing required fields: memo and status" },
        { status: 400 },
      );
    }

    // Validate authorization header if HOTPAY_API_TOKEN is configured
    const apiToken = process.env.HOTPAY_API_TOKEN;
    if (apiToken) {
      const authHeader = request.headers.get("authorization");
      if (authHeader !== apiToken) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    // Use service role key — no user session available in webhooks
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    // Look up the order by memo (single source of truth)
    const { data: purchase, error: lookupError } = await supabase
      .from("purchases")
      .select("id, payment_status")
      .eq("memo", memo)
      .single();

    if (lookupError || !purchase) {
      return NextResponse.json(
        { error: "Order not found for memo" },
        { status: 404 },
      );
    }

    // Idempotency: if already completed, do not process again
    if (purchase.payment_status === "completed") {
      return NextResponse.json({ success: true, message: "Already processed" });
    }

    // Only mark as completed when HOT Pay status is SUCCESS
    const paymentStatus = status === "SUCCESS" ? "completed" : "failed";

    // Build transaction ID from NEAR transaction hash
    const transactionId = near_trx || null;

    await supabase
      .from("purchases")
      .update({
        payment_status: paymentStatus,
        transaction_id: transactionId,
      })
      .eq("id", purchase.id);

    return NextResponse.json({
      success: true,
      payment_status: paymentStatus,
      memo,
      sender_id: sender_id || null,
      amount: amount || null,
      item_id: item_id || null,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
