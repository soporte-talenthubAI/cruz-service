"use client";

import { useEffect, useState, useCallback } from "react";
import { Search } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";
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
  evento: { nombre: string; fecha: string; horaApertura: string };
  generadoPor: { nombre: string };
}

interface Evento {
  id: string;
  nombre: string;
  fecha: string;
}

const estadoVariant: Record<string, "pendiente" | "enviado" | "ingresado" | "invalidado"> = {
  PENDIENTE: "pendiente",
  ENVIADO: "enviado",
  INGRESADO: "ingresado",
  INVALIDADO: "invalidado",
};

type PeriodoTab = "all" | "upcoming" | "past";

export default function PublicasPage() {
  const [entradas, setEntradas] = useState<Entrada[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [periodo, setPeriodo] = useState<PeriodoTab>("all");
  const [filtroEvento, setFiltroEvento] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selected, setSelected] = useState<Entrada | null>(null);

  const fetchEntradas = useCallback(async (pageNum: number, append = false) => {
    if (append) setLoadingMore(true);

    try {
      const params = new URLSearchParams({
        page: String(pageNum),
        limit: "20",
      });
      if (filtroEvento) params.set("eventoId", filtroEvento);
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
  }, [filtroEvento, filtroEstado, searchQuery]);

  const fetchEventos = useCallback(async (status: PeriodoTab) => {
    try {
      const res = await fetch(`/api/eventos?status=${status}&limit=50`);
      const json = await res.json();
      if (res.ok) setEventos(json.data?.eventos || []);
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    async function init() {
      await Promise.all([fetchEntradas(1), fetchEventos("all")]);
      setLoading(false);
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When periodo changes, refetch events for that period
  useEffect(() => {
    setFiltroEvento("");
    fetchEventos(periodo);
  }, [periodo, fetchEventos]);

  // When filters change, reset and refetch entradas
  useEffect(() => {
    setPage(1);
    setEntradas([]);
    fetchEntradas(1);
  }, [filtroEvento, filtroEstado, searchQuery, fetchEntradas]);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchEntradas(next, true);
  };

  if (loading) return <Spinner fullscreen />;

  return (
    <div className="space-y-4 animate-fade-in">
      <PageHeader
        title="Entradas"
        subtitle={`${total} entrada${total !== 1 ? "s" : ""}`}
      />

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

      {/* Period tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {([
          { value: "all", label: "Todos" },
          { value: "upcoming", label: "Próximos" },
          { value: "past", label: "Pasados" },
        ] as { value: PeriodoTab; label: string }[]).map((tab) => (
          <button
            key={tab.value}
            onClick={() => setPeriodo(tab.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              periodo === tab.value
                ? "bg-gold-500/20 text-gold-500 border border-gold-500/40"
                : "bg-surface-2 text-dark-400 border border-transparent"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Event + Status filters */}
      <div className="flex gap-2 flex-wrap">
        {eventos.length > 0 && (
          <select
            value={filtroEvento}
            onChange={(e) => setFiltroEvento(e.target.value)}
            className="bg-surface-2 text-dark-200 text-xs rounded-xl px-3 py-2 border border-[rgba(255,255,255,0.06)] outline-none max-w-[200px]"
          >
            <option value="">Todos los eventos</option>
            {eventos.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.nombre} — {new Date(ev.fecha).toLocaleDateString("es-AR", { day: "numeric", month: "short" })}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Status pills */}
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

      {/* Table */}
      {entradas.length > 0 ? (
        <>
          <p className="text-xs text-dark-500">
            Mostrando {entradas.length} de {total}
          </p>

          <div className="overflow-x-auto rounded-xl border border-[rgba(255,255,255,0.06)]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgba(255,255,255,0.06)] bg-surface-2">
                  <th className="text-left text-xs font-medium text-dark-400 px-4 py-3">Invitado</th>
                  <th className="text-left text-xs font-medium text-dark-400 px-4 py-3">DNI</th>
                  <th className="text-left text-xs font-medium text-dark-400 px-4 py-3 hidden sm:table-cell">Evento</th>
                  <th className="text-left text-xs font-medium text-dark-400 px-4 py-3 hidden sm:table-cell">RRPP</th>
                  <th className="text-left text-xs font-medium text-dark-400 px-4 py-3">Estado</th>
                  <th className="text-left text-xs font-medium text-dark-400 px-4 py-3 hidden md:table-cell">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {entradas.map((entrada) => (
                  <tr
                    key={entrada.id}
                    onClick={() => setSelected(entrada)}
                    className="border-b border-[rgba(255,255,255,0.04)] hover:bg-gold-500/5 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 text-dark-100 font-medium truncate max-w-[140px]">
                      {entrada.nombreInvitado}
                    </td>
                    <td className="px-4 py-3 text-dark-300 text-xs font-mono">
                      {entrada.dniInvitado}
                    </td>
                    <td className="px-4 py-3 text-dark-400 text-xs truncate max-w-[120px] hidden sm:table-cell">
                      {entrada.evento.nombre}
                    </td>
                    <td className="px-4 py-3 text-dark-400 text-xs truncate max-w-[100px] hidden sm:table-cell">
                      {entrada.generadoPor.nombre}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={estadoVariant[entrada.estado]}>
                        {entrada.estado}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-dark-500 text-xs hidden md:table-cell">
                      {new Date(entrada.createdAt).toLocaleDateString("es-AR", {
                        day: "numeric",
                        month: "short",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

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
        </>
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
    </div>
  );
}
