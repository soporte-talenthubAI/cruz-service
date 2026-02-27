"use client";

import { useEffect, useState } from "react";
import { ClipboardList, Search } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";
import { EventCalendar, type CalendarEvent } from "@/components/ui/EventCalendar";

interface Escaneo {
  id: string;
  nombreInvitado: string;
  dniInvitado: string;
  fechaIngreso: string;
  evento: { nombre: string; fecha: string };
}

export default function HistorialPage() {
  const now = new Date();
  const [entradas, setEntradas] = useState<Escaneo[]>([]);
  const [eventos, setEventos] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingEventos, setLoadingEventos] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filtroEvento, setFiltroEvento] = useState("");
  const [calMonth, setCalMonth] = useState(now.getMonth() + 1);
  const [calYear, setCalYear] = useState(now.getFullYear());

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

  const fetchEventos = async (m: number, y: number) => {
    setLoadingEventos(true);
    try {
      const res = await fetch(`/api/eventos?month=${m}&year=${y}&limit=50`);
      const json = await res.json();
      if (res.ok) setEventos(json.data?.eventos || []);
    } catch {
      // silently fail
    } finally {
      setLoadingEventos(false);
    }
  };

  useEffect(() => {
    async function init() {
      await Promise.all([fetchHistorial(1), fetchEventos(calMonth, calYear)]);
      setLoading(false);
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchEventos(calMonth, calYear);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calMonth, calYear]);

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

      {/* Event calendar filter */}
      <EventCalendar
        eventos={eventos}
        selectedId={filtroEvento}
        onSelect={setFiltroEvento}
        onMonthChange={(m, y) => {
          setCalMonth(m);
          setCalYear(y);
        }}
        loading={loadingEventos}
        allowAll
        allLabel="Todos los eventos"
      />

      {/* Counter */}
      {entradas.length > 0 && (
        <p className="text-xs text-dark-500">
          Mostrando {entradas.length} de {total}
        </p>
      )}

      {/* Table */}
      {entradas.length > 0 ? (
        <>
          <div className="overflow-x-auto rounded-xl border border-[rgba(255,255,255,0.06)]">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[rgba(255,255,255,0.06)] bg-surface-2">
                  <th className="px-4 py-3 text-xs font-medium text-dark-400">Invitado</th>
                  <th className="px-4 py-3 text-xs font-medium text-dark-400 hidden sm:table-cell">DNI</th>
                  <th className="px-4 py-3 text-xs font-medium text-dark-400 hidden md:table-cell">Evento</th>
                  <th className="px-4 py-3 text-xs font-medium text-dark-400">Hora</th>
                  <th className="px-4 py-3 text-xs font-medium text-dark-400 hidden sm:table-cell">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {entradas.map((scan) => (
                  <tr
                    key={scan.id}
                    className="border-b border-[rgba(255,255,255,0.04)] hover:bg-gold-500/5 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-dark-100 truncate max-w-[160px]">{scan.nombreInvitado}</p>
                      <p className="text-xs text-dark-500 sm:hidden">{scan.dniInvitado}</p>
                      <p className="text-xs text-dark-500 md:hidden mt-0.5">{scan.evento.nombre}</p>
                    </td>
                    <td className="px-4 py-3 text-dark-300 hidden sm:table-cell">{scan.dniInvitado}</td>
                    <td className="px-4 py-3 text-dark-300 hidden md:table-cell truncate max-w-[180px]">{scan.evento.nombre}</td>
                    <td className="px-4 py-3 text-dark-300 text-xs whitespace-nowrap">
                      {new Date(scan.fechaIngreso).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="px-4 py-3 text-dark-400 text-xs hidden sm:table-cell whitespace-nowrap">
                      {new Date(scan.fechaIngreso).toLocaleDateString("es-AR", { day: "numeric", month: "short" })}
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
