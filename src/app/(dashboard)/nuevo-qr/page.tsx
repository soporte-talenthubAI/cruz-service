"use client";

import { useEffect, useState } from "react";
import { QrCode, ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { QRDisplay } from "@/components/qr/QRDisplay";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";

interface Evento {
  id: string;
  nombre: string;
  fecha: string;
  horaApertura: string;
  capacidad: number;
  stats: { total: number };
}

interface EntradaCreada {
  id: string;
  nombreInvitado: string;
  dniInvitado: string;
  emailInvitado: string;
  qrCode: string;
  estado: string;
  evento: { nombre: string; fecha: string; horaApertura: string };
  generadoPor: { nombre: string };
}

export default function NuevoQRPage() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [entradaCreada, setEntradaCreada] = useState<EntradaCreada | null>(null);

  // Form
  const [eventoId, setEventoId] = useState("");
  const [nombre, setNombre] = useState("");
  const [dni, setDni] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    async function fetchEventos() {
      try {
        const res = await fetch("/api/eventos?status=upcoming&limit=50");
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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setCreating(true);

    try {
      const res = await fetch("/api/entradas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombreInvitado: nombre,
          dniInvitado: dni,
          emailInvitado: email,
          eventoId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al crear entrada");
        return;
      }

      setEntradaCreada(data.data);
    } catch {
      setError("Error de conexión");
    } finally {
      setCreating(false);
    }
  };

  const handleReset = () => {
    setEntradaCreada(null);
    setNombre("");
    setDni("");
    setEmail("");
    setEventoId("");
  };

  const selectedEvento = eventos.find((e) => e.id === eventoId);

  if (loading) return <Spinner fullscreen />;

  // Show QR after creation
  if (entradaCreada) {
    return (
      <div className="space-y-4 animate-fade-in">
        <PageHeader title="Entrada creada" />
        <QRDisplay
          eventName={entradaCreada.evento.nombre}
          eventDate={new Date(entradaCreada.evento.fecha).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })}
          eventTime={entradaCreada.evento.horaApertura || ""}
          guestName={entradaCreada.nombreInvitado}
          guestDni={entradaCreada.dniInvitado}
          guestEmail={entradaCreada.emailInvitado}
          generatedBy={entradaCreada.generadoPor.nombre}
          ticketId={entradaCreada.id}
          qrCode={entradaCreada.qrCode}
          status={entradaCreada.estado.toLowerCase() as "pendiente" | "enviado" | "ingresado" | "invalidado"}
          onSendEmail={async () => {
            await fetch(`/api/entradas/${entradaCreada.id}/enviar`, { method: "POST" });
          }}
        />
        <Button
          variant="ghost"
          size="md"
          className="w-full"
          leftIcon={<ArrowLeft size={16} />}
          onClick={handleReset}
        >
          Crear otra entrada
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <PageHeader title="Nueva Entrada" subtitle="Generá una entrada con QR para un invitado" />

      {eventos.length === 0 ? (
        <EmptyState
          icon={<QrCode />}
          title="Sin eventos"
          description="No hay eventos activos para generar entradas"
        />
      ) : (
        <>
          {error && (
            <div className="rounded-xl bg-error/10 border border-error/30 p-3 text-sm text-error animate-fade-in">
              {error}
            </div>
          )}

          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            {/* Event selector */}
            <div>
              <label className="text-sm text-dark-300 mb-2 block">Evento</label>
              <select
                value={eventoId}
                onChange={(e) => setEventoId(e.target.value)}
                required
                className="w-full bg-surface-2 text-dark-200 text-sm rounded-xl px-4 py-3 border border-[rgba(255,255,255,0.06)] outline-none focus:border-gold-500/40 transition-colors"
              >
                <option value="">Seleccionar evento...</option>
                {eventos.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.nombre} — {ev.stats.total}/{ev.capacidad}
                  </option>
                ))}
              </select>
            </div>

            {selectedEvento && selectedEvento.stats.total >= selectedEvento.capacidad && (
              <div className="rounded-xl bg-warning/10 border border-warning/30 p-3 text-sm text-warning">
                Este evento está lleno ({selectedEvento.capacidad}/{selectedEvento.capacidad})
              </div>
            )}

            <Input
              label="Nombre del invitado"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
            <Input
              label="DNI"
              value={dni}
              onChange={(e) => setDni(e.target.value)}
              required
            />
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Button
              type="submit"
              variant="gold"
              size="lg"
              loading={creating}
              className="w-full mt-2"
              leftIcon={<QrCode size={20} />}
            >
              Generar entrada
            </Button>
          </form>
        </>
      )}
    </div>
  );
}
