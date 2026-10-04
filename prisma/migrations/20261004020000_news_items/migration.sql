-- CreateTable
CREATE TABLE "NewsItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "source" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL DEFAULT '',
    "url" TEXT NOT NULL,
    "imageUrl" TEXT,
    "publishedAt" DATETIME NOT NULL,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "region" TEXT NOT NULL DEFAULT 'Scotland',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "NewsFeedCache" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "feedUrl" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "etag" TEXT,
    "lastModified" TEXT,
    "fetchedAt" DATETIME,
    "expiresAt" DATETIME,
    "lastStatus" TEXT NOT NULL DEFAULT 'never',
    "rawHash" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "NewsItem_source_externalId_key" ON "NewsItem"("source", "externalId");

-- CreateIndex
CREATE INDEX "NewsItem_status_idx" ON "NewsItem"("status");

-- CreateIndex
CREATE INDEX "NewsItem_publishedAt_idx" ON "NewsItem"("publishedAt");

-- CreateIndex
CREATE INDEX "NewsItem_source_idx" ON "NewsItem"("source");

-- CreateIndex
CREATE UNIQUE INDEX "NewsFeedCache_feedUrl_key" ON "NewsFeedCache"("feedUrl");

-- CreateIndex
CREATE INDEX "NewsFeedCache_source_idx" ON "NewsFeedCache"("source");

-- CreateIndex
CREATE INDEX "NewsFeedCache_expiresAt_idx" ON "NewsFeedCache"("expiresAt");
