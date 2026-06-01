/* eslint-disable jsx-a11y/alt-text */
import { existsSync } from "fs";
import path from "path";

import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";

import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

const styles = StyleSheet.create({
  page: {
    padding: 24,
    fontSize: 10,
    color: "#1d1d1b",
  },
  header: {
    marginBottom: 14,
    paddingBottom: 10,
    borderBottom: "1 solid #d9d4c8",
  },
  title: {
    fontSize: 16,
    fontWeight: 700,
  },
  subtitle: {
    marginTop: 4,
    color: "#5c5a55",
  },
  section: {
    marginBottom: 12,
    gap: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    marginBottom: 4,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  column: {
    flex: 1,
  },
  text: {
    lineHeight: 1.4,
  },
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  photo: {
    width: "23%",
    height: 96,
    objectFit: "cover",
    borderRadius: 4,
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 24,
    right: 24,
    textAlign: "center",
    color: "#5c5a55",
    fontSize: 9,
  },
});

function resolvePhotoSource(url: string): string | undefined {
  if (!url.startsWith("/uploads/")) {
    return undefined;
  }

  const uploadRoot = path.join(process.cwd(), "public", "uploads");
  const relativePath = url.slice("/uploads/".length);
  const absolutePath = path.normalize(path.join(uploadRoot, relativePath));
  const relativeToRoot = path.relative(uploadRoot, absolutePath);

  if (relativeToRoot.startsWith("..") || path.isAbsolute(relativeToRoot)) {
    return undefined;
  }

  return existsSync(absolutePath) ? absolutePath : undefined;
}

export async function generateRapportPDF(rapportId: string): Promise<Buffer> {
  const rapport = await prisma.rapportMaintenance.findUnique({
    where: { id: rapportId },
    include: {
      photos: true,
      soumisPar: true,
      task: {
        include: {
          planning: true,
          equipement: {
            include: {
              famille: true,
              zone: true,
              service: true,
            },
          },
          validePar: true,
        },
      },
    },
  });

  if (!rapport) {
    throw new Error("REPORT_NOT_FOUND");
  }

  const photoSources = rapport.photos
    .map((photo) => resolvePhotoSource(photo.url))
    .filter((value): value is string => Boolean(value));

  return renderToBuffer(
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>AeroMaint - Rapport de maintenance</Text>
          <Text style={styles.subtitle}>
            Date de generation : {formatDate(new Date(), "dd/MM/yyyy HH:mm")}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Equipement</Text>
          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.text}>Nom : {rapport.task.equipement.nom}</Text>
              <Text style={styles.text}>Code : {rapport.task.equipement.code || "-"}</Text>
              <Text style={styles.text}>Famille : {rapport.task.equipement.famille.nom}</Text>
            </View>
            <View style={styles.column}>
              <Text style={styles.text}>Zone : {rapport.task.equipement.zone.nom}</Text>
              <Text style={styles.text}>Service : {rapport.task.equipement.service.nom}</Text>
              <Text style={styles.text}>Type : {rapport.task.planning.type}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Intervention</Text>
          <Text style={styles.text}>
            Date : {formatDate(rapport.dateIntervention, "dd/MM/yyyy HH:mm")}
          </Text>
          <Text style={styles.text}>
            Technicien : {rapport.soumisPar.nom} {rapport.soumisPar.prenom}
          </Text>
          <Text style={styles.text}>Description :</Text>
          <Text style={styles.text}>{rapport.description}</Text>
        </View>

        {rapport.task.valideLe ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Validation</Text>
            <Text style={styles.text}>
              Valide par : {rapport.task.validePar?.nom || "-"} {rapport.task.validePar?.prenom || ""}
            </Text>
            <Text style={styles.text}>
              Date de validation : {formatDate(rapport.task.valideLe, "dd/MM/yyyy HH:mm")}
            </Text>
            <Text style={styles.text}>
              Commentaire : {rapport.task.commentaireValidation || "-"}
            </Text>
          </View>
        ) : null}

        {photoSources.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Photos</Text>
            <View style={styles.photoGrid}>
              {photoSources.map((src, index) => (
                <Image key={`${src}-${index}`} src={src} style={styles.photo} />
              ))}
            </View>
          </View>
        ) : null}

        <Text
          style={styles.footer}
          render={({ pageNumber, totalPages }) =>
            `ESU - Maintenance preventive - Page ${pageNumber}/${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>,
  );
}
