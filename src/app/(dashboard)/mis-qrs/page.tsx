"use client";

import { useEffect, useState } from "react";
import { Ticket, Search } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { Modal } from "@/components/ui/Modal";
import { QRDisplay } from "@/components/qr/QRDisplay";

interface Entrada {
  id: string;
  nombreInvitado: string;
  dniInvitado: string;
  emailInvitado: string;
  estado: "PENDIENTE" | "ENVIADO" | "INGRESADO" | "INVALIDADO";
  qrCode: string;
  createdAt: string;
  evento: { nombre: string; fecha: string };
  generadoPor: { nombre: string };
}

const estadoColors: Record<string, string> = {
  PENDIENTE: "pendiente",
  ENVIADO: "enviado",
  INGRESADO: "ingresado",
  INVALIDADO: "invalidado",
};

export default function MisQRsPage() {
  const [entradas, setEntradas] = useState<Entrada[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState("");
  const [selected, setSelected] = useState<Entrada | null>(null);

  const fetchEntradas = async () => {
    try {
      const res = await fetch("/api/entradas");
      const data = await res.json();
      if (res.ok) setEntradas(data.data || []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntradas();
  }, []);

  const filtered = entradas.filter((e) => {
    if (filtroEstado && e.estado !== filtroEstado) return false;
    return true;
  });

  if (loading) return <Spinner fullscreen />;

  return (
    <div className="space-y-4 animate-fade-in">
      <PageHeader
        title="Mis Entradas"
        subtitle={`${filtered.length} entrada${filtered.length !== 1 ? "s" : ""} generada${filtered.length !== 1 ? "s" : ""}`}
      />

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {["", "PENDIENTE", "ENVIADO", "INGRESADO", "INVALIDADO"].map((estado) => (
          <button
            key={estado}
            onClick={() => setFiltroEstado(estado)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              filtroEstado === estado
                ? "bg-gold-500/20 text-gold-500 border border-gold-500/40"
                : "bg-surface-2 text-dark-400 border border-transparent"
            }`}
          >
            {estado || "Todas"}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length > 0 ? (
        <div className="space-y-2">
          {filtered.map((entrada) => (
            <button
              key={entrada.id}
              onClick={() => setSelected(entrada)}
              className="w-full glass-card p-4 flex items-center justify-between gap-3 text-left transition-colors hover:border-gold-500/30"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-dark-100 truncate">{entrada.nombreInvitado}</p>
                <p className="text-xs text-dark-400">DNI: {entrada.dniInvitado}</p>
                <p className="text-xs text-dark-500 mt-0.5">{entrada.evento.nombre}</p>
              </div>
              <Badge variant={estadoColors[entrada.estado] as "pendiente" | "enviado" | "ingresado" | "invalidado"}>
                {entrada.estado}
              </Badge>
            </button>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Ticket />}
          title={filtroEstado ? "Sin resultados" : "Sin entradas"}
          description={filtroEstado ? "No hay entradas con ese estado" : "Generá tu primera entrada desde Nuevo QR"}
        />
      )}

      {/* Detail modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title="Detalle">
        {selected && (
          <QRDisplay
            eventName={selected.evento.nombre}
            eventDate={new Date(selected.evento.fecha).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })}
            eventTime=""
            guestName={selected.nombreInvitado}
            guestDni={selected.dniInvitado}
            guestEmail={selected.emailInvitado}
            generatedBy={selected.generadoPor.nombre}
            ticketId={selected.id}
            qrCode={selected.qrCode}
            status={selected.estado.toLowerCase() as "pendiente" | "enviado" | "ingresado" | "invalidado"}
            onSendEmail={async () => {
              await fetch(`/api/entradas/${selected.id}/enviar`, { method: "POST" });
              setSelected(null);
              fetchEntradas();
            }}
          />
        )}
      </Modal>
    </div>
  );
}
