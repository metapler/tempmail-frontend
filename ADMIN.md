# ADMIN.md — Panduan Admin TeleStore Crypto

Dokumen ini berisi panduan lengkap untuk **admin** dalam mengelola stock produk dan menggunakan command bot Telegram.

---

## 📋 Daftar Isi

1. [Setup Admin](#1-setup-admin)
2. [Command Admin](#2-command-admin)
3. [Stock Management](#3-stock-management)
4. [Flow Kerja Stock](#4-flow-kerja-stock)
5. [Contoh Praktis](#5-contoh-praktis)
6. [Troubleshooting](#6-troubleshooting)

---

## 1. Setup Admin

### 1.1 Tentukan Admin Telegram ID

Tambahkan `ADMIN_TELEGRAM_ID` di file `.env`:

```env
ADMIN_TELEGRAM_ID=5727876641
```

> 💡 **Tips:** Dapatkan Telegram ID Anda dari bot [@userinfobot](https://t.me/userinfobot) atau dengan mengirim pesan ke [@raw_data_bot](https://t.me/raw_data_bot).

### 1.2 Restart Bot

Setelah mengubah `.env`, restart bot agar perubahan berlaku:

```bash
pm2 restart telestore-bot
```

---

## 2. Command Admin

Semua command admin dilindungi oleh **whitelist**. Hanya user dengan `ADMIN_TELEGRAM_ID` yang bisa menggunakannya.

| Command | Deskripsi | Contoh |
|---------|-----------|--------|
| `/addstock` | Tambah 1 stock untuk 1 produk | `/addstock prod-001 email:pass123` |
| `/addstocks` | Tambah banyak stock sekaligus (reply ke JSON) | Reply ke pesan JSON array |
| `/stock` | Lihat laporan stock tersedia per produk | `/stock` |
| `/delstock` | Hapus stock by ID (hanya stock yang belum terjual) | `/delstock abc123` |
| `/stats` | Lihat statistik order (bisa diakses semua user) | `/stats` |

> ⚠️ **Peringatan:** Jika bukan admin mencoba command admin, bot akan membalas:
> `❌ Akses ditolak. Command ini hanya untuk admin.`

---

## 3. Stock Management

### 3.1 Apa Itu Stock?

Stock adalah unit produk digital yang tersedia untuk dijual. Setiap unit stock memiliki:

- **productId** — ID produk yang dijual (contoh: `prod-001`, `prod-002`)
- **content** — Konten digital (contoh: email:password, API key, URL, dll)
- **isSold** — Status terjual (true/false)
- **soldAt** — Waktu terjual

### 3.2 Format Stock

Stock bisa berupa string apa saja yang relevan untuk produk:

```
email:password
apikey:sk-xxxxxxxx
license:XXXX-XXXX-XXXX
url:https://example.com/account
{ "username": "user1", "password": "pass123" }
```

> 💡 **Tips:** Gunakan format yang konsisten agar mudah diparse jika diperlukan.

### 3.3 Produk yang Tersedia

Produk yang tersedia saat ini (bisa dilihat juga via `/products`):

| productId | Nama | Harga USDC |
|-----------|------|------------|
| `prod-001` | 🤖 Devin AI Pro Trial 14 Day | $1.0 |
| `prod-002` | 🌊 Windsurf Pro Trial 14 Day | $3.0 |
| `prod-003` | 💬 ChatGPT Plus 30 Day | $40.0 |

---

## 4. Flow Kerja Stock

```
┌─────────────────────────────────────────────────────────────┐
│  ADMIN MENAMBAH STOCK                                       │
│  /addstock prod-001 email:pass123                           │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  STOCK MASUK DATABASE (isSold = false)                      │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  USER MEMBELI PRODUK                                        │
│  Pilih produk → Pilih chain → Transfer USDC                 │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  WATCHER DETEKSI PEMBAYARAN                                 │
│  Cek balance → Tunggu 3 blok konfirmasi → Mark PAID         │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  AUTO-ASSIGN STOCK (FIFO)                                   │
│  Ambil 1 stock yang isSold=false                            │
│  → Mark isSold=true → Link ke Order                         │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  DELIVERY KE USER                                           │
│  Kirim konten stock via Telegram (format <pre>)             │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  STOCK HABIS?                                               │
│  Kirim notifikasi ke user + admin alert                     │
└─────────────────────────────────────────────────────────────┘
```

### Algoritma FIFO (First In, First Out)

Stock yang paling awal ditambahkan (`createdAt` paling lama) akan dikirim pertama ke user. Ini memastikan:
- Stock tidak stagnan (tidak ada stock yang tersisa lama)
- Predictable delivery
- Mudah tracking

---

## 5. Contoh Praktis

### 5.1 Tambah Stock Single

**Command:**
```
/addstock prod-001 user1@example.com:password123
```

**Respon Bot:**
```
✅ Stock ditambahkan!
📦 Product: prod-001
🆔 Stock ID: cmc8h6p3q0001abc123
```

### 5.2 Tambah Stock Batch (Cara Cepat)

**Langkah 1:** Kirim pesan JSON array ke chat (bukan command):
```json
[
  {"productId": "prod-001", "content": "user1@example.com:pass1"},
  {"productId": "prod-001", "content": "user2@example.com:pass2"},
  {"productId": "prod-001", "content": "user3@example.com:pass3"},
  {"productId": "prod-002", "content": "wsf_abc123:key_secret"},
  {"productId": "prod-002", "content": "wsf_def456:key_secret2"}
]
```

**Langkah 2:** Reply ke pesan tersebut dengan command:
```
/addstocks
```

**Respon Bot:**
```
✅ 5 stock berhasil ditambahkan!
```

> 💡 **Tips:** Batch ini sangat berguna untuk mengisi puluhan atau ratusan stock sekaligus. Pastikan JSON valid (bisa dicek di [jsonlint.com](https://jsonlint.com)).

### 5.3 Cek Laporan Stock

**Command:**
```
/stock
```

**Respon Bot:**
```
📦 Laporan Stock Tersedia

• prod-001: 25 unit
• prod-002: 10 unit
• prod-003: 0 unit  ← habis, segera isi!
```

### 5.4 Hapus Stock (Jika Salah Input)

**Command:**
```
/delstock cmc8h6p3q0001abc123
```

**Respon Bot:**
```
✅ Stock berhasil dihapus.
```

> ⚠️ **Catatan:** Stock yang sudah terjual (`isSold = true`) **tidak bisa** dihapus.

### 5.5 Lihat Statistik Order

**Command:**
```
/stats
```

**Respon Bot:**
```
📊 Statistik TeleStore

📦 Total Orders: 45
⏳ Pending: 3
✅ Paid: 38
❌ Expired: 4
💰 Total Volume: $523.00 USDC
```

---

## 6. Troubleshooting

### 6.1 "❌ Akses ditolak"

**Penyebab:** Telegram ID Anda tidak cocok dengan `ADMIN_TELEGRAM_ID` di `.env`.

**Solusi:**
1. Cek ID Anda via [@userinfobot](https://t.me/userinfobot)
2. Update `.env`: `ADMIN_TELEGRAM_ID=YOUR_ID`
3. Restart bot

### 6.2 "❌ Gagal menambahkan stock"

**Penyebab:** Bisa jadi karena:
- `productId` tidak valid (bukan prod-001/prod-002/prod-003)
- Database connection error
- Content terlalu panjang

**Solusi:**
- Cek apakah `productId` sesuai dengan yang ada di katalog
- Cek log server: `pm2 logs telestore-bot`

### 6.3 Stock tidak ter-assign saat user bayar

**Penyebab:**
- Stock untuk produk tersebut habis (`isSold = true` untuk semua entry)
- Watcher error saat assign stock

**Solusi:**
1. Cek laporan stock: `/stock`
2. Jika habis, tambah stock baru: `/addstock`
3. Untuk order yang sudah paid tapi stock habis, admin perlu proses manual
4. Cek log watcher: `pm2 logs telestore-watcher`

### 6.4 JSON Invalid saat /addstocks

**Penyebab:** Format JSON salah (kurang koma, quote tidak seimbang, dll).

**Solusi:**
1. Copy pesan JSON ke [jsonlint.com](https://jsonlint.com) untuk validasi
2. Perbaiki error yang ditampilkan
3. Kirim ulang JSON yang sudah valid

**Contoh JSON yang valid:**
```json
[
  {"productId": "prod-001", "content": "test1"},
  {"productId": "prod-001", "content": "test2"}
]
```

**Contoh JSON yang SALAH (kurang koma):**
```json
[
  {"productId": "prod-001" "content": "test1"}
  {"productId": "prod-001" "content": "test2"}
]
```

### 6.5 User complain tidak menerima konten

**Langkah cek:**
1. Cek order ID di log watcher
2. Cek apakah order sudah PAID
3. Cek apakah stock sudah di-assign (kolom `assignedStockId` di database)
4. Jika stock habis, kirim manual ke user dan tambah stock

**Query database (untuk debug):**
```bash
npx prisma studio
```
Buka browser ke `http://localhost:5555` untuk melihat data order dan stock.

---

## 🛡️ Best Practices

1. **Selalu cek stock sebelum promosi besar**
   ```
   /stock
   ```
   Pastikan ada cukup stock untuk semua produk yang dipromosikan.

2. **Gunakan batch untuk mengisi stock banyak**
   Lebih cepat dan efisien daripada `/addstock` satu per satu.

3. **Backup konten stock di tempat aman**
   Database bisa crash. Simpan copy stock di file CSV atau spreadsheet.

4. **Monitor log watcher secara berkala**
   ```bash
   pm2 logs telestore-watcher --lines 50
   ```

5. **Jangan hapus stock yang sudah terjual**
   Ini akan merusak audit trail. Stock terjual tetap ada di database untuk reference.

6. **Gunakan format konten yang konsisten**
   Misal selalu `email:password` atau selalu JSON. Hindari campur aduk format.

---

## 📁 File Terkait

| File | Fungsi |
|------|--------|
| `prisma/schema.prisma` | Schema database (model Stock, Order) |
| `database/prisma.js` | Stock functions (add, assign, report) |
| `src/bot.js` | Admin command handlers |
| `src/watcher.js` | Auto-assign stock saat PAID |
| `src/telegramDelivery.js` | Kirim stock ke user via Telegram |

---

## 📝 Catatan Teknis

- Stock assignment menggunakan **transaction atomic** (tidak mungkin 1 stock di-assign ke 2 order)
- Algoritma FIFO berdasarkan `createdAt` (stock paling lama dikirim duluan)
- Jika stock habis, user tetap menerima notifikasi "stock habis" dan admin menerima alert
- Format konten stock ditampilkan sebagai `<pre>` di Telegram (monospace, mudah di-copy)

---

*Dokumen ini diupdate: 2025-05-02*
