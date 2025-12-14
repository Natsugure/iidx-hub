/*
  Warnings:

  - You are about to drop the column `bpm` on the `songs` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "charts" ADD COLUMN     "bpm" TEXT;

-- AlterTable
ALTER TABLE "songs" DROP COLUMN "bpm";
