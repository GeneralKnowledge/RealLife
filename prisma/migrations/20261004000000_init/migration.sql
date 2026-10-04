-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "provider" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "shortDescription" TEXT,
    "location" TEXT NOT NULL,
    "region" TEXT NOT NULL DEFAULT 'Scotland',
    "activityType" TEXT NOT NULL,
    "priceFrom" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "durationMinutes" INTEGER,
    "rating" REAL,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "imageUrl" TEXT NOT NULL,
    "affiliateUrl" TEXT NOT NULL,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "rawJson" TEXT,
    "syncedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Creative" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "headline" TEXT NOT NULL,
    "subheadline" TEXT,
    "ctaLabel" TEXT NOT NULL DEFAULT 'GET OUTSIDE',
    "locationLine" TEXT,
    "priceLine" TEXT,
    "imageUrl" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Creative_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "creativeId" TEXT,
    "activityId" TEXT,
    "meta" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Event_creativeId_fkey" FOREIGN KEY ("creativeId") REFERENCES "Creative" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Activity_location_idx" ON "Activity"("location");

-- CreateIndex
CREATE INDEX "Activity_activityType_idx" ON "Activity"("activityType");

-- CreateIndex
CREATE INDEX "Activity_priceFrom_idx" ON "Activity"("priceFrom");

-- CreateIndex
CREATE INDEX "Activity_rating_idx" ON "Activity"("rating");

-- CreateIndex
CREATE INDEX "Activity_region_idx" ON "Activity"("region");

-- CreateIndex
CREATE UNIQUE INDEX "Activity_provider_externalId_key" ON "Activity"("provider", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "Creative_slug_key" ON "Creative"("slug");

-- CreateIndex
CREATE INDEX "Creative_activityId_idx" ON "Creative"("activityId");

-- CreateIndex
CREATE INDEX "Creative_status_idx" ON "Creative"("status");

-- CreateIndex
CREATE INDEX "Event_type_idx" ON "Event"("type");

-- CreateIndex
CREATE INDEX "Event_creativeId_idx" ON "Event"("creativeId");

-- CreateIndex
CREATE INDEX "Event_activityId_idx" ON "Event"("activityId");

-- CreateIndex
CREATE INDEX "Event_createdAt_idx" ON "Event"("createdAt");

