"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { DollarSign, FileSpreadsheet, FileText, Printer, Filter } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { EventCalendar, type CalendarEvent } from "@/components/ui/EventCalendar";
import { exportLiquidacionesToExcel, exportLiquidacionesToPdf, exportRrppDetailPdf } from "@/lib/export";

interface RrppUser {
  id: string;
  nombre: string;
}

interface Liquidacion {
  rrpp: { id: string; nombre: string; email: string };
  montoPorQr: number;
  totalGeneradas: number;
  totalIngresadas: number;
  montoAPagar: number;
}

interface LiquidacionData {
  evento: { nombre: string; fecha: string };
  liquidaciones: Liquidacion[];
  totales: { totalIngresadas: number; montoTotal: number };
}

export default function LiquidacionesPage() {
  const searchParams = useSearchParams();
  const initialEventoId = searchParams.get("eventoId") || "";
  const now = new Date();

  const [eventos, setEventos] = useState<CalendarEvent[]>([]);
  const [rrppUsers, setRrppUsers] = useState<RrppUser[]>([]);
  const [eventoId, setEventoId] = useState(initialEventoId);
  const [data, setData] = useState<LiquidacionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingEventos, setLoadingEventos] = useState(false);
  const [loadingLiq, setLoadingLiq] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(now.getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [selectedRrppId, setSelectedRrppId] = useState("");

  useEffect(() => {
    async function fetchEventos() {
      setLoadingEventos(true);
      try {
        const res = await fetch(`/api/eventos?month=${currentMonth}&year=${currentYear}&limit=50`);
        const json = await res.json();
        if (res.ok) setEventos(json.data?.eventos || []);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
        setLoadingEventos(false);
      }
    }
    fetchEventos();
  }, [currentMonth, currentYear]);

  useEffect(() => {
    async function fetchRrppUsers() {
      try {
        const res = await fetch("/api/usuarios");
        const json = await res.json();
        if (res.ok) {
          setRrppUsers(
            (json.data || []).filter(
              (u: { rol: string; activo: boolean }) => u.rol === "RRPP" && u.activo
            )
          );
        }
      } catch {
        // silently fail
      }
    }
    fetchRrppUsers();
  }, []);

  const fetchLiquidaciones = useCallback(async (id: string) => {
    if (!id) {
      setData(null);
      return;
    }
    setLoadingLiq(true);
    try {
      const res = await fetch(`/api/liquidaciones?eventoId=${id}`);
      const json = await res.json();
      if (res.ok) setData(json.data);
    } catch {
      // silently fail
    } finally {
      setLoadingLiq(false);
    }
  }, []);

  useEffect(() => {
    fetchLiquidaciones(eventoId);
  }, [eventoId, fetchLiquidaciones]);

  // Reset RRPP filter when event changes
  useEffect(() => {
    setSelectedRrppId("");
  }, [eventoId]);

  // Filtered liquidaciones based on selected RRPP
  const filtered = useMemo(() => {
    if (!data) return null;
    const liqs = selectedRrppId
      ? data.liquidaciones.filter((l) => l.rrpp.id === selectedRrppId)
      : data.liquidaciones;
    const totales = {
      totalIngresadas: liqs.reduce((sum, l) => sum + l.totalIngresadas, 0),
      montoTotal: liqs.reduce((sum, l) => sum + l.montoAPagar, 0),
    };
    return { liquidaciones: liqs, totales };
  }, [data, selectedRrppId]);

  const handleExport = async (format: "excel" | "pdf") => {
    if (!data || !filtered) return;
    setExporting(true);
    try {
      const selectedName = selectedRrppId
        ? filtered.liquidaciones[0]?.rrpp.nombre.replace(/\s+/g, "-").toLowerCase()
        : data.evento.nombre.replace(/\s+/g, "-").toLowerCase();
      const filename = `liquidacion-${selectedName}-${new Date().toISOString().slice(0, 10)}`;
      if (format === "excel") {
        await exportLiquidacionesToExcel(filtered.liquidaciones, data.evento.nombre, filtered.totales, `${filename}.xlsx`);
      } else {
        await exportLiquidacionesToPdf(filtered.liquidaciones, data.evento.nombre, filtered.totales, `${filename}.pdf`);
      }
    } catch {
      // silently fail
    } finally {
      setExporting(false);
    }
  };

  if (loading) return <Spinner fullscreen />;

  return (
    <div className="space-y-4 animate-fade-in">
      <PageHeader
        title="Liquidaciones"
        subtitle="Cálculo de pagos a RRPP"
        actions={
          data ? (
            <div className="flex gap-2">
              <Button
                variant="surface"
                size="sm"
                leftIcon={<FileSpreadsheet size={14} />}
                onClick={() => handleExport("excel")}
                disabled={exporting}
              >
                Excel
              </Button>
              <Button
                variant="surface"
                size="sm"
                leftIcon={<FileText size={14} />}
                onClick={() => handleExport("pdf")}
                disabled={exporting}
              >
                PDF
              </Button>
            </div>
          ) : undefined
        }
      />

      <div className="lg:grid lg:grid-cols-[320px_1fr] lg:gap-6 space-y-4 lg:space-y-0">
      {/* Event calendar selector */}
      <div>
        <label className="text-sm text-dark-300 mb-2 block">Evento</label>
        <EventCalendar
          eventos={eventos}
          selectedId={eventoId}
          onSelect={setEventoId}
          onMonthChange={(m, y) => {
            setCurrentMonth(m);
            setCurrentYear(y);
          }}
          loading={loadingEventos}
        />
      </div>

      <div className="space-y-4">
      {loadingLiq && <Spinner />}

      {!loadingLiq && data && filtered && (
        <>
          {/* RRPP filter */}
          {rrppUsers.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <Filter size={14} className="text-dark-400 shrink-0" />
              <button
                onClick={() => setSelectedRrppId("")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  selectedRrppId === ""
                    ? "bg-gold-500/20 text-gold-500 border border-gold-500/30"
                    : "bg-surface-2 text-dark-400 border border-[rgba(255,255,255,0.06)] hover:text-dark-200"
                }`}
              >
                Todos
              </button>
              {rrppUsers.map((u) => (
                <button
                  key={u.id}
                  onClick={() => setSelectedRrppId(u.id === selectedRrppId ? "" : u.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    selectedRrppId === u.id
                      ? "bg-gold-500/20 text-gold-500 border border-gold-500/30"
                      : "bg-surface-2 text-dark-400 border border-[rgba(255,255,255,0.06)] hover:text-dark-200"
                  }`}
                >
                  {u.nombre}
                </button>
              ))}
            </div>
          )}

          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="glass-card p-4 text-center">
              <p className="text-2xl font-bold text-gold-500">
                ${filtered.totales.montoTotal.toLocaleString("es-AR")}
              </p>
              <p className="text-xs text-dark-400 mt-1">Total a pagar</p>
            </div>
            <div className="glass-card p-4 text-center">
              <p className="text-2xl font-bold text-dark-100">
                {filtered.totales.totalIngresadas}
              </p>
              <p className="text-xs text-dark-400 mt-1">QRs ingresados</p>
            </div>
          </div>

          {/* Table */}
          {filtered.liquidaciones.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-[rgba(255,255,255,0.06)]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[rgba(255,255,255,0.06)] bg-surface-2">
                    <th className="text-left text-xs font-medium text-dark-400 px-4 py-3">RRPP</th>
                    <th className="text-right text-xs font-medium text-dark-400 px-4 py-3">$/QR</th>
                    <th className="text-right text-xs font-medium text-dark-400 px-4 py-3 hidden sm:table-cell">Generadas</th>
                    <th className="text-right text-xs font-medium text-dark-400 px-4 py-3">Ingresadas</th>
                    <th className="text-right text-xs font-medium text-dark-400 px-4 py-3">A pagar</th>
                    <th className="text-center text-xs font-medium text-dark-400 px-2 py-3 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.liquidaciones.map((l) => (
                    <tr
                      key={l.rrpp.id}
                      className="border-b border-[rgba(255,255,255,0.04)] hover:bg-gold-500/5 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <p className="text-dark-100 font-medium">{l.rrpp.nombre}</p>
                        <p className="text-xs text-dark-500">{l.rrpp.email}</p>
                      </td>
                      <td className="px-4 py-3 text-right text-dark-300">
                        ${l.montoPorQr}
                      </td>
                      <td className="px-4 py-3 text-right text-dark-300 hidden sm:table-cell">
                        {l.totalGeneradas}
                      </td>
                      <td className="px-4 py-3 text-right text-dark-200 font-medium">
                        {l.totalIngresadas}
                      </td>
                      <td className="px-4 py-3 text-right text-gold-500 font-bold">
                        ${l.montoAPagar.toLocaleString("es-AR")}
                      </td>
                      <td className="px-2 py-3 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            exportRrppDetailPdf(
                              l.rrpp.nombre,
                              l.rrpp.email,
                              data.evento.nombre,
                              new Date(data.evento.fecha).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" }),
                              l.montoPorQr,
                              l.totalGeneradas,
                              l.totalIngresadas,
                              l.montoAPagar,
                              `recibo-${l.rrpp.nombre.replace(/\s+/g, "-").toLowerCase()}.pdf`
                            );
                          }}
                          className="p-1.5 rounded-lg hover:bg-gold-500/10 text-dark-400 hover:text-gold-500 transition-colors"
                          title="Imprimir recibo"
                        >
                          <Printer size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {/* Totals row */}
                  <tr className="bg-surface-2 border-t border-[rgba(255,255,255,0.08)]">
                    <td className="px-4 py-3 text-dark-200 font-bold">TOTAL</td>
                    <td className="px-4 py-3" />
                    <td className="px-4 py-3 hidden sm:table-cell" />
                    <td className="px-4 py-3 text-right text-dark-200 font-bold">
                      {filtered.totales.totalIngresadas}
                    </td>
                    <td className="px-4 py-3 text-right text-gold-500 font-bold text-lg">
                      ${filtered.totales.montoTotal.toLocaleString("es-AR")}
                    </td>
                    <td className="px-2 py-3" />
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon={<DollarSign />}
              title="Sin RRPP asignados"
              description="Este evento no tiene RRPP asignados para liquidar"
            />
          )}
        </>
      )}

      {!loadingLiq && !data && eventoId === "" && (
        <EmptyState
          icon={<DollarSign />}
          title="Seleccioná un evento"
          description="Elegí un evento para ver las liquidaciones de RRPP"
        />
      )}
      </div>
      </div>
    </div>
  );
}
