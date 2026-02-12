"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { Template } from "@/lib/types";
import { ArrowLeft, Check, ExternalLink, ShoppingCart } from "lucide-react";
import Image from "next/image";

export default function TemplateDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { user } = useAuth();
  const supabase = createClient();

  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchased, setPurchased] = useState(false);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("templates")
        .select("*")
        .eq("slug", slug)
        .eq("is_active", true)
        .single();

      setTemplate(data as Template | null);

      if (data && user) {
        const { data: purchase } = await supabase
          .from("purchases")
          .select("id")
          .eq("user_id", user.id)
          .eq("template_id", data.id)
          .eq("payment_status", "completed")
          .single();

        setPurchased(!!purchase);
      }

      setLoading(false);
    }

    load();
  }, [slug, user, supabase]);

  async function handleBuy() {
    if (!user) {
      window.location.href = "/auth/login";
      return;
    }

    if (!template) return;

    setPurchasing(true);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template_id: template.id }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === "already_purchased") {
          setPurchased(true);
          setPurchasing(false);
          return;
        }
        setPurchasing(false);
        return;
      }

      // Redirect to HOT Pay payment page
      window.location.href = data.payment_url;
    } catch {
      setPurchasing(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="animate-pulse space-y-8">
          <div className="h-6 w-32 rounded bg-muted" />
          <div className="grid gap-10 lg:grid-cols-2">
            <div className="aspect-16/10 rounded-xl bg-muted" />
            <div className="space-y-4">
              <div className="h-8 w-48 rounded bg-muted" />
              <div className="h-4 w-full rounded bg-muted" />
              <div className="h-4 w-3/4 rounded bg-muted" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 text-center">
        <h1 className="text-2xl font-bold">Template not found</h1>
        <p className="mt-2 text-muted-foreground">
          The template you&apos;re looking for doesn&apos;t exist.
        </p>
        <Button className="mt-6" asChild>
          <Link href="/store">Back to Store</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <Button variant="ghost" size="sm" asChild className="mb-8">
        <Link href="/store" className="gap-1">
          <ArrowLeft className="h-3 w-3" />
          Back to Templates
        </Link>
      </Button>

      <div className="grid gap-10 lg:grid-cols-5">
        {/* Preview */}
        <div className="lg:col-span-3">
          <div className="aspect-16/10 overflow-hidden rounded-xl border bg-muted/50">
            {template.preview_image_url ? (
              <Image
                src={template.preview_image_url}
                alt={template.name}
                className="h-full w-full object-cover"
                width={640}
                height={400}
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-linear-to-br from-primary/5 to-primary/10">
                <div className="text-center">
                  <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                    <span className="text-2xl font-bold text-primary">
                      {template.name[0]}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{template.category}</p>
                </div>
              </div>
            )}
          </div>

          {/* Long description */}
          <div className="mt-8">
            <h2 className="text-lg font-semibold">About this template</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {template.long_description || template.description}
            </p>
          </div>

          {/* Features */}
          {template.features.length > 0 && (
            <div className="mt-8">
              <h2 className="text-lg font-semibold">Features</h2>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {template.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 shrink-0 text-primary" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-2">
          <div className="sticky top-24 rounded-xl border bg-card p-6 shadow-sm">
            <Badge variant="secondary" className="mb-3">
              {template.category}
            </Badge>
            <h1 className="text-2xl font-bold">{template.name}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{template.description}</p>

            <Separator className="my-5" />

            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-primary">${template.price}</span>
              <span className="text-sm text-muted-foreground">USD</span>
            </div>

            <div className="mt-5 space-y-2">
              {purchased ? (
                <Button className="w-full" asChild>
                  <Link href="/dashboard">Go to Dashboard</Link>
                </Button>
              ) : (
                <Button className="w-full gap-2" onClick={handleBuy} disabled={purchasing}>
                  <ShoppingCart className="h-4 w-4" />
                  {purchasing ? "Processing..." : "Buy with Crypto"}
                </Button>
              )}

              {template.demo_url && (
                <Button variant="outline" className="w-full gap-2" asChild>
                  <a href={template.demo_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                    Live Preview
                  </a>
                </Button>
              )}
            </div>

            <Separator className="my-5" />

            {/* Tech stack */}
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                Tech Stack
              </p>
              <div className="flex flex-wrap gap-1.5">
                {template.tech_stack.map((tech) => (
                  <Badge key={tech} variant="secondary" className="text-xs">
                    {tech}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
