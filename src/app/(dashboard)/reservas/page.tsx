"use client";

import { useState } from "react";
import { Construction, Users, MapPin } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { cn } from "@/lib/utils";

interface Mesa {
  id: number;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  seats: number;
  shape: "rect" | "circle" | "vip";
}

const MESAS: Mesa[] = [
  // VIP area (top)
  { id: 1, label: "VIP 1", x: 10, y: 8, w: 14, h: 10, seats: 8, shape: "vip" },
  { id: 2, label: "VIP 2", x: 28, y: 8, w: 14, h: 10, seats: 8, shape: "vip" },
  { id: 3, label: "VIP 3", x: 46, y: 8, w: 14, h: 10, seats: 8, shape: "vip" },
  { id: 4, label: "VIP 4", x: 64, y: 8, w: 14, h: 10, seats: 10, shape: "vip" },
  // Center tables
  { id: 5, label: "M1", x: 15, y: 35, w: 10, h: 10, seats: 4, shape: "circle" },
  { id: 6, label: "M2", x: 32, y: 35, w: 10, h: 10, seats: 4, shape: "circle" },
  { id: 7, label: "M3", x: 49, y: 35, w: 10, h: 10, seats: 4, shape: "circle" },
  { id: 8, label: "M4", x: 66, y: 35, w: 10, h: 10, seats: 6, shape: "circle" },
  // Bottom tables
  { id: 9, label: "M5", x: 10, y: 58, w: 12, h: 8, seats: 4, shape: "rect" },
  { id: 10, label: "M6", x: 28, y: 58, w: 12, h: 8, seats: 4, shape: "rect" },
  { id: 11, label: "M7", x: 46, y: 58, w: 12, h: 8, seats: 6, shape: "rect" },
  { id: 12, label: "M8", x: 64, y: 58, w: 12, h: 8, seats: 6, shape: "rect" },
  // Bar area tables
  { id: 13, label: "B1", x: 15, y: 78, w: 8, h: 8, seats: 2, shape: "circle" },
  { id: 14, label: "B2", x: 30, y: 78, w: 8, h: 8, seats: 2, shape: "circle" },
  { id: 15, label: "B3", x: 45, y: 78, w: 8, h: 8, seats: 2, shape: "circle" },
  { id: 16, label: "B4", x: 60, y: 78, w: 8, h: 8, seats: 2, shape: "circle" },
];

