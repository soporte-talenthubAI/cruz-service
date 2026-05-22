"use client";

import { type HTMLAttributes, forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const cardVariants = cva("p-5 transition-all duration-200", {
  variants: {
    variant: {
      default: "glass-card",
      elevated: "glass-card shadow-[0_10px_30px_rgba(0,0,0,0.5)]",
      bordered: "glass-card border-[rgba(235,241,226,0.18)]",
      flat: "bg-[#1a1a1a] rounded-[14px] border border-[rgba(235,241,226,0.06)]",
      muted: "bg-[#141414] rounded-[14px] border border-[rgba(235,241,226,0.05)]",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

interface CardProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, onClick, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          cardVariants({ variant }),
          onClick && "cursor-pointer hover:border-[rgba(235,241,226,0.18)] hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)]",
          className
        )}
        onClick={onClick}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";

export { Card, cardVariants };
