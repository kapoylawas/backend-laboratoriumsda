# API Pemohonan - Pre-Order Workflow

## Overview
API Pemohonan menambahkan workflow pre-order sebelum proses Order yang sudah ada. Terdapat 2 jenis pemohonan:
1. **SURAT_PENAWARAN** (Offer Letter) - Akan auto-cancel setelah 7 hari jika tidak ada action
2. **PEMESANAN** (Order Request) - Langsung diproses tanpa expired

## Database Schema

### Tabel Baru:
- `pemohonans` - Menyimpan data pemohonan
- `pemohonan_items` - Menyimpan item-item dalam pemohonan

### Status Pemohonan:
- `PENDING` - Menunggu action
- `APPROVED` - Sudah disetujui dan order sudah dibuat
- `CANCELLED` - Dibatalkan oleh user
- `EXPIRED` - Expired otomatis (khusus SURAT_PENAWARAN)

## API Endpoints

### 1. Create Pemohonan
**Endpoint:** `POST /api/pemohonan`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "jenis": "SURAT_PENAWARAN", // atau "PEMESANAN"
  "catatan": "Catatan opsional",
  "items": [
    {
      "sampel_id": 1,
      "qty": 2
    },
    {
      "sampel_id": 3,
      "qty": 1
    }
  ]
}
```

**Response (201 Created):**
```json
{
  "meta": {
    "success": true,
    "message": "Surat Penawaran berhasil dibuat. Akan expired dalam 7 hari."
  },
  "data": {
    "id": 1,
    "user_id": 5,
    "jenis": "SURAT_PENAWARAN",
    "status": "PENDING",
    "tanggal_pengajuan": "2026-04-23T04:39:43.000Z",
    "tanggal_expired": "2026-04-30T04:39:43.000Z",
    "tanggal_action": null,
    "catatan": "Catatan opsional",
    "created_at": "2026-04-23T04:39:43.000Z",
    "updated_at": "2026-04-23T04:39:43.000Z",
    "items": [
      {
        "id": 1,
        "pemohonan_id": 1,
        "sampel_id": 1,
        "qty": 2,
        "price": 200000,
        "sampel": {
          "id": 1,
          "parameter": "pH",
          "price_sell": 100000,
          "category": {
            "id": 1,
            "name": "Kimia"
          }
        }
      }
    ],
    "grand_total": 200000
  }
}
```

---

### 2. Get All Pemohonan (User)
**Endpoint:** `GET /api/pemohonan`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters (Optional):**
- `status` - Filter by status (PENDING, APPROVED, CANCELLED, EXPIRED)
- `jenis` - Filter by jenis (SURAT_PENAWARAN, PEMESANAN)

**Example:**
```
GET /api/pemohonan?status=PENDING&jenis=SURAT_PENAWARAN
```

**Response (200 OK):**
```json
{
  "meta": {
    "success": true,
    "message": "Berhasil mengambil data pemohonan"
  },
  "data": [
    {
      "id": 1,
      "user_id": 5,
      "jenis": "SURAT_PENAWARAN",
      "status": "PENDING",
      "tanggal_pengajuan": "2026-04-23T04:39:43.000Z",
      "tanggal_expired": "2026-04-30T04:39:43.000Z",
      "items": [...],
      "created_at": "2026-04-23T04:39:43.000Z",
      "updated_at": "2026-04-23T04:39:43.000Z"
    }
  ]
}
```

---

### 3. Get Pemohonan by ID
**Endpoint:** `GET /api/pemohonan/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "meta": {
    "success": true,
    "message": "Berhasil mengambil data pemohonan"
  },
  "data": {
    "id": 1,
    "user_id": 5,
    "jenis": "SURAT_PENAWARAN",
    "status": "PENDING",
    "tanggal_pengajuan": "2026-04-23T04:39:43.000Z",
    "tanggal_expired": "2026-04-30T04:39:43.000Z",
    "catatan": "Catatan opsional",
    "user": {
      "id": 5,
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "081234567890"
    },
    "items": [...]
  }
}
```

---

### 4. Approve Pemohonan (Convert to Order)
**Endpoint:** `PUT /api/pemohonan/:id/approve`

**Headers:**
```
Authorization: Bearer <token>
```

**Description:**
- Mengubah status pemohonan menjadi APPROVED
- Membuat Order dan Hasil dari items pemohonan
- Khusus SURAT_PENAWARAN: akan ditolak jika sudah expired

**Response (200 OK):**
```json
{
  "meta": {
    "success": true,
    "message": "Pemohonan berhasil disetujui dan order telah dibuat"
  },
  "data": {
    "pemohonan": {
      "id": 1,
      "status": "APPROVED",
      "tanggal_action": "2026-04-23T05:00:00.000Z",
      ...
    },
    "orders": [
      {
        "id": 10,
        "user_id": 5,
        "sampel_id": 1,
        "qty": 2,
        "price": 200000,
        "status": false,
        "sampel": {...}
      }
    ],
    "hasils": [
      {
        "id": 5,
        "user_id": 5,
        "sampel_id": 1,
        "qty": 2,
        "price": 200000,
        "hasil": "-",
        "metode": "-",
        "status": false,
        "sampel": {...}
      }
    ]
  }
}
```

---

### 5. Cancel Pemohonan
**Endpoint:** `PUT /api/pemohonan/:id/cancel`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body (Optional):**
```json
{
  "alasan": "Alasan pembatalan"
}
```

**Response (200 OK):**
```json
{
  "meta": {
    "success": true,
    "message": "Pemohonan berhasil dibatalkan"
  },
  "data": {
    "id": 1,
    "status": "CANCELLED",
    "tanggal_action": "2026-04-23T05:00:00.000Z",
    "catatan": "Catatan awal | Alasan pembatalan: Alasan pembatalan",
    ...
  }
}
```

---

### 6. Cancel Expired Pemohonans (Admin Only)
**Endpoint:** `POST /api/pemohonan/cancel-expired`

**Headers:**
```
Authorization: Bearer <token>
```

**Authorization:** Role ID 2 (Admin)

**Description:**
- Manual trigger untuk cancel semua SURAT_PENAWARAN yang expired
- Otomatis dijalankan setiap hari jam 00:00 oleh cron job

**Response (200 OK):**
```json
{
  "meta": {
    "success": true,
    "message": "Berhasil membatalkan 5 surat penawaran yang expired"
  },
  "data": {
    "cancelled_count": 5,
    "pemohonan_ids": [1, 2, 3, 4, 5]
  }
}
```

---

## Workflow

### Flow 1: Surat Penawaran
```
1. User membuat SURAT_PENAWARAN
   POST /api/pemohonan
   Body: { jenis: "SURAT_PENAWARAN", items: [...] }
   
