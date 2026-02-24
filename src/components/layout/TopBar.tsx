"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";

interface TopBarProps {
  bolicheName?: string;
  userName: string;
  userRole?: "admin" | "rrpp" | "portero";
  userAvatar?: string | null;
  notificationCount?: number;
}

export function TopBar({
  bolicheName = "CRUZ",
  userName,
  userRole = "rrpp",
  userAvatar,
  notificationCount = 0,
}: TopBarProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-40 transition-all duration-300",
        scrolled
          ? "bg-surface-1/80 backdrop-blur-[16px] border-b border-[rgba(255,255,255,0.06)]"
          : "bg-transparent"
      )}
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="flex items-center justify-between h-14 px-4 max-w-lg mx-auto">
        <span className="text-xl font-bold gold-text tracking-wider">
          {bolicheName}
        </span>

        <div className="flex items-center gap-3">
          <span className="hidden sm:block text-sm text-dark-300">
            {userName}
          </span>
          <div className="relative">
            <Avatar name={userName} src={userAvatar} size="sm" role={userRole} />
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-error text-[10px] font-bold text-white">
                {notificationCount > 9 ? "9+" : notificationCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
