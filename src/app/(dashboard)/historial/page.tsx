"use client";

import { useEffect, useState } from "react";
import { ClipboardList, Clock, Search } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";

interface Escaneo {
  id: string;
  nombreInvitado: string;
  dniInvitado: string;
  fechaIngreso: string;
  evento: { nombre: string; fecha: string };
}

interface Evento {
  id: string;
  nombre: string;
  fecha: string;
}

export default function HistorialPage() {
  const [entradas, setEntradas] = useState<Escaneo[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filtroEvento, setFiltroEvento] = useState("");

  const fetchHistorial = async (pageNum: number, append = false) => {
    if (append) setLoadingMore(true);

    try {
      const params = new URLSearchParams({
        page: String(pageNum),
        limit: "20",
      });
      if (filtroEvento) params.set("eventoId", filtroEvento);

      const res = await fetch(`/api/portero/historial?${params}`);
      const json = await res.json();
      if (res.ok) {
        const data = json.data;
        if (append) {
          setEntradas((prev) => [...prev, ...(data.entradas || [])]);
        } else {
          setEntradas(data.entradas || []);
          setEventos(data.eventos || []);
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

  useEffect(() => {
    async function init() {
      await fetchHistorial(1);
      setLoading(false);
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setPage(1);
    setEntradas([]);
    fetchHistorial(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroEvento]);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchHistorial(next, true);
  };

  if (loading) return <Spinner fullscreen />;

  return (
    <div className="space-y-4 animate-fade-in">
      <PageHeader
        title="Historial"
        subtitle={`${total} escaneo${total !== 1 ? "s" : ""} registrado${total !== 1 ? "s" : ""}`}
      />

      {/* Event filter */}
      {eventos.length > 0 && (
        <select
          value={filtroEvento}
          onChange={(e) => setFiltroEvento(e.target.value)}
          className="w-full bg-surface-2 text-dark-200 text-sm rounded-xl px-4 py-3 border border-[rgba(255,255,255,0.06)] outline-none focus:border-gold-500/40 transition-colors"
        >
          <option value="">Todos los eventos</option>
          {eventos.map((ev) => (
            <option key={ev.id} value={ev.id}>
              {ev.nombre} — {new Date(ev.fecha).toLocaleDateString("es-AR", { day: "numeric", month: "short" })}
            </option>
          ))}
        </select>
      )}

      {/* List */}
      {entradas.length > 0 ? (
        <div className="space-y-2">
          {entradas.map((scan) => (
            <div
              key={scan.id}
              className="glass-card p-4 flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-dark-100 truncate">
                  {scan.nombreInvitado}
                </p>
                <p className="text-xs text-dark-400">DNI: {scan.dniInvitado}</p>
                <p className="text-xs text-dark-500 mt-0.5">{scan.evento.nombre}</p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <div className="flex items-center gap-1 text-dark-400">
                  <Clock size={12} />
                  <span className="text-xs">
                    {new Date(scan.fechaIngreso).toLocaleTimeString("es-AR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <span className="text-[10px] text-dark-500">
                  {new Date(scan.fechaIngreso).toLocaleDateString("es-AR", {
                    day: "numeric",
                    month: "short",
                  })}
                </span>
              </div>
            </div>
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
          icon={<ClipboardList />}
          title={filtroEvento ? "Sin resultados" : "Sin escaneos"}
          description={
            filtroEvento
              ? "No hay escaneos para este evento"
              : "Tu historial de escaneos aparecerá acá"
          }
        />
      )}
    </div>
  );
}
