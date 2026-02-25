"use client";

import { useState, useEffect, useRef, useCallback, type ReactNode } from "react";
import { Check, X, AlertTriangle, Flashlight, Camera } from "lucide-react";
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
        <Button variant="surface" onClick={onReset} className="mt-4">
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
  const [torchSupported, setTorchSupported] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef<import("html5-qrcode").Html5Qrcode | null>(null);
  const containerId = useRef("qr-reader-" + Math.random().toString(36).slice(2));
  const lastScannedRef = useRef<string>("");
  const mountedRef = useRef(true);
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  // Start camera
  useEffect(() => {
    mountedRef.current = true;
    let html5Qrcode: import("html5-qrcode").Html5Qrcode | null = null;

    async function startScanner() {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (!mountedRef.current) return;

        html5Qrcode = new Html5Qrcode(containerId.current);
        scannerRef.current = html5Qrcode;

        await html5Qrcode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1,
            disableFlip: false,
          },
          (decodedText) => {
            if (decodedText === lastScannedRef.current) return;
            lastScannedRef.current = decodedText;
            onScanRef.current?.(decodedText);
          },
          () => {
            // No QR in frame — ignore
          }
        );

        if (!mountedRef.current) {
          await html5Qrcode.stop();
          return;
        }

        setScanning(true);

        // Check torch support
        try {
          const caps = html5Qrcode.getRunningTrackCapabilities();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          if (caps && "torch" in (caps as any)) {
            setTorchSupported(true);
          }
        } catch {
          // torch not supported
        }
      } catch (err) {
        if (!mountedRef.current) return;
        const message = err instanceof Error ? err.message : String(err);
        if (message.includes("Permission") || message.includes("NotAllowed")) {
          setCameraError("Permití el acceso a la cámara para escanear QRs");
        } else if (message.includes("NotFound") || message.includes("DevicesNotFound")) {
          setCameraError("No se encontró una cámara en este dispositivo");
        } else {
          setCameraError("No se pudo iniciar la cámara");
        }
      }
    }

    startScanner();

    return () => {
      mountedRef.current = false;
      if (html5Qrcode) {
        html5Qrcode.stop().catch(() => {});
        html5Qrcode.clear();
      }
      scannerRef.current = null;
    };
  }, []);

  // Reset last scanned when result is cleared
  useEffect(() => {
    if (!scanResult) {
      lastScannedRef.current = "";
    }
  }, [scanResult]);

  // Toggle torch
  const toggleTorch = useCallback(async () => {
    const scanner = scannerRef.current;
    if (!scanner) return;
    try {
      const newState = !torchOn;
      await scanner.applyVideoConstraints({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        advanced: [{ torch: newState } as any],
      });
      setTorchOn(newState);
    } catch {
      // Torch toggle failed
    }
  }, [torchOn]);

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center h-[100dvh] bg-dark-950 overflow-hidden",
        className
      )}
    >
      <div className="relative w-full h-full">
        {/* Camera feed — html5-qrcode renders video here */}
        <div
          id={containerId.current}
          className="absolute inset-0 [&_video]:!object-cover [&_video]:!w-full [&_video]:!h-full [&_video]:!max-w-none [&_video]:!max-h-none [&>img]:!hidden"
          style={{ overflow: "hidden" }}
        />

        {/* Camera error */}
        {cameraError && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-dark-900">
            <Camera size={48} className="text-dark-400" />
            <p className="text-dark-300 text-center px-8">{cameraError}</p>
            <Button variant="surface" onClick={() => window.location.reload()}>
              Reintentar
            </Button>
          </div>
        )}

        {/* Guide overlay */}
        {scanning && !scanResult && !cameraError && (
          <>
            <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
              <div className="absolute inset-0 bg-black/50" />
              <div
                className="relative z-10 h-64 w-64"
                style={{ boxShadow: "0 0 0 9999px rgba(0,0,0,0.5)" }}
              >
                {/* Corners */}
                <div className="absolute top-0 left-0 h-8 w-8 border-t-3 border-l-3 border-gold-500 rounded-tl-lg" />
                <div className="absolute top-0 right-0 h-8 w-8 border-t-3 border-r-3 border-gold-500 rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 h-8 w-8 border-b-3 border-l-3 border-gold-500 rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 h-8 w-8 border-b-3 border-r-3 border-gold-500 rounded-br-lg" />
                {/* Scan line */}
                <div
                  className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-gold-500 to-transparent"
                  style={{ animation: "scan-line 2s ease-in-out infinite" }}
                />
              </div>
            </div>

            {/* Instructions */}
            <div className="absolute bottom-32 left-0 right-0 text-center z-10">
              <p className="text-dark-200 text-lg font-medium">Apuntá al QR</p>
              <p className="text-dark-400 text-sm mt-1">Posicioná el código dentro del recuadro</p>
            </div>

            {/* Torch */}
            <div className="absolute bottom-16 left-0 right-0 flex justify-center z-10">
              <button
                onClick={toggleTorch}
                disabled={!torchSupported}
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-full transition-all duration-200",
                  !torchSupported && "opacity-30",
                  torchOn
                    ? "bg-gold-500 text-dark-900"
                    : "bg-surface-2 text-dark-300 border border-[rgba(255,255,255,0.06)]"
                )}
              >
                <Flashlight size={22} />
              </button>
            </div>
          </>
        )}

        {/* Result overlay */}
        {scanResult && <ResultOverlay result={scanResult} onReset={onReset} />}
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
