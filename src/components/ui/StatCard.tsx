"use client";

import { type ReactNode } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  value: string | number;
  label: string;
  icon?: ReactNode;
  trend?: {
    value: number;
    positive: boolean;
  };
  className?: string;
}

export function StatCard({
  value,
  label,
  icon,
  trend,
  className,
}: StatCardProps) {
  return (
    <div className={cn("glass-card p-5 flex flex-col gap-3", className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm text-dark-400">{label}</span>
        {icon && (
          <div className="text-gold-500/60 [&>svg]:h-5 [&>svg]:w-5">
            {icon}
          </div>
        )}
      </div>
      <div className="flex items-end justify-between gap-2">
        <span className="text-3xl font-bold gold-text">{value}</span>
        {trend && (
          <div
            className={cn(
              "flex items-center gap-1 text-xs font-medium pb-1",
              trend.positive ? "text-success" : "text-error"
            )}
          >
            {trend.positive ? (
              <TrendingUp size={14} />
            ) : (
              <TrendingDown size={14} />
            )}
            <span>{Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>
    </div>
  );
}
