"use client";

import { type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 py-16 px-6 text-center animate-fade-in",
        className
      )}
    >
      <div className="text-[#5e6258] [&>svg]:h-12 [&>svg]:w-12">{icon}</div>
      <div className="flex flex-col gap-1">
        <h3 className="text-lg font-bold tracking-tight text-[#ebf1e2]">
          {title}
        </h3>
        {description && (
          <p className="text-sm text-[#9a9f93] max-w-xs">{description}</p>
        )}
      </div>
      {actionLabel && onAction && (
        <Button variant="ghost" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
