"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Check } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al restablecer la contraseña");
        return;
      }

      setSuccess(true);
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="glass-card w-full p-6 text-center flex flex-col gap-3">
        <h2 className="text-lg font-bold tracking-tight text-[#ebf1e2]">
          Enlace inválido
        </h2>
        <p className="text-sm text-[#9a9f93]">
          Este enlace no es válido. Solicitá uno nuevo.
        </p>
        <Link
          href="/olvide-password"
          className="text-sm text-[#ebf1e2] hover:text-[#e3fd8c] transition-colors underline-offset-4 hover:underline"
        >
          Solicitar nuevo enlace
        </Link>
      </div>
    );
  }

  return (
    <div className="glass-card w-full p-6 animate-slide-up flex flex-col gap-5">
      {success ? (
        <div className="flex flex-col items-center gap-4 text-center py-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#e3fd8c]">
            <Check size={28} className="text-[#0d0d0d]" />
          </div>
          <h2 className="text-lg font-bold tracking-tight text-[#ebf1e2]">
            Contraseña actualizada
          </h2>
          <p className="text-sm text-[#9a9f93]">
            Tu contraseña fue restablecida correctamente. Ya podés iniciar sesión.
          </p>
          <Link href="/login">
            <Button variant="gold" size="md">
              Ir al login
            </Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-bold tracking-tight text-[#ebf1e2]">
              Nueva contraseña
            </h2>
            <p className="text-sm text-[#9a9f93]">
              Ingresá tu nueva contraseña.
            </p>
          </div>

          {error && (
            <div className="rounded-[10px] bg-[rgba(207,58,74,0.08)] border border-[rgba(207,58,74,0.3)] p-3 text-sm text-[#e07385] animate-fade-in">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Nueva contraseña"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
            />

            <Input
              label="Confirmar contraseña"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              required
            />

            <Button
              type="submit"
              variant="gold"
              size="lg"
              loading={loading}
              className="w-full"
            >
              Restablecer contraseña
            </Button>
          </form>
        </>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
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
        <div className="w-full max-w-sm flex flex-col gap-8">
          <Suspense>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
