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
  generatorRole?: string | null;
  ticketId: string;
  qrCode: string;
  status: TicketStatus;
  onSendEmail?: () => Promise<void>;
  className?: string;
  brandingBgUrl?: string | null;
  brandingColorPrimary?: string | null;
  brandingColorText?: string | null;
  brandingLayout?: "banner" | "centered" | "fullbg" | null;
}

// WhatsApp brand icon
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
  generatorRole,
  ticketId,
  qrCode,
  status,
  onSendEmail,
  className,
  brandingBgUrl,
  brandingColorPrimary,
  brandingLayout,
}: QRDisplayProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [sending, setSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [sharing, setSharing] = useState(false);
  const isActive = status === "enviado";

  const hasBranding = !!brandingBgUrl;
  const layout: "banner" | "centered" | "fullbg" =
    brandingLayout === "centered" || brandingLayout === "fullbg" ? brandingLayout : "banner";
  const isFullBg = hasBranding && layout === "fullbg";
  const containBg = brandingColorPrimary || "#0d0d0d";

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(qrCode)}&bgcolor=ebf1e2&color=0d0d0d&margin=10`;

  const generatePngBlob = useCallback(async (): Promise<Blob | null> => {
    if (!cardRef.current) return null;
    const html2canvas = (await import("html2canvas-pro")).default;
    const canvas = await html2canvas(cardRef.current, {
      backgroundColor: "#0d0d0d",
      scale: 2,
      useCORS: true,
    });
    return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), "image/png"));
  }, []);

  const filename = `ciclosuma-entrada-${guestDni}-${ticketId.slice(0, 8)}.png`;

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

      if (nav.canShare && nav.canShare({ files: [file] }) && navigator.share) {
        try {
          await navigator.share({
            files: [file],
            title: `Entrada para ${eventName}`,
            text: shareText,
          });
          return;
        } catch (err) {
          if ((err as Error)?.name === "AbortError") return;
        }
      }

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

  const sectionBg = isFullBg ? "bg-transparent" : "bg-[#0d0d0d]";

  return (
    <div className={cn("flex flex-col gap-4 w-full", className)}>
      {/* Ticket card — capturable for download */}
      <div
        ref={cardRef}
        className={cn(
          "relative overflow-hidden rounded-[14px] border w-full bg-[#0d0d0d]",
          isActive
            ? "border-[#e3fd8c]/50"
            : "border-[rgba(235,241,226,0.08)]"
        )}
      >
        {/* Full background layer (fullbg mode) */}
        {isFullBg && (
          <>
            <img
              src={brandingBgUrl!}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-[#0d0d0d]/75 backdrop-blur-[2px]" />
          </>
        )}

        <div className="relative z-10">
          {/* Status badge */}
          <div className="absolute top-4 right-4 z-20">
            <Badge variant={status}>{status.toUpperCase()}</Badge>
          </div>

          {/* Top brand strip — always visible, prominent */}
          <div className={cn(
            "flex justify-center px-5 pt-8 pb-6",
            !isFullBg && "bg-[#0d0d0d] border-b border-[rgba(235,241,226,0.06)]"
          )}>
            <Image
              src="/images/logo-ciclosuma-cream.png"
              alt="Ciclosuma"
              width={480}
              height={108}
              className={cn(
                "h-20 sm:h-24 w-auto",
                isFullBg && "drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]"
              )}
              priority
            />
          </div>

          {/* Optional branding banner — no event name overlay */}
          {!isFullBg && hasBranding && (
            <div
              className="relative h-44 sm:h-52 overflow-hidden"
              style={layout === "centered" ? { backgroundColor: containBg } : undefined}
            >
              <img
                src={brandingBgUrl!}
                alt=""
                className={cn(
                  "absolute inset-0 w-full h-full",
                  layout === "centered" ? "object-contain" : "object-cover"
                )}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-[#0d0d0d]/30 via-[#0d0d0d]/45 to-[#0d0d0d]/80" />
            </div>
          )}

          {/* Brand strip + date / time */}
          <div className={cn(
            "px-5 pt-4 pb-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-b border-[rgba(235,241,226,0.04)]",
            sectionBg
          )}>
            <span className="text-[11px] uppercase tracking-[0.18em] text-[#9a9f93] font-medium">
              {eventDate}
            </span>
            <span className="text-[#3f4239]">•</span>
            <span className="text-[11px] uppercase tracking-[0.18em] text-[#9a9f93] font-medium">
              {eventTime}
            </span>
          </div>

          {/* QR Code */}
          <div className={cn("flex justify-center px-5 py-6", sectionBg)}>
            <div className="bg-[#ebf1e2] rounded-2xl p-3 sm:p-4 shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
              <img
                src={qrImageUrl}
                alt="QR de entrada"
                className="h-44 w-44 sm:h-52 sm:w-52 object-contain"
                crossOrigin="anonymous"
              />
            </div>
          </div>

          {/* Event name (below QR) */}
          <div className={cn("px-5 pb-2 text-center", sectionBg)}>
            <h3 className={cn(
              "text-xs sm:text-sm font-medium tracking-tight leading-tight line-clamp-2 text-[#9a9f93]",
              isFullBg && "drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]"
            )}>
              {eventName}
            </h3>
          </div>

          {/* Guest info */}
          <div className={cn("px-5 pb-3 text-center", sectionBg)}>
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#7a7e72] font-medium mb-1">
              Documento
            </p>
            <p className="text-2xl font-bold tracking-tight text-[#ebf1e2] tabular-nums">
              {guestDni}
            </p>
            {guestEmail && (
              <p className="text-xs text-[#7a7e72] mt-1 truncate">{guestEmail}</p>
            )}
          </div>

          {/* Footer */}
          <div className={cn(
            "flex items-center gap-2 px-5 py-3 border-t border-[rgba(235,241,226,0.06)]",
            generatorRole === "ADMIN" ? "justify-center" : "justify-between",
            sectionBg
          )}>
            {generatorRole !== "ADMIN" && (
              <span className="text-[10px] uppercase tracking-wide text-[#5e6258] truncate">
                Por {generatedBy}
              </span>
            )}
            <span className="text-[10px] text-[#5e6258] font-mono tracking-tight shrink-0">
              {ticketId.slice(0, 12)}
            </span>
          </div>

        </div>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full">
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
