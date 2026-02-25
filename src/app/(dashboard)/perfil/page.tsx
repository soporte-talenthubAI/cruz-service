"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { LogOut, Lock, Check } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";

export default function PerfilPage() {
  const { data: session } = useSession();
  const user = session?.user as { name?: string; email?: string; role?: string; image?: string };

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (newPassword.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/cambiar-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al cambiar contraseña");
        return;
      }

      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const rolLabel = user?.role?.toUpperCase() || "USUARIO";
  const rolVariant = rolLabel === "ADMIN" ? "especial" : "normal";

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Mi Perfil" />

      {/* User info */}
      <div className="glass-card p-6 flex flex-col items-center gap-4 text-center">
        <Avatar
          name={user?.name || "Usuario"}
          src={user?.image}
          size="lg"
          role={rolLabel === "ADMIN" ? "admin" : rolLabel === "RRPP" ? "rrpp" : "portero"}
        />
        <div>
          <h2 className="text-xl font-bold text-dark-50">{user?.name}</h2>
          <p className="text-sm text-dark-400 mt-1">{user?.email}</p>
          <div className="mt-2">
            <Badge variant={rolVariant}>{rolLabel}</Badge>
          </div>
        </div>
      </div>

      {/* Change password */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Lock size={18} className="text-gold-500" />
          <h3 className="text-lg font-semibold text-dark-100">Cambiar contraseña</h3>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-error/10 border border-error/30 p-3 text-sm text-error animate-fade-in">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-xl bg-success/10 border border-success/30 p-3 text-sm text-success animate-fade-in flex items-center gap-2">
            <Check size={16} />
            Contraseña actualizada correctamente
          </div>
        )}

        <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
          <Input
            label="Contraseña actual"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
          <Input
            label="Nueva contraseña"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
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
          <Button type="submit" variant="gold" size="md" loading={loading} className="w-full">
            Actualizar contraseña
          </Button>
        </form>
      </div>

      {/* Sign out */}
      <Button
        variant="ghost"
        size="lg"
        className="w-full text-error hover:bg-error/10"
        leftIcon={<LogOut size={18} />}
        onClick={() => signOut({ callbackUrl: "/login" })}
      >
        Cerrar sesión
      </Button>
    </div>
  );
}
