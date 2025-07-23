/*
  Warnings:

  - You are about to drop the column `activationToken` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `tokenExpires` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `users` DROP COLUMN `activationToken`,
    DROP COLUMN `tokenExpires`,
    ADD COLUMN `activation_token` VARCHAR(191) NULL,
    ADD COLUMN `token_expires` DATETIME(3) NULL;
