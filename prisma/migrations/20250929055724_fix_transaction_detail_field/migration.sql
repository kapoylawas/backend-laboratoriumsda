/*
  Warnings:

  - You are about to drop the column `samepel_id` on the `transaction_details` table. All the data in the column will be lost.
  - Added the required column `sampel_id` to the `transaction_details` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `transaction_details` DROP FOREIGN KEY `transaction_details_samepel_id_fkey`;

-- AlterTable
ALTER TABLE `transaction_details` DROP COLUMN `samepel_id`,
    ADD COLUMN `sampel_id` INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE `transaction_details` ADD CONSTRAINT `transaction_details_sampel_id_fkey` FOREIGN KEY (`sampel_id`) REFERENCES `sampels`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
