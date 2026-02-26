"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Plus, Check } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";

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

interface RrppOption {
  id: string;
  nombre: string;
  email: string;
}

interface RrppAsignado {
  usuarioId: string;
  montoPorQr: number;
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
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [nombre, setNombre] = useState("");
  const [fecha, setFecha] = useState("");
  const [horaApertura, setHoraApertura] = useState("");
  const [tipo, setTipo] = useState<"NORMAL" | "ESPECIAL">("NORMAL");
  const [capacidad, setCapacidad] = useState("");

  // Branding
  const [brandingBgUrl, setBrandingBgUrl] = useState("");
  const [brandingColorPrimary, setBrandingColorPrimary] = useState("#C5A059");
  const [brandingColorText, setBrandingColorText] = useState("#FFFFFF");
  const [uploading, setUploading] = useState(false);

  // Branding gallery
  const [brandingGallery, setBrandingGallery] = useState<{ url: string; usedIn: string }[]>([]);

  // RRPP assignment
  const [rrppList, setRrppList] = useState<RrppOption[]>([]);
  const [rrppAsignados, setRrppAsignados] = useState<RrppAsignado[]>([]);

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

  const fetchRrpp = async () => {
    try {
      const res = await fetch("/api/usuarios/rrpp");
      const json = await res.json();
      if (res.ok) setRrppList(json.data || []);
    } catch {
      // silently fail
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

  const handleUploadBranding = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const json = await res.json();
      if (res.ok) setBrandingBgUrl(json.data.url);
      else setError(json.error || "Error al subir imagen");
    } catch {
      setError("Error al subir imagen");
    } finally {
      setUploading(false);
    }
  };

  const fetchBrandingGallery = async () => {
    try {
      const res = await fetch("/api/branding");
      const json = await res.json();
      if (res.ok) setBrandingGallery(json.data || []);
    } catch {
      // silently fail
    }
  };

  const openModal = () => {
    setShowModal(true);
    setError("");
    fetchRrpp();
    fetchBrandingGallery();
  };

  const toggleRrpp = (id: string) => {
    setRrppAsignados((prev) => {
      const exists = prev.find((r) => r.usuarioId === id);
      if (exists) return prev.filter((r) => r.usuarioId !== id);
      return [...prev, { usuarioId: id, montoPorQr: 0 }];
    });
  };

