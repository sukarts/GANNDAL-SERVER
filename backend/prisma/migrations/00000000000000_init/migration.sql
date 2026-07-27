-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'REDACTEUR', 'JRI', 'COMPTABLE');

-- CreateEnum
CREATE TYPE "Priorite" AS ENUM ('BASSE', 'NORMALE', 'HAUTE', 'URGENTE');

-- CreateEnum
CREATE TYPE "StatutSujet" AS ENUM ('ASSIGNE', 'EN_COURS', 'LIVRE', 'VALIDE', 'REJETE');

-- CreateEnum
CREATE TYPE "TypeElement" AS ENUM ('VIDEO', 'AUDIO', 'PHOTO', 'DOCUMENT');

-- CreateEnum
CREATE TYPE "ActionValidation" AS ENUM ('VALIDE', 'REJETE', 'CORRECTION_DEMANDEE');

-- CreateEnum
CREATE TYPE "StatutFiche" AS ENUM ('BROUILLON', 'GENEREE', 'PAYEE');

-- CreateEnum
CREATE TYPE "EtatMateriel" AS ENUM ('NEUF', 'BON_ETAT', 'A_REPARER', 'HORS_SERVICE', 'PERDU', 'VOLE');

-- CreateEnum
CREATE TYPE "StatutMateriel" AS ENUM ('DISPONIBLE', 'AFFECTE', 'MAINTENANCE', 'PERDU', 'VOLE');

-- CreateEnum
CREATE TYPE "StatutDotation" AS ENUM ('EN_COURS', 'RESTITUE');

-- CreateEnum
CREATE TYPE "TypeIncident" AS ENUM ('PANNE', 'PERTE', 'VOL', 'DEGRADATION');

