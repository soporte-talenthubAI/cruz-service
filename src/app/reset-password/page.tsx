"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Check } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

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
      <div className="glass-card w-full p-6 text-center">
        <h2 className="text-lg font-semibold text-dark-50 mb-2">Enlace inválido</h2>
        <p className="text-sm text-dark-400 mb-4">
          Este enlace no es válido. Solicitá uno nuevo.
        </p>
        <Link href="/olvide-password" className="text-sm text-gold-500 hover:text-gold-400 transition-colors">
          Solicitar nuevo enlace
        </Link>
      </div>
    );
  }

  return (
    <div className="glass-card w-full p-6 animate-slide-up">
      {success ? (
        <div className="flex flex-col items-center gap-4 text-center py-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success/15">
            <Check size={28} className="text-success" />
          </div>
          <h2 className="text-lg font-semibold text-dark-50">Contraseña actualizada</h2>
          <p className="text-sm text-dark-400">
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
          <h2 className="text-xl font-semibold text-dark-50 mb-2">
            Nueva contraseña
          </h2>
          <p className="text-sm text-dark-400 mb-6">
            Ingresá tu nueva contraseña.
          </p>

          {error && (
            <div className="mb-4 rounded-xl bg-error/10 border border-error/30 p-3 text-sm text-error animate-fade-in">
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
    <div className="relative flex min-h-[100dvh] flex-col items-center justify-center px-6 overflow-hidden">
      <Image
        src="/images/cruz_espacio.jpg"
        alt=""
        fill
        priority
        className="object-cover"
        quality={90}
      />
      <div className="absolute inset-0 bg-black/60" />

      <div className="relative z-10 flex w-full max-w-sm flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-1">
          <h1 className="text-4xl font-bold tracking-[0.3em] gold-text">CRUZ</h1>
          <p className="text-xs text-dark-300 tracking-[0.25em] uppercase">Espacio</p>
        </div>

        <Suspense>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
