# Testing Chat API dengan Swagger

## Step 1: Login (Dapatkan Token)

1. Buka: `http://localhost:8000/docs`
2. Cari endpoint: **POST `/api/auth/login`**
3. Klik "Try it out"
4. Masukkan JSON (ganti email/password sesuai database):

```json
{
  "email": "bayuwirayudha84@gmail.com",
  "password": "password_anda"
}
```

Jika tidak tahu password, gunakan demo token:
```json
{
  "email": "test@test.com",
  "password": "test"
}
```

5. Klik "Execute"
6. **Copy `access_token` dari response**

---

## Step 2: Setup Authorization

1. Klik tombol **"Authorize"** (atas Swagger UI, lock icon)
2. Paste: `Bearer {access_token}` (ganti `{access_token}` dengan nilai dari Step 1)
3. Klik "Authorize"
4. Klik "Close"

Sekarang semua endpoint akan pakai token ini.

---

## Step 3: Test Endpoint Warga

### 3a. Create/Get Conversation
- Endpoint: **POST `/api/chat/conversations`**
- Klik "Try it out"
- Body kosong (auto-create dari token)
- Klik "Execute"
- **Catat `id` dari response** (misal: `conversation_id = 2`)

### 3b. Get Messages
- Endpoint: **GET `/api/chat/conversations/{conversation_id}/messages`**
- Path parameter: masukkan `conversation_id` dari 3a
- Query parameters: `skip=0`, `limit=50` (default)
- Klik "Execute"
- Response: array pesan (kosong jika baru dibuat)

### 3c. Get My Conversation
- Endpoint: **GET `/api/chat/conversations/me`**
- Klik "Try it out"
- Klik "Execute"
- Response: percakapan detail warga yang login

---

## Step 4: Test Admin Endpoint

### 4a. Logout Warga, Login Admin
1. Clear authorization: klik "Authorize", "Logout"
2. Login dengan admin credentials:
   ```json
   {
     "email": "admin@sipetasan.com",
     "password": "admin_password"
   }
   ```
3. Copy admin token
4. Klik "Authorize" lagi, paste token

### 4b. List Conversations
- Endpoint: **GET `/api/chat/admin/conversations`**
- Query: `skip=0`, `limit=20`
- Klik "Execute"
- Response: list percakapan + warga info

### 4c. Get Admin Messages
- Endpoint: **GET `/api/chat/admin/conversations/{conversation_id}/messages`**
- Path: `{conversation_id}` dari langkah 3a
- Klik "Execute"

### 4d. Close Conversation
- Endpoint: **POST `/api/chat/admin/conversations/{conversation_id}/close`**
- Path: `{conversation_id}`
- Body: `{}` (kosong)
- Klik "Execute"
- Status percakapan berubah jadi "closed"

---

## Step 5: Test WebSocket (Browser Console)

Swagger tidak support WebSocket. Gunakan browser console:

1. Buka Chrome DevTools (F12)
2. Buka tab "Console"
3. Paste code:

```javascript
// Copy dari localStorage (setelah login di frontend)
const token = localStorage.getItem('access_token');
const convId = 1; // Ganti dengan conversation_id dari step 3a

const ws = new WebSocket(`ws://localhost:8000/ws/chat/${convId}?token=${token}`);

ws.onopen = () => {
  console.log('✓ WebSocket connected');
};

ws.onmessage = (event) => {
  console.log('📨 Received:', JSON.parse(event.data));
};

ws.onerror = (err) => {
  console.error('❌ WebSocket error:', err);
};

ws.onclose = () => {
  console.log('✗ WebSocket closed');
};

// Kirim pesan
function sendMsg(text) {
  ws.send(JSON.stringify({ type: 'message', message: text }));
}

// Gunakan: sendMsg('Halo admin')
```

4. Test:
   ```javascript
   sendMsg('Halo admin, ada yang bisa dibantu?')
   ```
5. Response muncul di console (type: "message" event)

---

## Test Scenarios

### Scenario 1: Warga Kirim Pesan
1. Login warga (step 1-2)
2. POST create conversation (step 3a) → catat conv_id
3. Browser console: WebSocket connect (step 5)
4. Console: `sendMsg('Test pesan')`
5. Pesan muncul di database + WebSocket event

### Scenario 2: Admin Baca & Balas
1. Logout warga, login admin (step 4a)
2. GET list conversations (step 4b) → lihat warga + pesan terakhir
3. GET messages (step 4c) → lihat riwayat
4. WebSocket connect sebagai admin
5. Send reply: `sendMsg('Balas dari admin')`
6. Warga dapat realtime (jika websocket masih open)

### Scenario 3: Access Control
1. Login warga A
2. POST create conversation → conv_id_A
3. Coba GET messages dari conversation warga B (ubah path param)
4. Expected: 403 Forbidden ✓

---

## Demo Test Data

Jika ingin test tanpa login:

**Warga existing di database:**
- Email: `bayuwirayudha84@gmail.com`
- Nama: Budi Susanto

**Admin existing:**
- Email: admin@sipetasan.com (atau cek tabel `users`)
- Role: admin/superadmin

**Demo Tokens (jika ada):**
```
Bearer demo-token-warga-test
Bearer demo-token-admin
```

---

## Error Codes

| Code | Meaning | Solusi |
|------|---------|--------|
| 200 | OK | Normal ✓ |
| 401 | Unauthorized | Token expired atau tidak ada, re-login |
| 403 | Forbidden | User tidak punya akses (bukan miliknya) |
| 404 | Not Found | Resource tidak ada (conv_id salah?) |
| 500 | Server Error | Check backend logs `/tmp/backend_run.log` |

---

## Troubleshooting

**WebSocket won't connect:**
- Pastikan token valid: `Authorization: Bearer {token}`
- Check query param: `/ws/chat/{id}?token={token}` (spasi?/typo?)
- Check console: ada error message?

**Message tidak tersimpan:**
- Check database: `SELECT * FROM chat_messages`
- Backend logs: `/tmp/backend_run.log`

**Admin notifikasi lambat:**
- Admin hanya dapat notifikasi jika WebSocket open
- Jika disconnect, polling setiap 10 detik

---

**Happy Testing! 🚀**
