"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Spinner } from "./Spinner";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-medium tracking-tight transition-all duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none active:scale-[0.98] disabled:active:scale-100",
  {
    variants: {
      variant: {
        // primary — lime sobre dark (CTA principal)
        gold: "bg-[#e3fd8c] text-[#0d0d0d] border border-[#c9eb5d] hover:bg-[#c9eb5d] hover:shadow-[0_6px_22px_rgba(227,253,140,0.22)]",
        // ghost — outline cream
        ghost:
          "border border-[rgba(235,241,226,0.2)] text-[#ebf1e2] bg-transparent hover:bg-[rgba(235,241,226,0.05)] hover:border-[rgba(235,241,226,0.4)]",
        // danger
        danger:
          "bg-[#cf3a4a] text-white border border-[#cf3a4a] hover:bg-[#b62f3d] hover:shadow-[0_6px_22px_rgba(207,58,74,0.25)]",
        // surface — superficie oscura neutra
        surface:
          "bg-[#1a1a1a] text-[#ebf1e2] hover:bg-[#232323] border border-[rgba(235,241,226,0.08)]",
        // accent (alias de gold)
        accent:
          "bg-[#e3fd8c] text-[#0d0d0d] border border-[#c9eb5d] hover:bg-[#c9eb5d]",
      },
      size: {
        sm: "h-9 px-3 text-sm rounded-lg",
        md: "h-11 px-5 text-base rounded-[10px]",
        lg: "h-[52px] px-7 text-base rounded-[10px]",
        icon: "h-11 w-11 rounded-[10px]",
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
          <Spinner
            size="sm"
            className={
              variant === "gold" || variant === "accent"
                ? "text-[#0d0d0d]"
                : variant === "danger"
                ? "text-white"
                : "text-[#ebf1e2]"
            }
          />
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
