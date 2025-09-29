-- AlterTable
ALTER TABLE `orders` ADD COLUMN `status` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `transaction_details` ADD COLUMN `status_bayar` BOOLEAN NOT NULL DEFAULT false;
