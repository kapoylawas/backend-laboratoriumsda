const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const os = require('os')
const process = require('process')

//import router
const router = require('./routes')

const app = express()

// Daftar domain dan IP yang diizinkan
const allowedOrigins = [
    'http://example.com',
    'https://example.com',
    'http://localhost:5173',
    'http://localhost:4173',
    'http://10.50.1.82:4173',
]

// Konfigurasi CORS
const corsOptions = {
    origin: function(origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true)
        } else {
            callback(new Error('Not allowed by CORS'))
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}

app.use(cors(corsOptions))
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

const port = 3001
const startTime = new Date()

// Fungsi untuk format durasi
function formatUptime(seconds) {
    const days = Math.floor(seconds / (3600 * 24))
    const hours = Math.floor((seconds % (3600 * 24)) / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)

    return `${days}d ${hours}h ${mins}m ${secs}s`
}

// Fungsi untuk format bytes ke ukuran yang lebih mudah dibaca
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes'

    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']

    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

app.get('/', (req, res) => {
    const uptime = process.uptime()
    const memoryUsage = process.memoryUsage()
    const totalMemory = os.totalmem()
    const freeMemory = os.freemem()

    res.send(`
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto;">
            <h1 style="color: #2c3e50;">🌐 API Service</h1>
            <p style="font-size: 1.1em;">Layanan API berjalan dengan baik</p>
            
            <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin-top: 20px;">
                <h3 style="margin-top: 0; color: #3498db;">Informasi Sistem</h3>
                <p><strong>Versi:</strong> 1.0.0</p>
                <p><strong>Status:</strong> <span style="color: #27ae60;">Aktif</span></p>
                <p><strong>Waktu Server:</strong> ${new Date().toString()}</p>
                <p><strong>Uptime:</strong> ${formatUptime(uptime)}</p>
                <p><strong>Dimulai pada:</strong> ${startTime.toLocaleString()}</p>
                
                <h3 style="margin-top: 15px; color: #3498db;">Penggunaan Memori</h3>
                <p><strong>Total Memory:</strong> ${formatBytes(totalMemory)}</p>
                <p><strong>Free Memory:</strong> ${formatBytes(freeMemory)}</p>
                <p><strong>Memory Usage:</strong> ${formatBytes(memoryUsage.rss)} (RSS)</p>
                <p><strong>Heap Used:</strong> ${formatBytes(memoryUsage.heapUsed)} / ${formatBytes(memoryUsage.heapTotal)}</p>
                
                <h3 style="margin-top: 15px; color: #3498db;">Informasi CPU</h3>
                <p><strong>Platform:</strong> ${os.platform()} (${os.arch()})</p>
                <p><strong>CPU:</strong> ${os.cpus()[0].model} (${os.cpus().length} cores)</p>
            </div>
            
            <div style="margin-top: 20px; font-size: 0.9em; color: #7f8c8d;">
                <p>Terakhir diperbarui: ${new Date().toLocaleTimeString()}</p>
            </div>
        </div>
    `)
})

// Route to serve uploaded files (if needed)
app.get('/uploads/:filename', (req, res) => {
    res.sendFile(path.join(__dirname, 'uploads', req.params.filename));
});

//define routes
app.use('/api', router);

app.listen(port, () => {
    console.log(`Server started on port ${port}`)
    console.log(`Server started at: ${startTime.toLocaleString()}`)
})