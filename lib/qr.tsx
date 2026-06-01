/* eslint-disable jsx-a11y/alt-text */
import { Buffer } from "buffer";

import { Document, Page, StyleSheet, Text, View, Image, renderToBuffer } from "@react-pdf/renderer";
import QRCode from "qrcode";

import { buildEquipmentScanUrl } from "@/lib/qr-identification";

export async function generateQRCodeBuffer(
  equipementQrCode: string,
  baseUrl: string,
): Promise<Buffer> {
  return QRCode.toBuffer(buildEquipmentScanUrl(equipementQrCode, baseUrl), {
    width: 256,
    margin: 2,
  });
}

const styles = StyleSheet.create({
  page: {
    padding: 24,
    fontSize: 10,
    gap: 10,
  },
  header: {
    fontSize: 16,
    marginBottom: 8,
  },
  zoneTitle: {
    fontSize: 12,
    marginTop: 10,
    marginBottom: 6,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  item: {
    width: "23%",
    padding: 8,
    border: "1 solid #d9d4c8",
    borderRadius: 6,
    alignItems: "center",
  },
  qr: {
    width: 96,
    height: 96,
    marginBottom: 6,
  },
  label: {
    textAlign: "center",
    fontSize: 9,
  },
});

export async function generateQRSheet(
  equipements: { nom: string; qrCode: string; zone?: string | null }[],
  baseUrl: string,
): Promise<Buffer> {
  const grouped = new Map<string, { nom: string; qrCode: string }[]>();

  for (const equipement of equipements) {
    const zone = equipement.zone || "Sans zone";
    const bucket = grouped.get(zone) || [];
    bucket.push({ nom: equipement.nom, qrCode: equipement.qrCode });
    grouped.set(zone, bucket);
  }

  const entries = await Promise.all(
    Array.from(grouped.entries()).map(async ([zone, items]) => ({
      zone,
      items: await Promise.all(
        items.map(async (item) => ({
          ...item,
          qrImage: await QRCode.toDataURL(
            buildEquipmentScanUrl(item.qrCode, baseUrl),
            {
              width: 256,
              margin: 2,
            },
          ),
        })),
      ),
    })),
  );

  return renderToBuffer(
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>AeroMaint - Feuille QR</Text>
        {entries.map((entry) => (
          <View key={entry.zone}>
            <Text style={styles.zoneTitle}>{entry.zone}</Text>
            <View style={styles.grid}>
              {entry.items.map((item) => (
                <View key={item.qrCode} style={styles.item}>
                  <Image src={item.qrImage} style={styles.qr} />
                  <Text style={styles.label}>{item.nom}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}
      </Page>
    </Document>,
  );
}
