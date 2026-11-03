# Modul 1 Akun dan Hak Akses

## Cakupan

- Pendaftaran Penyewa dengan nama, email, telepon, kata sandi, dan konfirmasi kata sandi.
- Login Penyewa/Admin, pemulihan sesi saat halaman dibuka, dan logout.
- Proteksi role dan kepemilikan di server untuk API operasional.
- Form autentikasi memakai warna hijau-krem dan pola modal aplikasi TaniSewa.

## Implementasi

| Bagian | Lokasi | Tanggung jawab |
| --- | --- | --- |
| Form masuk/daftar | `src/components/AuthModal.tsx` | Validasi field, konfirmasi sandi, state loading/error, navigasi sesuai role. |
| Sesi frontend | `src/context/AuthContext.tsx` | Memuat sesi dari server; tidak menyimpan identitas/token di localStorage. |
| Sandi | `src/lib/password.ts` | Hash scrypt dengan salt acak dan pembandingan constant-time. |
| Cookie dan role | `src/lib/auth.ts` | Sesi HMAC bertanda tangan, HttpOnly, SameSite=Lax, Secure saat produksi; user/role dibaca kembali dari database. |
| Pembatas percobaan | `src/lib/loginRateLimit.ts` | Batasi login gagal berdasarkan email dan alamat proxy dalam proses Node yang sedang berjalan. |
| Daftar/login | `src/app/api/auth/register/route.ts`, `src/app/api/auth/login/route.ts` | Validasi, pendaftaran role Penyewa, verifikasi sandi, pembuatan sesi. |
| Sesi/logout | `src/app/api/auth/me/route.ts`, `src/app/api/auth/logout/route.ts` | Endpoint pemulihan sesi dan penghapusan cookie. |
| Role API | `src/app/api/**/route.ts` | Pesanan disaring berdasarkan sesi; tindakan Admin memerlukan role Admin; pembayaran dibatasi ke pemilik pesanan. |
| Akun aktif | `prisma/schema.prisma` | Kolom `isActive` menandai status akun; sesi akun nonaktif ditolak. Pengelolaan akun Admin bukan bagian layar M01 saat ini. |

## Kebijakan keamanan

- Registrasi publik selalu membuat role `penyewa`; request browser tidak dapat memilih role.
- Kata sandi minimal 8 dan maksimal 128 karakter. Database menyimpan hash scrypt, bukan kata sandi asli.
- Cookie hanya berisi identitas opaque dan waktu kedaluwarsa; tidak ada token di localStorage atau body respons.
- Login menolak akun nonaktif dan mengembalikan pesan umum untuk mengurangi enumerasi akun.
- API tidak mempercayai `userId` atau `role` dari query/body; identitas diambil dari sesi yang diverifikasi server.
- Percobaan dibatasi 5 kali per email/alamat proxy dalam jendela 15 menit. Penyimpanan limiter saat ini dalam memori satu proses; deployment multi-instance perlu store bersama.
- `SESSION_SECRET` harus berisi minimal 32 byte acak pada produksi. Development memakai secret proses sementara jika belum diisi; sesi lokal dapat berakhir setelah server dimulai ulang.
- `.env` dan file database lokal dikecualikan dari Git.

## Database dan sandi lama

Kolom `User.isActive` ditambahkan secara aditif pada SQLite lokal. `prisma/migrate-passwords.js` mengubah sandi lama menjadi hash secara idempoten dan tidak mencetak nilai sandi. Skrip seed sekarang meminta `SEED_ADMIN_PASSWORD` dan `SEED_DEMO_USER_PASSWORD` dari environment sebelum menghapus/membuat ulang data.

## Kondisi penerimaan M01

- Email dinormalisasi ke huruf kecil; email duplikat ditolak.
- Kata sandi dan konfirmasi harus cocok; data wajib divalidasi server.
- Login benar menetapkan cookie sesi dan mengarahkan pengguna ke dashboard role yang sesuai.
- Kredensial salah dan akun nonaktif ditolak; percobaan berlebih menerima HTTP 429.
- Penyewa tidak dapat membuka endpoint Admin atau membaca pesanan milik akun lain dengan mengganti ID.
- Logout menghapus cookie sesi; sesi expired atau signature salah ditolak.
- Status UI pemuatan sesi tidak menampilkan akses Admin sebelum pemeriksaan selesai.

## Konfigurasi

Lihat `.env.example` dan README proyek. Jangan menyalin isi `.env` ke dokumentasi, chat, atau repository.

## Catatan validasi

Perubahan ini belum menjalani build atau uji alur browser pada sesi ini. Jalankan pemeriksaan proyek dan tinjau skenario penerimaan sebelum menyatakan M01 selesai.

