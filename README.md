# Backend Financial Technology Wallet

REST API untuk sistem dompet digital (e-wallet) yang dibangun menggunakan Node.js, Express.js, dan MySQL.

---

## 📁 Struktur Folder Project

```
Backend-Financial-Technology-Wallet-2311103083/
├── config/
│   └── database.js          # Konfigurasi koneksi MySQL (connection pool)
├── controllers/
│   └── authController.js     # Logika bisnis authentication (register, login, profile)
├── database/
│   └── fintech_wallet.sql    # SQL script untuk membuat tabel database
├── middleware/
│   ├── verifyToken.js        # Middleware verifikasi JWT token
│   └── roleAuthorization.js  # Middleware otorisasi berdasarkan role
├── models/
│   ├── userModel.js          # Model/query untuk tabel users
│   └── walletModel.js        # Model/query untuk tabel wallets
├── postman/
│   └── Backend_Financial_Technology_Wallet.postman_collection.json
├── routes/
│   └── authRoutes.js         # Definisi endpoint authentication
├── utils/
│   └── responseHelper.js     # Helper format response API standar
├── .env                      # Environment variables (tidak di-push ke git)
├── .env.example              # Template environment variables
├── .gitignore                # File yang diabaikan git
├── package.json              # Dependencies dan scripts
├── server.js                 # Entry point aplikasi
└── README.md                 # Dokumentasi project
```

### Penjelasan Fungsi Tiap Folder

| Folder | Fungsi |
|--------|--------|
| `config/` | Menyimpan konfigurasi aplikasi (database, environment) |
| `controllers/` | Menangani logika bisnis untuk setiap endpoint |
| `database/` | Menyimpan SQL script untuk setup database |
| `middleware/` | Middleware untuk autentikasi dan otorisasi |
| `models/` | Query database untuk setiap tabel (Data Access Layer) |
| `routes/` | Mendefinisikan endpoint URL dan method HTTP |
| `utils/` | Fungsi helper/utilitas yang dipakai ulang |
| `postman/` | Koleksi Postman untuk testing API |

---

## 🚀 Tutorial Menjalankan Project

### Prasyarat
- Node.js (v18 atau lebih baru)
- MySQL Server (v8.0 atau lebih baru)
- Postman (untuk testing API)
- nodemon (sudah terinstall global)

### Langkah 1: Clone & Install Dependencies

```bash
# Clone repository
git clone <repository-url>
cd Backend-Financial-Technology-Wallet-2311103083

# Install dependency
npm install
```

Dependencies yang digunakan:
| Package | Fungsi |
|---------|--------|
| `express` | Web framework untuk membuat REST API |
| `mysql2` | Driver MySQL untuk Node.js |
| `bcryptjs` | Hashing password dengan algoritma bcrypt |
| `jsonwebtoken` | Membuat dan memverifikasi JWT token |
| `dotenv` | Membaca file .env sebagai environment variable |
| `cors` | Mengizinkan Cross-Origin Resource Sharing |

### Langkah 2: Setup Database MySQL

1. Buka MySQL client (MySQL Workbench, phpMyAdmin, atau terminal):
```bash
mysql -u root -p
```

2. Jalankan SQL script:
```bash
source database/fintech_wallet.sql
```

Atau copy-paste isi file `database/fintech_wallet.sql` ke MySQL client.

### Langkah 3: Setup Environment Variables

1. Copy file `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```

2. Edit file `.env` sesuai konfigurasi lokal:
```env
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=password_mysql_kamu
DB_NAME=fintech_wallet
JWT_SECRET=ganti_dengan_string_random_yang_panjang
JWT_EXPIRES_IN=24h
```

### Langkah 4: Menjalankan Server

```bash
# Mode development (auto-restart saat file berubah)
npm run dev

# Mode production
npm start
```

Jika berhasil, akan muncul output:
```
✅ Database MySQL terhubung berhasil
🚀 Server berjalan di http://localhost:3000
📡 Environment: development
```

---

## 📡 API Documentation

### Base URL
```
http://localhost:3000/api
```

---

### 1. POST /api/auth/register

Mendaftarkan user baru ke sistem.

**Headers:**
| Key | Value |
|-----|-------|
| Content-Type | application/json |

**Request Body:**
```json
{
  "name": "Faza Raziq",
  "email": "faza@example.com",
  "password": "password123",
  "transaction_pin": "123456",
  "phone": "081234567890",
  "role": "user"
}
```

| Field | Tipe | Wajib | Keterangan |
|-------|------|-------|------------|
| name | string | ✅ | Nama lengkap user |
| email | string | ✅ | Email unik |
| password | string | ✅ | Minimal 6 karakter |
| transaction_pin | string | ✅ | PIN transaksi 6 digit angka |
| phone | string | ❌ | Nomor telepon |
| role | string | ❌ | `admin` / `user` / `auditor` (default: `user`) |

