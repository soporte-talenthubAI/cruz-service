"use client";

import { useEffect, useState } from "react";
import { UserPlus, Users, Shield, Ticket, Mail } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";

interface Usuario {
  id: string;
  email: string;
  nombre: string;
  rol: "ADMIN" | "RRPP" | "PORTERO";
  activo: boolean;
  createdAt: string;
  _count: { entradas: number };
}

const rolVariant: Record<string, "pendiente" | "enviado" | "ingresado"> = {
  ADMIN: "ingresado",
  RRPP: "enviado",
  PORTERO: "pendiente",
};

const rolLabel: Record<string, string> = {
  ADMIN: "Admin",
  RRPP: "RRPP",
  PORTERO: "Seguridad",
};

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [filtroRol, setFiltroRol] = useState("");

  // Form
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [rol, setRol] = useState("RRPP");

  const fetchUsuarios = async () => {
    try {
      const res = await fetch("/api/usuarios");
      const json = await res.json();
      if (res.ok) setUsuarios(json.data || []);
    } catch {
      // silently fail
    }
  };

  useEffect(() => {
    async function init() {
      await fetchUsuarios();
      setLoading(false);
    }
    init();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setCreating(true);

    try {
      const res = await fetch("/api/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, email, rol }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al crear usuario");
        return;
      }

      setSuccess(`Usuario creado. Se envió un email a ${email} para configurar su contraseña.`);
      setNombre("");
      setEmail("");
      setRol("RRPP");
      fetchUsuarios();

      setTimeout(() => {
        setShowCreate(false);
        setSuccess("");
      }, 3000);
    } catch {
      setError("Error de conexión");
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActive = async (user: Usuario) => {
    try {
      const res = await fetch(`/api/usuarios/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activo: !user.activo }),
      });
      if (res.ok) fetchUsuarios();
    } catch {
      // silently fail
    }
  };

  const handleResendWelcome = async (user: Usuario) => {
    try {
      const res = await fetch(`/api/usuarios/${user.id}/reenviar`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(`Email reenviado a ${user.email}`);
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.error || "Error al reenviar");
        setTimeout(() => setError(""), 3000);
      }
    } catch {
      setError("Error de conexión");
    }
  };

  if (loading) return <Spinner fullscreen />;

  const filtered = filtroRol
    ? usuarios.filter((u) => u.rol === filtroRol)
    : usuarios;

  const stats = {
    total: usuarios.length,
    rrpp: usuarios.filter((u) => u.rol === "RRPP").length,
    porteros: usuarios.filter((u) => u.rol === "PORTERO").length,
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <PageHeader
        title="Usuarios"
        subtitle={`${usuarios.length} usuario${usuarios.length !== 1 ? "s" : ""} registrado${usuarios.length !== 1 ? "s" : ""}`}
        actions={
          <Button
            variant="gold"
            size="sm"
            leftIcon={<UserPlus size={16} />}
            onClick={() => {
              setShowCreate(true);
              setError("");
              setSuccess("");
            }}
          >
            Nuevo
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard value={stats.total} label="Total" icon={<Users />} />
        <StatCard value={stats.rrpp} label="RRPP" icon={<Ticket />} />
        <StatCard value={stats.porteros} label="Seguridad" icon={<Shield />} />
      </div>

      {/* Success/Error global */}
      {success && (
        <div className="rounded-xl bg-success/10 border border-success/30 p-3 text-sm text-success animate-fade-in">
          {success}
        </div>
      )}
      {error && !showCreate && (
        <div className="rounded-xl bg-error/10 border border-error/30 p-3 text-sm text-error animate-fade-in">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {["", "ADMIN", "RRPP", "PORTERO"].map((r) => (
          <button
            key={r}
            onClick={() => setFiltroRol(r)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              filtroRol === r
                ? "bg-gold-500/20 text-gold-500 border border-gold-500/40"
                : "bg-surface-2 text-dark-400 border border-transparent"
            }`}
          >
            {r ? rolLabel[r] || r : "Todos"}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length > 0 ? (
        <div className="space-y-2">
          {filtered.map((user) => (
            <div
              key={user.id}
              className={`glass-card p-4 flex items-center justify-between gap-3 ${!user.activo ? "opacity-50" : ""}`}
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-dark-100 truncate">
                  {user.nombre}
                </p>
                <p className="text-xs text-dark-400 truncate">{user.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={rolVariant[user.rol]}>
                    {rolLabel[user.rol] || user.rol}
                  </Badge>
                  {user.rol === "RRPP" && (
                    <span className="text-[10px] text-dark-500">
                      {user._count.entradas} entrada{user._count.entradas !== 1 ? "s" : ""}
                    </span>
                  )}
                  {!user.activo && (
                    <span className="text-[10px] text-error">Inactivo</span>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-1.5 shrink-0">
                <button
                  onClick={() => handleToggleActive(user)}
                  className={`text-[10px] px-2 py-1 rounded-lg font-medium transition-colors ${
                    user.activo
                      ? "bg-error/10 text-error hover:bg-error/20"
                      : "bg-success/10 text-success hover:bg-success/20"
                  }`}
                >
                  {user.activo ? "Desactivar" : "Activar"}
                </button>
                <button
                  onClick={() => handleResendWelcome(user)}
                  className="text-[10px] px-2 py-1 rounded-lg font-medium bg-surface-2 text-dark-400 hover:text-dark-200 transition-colors flex items-center gap-1"
                >
                  <Mail size={10} />
                  Reenviar
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Users />}
          title="Sin usuarios"
          description="Creá el primer usuario con el botón Nuevo"
        />
      )}

      {/* Create modal */}
      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Nuevo usuario"
      >
        {success ? (
          <div className="rounded-xl bg-success/10 border border-success/30 p-4 text-sm text-success text-center animate-fade-in">
            {success}
          </div>
        ) : (
          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            {error && (
              <div className="rounded-xl bg-error/10 border border-error/30 p-3 text-sm text-error animate-fade-in">
                {error}
              </div>
            )}

            <Input
              label="Nombre completo"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <div>
              <label className="text-sm text-dark-300 mb-2 block">Rol</label>
              <select
                value={rol}
                onChange={(e) => setRol(e.target.value)}
                required
                className="w-full bg-surface-2 text-dark-200 text-sm rounded-xl px-4 py-3 border border-[rgba(255,255,255,0.06)] outline-none focus:border-gold-500/40 transition-colors"
              >
                <option value="RRPP">RRPP (Relaciones Públicas)</option>
                <option value="PORTERO">Seguridad (Portero)</option>
                <option value="ADMIN">Administrador</option>
              </select>
            </div>

            <p className="text-xs text-dark-500">
              Se enviará un email al usuario para que configure su contraseña.
            </p>

            <Button
              type="submit"
              variant="gold"
              size="lg"
              loading={creating}
              className="w-full"
              leftIcon={<UserPlus size={20} />}
            >
              Crear usuario
            </Button>
          </form>
        )}
      </Modal>
    </div>
  );
}
