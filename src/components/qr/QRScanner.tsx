"use client";

import { useState, type ReactNode } from "react";
import { Check, X, AlertTriangle, Flashlight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

type ScanResult =
  | { type: "valid"; guestName: string }
  | { type: "invalid"; reason: string }
  | { type: "used"; guestName: string }
  | null;

interface QRScannerProps {
  onScan?: (data: string) => void;
  scanResult?: ScanResult;
  onReset?: () => void;
  className?: string;
}

function ResultOverlay({
  result,
  onReset,
}: {
  result: NonNullable<ScanResult>;
  onReset?: () => void;
}) {
  const config: Record<
    string,
    { bg: string; icon: ReactNode; title: string; subtitle: string }
  > = {
    valid: {
      bg: "bg-success/90",
      icon: <Check size={56} strokeWidth={3} />,
      title: result.type === "valid" ? result.guestName : "",
      subtitle: "Entrada válida",
    },
    invalid: {
      bg: "bg-error/90",
      icon: <X size={56} strokeWidth={3} />,
      title: "QR Inválido",
      subtitle: result.type === "invalid" ? result.reason : "",
    },
    used: {
      bg: "bg-warning/90",
      icon: <AlertTriangle size={56} strokeWidth={2.5} />,
      title: "Ya ingresado",
      subtitle: result.type === "used" ? result.guestName : "",
    },
  };

  const c = config[result.type];

  return (
    <div
      className={cn(
        "absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 text-white animate-fade-in",
        c.bg
      )}
    >
      {c.icon}
      <div className="text-center">
        <p className="text-2xl font-bold">{c.title}</p>
        <p className="text-base opacity-90">{c.subtitle}</p>
      </div>
      {onReset && (
        <Button
          variant="surface"
          onClick={onReset}
          className="mt-4"
        >
          Escanear otro
        </Button>
      )}
    </div>
  );
}

export function QRScanner({
  onScan,
  scanResult,
  onReset,
  className,
}: QRScannerProps) {
  const [torchOn, setTorchOn] = useState(false);

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center h-[100dvh] bg-dark-950 overflow-hidden",
        className
      )}
    >
      {/* Camera viewport placeholder */}
      <div className="relative w-full h-full">
        {/* Camera feed would go here via a library like @yudiel/react-qr-scanner */}
        <div className="absolute inset-0 bg-dark-900" />

        {/* Guide overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Dimmed surroundings */}
          <div className="absolute inset-0 bg-black/60" />

          {/* Clear scan area */}
          <div className="relative z-10 h-64 w-64">
            {/* Transparent center */}
            <div className="absolute inset-0 bg-transparent" />

            {/* Corner decorations - gold */}
            {/* Top-left */}
            <div className="absolute top-0 left-0 h-8 w-8 border-t-3 border-l-3 border-gold-500 rounded-tl-lg" />
            {/* Top-right */}
            <div className="absolute top-0 right-0 h-8 w-8 border-t-3 border-r-3 border-gold-500 rounded-tr-lg" />
            {/* Bottom-left */}
            <div className="absolute bottom-0 left-0 h-8 w-8 border-b-3 border-l-3 border-gold-500 rounded-bl-lg" />
            {/* Bottom-right */}
            <div className="absolute bottom-0 right-0 h-8 w-8 border-b-3 border-r-3 border-gold-500 rounded-br-lg" />

            {/* Scan line animation */}
            <div
              className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-gold-500 to-transparent"
              style={{
                animation: "scan-line 2s ease-in-out infinite",
              }}
            />
          </div>
        </div>

        {/* Instructions */}
        <div className="absolute bottom-32 left-0 right-0 text-center z-10">
          <p className="text-dark-200 text-lg font-medium">
            Apuntá al QR
          </p>
          <p className="text-dark-400 text-sm mt-1">
            Posicioná el código dentro del recuadro
          </p>
        </div>

        {/* Torch button */}
        <div className="absolute bottom-16 left-0 right-0 flex justify-center z-10">
          <button
            onClick={() => setTorchOn(!torchOn)}
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-full transition-all duration-200",
              torchOn
                ? "bg-gold-500 text-dark-900"
                : "bg-surface-2 text-dark-300 border border-[rgba(255,255,255,0.06)]"
            )}
          >
            <Flashlight size={22} />
          </button>
        </div>

        {/* Result overlay */}
        {scanResult && (
          <ResultOverlay result={scanResult} onReset={onReset} />
        )}
      </div>

      <style jsx>{`
        @keyframes scan-line {
          0%, 100% { top: 8px; }
          50% { top: calc(100% - 8px); }
        }
      `}</style>
    </div>
  );
}
