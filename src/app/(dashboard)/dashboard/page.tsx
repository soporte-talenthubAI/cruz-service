"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Ticket, Users, Calendar, QrCode } from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import { EventCard } from "@/components/events/EventCard";
import { QRScanner } from "@/components/qr/QRScanner";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/layout/PageHeader";

interface Stats {
  eventos: { total: number; activos: number };
  entradas: {
    total: number;
    hoy: number;
    pendientes: number;
    enviadas: number;
    ingresadas: number;
    invalidadas: number;
  };
  usuarios: { total: number; admins: number; rrpp: number; porteros: number };
}

interface Evento {
  id: string;
  nombre: string;
  fecha: string;
  horaApertura: string;
  tipo: "NORMAL" | "ESPECIAL";
  capacidad: number;
  flyerUrl?: string;
  _count: { entradas: number };
}

type ScanResult =
  | { type: "valid"; guestName: string }
  | { type: "invalid"; reason: string }
  | { type: "used"; guestName: string }
  | null;

function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, eventosRes] = await Promise.all([
          fetch("/api/stats"),
          fetch("/api/eventos"),
        ]);
        const statsData = await statsRes.json();
        const eventosData = await eventosRes.json();
        if (statsRes.ok) setStats(statsData.data);
        if (eventosRes.ok) setEventos(eventosData.data?.slice(0, 3) || []);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <Spinner fullscreen />;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Dashboard" subtitle="Panel de control" />

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          value={stats?.eventos.activos ?? 0}
          label="Eventos activos"
          icon={<Calendar />}
        />
        <StatCard
          value={stats?.entradas.total ?? 0}
          label="Entradas totales"
          icon={<Ticket />}
        />
        <StatCard
          value={stats?.entradas.hoy ?? 0}
          label="Ingresos hoy"
          icon={<QrCode />}
        />
        <StatCard
          value={stats?.usuarios.total ?? 0}
          label="Usuarios"
          icon={<Users />}
        />
      </div>

      {stats && (
        <div className="glass-card p-4">
          <h3 className="text-sm font-medium text-dark-300 mb-3">Entradas por estado</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-dark-400">Pendientes</span>
              <span className="text-sm font-semibold text-dark-200">{stats.entradas.pendientes}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-dark-400">Enviadas</span>
              <span className="text-sm font-semibold text-dark-200">{stats.entradas.enviadas}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-dark-400">Ingresadas</span>
              <span className="text-sm font-semibold text-success">{stats.entradas.ingresadas}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-dark-400">Invalidadas</span>
              <span className="text-sm font-semibold text-error">{stats.entradas.invalidadas}</span>
            </div>
          </div>
        </div>
      )}

      <div>
        <h3 className="text-sm font-medium text-dark-300 mb-3">Últimos eventos</h3>
        {eventos.length > 0 ? (
          <div className="space-y-3">
            {eventos.map((e) => (
              <EventCard
                key={e.id}
                name={e.nombre}
                date={new Date(e.fecha).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" })}
                time={e.horaApertura}
                type={e.tipo.toLowerCase() as "normal" | "especial"}
                capacity={e.capacidad}
                ticketsSold={e._count.entradas}
                flyerUrl={e.flyerUrl}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Calendar />}
            title="Sin eventos"
            description="No hay eventos creados aún"
          />
        )}
      </div>
    </div>
  );
}

function PorteroDashboard() {
  const [scanResult, setScanResult] = useState<ScanResult>(null);

  const handleScan = useCallback(async (qrData: string) => {
    try {
      const res = await fetch(`/api/entradas/${encodeURIComponent(qrData)}/validar`, {
        method: "POST",
      });
      const data = await res.json();

      if (res.status === 409) {
        setScanResult({ type: "used", guestName: data.data?.entrada?.nombreInvitado || "Desconocido" });
      } else if (res.ok) {
        setScanResult({ type: "valid", guestName: data.data?.entrada?.nombreInvitado || "Invitado" });
      } else {
        setScanResult({ type: "invalid", reason: data.error || "QR inválido" });
      }
    } catch {
      setScanResult({ type: "invalid", reason: "Error de conexión" });
    }
  }, []);

  return (
    <QRScanner
      onScan={handleScan}
      scanResult={scanResult}
      onReset={() => setScanResult(null)}
    />
  );
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const role = (session?.user as { role?: string })?.role?.toLowerCase();

  if (role === "portero") {
    return <PorteroDashboard />;
  }

  return <AdminDashboard />;
}
