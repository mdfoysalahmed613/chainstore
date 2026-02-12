import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Extract payment details from HotPay webhook payload
    // Adjust these field names based on HotPay's actual webhook format
    const { order_id, status, transaction_id } = body;

    if (!order_id || !status) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Use service role key for webhook — no user session is available
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    // Map HotPay status to our payment status
    const paymentStatus =
      status === "completed" || status === "success" ? "completed" : "failed";

    // Update the purchase record
    await supabase
      .from("purchases")
      .update({
        payment_status: paymentStatus,
        transaction_id: transaction_id || null,
      })
      .eq("id", order_id);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
