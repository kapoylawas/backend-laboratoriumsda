const cron = require('node-cron');
const prisma = require('../../prisma/client');

// Schedule task to run every day at midnight
const scheduleExpiredPemohonanCancellation = () => {
    cron.schedule('0 0 * * *', async () => {
        try {
            console.log('Running scheduled task: Cancel expired SURAT_PENAWARAN...');
            
            const now = new Date();

            // Atomically cancel all expired SURAT_PENAWARAN that are still PENDING
            const result = await prisma.pemohonan.updateMany({
                where: {
                    jenis: 'SURAT_PENAWARAN',
                    status: 'PENDING',
                    tanggal_expired: {
                        lt: now,
                    },
                },
                data: {
                    status: 'EXPIRED',
                    tanggal_action: now,
                },
            });

            if (result.count === 0) {
                console.log('No expired pemohonans found.');
            } else {
                console.log(`Successfully cancelled ${result.count} expired pemohonans.`);
            }
            
        } catch (error) {
            console.error('Error in scheduled task:', error);
        }
    });
};

module.exports = {
    scheduleExpiredPemohonanCancellation,
};
