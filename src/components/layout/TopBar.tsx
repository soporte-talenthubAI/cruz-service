"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { User, KeyRound, LogOut } from "lucide-react";
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

  // Close menu on outside click
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

        <div className="flex items-center gap-3" ref={menuRef}>
          <span className="hidden sm:block text-sm text-dark-300">
            {userName}
          </span>
          <div className="relative">
            <button
              onClick={() => setMenuOpen((prev) => !prev)}
              className="relative focus:outline-none"
            >
              <Avatar name={userName} src={userAvatar} size="sm" role={userRole} />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-error text-[10px] font-bold text-white">
                  {notificationCount > 9 ? "9+" : notificationCount}
                </span>
              )}
            </button>

            {/* Dropdown menu */}
            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-52 rounded-xl bg-surface-1 border border-[rgba(255,255,255,0.08)] shadow-xl overflow-hidden animate-fade-in z-50">
                {/* User info */}
                <div className="px-4 py-3 border-b border-[rgba(255,255,255,0.06)]">
                  <p className="text-sm font-medium text-dark-100 truncate">{userName}</p>
                  <p className="text-xs text-dark-500 capitalize">{userRole}</p>
                </div>

                {/* Menu items */}
                <div className="py-1">
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      router.push("/perfil");
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-dark-200 hover:bg-gold-500/10 transition-colors text-left"
                  >
                    <User size={16} className="text-dark-400" />
                    Mi cuenta
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      router.push("/perfil?tab=password");
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-dark-200 hover:bg-gold-500/10 transition-colors text-left"
                  >
                    <KeyRound size={16} className="text-dark-400" />
                    Cambiar contraseña
                  </button>
                </div>

                {/* Logout */}
                <div className="border-t border-[rgba(255,255,255,0.06)] py-1">
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      signOut({ callbackUrl: "/login" });
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-error hover:bg-error/10 transition-colors text-left"
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
