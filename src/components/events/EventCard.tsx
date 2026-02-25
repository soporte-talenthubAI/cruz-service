"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";

interface EventCardProps {
  name: string;
  date: string;
  time: string;
  type: "normal" | "especial";
  capacity: number;
  ticketsSold: number;
  ingresados?: number;
  isPast?: boolean;
  flyerUrl?: string;
  onClick?: () => void;
  className?: string;
}

export function EventCard({
  name,
  date,
  time,
  type,
  capacity,
  ticketsSold,
  ingresados,
  isPast,
  flyerUrl,
  onClick,
  className,
}: EventCardProps) {
  // For past events: show attendance (ingresados/ticketsSold)
  // For upcoming: show sold (ticketsSold/capacity)
  const barValue = isPast ? (ingresados ?? 0) : ticketsSold;
  const barMax = isPast ? ticketsSold || 1 : capacity;
  const percentage = Math.round((barValue / barMax) * 100);

  const barColor = isPast
    ? "bg-gold-500"
    : percentage >= 90
      ? "bg-error"
      : percentage >= 70
        ? "bg-warning"
        : "bg-success";

  return (
    <div
      onClick={onClick}
      className={cn(
        "glass-card-hover relative overflow-hidden flex gap-4",
        type === "especial" && "border-l-[3px] border-l-gold-500",
        isPast && "opacity-80",
        onClick && "cursor-pointer",
        className
      )}
    >
      <div className="flex-1 flex flex-col gap-3 p-4">
        {/* Badges */}
        <div className="flex items-center gap-2">
          <Badge variant={type === "especial" ? "especial" : "normal"}>
            {type.toUpperCase()}
          </Badge>
          {isPast && (
            <Badge variant="invalidado">FINALIZADO</Badge>
          )}
        </div>

        {/* Event info */}
        <div>
          <h3 className="text-lg font-bold text-dark-50">{name}</h3>
          <p className="text-sm text-gold-500 font-medium mt-0.5">{date}</p>
          <p className="text-xs text-dark-400 mt-0.5">Apertura: {time}</p>
        </div>

        {/* Bar */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-xs">
            {isPast ? (
              <>
                <span className="text-dark-400">
                  Asistencia: {ingresados ?? 0} / {ticketsSold}
                </span>
                <span className="text-gold-500 font-medium">
                  {ticketsSold > 0 ? percentage : 0}%
                </span>
              </>
            ) : (
              <>
                <span className="text-dark-400">
                  {ticketsSold} / {capacity}
                </span>
                <span
                  className={cn(
                    percentage >= 90
                      ? "text-error"
                      : percentage >= 70
                        ? "text-warning"
                        : "text-dark-400"
                  )}
                >
                  {percentage}%
                </span>
              </>
            )}
          </div>
          <div className="h-1.5 w-full rounded-full bg-dark-700 overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all duration-500", barColor)}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Flyer thumbnail (special events) */}
      {type === "especial" && flyerUrl && (
        <div className="w-24 shrink-0">
          <img
            src={flyerUrl}
            alt={`Flyer de ${name}`}
            className="h-full w-full object-cover rounded-r-[--radius-card]"
          />
        </div>
      )}
    </div>
  );
}
