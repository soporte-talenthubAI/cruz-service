"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Ticket, Calendar, QrCode } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { EventCard } from "@/components/events/EventCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

interface Evento {
  id: string;
  nombre: string;
  fecha: string;
  horaApertura: string;
  tipo: "NORMAL" | "ESPECIAL";
  capacidad: number;
  flyerUrl?: string;
  _count: { entradas: number };
  stats: { total: number };
}

export default function InicioPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const userName = session?.user?.name || "Usuario";

  const [eventos, setEventos] = useState<Evento[]>([]);
  const [totalEntradas, setTotalEntradas] = useState(0);
  const [entradasHoy, setEntradasHoy] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [eventosRes, entradasRes] = await Promise.all([
          fetch("/api/eventos?status=upcoming&limit=5"),
          fetch("/api/entradas?limit=1"),
        ]);
        const eventosData = await eventosRes.json();
        const entradasData = await entradasRes.json();
        if (eventosRes.ok) setEventos(eventosData.data?.eventos || []);
        if (entradasRes.ok) {
          setTotalEntradas(entradasData.data?.meta?.total || 0);
        }

        // Fetch today's entries
        const today = new Date().toISOString().split("T")[0];
        const todayRes = await fetch(`/api/entradas?limit=1`);
        const todayData = await todayRes.json();
        if (todayRes.ok) {
          // Count from total since API filters by RRPP already
          const allEntradas = todayData.data?.entradas || [];
          const todayCount = allEntradas.filter(
            (e: { createdAt: string }) => e.createdAt.startsWith(today)
          ).length;
          setEntradasHoy(todayCount);
        }
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
      <PageHeader
        title={`Hola, ${userName.split(" ")[0]}`}
        subtitle="Tu resumen de actividad"
      />

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          value={entradasHoy}
          label="Entradas hoy"
          icon={<QrCode />}
        />
        <StatCard
          value={totalEntradas}
          label="Mis entradas"
          icon={<Ticket />}
        />
      </div>

      <Button
        variant="gold"
        size="lg"
        className="w-full"
        leftIcon={<QrCode size={20} />}
        onClick={() => router.push("/nuevo-qr")}
      >
        Generar nueva entrada
      </Button>

      <div>
        <h3 className="text-sm font-medium text-dark-300 mb-3">Eventos activos</h3>
        {eventos.length > 0 ? (
          <div className="space-y-3">
            {eventos.map((e) => (
              <EventCard
                key={e.id}
                name={e.nombre}
                date={new Date(e.fecha).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })}
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
            title="Sin eventos"
            description="No hay eventos activos en este momento"
          />
        )}
      </div>
    </div>
  );
}
