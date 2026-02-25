"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Search, Ticket } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { StatCard } from "@/components/ui/StatCard";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { QRDisplay } from "@/components/qr/QRDisplay";

interface Evento {
  id: string;
  nombre: string;
  fecha: string;
  horaApertura: string;
  tipo: string;
  capacidad: number;
  stats: {
    total: number;
    pendientes: number;
    enviadas: number;
    ingresadas: number;
    invalidadas: number;
  };
}

interface Entrada {
  id: string;
  nombreInvitado: string;
  dniInvitado: string;
  emailInvitado: string;
  estado: "PENDIENTE" | "ENVIADO" | "INGRESADO" | "INVALIDADO";
  qrCode: string;
  createdAt: string;
  evento: { nombre: string; fecha: string; horaApertura: string };
  generadoPor: { nombre: string };
}

const estadoVariant: Record<string, "pendiente" | "enviado" | "ingresado" | "invalidado"> = {
  PENDIENTE: "pendiente",
  ENVIADO: "enviado",
  INGRESADO: "ingresado",
  INVALIDADO: "invalidado",
};

export default function EventoDetallePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [evento, setEvento] = useState<Evento | null>(null);
  const [entradas, setEntradas] = useState<Entrada[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filtroEstado, setFiltroEstado] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selected, setSelected] = useState<Entrada | null>(null);

  const fetchEntradas = async (pageNum: number, append = false) => {
    if (append) setLoadingMore(true);

    try {
      const params = new URLSearchParams({
        eventoId: id,
        page: String(pageNum),
        limit: "20",
      });
      if (filtroEstado) params.set("estado", filtroEstado);
      if (searchQuery) params.set("search", searchQuery);

      const res = await fetch(`/api/entradas?${params}`);
      const json = await res.json();
      if (res.ok) {
        const data = json.data;
        if (append) {
          setEntradas((prev) => [...prev, ...(data.entradas || [])]);
        } else {
          setEntradas(data.entradas || []);
        }
        setTotalPages(data.meta?.totalPages || 1);
        setTotal(data.meta?.total || 0);
      }
    } catch {
      // silently fail
    } finally {
      setLoadingMore(false);
    }
  };

  const fetchEvento = async () => {
    try {
      const res = await fetch(`/api/eventos?status=all&limit=50`);
      const json = await res.json();
      if (res.ok) {
        const found = (json.data.eventos || []).find((e: Evento) => e.id === id);
        if (found) setEvento(found);
      }
    } catch {
      // silently fail
    }
  };

  useEffect(() => {
    async function init() {
      await Promise.all([fetchEvento(), fetchEntradas(1)]);
      setLoading(false);
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setPage(1);
    setEntradas([]);
    fetchEntradas(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroEstado, searchQuery]);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchEntradas(next, true);
  };

  if (loading) return <Spinner fullscreen />;

  const isPast = evento ? new Date(evento.fecha) < new Date() : false;

  return (
    <div className="space-y-4 animate-fade-in">
      <Button
        variant="ghost"
        size="sm"
        leftIcon={<ArrowLeft size={16} />}
        onClick={() => router.push("/eventos")}
      >
        Eventos
      </Button>

      <PageHeader
        title={evento?.nombre || "Evento"}
        subtitle={evento ? `${new Date(evento.fecha).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })} — ${evento.horaApertura}` : ""}
      />

      {/* Event stats */}
      {evento && (
        <div className="grid grid-cols-2 gap-3">
          <StatCard value={evento.stats.total} label="Entradas totales" icon={<Ticket />} />
          <StatCard value={evento.stats.ingresadas} label="Ingresadas" />
          <StatCard value={evento.stats.enviadas} label="Enviadas" />
          <StatCard value={evento.stats.pendientes} label="Pendientes" />
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
        <input
          type="text"
          placeholder="Buscar por nombre o DNI..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-surface-2 text-dark-200 text-sm rounded-xl pl-9 pr-4 py-2.5 border border-[rgba(255,255,255,0.06)] outline-none focus:border-gold-500/40 transition-colors"
        />
      </div>

      {/* Status filters */}
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
            {estado || `Todas (${total})`}
          </button>
        ))}
      </div>

      {/* Entries list */}
      {entradas.length > 0 ? (
        <div className="space-y-2">
          {entradas.map((entrada) => (
            <button
              key={entrada.id}
              onClick={() => setSelected(entrada)}
              className="w-full glass-card p-4 flex items-center justify-between gap-3 text-left transition-colors hover:border-gold-500/30"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-dark-100 truncate">{entrada.nombreInvitado}</p>
                <p className="text-xs text-dark-400">DNI: {entrada.dniInvitado}</p>
                <p className="text-xs text-dark-500 mt-0.5">{entrada.generadoPor.nombre}</p>
              </div>
              <Badge variant={estadoVariant[entrada.estado]}>
                {entrada.estado}
              </Badge>
            </button>
          ))}

          {page < totalPages && (
            <Button
              variant="ghost"
              size="md"
              className="w-full"
              loading={loadingMore}
              onClick={loadMore}
            >
              Cargar más
            </Button>
          )}
        </div>
      ) : (
        <EmptyState
          icon={<Ticket />}
          title="Sin entradas"
          description={searchQuery || filtroEstado ? "No hay entradas con esos filtros" : "No se generaron entradas para este evento"}
        />
      )}

      {/* Detail modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title="Detalle de entrada">
        {selected && (
          <QRDisplay
            eventName={selected.evento.nombre}
            eventDate={new Date(selected.evento.fecha).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })}
            eventTime={selected.evento.horaApertura || ""}
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
              fetchEntradas(1);
            }}
          />
        )}
      </Modal>
    </div>
  );
}
