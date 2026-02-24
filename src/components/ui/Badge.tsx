"use client";

import { type HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "badge-status inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide",
  {
    variants: {
      variant: {
        pendiente: "bg-dark-600/50 text-dark-300 border border-dark-500/30",
        enviado: "bg-info/15 text-info border border-info/30",
        ingresado: "bg-success/15 text-success border border-success/30",
        invalidado: "bg-error/15 text-error border border-error/30",
        normal: "bg-dark-500/20 text-dark-300 border border-dark-500/30",
        especial:
          "bg-gold-500/15 text-gold-400 border border-gold-500/30 shadow-[0_0_12px_rgba(245,158,11,0.1)]",
      },
    },
    defaultVariants: {
      variant: "normal",
    },
  }
);

interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props}>
      {variant === "especial" && (
        <span className="h-1.5 w-1.5 rounded-full bg-gold-400 animate-pulse" />
      )}
      {children}
    </span>
  );
}
