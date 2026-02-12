import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { Template } from "@/lib/types";
import Image from "next/image";

export function TemplateCard({ template }: { template: Template }) {

  return (
    <Link href={`/store/${template.slug}`} className="group block">
      <div className="overflow-hidden rounded-xl border bg-card transition-all duration-200 hover:shadow-md hover:border-primary/30">
        <div className="aspect-16/10 bg-muted/50 relative overflow-hidden">
          {template.preview_image_url ? (
            <Image
              src={template.preview_image_url}
              alt={template.name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              fill
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-linear-to-br from-primary/5 to-primary/10">
              <div className="text-center">
                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <span className="text-xl font-bold text-primary">
                    {template.name[0]}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{template.category}</p>
              </div>
            </div>
          )}
        </div>
        <div className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-sm leading-tight group-hover:text-primary transition-colors">
              {template.name}
            </h3>
            <span className="text-sm font-bold text-primary whitespace-nowrap">
              ${template.price}
            </span>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {template.description}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {template.tech_stack.slice(0, 3).map((tech) => (
              <Badge key={tech} variant="secondary" className="text-[10px] px-1.5 py-0">
                {tech}
              </Badge>
            ))}
            {template.tech_stack.length > 3 && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                +{template.tech_stack.length - 3}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
