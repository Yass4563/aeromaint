-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `nom` VARCHAR(191) NOT NULL,
    `prenom` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `role` ENUM('ADMIN', 'SUPERVISEUR', 'TECHNICIEN') NOT NULL DEFAULT 'TECHNICIEN',
    `serviceId` VARCHAR(191) NULL,
    `actif` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    INDEX `User_serviceId_idx`(`serviceId`),
    INDEX `User_role_idx`(`role`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Service` (
    `id` VARCHAR(191) NOT NULL,
    `nom` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Service_nom_key`(`nom`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Famille` (
    `id` VARCHAR(191) NOT NULL,
    `nom` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Famille_nom_key`(`nom`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Zone` (
    `id` VARCHAR(191) NOT NULL,
    `nom` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Zone_nom_key`(`nom`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Equipement` (
    `id` VARCHAR(191) NOT NULL,
    `nom` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NULL,
    `marque` VARCHAR(191) NULL,
    `numeroSerie` VARCHAR(191) NULL,
    `familleId` VARCHAR(191) NOT NULL,
    `zoneId` VARCHAR(191) NOT NULL,
    `serviceId` VARCHAR(191) NOT NULL,
    `statut` ENUM('EN_SERVICE', 'HORS_SERVICE', 'EN_PANNE') NOT NULL DEFAULT 'EN_SERVICE',
    `qrCode` VARCHAR(191) NOT NULL,
    `qrAppose` BOOLEAN NOT NULL DEFAULT false,
    `miseEnService` DATETIME(3) NULL,
    `remplacementPrevu` DATETIME(3) NULL,
    `dateArret` DATETIME(3) NULL,
    `prixAcquisition` DECIMAL(10, 2) NULL,
    `modeIntegre` BOOLEAN NOT NULL DEFAULT false,
    `remarques` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Equipement_code_key`(`code`),
    UNIQUE INDEX `Equipement_qrCode_key`(`qrCode`),
    INDEX `Equipement_familleId_idx`(`familleId`),
    INDEX `Equipement_zoneId_idx`(`zoneId`),
    INDEX `Equipement_serviceId_idx`(`serviceId`),
    INDEX `Equipement_statut_idx`(`statut`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EquipementPhoto` (
    `id` VARCHAR(191) NOT NULL,
    `equipementId` VARCHAR(191) NOT NULL,
    `url` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `EquipementPhoto_equipementId_idx`(`equipementId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Planning` (
    `id` VARCHAR(191) NOT NULL,
    `equipementId` VARCHAR(191) NOT NULL,
    `type` ENUM('ENTRETIEN', 'ETALONNAGE', 'CONTROLES_REGLEMENTAIRES') NOT NULL,
    `periodicite` ENUM('HEBDOMADAIRE', 'MENSUELLE', 'TRIMESTRIELLE', 'SEMESTRIELLE', 'ANNUELLE') NOT NULL,
    `dateDebut` DATETIME(3) NOT NULL,
    `eviterWeekend` BOOLEAN NOT NULL DEFAULT false,
    `nuit` BOOLEAN NOT NULL DEFAULT false,
    `technicienId` VARCHAR(191) NULL,
    `actif` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Planning_equipementId_idx`(`equipementId`),
    INDEX `Planning_technicienId_idx`(`technicienId`),
    INDEX `Planning_type_idx`(`type`),
    INDEX `Planning_periodicite_idx`(`periodicite`),
    INDEX `Planning_actif_idx`(`actif`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Task` (
    `id` VARCHAR(191) NOT NULL,
    `planningId` VARCHAR(191) NOT NULL,
    `equipementId` VARCHAR(191) NOT NULL,
    `technicienId` VARCHAR(191) NULL,
    `datePrevue` DATETIME(3) NOT NULL,
    `statut` ENUM('OUVERTE', 'SOUMISE', 'VALIDEE', 'REJETEE', 'CLOTUREE') NOT NULL DEFAULT 'OUVERTE',
    `soumisLe` DATETIME(3) NULL,
    `valideLe` DATETIME(3) NULL,
    `valideParId` VARCHAR(191) NULL,
    `rejeteLe` DATETIME(3) NULL,
    `rejeteParId` VARCHAR(191) NULL,
    `commentaireValidation` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Task_planningId_idx`(`planningId`),
    INDEX `Task_equipementId_idx`(`equipementId`),
    INDEX `Task_technicienId_idx`(`technicienId`),
    INDEX `Task_statut_idx`(`statut`),
    INDEX `Task_datePrevue_idx`(`datePrevue`),
    INDEX `Task_valideParId_idx`(`valideParId`),
    INDEX `Task_rejeteParId_idx`(`rejeteParId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RapportMaintenance` (
    `id` VARCHAR(191) NOT NULL,
    `taskId` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `dateIntervention` DATETIME(3) NOT NULL,
    `soumisParId` VARCHAR(191) NOT NULL,
    `pdfUrl` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `RapportMaintenance_taskId_key`(`taskId`),
    INDEX `RapportMaintenance_soumisParId_idx`(`soumisParId`),
    INDEX `RapportMaintenance_dateIntervention_idx`(`dateIntervention`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RapportPhoto` (
    `id` VARCHAR(191) NOT NULL,
    `rapportId` VARCHAR(191) NOT NULL,
    `url` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `RapportPhoto_rapportId_idx`(`rapportId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_serviceId_fkey` FOREIGN KEY (`serviceId`) REFERENCES `Service`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Equipement` ADD CONSTRAINT `Equipement_familleId_fkey` FOREIGN KEY (`familleId`) REFERENCES `Famille`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Equipement` ADD CONSTRAINT `Equipement_zoneId_fkey` FOREIGN KEY (`zoneId`) REFERENCES `Zone`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Equipement` ADD CONSTRAINT `Equipement_serviceId_fkey` FOREIGN KEY (`serviceId`) REFERENCES `Service`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EquipementPhoto` ADD CONSTRAINT `EquipementPhoto_equipementId_fkey` FOREIGN KEY (`equipementId`) REFERENCES `Equipement`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Planning` ADD CONSTRAINT `Planning_equipementId_fkey` FOREIGN KEY (`equipementId`) REFERENCES `Equipement`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Planning` ADD CONSTRAINT `Planning_technicienId_fkey` FOREIGN KEY (`technicienId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Task` ADD CONSTRAINT `Task_planningId_fkey` FOREIGN KEY (`planningId`) REFERENCES `Planning`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Task` ADD CONSTRAINT `Task_equipementId_fkey` FOREIGN KEY (`equipementId`) REFERENCES `Equipement`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Task` ADD CONSTRAINT `Task_technicienId_fkey` FOREIGN KEY (`technicienId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Task` ADD CONSTRAINT `Task_valideParId_fkey` FOREIGN KEY (`valideParId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Task` ADD CONSTRAINT `Task_rejeteParId_fkey` FOREIGN KEY (`rejeteParId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RapportMaintenance` ADD CONSTRAINT `RapportMaintenance_taskId_fkey` FOREIGN KEY (`taskId`) REFERENCES `Task`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RapportMaintenance` ADD CONSTRAINT `RapportMaintenance_soumisParId_fkey` FOREIGN KEY (`soumisParId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RapportPhoto` ADD CONSTRAINT `RapportPhoto_rapportId_fkey` FOREIGN KEY (`rapportId`) REFERENCES `RapportMaintenance`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
