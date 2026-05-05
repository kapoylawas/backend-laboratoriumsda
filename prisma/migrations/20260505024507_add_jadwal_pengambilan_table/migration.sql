-- CreateTable
CREATE TABLE `jadwal_pengambilan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `transaction_detail_id` INTEGER NOT NULL,
    `tanggal_pengambilan` DATETIME(3) NOT NULL,
    `jam_pengambilan` VARCHAR(191) NOT NULL,
    `lokasi` VARCHAR(191) NOT NULL,
    `petugas` VARCHAR(191) NOT NULL,
    `catatan` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `jadwal_pengambilan` ADD CONSTRAINT `jadwal_pengambilan_transaction_detail_id_fkey` FOREIGN KEY (`transaction_detail_id`) REFERENCES `transaction_details`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
