"use client";

import { type ReactNode, useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
}

export function Modal({ open, onClose, title, children, className }: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) {
      document.addEventListener("keydown", handleEscape);
    }
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Content */}
      <div
        className={cn(
          "relative z-10 w-full sm:max-w-lg bg-surface-1 border border-[rgba(245,158,11,0.2)] animate-slide-up",
          "rounded-t-[20px] sm:rounded-[--radius-card]",
          "max-h-[90dvh] overflow-y-auto",
          className
        )}
      >
        {/* Header */}
        {(title || true) && (
          <div className="flex items-center justify-between p-5 pb-0">
            {title && (
              <h2 className="text-lg font-semibold text-dark-50">{title}</h2>
            )}
            <button
              onClick={onClose}
              className="ml-auto flex h-9 w-9 items-center justify-center rounded-full bg-surface-2 text-dark-400 hover:text-dark-100 hover:bg-surface-3 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Body */}
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
