/*
  Warnings:

  - The primary key for the `Version` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "Song" DROP CONSTRAINT "Song_versionId_fkey";

-- AlterTable
ALTER TABLE "Song" ALTER COLUMN "versionId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Version" DROP CONSTRAINT "Version_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Version_pkey" PRIMARY KEY ("id");

-- AddForeignKey
ALTER TABLE "Song" ADD CONSTRAINT "Song_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "Version"("id") ON DELETE SET NULL ON UPDATE CASCADE;
