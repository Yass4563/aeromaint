"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { normalizeQrCodeValue } from "@/lib/qr-identification";

export function QRScanner({ initialError = "" }: { initialError?: string }) {
  const router = useRouter();
  const elementId = `scanner-${useId().replace(/:/g, "")}`;
  const scanLockedRef = useRef(false);
  const [error, setError] = useState(initialError);

  useEffect(() => {
    let mounted = true;
    let scanner:
      | {
          start: (
            cameraConfig: { facingMode: string },
            config: { fps: number; qrbox: number },
            onSuccess: (decodedText: string) => void,
            onError: (error: string) => void,
          ) => Promise<unknown>;
          stop: () => Promise<void>;
          clear: () => void;
        }
      | null = null;

    async function startScanner() {
      const scannerModule = await import("html5-qrcode");
      const Html5Qrcode = scannerModule.Html5Qrcode;
      const instance = new Html5Qrcode(elementId);
      scanner = instance;

      await instance.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 220 },
        (decodedText: string) => {
          if (scanLockedRef.current) {
            return;
          }

          const qrCode = normalizeQrCodeValue(decodedText);

          if (qrCode) {
            scanLockedRef.current = true;
            router.push(`/tasks/scan?qr=${encodeURIComponent(qrCode)}`);
          } else {
            setError("QR code invalide.");
          }
        },
        () => undefined,
      );
    }

    startScanner().catch(() => {
      if (mounted) {
        setError("Impossible d'acceder a la camera.");
      }
    });

    return () => {
      mounted = false;
      if (scanner) {
        scanner.stop().catch(() => undefined).finally(() => scanner?.clear());
      }
    };
  }, [elementId, router]);

  return (
    <div className="card">
      <h1 className="text-2xl font-black">Scanner un equipement</h1>
      <p className="mt-2 text-sm text-muted">
        Positionnez le QR code de l equipement dans le cadre.
      </p>
      <div id={elementId} className="mt-6 overflow-hidden rounded-3xl" />
      {error ? <p className="mt-4 text-sm text-danger">{error}</p> : null}
    </div>
  );
}
