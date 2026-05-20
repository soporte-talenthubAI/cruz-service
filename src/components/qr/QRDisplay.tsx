"use client";

import { useRef, useCallback, useState } from "react";
import Image from "next/image";
import { Mail, Loader2, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

type TicketStatus = "pendiente" | "enviado" | "ingresado" | "invalidado";

interface QRDisplayProps {
  eventName: string;
  eventDate: string;
  eventTime: string;
  guestName?: string;
  guestDni: string;
  guestEmail?: string;
  generatedBy: string;
  ticketId: string;
  qrCode: string;
  status: TicketStatus;
  onSendEmail?: () => Promise<void>;
  className?: string;
  brandingBgUrl?: string | null;
  brandingColorPrimary?: string | null;
  brandingColorText?: string | null;
}

// WhatsApp brand icon (lucide doesn't ship one)
function WhatsAppIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.198-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export function QRDisplay({
  eventName,
  eventDate,
  eventTime,
  guestDni,
  guestEmail,
  generatedBy,
  ticketId,
  qrCode,
  status,
  onSendEmail,
  className,
  brandingBgUrl,
  brandingColorPrimary,
  brandingColorText,
}: QRDisplayProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [sending, setSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [sharing, setSharing] = useState(false);
  const isActive = status === "enviado";

  const accentColor = brandingColorPrimary || "#C5A059";
  const textColor = brandingColorText || "#FFFFFF";
  const bgUrl = brandingBgUrl || "/images/fondo_app.png";

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrCode)}&bgcolor=FFFFFF&color=000000`;

  const generatePngBlob = useCallback(async (): Promise<Blob | null> => {
    if (!cardRef.current) return null;
    const html2canvas = (await import("html2canvas-pro")).default;
    const canvas = await html2canvas(cardRef.current, {
      backgroundColor: "#0A0A0A",
      scale: 2,
      useCORS: true,
    });
    return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), "image/png"));
  }, []);

  const filename = `entrada-${guestDni}-${ticketId.slice(0, 8)}.png`;

  const handleDownload = useCallback(async () => {
    const blob = await generatePngBlob();
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = filename;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  }, [generatePngBlob, filename]);

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

  const handleWhatsApp = useCallback(async () => {
    setSharing(true);
    try {
      const blob = await generatePngBlob();
      if (!blob) return;

      const file = new File([blob], filename, { type: "image/png" });
      const shareText = `Tu entrada para ${eventName} — ${eventDate} ${eventTime}. Presentá este QR en la entrada junto a tu DNI.`;

      const nav = navigator as Navigator & {
        canShare?: (data: { files?: File[] }) => boolean;
      };

      // Mobile / supported browsers: native share sheet with image attached
      if (nav.canShare && nav.canShare({ files: [file] }) && navigator.share) {
        try {
          await navigator.share({
            files: [file],
            title: `Entrada para ${eventName}`,
            text: shareText,
          });
          return;
        } catch (err) {
          // User cancelled — silently abort
          if ((err as Error)?.name === "AbortError") return;
          // Otherwise fall through to fallback
        }
      }

      // Fallback (desktop / unsupported): download PNG + open WhatsApp with text
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = filename;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);

      const waText = encodeURIComponent(`${shareText}\n\n(Adjuntá la imagen recién descargada)`);
      window.open(`https://wa.me/?text=${waText}`, "_blank");
    } finally {
      setSharing(false);
    }
  }, [generatePngBlob, filename, eventName, eventDate, eventTime]);

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

        {/* Header with background + event name overlay */}
        <div className="relative h-36 overflow-hidden">
          {bgUrl.startsWith("/") ? (
            <Image src={bgUrl} alt="" fill className="object-cover" quality={80} />
          ) : (
            <img src={bgUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black/70" />
          <div className="relative z-10 flex flex-col items-center justify-center h-full px-6 text-center">
            <h3
              className="text-xl sm:text-2xl font-bold leading-tight line-clamp-2"
              style={{ color: textColor, textShadow: "0 2px 8px rgba(0,0,0,0.6)" }}
            >
              {eventName}
            </h3>
          </div>
        </div>

        {/* Event date / time */}
        <div className="bg-surface-1 px-5 pt-4 pb-3 flex items-center justify-center gap-3">
          <span className="text-sm font-medium" style={{ color: accentColor }}>{eventDate}</span>
          <span className="text-dark-600">•</span>
          <span className="text-sm font-medium" style={{ color: accentColor }}>{eventTime}</span>
        </div>

        {/* QR Code */}
        <div className="flex justify-center px-5 py-4 bg-surface-1">
          <div className="bg-white rounded-2xl p-4">
            <img
              src={qrImageUrl}
              alt="QR de entrada"
              className="h-48 w-48 object-contain"
              crossOrigin="anonymous"
            />
          </div>
        </div>

        {/* Guest info — only DNI and generator */}
        <div className="px-5 pb-2 bg-surface-1">
          <p className="text-lg font-bold text-dark-50">DNI: {guestDni}</p>
          {guestEmail && <p className="text-sm text-dark-500">{guestEmail}</p>}
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <Button
          variant="gold"
          size="md"
          className="w-full"
          leftIcon={
            sharing ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <WhatsAppIcon size={18} />
            )
          }
          onClick={handleWhatsApp}
          disabled={sharing || status === "invalidado"}
        >
          WhatsApp
        </Button>

        <Button
          variant="surface"
          size="md"
          className="w-full"
          leftIcon={
            sending ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Mail size={18} />
            )
          }
          onClick={handleSendEmail}
          disabled={sending || status === "invalidado" || !onSendEmail}
        >
          {sendSuccess ? "Enviado!" : sending ? "Enviando..." : "Email"}
        </Button>

        <Button
          variant="ghost"
          size="md"
          className="w-full"
          leftIcon={<Share2 size={18} />}
          onClick={handleDownload}
        >
          Descargar
        </Button>
      </div>
    </div>
  );
}
