"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Calendar, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CalendarEvent {
  id: string;
  nombre: string;
  fecha: string;
  horaApertura?: string;
  capacidad?: number;
  stats?: { total: number };
}

interface EventCalendarProps {
  eventos: CalendarEvent[];
  selectedId: string;
  onSelect: (id: string) => void;
  onMonthChange?: (month: number, year: number) => void;
  loading?: boolean;
  /** When true, shows a "Todos los eventos" option to clear the filter */
  allowAll?: boolean;
  /** Label for the "all" option (default: "Todos los eventos") */
  allLabel?: string;
}

const DAY_NAMES = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"];
const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function getDaysInMonth(month: number, year: number) {
  return new Date(year, month, 0).getDate();
}

/** Returns 0=Mon … 6=Sun for the 1st of the month */
function getFirstDayOffset(month: number, year: number) {
  const day = new Date(year, month - 1, 1).getDay(); // 0=Sun
  return day === 0 ? 6 : day - 1;
}

export function EventCalendar({
  eventos,
  selectedId,
  onSelect,
  onMonthChange,
  loading,
  allowAll,
  allLabel = "Todos los eventos",
}: EventCalendarProps) {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1); // 1-12
  const [year, setYear] = useState(now.getFullYear());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const todayDay =
    now.getMonth() + 1 === month && now.getFullYear() === year
      ? now.getDate()
      : null;

  // Group events by day number
  const eventsByDay = useMemo(() => {
    const map: Record<number, CalendarEvent[]> = {};
    for (const ev of eventos) {
      const d = new Date(ev.fecha);
      if (d.getMonth() + 1 === month && d.getFullYear() === year) {
        const day = d.getDate();
        if (!map[day]) map[day] = [];
        map[day].push(ev);
      }
    }
    return map;
  }, [eventos, month, year]);

  const daysInMonth = getDaysInMonth(month, year);
  const firstOffset = getFirstDayOffset(month, year);

  const goToPrev = () => {
    const newMonth = month === 1 ? 12 : month - 1;
    const newYear = month === 1 ? year - 1 : year;
    setMonth(newMonth);
    setYear(newYear);
    setSelectedDay(null);
    onMonthChange?.(newMonth, newYear);
  };

  const goToNext = () => {
    const newMonth = month === 12 ? 1 : month + 1;
    const newYear = month === 12 ? year + 1 : year;
    setMonth(newMonth);
    setYear(newYear);
    setSelectedDay(null);
    onMonthChange?.(newMonth, newYear);
  };

  const dayEvents = selectedDay ? eventsByDay[selectedDay] || [] : [];
  const selectedEvento = eventos.find((e) => e.id === selectedId);

  return (
    <div className="space-y-3">
      {/* Selected event chip */}
      {selectedEvento && (
        <div className="flex items-center justify-between gap-2 rounded-xl bg-gold-500/10 border border-gold-500/20 px-4 py-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-gold-500 truncate">
              {selectedEvento.nombre}
            </p>
            <p className="text-xs text-dark-400">
              {new Date(selectedEvento.fecha).toLocaleDateString("es-AR", {
                day: "numeric",
                month: "short",
              })}
              {selectedEvento.horaApertura && ` — ${selectedEvento.horaApertura}`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onSelect("")}
            className="text-xs text-dark-400 hover:text-gold-500 transition-colors shrink-0"
          >
            {allowAll ? allLabel : "Cambiar"}
          </button>
        </div>
      )}

      {/* Calendar */}
      {!selectedId && (
        <div className="rounded-xl bg-surface-2 border border-[rgba(255,255,255,0.06)] overflow-hidden">
          {/* Month navigation */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(255,255,255,0.06)]">
            <button
              type="button"
              onClick={goToPrev}
              className="p-1.5 rounded-lg hover:bg-gold-500/10 text-dark-400 hover:text-gold-500 transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm font-semibold text-dark-100">
              {MONTH_NAMES[month - 1]} {year}
            </span>
            <button
              type="button"
              onClick={goToNext}
              className="p-1.5 rounded-lg hover:bg-gold-500/10 text-dark-400 hover:text-gold-500 transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Day names header */}
          <div className="grid grid-cols-7 px-2 pt-2">
            {DAY_NAMES.map((d) => (
              <div
                key={d}
                className="text-center text-[10px] font-medium text-dark-500 py-1"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 px-2 pb-3 gap-y-0.5">
            {/* Empty cells for offset */}
            {Array.from({ length: firstOffset }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const hasEvents = !!eventsByDay[day];
              const isSelected = selectedDay === day;
              const isToday = todayDay === day;

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => {
                    if (hasEvents) setSelectedDay(isSelected ? null : day);
                  }}
                  disabled={!hasEvents}
                  className={cn(
                    "relative flex flex-col items-center justify-center h-9 rounded-lg text-sm transition-colors",
                    hasEvents
                      ? "text-dark-100 hover:bg-gold-500/10 cursor-pointer"
                      : "text-dark-600 cursor-default",
                    isSelected && "bg-gold-500/20 text-gold-500",
                    isToday && !isSelected && "ring-1 ring-gold-500/30"
                  )}
                >
                  {day}
                  {hasEvents && (
                    <span
                      className={cn(
                        "absolute bottom-1 w-1 h-1 rounded-full",
                        isSelected ? "bg-gold-500" : "bg-gold-500/60"
                      )}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Loading overlay */}
          {loading && (
            <div className="px-4 py-3 border-t border-[rgba(255,255,255,0.06)] text-center">
              <span className="text-xs text-dark-400">Cargando eventos...</span>
            </div>
          )}
        </div>
      )}

      {/* Events list for selected day */}
      {!selectedId && selectedDay && dayEvents.length > 0 && (
        <div className="space-y-2 animate-fade-in">
          <p className="text-xs text-dark-400 px-1">
            Eventos del {selectedDay} de {MONTH_NAMES[month - 1].toLowerCase()}
          </p>
          {dayEvents.map((ev) => {
            const hasCapacity = ev.capacidad != null && ev.stats != null;
            const pct =
              hasCapacity
                ? Math.round((ev.stats!.total / ev.capacidad!) * 100)
                : null;
            const isFull = hasCapacity && ev.stats!.total >= ev.capacidad!;

            return (
              <button
                key={ev.id}
                type="button"
                onClick={() => {
                  onSelect(ev.id);
                  setSelectedDay(null);
                }}
                className="w-full glass-card p-3 text-left hover:border-gold-500/30 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-dark-100 truncate">
                    {ev.nombre}
                  </p>
                  {ev.horaApertura && (
                    <div className="flex items-center gap-1 text-dark-400 shrink-0">
                      <Clock size={12} />
                      <span className="text-xs">{ev.horaApertura}</span>
                    </div>
                  )}
                </div>
                {hasCapacity && (
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-xs text-dark-500">
                      {ev.stats!.total}/{ev.capacidad} entradas
                    </span>
                    <span
                      className={cn(
                        "text-xs font-medium",
                        isFull ? "text-error" : "text-dark-400"
                      )}
                    >
                      {isFull ? "LLENO" : `${pct}%`}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* No events hint */}
      {!selectedId && !loading && eventos.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-4 text-center">
          <Calendar size={20} className="text-dark-500" />
          <p className="text-xs text-dark-500">Sin eventos este mes</p>
        </div>
      )}
    </div>
  );
}
