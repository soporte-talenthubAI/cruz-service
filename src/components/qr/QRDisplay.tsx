"use client";

import { useRef, useCallback, useState } from "react";
import Image from "next/image";
import { Download, Mail, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

type TicketStatus = "pendiente" | "enviado" | "ingresado" | "invalidado";

interface QRDisplayProps {
  eventName: string;
  eventDate: string;
  eventTime: string;
  guestName: string;
  guestDni: string;
  guestEmail: string;
  generatedBy: string;
  ticketId: string;
  qrCode: string;
  status: TicketStatus;
  onSendEmail?: () => Promise<void>;
  className?: string;
}

export function QRDisplay({
  eventName,
  eventDate,
  eventTime,
  guestName,
  guestDni,
  guestEmail,
  generatedBy,
  ticketId,
  qrCode,
  status,
  onSendEmail,
  className,
}: QRDisplayProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [sending, setSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const isActive = status === "enviado";

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrCode)}&bgcolor=FFFFFF&color=000000`;

  const handleDownload = useCallback(async () => {
    if (!cardRef.current) return;

    // Dynamic import to avoid SSR issues
    const html2canvas = (await import("html2canvas-pro")).default;

    const canvas = await html2canvas(cardRef.current, {
      backgroundColor: "#0A0A0A",
      scale: 2,
      useCORS: true,
    });

    const link = document.createElement("a");
    link.download = `entrada-${guestName.replace(/\s+/g, "-").toLowerCase()}-${ticketId.slice(0, 8)}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }, [guestName, ticketId]);

  const handleSendEmail = useCallback(async () => {
    if (!onSendEmail) return;
    setSending(true);
    try {
      await onSendEmail();
      setSendSuccess(true);
      setTimeout(() => setSendSuccess(false), 3000);
    } catch {
      // Error handled by parent
    } finally {
      setSending(false);
    }
  }, [onSendEmail]);

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {/* Ticket card — capturable for download */}
      <div
        ref={cardRef}
        className={cn(
          "relative overflow-hidden rounded-[--radius-card] border",
          isActive
            ? "border-gold-500/50 animate-pulse-gold"
            : "border-[rgba(255,255,255,0.06)]"
        )}
      >
        {/* Shimmer effect when active */}
        {isActive && (
          <div
            className="absolute inset-0 rounded-[--radius-card] pointer-events-none z-10"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(245,158,11,0.08), transparent)",
              backgroundSize: "200% 100%",
              animation: "shimmer 2s linear infinite",
            }}
          />
        )}

        {/* Status badge */}
        <div className="absolute top-4 right-4 z-20">
          <Badge variant={status}>{status.toUpperCase()}</Badge>
        </div>

        {/* Header with CRUZ ESPACIO background */}
        <div className="relative h-32 overflow-hidden">
          <Image
            src="/images/cruz_espacio.jpg"
            alt=""
            fill
            className="object-cover"
            quality={80}
          />
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative z-10 flex flex-col items-center justify-center h-full">
            <span className="text-2xl font-bold tracking-[0.3em] gold-text">
              CRUZ
            </span>
            <span className="text-[10px] tracking-[0.25em] text-dark-300 uppercase">
              Espacio
            </span>
          </div>
        </div>

        {/* Event info */}
        <div className="bg-surface-1 p-5 pb-3">
          <h3 className="text-lg font-bold text-dark-50">{eventName}</h3>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-sm text-gold-500 font-medium">{eventDate}</span>
            <span className="text-dark-600">•</span>
            <span className="text-sm text-gold-500 font-medium">{eventTime}</span>
          </div>
        </div>

        {/* QR Code */}
        <div className="flex justify-center px-5 py-4 bg-surface-1">
          <div className="bg-white rounded-2xl p-4">
            <img
              src={qrImageUrl}
              alt={`QR de ${guestName}`}
              className="h-48 w-48 object-contain"
              crossOrigin="anonymous"
            />
          </div>
        </div>

        {/* Guest info */}
        <div className="px-5 pb-2 bg-surface-1">
          <p className="text-xl font-bold text-dark-50">{guestName}</p>
          <p className="text-sm text-dark-400">DNI: {guestDni}</p>
          <p className="text-sm text-dark-500">{guestEmail}</p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 bg-surface-1 border-t border-[rgba(255,255,255,0.06)]">
          <span className="text-xs text-dark-500">
            Generado por {generatedBy}
          </span>
          <span className="text-xs text-dark-600 font-mono">
            {ticketId.slice(0, 12)}
          </span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <Button
          variant="gold"
          size="md"
          className="flex-1"
          leftIcon={
            sending ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Mail size={18} />
            )
          }
          onClick={handleSendEmail}
          disabled={sending || status === "invalidado"}
        >
          {sendSuccess ? "Enviado!" : sending ? "Enviando..." : "Enviar por mail"}
        </Button>

        <Button
          variant="ghost"
          size="md"
          className="flex-1"
          leftIcon={<Download size={18} />}
          onClick={handleDownload}
        >
          Descargar
        </Button>
      </div>
    </div>
  );
}