2. Status: PENDING, tanggal_expired: +7 hari

3a. User approve sebelum expired:
    PUT /api/pemohonan/:id/approve
    → Status: APPROVED
    → Order & Hasil dibuat otomatis
    → Lanjut ke transaction

3b. User cancel:
    PUT /api/pemohonan/:id/cancel
    → Status: CANCELLED

3c. Tidak ada action dalam 7 hari:
    → Auto-cancel oleh cron job (setiap hari jam 00:00)
    → Status: EXPIRED
```

### Flow 2: Pemesanan
```
1. User membuat PEMESANAN
   POST /api/pemohonan
   Body: { jenis: "PEMESANAN", items: [...] }
   
2. Status: PENDING (tidak ada expired)

3a. User approve:
    PUT /api/pemohonan/:id/approve
    → Status: APPROVED
    → Order & Hasil dibuat otomatis
    → Lanjut ke transaction

3b. User cancel:
    PUT /api/pemohonan/:id/cancel
    → Status: CANCELLED
```

---

## Integration with Existing Order System

Setelah Pemohonan di-approve:
1. Order dibuat di tabel `orders` (status: false)
2. Hasil dibuat di tabel `hasils` (status: false)
3. User bisa melihat order di: `GET /api/sampels-by-user/:id`
4. User bisa delete order: `DELETE /api/carts/:id`
5. User bisa checkout: `POST /api/transactions`

**Backward Compatibility:**
- API Order yang lama tetap berfungsi normal
- User bisa langsung create order tanpa melalui Pemohonan
- `POST /api/order` masih bisa digunakan seperti sebelumnya

---

## Auto-Cancellation Service

### Cron Job
- **Schedule:** Every day at 00:00 (midnight)
- **Function:** `cancelExpiredPemohonan()`
- **Location:** `utils/schedulers/pemohonanScheduler.js`
- **Initialized:** On server start in `index.js`

### Manual Trigger
Admin bisa manual trigger via API:
```
POST /api/pemohonan/cancel-expired
```

---

## Installation

1. Install dependencies:
```bash
npm install
```

2. Run database migration (sudah dilakukan):
```bash
npx prisma migrate dev --name add_pemohonan_tables
```

3. Start server:
```bash
npm run dev
```

Cron job akan otomatis aktif saat server start.

---

## Testing

### Test Create Surat Penawaran:
```bash
curl -X POST http://localhost:3001/api/pemohonan \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "jenis": "SURAT_PENAWARAN",
    "catatan": "Test penawaran",
    "items": [
      { "sampel_id": 1, "qty": 2 }
    ]
  }'
```

### Test Approve:
```bash
curl -X PUT http://localhost:3001/api/pemohonan/1/approve \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test Cancel:
```bash
curl -X PUT http://localhost:3001/api/pemohonan/1/cancel \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "alasan": "Tidak jadi" }'
```

---

## Notes

1. **Security:** Semua endpoint memerlukan authentication (JWT token)
2. **Authorization:** Endpoint cancel-expired hanya untuk admin (role_id: 2)
3. **Data Integrity:** Menggunakan Prisma transactions untuk menjaga konsistensi data
4. **Auto-expiry:** SURAT_PENAWARAN otomatis expired setelah 7 hari
5. **Backward Compatible:** Sistem order lama tetap berfungsi normal
