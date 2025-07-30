const prisma = require('../client');
const bcrypt = require('bcryptjs');

async function main() {
    // 1. Seed roles terlebih dahulu
    const roles = await prisma.role.createMany({
        data: [
            { name: 'Pemohon' },
            { name: 'Admin Labkesda' },
            { name: 'Analisis' },
            { name: 'Verikator' },
            { name: 'Kepala Labkesda' }
        ],
        skipDuplicates: true
    });

    console.log('Created roles:', roles.count, 'roles');

    // 2. Hash password untuk admin
    const adminPassword = await bcrypt.hash('admin123', 10);

    // 3. Cari role Admin Labkesda
    const adminRole = await prisma.role.findUnique({
        where: { name: 'Admin Labkesda' }
    });

    if (!adminRole) {
        throw new Error('Admin role not found');
    }

    // 4. Buat user admin
    const adminUser = await prisma.user.create({
        data: {
            name: 'Admin',
            email: 'admin@gmail.com',
            nik: '1234567890123456',
            phone: '081234567890',
            gender: 'male',
            alamat: 'Jl. Admin No. 1',
            is_active: true,
            password: adminPassword,
            activation_token: null,
            activation_token_expires: null,
            created_at: new Date(),
            updated_at: new Date(),
            role_id: adminRole.id // Menambahkan relasi ke role
        }
    });

    console.log('Created admin user:', adminUser);

    // 5. (Opsional) Buat contoh user pemohon
    const applicantPassword = await bcrypt.hash('pemohon123', 10);
    const applicantRole = await prisma.role.findUnique({
        where: { name: 'Pemohon' }
    });

    if (applicantRole) {
        const applicantUser = await prisma.user.create({
            data: {
                name: 'John Doe',
                email: 'pemohon@gmail.com',
                nik: '9876543210987654',
                phone: '081298765432',
                gender: 'male',
                alamat: 'Jl. Pemohon No. 123',
                is_active: true,
                password: applicantPassword,
                activation_token: null,
                activation_token_expires: null,
                created_at: new Date(),
                updated_at: new Date(),
                role_id: applicantRole.id
            }
        });
        console.log('Created applicant user:', applicantUser);
    }

    console.log('Seeder executed successfully');
}

main()
    .catch(e => {
        console.error('Seeder error:', e);
        process.exit(1);
    })
    .finally(async() => {
        await prisma.$disconnect();
    });