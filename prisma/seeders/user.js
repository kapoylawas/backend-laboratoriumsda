//import prisma client
const prisma = require('../client');

//import bcrypt
const bcrypt = require('bcryptjs');

async function main() {
    // Hash password
    const password = await bcrypt.hash('password', 10);

    // Create user
    await prisma.user.create({
        data: {
            name: 'Admin',
            email: 'admin@gmail.com',
            nik: '1234567890123456',
            phone: '081234567890',
            gender: 'male',
            alamat: 'Jl. Admin No. 1',
            is_active: true,
            password: password,
            activation_token: null,
            activation_token_expires: null,
            created_at: new Date(),
            updated_at: new Date()
        },
    });

    // You can add more seed data here if needed
    console.log('Seeder executed successfully');
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });