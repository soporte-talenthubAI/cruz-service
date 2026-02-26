"use client";

import { type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  Users,
  ScanLine,
  UserCircle,
  Home,
  QrCode,
  Ticket,
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
    { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard size={22} /> },
    { href: "/eventos", label: "Eventos", icon: <Calendar size={22} /> },
    { href: "/nuevo-qr", label: "Nuevo QR", icon: <QrCode size={22} />, central: true },
    { href: "/publicas", label: "Publicas", icon: <Users size={22} /> },
    { href: "/perfil", label: "Perfil", icon: <UserCircle size={22} /> },
  ],
  rrpp: [
    { href: "/inicio", label: "Inicio", icon: <Home size={22} /> },
    { href: "/nuevo-qr", label: "Nuevo QR", icon: <QrCode size={22} />, central: true },
    { href: "/mis-qrs", label: "Mis QRs", icon: <Ticket size={22} /> },
    { href: "/perfil", label: "Perfil", icon: <UserCircle size={22} /> },
  ],
  portero: [
    { href: "/dashboard", label: "Panel", icon: <LayoutDashboard size={22} /> },
    { href: "/scanner", label: "Scanner", icon: <ScanLine size={22} />, central: true },
    { href: "/historial", label: "Historial", icon: <ClipboardList size={22} /> },
    { href: "/perfil", label: "Perfil", icon: <UserCircle size={22} /> },
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
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-gold-500/15 bg-surface-1/90 backdrop-blur-[16px]"
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
                <div className="flex h-14 w-14 items-center justify-center rounded-full gold-gradient shadow-gold-lg text-dark-900 transition-transform duration-200 active:scale-90">
                  {item.icon}
                </div>
                <span className="mt-1 text-[10px] font-medium text-gold-500">
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
                "flex flex-col items-center gap-1 py-2 px-3 min-w-[56px] transition-colors duration-200",
                isActive ? "text-gold-500" : "text-dark-400"
              )}
            >
              {item.icon}
              <span className="text-[10px] font-medium">{item.label}</span>
              {isActive && (
                <span className="absolute bottom-1 h-1 w-1 rounded-full bg-gold-500" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
