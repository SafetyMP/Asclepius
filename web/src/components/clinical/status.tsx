import type { ReactNode } from "react";
import { AlertTriangle, Circle, Square, Triangle } from "lucide-react";

import { cn } from "@/lib/utils";

type ClinicalStatusVariant = "success" | "warning" | "critical" | "neutral";

type Props = {
  variant: ClinicalStatusVariant;
  children: React.ReactNode;
  className?: string;
};

const config: Record<
  ClinicalStatusVariant,
  { icon: typeof Circle; label: string; classes: string }
> = {
  success: {
    icon: Circle,
    label: "Normal",
    classes: "border-success/40 bg-success-muted text-foreground",
  },
  warning: {
    icon: Triangle,
    label: "Attention",
    classes: "border-warning/40 bg-warning-muted text-foreground",
  },
  critical: {
    icon: Square,
    label: "Critical",
    classes: "border-destructive/50 bg-destructive/10 text-foreground",
  },
  neutral: {
    icon: Circle,
    label: "Info",
    classes: "border-border bg-muted text-muted-foreground",
  },
};

export function ClinicalStatus({ variant, children, className }: Props) {
  const { icon: Icon, label, classes } = config[variant];
  return (
    <span
      className={cn(
        "inline-flex min-h-11 items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold",
        classes,
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
      <span className="sr-only">{label}:</span>
      {children}
    </span>
  );
}

export function ReferenceBanner({ title, children }: { title: string; children: ReactNode }) {
  return (
    <aside
      role="note"
      aria-label={title}
      className="flex gap-3 rounded-lg border-2 border-destructive/40 bg-destructive/10 p-4 text-sm leading-relaxed text-foreground"
    >
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" aria-hidden />
      <div>
        <p className="font-semibold">{title}</p>
        <p className="mt-1 text-muted-foreground">{children}</p>
      </div>
    </aside>
  );
}
