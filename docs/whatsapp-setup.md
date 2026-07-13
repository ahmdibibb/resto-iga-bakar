# Panduan Setup WhatsApp Cloud API (Meta)

Panduan ini menjelaskan cara mendapatkan `WA_PHONE_NUMBER_ID` dan `WA_ACCESS_TOKEN` 
yang diperlukan untuk mengirim notifikasi WhatsApp otomatis dari aplikasi.

---

## Langkah 1: Buat Meta Developer App

1. Buka **https://developers.facebook.com/** dan login dengan akun Facebook/Meta Anda.
2. Klik **"My Apps"** → **"Create App"**.
3. Pilih tipe app: **"Business"** → Klik Next.
4. Isi **App Name** (contoh: `Resto Iga Bakar WA`) dan **Contact Email**.
5. Klik **"Create App"** — Anda mungkin diminta verifikasi password.

---

## Langkah 2: Tambahkan Produk WhatsApp

1. Setelah app dibuat, di halaman dashboard app Anda, cari panel **"Add Products to Your App"**.
2. Temukan **"WhatsApp"** → Klik **"Set Up"**.
3. Pilih atau buat **Business Portfolio** (bisa menggunakan nama restoran Anda).

---

## Langkah 3: Dapatkan Nomor Test & Token Sementara

Setelah setup WhatsApp, Anda akan diarahkan ke halaman **WhatsApp → API Setup**.

Di halaman ini Anda akan menemukan:

```
Phone number ID:  123456789012345   ← ini WA_PHONE_NUMBER_ID
Temporary access token: EAAxx...    ← ini WA_ACCESS_TOKEN (berlaku 24 jam)
```

### Salin Nilai ke File .env

Buka file `.env` di project Anda dan isi:

```env
WA_PHONE_NUMBER_ID=123456789012345
WA_ACCESS_TOKEN=EAAxxxxxxxxxxxxxxx
```

> **Penting**: Token sementara hanya berlaku **24 jam**. Untuk produksi, 
> gunakan **System User Access Token permanen** (lihat Langkah 5).

---

## Langkah 4: Tambahkan Nomor Tujuan ke Daftar Penerima Test

Saat menggunakan nomor test Meta, Anda **hanya bisa mengirim ke nomor yang sudah didaftarkan**.

1. Di halaman API Setup, klik **"To"** → **"Manage phone number list"**.
2. Klik **"Add phone number"** → masukkan nomor pelanggan Anda (format: +6285xxxxxxxx).
3. Nomor tersebut akan menerima kode OTP WhatsApp untuk konfirmasi.
4. Masukkan kode OTP → Nomor siap menerima pesan.

> **Catatan**: Batasan nomor test adalah **5 nomor** per app.

---

## Langkah 5: Buat Token Permanen (Untuk Produksi)

Token sementara kadaluarsa dalam 24 jam. Untuk produksi, buat token permanen:

1. Di Meta App Dashboard, buka **Business Settings** (melalui Business Portfolio).
2. Buka **System Users** → klik **"Add"** → buat System User dengan role **Admin**.
3. Klik **"Generate New Token"** → pilih app Anda → aktifkan permission:
   - `whatsapp_business_messaging`
   - `whatsapp_business_management`
4. Klik **Generate Token** → salin dan simpan token ini ke `.env` sebagai `WA_ACCESS_TOKEN`.

---

## Langkah 6: (Opsional) Daftarkan Nomor WA Bisnis Sendiri

Jika ingin menggunakan **nomor WhatsApp bisnis Anda sendiri** (bukan nomor test Meta):

1. Di WhatsApp → **Phone Numbers** → **Add phone number**.
2. Masukkan nomor HP bisnis Anda.
3. Verifikasi via kode OTP yang dikirim ke nomor tersebut.
4. Nomor Anda sekarang bisa digunakan untuk mengirim pesan ke **siapa saja** (tidak terbatas 5 nomor).

> **Syarat**: Nomor tidak boleh sudah terdaftar di WhatsApp Personal sebelumnya, 
> atau harus di-reset terlebih dahulu.

---

## Cara Uji Coba

Setelah mengisi `.env`, restart server dan lakukan pemesanan pre-order. 
Kemudian di dashboard Kasir, klik **"Pesanan Siap di Pick Up"** — 
pesan WhatsApp akan langsung terkirim tanpa delay!

Anda juga bisa uji langsung via terminal:

```bash
node -e "
const fetch = (...a) => import('node-fetch').then(({default:f}) => f(...a));
fetch('https://graph.facebook.com/v20.0/PHONE_NUMBER_ID/messages', {
  method: 'POST',
  headers: {
    Authorization: 'Bearer YOUR_ACCESS_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    messaging_product: 'whatsapp',
    to: '6285xxxxxxxxx',
    type: 'text',
    text: { body: 'Test pesan dari Resto!' }
  })
}).then(r => r.json()).then(console.log);
"
```
