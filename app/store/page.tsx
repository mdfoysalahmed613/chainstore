import { createClient } from "@/lib/supabase/server";
import { TemplateCard } from "@/components/template-card";
import type { Template } from "@/lib/types";

export default async function StorePage() {
  const supabase = await createClient();
  const { data: templates } = await supabase
    .from("templates")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  const categories = [
    ...new Set((templates as Template[] | null)?.map((t) => t.category) ?? []),
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight">Templates</h1>
        <p className="mt-2 text-muted-foreground">
          Browse our collection of production-ready templates
        </p>
      </div>

      {categories.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-2">
          {categories.map((category) => (
            <span
              key={category}
              className="rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground"
            >
              {category}
            </span>
          ))}
        </div>
      )}

      {templates && templates.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {(templates as Template[]).map((template) => (
            <TemplateCard key={template.id} template={template} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed p-16 text-center">
          <p className="text-muted-foreground">No templates available yet. Check back soon!</p>
        </div>
      )}
    </div>
  );
}
