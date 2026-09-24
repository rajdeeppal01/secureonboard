-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "hrisType" TEXT NOT NULL DEFAULT 'manual',
    "hrisApiKey" TEXT,
    "webhookSecret" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL,
    "externalId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "department" TEXT,
    "role" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "offboardedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Integration" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isConnected" BOOLEAN NOT NULL DEFAULT false,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "expiresAt" TIMESTAMP(3),
    "metadata" JSONB,
    "lastTestedAt" TIMESTAMP(3),
    "lastTestStatus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "Integration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OffboardingEvent" (
    "id" TEXT NOT NULL,
    "triggeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'in_progress',
    "triggeredBy" TEXT NOT NULL DEFAULT 'webhook',
    "n8nExecutionId" TEXT,
    "employeeId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "OffboardingEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccessRevocation" (
    "id" TEXT NOT NULL,
    "integration" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "revokedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "metadata" JSONB,
    "eventId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccessRevocation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organization_domain_key" ON "Organization"("domain");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_email_organizationId_key" ON "Employee"("email", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Integration_type_organizationId_key" ON "Integration"("type", "organizationId");

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Integration" ADD CONSTRAINT "Integration_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OffboardingEvent" ADD CONSTRAINT "OffboardingEvent_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OffboardingEvent" ADD CONSTRAINT "OffboardingEvent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessRevocation" ADD CONSTRAINT "AccessRevocation_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "OffboardingEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
