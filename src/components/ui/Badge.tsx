"use client";

import { type HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "badge-status inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide uppercase",
  {
    variants: {
      variant: {
        pendiente: "bg-[rgba(235,241,226,0.06)] text-[#9a9f93] border border-[rgba(235,241,226,0.1)]",
        enviado: "bg-[rgba(91,109,216,0.12)] text-[#8a99e8] border border-[rgba(91,109,216,0.32)]",
        ingresado: "bg-[rgba(168,217,102,0.12)] text-[#a8d966] border border-[rgba(168,217,102,0.32)]",
        invalidado: "bg-[rgba(207,58,74,0.12)] text-[#e07385] border border-[rgba(207,58,74,0.32)]",
        normal: "bg-[rgba(235,241,226,0.05)] text-[#b8bdac] border border-[rgba(235,241,226,0.08)]",
        especial:
          "bg-[#e3fd8c] text-[#0d0d0d] border border-[#c9eb5d]",
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
        <span className="h-1.5 w-1.5 rounded-full bg-[#0d0d0d]" />
      )}
      {children}
    </span>
  );
}
