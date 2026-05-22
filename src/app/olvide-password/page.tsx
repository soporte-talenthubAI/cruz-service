"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, MessageSquare, Check } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [nota, setNota] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/password-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, nota }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Error al registrar la solicitud");
        return;
      }

      setSent(true);
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-[100dvh] flex-col bg-[#0d0d0d] overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(60% 50% at 50% 0%, rgba(227,253,140,0.08) 0%, rgba(13,13,13,0) 60%)",
        }}
      />

      <header className="relative z-10 flex items-center justify-center pt-12 pb-4 lg:pt-16">
        <Logo variant="cream" size="xl" priority />
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-6 pb-10">
        <div className="w-full max-w-sm flex flex-col gap-8 animate-slide-up">
          <div className="glass-card p-6 flex flex-col gap-5">
            {sent ? (
              <div className="flex flex-col items-center gap-4 text-center py-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#e3fd8c]">
                  <Check size={28} className="text-[#0d0d0d]" />
                </div>
                <h2 className="text-lg font-bold tracking-tight text-[#ebf1e2]">
                  Solicitud enviada
                </h2>
                <p className="text-sm text-[#9a9f93]">
                  Notificamos al administrador. Te van a contactar para
                  entregarte tu nueva contraseña.
                </p>
                <Link
                  href="/login"
                  className="text-sm text-[#ebf1e2] hover:text-[#e3fd8c] transition-colors mt-2 underline-offset-4 hover:underline"
                >
                  Volver al login
                </Link>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-1">
                  <h2 className="text-xl font-bold tracking-tight text-[#ebf1e2]">
                    Olvidaste tu contraseña
                  </h2>
                  <p className="text-sm text-[#9a9f93]">
                    Ingresá tu email y el administrador te asignará una nueva.
                  </p>
                </div>

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

                  <div>
                    <label className="text-[11px] uppercase tracking-wide text-[#9a9f93] font-medium mb-2 block">
                      Nota (opcional)
                    </label>
                    <div className="relative">
                      <MessageSquare
                        size={16}
                        className="absolute left-3 top-3 text-[#7a7e72] pointer-events-none"
                      />
                      <textarea
                        value={nota}
                        onChange={(e) => setNota(e.target.value)}
                        placeholder="Ej: olvidé mi contraseña, no puedo entrar..."
                        maxLength={280}
                        rows={3}
                        className="w-full bg-[#1a1a1a] text-[#ebf1e2] text-sm rounded-[10px] pl-9 pr-3 py-2.5 border border-[rgba(235,241,226,0.1)] outline-none focus:border-[#e3fd8c] focus:shadow-[0_0_0_3px_rgba(227,253,140,0.15)] transition-all resize-none placeholder:text-[#6a6e64]"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    variant="gold"
                    size="lg"
                    loading={loading}
                    className="w-full"
                  >
                    Enviar solicitud
                  </Button>
                </form>

                <div className="text-center">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-1.5 text-sm text-[#9a9f93] hover:text-[#ebf1e2] transition-colors"
                  >
                    <ArrowLeft size={14} />
                    Volver al login
                  </Link>
                </div>
              </>
            )}
          </div>

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
