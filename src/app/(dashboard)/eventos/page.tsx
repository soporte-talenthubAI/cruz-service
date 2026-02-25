"use client";

import { useEffect, useState } from "react";
import { Calendar, Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { EventCard } from "@/components/events/EventCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";

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
}

export default function EventosPage() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [nombre, setNombre] = useState("");
  const [fecha, setFecha] = useState("");
  const [horaApertura, setHoraApertura] = useState("");
  const [tipo, setTipo] = useState<"NORMAL" | "ESPECIAL">("NORMAL");
  const [capacidad, setCapacidad] = useState("");

  const fetchEventos = async () => {
    try {
      const res = await fetch("/api/eventos");
      const data = await res.json();
      if (res.ok) setEventos(data.data || []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventos();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setCreating(true);

    try {
      const res = await fetch("/api/eventos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre,
          fecha,
          horaApertura,
          tipo,
          capacidad: Number(capacidad),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al crear evento");
        return;
      }

      setShowModal(false);
      setNombre("");
      setFecha("");
      setHoraApertura("");
      setTipo("NORMAL");
      setCapacidad("");
      fetchEventos();
    } catch {
      setError("Error de conexión");
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <Spinner fullscreen />;

  return (
    <div className="space-y-4 animate-fade-in">
      <PageHeader
        title="Eventos"
        subtitle={`${eventos.length} evento${eventos.length !== 1 ? "s" : ""}`}
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
              ticketsSold={e._count.entradas}
              flyerUrl={e.flyerUrl}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Calendar />}
          title="Sin eventos"
          description="Creá tu primer evento para empezar a generar entradas"
          actionLabel="Crear evento"
          onAction={() => setShowModal(true)}
        />
      )}

      {/* Create event modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Nuevo evento">
        {error && (
          <div className="mb-4 rounded-xl bg-error/10 border border-error/30 p-3 text-sm text-error">
            {error}
          </div>
        )}
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <Input
            label="Nombre del evento"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
          />
          <Input
            label="Fecha"
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            required
          />
          <Input
            label="Hora de apertura"
            type="time"
            value={horaApertura}
            onChange={(e) => setHoraApertura(e.target.value)}
            required
          />
          <Input
            label="Capacidad"
            type="number"
            value={capacidad}
            onChange={(e) => setCapacidad(e.target.value)}
            required
          />
          <div>
            <label className="text-sm text-dark-300 mb-2 block">Tipo</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setTipo("NORMAL")}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                  tipo === "NORMAL"
                    ? "bg-gold-500/20 text-gold-500 border border-gold-500/40"
                    : "bg-surface-2 text-dark-400 border border-transparent"
                }`}
              >
                Normal
              </button>
              <button
                type="button"
                onClick={() => setTipo("ESPECIAL")}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                  tipo === "ESPECIAL"
                    ? "bg-gold-500/20 text-gold-500 border border-gold-500/40"
                    : "bg-surface-2 text-dark-400 border border-transparent"
                }`}
              >
                Especial
              </button>
            </div>
          </div>
          <Button type="submit" variant="gold" size="lg" loading={creating} className="w-full mt-2">
            Crear evento
          </Button>
        </form>
      </Modal>
    </div>
  );
}
