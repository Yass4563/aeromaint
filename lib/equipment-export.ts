import type { Prisma } from "@prisma/client";
import { Workbook } from "exceljs";

type ExportEquipement = Prisma.EquipementGetPayload<{
  include: {
    famille: true;
    zone: true;
    service: true;
  };
}>;

export async function generateEquipmentWorkbook(
  equipements: ExportEquipement[],
): Promise<Buffer> {
  const workbook = new Workbook();
  workbook.creator = "AeroMaint";
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet("Equipements");
  worksheet.columns = [
    { header: "Equipement", key: "nom", width: 30 },
    { header: "Code", key: "code", width: 18 },
    { header: "Marque", key: "marque", width: 20 },
    { header: "Numero de serie", key: "numeroSerie", width: 22 },
    { header: "Prix d'acquisition (MAD)", key: "prixAcquisition", width: 24 },
    { header: "Mode integre", key: "modeIntegre", width: 16 },
    { header: "AP / Service", key: "service", width: 24 },
    { header: "Installation / Zone", key: "zone", width: 24 },
    { header: "Mise en service", key: "miseEnService", width: 18 },
    { header: "Remplacement prevu", key: "remplacementPrevu", width: 22 },
    { header: "Service / Famille", key: "famille", width: 24 },
    { header: "Statut", key: "statut", width: 18 },
    { header: "Date d'arret", key: "dateArret", width: 18 },
    { header: "Remarques", key: "remarques", width: 45 },
  ];

  for (const equipement of equipements) {
    worksheet.addRow({
      nom: equipement.nom,
      code: equipement.code || "",
      marque: equipement.marque || "",
      numeroSerie: equipement.numeroSerie || "",
      prixAcquisition: equipement.prixAcquisition
        ? Number(equipement.prixAcquisition)
        : null,
      modeIntegre: equipement.modeIntegre ? "Integre" : "Standard",
      service: equipement.service.nom,
      zone: equipement.zone.nom,
      miseEnService: equipement.miseEnService,
      remplacementPrevu: equipement.remplacementPrevu,
      famille: equipement.famille.nom,
      statut: equipement.statut.replaceAll("_", " "),
      dateArret: equipement.dateArret,
      remarques: equipement.remarques || "",
    });
  }

  worksheet.autoFilter = {
    from: "A1",
    to: "N1",
  };
  worksheet.views = [{ state: "frozen", ySplit: 1 }];

  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF006D77" },
  };

  for (const columnKey of ["E", "I", "J", "M"]) {
    worksheet.getColumn(columnKey).numFmt =
      columnKey === "E" ? '#,##0.00 "MAD"' : "dd/mm/yyyy";
  }

  return Buffer.from(await workbook.xlsx.writeBuffer());
}
