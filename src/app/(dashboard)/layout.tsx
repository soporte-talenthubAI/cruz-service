"use client";

import { type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { AppShell } from "@/components/layout/AppShell";
import { Spinner } from "@/components/ui/Spinner";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      router.replace("/login");
    },
  });

  if (status === "loading") {
    return <Spinner fullscreen />;
  }

  if (!session?.user) {
    return null;
  }

  const role = (session.user as { role: string }).role?.toLowerCase() as
    | "admin"
    | "rrpp"
    | "portero";

  return (
    <AppShell
      role={role}
      userName={session.user.name || "Usuario"}
      userAvatar={session.user.image}
    >
      {children}
    </AppShell>
  );
}
