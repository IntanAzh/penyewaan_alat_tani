# Tanisewa

Aplikasi penyewaan alat pertanian dengan React (Next.js) sebagai frontend dan Node.js (Next.js API routes) sebagai backend. Kedua aplikasi berjalan sebagai proses terpisah.

## Struktur

- `frontend/` — halaman React, komponen, konteks, dan stylesheet.
- `backend/` — API Node.js, autentikasi, integrasi Midtrans, Prisma schema, dan skrip database.
- `docs/` — PRD, requirement, dan dokumentasi modul.

## Menjalankan di Windows

1. Jalankan MySQL Laragon. Konfigurasi lokal yang terdeteksi memakai port `3307`.
2. Buat database `tanisewa` melalui phpMyAdmin dengan mengimpor `backend/prisma/phpmyadmin-setup.sql`.
3. Salin `backend/.env.example` menjadi `backend/.env` dan `.env.example` menjadi `.env` di root project. Isi URL MySQL yang sama di kedua file env. Password dalam URL MySQL harus di-URL-encode jika memiliki karakter khusus.
4. Jalankan `npm install`.
5. Jalankan `npm run db:push` untuk membuat tabel dari Prisma schema.
6. Jalankan `npm run dev`. Frontend tersedia di `http://localhost:3000`, backend di `http://localhost:4001`. Frontend meneruskan `/api/*` ke backend.

`backend/prisma/dev.db` adalah database SQLite lama dan disimpan sebagai cadangan; belum dipindahkan ke MySQL. Setelah kredensial MySQL tersedia, data dapat dimigrasikan tanpa menjalankan seed yang menghapus isi database.

Seed demo bersifat destruktif terhadap data operasional yang sudah ada. Jalankan hanya pada database pengembangan yang memang boleh direset.