export default function ReservasPage() {
  const [hoveredMesa, setHoveredMesa] = useState<number | null>(null);
  const [selectedMesa, setSelectedMesa] = useState<number | null>(null);

  const selected = MESAS.find((m) => m.id === selectedMesa);

  return (
    <div className="space-y-4 animate-fade-in">
      <PageHeader
        title="Reservas"
        subtitle="Mapa de mesas del local"
      />

      {/* Under construction banner */}
      <div className="glass-card p-5 flex items-center gap-4 border-gold-500/30">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold-500/15 shrink-0">
          <Construction size={24} className="text-gold-500" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-dark-100">
            Modulo en construccion
          </h3>
          <p className="text-xs text-dark-400 mt-0.5">
            Proximamente se conectara con la app de reservas para gestionar mesas, horarios y disponibilidad en tiempo real.
          </p>
        </div>
      </div>

      <div className="lg:grid lg:grid-cols-[1fr_280px] lg:gap-6 space-y-4 lg:space-y-0">
        {/* Interactive map */}
        <div className="glass-card p-4 overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-dark-200">Mapa del local</h3>
            <div className="flex items-center gap-3 text-[10px] text-dark-500">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-gold-500/30 border border-gold-500/50" /> VIP
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-surface-3 border border-[rgba(255,255,255,0.1)]" /> Mesa
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-dark-700 border border-[rgba(255,255,255,0.06)]" /> Barra
              </span>
            </div>
          </div>

          <div className="relative w-full aspect-[4/3] bg-dark-800 rounded-xl border border-[rgba(255,255,255,0.04)] overflow-hidden">
            {/* Stage / DJ area */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[40%] h-[5%] bg-gold-500/10 border-b border-gold-500/20 flex items-center justify-center">
              <span className="text-[9px] text-gold-500/60 font-medium tracking-wider">DJ / ESCENARIO</span>
            </div>

            {/* Dance floor */}
            <div className="absolute left-1/2 -translate-x-1/2 top-[22%] w-[30%] h-[12%] border border-dashed border-[rgba(255,255,255,0.06)] rounded-lg flex items-center justify-center">
              <span className="text-[9px] text-dark-600 tracking-wider">PISTA</span>
            </div>

            {/* Bar area label */}
            <div className="absolute bottom-[2%] left-1/2 -translate-x-1/2 w-[60%] h-[5%] bg-dark-700/50 border border-[rgba(255,255,255,0.04)] rounded flex items-center justify-center">
              <span className="text-[9px] text-dark-500 tracking-wider">BARRA</span>
            </div>

            {/* Entrance */}
            <div className="absolute bottom-0 right-[8%] flex items-center gap-1 pb-1">
              <MapPin size={10} className="text-dark-500" />
              <span className="text-[8px] text-dark-500">ENTRADA</span>
            </div>

            {/* Mesas */}
            {MESAS.map((mesa) => {
              const isHovered = hoveredMesa === mesa.id;
              const isSelected = selectedMesa === mesa.id;
              const isVip = mesa.shape === "vip";
              const isCircle = mesa.shape === "circle";

              return (
                <button
                  key={mesa.id}
                  type="button"
                  onMouseEnter={() => setHoveredMesa(mesa.id)}
                  onMouseLeave={() => setHoveredMesa(null)}
                  onClick={() => setSelectedMesa(isSelected ? null : mesa.id)}
                  className={cn(
                    "absolute flex flex-col items-center justify-center transition-all duration-200 cursor-pointer",
                    isCircle ? "rounded-full" : "rounded-lg",
                    isVip
                      ? "bg-gold-500/10 border border-gold-500/30"
                      : "bg-surface-3/80 border border-[rgba(255,255,255,0.08)]",
                    (isHovered || isSelected) && isVip && "bg-gold-500/25 border-gold-500/60 shadow-gold scale-105",
                    (isHovered || isSelected) && !isVip && "bg-surface-3 border-gold-500/40 scale-105",
                    isSelected && "ring-1 ring-gold-500/50"
                  )}
                  style={{
                    left: `${mesa.x}%`,
                    top: `${mesa.y}%`,
                    width: `${mesa.w}%`,
                    height: `${mesa.h}%`,
                  }}
                >
                  <span className={cn(
                    "text-[10px] font-semibold leading-none",
                    isVip ? "text-gold-500" : "text-dark-300",
                    (isHovered || isSelected) && "text-gold-400"
                  )}>
                    {mesa.label}
                  </span>
                  <span className={cn(
                    "text-[8px] leading-none mt-0.5",
                    isVip ? "text-gold-500/50" : "text-dark-600"
                  )}>
                    {mesa.seats}p
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Details panel */}
        <div className="space-y-3">
          {selected ? (
            <div className="glass-card p-4 animate-fade-in">
              <div className="flex items-center gap-2 mb-3">
                <div className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg",
                  selected.shape === "vip" ? "bg-gold-500/15" : "bg-surface-3"
                )}>
                  <Users size={18} className={selected.shape === "vip" ? "text-gold-500" : "text-dark-300"} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-dark-100">{selected.label}</p>
                  <p className="text-xs text-dark-500 capitalize">{selected.shape === "vip" ? "VIP" : "Mesa standard"}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-dark-400">Capacidad</span>
                  <span className="text-dark-100 font-medium">{selected.seats} personas</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-dark-400">Estado</span>
                  <span className="text-dark-500">Sin datos</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-dark-400">Reserva</span>
                  <span className="text-dark-500">—</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[rgba(255,255,255,0.06)]">
                <p className="text-[10px] text-dark-600 text-center">
                  Las reservas estaran disponibles proximamente
                </p>
              </div>
            </div>
          ) : (
            <div className="glass-card p-4 text-center">
              <MapPin size={20} className="text-dark-500 mx-auto mb-2" />
              <p className="text-xs text-dark-400">
                Selecciona una mesa para ver sus detalles
              </p>
            </div>
          )}

          {/* Summary */}
          <div className="glass-card p-4">
            <h4 className="text-xs font-medium text-dark-300 mb-2">Resumen</h4>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-dark-400">Total mesas</span>
                <span className="text-dark-200 font-medium">{MESAS.length}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-dark-400">VIP</span>
                <span className="text-gold-500 font-medium">{MESAS.filter((m) => m.shape === "vip").length}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-dark-400">Capacidad total</span>
                <span className="text-dark-200 font-medium">{MESAS.reduce((s, m) => s + m.seats, 0)} personas</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
