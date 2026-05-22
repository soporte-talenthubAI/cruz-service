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
  Armchair,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { type ReactNode } from "react";
import { Logo } from "@/components/ui/Logo";

type UserRole = "admin" | "rrpp" | "portero";

interface SidebarNavItem {
  href: string;
  label: string;
  icon: ReactNode;
  central?: boolean;
}

const sidebarItems: Record<UserRole, SidebarNavItem[]> = {
  admin: [
    { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
    { href: "/eventos", label: "Eventos", icon: <Calendar size={18} /> },
    { href: "/nuevo-qr", label: "Nuevo QR", icon: <QrCode size={18} />, central: true },
    { href: "/publicas", label: "Entradas", icon: <Ticket size={18} /> },
    { href: "/usuarios", label: "Usuarios", icon: <UsersRound size={18} /> },
    { href: "/liquidaciones", label: "Liquidaciones", icon: <DollarSign size={18} /> },
    { href: "/reservas", label: "Reservas", icon: <Armchair size={18} /> },
    { href: "/perfil", label: "Mi cuenta", icon: <UserCircle size={18} /> },
  ],
  rrpp: [
    { href: "/inicio", label: "Inicio", icon: <Home size={18} /> },
    { href: "/nuevo-qr", label: "Nuevo QR", icon: <QrCode size={18} />, central: true },
    { href: "/mis-qrs", label: "Mis QRs", icon: <Ticket size={18} /> },
    { href: "/perfil", label: "Mi cuenta", icon: <UserCircle size={18} /> },
  ],
  portero: [
    { href: "/dashboard", label: "Panel", icon: <LayoutDashboard size={18} /> },
    { href: "/scanner", label: "Scanner", icon: <ScanLine size={18} />, central: true },
    { href: "/historial", label: "Historial", icon: <ClipboardList size={18} /> },
    { href: "/perfil", label: "Mi cuenta", icon: <UserCircle size={18} /> },
  ],
};

interface SidebarProps {
  role: UserRole;
  bolicheName?: string;
}

export function Sidebar({ role, bolicheName }: SidebarProps) {
  const pathname = usePathname();
  const items = sidebarItems[role];

  return (
    <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 z-50 w-64 flex-col bg-[#0d0d0d] border-r border-[rgba(235,241,226,0.06)]">
      {/* Brand */}
      <div className="flex items-center justify-center h-20 px-5 border-b border-[rgba(235,241,226,0.06)]">
        <Logo variant="cream" size="lg" priority className="!h-10" />
      </div>

      {/* Boliche label */}
      {bolicheName && (
        <div className="px-6 pt-4 pb-2">
          <span className="text-[10px] uppercase tracking-[0.18em] text-[#7a7e72] font-medium">
            {bolicheName}
          </span>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 py-2 px-3 space-y-0.5 overflow-y-auto">
        {items.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href + "/"));

          if (item.central) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 my-2 rounded-[10px] bg-[#e3fd8c] text-[#0d0d0d] font-semibold text-sm tracking-tight transition-all hover:bg-[#c9eb5d] active:scale-[0.98] shadow-[0_6px_18px_rgba(227,253,140,0.18)]"
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
                "relative flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-sm font-medium tracking-tight transition-colors",
                isActive
                  ? "bg-[#1a1a1a] text-[#ebf1e2]"
                  : "text-[#9a9f93] hover:text-[#ebf1e2] hover:bg-[#161616]"
              )}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r bg-[#e3fd8c]" />
              )}
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-[rgba(235,241,226,0.06)]">
        <p className="text-[10px] text-[#5e6258] tracking-wide uppercase">
          v1.0
        </p>
      </div>
    </aside>
  );
}
