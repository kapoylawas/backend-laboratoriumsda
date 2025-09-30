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
cara install backends
install nginx

# 2. 
curl -sL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# 3.
sudo apt-get install -y nodejs
node -v

# 4.
npm install -g pm2

# 5.
cd /var/www

# 6.
git clone https://github.com/kapoylawas/backend-laboratoriumsda.git

# 7.
cd backend-laboratoriumsda

# 8.
npm install

# 9.
nano .env

copas di bawah ini :

DATABASE_URL="mysql://root:Gr11mj00w@localhost:3306/db_labkesda"
JWT_SECRET=8a7c9a8e554f793e7e78ce94c0afd8aa2562ccf1e65c61d341694a66dbfa2ad5

# Email Configuration
MAIL_HOST=relay.sidoarjokab.go.id
MAIL_PORT=587
MAIL_USERNAME=noreply@sidoarjokab.go.id
MAIL_PASSWORD=Dontem@ilm3
MAIL_FROM_ADDRESS=noreply@sidoarjokab.go.id
MAIL_FROM_NAME="Laboratorium Sidoarjo"

# 10
npx prisma db push

# 11
node prisma/seeders/user.js

# 12
sudo pm2 startup
sudo pm2 start index.js --name=BACKEND-API-LAB
sudo pm2 save

# 13
cd /etc/nginx/sites-available

server {
  listen 80;
    
  server_name api-lab.sidoarjokab.go.id;
    
  location / {
    proxy_pass http://localhost:3001; # Change the port if needed
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }
}

sudo service nginx restart
