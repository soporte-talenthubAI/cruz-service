"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { DollarSign, FileSpreadsheet, FileText } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { exportLiquidacionesToExcel, exportLiquidacionesToPdf } from "@/lib/export";

interface Evento {
  id: string;
  nombre: string;
  fecha: string;
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

  const [eventos, setEventos] = useState<Evento[]>([]);
  const [eventoId, setEventoId] = useState(initialEventoId);
  const [data, setData] = useState<LiquidacionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingLiq, setLoadingLiq] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    async function fetchEventos() {
      try {
        const res = await fetch("/api/eventos?status=all&limit=50");
        const json = await res.json();
        if (res.ok) setEventos(json.data?.eventos || []);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchEventos();
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
    if (eventoId) fetchLiquidaciones(eventoId);
  }, [eventoId, fetchLiquidaciones]);

  const handleExport = async (format: "excel" | "pdf") => {
    if (!data) return;
    setExporting(true);
    try {
      const filename = `liquidacion-${data.evento.nombre.replace(/\s+/g, "-").toLowerCase()}-${new Date().toISOString().slice(0, 10)}`;
      if (format === "excel") {
        await exportLiquidacionesToExcel(data.liquidaciones, data.evento.nombre, data.totales, `${filename}.xlsx`);
      } else {
        await exportLiquidacionesToPdf(data.liquidaciones, data.evento.nombre, data.totales, `${filename}.pdf`);
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

      {/* Event selector */}
      <div>
        <label className="text-sm text-dark-300 mb-2 block">Evento</label>
        <select
          value={eventoId}
          onChange={(e) => setEventoId(e.target.value)}
          className="w-full bg-surface-2 text-dark-200 text-sm rounded-xl px-4 py-3 border border-[rgba(255,255,255,0.06)] outline-none focus:border-gold-500/40 transition-colors"
        >
          <option value="">Seleccionar evento...</option>
          {eventos.map((ev) => (
            <option key={ev.id} value={ev.id}>
              {ev.nombre} — {new Date(ev.fecha).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" })}
            </option>
          ))}
        </select>
      </div>

      {loadingLiq && <Spinner />}

      {!loadingLiq && data && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="glass-card p-4 text-center">
              <p className="text-2xl font-bold text-gold-500">
                ${data.totales.montoTotal.toLocaleString("es-AR")}
              </p>
              <p className="text-xs text-dark-400 mt-1">Total a pagar</p>
            </div>
            <div className="glass-card p-4 text-center">
              <p className="text-2xl font-bold text-dark-100">
                {data.totales.totalIngresadas}
              </p>
              <p className="text-xs text-dark-400 mt-1">QRs ingresados</p>
            </div>
          </div>

          {/* Table */}
          {data.liquidaciones.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-[rgba(255,255,255,0.06)]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[rgba(255,255,255,0.06)] bg-surface-2">
                    <th className="text-left text-xs font-medium text-dark-400 px-4 py-3">RRPP</th>
                    <th className="text-right text-xs font-medium text-dark-400 px-4 py-3">$/QR</th>
                    <th className="text-right text-xs font-medium text-dark-400 px-4 py-3">Generadas</th>
                    <th className="text-right text-xs font-medium text-dark-400 px-4 py-3">Ingresadas</th>
                    <th className="text-right text-xs font-medium text-dark-400 px-4 py-3">A pagar</th>
                  </tr>
                </thead>
                <tbody>
                  {data.liquidaciones.map((l) => (
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
                      <td className="px-4 py-3 text-right text-dark-300">
                        {l.totalGeneradas}
                      </td>
                      <td className="px-4 py-3 text-right text-dark-200 font-medium">
                        {l.totalIngresadas}
                      </td>
                      <td className="px-4 py-3 text-right text-gold-500 font-bold">
                        ${l.montoAPagar.toLocaleString("es-AR")}
                      </td>
                    </tr>
                  ))}
                  {/* Totals row */}
                  <tr className="bg-surface-2 border-t border-[rgba(255,255,255,0.08)]">
                    <td className="px-4 py-3 text-dark-200 font-bold">TOTAL</td>
                    <td className="px-4 py-3" />
                    <td className="px-4 py-3" />
                    <td className="px-4 py-3 text-right text-dark-200 font-bold">
                      {data.totales.totalIngresadas}
                    </td>
                    <td className="px-4 py-3 text-right text-gold-500 font-bold text-lg">
                      ${data.totales.montoTotal.toLocaleString("es-AR")}
                    </td>
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
  );
}