**Response Sukses (201):**
```json
{
  "success": true,
  "message": "Registrasi berhasil",
  "data": {
    "user": {
      "id": 1,
      "name": "Faza Raziq",
      "email": "faza@example.com",
      "phone": "081234567890",
      "role": "user",
      "created_at": "2026-04-29T01:30:00.000Z",
      "updated_at": "2026-04-29T01:30:00.000Z"
    }
  }
}
```

**Response Error - Email sudah terdaftar (409):**
```json
{
  "success": false,
  "message": "Email sudah terdaftar"
}
```

**Response Error - Validasi gagal (400):**
```json
{
  "success": false,
  "message": "Field name, email, dan password wajib diisi"
}
```

---

### 2. POST /api/auth/login

Autentikasi user dan mendapatkan token JWT.

**Headers:**
| Key | Value |
|-----|-------|
| Content-Type | application/json |

**Request Body:**
```json
{
  "email": "faza@example.com",
  "password": "password123"
}
```

| Field | Tipe | Wajib | Keterangan |
|-------|------|-------|------------|
| email | string | ✅ | Email terdaftar |
| password | string | ✅ | Password user |

**Response Sukses (200):**
```json
{
  "success": true,
  "message": "Login berhasil",
  "data": {
    "user": {
      "id": 1,
      "name": "Faza Raziq",
      "email": "faza@example.com",
      "role": "user"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Response Error - Kredensial salah (401):**
```json
{
  "success": false,
  "message": "Email atau password salah"
}
```

---

### 3. GET /api/auth/profile

Mengambil data profil user yang sedang login. **Endpoint ini protected**, memerlukan token JWT valid.

**Headers:**
| Key | Value |
|-----|-------|
| Authorization | Bearer `<token_jwt>` |

**Request Body:** Tidak ada

**Response Sukses (200):**
```json
{
  "success": true,
  "message": "Data profil berhasil diambil",
  "data": {
    "user": {
      "id": 1,
      "name": "Faza Raziq",
      "email": "faza@example.com",
      "phone": "081234567890",
      "role": "user",
      "created_at": "2026-04-29T01:30:00.000Z",
      "updated_at": "2026-04-29T01:30:00.000Z"
    },
    "wallet": {
      "id": 1,
      "user_id": 1,
      "wallet_number": "WAL17459586000001",
      "balance": "0.00",
      "status": "active",
      "created_at": "2026-04-29T01:30:00.000Z",
      "updated_at": "2026-04-29T01:30:00.000Z"
    }
  }
}
```

**Response Error - Tanpa token (401):**
```json
{
  "success": false,
  "message": "Akses ditolak. Token tidak ditemukan"
}
```

**Response Error - Token expired (401):**
```json
{
  "success": false,
  "message": "Token sudah expired. Silakan login kembali"
}
```

---

## 🧪 Contoh Testing dengan Postman

### Import Collection
1. Buka Postman
2. Klik **Import**
3. Pilih file: `postman/Backend_Financial_Technology_Wallet.postman_collection.json`
4. Collection akan muncul di sidebar

### Cara Menggunakan Bearer Token
1. Lakukan **Login** terlebih dahulu
2. Token akan otomatis tersimpan di collection variable `{{token}}`
3. Request **Profile** akan otomatis menggunakan token tersebut
4. Atau secara manual: Tab **Authorization** → Type **Bearer Token** → masukkan token

---

## 🗃️ Database Schema

### Relasi Antar Tabel
```
users (1) ──── (1) wallets
users (1) ──── (N) audit_logs
wallets (1) ──── (N) transactions
```

### Tabel `users`
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | INT (PK, AI) | Primary key |
| name | VARCHAR(100) | Nama user |
| email | VARCHAR(100) | Email (unique) |
| password | VARCHAR(255) | Password (hashed bcrypt) |
| transaction_pin | VARCHAR(255) | PIN transaksi (hashed bcrypt) |
| phone | VARCHAR(20) | Nomor telepon |
| role | ENUM | admin / user / auditor |
| created_at | TIMESTAMP | Waktu dibuat |
| updated_at | TIMESTAMP | Waktu diupdate |

### Tabel `wallets`
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | INT (PK, AI) | Primary key |
| user_id | INT (FK) | Relasi ke users.id |
| wallet_number | VARCHAR(50) | Nomor wallet (unique) |
| balance | DECIMAL(15,2) | Saldo wallet |
| status | ENUM | active / inactive / blocked |
| created_at | TIMESTAMP | Waktu dibuat |
| updated_at | TIMESTAMP | Waktu diupdate |

---

## 🔐 Middleware

### verifyToken
- Mengekstrak token dari header `Authorization: Bearer <token>`
- Memverifikasi token menggunakan JWT secret
- Menyimpan data user yang terdekode ke `req.user`
- Mengembalikan error 401 jika token tidak valid atau expired

### roleAuthorization
- Menerima parameter daftar role yang diizinkan
- Mengecek apakah role user (dari token) termasuk yang diizinkan
- Mengembalikan error 403 jika role tidak sesuai
- Contoh: `roleAuthorization('admin', 'auditor')` hanya admin dan auditor yang bisa akses

---

## 📝 Lisensi

ISC

---

## Fitur Wallet Tambahan

### PIN Transaksi
- `transaction_pin` wajib saat register dan create user.
- Format PIN harus 6 digit angka, contoh: `"123456"`.
- PIN wajib dikirim saat top up, transfer, dan payment.
- PIN disimpan dalam bentuk hash bcrypt dan tidak ditampilkan di response API.

Contoh body transaksi:
```json
{
  "amount": 500000,
  "description": "Top up saldo awal",
  "transaction_pin": "123456"
}
```

### Status Transaksi dan Reverse
Status transaksi yang tersedia: `pending`, `success`, `failed`, dan `reversed`.

Admin dapat melakukan reverse dengan endpoint:
```http
PUT /api/transactions/:id/status
```

Body:
```json
{
  "status": "reversed"
}
```

Aturan reverse:
- Hanya transaksi berstatus `success` yang bisa di-reverse.
- Reverse `topup` mengurangi saldo wallet.
- Reverse `payment` mengembalikan saldo wallet.
- Reverse `transfer` mengembalikan saldo pengirim dan mengurangi saldo penerima.
- Reverse gagal jika saldo yang perlu dikurangi tidak mencukupi.

### Audit Log
Endpoint audit log hanya untuk role `admin` dan `auditor`.

```http
GET /api/audit-logs
GET /api/audit-logs/:id
```

Audit dicatat untuk top up, transfer, payment, update status transaksi, reverse transaksi, update status wallet, dan delete transaksi/wallet.

### Dashboard
Endpoint dashboard hanya untuk role `admin` dan `auditor`.

```http
GET /api/dashboard
```

Dashboard berisi total user, total wallet, total saldo seluruh wallet, total transaksi, jumlah transaksi per status, jumlah transaksi per tipe, dan 5 transaksi terbaru.

### Database Seeding & Migration Baru
Untuk melakukan auto-migration kolom baru (`reset_pin_token`, `reset_pin_expires`, `reset_password_token`, `reset_password_expires`) dan memasukkan data default `admin` dan `auditor`, jalankan perintah:

```bash
npm run seed
```

Ini akan membuat:
- **Admin**: `admin@wallet.com` (password: `admin123`, PIN: `123456`)
- **Auditor**: `auditor@wallet.com` (password: `auditor123`, PIN: `123456`)

### Restriksi Registrasi Publik
Registrasi publik (`POST /api/auth/register`) hanya diperbolehkan untuk mendaftar sebagai `user`. Apabila mencoba mendaftar dengan `role: "admin"` atau `role: "auditor"`, API akan mengembalikan status `403 Forbidden`. Pembuatan `auditor` baru dapat dilakukan oleh Admin melalui endpoint Admin CRUD user (`POST /api/users`).

### Fitur Reset PIN Transaksi (Reset PIN)
Fungsi ini bersifat **Protected** (memerlukan token Bearer JWT pengguna). Pengguna memverifikasi identitasnya menggunakan password login saat ini untuk memperbarui PIN transaksi.

**Reset PIN**
`PUT /api/auth/reset-pin` (Protected)
Body:
```json
{
  "password": "password_login_saat_ini",
  "new_pin": "654321"
}
```

### Fitur Lupa Password (Forgot Password)
1. **Request Reset Token**
   `POST /api/auth/forgot-password` (Public)
   Body:
   ```json
   {
     "email": "user@example.com"
   }
   ```
   - Mengirimkan token acak 6 digit dengan mencetaknya langsung ke **konsol/log terminal server** (simulasi kotak masuk email).
   - Memiliki **jeda/cooldown selama 60 detik**. Apabila meminta token kembali sebelum 60 detik, server mengembalikan status `429 Too Many Requests`.

2. **Reset Password**
   `POST /api/auth/reset-password` (Public)
   Body:
   ```json
   {
     "email": "user@example.com",
     "token": "800106",
     "new_password": "newsecurepassword123"
   }
   ```
   Memperbarui password pengguna dengan password baru jika token valid dan belum kedaluwarsa (berlaku 15 menit).
