-- CreateTable
CREATE TABLE `pemohonans` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `jenis` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `tanggal_pengajuan` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `tanggal_expired` DATETIME(3) NULL,
    `tanggal_action` DATETIME(3) NULL,
    `catatan` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pemohonan_items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `pemohonan_id` INTEGER NOT NULL,
    `sampel_id` INTEGER NOT NULL,
    `qty` INTEGER NOT NULL,
    `price` DOUBLE NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `pemohonans` ADD CONSTRAINT `pemohonans_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pemohonan_items` ADD CONSTRAINT `pemohonan_items_pemohonan_id_fkey` FOREIGN KEY (`pemohonan_id`) REFERENCES `pemohonans`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pemohonan_items` ADD CONSTRAINT `pemohonan_items_sampel_id_fkey` FOREIGN KEY (`sampel_id`) REFERENCES `sampels`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
