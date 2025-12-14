-- CreateEnum
CREATE TYPE "PlayStyle" AS ENUM ('SP', 'DP');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('BEGINNER', 'NORMAL', 'HYPER', 'ANOTHER', 'LEGGENDARIA');

-- CreateTable
CREATE TABLE "Version" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Version_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Song" (
    "id" TEXT NOT NULL,
    "textageSlug" TEXT NOT NULL,
    "textageNumIndex" INTEGER,
    "title" TEXT NOT NULL,
    "titleKana" TEXT,
    "genre" TEXT NOT NULL,
    "artist" TEXT NOT NULL,
    "bpm" TEXT,
    "versionId" INTEGER,
    "isInAC" BOOLEAN NOT NULL DEFAULT true,
    "isInINFINITAS" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Song_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chart" (
    "id" TEXT NOT NULL,
    "songId" TEXT NOT NULL,
    "playStyle" "PlayStyle" NOT NULL,
    "difficulty" "Difficulty" NOT NULL,
    "level" INTEGER NOT NULL,
    "notes" INTEGER,
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

    CONSTRAINT "Chart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScraperRun" (
    "id" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "success" BOOLEAN NOT NULL DEFAULT false,
    "source" TEXT NOT NULL,
    "songsFound" INTEGER,
    "songsAdded" INTEGER,
    "songsUpdated" INTEGER,
    "errorMessage" TEXT,

    CONSTRAINT "ScraperRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Song_textageSlug_key" ON "Song"("textageSlug");

-- CreateIndex
CREATE INDEX "Song_title_idx" ON "Song"("title");

-- CreateIndex
CREATE INDEX "Song_versionId_idx" ON "Song"("versionId");

-- CreateIndex
CREATE INDEX "Song_textageSlug_idx" ON "Song"("textageSlug");

-- CreateIndex
CREATE INDEX "Chart_playStyle_level_idx" ON "Chart"("playStyle", "level");

-- CreateIndex
CREATE INDEX "Chart_unofficialClearLevel_idx" ON "Chart"("unofficialClearLevel");

-- CreateIndex
CREATE INDEX "Chart_unofficialHardLevel_idx" ON "Chart"("unofficialHardLevel");

-- CreateIndex
CREATE UNIQUE INDEX "Chart_songId_playStyle_difficulty_key" ON "Chart"("songId", "playStyle", "difficulty");

-- CreateIndex
CREATE INDEX "ScraperRun_startedAt_idx" ON "ScraperRun"("startedAt");

-- CreateIndex
CREATE INDEX "ScraperRun_source_idx" ON "ScraperRun"("source");

-- AddForeignKey
ALTER TABLE "Song" ADD CONSTRAINT "Song_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "Version"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chart" ADD CONSTRAINT "Chart_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song"("id") ON DELETE CASCADE ON UPDATE CASCADE;
