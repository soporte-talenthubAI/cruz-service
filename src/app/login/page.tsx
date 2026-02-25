"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, getSession } from "next-auth/react";
import Link from "next/link";
import { Mail } from "lucide-react";
import Image from "next/image";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

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

    // Redirect based on role
    const session = await getSession();
    const role = (session?.user as { role?: string })?.role?.toLowerCase();
    const redirectPath = role === "rrpp" ? "/inicio" : "/dashboard";
    router.push(redirectPath);
    router.refresh();
  };

  return (
    <div className="relative flex min-h-[100dvh] flex-col items-center justify-center px-6 overflow-hidden">
      {/* Background image — CRUZ ESPACIO */}
      <Image
        src="/images/cruz_espacio.jpg"
        alt=""
        fill
        priority
        className="object-cover"
        quality={90}
      />
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Content */}
      <div className="relative z-10 flex w-full max-w-sm flex-col items-center gap-8">
        {/* Logo */}
        <div className="flex flex-col items-center gap-1">
          <h1 className="text-4xl font-bold tracking-[0.3em] gold-text">
            CRUZ
          </h1>
          <p className="text-xs text-dark-300 tracking-[0.25em] uppercase">
            Espacio
          </p>
        </div>

        {/* Login card */}
        <div className="glass-card w-full p-6 animate-slide-up">
          <h2 className="text-xl font-semibold text-dark-50 mb-6">
            Bienvenido
          </h2>

          {error && (
            <div className="mb-4 rounded-xl bg-error/10 border border-error/30 p-3 text-sm text-error animate-fade-in">
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
              className="w-full mt-2"
            >
              Ingresar
            </Button>
          </form>

          <div className="mt-4 text-center">
            <Link
              href="/olvide-password"
              className="text-sm text-gold-500/70 hover:text-gold-500 transition-colors"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
        </div>

        {/* Version */}
        <span className="text-xs text-dark-600">v1.0.0</span>
      </div>
    </div>
  );
}
