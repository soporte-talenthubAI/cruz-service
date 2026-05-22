"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface RrppOption {
  id: string;
  nombre: string;
  email: string;
}

interface RrppAsignado {
  usuarioId: string;
  montoPorQr: number | string;
}

export interface EventInitialData {
  id?: string;
  nombre?: string;
  fecha?: string;
  horaApertura?: string;
  tipo?: "NORMAL" | "ESPECIAL";
  capacidad?: number;
  brandingBgUrl?: string | null;
  brandingColorPrimary?: string | null;
  brandingColorText?: string | null;
  brandingLayout?: "banner" | "centered" | "fullbg" | null;
  rrppAsignados?: { usuario: { id: string }; montoPorQr: number }[];
}

interface Props {
  open: boolean;
  mode: "create" | "edit";
  initialData?: EventInitialData;
  onClose: () => void;
  onSuccess?: () => void;
}

export function EventFormModal({ open, mode, initialData, onClose, onSuccess }: Props) {
  const isEdit = mode === "edit";

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Fields
  const [nombre, setNombre] = useState("");
  const [fecha, setFecha] = useState("");
  const [horaApertura, setHoraApertura] = useState("");
  const [tipo, setTipo] = useState<"NORMAL" | "ESPECIAL">("NORMAL");
  const [capacidad, setCapacidad] = useState("");

  // Branding
  const [brandingBgUrl, setBrandingBgUrl] = useState("");
  const [brandingColorPrimary, setBrandingColorPrimary] = useState("#C5A059");
  const [brandingColorText, setBrandingColorText] = useState("#FFFFFF");
  const [brandingLayout, setBrandingLayout] = useState<"banner" | "centered" | "fullbg">("banner");
  const [uploading, setUploading] = useState(false);

  // Branding gallery
  const [brandingGallery, setBrandingGallery] = useState<{ url: string; usedIn: string }[]>([]);

  // RRPP (only used on create)
  const [rrppList, setRrppList] = useState<RrppOption[]>([]);
  const [rrppAsignados, setRrppAsignados] = useState<RrppAsignado[]>([]);

  // Hydrate state when modal opens
  useEffect(() => {
    if (!open) return;
    setError("");

    if (isEdit && initialData) {
      setNombre(initialData.nombre || "");
      setFecha(initialData.fecha ? new Date(initialData.fecha).toISOString().slice(0, 10) : "");
      setHoraApertura(initialData.horaApertura || "");
      setTipo(initialData.tipo || "NORMAL");
      setCapacidad(initialData.capacidad?.toString() || "");
      setBrandingBgUrl(initialData.brandingBgUrl || "");
      setBrandingColorPrimary(initialData.brandingColorPrimary || "#C5A059");
      setBrandingColorText(initialData.brandingColorText || "#FFFFFF");
      setBrandingLayout(
        initialData.brandingLayout === "centered" || initialData.brandingLayout === "fullbg"
          ? initialData.brandingLayout
          : "banner"
      );
    } else {
      setNombre("");
      setFecha("");
      setHoraApertura("");
      setTipo("NORMAL");
      setCapacidad("");
      setBrandingBgUrl("");
      setBrandingColorPrimary("#C5A059");
      setBrandingColorText("#FFFFFF");
      setBrandingLayout("banner");
      setRrppAsignados([]);
    }

    fetchBrandingGallery();
    if (!isEdit) fetchRrpp();
  }, [open, isEdit, initialData]);

  const fetchRrpp = async () => {
    try {
      const res = await fetch("/api/usuarios/rrpp");
      const json = await res.json();
      if (res.ok) setRrppList(json.data || []);
    } catch {
      // silently fail
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

  const toggleRrpp = (id: string) => {
    setRrppAsignados((prev) => {
      const exists = prev.find((r) => r.usuarioId === id);
      if (exists) return prev.filter((r) => r.usuarioId !== id);
      return [...prev, { usuarioId: id, montoPorQr: "" }];
    });
  };

  const updateMonto = (usuarioId: string, monto: number | string) => {
    setRrppAsignados((prev) =>
      prev.map((r) => (r.usuarioId === usuarioId ? { ...r, montoPorQr: monto } : r))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const payload: Record<string, unknown> = {
        nombre,
        fecha,
        horaApertura,
        tipo,
        capacidad: Number(capacidad),
        brandingBgUrl: brandingBgUrl || null,
        brandingColorPrimary,
        brandingColorText,
        brandingLayout,
      };

      if (!isEdit) {
        payload.rrppAsignados = rrppAsignados.map((r) => ({
          ...r,
          montoPorQr: Number(r.montoPorQr) || 0,
        }));
      }

      const url = isEdit ? `/api/eventos/${initialData?.id}` : "/api/eventos";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || `Error al ${isEdit ? "actualizar" : "crear"} evento`);
        return;
      }

      onSuccess?.();
      onClose();
    } catch {
      setError("Error de conexión");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Editar evento" : "Nuevo evento"}>
      {error && (
        <div className="mb-4 rounded-xl bg-error/10 border border-error/30 p-3 text-sm text-error">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
            {brandingGallery.length > 0 && !brandingBgUrl && (
              <div>
                <label className="text-xs text-dark-400 mb-1.5 block">Imágenes anteriores</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {brandingGallery.map((img) => (
                    <button
                      key={img.url}
                      type="button"
                      onClick={() => setBrandingBgUrl(img.url)}
                      className="relative rounded-xl overflow-hidden h-20 sm:h-16 border border-transparent hover:border-gold-500/50 transition-colors group"
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

            <div>
              <label className="text-xs text-dark-400 mb-1 block">
                {brandingGallery.length > 0 && !brandingBgUrl ? "O subir nueva imagen" : "Imagen de fondo"}
              </label>
              <p className="text-[11px] text-dark-500 mb-2">
                Recomendado: 1200×600px, formato apaisado (proporción 2:1)
              </p>
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
                <>
                  <div className="mt-3">
                    <label className="text-xs text-dark-400 mb-1.5 block">Disposición de la imagen</label>
                    <div className="grid grid-cols-3 gap-2">
                      <LayoutPresetCard
                        active={brandingLayout === "banner"}
                        onClick={() => setBrandingLayout("banner")}
                        label="Banner"
                        sublabel="Apaisado"
                        thumbnail={<BannerThumb />}
                      />
                      <LayoutPresetCard
                        active={brandingLayout === "centered"}
                        onClick={() => setBrandingLayout("centered")}
                        label="Flyer"
                        sublabel="Centrado"
                        thumbnail={<CenteredThumb color={brandingColorPrimary} />}
                      />
                      <LayoutPresetCard
                        active={brandingLayout === "fullbg"}
                        onClick={() => setBrandingLayout("fullbg")}
                        label="Fondo"
                        sublabel="Total"
                        thumbnail={<FullBgThumb />}
                      />
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className="text-xs text-dark-400 mb-1.5 block">Vista previa</label>
                    <LayoutPreview
                      layout={brandingLayout}
                      imageUrl={brandingBgUrl}
                      eventName={nombre || "Nombre del evento"}
                      primaryColor={brandingColorPrimary}
                    />
                  </div>
                </>
              )}
            </div>

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

        {/* RRPP — only on create. Edit mode manages this separately. */}
        {!isEdit && rrppList.length > 0 && (
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
                          value={asignado?.montoPorQr?.toString() ?? ""}
                          onChange={(e) => updateMonto(rrpp.id, e.target.value === "" ? "" : Number(e.target.value))}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <Button type="submit" variant="gold" size="lg" loading={submitting} className="w-full mt-2">
          {isEdit ? "Guardar cambios" : "Crear evento"}
        </Button>
      </form>
    </Modal>
  );
}

// ============================================
// Layout preset helpers
// ============================================

interface LayoutPresetCardProps {
  active: boolean;
  onClick: () => void;
  label: string;
  sublabel: string;
  thumbnail: React.ReactNode;
}

function LayoutPresetCard({ active, onClick, label, sublabel, thumbnail }: LayoutPresetCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex flex-col items-center gap-1.5 p-2.5 rounded-xl border transition-colors ${
        active
          ? "bg-gold-500/10 border-gold-500/40"
          : "bg-surface-2 border-dark-700 hover:border-dark-600"
      }`}
    >
      <div className="w-full aspect-[4/3] rounded-lg overflow-hidden bg-[#0d0d0d] border border-dark-700">
        {thumbnail}
      </div>
      <div className="text-center leading-tight">
        <p className={`text-[11px] font-medium ${active ? "text-gold-500" : "text-dark-200"}`}>{label}</p>
        <p className="text-[10px] text-dark-500">{sublabel}</p>
      </div>
    </button>
  );
}

function BannerThumb() {
  return (
    <svg viewBox="0 0 80 60" className="w-full h-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="bn-g" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#9a9f93" />
          <stop offset="100%" stopColor="#5e6258" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="80" height="60" fill="#0d0d0d" />
      <rect x="0" y="0" width="80" height="22" fill="url(#bn-g)" />
      <rect x="28" y="32" width="24" height="20" rx="2" fill="#ebf1e2" />
    </svg>
  );
}

function CenteredThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 60" className="w-full h-full" preserveAspectRatio="none">
      <rect x="0" y="0" width="80" height="60" fill="#0d0d0d" />
      <rect x="0" y="0" width="80" height="22" fill={color} />
      <rect x="32" y="4" width="16" height="14" fill="#9a9f93" />
      <rect x="28" y="32" width="24" height="20" rx="2" fill="#ebf1e2" />
    </svg>
  );
}

function FullBgThumb() {
  return (
    <svg viewBox="0 0 80 60" className="w-full h-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="fb-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#9a9f93" />
          <stop offset="100%" stopColor="#3f4239" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="80" height="60" fill="url(#fb-g)" />
      <rect x="0" y="0" width="80" height="60" fill="#0d0d0d" opacity="0.65" />
      <rect x="28" y="22" width="24" height="20" rx="2" fill="#ebf1e2" />
    </svg>
  );
}

interface LayoutPreviewProps {
  layout: "banner" | "centered" | "fullbg";
  imageUrl: string;
  eventName: string;
  primaryColor: string;
}

function LayoutPreview({ layout, imageUrl, eventName, primaryColor }: LayoutPreviewProps) {
  if (layout === "fullbg") {
    return (
      <div className="relative rounded-xl overflow-hidden border border-dark-700 h-72">
        <img src={imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-[#0d0d0d]/75 backdrop-blur-[2px]" />
        <div className="relative z-10 flex flex-col items-center justify-center h-full px-4 py-4 text-center gap-3">
          <p className="text-lg font-bold text-[#ebf1e2] line-clamp-2">{eventName}</p>
          <div className="bg-[#ebf1e2] rounded-lg p-2">
            <div className="w-20 h-20 bg-[#0d0d0d]" />
          </div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#9a9f93]">Documento · 12345678</p>
        </div>
      </div>
    );
  }

  // banner & centered share the framing
  return (
    <div className="rounded-xl overflow-hidden border border-dark-700 bg-[#0d0d0d]">
      <div
        className="relative h-44 sm:h-52"
        style={layout === "centered" ? { backgroundColor: primaryColor } : undefined}
      >
        <img
          src={imageUrl}
          alt=""
          className={`absolute inset-0 w-full h-full ${layout === "centered" ? "object-contain" : "object-cover"}`}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/55 to-black/90" />
        <div className="absolute inset-x-0 bottom-0 px-4 pb-3 text-center">
          <p className="text-base sm:text-lg font-bold text-[#ebf1e2] line-clamp-2">{eventName}</p>
        </div>
      </div>
      <div className="flex items-center justify-center py-4">
        <div className="bg-[#ebf1e2] rounded-lg p-2">
          <div className="w-16 h-16 bg-[#0d0d0d]" />
        </div>
      </div>
    </div>
  );
}
