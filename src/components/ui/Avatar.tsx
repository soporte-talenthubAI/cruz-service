"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const avatarVariants = cva(
  "relative inline-flex items-center justify-center rounded-full overflow-hidden shrink-0 font-semibold",
  {
    variants: {
      size: {
        sm: "h-8 w-8 text-xs",
        md: "h-10 w-10 text-sm",
        lg: "h-14 w-14 text-lg",
      },
      role: {
        admin: "gold-gradient text-dark-900",
        rrpp: "bg-surface-2 text-dark-200",
        portero: "bg-surface-2 text-dark-200",
      },
    },
    defaultVariants: {
      size: "md",
      role: "rrpp",
    },
  }
);

interface AvatarProps extends VariantProps<typeof avatarVariants> {
  name: string;
  src?: string | null;
  className?: string;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function Avatar({ name, src, size, role, className }: AvatarProps) {
  return (
    <div className={cn(avatarVariants({ size, role }), className)}>
      {src ? (
        <img
          src={src}
          alt={name}
          className="h-full w-full object-cover"
        />
      ) : (
        <span>{getInitials(name)}</span>
      )}
    </div>
  );
}
