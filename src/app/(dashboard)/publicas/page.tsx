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

interface Evento {
  id: string;
  nombre: string;
}

const estadoColors: Record<string, string> = {
  PENDIENTE: "pendiente",
  ENVIADO: "enviado",
  INGRESADO: "ingresado",
  INVALIDADO: "invalidado",
};

export default function PublicasPage() {
  const [entradas, setEntradas] = useState<Entrada[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroEvento, setFiltroEvento] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [selected, setSelected] = useState<Entrada | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [entradasRes, eventosRes] = await Promise.all([
          fetch("/api/entradas"),
          fetch("/api/eventos"),
        ]);
        const entradasData = await entradasRes.json();
        const eventosData = await eventosRes.json();
        if (entradasRes.ok) setEntradas(entradasData.data || []);
        if (eventosRes.ok) setEventos(eventosData.data || []);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const filtered = entradas.filter((e) => {
    if (filtroEvento && e.evento.nombre !== filtroEvento) return false;
    if (filtroEstado && e.estado !== filtroEstado) return false;
    return true;
  });

  if (loading) return <Spinner fullscreen />;

  return (
    <div className="space-y-4 animate-fade-in">
      <PageHeader
        title="Entradas"
        subtitle={`${filtered.length} entrada${filtered.length !== 1 ? "s" : ""}`}
      />

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <select
          value={filtroEvento}
          onChange={(e) => setFiltroEvento(e.target.value)}
          className="bg-surface-2 text-dark-200 text-sm rounded-xl px-3 py-2 border border-[rgba(255,255,255,0.06)] outline-none min-w-0"
        >
          <option value="">Todos los eventos</option>
          {eventos.map((ev) => (
            <option key={ev.id} value={ev.nombre}>{ev.nombre}</option>
          ))}
        </select>
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className="bg-surface-2 text-dark-200 text-sm rounded-xl px-3 py-2 border border-[rgba(255,255,255,0.06)] outline-none"
        >
          <option value="">Todos los estados</option>
          <option value="PENDIENTE">Pendiente</option>
          <option value="ENVIADO">Enviado</option>
          <option value="INGRESADO">Ingresado</option>
          <option value="INVALIDADO">Invalidado</option>
        </select>
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
                <p className="text-xs text-dark-500 mt-0.5">{entrada.evento.nombre} — {entrada.generadoPor.nombre}</p>
              </div>
              <Badge variant={estadoColors[entrada.estado] as "pendiente" | "enviado" | "ingresado" | "invalidado"}>
                {entrada.estado}
              </Badge>
            </button>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Search />}
          title="Sin resultados"
          description="No se encontraron entradas con esos filtros"
        />
      )}

      {/* Detail modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title="Detalle de entrada">
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
              // Refresh
              const res = await fetch("/api/entradas");
              const data = await res.json();
              if (res.ok) setEntradas(data.data || []);
            }}
          />
        )}
      </Modal>
    </div>
  );
}
