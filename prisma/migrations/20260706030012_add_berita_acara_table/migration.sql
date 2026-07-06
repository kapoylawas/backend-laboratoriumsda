-- CreateTable
CREATE TABLE `berita_acaras` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `jadwal_id` INTEGER NOT NULL,
    `no_berita_acara` VARCHAR(191) NOT NULL,
    `jenis_sampel` VARCHAR(191) NOT NULL,
    `nama_sampel` VARCHAR(191) NULL,
    `tujuan_pengambilan` VARCHAR(191) NOT NULL,
    `titik_pengambilan` VARCHAR(191) NULL,
    `tanggal_pengambilan` DATETIME(3) NOT NULL,
    `waktu_pengambilan` VARCHAR(191) NULL,
    `tanggal_selesai_estimasi` DATETIME(3) NULL,
    `jumlah_wadah` VARCHAR(191) NOT NULL,
    `peralatan_pengambilan` VARCHAR(191) NOT NULL,
    `peralatan_pengukur` VARCHAR(191) NOT NULL,
    `peralatan_pendukung` VARCHAR(191) NOT NULL,
    `peralatan_k3` VARCHAR(191) NOT NULL,
    `cara_pengambilan` VARCHAR(191) NOT NULL,
    `pengendalian_mutu` VARCHAR(191) NOT NULL,
    `pengawet` VARCHAR(191) NOT NULL,
    `pengamanan_transportasi` VARCHAR(191) NOT NULL,
    `hasil_lapangan` VARCHAR(191) NOT NULL,
    `sidoarjo_date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `petugas_pengambil` VARCHAR(191) NOT NULL,
    `pelanggan_saksi` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'DRAFT',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `berita_acaras_jadwal_id_key`(`jadwal_id`),
    UNIQUE INDEX `berita_acaras_no_berita_acara_key`(`no_berita_acara`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `berita_acaras` ADD CONSTRAINT `berita_acaras_jadwal_id_fkey` FOREIGN KEY (`jadwal_id`) REFERENCES `jadwal_pengambilan`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
