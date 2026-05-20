"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Mail, ArrowLeft, MessageSquare, Check } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

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
    <div className="relative flex min-h-[100dvh] flex-col items-center justify-center px-6 overflow-hidden">
      <Image
        src="/images/fondo_app.png"
        alt=""
        fill
        priority
        className="object-cover"
        quality={90}
      />
      <div className="absolute inset-0 bg-black/60" />

      <div className="relative z-10 flex w-full max-w-sm lg:max-w-md flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-1">
          <h1 className="text-4xl font-bold tracking-[0.3em] gold-text">CRUZ</h1>
          <p className="text-xs text-dark-300 tracking-[0.25em] uppercase">Espacio</p>
        </div>

        <div className="glass-card w-full p-6 animate-slide-up">
          {sent ? (
            <div className="flex flex-col items-center gap-4 text-center py-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success/15">
                <Check size={28} className="text-success" />
              </div>
              <h2 className="text-lg font-semibold text-dark-50">Solicitud enviada</h2>
              <p className="text-sm text-dark-400">
                Notificamos al administrador. Te van a contactar para entregarte tu nueva contraseña.
              </p>
              <Link
                href="/login"
                className="text-sm text-gold-500 hover:text-gold-400 transition-colors mt-2"
              >
                Volver al login
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-dark-50 mb-2">
                ¿Olvidaste tu contraseña?
              </h2>
              <p className="text-sm text-dark-400 mb-6">
                Ingresá tu email y el administrador te asignará una nueva.
              </p>

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

                <div>
                  <label className="text-sm text-dark-300 mb-2 block">
                    Nota (opcional)
                  </label>
                  <div className="relative">
                    <MessageSquare
                      size={16}
                      className="absolute left-3 top-3 text-dark-500 pointer-events-none"
                    />
                    <textarea
                      value={nota}
                      onChange={(e) => setNota(e.target.value)}
                      placeholder="Ej: olvidé mi contraseña, no puedo entrar..."
                      maxLength={280}
                      rows={3}
                      className="w-full bg-surface-2 text-dark-200 text-sm rounded-xl pl-9 pr-3 py-2.5 border border-[rgba(255,255,255,0.06)] outline-none focus:border-gold-500/40 transition-colors resize-none"
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

              <div className="mt-4 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-sm text-dark-400 hover:text-dark-200 transition-colors"
                >
                  <ArrowLeft size={14} />
                  Volver al login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
