"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { formatTime12h } from "@/lib/utils";
import { formatEventDate } from "@/lib/date";
import { EventFormModal } from "@/components/events/EventFormModal";

interface EventoStats {
  total: number;
  pendientes: number;
  enviadas: number;
  ingresadas: number;
  invalidadas: number;
}

interface Evento {
  id: string;
  nombre: string;
  fecha: string;
  horaApertura: string;
  tipo: "NORMAL" | "ESPECIAL";
  capacidad: number;
  flyerUrl?: string;
  activo: boolean;
  _count: { entradas: number };
  stats: EventoStats;
}

type Tab = "upcoming" | "past";

export default function EventosPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("upcoming");
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);

  const fetchEventos = async (pageNum: number, append = false) => {
    if (append) setLoadingMore(true);
    else setLoading(true);

    try {
      const res = await fetch(`/api/eventos?status=${tab}&page=${pageNum}&limit=10`);
      const json = await res.json();
      if (res.ok) {
        const data = json.data;
        if (append) {
          setEventos((prev) => [...prev, ...(data.eventos || [])]);
        } else {
          setEventos(data.eventos || []);
        }
        setTotalPages(data.meta?.totalPages || 1);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    setPage(1);
    setEventos([]);
    fetchEventos(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchEventos(next, true);
  };

  const isPast = tab === "past";

  if (loading) return <Spinner fullscreen />;

  return (
    <div className="space-y-4 animate-fade-in">
      <PageHeader
        title="Eventos"
        actions={
          <Button
            variant="gold"
            size="sm"
            leftIcon={<Plus size={16} />}
            onClick={() => setShowModal(true)}
          >
            Nuevo
          </Button>
        }
      />

      {/* Tabs */}
      <div className="flex gap-2">
        {(["upcoming", "past"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              tab === t
                ? "bg-gold-500/20 text-gold-500 border border-gold-500/40"
                : "bg-surface-2 text-dark-400 border border-transparent"
            }`}
          >
            {t === "upcoming" ? "Próximos" : "Pasados"}
          </button>
        ))}
      </div>

      {/* Event table */}
      {eventos.length > 0 ? (
        <>
          <div className="overflow-x-auto rounded-xl border border-[rgba(255,255,255,0.06)]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgba(255,255,255,0.06)] bg-surface-2">
                  <th className="text-left text-xs font-medium text-dark-400 px-4 py-3">Evento</th>
                  <th className="text-left text-xs font-medium text-dark-400 px-4 py-3 hidden sm:table-cell">Fecha</th>
                  <th className="text-left text-xs font-medium text-dark-400 px-4 py-3">Tipo</th>
                  <th className="text-right text-xs font-medium text-dark-400 px-4 py-3">Entradas</th>
                  <th className="text-right text-xs font-medium text-dark-400 px-4 py-3 hidden sm:table-cell">Ingresados</th>
                  <th className="text-right text-xs font-medium text-dark-400 px-4 py-3 hidden md:table-cell">Capacidad</th>
                </tr>
              </thead>
              <tbody>
                {eventos.map((e) => {
                  const pct = e.capacidad > 0 ? Math.round((e.stats.total / e.capacidad) * 100) : 0;
                  return (
                    <tr
                      key={e.id}
                      onClick={() => router.push(`/eventos/${e.id}`)}
                      className="border-b border-[rgba(255,255,255,0.04)] hover:bg-gold-500/5 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 min-w-0">
                        <p className="font-medium text-dark-100 truncate max-w-[120px] sm:max-w-[180px] lg:max-w-[300px]">{e.nombre}</p>
                        <p className="text-xs text-dark-500 sm:hidden mt-0.5">
                          {formatEventDate(e.fecha, { day: "numeric", month: "short" })} — {formatTime12h(e.horaApertura)}
                        </p>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <p className="text-dark-200 text-xs whitespace-nowrap">
                          {formatEventDate(e.fecha, { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                        <p className="text-dark-500 text-xs">{formatTime12h(e.horaApertura)}</p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={e.tipo === "ESPECIAL" ? "especial" : "normal"}>
                          {e.tipo}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-dark-200 font-medium">{e.stats.total}</span>
                        <span className="text-dark-500 text-xs ml-1">/ {e.capacidad}</span>
                        <span className={`text-xs ml-1 ${pct >= 90 ? "text-error" : pct >= 70 ? "text-warning" : "text-dark-500"}`}>
                          ({pct}%)
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right hidden sm:table-cell">
                        <span className="text-success font-medium">{e.stats.ingresadas}</span>
                      </td>
                      <td className="px-4 py-3 text-right hidden md:table-cell text-dark-400">
                        {e.capacidad}
                      </td>
                    </tr>
                  );
                })}
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
          icon={<Calendar />}
          title={isPast ? "Sin eventos pasados" : "Sin eventos próximos"}
          description={isPast ? "No hay eventos finalizados" : "Creá tu primer evento"}
          actionLabel={isPast ? undefined : "Crear evento"}
          onAction={isPast ? undefined : () => setShowModal(true)}
        />
      )}

      <EventFormModal
        open={showModal}
        mode="create"
        onClose={() => setShowModal(false)}
        onSuccess={() => {
          setPage(1);
          fetchEventos(1);
        }}
      />
    </div>
  );
}
