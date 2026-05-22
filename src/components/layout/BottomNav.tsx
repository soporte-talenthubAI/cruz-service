"use client";

import { type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  Ticket,
  ScanLine,
  UserCircle,
  Home,
  QrCode,
  ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";

type UserRole = "admin" | "rrpp" | "portero";

interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
  central?: boolean;
}

const navItems: Record<UserRole, NavItem[]> = {
  admin: [
    { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard size={20} /> },
    { href: "/eventos", label: "Eventos", icon: <Calendar size={20} /> },
    { href: "/nuevo-qr", label: "Nuevo QR", icon: <QrCode size={22} />, central: true },
    { href: "/publicas", label: "Entradas", icon: <Ticket size={20} /> },
    { href: "/perfil", label: "Perfil", icon: <UserCircle size={20} /> },
  ],
  rrpp: [
    { href: "/inicio", label: "Inicio", icon: <Home size={20} /> },
    { href: "/nuevo-qr", label: "Nuevo QR", icon: <QrCode size={22} />, central: true },
    { href: "/mis-qrs", label: "Mis QRs", icon: <Ticket size={20} /> },
    { href: "/perfil", label: "Perfil", icon: <UserCircle size={20} /> },
  ],
  portero: [
    { href: "/dashboard", label: "Panel", icon: <LayoutDashboard size={20} /> },
    { href: "/scanner", label: "Scanner", icon: <ScanLine size={22} />, central: true },
    { href: "/historial", label: "Historial", icon: <ClipboardList size={20} /> },
    { href: "/perfil", label: "Perfil", icon: <UserCircle size={20} /> },
  ],
};

interface BottomNavProps {
  role: UserRole;
}

export function BottomNav({ role }: BottomNavProps) {
  const pathname = usePathname();
  const items = navItems[role];

  if (!items.length) return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-[rgba(235,241,226,0.06)] bg-[#0d0d0d]/92 backdrop-blur-[16px] lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {items.map((item) => {
          const isActive = pathname === item.href;

          if (item.central) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative -mt-6 flex flex-col items-center"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#e3fd8c] text-[#0d0d0d] shadow-[0_8px_24px_rgba(227,253,140,0.25)] transition-transform duration-150 active:scale-90 border-4 border-[#0d0d0d]">
                  {item.icon}
                </div>
                <span className="mt-1 text-[10px] font-semibold tracking-tight text-[#ebf1e2]">
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-col items-center gap-1 py-2 px-3 min-w-[56px] transition-colors duration-150",
                isActive ? "text-[#ebf1e2]" : "text-[#7a7e72] hover:text-[#b8bdac]"
              )}
            >
              {item.icon}
              <span className="text-[10px] font-medium tracking-tight">
                {item.label}
              </span>
              {isActive && (
                <span className="absolute -top-px h-[3px] w-8 rounded-b bg-[#e3fd8c]" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
