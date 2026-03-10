"use client";

import { type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { BottomNav } from "./BottomNav";
import { TopBar } from "./TopBar";
import { Sidebar } from "./Sidebar";

type UserRole = "admin" | "rrpp" | "portero";

interface AppShellProps {
  children: ReactNode;
  role: UserRole;
  userName: string;
  userAvatar?: string | null;
  bolicheName?: string;
  notificationCount?: number;
  className?: string;
}

export function AppShell({
  children,
  role,
  userName,
  userAvatar,
  bolicheName,
  notificationCount,
  className,
}: AppShellProps) {
  const hasBottomNav = role !== "portero";

  return (
    <div className="min-h-[100dvh] bg-dark-900">
      {/* Desktop sidebar */}
      <Sidebar role={role} bolicheName={bolicheName} />

      <TopBar
        bolicheName={bolicheName}
        userName={userName}
        userRole={role}
        userAvatar={userAvatar}
        notificationCount={notificationCount}
      />

      <main
        className={cn(
          "pt-14 px-4 lg:pl-64 lg:px-8 xl:px-12",
          "max-w-lg mx-auto lg:max-w-none lg:mx-0 lg:max-w-[calc(100%-240px)]",
          hasBottomNav ? "pb-24 lg:pb-8" : "pb-6",
          className
        )}
        style={{
          paddingTop: "calc(56px + env(safe-area-inset-top))",
          paddingBottom: hasBottomNav
            ? "calc(96px + env(safe-area-inset-bottom))"
            : undefined,
        }}
      >
        <div className="lg:max-w-5xl">
          {children}
        </div>
      </main>

      {hasBottomNav && <BottomNav role={role} />}
    </div>
  );
}
