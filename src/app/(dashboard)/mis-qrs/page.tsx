"use client";

import { useEffect, useState } from "react";
import { Ticket, Search } from "lucide-react";
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

const estadoVariant: Record<string, "pendiente" | "enviado" | "ingresado" | "invalidado"> = {
  PENDIENTE: "pendiente",
  ENVIADO: "enviado",
  INGRESADO: "ingresado",
  INVALIDADO: "invalidado",
};

export default function MisQRsPage() {
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

  useEffect(() => {
    async function init() {
      await fetchEntradas(1);
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

  return (
    <div className="space-y-4 animate-fade-in">
      <PageHeader
        title="Mis Entradas"
        subtitle={`${total} entrada${total !== 1 ? "s" : ""} generada${total !== 1 ? "s" : ""}`}
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
                  <th className="px-4 py-3 text-xs font-medium text-dark-400">Estado</th>
                  <th className="px-4 py-3 text-xs font-medium text-dark-400 hidden sm:table-cell">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {entradas.map((entrada) => (
                  <tr
                    key={entrada.id}
                    onClick={() => setSelected(entrada)}
                    className="border-b border-[rgba(255,255,255,0.04)] hover:bg-gold-500/5 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-dark-100 truncate max-w-[160px]">{entrada.nombreInvitado}</p>
                      <p className="text-xs text-dark-500 sm:hidden">{entrada.dniInvitado}</p>
                      <p className="text-xs text-dark-500 md:hidden mt-0.5">{entrada.evento.nombre}</p>
                    </td>
                    <td className="px-4 py-3 text-dark-300 hidden sm:table-cell">{entrada.dniInvitado}</td>
                    <td className="px-4 py-3 text-dark-300 hidden md:table-cell truncate max-w-[180px]">{entrada.evento.nombre}</td>
                    <td className="px-4 py-3">
                      <Badge variant={estadoVariant[entrada.estado]}>{entrada.estado}</Badge>
                    </td>
                    <td className="px-4 py-3 text-dark-400 text-xs hidden sm:table-cell whitespace-nowrap">
                      {new Date(entrada.createdAt).toLocaleDateString("es-AR", { day: "numeric", month: "short" })}
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
          icon={<Ticket />}
          title={filtroEstado || searchQuery ? "Sin resultados" : "Sin entradas"}
          description={filtroEstado || searchQuery ? "No hay entradas con esos filtros" : "Generá tu primera entrada desde Nuevo QR"}
        />
      )}

      {/* Detail modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title="Detalle">
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
