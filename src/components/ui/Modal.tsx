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
      <div
        className="absolute inset-0 bg-[#0d0d0d]/75 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      <div
        className={cn(
          "relative z-10 w-full sm:max-w-lg bg-[#1a1a1a] border border-[rgba(235,241,226,0.1)] animate-slide-up",
          "rounded-t-[20px] sm:rounded-[14px]",
          "max-h-[90dvh] overflow-y-auto shadow-[0_30px_80px_rgba(0,0,0,0.7)]",
          className
        )}
      >
        <div className="flex items-center justify-between p-5 pb-0">
          {title && (
            <h2 className="text-lg font-bold tracking-tight text-[#ebf1e2]">
              {title}
            </h2>
          )}
          <button
            onClick={onClose}
            className="ml-auto flex h-9 w-9 items-center justify-center rounded-full bg-[#232323] text-[#9a9f93] hover:text-[#ebf1e2] hover:bg-[#2e2e2e] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
