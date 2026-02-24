"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Spinner } from "./Spinner";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none active:scale-95 disabled:active:scale-100",
  {
    variants: {
      variant: {
        gold: "gold-gradient text-dark-900 font-semibold hover:shadow-gold-lg",
        ghost:
          "border border-gold-500/30 text-gold-500 bg-transparent hover:bg-gold-500/10 hover:border-gold-500/60",
        danger:
          "bg-gradient-to-r from-red-600 to-red-500 text-white font-semibold hover:shadow-[0_0_20px_rgba(239,68,68,0.3)]",
        surface:
          "bg-surface-2 text-dark-100 hover:bg-surface-3 border border-[rgba(255,255,255,0.06)]",
      },
      size: {
        sm: "h-9 px-3 text-sm rounded-lg",
        md: "h-11 px-5 text-base rounded-[--radius-button]",
        lg: "h-[52px] px-7 text-lg rounded-[--radius-button]",
        icon: "h-11 w-11 rounded-[--radius-button]",
      },
    },
    defaultVariants: {
      variant: "gold",
      size: "md",
    },
  }
);

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      loading,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <Spinner size="sm" className={variant === "gold" ? "text-dark-900" : "text-gold-500"} />
        ) : (
          leftIcon
        )}
        {children}
        {!loading && rightIcon}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