-- CreateEnum
CREATE TYPE "CanalNotif" AS ENUM ('INTERNE', 'EMAIL', 'WHATSAPP');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "telephone" TEXT,
    "role" "Role" NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "invitationToken" TEXT,
    "invitationExpiry" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JriProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tarifParSujet" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "tarifParMinute" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "tarifPersonnalise" JSONB,
    "iban" TEXT,
    "banque" TEXT,
    "pays" TEXT,
    "modePaiementPrefere" TEXT,
    "specialite" TEXT,
    "bio" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JriProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sujet" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT,
    "rubrique" TEXT,
    "jriId" TEXT,
    "createdById" TEXT NOT NULL,
    "dateLimite" TIMESTAMP(3),
    "priorite" "Priorite" NOT NULL DEFAULT 'NORMALE',
    "statut" "StatutSujet" NOT NULL DEFAULT 'ASSIGNE',
    "dureeMinutes" INTEGER NOT NULL DEFAULT 0,
    "livreLe" TIMESTAMP(3),
    "valideLe" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sujet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SujetElement" (
    "id" TEXT NOT NULL,
    "sujetId" TEXT NOT NULL,
    "type" "TypeElement" NOT NULL,
    "nomFichier" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "url" TEXT,
    "mime" TEXT,
    "tailleOctets" BIGINT NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 1,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SujetElement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Validation" (
    "id" TEXT NOT NULL,
    "sujetId" TEXT NOT NULL,
    "validateurId" TEXT NOT NULL,
    "action" "ActionValidation" NOT NULL,
    "commentaire" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Validation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Currency" (
    "code" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "symbole" TEXT NOT NULL,
    "tauxGnf" DECIMAL(18,6) NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "parDefaut" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Currency_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "FichePaiement" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "jriId" TEXT NOT NULL,
    "annee" INTEGER NOT NULL,
    "mois" INTEGER NOT NULL,
    "nbSujets" INTEGER NOT NULL DEFAULT 0,
    "totalMinutes" INTEGER NOT NULL DEFAULT 0,
    "montantBase" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "bonus" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "penalites" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "montantTotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "statut" "StatutFiche" NOT NULL DEFAULT 'BROUILLON',
    "pdfUrl" TEXT,
    "payeeLe" TIMESTAMP(3),
    "modePaiement" TEXT,
    "referencePaiement" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FichePaiement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Budget" (
    "id" TEXT NOT NULL,
    "rubrique" TEXT NOT NULL,
    "annee" INTEGER NOT NULL,
    "mois" INTEGER NOT NULL,
    "montantPrevu" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Budget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaiementLigne" (
    "id" TEXT NOT NULL,
    "ficheId" TEXT NOT NULL,
    "sujetId" TEXT,
    "libelle" TEXT NOT NULL,
    "quantite" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "tarif" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "montant" DECIMAL(12,2) NOT NULL DEFAULT 0,

    CONSTRAINT "PaiementLigne_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CategorieMateriel" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CategorieMateriel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Materiel" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "numInventaire" TEXT NOT NULL,
    "categorieId" TEXT NOT NULL,
    "marque" TEXT,
    "modele" TEXT,
    "numSerie" TEXT,
    "dateAchat" TIMESTAMP(3),
    "fournisseur" TEXT,
    "coutAcquisition" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "garantieFin" TIMESTAMP(3),
    "etat" "EtatMateriel" NOT NULL DEFAULT 'NEUF',
    "statut" "StatutMateriel" NOT NULL DEFAULT 'DISPONIBLE',
    "qrCodeData" TEXT,
    "qrCodeUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Materiel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dotation" (
    "id" TEXT NOT NULL,
    "materielId" TEXT NOT NULL,
    "jriId" TEXT NOT NULL,
    "responsableId" TEXT NOT NULL,
    "dateRemise" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "etatRemise" "EtatMateriel" NOT NULL,
    "photosRemise" TEXT[],
    "signatureUrl" TEXT,
    "observations" TEXT,
    "statut" "StatutDotation" NOT NULL DEFAULT 'EN_COURS',
    "dateRetour" TIMESTAMP(3),
    "etatRetour" "EtatMateriel",
    "photosRetour" TEXT[],
    "validateurId" TEXT,
    "montantDegradation" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "observationsRetour" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dotation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Maintenance" (
    "id" TEXT NOT NULL,
    "materielId" TEXT NOT NULL,
    "datePanne" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "prestataire" TEXT,
    "cout" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "dateRemiseEnService" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Maintenance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncidentMateriel" (
    "id" TEXT NOT NULL,
    "materielId" TEXT NOT NULL,
    "declareById" TEXT NOT NULL,
    "type" "TypeIncident" NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IncidentMateriel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "canal" "CanalNotif" NOT NULL DEFAULT 'INTERNE',
    "titre" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "lien" TEXT,
    "lu" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entite" TEXT NOT NULL,
    "entiteId" TEXT,
    "details" JSONB,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_invitationToken_key" ON "User"("invitationToken");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_token_key" ON "RefreshToken"("token");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "JriProfile_userId_key" ON "JriProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Sujet_reference_key" ON "Sujet"("reference");

-- CreateIndex
CREATE INDEX "Sujet_jriId_idx" ON "Sujet"("jriId");

-- CreateIndex
CREATE INDEX "Sujet_statut_idx" ON "Sujet"("statut");

-- CreateIndex
CREATE INDEX "Sujet_dateLimite_idx" ON "Sujet"("dateLimite");

-- CreateIndex
CREATE INDEX "SujetElement_sujetId_type_idx" ON "SujetElement"("sujetId", "type");

-- CreateIndex
CREATE INDEX "Validation_sujetId_idx" ON "Validation"("sujetId");

-- CreateIndex
CREATE UNIQUE INDEX "FichePaiement_reference_key" ON "FichePaiement"("reference");

-- CreateIndex
CREATE INDEX "FichePaiement_statut_idx" ON "FichePaiement"("statut");

-- CreateIndex
CREATE UNIQUE INDEX "FichePaiement_jriId_annee_mois_key" ON "FichePaiement"("jriId", "annee", "mois");

-- CreateIndex
CREATE UNIQUE INDEX "Budget_rubrique_annee_mois_key" ON "Budget"("rubrique", "annee", "mois");

-- CreateIndex
CREATE INDEX "PaiementLigne_ficheId_idx" ON "PaiementLigne"("ficheId");

-- CreateIndex
CREATE UNIQUE INDEX "CategorieMateriel_nom_key" ON "CategorieMateriel"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "Materiel_reference_key" ON "Materiel"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "Materiel_numInventaire_key" ON "Materiel"("numInventaire");

-- CreateIndex
CREATE INDEX "Materiel_categorieId_idx" ON "Materiel"("categorieId");

-- CreateIndex
CREATE INDEX "Materiel_statut_idx" ON "Materiel"("statut");

-- CreateIndex
CREATE INDEX "Dotation_materielId_idx" ON "Dotation"("materielId");

-- CreateIndex
CREATE INDEX "Dotation_jriId_idx" ON "Dotation"("jriId");

-- CreateIndex
CREATE INDEX "Dotation_statut_idx" ON "Dotation"("statut");

-- CreateIndex
CREATE INDEX "Maintenance_materielId_idx" ON "Maintenance"("materielId");

-- CreateIndex
CREATE INDEX "IncidentMateriel_materielId_idx" ON "IncidentMateriel"("materielId");

-- CreateIndex
CREATE INDEX "Notification_userId_lu_idx" ON "Notification"("userId", "lu");

-- CreateIndex
CREATE INDEX "AuditLog_entite_entiteId_idx" ON "AuditLog"("entite", "entiteId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JriProfile" ADD CONSTRAINT "JriProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sujet" ADD CONSTRAINT "Sujet_jriId_fkey" FOREIGN KEY ("jriId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sujet" ADD CONSTRAINT "Sujet_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SujetElement" ADD CONSTRAINT "SujetElement_sujetId_fkey" FOREIGN KEY ("sujetId") REFERENCES "Sujet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SujetElement" ADD CONSTRAINT "SujetElement_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Validation" ADD CONSTRAINT "Validation_sujetId_fkey" FOREIGN KEY ("sujetId") REFERENCES "Sujet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Validation" ADD CONSTRAINT "Validation_validateurId_fkey" FOREIGN KEY ("validateurId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FichePaiement" ADD CONSTRAINT "FichePaiement_jriId_fkey" FOREIGN KEY ("jriId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaiementLigne" ADD CONSTRAINT "PaiementLigne_ficheId_fkey" FOREIGN KEY ("ficheId") REFERENCES "FichePaiement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaiementLigne" ADD CONSTRAINT "PaiementLigne_sujetId_fkey" FOREIGN KEY ("sujetId") REFERENCES "Sujet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Materiel" ADD CONSTRAINT "Materiel_categorieId_fkey" FOREIGN KEY ("categorieId") REFERENCES "CategorieMateriel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dotation" ADD CONSTRAINT "Dotation_materielId_fkey" FOREIGN KEY ("materielId") REFERENCES "Materiel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dotation" ADD CONSTRAINT "Dotation_jriId_fkey" FOREIGN KEY ("jriId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dotation" ADD CONSTRAINT "Dotation_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dotation" ADD CONSTRAINT "Dotation_validateurId_fkey" FOREIGN KEY ("validateurId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Maintenance" ADD CONSTRAINT "Maintenance_materielId_fkey" FOREIGN KEY ("materielId") REFERENCES "Materiel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentMateriel" ADD CONSTRAINT "IncidentMateriel_materielId_fkey" FOREIGN KEY ("materielId") REFERENCES "Materiel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentMateriel" ADD CONSTRAINT "IncidentMateriel_declareById_fkey" FOREIGN KEY ("declareById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

