"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

type LogoVariant = "dark" | "cream";
type LogoSize = "sm" | "md" | "lg" | "xl";

interface LogoProps {
  variant?: LogoVariant;
  size?: LogoSize;
  className?: string;
  priority?: boolean;
}

const sizeMap: Record<LogoSize, { width: number; height: number; className: string }> = {
  sm: { width: 160, height: 36, className: "h-6 w-auto" },
  md: { width: 240, height: 54, className: "h-8 w-auto" },
  lg: { width: 480, height: 108, className: "h-14 w-auto sm:h-16" },
  xl: { width: 800, height: 180, className: "h-28 w-auto sm:h-36 md:h-44" },
};

const srcMap: Record<LogoVariant, string> = {
  dark: "/images/logo-ciclosuma-dark.png",
  cream: "/images/logo-ciclosuma-cream.png",
};

export function Logo({
  variant = "dark",
  size = "md",
  className,
  priority = false,
}: LogoProps) {
  const dims = sizeMap[size];
  return (
    <Image
      src={srcMap[variant]}
      alt="Ciclosuma"
      width={dims.width}
      height={dims.height}
      priority={priority}
      className={cn(dims.className, "select-none", className)}
    />
  );
}
