export function QRCodeDisplay({ equipementId }: { equipementId: string }) {
  return (
    <div className="card flex flex-col items-center gap-4">
      <img
        src={`/api/equipment/${equipementId}/qr`}
        alt="QR Code de l'equipement"
        className="h-56 w-56 rounded-2xl border border-border bg-white p-4"
      />
      <div className="flex flex-col items-center gap-2 text-sm font-semibold">
        <a
          href={`/api/equipment/${equipementId}/qr`}
          download={`qr-${equipementId}.png`}
          className="text-primary hover:underline"
        >
          Telecharger QR
        </a>
        <a
          href={`/api/equipment/${equipementId}/qr`}
          target="_blank"
          rel="noreferrer"
          className="text-muted hover:text-primary hover:underline"
        >
          Imprimer la feuille QR
        </a>
      </div>
    </div>
  );
}
