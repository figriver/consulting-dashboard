-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'CLIENT');

-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('PENDING', 'SYNCING', 'SUCCESS', 'FAILED');

-- CreateEnum
CREATE TYPE "CoachingMetricType" AS ENUM ('LEADS_TO_CONSULT_RATE', 'LEADS_TO_SALE_RATE', 'ROAS');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "role" "Role" NOT NULL DEFAULT 'CLIENT',
    "clientId" TEXT,
    "authProvider" TEXT NOT NULL DEFAULT 'google',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isMedical" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SheetsConfig" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "sheetId" TEXT NOT NULL,
    "sheetName" TEXT NOT NULL,
    "tabNames" TEXT[],
    "lastSyncedAt" TIMESTAMP(3),
    "syncStatus" "SyncStatus" NOT NULL DEFAULT 'PENDING',
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SheetsConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetricsRaw" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "medium" TEXT,
    "source" TEXT,
    "campaign" TEXT,
    "location" TEXT,
    "user" TEXT,
    "servicePerson" TEXT,
    "leads" INTEGER NOT NULL DEFAULT 0,
    "consults" INTEGER NOT NULL DEFAULT 0,
    "sales" INTEGER NOT NULL DEFAULT 0,
    "spend" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "roas" DECIMAL(8,4) NOT NULL DEFAULT 0,
    "leadsToConsultRate" DECIMAL(5,4) NOT NULL DEFAULT 0,
    "leadsToSaleRate" DECIMAL(5,4) NOT NULL DEFAULT 0,
    "rawDataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MetricsRaw_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoachingConfig" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "metricType" "CoachingMetricType" NOT NULL,
    "thresholdValue" DECIMAL(8,4) NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoachingConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoachingAlert" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "metricType" "CoachingMetricType" NOT NULL,
    "actualValue" DECIMAL(8,4) NOT NULL,
    "thresholdValue" DECIMAL(8,4) NOT NULL,
    "triggeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledgedAt" TIMESTAMP(3),
    "acknowledgedBy" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoachingAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_clientId_idx" ON "User"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "Client_name_key" ON "Client"("name");

-- CreateIndex
CREATE INDEX "Client_isMedical_idx" ON "Client"("isMedical");

-- CreateIndex
CREATE INDEX "SheetsConfig_clientId_idx" ON "SheetsConfig"("clientId");

-- CreateIndex
CREATE INDEX "SheetsConfig_syncStatus_idx" ON "SheetsConfig"("syncStatus");

-- CreateIndex
CREATE UNIQUE INDEX "SheetsConfig_clientId_sheetId_key" ON "SheetsConfig"("clientId", "sheetId");

-- CreateIndex
CREATE INDEX "MetricsRaw_clientId_idx" ON "MetricsRaw"("clientId");

-- CreateIndex
CREATE INDEX "MetricsRaw_clientId_date_idx" ON "MetricsRaw"("clientId", "date");

-- CreateIndex
CREATE INDEX "MetricsRaw_date_idx" ON "MetricsRaw"("date");

-- CreateIndex
CREATE UNIQUE INDEX "MetricsRaw_clientId_date_medium_source_campaign_location_key" ON "MetricsRaw"("clientId", "date", "medium", "source", "campaign", "location", "user", "servicePerson");

-- CreateIndex
CREATE INDEX "CoachingConfig_clientId_idx" ON "CoachingConfig"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "CoachingConfig_clientId_metricType_key" ON "CoachingConfig"("clientId", "metricType");

-- CreateIndex
CREATE INDEX "CoachingAlert_clientId_idx" ON "CoachingAlert"("clientId");

-- CreateIndex
CREATE INDEX "CoachingAlert_triggeredAt_idx" ON "CoachingAlert"("triggeredAt");

-- CreateIndex
CREATE INDEX "AuditLog_clientId_idx" ON "AuditLog"("clientId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SheetsConfig" ADD CONSTRAINT "SheetsConfig_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetricsRaw" ADD CONSTRAINT "MetricsRaw_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachingConfig" ADD CONSTRAINT "CoachingConfig_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachingAlert" ADD CONSTRAINT "CoachingAlert_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
