"use client";

import { type HTMLAttributes, forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const cardVariants = cva("p-5 transition-all duration-200", {
  variants: {
    variant: {
      default: "glass-card",
      elevated: "glass-card shadow-gold",
      bordered: "glass-card border-[rgba(245,158,11,0.5)]",
      flat: "bg-surface-1 rounded-[--radius-card]",
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
          onClick && "cursor-pointer hover:border-[rgba(245,158,11,0.6)]",
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
