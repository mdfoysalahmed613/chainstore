"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, XCircle, Loader2 } from "lucide-react";

type PaymentState = "polling" | "completed" | "failed" | "not_found";

function PaymentStatusContent() {
  const searchParams = useSearchParams();
  const memo = searchParams.get("memo");
  const { user } = useAuth();
  const supabase = createClient();

  const [status, setStatus] = useState<PaymentState>("polling");
  const [templateName, setTemplateName] = useState<string>("");

  const checkStatus = useCallback(async () => {
    if (!memo || !user) return null;

    const { data } = await supabase
      .from("purchases")
      .select("payment_status, templates(name)")
      .eq("memo", memo)
      .eq("user_id", user.id)
      .single();

    if (!data) return "not_found";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const purchase = data as any;
    const name = purchase.templates?.name;
    if (name) {
      setTemplateName(name);
    }

    if (purchase.payment_status === "completed") return "completed";
    if (purchase.payment_status === "failed") return "failed";
    return "polling";
  }, [memo, user, supabase]);

  useEffect(() => {
    if (!memo || !user) return;

    let cancelled = false;
    let timeoutId: NodeJS.Timeout;

    async function poll() {
      const result = await checkStatus();
      if (cancelled) return;

      if (result && result !== "polling") {
        setStatus(result);
        return;
      }

      // Poll every 3 seconds
      timeoutId = setTimeout(poll, 3000);
    }

    poll();

    // Stop polling after 5 minutes
    const maxTimeout = setTimeout(() => {
      cancelled = true;
    }, 5 * 60 * 1000);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      clearTimeout(maxTimeout);
    };
  }, [memo, user, checkStatus]);

  if (!memo) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <XCircle className="mx-auto h-12 w-12 text-destructive" />
        <h1 className="mt-4 text-xl font-bold">Invalid Payment Link</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          No payment reference found. Please try purchasing again.
        </p>
        <Button className="mt-6" asChild>
          <Link href="/store">Back to Store</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      {status === "polling" && (
        <>
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
          <h1 className="mt-6 text-xl font-bold">Payment Pending</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Waiting for payment confirmation from the network.
            This may take a moment.
          </p>
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            Checking payment status...
          </div>
        </>
      )}

      {status === "completed" && (
        <>
          <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
          <h1 className="mt-6 text-xl font-bold">Payment Successful</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {templateName
              ? `Your purchase of "${templateName}" is confirmed.`
              : "Your payment has been confirmed."}
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Button asChild>
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/store">Continue Shopping</Link>
            </Button>
          </div>
        </>
      )}

      {status === "failed" && (
        <>
          <XCircle className="mx-auto h-12 w-12 text-destructive" />
          <h1 className="mt-6 text-xl font-bold">Payment Failed</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your payment could not be processed. Please try again.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Button asChild>
              <Link href="/store">Back to Store</Link>
            </Button>
          </div>
        </>
      )}

      {status === "not_found" && (
        <>
          <XCircle className="mx-auto h-12 w-12 text-muted-foreground" />
          <h1 className="mt-6 text-xl font-bold">Order Not Found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            We couldn&apos;t find this payment. It may have expired.
          </p>
          <Button className="mt-6" asChild>
            <Link href="/store">Back to Store</Link>
          </Button>
        </>
      )}
    </div>
  );
}

export default function PaymentStatusPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-lg px-4 py-20 text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
          <h1 className="mt-6 text-xl font-bold">Loading...</h1>
        </div>
      }
    >
      <PaymentStatusContent />
    </Suspense>
  );
}
