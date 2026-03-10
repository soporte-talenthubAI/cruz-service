"use client";

import { useState, useCallback } from "react";
import { QRScanner } from "@/components/qr/QRScanner";

type ScanResult =
  | { type: "valid"; guestName: string }
  | { type: "invalid"; reason: string }
  | { type: "used"; guestName: string }
  | null;

export default function ScannerPage() {
  const [scanResult, setScanResult] = useState<ScanResult>(null);

  const handleScan = useCallback(async (qrData: string) => {
    try {
      const res = await fetch(`/api/entradas/${encodeURIComponent(qrData)}/validar`, {
        method: "POST",
      });
      const data = await res.json();

      if (res.status === 409) {
        setScanResult({ type: "used", guestName: data.data?.entrada?.nombreInvitado || "Desconocido" });
      } else if (res.ok) {
        setScanResult({ type: "valid", guestName: data.data?.entrada?.nombreInvitado || "Invitado" });
      } else {
        setScanResult({ type: "invalid", reason: data.error || "QR inválido" });
      }
    } catch {
      setScanResult({ type: "invalid", reason: "Error de conexión" });
    }
  }, []);

  return (
    <div className="-mx-4 -mt-14 lg:mx-0 lg:mt-0 lg:pt-4" style={{ marginTop: "calc(-56px - env(safe-area-inset-top))" }}>
      <div className="lg:max-w-2xl lg:mx-auto lg:rounded-2xl lg:overflow-hidden lg:h-[75vh]">
        <QRScanner
          onScan={handleScan}
          scanResult={scanResult}
          onReset={() => setScanResult(null)}
        />
      </div>
    </div>
  );
}
