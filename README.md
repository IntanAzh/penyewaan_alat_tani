# Tanisewa

Aplikasi penyewaan alat pertanian dengan React (Next.js) sebagai frontend dan Node.js (Next.js API routes) sebagai backend. Kedua aplikasi berjalan sebagai proses terpisah.

## Struktur Direktori

- `frontend/` — Halaman React (Next.js App Router), komponen visual, konteks autentikasi, dan konfigurasi Tailwind CSS.
- `backend/` — API routes Node.js, otentikasi sesi scrypt, integrasi Midtrans Snap, Prisma ORM schema, dan migrasi MySQL.

## Panduan Menjalankan Proyek (Windows & Laragon)

1. Jalankan MySQL di Laragon (port default lokal: `3306`).
2. Pastikan database `tanisewa` sudah dibuat (atau jalankan script `backend/prisma/phpmyadmin-setup.sql`).
3. Buat file `.env` lokal di root proyek. Isi nilai konfigurasi yang sesuai untuk `DATABASE_URL`, `SESSION_SECRET`, `MIDTRANS_CLIENT_KEY`, `MIDTRANS_SERVER_KEY`, `MIDTRANS_IS_PRODUCTION`, `CRON_SECRET`, `SEED_ADMIN_PASSWORD`, dan `SEED_DEMO_USER_PASSWORD`. Jangan unggah file `.env` ke GitHub.
4. Jalankan `npm install` (jika dependensi belum terpasang).
5. Jalankan `npm run db:push` untuk menyinkronkan tabel ke database MySQL.
6. Jalankan `npm run dev` untuk menyalakan kedua server secara bersamaan:
   - **Frontend**: `http://localhost:3000`
   - **Backend**: `http://localhost:4001` (Frontend meneruskan rute `/api/*` secara otomatis ke backend).

> [!NOTE]
> Database utama telah menggunakan MySQL. Seed demo bersifat destruktif terhadap data operasional; jalankan hanya jika ingin mereset data contoh.
