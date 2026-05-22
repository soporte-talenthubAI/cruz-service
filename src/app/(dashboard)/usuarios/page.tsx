"use client";

import { useEffect, useState } from "react";
import { UserPlus, Users, Shield, Ticket, KeyRound, Trash2, RotateCcw, AlertCircle, X } from "lucide-react";
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

interface PasswordRequest {
  id: string;
  email: string;
  nota: string | null;
  createdAt: string;
  usuario: {
    id: string;
    nombre: string;
    email: string;
    rol: "ADMIN" | "RRPP" | "PORTERO";
    activo: boolean;
  } | null;
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
  const [filtroRol, setFiltroRol] = useState("");
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const [globalSuccess, setGlobalSuccess] = useState("");
  const [globalError, setGlobalError] = useState("");

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [rol, setRol] = useState("RRPP");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Change password modal
  const [pwdUser, setPwdUser] = useState<Usuario | null>(null);
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdError, setPwdError] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmNewPwd, setConfirmNewPwd] = useState("");
  // If opened from a password request, remember it so we can mark it resolved
  const [pwdRequestId, setPwdRequestId] = useState<string | null>(null);

  // Password reset requests
  const [requests, setRequests] = useState<PasswordRequest[]>([]);

  const fetchUsuarios = async () => {
    try {
      const res = await fetch("/api/usuarios");
      const json = await res.json();
      if (res.ok) setUsuarios(json.data || []);
    } catch {
      // silently fail
    }
  };

  const fetchRequests = async () => {
    try {
      const res = await fetch("/api/password-requests");
      const json = await res.json();
      if (res.ok) setRequests(json.data || []);
    } catch {
      // silently fail
    }
  };

  useEffect(() => {
    async function init() {
      await Promise.all([fetchUsuarios(), fetchRequests()]);
      setLoading(false);
    }
    init();
  }, []);

  const flashSuccess = (msg: string) => {
    setGlobalSuccess(msg);
    setTimeout(() => setGlobalSuccess(""), 3000);
  };

  const flashError = (msg: string) => {
    setGlobalError(msg);
    setTimeout(() => setGlobalError(""), 3000);
  };

  const resetCreateForm = () => {
    setNombre("");
    setEmail("");
    setRol("RRPP");
    setPassword("");
    setConfirmPassword("");
    setCreateError("");
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");

    if (password !== confirmPassword) {
      setCreateError("Las contraseñas no coinciden");
      return;
    }
    if (password.length < 6) {
      setCreateError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, email, rol, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setCreateError(data.error || "Error al crear usuario");
        return;
      }

      flashSuccess(`Usuario "${nombre}" creado correctamente`);
      resetCreateForm();
      setShowCreate(false);
      fetchUsuarios();
    } catch {
      setCreateError("Error de conexión");
    } finally {
      setCreating(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwdUser) return;
    setPwdError("");

    if (newPwd !== confirmNewPwd) {
      setPwdError("Las contraseñas no coinciden");
      return;
    }
    if (newPwd.length < 6) {
      setPwdError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setPwdSaving(true);
    try {
      const res = await fetch(`/api/usuarios/${pwdUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPwd }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPwdError(data.error || "Error al cambiar contraseña");
        return;
      }

      // If we came from a password request, mark it resolved
      if (pwdRequestId) {
        try {
          await fetch(`/api/password-requests/${pwdRequestId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ resuelto: true }),
          });
          fetchRequests();
        } catch {
          // silently fail
        }
      }

      flashSuccess(`Contraseña de ${pwdUser.nombre} actualizada`);
      setPwdUser(null);
      setPwdRequestId(null);
      setNewPwd("");
      setConfirmNewPwd("");
    } catch {
      setPwdError("Error de conexión");
    } finally {
      setPwdSaving(false);
    }
  };

  const openPwdModalForRequest = (req: PasswordRequest) => {
    if (!req.usuario) return;
    setPwdUser({
      ...req.usuario,
      createdAt: "",
      _count: { entradas: 0 },
    });
    setPwdRequestId(req.id);
    setNewPwd("");
    setConfirmNewPwd("");
    setPwdError("");
  };

  const dismissRequest = async (req: PasswordRequest) => {
    try {
      const res = await fetch(`/api/password-requests/${req.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resuelto: true }),
      });
      if (res.ok) {
        flashSuccess("Solicitud marcada como resuelta");
        fetchRequests();
      }
    } catch {
      flashError("Error al actualizar solicitud");
    }
  };

  const handleDelete = async (user: Usuario) => {
    if (!window.confirm(`¿Eliminar a "${user.nombre}"? Quedará oculto y no podrá ingresar.`)) return;
    try {
      const res = await fetch(`/api/usuarios/${user.id}`, { method: "DELETE" });
      if (res.ok) {
        flashSuccess(`Usuario ${user.nombre} eliminado`);
        fetchUsuarios();
      } else {
        flashError("Error al eliminar usuario");
      }
    } catch {
      flashError("Error de conexión");
    }
  };

  const handleRestore = async (user: Usuario) => {
    try {
      const res = await fetch(`/api/usuarios/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activo: true }),
      });
      if (res.ok) {
        flashSuccess(`Usuario ${user.nombre} reactivado`);
        fetchUsuarios();
      } else {
        flashError("Error al reactivar usuario");
      }
    } catch {
      flashError("Error de conexión");
    }
  };

  if (loading) return <Spinner fullscreen />;

  const visibleByActive = mostrarInactivos ? usuarios : usuarios.filter((u) => u.activo);
  const filtered = filtroRol
    ? visibleByActive.filter((u) => u.rol === filtroRol)
    : visibleByActive;

  const stats = {
    total: usuarios.filter((u) => u.activo).length,
    rrpp: usuarios.filter((u) => u.rol === "RRPP" && u.activo).length,
    porteros: usuarios.filter((u) => u.rol === "PORTERO" && u.activo).length,
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <PageHeader
        title="Usuarios"
        subtitle={`${stats.total} usuario${stats.total !== 1 ? "s" : ""} activo${stats.total !== 1 ? "s" : ""}`}
        actions={
          <Button
            variant="gold"
            size="sm"
            leftIcon={<UserPlus size={16} />}
            onClick={() => {
              resetCreateForm();
              setShowCreate(true);
            }}
          >
            Nuevo
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard value={stats.total} label="Total" icon={<Users />} />
        <StatCard value={stats.rrpp} label="RRPP" icon={<Ticket />} />
        <StatCard value={stats.porteros} label="Seguridad" icon={<Shield />} />
      </div>

      {/* Pending password reset requests */}
      {requests.length > 0 && (
        <div className="glass-card p-4 border-gold-500/30">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle size={16} className="text-gold-500" />
            <h3 className="text-sm font-semibold text-dark-100">
              Solicitudes de contraseña ({requests.length})
            </h3>
          </div>
          <div className="space-y-2">
            {requests.map((req) => (
              <div
                key={req.id}
                className="rounded-xl bg-surface-2 border border-[rgba(255,255,255,0.04)] p-3 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-dark-100 truncate">
                      {req.usuario?.nombre || req.email}
                    </p>
                    {req.usuario ? (
                      <Badge variant={rolVariant[req.usuario.rol]}>
                        {rolLabel[req.usuario.rol]}
                      </Badge>
                    ) : (
                      <span className="text-[10px] text-error">Email no registrado</span>
                    )}
                  </div>
                  <p className="text-xs text-dark-500 truncate">{req.email}</p>
                  {req.nota && (
                    <p className="text-xs text-dark-400 mt-1 italic">&ldquo;{req.nota}&rdquo;</p>
                  )}
                  <p className="text-[10px] text-dark-600 mt-1">
                    {new Date(req.createdAt).toLocaleString("es-AR", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  {req.usuario && req.usuario.activo && (
                    <Button
                      variant="gold"
                      size="sm"
                      leftIcon={<KeyRound size={14} />}
                      onClick={() => openPwdModalForRequest(req)}
                    >
                      Asignar
                    </Button>
                  )}
                  <button
                    onClick={() => dismissRequest(req)}
                    className="p-1.5 rounded-lg hover:bg-error/10 text-dark-400 hover:text-error transition-colors"
                    title="Marcar como resuelta"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Global success/error */}
      {globalSuccess && (
        <div className="rounded-xl bg-success/10 border border-success/30 p-3 text-sm text-success animate-fade-in">
          {globalSuccess}
        </div>
      )}
      {globalError && (
        <div className="rounded-xl bg-error/10 border border-error/30 p-3 text-sm text-error animate-fade-in">
          {globalError}
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
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
        <label className="flex items-center gap-2 text-xs text-dark-400 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={mostrarInactivos}
            onChange={(e) => setMostrarInactivos(e.target.checked)}
            className="accent-gold-500"
          />
          Mostrar eliminados
        </label>
      </div>

      {/* Table */}
      {filtered.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-[rgba(255,255,255,0.06)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[rgba(255,255,255,0.06)] bg-surface-2">
                <th className="text-left text-xs font-medium text-dark-400 px-4 py-3">Usuario</th>
                <th className="text-left text-xs font-medium text-dark-400 px-4 py-3 hidden sm:table-cell">Email</th>
                <th className="text-left text-xs font-medium text-dark-400 px-4 py-3">Rol</th>
                <th className="text-right text-xs font-medium text-dark-400 px-4 py-3 hidden md:table-cell">Entradas</th>
                <th className="text-right text-xs font-medium text-dark-400 px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr
                  key={user.id}
                  className={`border-b border-[rgba(255,255,255,0.04)] hover:bg-gold-500/5 transition-colors ${
                    !user.activo ? "opacity-50" : ""
                  }`}
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-dark-100 truncate max-w-[160px] lg:max-w-[260px]">
                      {user.nombre}
                    </p>
                    <p className="text-xs text-dark-500 sm:hidden mt-0.5 truncate max-w-[160px]">
                      {user.email}
                    </p>
                    {!user.activo && (
                      <span className="text-[10px] text-error mt-1 inline-block">Eliminado</span>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell text-dark-300 text-xs">
                    {user.email}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={rolVariant[user.rol]}>{rolLabel[user.rol] || user.rol}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right hidden md:table-cell text-dark-300">
                    {user.rol === "RRPP" ? user._count.entradas : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {user.activo ? (
                        <>
                          <button
                            onClick={() => {
                              setPwdUser(user);
                              setNewPwd("");
                              setConfirmNewPwd("");
                              setPwdError("");
                            }}
                            className="p-1.5 rounded-lg hover:bg-gold-500/10 text-dark-400 hover:text-gold-500 transition-colors"
                            title="Cambiar contraseña"
                          >
                            <KeyRound size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(user)}
                            className="p-1.5 rounded-lg hover:bg-error/10 text-dark-400 hover:text-error transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleRestore(user)}
                          className="p-1.5 rounded-lg hover:bg-success/10 text-dark-400 hover:text-success transition-colors"
                          title="Reactivar"
                        >
                          <RotateCcw size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          icon={<Users />}
          title="Sin usuarios"
          description="Creá el primer usuario con el botón Nuevo"
        />
      )}

      {/* Create modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nuevo usuario">
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          {createError && (
            <div className="rounded-xl bg-error/10 border border-error/30 p-3 text-sm text-error animate-fade-in">
              {createError}
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

          <Input
            label="Contraseña"
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

          <p className="text-xs text-dark-500">
            Comunicale al empleado el email y la contraseña que elegiste.
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
      </Modal>

      {/* Change password modal */}
      <Modal
        open={!!pwdUser}
        onClose={() => {
          setPwdUser(null);
          setPwdRequestId(null);
        }}
        title={pwdUser ? `Cambiar contraseña — ${pwdUser.nombre}` : ""}
      >
        <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
          {pwdError && (
            <div className="rounded-xl bg-error/10 border border-error/30 p-3 text-sm text-error animate-fade-in">
              {pwdError}
            </div>
          )}
          <Input
            label="Nueva contraseña"
            type="password"
            value={newPwd}
            onChange={(e) => setNewPwd(e.target.value)}
            autoComplete="new-password"
            required
          />
          <Input
            label="Confirmar nueva contraseña"
            type="password"
            value={confirmNewPwd}
            onChange={(e) => setConfirmNewPwd(e.target.value)}
            autoComplete="new-password"
            required
          />
          <Button
            type="submit"
            variant="gold"
            size="lg"
            loading={pwdSaving}
            className="w-full"
            leftIcon={<KeyRound size={18} />}
          >
            Guardar contraseña
          </Button>
        </form>
      </Modal>
    </div>
  );
}
