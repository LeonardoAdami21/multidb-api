/*
  Warnings:

  - You are about to alter the column `sizeBytes` on the `Backup` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `sizeBytes` on the `Database` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `requests` on the `UsageRecord` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `storageBytes` on the `UsageRecord` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.

*/
-- AlterTable
ALTER TABLE "Backup" ALTER COLUMN "sizeBytes" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "Database" ALTER COLUMN "sizeBytes" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "UsageRecord" ALTER COLUMN "requests" SET DATA TYPE INTEGER,
ALTER COLUMN "storageBytes" SET DATA TYPE INTEGER;
