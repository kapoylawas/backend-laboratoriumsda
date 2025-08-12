# 🚀 Express.js API Starter with Prisma

![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB)
![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)
![Node.js](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)

Starter template untuk API Express.js dengan Prisma ORM, sudah termasuk konfigurasi database dan contoh seeder.

## 📦 Prasyarat

- Node.js v18 atau lebih baru
- npm/yarn/pnpm
- Database (PostgreSQL/MySQL/SQLite) sudah terinstall
- Prisma CLI (terinstall otomatis sebagai dev dependency)

## 🛠️ Instalasi Lengkap

```bash
# 1. Clone repository
git clone https://github.com/username/express-prisma-starter.git
cd express-prisma-starter

# 2. Install dependencies
npm install

# 3. Konfigurasi environment
cp .env.example .env
# Edit file .env sesuai konfigurasi database Anda

# 4. Jalankan migrasi database
npx prisma migrate dev --name init

# 5. Jalankan seeder
node prisma/seeders/user.js