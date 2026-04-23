const cron = require('node-cron');
const prisma = require('../../prisma/client');

// Schedule task to run every day at midnight
const scheduleExpiredPemohonanCancellation = () => {
    cron.schedule('0 0 * * *', async () => {
        try {
            console.log('Running scheduled task: Cancel expired SURAT_PENAWARAN...');
            
            const now = new Date();

            // Find all expired SURAT_PENAWARAN that are still PENDING
            const expiredPemohonans = await prisma.pemohonan.findMany({
                where: {
                    jenis: 'SURAT_PENAWARAN',
                    status: 'PENDING',
                    tanggal_expired: {
                        lt: now,
                    },
                },
            });

            if (expiredPemohonans.length === 0) {
                console.log('No expired pemohonans found.');
                return;
            }

            console.log(`Found ${expiredPemohonans.length} expired pemohonans to cancel.`);

            // Cancel all expired pemohonans
            await prisma.$transaction(
                expiredPemohonans.map(pemohonan =>
                    prisma.pemohonan.update({
                        where: { id: pemohonan.id },
                        data: {
                            status: 'EXPIRED',
                            tanggal_action: now,
                        },
                    })
                )
            );

            console.log(`Successfully cancelled ${expiredPemohonans.length} expired pemohonans.`);
            
        } catch (error) {
            console.error('Error in scheduled task:', error);
        }
    });
};

module.exports = {
    scheduleExpiredPemohonanCancellation,
};
