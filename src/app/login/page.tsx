"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, getSession } from "next-auth/react";
import Link from "next/link";
import { Mail } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Email o contraseña incorrectos");
      setLoading(false);
      return;
    }

    const session = await getSession();
    const role = (session?.user as { role?: string })?.role?.toLowerCase();
    const redirectPath = role === "rrpp" ? "/inicio" : "/dashboard";
    router.push(redirectPath);
    router.refresh();
  };

  return (
    <div className="relative flex min-h-[100dvh] flex-col bg-[#0d0d0d] overflow-hidden">
      {/* Subtle halo */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(60% 50% at 50% 0%, rgba(227,253,140,0.08) 0%, rgba(13,13,13,0) 60%)",
        }}
      />
      {/* Grain (very subtle) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.025] mix-blend-overlay"
        style={{
          backgroundImage:
            "radial-gradient(rgba(235,241,226,0.5) 1px, transparent 1px)",
          backgroundSize: "3px 3px",
        }}
      />

      {/* Header (logo) */}
      <header className="relative z-10 flex items-center justify-center pt-12 pb-4 lg:pt-16">
        <Logo variant="cream" size="xl" priority />
      </header>

      {/* Main */}
      <main className="relative z-10 flex flex-1 items-center justify-center px-6 pb-10">
        <div className="w-full max-w-sm flex flex-col gap-8 animate-slide-up">
          {/* Heading */}
          <div className="flex flex-col gap-2 text-center">
            <h1 className="text-[28px] leading-tight font-bold tracking-[-0.03em] text-[#ebf1e2]">
              Bienvenido de nuevo
            </h1>
            <p className="text-sm text-[#9a9f93]">
              Ingresá tus credenciales para continuar
            </p>
          </div>

          {/* Card */}
          <div className="glass-card p-6 flex flex-col gap-5">
            {error && (
              <div className="rounded-[10px] bg-[rgba(207,58,74,0.08)] border border-[rgba(207,58,74,0.3)] p-3 text-sm text-[#e07385] animate-fade-in">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail size={18} />}
                autoComplete="email"
                required
              />

              <Input
                label="Contraseña"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />

              <Button
                type="submit"
                variant="gold"
                size="lg"
                loading={loading}
                className="w-full mt-1"
              >
                Ingresar
              </Button>
            </form>

            <div className="text-center">
              <Link
                href="/olvide-password"
                className="text-sm text-[#9a9f93] hover:text-[#ebf1e2] transition-colors underline-offset-4 hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.2em] text-[#5e6258]">
            <span>Ciclosuma</span>
            <span className="h-1 w-1 rounded-full bg-[#5e6258]" />
            <span>v1.0</span>
          </div>
        </div>
      </main>
    </div>
  );
}
