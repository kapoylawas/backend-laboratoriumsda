const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')

const app = express()

// Daftar domain dan IP yang diizinkan
const allowedOrigins = [
    'http://example.com', // Ganti dengan domain Anda
    'https://example.com', // Ganti dengan domain HTTPS Anda
    'http://192.168.1.100', // Ganti dengan IP tertentu
    'http://localhost:3000' // Untuk development
]

// Konfigurasi CORS
const corsOptions = {
    origin: function(origin, callback) {
        // Periksa jika origin ada di daftar allowedOrigins atau jika tidak ada origin (seperti request dari Postman)
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true)
        } else {
            callback(new Error('Not allowed by CORS'))
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}

// Gunakan CORS dengan konfigurasi di atas
app.use(cors(corsOptions))

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

const port = 3001

app.get('/', (req, res) => {
    res.send(`
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto;">
            <h1 style="color: #2c3e50;">🌐 API Service</h1>
            <p style="font-size: 1.1em;">Layanan API berjalan dengan baik</p>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin-top: 20px;">
                <p><strong>Versi:</strong> 1.0.0</p>
                <p><strong>Status:</strong> <span style="color: #27ae60;">Aktif</span></p>
                <p><strong>Waktu Server:</strong> ${new Date().toString()}</p>
            </div>
        </div>
    `)
})

app.listen(port, () => {
    console.log(`Server started on port ${port}`)
})