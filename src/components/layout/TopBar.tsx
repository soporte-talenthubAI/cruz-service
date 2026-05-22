"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { User, KeyRound, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";
import { Logo } from "@/components/ui/Logo";

interface TopBarProps {
  bolicheName?: string;
  userName: string;
  userRole?: "admin" | "rrpp" | "portero";
  userAvatar?: string | null;
  notificationCount?: number;
}

export function TopBar({
  userName,
  userRole = "rrpp",
  userAvatar,
  notificationCount = 0,
}: TopBarProps) {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  return (
    <header
      className={cn(
        "fixed top-0 right-0 left-0 lg:left-64 z-40 transition-all duration-200",
        scrolled
          ? "bg-[#0d0d0d]/90 backdrop-blur-[16px] border-b border-[rgba(235,241,226,0.06)]"
          : "bg-transparent border-b border-transparent"
      )}
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="flex items-center justify-between h-14 px-4 sm:px-6 lg:px-8 xl:px-12">
        {/* Mobile: logo */}
        <div className="lg:hidden flex items-center">
          <Logo variant="cream" size="sm" priority />
        </div>
        {/* Desktop spacer */}
        <span className="hidden lg:block" />

        <div className="flex items-center gap-3 min-w-0" ref={menuRef}>
          <span className="hidden sm:block text-sm text-[#b8bdac] tracking-tight truncate max-w-[180px]">
            {userName}
          </span>
          <div className="relative">
            <button
              onClick={() => setMenuOpen((prev) => !prev)}
              className="relative focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e3fd8c]/50 rounded-full"
            >
              <Avatar name={userName} src={userAvatar} size="sm" role={userRole} />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#cf3a4a] text-[10px] font-bold text-white">
                  {notificationCount > 9 ? "9+" : notificationCount}
                </span>
              )}
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 rounded-[12px] bg-[#1a1a1a] border border-[rgba(235,241,226,0.1)] shadow-[0_18px_48px_rgba(0,0,0,0.5)] overflow-hidden animate-fade-in z-50">
                <div className="px-4 py-3 border-b border-[rgba(235,241,226,0.06)]">
                  <p className="text-sm font-semibold text-[#ebf1e2] truncate tracking-tight">
                    {userName}
                  </p>
                  <p className="text-[10px] uppercase tracking-[0.14em] text-[#7a7e72] mt-0.5">
                    {userRole}
                  </p>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      router.push("/perfil");
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#b8bdac] hover:bg-[#232323] hover:text-[#ebf1e2] transition-colors text-left"
                  >
                    <User size={16} className="text-[#7a7e72]" />
                    Mi cuenta
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      router.push("/perfil?tab=password");
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#b8bdac] hover:bg-[#232323] hover:text-[#ebf1e2] transition-colors text-left"
                  >
                    <KeyRound size={16} className="text-[#7a7e72]" />
                    Cambiar contraseña
                  </button>
                </div>

                <div className="border-t border-[rgba(235,241,226,0.06)] py-1">
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      signOut({ callbackUrl: "/login" });
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#cf3a4a] hover:bg-[rgba(207,58,74,0.08)] transition-colors text-left"
                  >
                    <LogOut size={16} />
                    Cerrar sesión
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
