"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Search, Ticket, Users, Check, DollarSign } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { StatCard } from "@/components/ui/StatCard";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { QRDisplay } from "@/components/qr/QRDisplay";

interface RrppAsignado {
  id: string;
  montoPorQr: number;
  usuario: { id: string; nombre: string; email: string };
}

interface EventoDetalle {
  id: string;
  nombre: string;
  fecha: string;
  horaApertura: string;
  tipo: string;
  capacidad: number;
  rrppAsignados: RrppAsignado[];
}

interface EventoStats {
  total: number;
  pendientes: number;
  enviadas: number;
  ingresadas: number;
  invalidadas: number;
}

interface EventoConStats {
  id: string;
  nombre: string;
  fecha: string;
  horaApertura: string;
  tipo: string;
  capacidad: number;
  stats: EventoStats;
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

interface RrppOption {
  id: string;
  nombre: string;
  email: string;
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

  const [eventoDetalle, setEventoDetalle] = useState<EventoDetalle | null>(null);
  const [eventoStats, setEventoStats] = useState<EventoConStats | null>(null);
  const [entradas, setEntradas] = useState<Entrada[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filtroEstado, setFiltroEstado] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selected, setSelected] = useState<Entrada | null>(null);

  // RRPP edit modal
  const [showRrppModal, setShowRrppModal] = useState(false);
  const [rrppList, setRrppList] = useState<RrppOption[]>([]);
  const [editRrpp, setEditRrpp] = useState<{ usuarioId: string; montoPorQr: number }[]>([]);
  const [savingRrpp, setSavingRrpp] = useState(false);

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

  const fetchEventoDetalle = async () => {
    try {
      const res = await fetch(`/api/eventos/${id}`);
      const json = await res.json();
      if (res.ok) setEventoDetalle(json.data);
    } catch {
      // silently fail
    }
  };

  const fetchEventoStats = async () => {
    try {
      const res = await fetch(`/api/eventos?status=all&limit=50`);
      const json = await res.json();
      if (res.ok) {
        const found = (json.data.eventos || []).find((e: EventoConStats) => e.id === id);
        if (found) setEventoStats(found);
      }
    } catch {
      // silently fail
    }
  };

  useEffect(() => {
    async function init() {
      await Promise.all([fetchEventoDetalle(), fetchEventoStats(), fetchEntradas(1)]);
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

  const openRrppModal = async () => {
    setShowRrppModal(true);
    // Fetch RRPP list
    try {
      const res = await fetch("/api/usuarios/rrpp");
      const json = await res.json();
      if (res.ok) setRrppList(json.data || []);
    } catch {
      // silently fail
    }
    // Pre-populate with current assignments
    if (eventoDetalle?.rrppAsignados) {
      setEditRrpp(
        eventoDetalle.rrppAsignados.map((r) => ({
          usuarioId: r.usuario.id,
          montoPorQr: r.montoPorQr,
        }))
      );
    }
  };

  const toggleEditRrpp = (userId: string) => {
    setEditRrpp((prev) => {
      const exists = prev.find((r) => r.usuarioId === userId);
      if (exists) return prev.filter((r) => r.usuarioId !== userId);
      return [...prev, { usuarioId: userId, montoPorQr: 0 }];
    });
  };

  const updateEditMonto = (usuarioId: string, monto: number) => {
    setEditRrpp((prev) =>
      prev.map((r) => (r.usuarioId === usuarioId ? { ...r, montoPorQr: monto } : r))
    );
  };

  const handleSaveRrpp = async () => {
    setSavingRrpp(true);
    try {
      const res = await fetch(`/api/eventos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rrppAsignados: editRrpp }),
      });
      if (res.ok) {
        setShowRrppModal(false);
        fetchEventoDetalle();
      }
    } catch {
      // silently fail
    } finally {
      setSavingRrpp(false);
    }
  };

  if (loading) return <Spinner fullscreen />;

  const evento = eventoStats;

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
        title={evento?.nombre || eventoDetalle?.nombre || "Evento"}
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

      {/* RRPP Asignados */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-dark-300 flex items-center gap-2">
            <Users size={14} />
            RRPP asignados
          </h3>
          <Button variant="ghost" size="sm" onClick={openRrppModal}>
            Editar
          </Button>
        </div>
        {eventoDetalle?.rrppAsignados && eventoDetalle.rrppAsignados.length > 0 ? (
          <div className="space-y-2">
            {eventoDetalle.rrppAsignados.map((r) => (
              <div key={r.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-dark-200">{r.usuario.nombre}</p>
                  <p className="text-xs text-dark-500">{r.usuario.email}</p>
                </div>
                <span className="text-xs text-dark-400 flex items-center gap-1">
                  <DollarSign size={10} />
                  {r.montoPorQr}/QR
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-dark-500">No hay RRPP asignados a este evento</p>
        )}
      </div>

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

      {/* Edit RRPP modal */}
      <Modal open={showRrppModal} onClose={() => setShowRrppModal(false)} title="Editar RRPP asignados">
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {rrppList.map((rrpp) => {
            const isSelected = editRrpp.some((r) => r.usuarioId === rrpp.id);
            const asignado = editRrpp.find((r) => r.usuarioId === rrpp.id);
            return (
              <div key={rrpp.id} className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => toggleEditRrpp(rrpp.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors ${
                    isSelected
                      ? "bg-gold-500/10 border border-gold-500/30"
                      : "bg-surface-2 border border-transparent hover:border-dark-700"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                      isSelected ? "bg-gold-500 text-black" : "bg-dark-700 border border-dark-600"
                    }`}
                  >
                    {isSelected && <Check size={14} />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-dark-200 truncate">{rrpp.nombre}</p>
                    <p className="text-xs text-dark-500 truncate">{rrpp.email}</p>
                  </div>
                </button>
                {isSelected && (
                  <div className="pl-8">
                    <Input
                      label="Monto por QR ($)"
                      type="number"
                      step="0.01"
                      value={asignado?.montoPorQr?.toString() || "0"}
                      onChange={(e) => updateEditMonto(rrpp.id, Number(e.target.value) || 0)}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <Button
          variant="gold"
          size="lg"
          className="w-full mt-4"
          loading={savingRrpp}
          onClick={handleSaveRrpp}
        >
          Guardar cambios
        </Button>
      </Modal>
    </div>
  );
}
