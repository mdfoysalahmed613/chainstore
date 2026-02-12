import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // HOT Pay webhook payload per documentation:
    // { type, item_id, status, memo, amount, amount_float, amount_usd, near_trx }
    const { memo, status, near_trx } = body;

    if (!memo || !status) {
      return NextResponse.json(
        { error: "Missing required fields: memo and status" },
        { status: 400 },
      );
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

    const { error: updateError } = await supabase
      .from("purchases")
      .update({
        payment_status: paymentStatus,
        transaction_id: near_trx || null,
      })
      .eq("id", purchase.id);

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to update purchase" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      payment_status: paymentStatus,
      memo,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
