export function QRCodeDisplay({ equipementId }: { equipementId: string }) {
  return (
    <div className="card flex flex-col items-center gap-4">
      <img
        src={`/api/equipment/${equipementId}/qr`}
        alt="QR Code de l'equipement"
        className="h-56 w-56 rounded-2xl border border-border bg-white p-4"
      />
      <a
        href={`/api/equipment/${equipementId}/qr`}
        download={`qr-${equipementId}.png`}
        className="text-sm font-semibold text-primary hover:underline"
      >
        Telecharger QR
      </a>
    </div>
  );
}
