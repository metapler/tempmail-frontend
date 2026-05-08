# DOCS.md — TempMail API Documentation

Dokumentasi lengkap penggunaan API pada project **TempMail** (frontend + backend).

---

## Base URL

```text
https://cfw.0xrains.com
```

Di frontend, base URL diambil dari environment variable:

```env
VITE_API_BASE_URL=https://cfw.0xrains.com
```

Semua request API menggunakan:

```js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
```

---

## Endpoints

### 1. Get Emails (List)

Mengambil daftar email. Dapat difilter berdasarkan penerima (recipient).

```http
GET /api/emails
GET /api/emails?recipient=user@kanop.site
```

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `recipient` | string | No | Filter email berdasarkan alamat penerima |

**Response (200 OK):**

```json
[
  {
    "id": 1,
    "fromAddress": "sender@example.com",
    "subject": "Kode OTP Anda",
    "bodyHtml": "<p>Kode: 123456</p>",
    "bodyText": "Kode: 123456",
    "recipient": "user@kanop.site",
    "receivedAt": "2026-05-07T03:30:00.000Z"
  }
]
```

- Email diurutkan descending berdasarkan `receivedAt` (terbaru dulu).
- Maksimal 50 email per request (`take: 50`).
- Jika `recipient` tidak diberikan, mengembalikan semua email (sesuai kebutuhan backend).

**Error Response (500):**

```json
{ "message": "Error fetching emails" }
```

---

### 2. Get Email by ID (Detail)

Mengambil detail satu email berdasarkan ID numerik.

```http
GET /api/emails/:id
```

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | integer | ID unik email di database |

**Response (200 OK):**

```json
{
  "id": 1,
  "fromAddress": "sender@example.com",
  "subject": "Kode OTP Anda",
  "bodyHtml": "<p>Kode: 123456</p>",
  "bodyText": "Kode: 123456",
  "recipient": "user@kanop.site",
  "receivedAt": "2026-05-07T03:30:00.000Z"
}
```

**Error Responses:**

- `400 Bad Request` — ID bukan angka valid
  ```json
  { "message": "Invalid ID" }
  ```
- `404 Not Found` — Email tidak ditemukan
  ```json
  { "message": "Not found" }
  ```
- `500 Internal Server Error`
  ```json
  { "message": "Error" }
  ```

---

### 3. Webhook Receive Email (Backend Only)

Endpoint untuk menerima email dari Cloudflare Email Worker. **Dilindungi oleh secret header**.

```http
POST /webhook/email
Headers:
  x-webhook-secret: <WEBHOOK_SECRET>
```

**Request Body:**

```json
{
  "from": "sender@example.com",
  "subject": "Subject Email",
  "text": "Isi plain text",
  "html": "<p>Isi HTML</p>",
  "to": "user@kanop.site",
  "timestamp": "2026-05-07T03:30:00.000Z"
}
```

**Response (200 OK):**

```json
{ "message": "Saved", "id": 42 }
```

**Error Responses:**

- `401 Unauthorized` — Secret header salah atau tidak ada
  ```json
  { "message": "Unauthorized" }
  ```
- `500 Internal Server Error` — Gagal menyimpan ke database
  ```json
  { "message": "Error saving to database" }
  ```

---

### 4. Cleanup Old Emails (Backend/Cron Only)

Menghapus email yang lebih lama dari 24 jam. **Dilindungi oleh secret header**.

```http
DELETE /api/emails/cleanup
Headers:
  x-webhook-secret: <WEBHOOK_SECRET>
```

**Response (200 OK):**

```json
{ "deleted": 15 }
```

**Error Response (401):**

```json
{ "message": "Unauthorized" }
```

---

## Frontend API Layer

File: `src/lib/api.js`

Berisi 3 fungsi async untuk komunikasi dengan backend:

### `getEmails()`

Mengambil semua email (tanpa filter).

```js
import { getEmails } from "./lib/api";

const emails = await getEmails();
// → fetch(`${API_BASE_URL}/api/emails`)
```

### `getEmailById(id)`

Mengambil detail email berdasarkan ID.

```js
import { getEmailById } from "./lib/api";

const email = await getEmailById(1);
// → fetch(`${API_BASE_URL}/api/emails/1`)
```

### `getEmailsByRecipient(recipient)`

Mengambil email untuk penerima tertentu. Digunakan pada fitur TempMail.

```js
import { getEmailsByRecipient } from "./lib/api";

const emails = await getEmailsByRecipient("user@kanop.site");
// → fetch(`${API_BASE_URL}/api/emails?recipient=user@kanop.site`)
```

**Error Handling:**

Semua fungsi melempar `Error` jika response tidak `ok`:

```js
try {
  const emails = await getEmailsByRecipient("user@kanop.site");
} catch (err) {
  console.error(err.message); // "Failed to fetch emails: 500 Internal Server Error"
}
```

---

## Struktur Data Email

| Field | Type | Nullable | Deskripsi |
|-------|------|----------|-----------|
| `id` | integer | No | ID unik auto-increment |
| `fromAddress` | string | No | Alamat pengirim email |
| `subject` | string | No | Subjek email (`"(No Subject)"` jika kosong) |
| `bodyHtml` | string | Yes | Isi email dalam format HTML |
| `bodyText` | string | Yes | Isi email dalam format plain text |
| `recipient` | string | No | Alamat penerima email |
| `receivedAt` | string (ISO 8601) | No | Waktu email diterima |

---

## Penggunaan API di Komponen Frontend

### Inbox (`src/pages/Inbox.jsx`)

Inbox TempMail menggunakan `getEmailsByRecipient()` dengan **polling** otomatis setiap 10 detik.

```js
useEffect(() => {
    async function fetchEmails() {
        const data = await getEmailsByRecipient(decodedEmail);
        setEmails(Array.isArray(data) ? data : []);
    }

    fetchEmails();

    const intervalId = setInterval(fetchEmails, 10000); // polling

    return () => clearInterval(intervalId);
}, [decodedEmail]);
```

### Email Detail (`src/pages/EmailDetail.jsx`)

Mengambil detail email saat komponen mount.

```js
useEffect(() => {
    async function fetchEmail() {
        const data = await getEmailById(id);
        setEmail(data);
    }

    fetchEmail();
}, [id]);
```

---

## Domain yang Tersedia

```js
// src/lib/email.js
const DOMAINS = [
    "0xrains.com",
    "kanop.site",
    "mangga.eu.cc",
    "pisang.eu.cc",
    "rains.eu.cc"
];
```

Email harus menggunakan salah satu domain di atas agar valid di sistem ini.

---

## Environment Variables

### Frontend (`.env`)

```env
VITE_API_BASE_URL=https://cfw.0xrains.com
```

### Backend (`.env`)

```env
DATABASE_URL="postgresql://..."
WEBHOOK_SECRET="your-webhook-secret"
PORT=5050
```

---

## CORS

Backend sudah mengaktifkan CORS untuk semua origin:

```js
app.use(cors());
```

Frontend dapat mengakses API dari domain mana saja.

---

## Status Kode HTTP

| Kode | Arti |
|------|------|
| `200` | Success |
| `400` | Bad Request (ID tidak valid) |
| `401` | Unauthorized (webhook secret salah) |
| `404` | Not Found (email tidak ditemukan) |
| `500` | Internal Server Error (database error) |

---

## Catatan Keamanan

- **Jangan expose** `WEBHOOK_SECRET` ke frontend.
- Endpoint `POST /webhook/email` dan `DELETE /api/emails/cleanup` hanya untuk backend/Cloudflare.
- `bodyHtml` tidak dirender langsung di frontend untuk mencegah XSS.
