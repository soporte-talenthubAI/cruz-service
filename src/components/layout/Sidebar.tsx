"use client";

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
  DollarSign,
  UsersRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { type ReactNode } from "react";

type UserRole = "admin" | "rrpp" | "portero";

interface SidebarNavItem {
  href: string;
  label: string;
  icon: ReactNode;
  central?: boolean;
}

const sidebarItems: Record<UserRole, SidebarNavItem[]> = {
  admin: [
    { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard size={20} /> },
    { href: "/eventos", label: "Eventos", icon: <Calendar size={20} /> },
    { href: "/nuevo-qr", label: "Nuevo QR", icon: <QrCode size={20} />, central: true },
    { href: "/publicas", label: "Entradas", icon: <Ticket size={20} /> },
    { href: "/usuarios", label: "Usuarios", icon: <UsersRound size={20} /> },
    { href: "/liquidaciones", label: "Liquidaciones", icon: <DollarSign size={20} /> },
    { href: "/perfil", label: "Mi cuenta", icon: <UserCircle size={20} /> },
  ],
  rrpp: [
    { href: "/inicio", label: "Inicio", icon: <Home size={20} /> },
    { href: "/nuevo-qr", label: "Nuevo QR", icon: <QrCode size={20} />, central: true },
    { href: "/mis-qrs", label: "Mis QRs", icon: <Ticket size={20} /> },
    { href: "/perfil", label: "Mi cuenta", icon: <UserCircle size={20} /> },
  ],
  portero: [
    { href: "/dashboard", label: "Panel", icon: <LayoutDashboard size={20} /> },
    { href: "/scanner", label: "Scanner", icon: <ScanLine size={20} />, central: true },
    { href: "/historial", label: "Historial", icon: <ClipboardList size={20} /> },
    { href: "/perfil", label: "Mi cuenta", icon: <UserCircle size={20} /> },
  ],
};

interface SidebarProps {
  role: UserRole;
  bolicheName?: string;
}

export function Sidebar({ role, bolicheName = "CRUZ" }: SidebarProps) {
  const pathname = usePathname();
  const items = sidebarItems[role];

  return (
    <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 z-50 w-60 flex-col bg-surface-1 border-r border-[rgba(255,255,255,0.06)]">
      {/* Brand */}
      <div className="flex items-center h-14 px-6 border-b border-[rgba(255,255,255,0.06)]">
        <span className="text-xl font-bold gold-text tracking-wider">
          {bolicheName}
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {items.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href + "/"));

          if (item.central) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 my-2 rounded-xl gold-gradient text-dark-900 font-semibold text-sm shadow-gold-lg transition-transform active:scale-95"
              >
                {item.icon}
                {item.label}
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                isActive
                  ? "bg-gold-500/15 text-gold-500"
                  : "text-dark-400 hover:text-dark-200 hover:bg-white/5"
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-[rgba(255,255,255,0.06)]">
        <p className="text-[10px] text-dark-600 text-center">
          {bolicheName} &middot; Sistema de gestión
        </p>
      </div>
    </aside>
  );
}
