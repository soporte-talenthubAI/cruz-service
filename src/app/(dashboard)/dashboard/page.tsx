"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Ticket, Users, Calendar, QrCode, ScanLine, Clock, Shield, UserPlus } from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import { EventCard } from "@/components/events/EventCard";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";

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

interface EventoStats {
  total: number;
  ingresadas: number;
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
  stats: EventoStats;
}

interface PorteroStats {
  estaNoche: number;
  totalValidadas: number;
  eventoActivo: {
    id: string;
    nombre: string;
    fecha: string;
    horaApertura: string;
    capacidad: number;
    total: number;
    ingresadas: number;
    pendientes: number;
  } | null;
  ultimosEscaneos: {
    id: string;
    nombreInvitado: string;
    dniInvitado: string;
    fechaIngreso: string;
    evento: { nombre: string };
  }[];
}

function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, eventosRes] = await Promise.all([
          fetch("/api/stats"),
          fetch("/api/eventos?status=upcoming&limit=3"),
        ]);
        const statsData = await statsRes.json();
        const eventosData = await eventosRes.json();
        if (statsRes.ok) setStats(statsData.data);
        if (eventosRes.ok) setEventos(eventosData.data?.eventos || []);
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

      <Button
        variant="surface"
        size="md"
        className="w-full"
        leftIcon={<UserPlus size={18} />}
        onClick={() => router.push("/usuarios")}
      >
        Gestionar equipo
      </Button>

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
        <h3 className="text-sm font-medium text-dark-300 mb-3">Próximos eventos</h3>
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
                ticketsSold={e.stats.total}
                flyerUrl={e.flyerUrl}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Calendar />}
            title="Sin eventos próximos"
            description="No hay eventos programados"
          />
        )}
      </div>
    </div>
  );
}

function PorteroDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<PorteroStats | null>(null);
  const [loading, setLoading] = useState(true);
  const userName = session?.user?.name || "Portero";

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/portero/stats");
        const json = await res.json();
        if (res.ok) setStats(json.data);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <Spinner fullscreen />;

  const ev = stats?.eventoActivo;

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title={`Hola, ${userName.split(" ")[0]}`}
        subtitle={
          <span className="inline-flex items-center gap-1.5">
            <Shield size={14} className="text-gold-500" />
            <span>Seguridad</span>
          </span>
        }
      />

      {/* Scan button */}
      <Button
        variant="gold"
        size="lg"
        className="w-full"
        leftIcon={<ScanLine size={20} />}
        onClick={() => router.push("/scanner")}
      >
        Escanear QR
      </Button>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          value={stats?.estaNoche ?? 0}
          label="Escaneos esta noche"
          icon={<QrCode />}
        />
        <StatCard
          value={stats?.totalValidadas ?? 0}
          label="Total validadas"
          icon={<Ticket />}
        />
      </div>

      {/* Active event */}
      {ev && (
        <div className="glass-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-dark-300">Evento activo</h3>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-success/20 text-success">
              EN CURSO
            </span>
          </div>
          <div>
            <p className="text-base font-semibold text-dark-100">{ev.nombre}</p>
            <p className="text-xs text-dark-400 mt-0.5">
              {new Date(ev.fecha).toLocaleDateString("es-AR", { day: "numeric", month: "long" })} — {ev.horaApertura}
            </p>
          </div>
          {/* Progress bar */}
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-dark-400">Ingresados</span>
              <span className="text-dark-200 font-medium">
                {ev.ingresadas}/{ev.total}
                {ev.total > 0 && (
                  <span className="text-dark-500 ml-1">
                    ({Math.round((ev.ingresadas / ev.total) * 100)}%)
                  </span>
                )}
              </span>
            </div>
            <div className="h-2 bg-dark-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-gold-600 to-gold-400 rounded-full transition-all duration-500"
                style={{ width: `${ev.total > 0 ? (ev.ingresadas / ev.total) * 100 : 0}%` }}
              />
            </div>
            <p className="text-[10px] text-dark-500 mt-1">
              {ev.pendientes} pendiente{ev.pendientes !== 1 ? "s" : ""} de ingreso
            </p>
          </div>
        </div>
      )}

      {/* Recent scans */}
      {stats?.ultimosEscaneos && stats.ultimosEscaneos.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-dark-300 mb-3">Últimos escaneos</h3>
          <div className="space-y-2">
            {stats.ultimosEscaneos.map((scan) => (
              <div
                key={scan.id}
                className="glass-card p-3 flex items-center justify-between"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-dark-100 truncate">{scan.nombreInvitado}</p>
                  <p className="text-xs text-dark-500">{scan.evento.nombre}</p>
                </div>
                <div className="flex items-center gap-1.5 text-dark-400 shrink-0">
                  <Clock size={12} />
                  <span className="text-xs">
                    {new Date(scan.fechaIngreso).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!ev && (!stats?.ultimosEscaneos || stats.ultimosEscaneos.length === 0) && (
        <EmptyState
          icon={<ScanLine />}
          title="Sin actividad"
          description="Empezá a escanear QRs para ver tu actividad acá"
        />
      )}
    </div>
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