  const updateMonto = (usuarioId: string, monto: number) => {
    setRrppAsignados((prev) =>
      prev.map((r) => (r.usuarioId === usuarioId ? { ...r, montoPorQr: monto } : r))
    );
  };

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
          rrppAsignados,
          brandingBgUrl: brandingBgUrl || undefined,
          brandingColorPrimary: brandingColorPrimary !== "#C5A059" ? brandingColorPrimary : undefined,
          brandingColorText: brandingColorText !== "#FFFFFF" ? brandingColorText : undefined,
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
      setRrppAsignados([]);
      setBrandingBgUrl("");
      setBrandingColorPrimary("#C5A059");
      setBrandingColorText("#FFFFFF");
      setPage(1);
      fetchEventos(1);
    } catch {
      setError("Error de conexión");
    } finally {
      setCreating(false);
    }
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
            onClick={openModal}
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
                      <td className="px-4 py-3">
                        <p className="font-medium text-dark-100 truncate max-w-[180px]">{e.nombre}</p>
                        <p className="text-xs text-dark-500 sm:hidden mt-0.5">
                          {new Date(e.fecha).toLocaleDateString("es-AR", { day: "numeric", month: "short" })} — {e.horaApertura}
                        </p>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <p className="text-dark-200 text-xs whitespace-nowrap">
                          {new Date(e.fecha).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                        <p className="text-dark-500 text-xs">{e.horaApertura}</p>
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
          onAction={isPast ? undefined : openModal}
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

          {/* Branding */}
          <div>
            <label className="text-sm text-dark-300 mb-2 block">Branding de entrada</label>
            <div className="space-y-3">
              {/* Gallery of existing images */}
              {brandingGallery.length > 0 && !brandingBgUrl && (
                <div>
                  <label className="text-xs text-dark-400 mb-1.5 block">Imágenes anteriores</label>
                  <div className="grid grid-cols-3 gap-2">
                    {brandingGallery.map((img) => (
                      <button
                        key={img.url}
                        type="button"
                        onClick={() => setBrandingBgUrl(img.url)}
                        className="relative rounded-xl overflow-hidden h-16 border border-transparent hover:border-gold-500/50 transition-colors group"
                      >
                        <img src={img.url} alt="" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-[10px] text-white font-medium">Usar</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Image upload */}
              <div>
                <label className="text-xs text-dark-400 mb-1 block">
                  {brandingGallery.length > 0 && !brandingBgUrl ? "O subir nueva imagen" : "Imagen de fondo"}
                </label>
                <div className="flex items-center gap-3">
                  <label className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-dashed cursor-pointer transition-colors ${
                    brandingBgUrl
                      ? "border-gold-500/40 bg-gold-500/5"
                      : "border-dark-600 hover:border-dark-500 bg-surface-2"
                  }`}>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUploadBranding(file);
                      }}
                    />
                    <span className="text-xs text-dark-400">
                      {uploading ? "Subiendo..." : brandingBgUrl ? "Imagen cargada" : "Subir imagen"}
                    </span>
                  </label>
                  {brandingBgUrl && (
                    <button
                      type="button"
                      onClick={() => setBrandingBgUrl("")}
                      className="text-xs text-error hover:text-error/80"
                    >
                      Quitar
                    </button>
                  )}
                </div>
                {brandingBgUrl && (
                  <div className="mt-2 rounded-xl overflow-hidden h-20">
                    <img src={brandingBgUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
              {/* Color pickers */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-dark-400 mb-1 block">Color primario</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={brandingColorPrimary}
                      onChange={(e) => setBrandingColorPrimary(e.target.value)}
                      className="w-8 h-8 rounded-lg border-0 cursor-pointer bg-transparent"
                    />
                    <span className="text-xs text-dark-500 font-mono">{brandingColorPrimary}</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-dark-400 mb-1 block">Color texto</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={brandingColorText}
                      onChange={(e) => setBrandingColorText(e.target.value)}
                      className="w-8 h-8 rounded-lg border-0 cursor-pointer bg-transparent"
                    />
                    <span className="text-xs text-dark-500 font-mono">{brandingColorText}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RRPP Assignment */}
          {rrppList.length > 0 && (
            <div>
              <label className="text-sm text-dark-300 mb-2 block">
                Asignar RRPP ({rrppAsignados.length} seleccionado{rrppAsignados.length !== 1 ? "s" : ""})
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {rrppList.map((rrpp) => {
                  const isSelected = rrppAsignados.some((r) => r.usuarioId === rrpp.id);
                  const asignado = rrppAsignados.find((r) => r.usuarioId === rrpp.id);
                  return (
                    <div key={rrpp.id} className="space-y-1.5">
                      <button
                        type="button"
                        onClick={() => toggleRrpp(rrpp.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors ${
                          isSelected
                            ? "bg-gold-500/10 border border-gold-500/30"
                            : "bg-surface-2 border border-transparent hover:border-dark-700"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                            isSelected ? "bg-gold-500 text-black" : "bg-dark-700 border border-dark-600"
                          }`}
                        >
                          {isSelected && <Check size={14} />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-dark-200 truncate">{rrpp.nombre}</p>
                          <p className="text-xs text-dark-500 truncate">{rrpp.email}</p>
                        </div>
                      </button>
                      {isSelected && (
                        <div className="pl-8">
                          <Input
                            label="Monto por QR ($)"
                            type="number"
                            step="0.01"
                            value={asignado?.montoPorQr?.toString() || "0"}
                            onChange={(e) => updateMonto(rrpp.id, Number(e.target.value) || 0)}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <Button type="submit" variant="gold" size="lg" loading={creating} className="w-full mt-2">
            Crear evento
          </Button>
        </form>
      </Modal>
    </div>
  );
}
