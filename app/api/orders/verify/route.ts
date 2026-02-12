import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const memo = request.nextUrl.searchParams.get("memo");

    if (!memo) {
      return NextResponse.json({ error: "memo is required" }, { status: 400 });
    }

    // Authenticate the user
    const supabaseAuth = await createServerClient();
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    // Check if already completed in our database
    const { data: purchase } = await supabase
      .from("purchases")
      .select("id, payment_status, transaction_id, templates(name)")
      .eq("memo", memo)
      .eq("user_id", user.id)
      .single();

    if (!purchase) {
      return NextResponse.json({ error: "order_not_found" }, { status: 404 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const templateName = (purchase as any).templates?.name || null;

    if (purchase.payment_status === "completed") {
      return NextResponse.json({
        payment_status: "completed",
        template_name: templateName,
      });
    }

    // Poll HOT Pay API to check payment status
    const apiToken = process.env.HOTPAY_API_TOKEN;
    if (!apiToken) {
      return NextResponse.json({
        payment_status: purchase.payment_status,
        template_name: templateName,
      });
    }

    const hotpayRes = await fetch(
      `https://api.hot-labs.org/partners/processed_payments?memo=${encodeURIComponent(memo)}&limit=1`,
      {
        headers: {
          Authorization: apiToken,
        },
      },
    );

    if (!hotpayRes.ok) {
      return NextResponse.json({
        payment_status: purchase.payment_status,
        template_name: templateName,
      });
    }

    const hotpayData = await hotpayRes.json();
    const payments = hotpayData.payments || [];

    if (payments.length === 0) {
      return NextResponse.json({
        payment_status: purchase.payment_status,
        template_name: templateName,
      });
    }

    const payment = payments[0];

    if (payment.status === "SUCCESS") {
      const { error: updateError } = await supabase
        .from("purchases")
        .update({
          payment_status: "completed",
          transaction_id: payment.near_trx || null,
        })
        .eq("id", purchase.id);

      if (updateError) {
        return NextResponse.json({
          payment_status: purchase.payment_status,
          template_name: templateName,
        });
      }

      return NextResponse.json({
        payment_status: "completed",
        template_name: templateName,
      });
    }

    if (payment.status === "FAILED") {
      await supabase
        .from("purchases")
        .update({
          payment_status: "failed",
          transaction_id: payment.near_trx || null,
        })
        .eq("id", purchase.id);

      return NextResponse.json({
        payment_status: "failed",
        template_name: templateName,
      });
    }

    return NextResponse.json({
      payment_status: purchase.payment_status,
      template_name: templateName,
    });
  } catch {
    return NextResponse.json(
      { error: "internal_server_error" },
      { status: 500 },
    );
  }
}
