"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface CalendarEvent {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
}

interface CalendarViewProps {
  events?: CalendarEvent[];
  selectedDate?: string | null;
  onSelectDate?: (date: string) => void;
  className?: string;
}

const DAYS = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"];
const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function CalendarView({
  events = [],
  selectedDate,
  onSelectDate,
  className,
}: CalendarViewProps) {
  const today = new Date();
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());

  const eventDates = useMemo(() => {
    const set = new Set<string>();
    events.forEach((e) => set.add(e.date));
    return set;
  }, [events]);

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7; // Monday-based

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const selectedEvents = useMemo(() => {
    if (!selectedDate) return [];
    return events.filter((e) => e.date === selectedDate);
  }, [events, selectedDate]);

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={prevMonth}
          className="flex h-10 w-10 items-center justify-center rounded-full text-dark-300 hover:bg-surface-2 transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <span className="text-base font-semibold text-dark-100">
          {MONTHS[viewMonth]} {viewYear}
        </span>
        <button
          onClick={nextMonth}
          className="flex h-10 w-10 items-center justify-center rounded-full text-dark-300 hover:bg-surface-2 transition-colors"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1">
        {DAYS.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-dark-500 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) {
            return <div key={`empty-${i}`} />;
          }

          const date = new Date(viewYear, viewMonth, day);
          const dateKey = formatDateKey(date);
          const isToday = isSameDay(date, today);
          const isPast = date < today && !isToday;
          const hasEvent = eventDates.has(dateKey);
          const isSelected = selectedDate === dateKey;

          return (
            <button
              key={dateKey}
              disabled={isPast}
              onClick={() => onSelectDate?.(dateKey)}
              className={cn(
                "relative flex flex-col items-center justify-center h-10 rounded-full transition-all duration-200 text-sm",
                isPast && "text-dark-600 cursor-not-allowed",
                !isPast && !isSelected && "text-dark-200 hover:bg-surface-2",
                isToday && !isSelected && "border border-gold-500/40",
                isSelected && "bg-gold-500 text-dark-900 font-semibold"
              )}
            >
              {day}
              {hasEvent && !isSelected && (
                <span className="absolute bottom-1 h-1 w-1 rounded-full bg-gold-500" />
              )}
            </button>
          );
        })}
      </div>

      {/* Selected day events */}
      {selectedEvents.length > 0 && (
        <div className="flex flex-col gap-2 mt-2 animate-slide-up">
          <span className="text-xs text-dark-400 font-medium">
            Eventos del día
          </span>
          {selectedEvents.map((event) => (
            <div
              key={event.id}
              className="flex items-center gap-3 p-3 rounded-xl bg-surface-2 border border-[rgba(255,255,255,0.06)]"
            >
              <div className="h-2 w-2 rounded-full bg-gold-500 shrink-0" />
              <span className="text-sm text-dark-100">{event.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
