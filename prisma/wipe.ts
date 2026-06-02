import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";

import {
  getDatabaseCounts,
  wipeAllData,
  wipePresentationData,
} from "./data-reset";

config({ path: ".env.local" });
config();

const prisma = new PrismaClient();

function printCounts(label: string, counts: Awaited<ReturnType<typeof getDatabaseCounts>>) {
  console.log(label);
  console.table(counts);
}

async function main() {
  const mode = process.argv[2];
  const dryRun = process.argv.includes("--dry-run");

  if (mode !== "all" && mode !== "presentation") {
    throw new Error(
      "Mode obligatoire. Utilisez `tsx prisma/wipe.ts presentation` ou `tsx prisma/wipe.ts all`.",
    );
  }

  printCounts("Donnees actuellement presentes :", await getDatabaseCounts(prisma));

  if (dryRun) {
    console.log(`Simulation uniquement : aucune suppression effectuee (${mode}).`);
    return;
  }

  if (mode === "presentation") {
    await wipePresentationData(prisma);
    console.log("Donnees de presentation supprimees.");
  } else {
    await wipeAllData(prisma);
    console.log("Toutes les donnees applicatives et les fichiers televerses ont ete supprimes.");
  }

  printCounts("Donnees restantes :", await getDatabaseCounts(prisma));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
