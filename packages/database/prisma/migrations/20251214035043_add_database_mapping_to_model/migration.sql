/*
  Warnings:

  - You are about to drop the `Chart` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ScraperRun` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Song` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Version` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Chart" DROP CONSTRAINT "Chart_songId_fkey";

-- DropForeignKey
ALTER TABLE "Song" DROP CONSTRAINT "Song_versionId_fkey";

-- DropTable
DROP TABLE "Chart";

-- DropTable
DROP TABLE "ScraperRun";

-- DropTable
DROP TABLE "Song";

-- DropTable
DROP TABLE "Version";

-- CreateTable
CREATE TABLE "versions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "songs" (
    "id" TEXT NOT NULL,
    "textageSlug" TEXT NOT NULL,
    "textageNumIndex" INTEGER,
    "title" TEXT NOT NULL,
    "titleKana" TEXT,
    "genre" TEXT NOT NULL,
    "artist" TEXT NOT NULL,
    "bpm" TEXT,
    "versionId" TEXT,
    "isInAC" BOOLEAN NOT NULL DEFAULT true,
    "isInINFINITAS" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "songs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "charts" (
    "id" TEXT NOT NULL,
    "songId" TEXT NOT NULL,
    "playStyle" "PlayStyle" NOT NULL,
    "difficulty" "Difficulty" NOT NULL,
    "level" INTEGER NOT NULL,
    "notes" INTEGER,
    "isInAC" BOOLEAN NOT NULL DEFAULT true,
    "isInINFINITAS" BOOLEAN NOT NULL DEFAULT false,
    "unofficialClearLevel" TEXT,
    "unofficialHardLevel" TEXT,
    "easyCpi" DECIMAL(6,2),
    "clearCpi" DECIMAL(6,2),
    "hardCpi" DECIMAL(6,2),
    "exhCpi" DECIMAL(6,2),
    "fcCpi" DECIMAL(6,2),
    "easyIndividualVariation" DECIMAL(6,2),
    "clearIndividualVariation" DECIMAL(6,2),
    "hardIndividualVariation" DECIMAL(6,2),
    "exhIndividualVariation" DECIMAL(6,2),
    "fcIndividualVariation" DECIMAL(6,2),
    "wikiUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "charts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scraperRuns" (
    "id" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "success" BOOLEAN NOT NULL DEFAULT false,
    "source" TEXT NOT NULL,
    "songsFound" INTEGER,
    "songsAdded" INTEGER,
    "songsUpdated" INTEGER,
    "errorMessage" TEXT,

    CONSTRAINT "scraperRuns_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "songs_textageSlug_key" ON "songs"("textageSlug");

-- CreateIndex
CREATE INDEX "songs_title_idx" ON "songs"("title");

-- CreateIndex
CREATE INDEX "songs_versionId_idx" ON "songs"("versionId");

-- CreateIndex
CREATE INDEX "songs_textageSlug_idx" ON "songs"("textageSlug");

-- CreateIndex
CREATE INDEX "charts_playStyle_level_idx" ON "charts"("playStyle", "level");

-- CreateIndex
CREATE INDEX "charts_unofficialClearLevel_idx" ON "charts"("unofficialClearLevel");

-- CreateIndex
CREATE INDEX "charts_unofficialHardLevel_idx" ON "charts"("unofficialHardLevel");

-- CreateIndex
CREATE UNIQUE INDEX "charts_songId_playStyle_difficulty_key" ON "charts"("songId", "playStyle", "difficulty");

-- CreateIndex
CREATE INDEX "scraperRuns_startedAt_idx" ON "scraperRuns"("startedAt");

-- CreateIndex
CREATE INDEX "scraperRuns_source_idx" ON "scraperRuns"("source");

-- AddForeignKey
ALTER TABLE "songs" ADD CONSTRAINT "songs_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "charts" ADD CONSTRAINT "charts_songId_fkey" FOREIGN KEY ("songId") REFERENCES "songs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
