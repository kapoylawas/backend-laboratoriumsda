const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const bodyParser = require('body-parser')
const os = require('os')
const process = require('process')
const fs = require('fs')
const path = require('path')

// Ensure uploads directory exists on startup
const uploadsDir = path.join(__dirname, 'uploads')
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir)
}

//import router and middlewares
const router = require('./routes')
const { apiLimiter } = require('./middlewares')

//import scheduler
const { scheduleExpiredPemohonanCancellation } = require('./utils/schedulers/pemohonanScheduler')

const app = express()

// Security Headers with Helmet
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" } // Allows authorized frontend to load uploaded files
}))

// Daftar domain dan IP yang diizinkan
const allowedOrigins = [
    'http://example.com',
    'https://example.com',
    'http://localhost:5173',
    'http://localhost:4173',
    'http://10.50.1.82:4173',
    'https://lab2.sidoarjokab.go.id',
    'https://lab.sidoarjokab.go.id',
    'https://api-lab.sidoarjokab.go.id',  // Added API domain
]

// Konfigurasi CORS
const corsOptions = {
    origin: function(origin, callback) {
        // Allow all origins in development, restrict in production
        if (process.env.NODE_ENV === 'development' || !origin) {
            callback(null, true)
            return
        }
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true)
        } else {
            console.log('CORS blocked origin:', origin);
            callback(new Error('Not allowed by CORS'))
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}

app.use(cors(corsOptions))
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

// Proxy endpoint for IKM Sidoarjo to bypass X-Frame-Options SAMEORIGIN restriction
const https = require('https')
app.use('/api/ikm-proxy', (req, res) => {
    const subPath = req.url === '/' ? '/opd/50018292' : req.url
    const targetUrl = 'https://ikm.sidoarjokab.go.id' + subPath
    https.get(targetUrl, (proxyRes) => {
        Object.keys(proxyRes.headers).forEach((key) => {
            if (key.toLowerCase() !== 'x-frame-options' && key.toLowerCase() !== 'content-security-policy') {
                res.setHeader(key, proxyRes.headers[key])
            }
        })
        res.status(proxyRes.statusCode)
        proxyRes.pipe(res)
    }).on('error', (err) => {
        res.status(500).send('Proxy Error: ' + err.message)
    })
})

// IKM Stats fetch endpoint with 5-minute in-memory caching
let cachedIkmStats = null;
let lastIkmFetchTime = 0;
const IKM_CACHE_DURATION = 5 * 60 * 1000;

app.get('/api/ikm-stats', (req, res) => {
    const now = Date.now();
    if (cachedIkmStats && (now - lastIkmFetchTime < IKM_CACHE_DURATION)) {
        return res.json({ success: true, cached: true, data: cachedIkmStats });
    }

    const targetUrl = 'https://ikm.sidoarjokab.go.id/opd/50018292';
    https.get(targetUrl, (proxyRes) => {
        let body = '';
        proxyRes.on('data', (chunk) => body += chunk);
        proxyRes.on('end', () => {
            try {
                const scoreMatch = body.match(/class="numberCircle"\s*>\s*([0-9.]+)\s*<\/p>/);
                const respondenMatch = body.match(/class="count-text respon"\s*>\s*([^<]+)\s*<\/p>/);

                const scoreVal = scoreMatch ? parseFloat(scoreMatch[1]) : 97.36;
                const scoreStr = scoreMatch ? scoreMatch[1] : "97.36";
                const respondenStr = respondenMatch ? respondenMatch[1].trim() : "83 Responden";

                let mutuStr = "Mutu A (Sangat Baik)";
                if (scoreVal < 65.0) {
                    mutuStr = "Mutu D (Tidak Baik)";
                } else if (scoreVal <= 76.60) {
                    mutuStr = "Mutu C (Kurang Baik)";
                } else if (scoreVal <= 88.30) {
                    mutuStr = "Mutu B (Baik)";
                }

                cachedIkmStats = {
                    score: scoreStr,
                    mutu: mutuStr,
                    responden: respondenStr
                };
                lastIkmFetchTime = now;

                return res.json({ success: true, cached: false, data: cachedIkmStats });
            } catch (err) {
                if (cachedIkmStats) {
                    return res.json({ success: true, cached: true, data: cachedIkmStats });
                }
                return res.json({
                    success: true,
                    fallback: true,
                    data: { score: "97.36", mutu: "Mutu A (Sangat Baik)", responden: "83 Responden" }
                });
            }
        });
    }).on('error', (err) => {
        if (cachedIkmStats) {
            return res.json({ success: true, cached: true, data: cachedIkmStats });
        }
        return res.json({
            success: true,
            fallback: true,
            data: { score: "97.36", mutu: "Mutu A (Sangat Baik)", responden: "83 Responden" }
        });
    });
});

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
    res.json({
        success: true,
        message: '🌐 Layanan API Laboratorium Sidoarjo berjalan dengan baik',
        status: 'UP',
        timestamp: new Date().toISOString()
    });
});

// Route to serve uploaded files safely
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.get('/uploads/:filename', (req, res) => {
    const safeFilename = path.basename(req.params.filename);
    res.sendFile(path.join(__dirname, 'uploads', safeFilename));
});

//define routes with API rate limiter
app.use('/api', apiLimiter, router);

app.listen(port, () => {
    console.log(`Server started on port ${port}`)
    console.log(`Server started at: ${startTime.toLocaleString()}`)
    
    // Start scheduled tasks
    scheduleExpiredPemohonanCancellation()
    console.log('Scheduled tasks initialized')
})