-- CreateTable
CREATE TABLE "Song" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "titleKana" TEXT,
    "genre" TEXT NOT NULL,
    "artist" TEXT NOT NULL,
    "bpm" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Song_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chart" (
    "id" TEXT NOT NULL,
    "songId" TEXT NOT NULL,
    "playStyle" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "unofficialLevel" TEXT,
    "notes" INTEGER,
    "difficultyTableUrl" TEXT,
    "wikiUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Chart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DifficultyTableUpdate" (
    "id" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "success" BOOLEAN NOT NULL,
    "message" TEXT,

    CONSTRAINT "DifficultyTableUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Song_title_idx" ON "Song"("title");

-- CreateIndex
CREATE INDEX "Song_version_idx" ON "Song"("version");

-- CreateIndex
CREATE INDEX "Chart_playStyle_level_idx" ON "Chart"("playStyle", "level");

-- CreateIndex
CREATE INDEX "Chart_unofficialLevel_idx" ON "Chart"("unofficialLevel");

-- CreateIndex
CREATE UNIQUE INDEX "Chart_songId_playStyle_difficulty_key" ON "Chart"("songId", "playStyle", "difficulty");

-- AddForeignKey
ALTER TABLE "Chart" ADD CONSTRAINT "Chart_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song"("id") ON DELETE CASCADE ON UPDATE CASCADE;
