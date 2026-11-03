# Product Requirements Document

SewaAlat · Sistem Penyewaan Alat Pertanian

| Versi | 1.0 · Baseline awal | Tanggal | 3 November 2026 |
| --- | --- | --- | --- |

# Ringkasan produk

SewaAlat adalah layanan web untuk menemukan dan menyewa alat pertanian di wilayah Barlingmascakep. Sistem menyatukan katalog publik, pemeriksaan ketersediaan per unit, persetujuan pesanan, pembayaran, pencatatan serah terima dan pengembalian, serta pemantauan operasional Admin. Tujuan produk adalah memastikan penyewa mengetahui alat dan jadwal yang benar-benar tersedia, sementara operator memiliki jejak transaksi dan kondisi unit yang dapat dipercaya.

Baseline ini menjabarkan proses PB-01 sampai PB-09 dan delapan modul pengembangan. Transaksi pembayaran direncanakan riil melalui payment gateway. Kebijakan gateway dan metode pembayaran, waktu, tunai, denda serta refund masih memerlukan keputusan sebelum produksi.

# Arsitektur teknologi

- **Frontend:** React JS 18 dengan Next.js 14 App Router.
- **Backend:** Node.js melalui Next.js Route Handlers pada `src/app/api`.
- **ORM dan basis data:** Prisma; proyek saat ini memakai SQLite untuk pengembangan lokal. Pemilihan database produksi masih perlu ditetapkan sebelum deployment.
- **Pembayaran:** dependensi Midtrans tersedia di proyek. Provider, kredensial, environment sandbox/produksi, dan kelayakan alur perlu dikonfirmasi sebelum transaksi riil.
- **Konfigurasi rahasia:** simpan di environment server; jangan menyalin isi `.env` ke dokumentasi atau frontend.

# Identitas dan rujukan

| Elemen | Nilai |
| --- | --- |
| Pemilik produk | Intan Azizah |
| Pengguna utama | Penyewa dan Admin |
| Wilayah dan jam | Barlingmascakep · 09.00–17.00 WIB |
| Penyerahan | Diambil langsung |
| Sumber kebutuhan | Proses_Bisnis_SewaAlat (2).docx; Spesifikasi_Modul_Pengembangan_SewaAlat.docx |
| Rujukan visual | Figma All Design, frame dashboard Admin node 107-54121 |
| Status | Draf baseline untuk ditinjau; SRS final perlu diselaraskan |

# Masalah yang diselesaikan

- Penyewa perlu mengetahui jumlah unit yang tersedia pada rentang tanggal, bukan hanya stok total katalog.

- Admin perlu menyelaraskan pesanan dengan jadwal penggunaan dan perawatan agar unit yang sama tidak terjual ganda.

- Pembayaran, kondisi unit saat diserahkan dan dikembalikan, serta tindak lanjut kerusakan perlu memiliki catatan yang terhubung ke pesanan.

- Ringkasan dashboard dan ekspor harus mencerminkan transaksi sumber dan hak akses pengguna.

# Tujuan dan ukuran keberhasilan

| Tujuan | Indikator penerimaan |
| --- | --- |
| Ketersediaan dapat dipercaya | Tanggal lampau ditolak; jumlah tersedia dihitung berdasarkan unit, alokasi, kondisi dan perawatan; benturan alokasi dicegah. |
| Alur penyewaan dapat ditelusuri | Setiap perubahan pesanan, pembayaran, penyerahan dan pengembalian memiliki aktor/waktu dan status yang tercatat. |
| Pembayaran terverifikasi | Pesanan hanya lunas dari hasil gateway terverifikasi dengan nominal dan referensi yang cocok. |
| Dashboard konsisten | Metrik cocok dengan data detail pada filter dan definisi periode yang sama; CSV cocok dengan filter laporan. |
| Akses sesuai peran | Penyewa hanya membaca pesanan sendiri; fungsi Admin dibatasi di server. |

# Pengguna dan kebutuhan

| Pengguna | Kebutuhan |
| --- | --- |
| Pengunjung | Membaca tata cara, mencari kategori/alat, melihat harga, spesifikasi dan ketersediaan sebelum membuat akun. |
| Penyewa | Mendaftar, masuk, memilih tanggal, membuat pesanan, membayar, melihat status, bukti dan riwayat miliknya. |
| Admin | Mengelola kategori, alat, unit, jadwal dan perawatan; memeriksa pesanan; memverifikasi alur operasional; mencatat serah terima/return; melihat dashboard dan ekspor. |
| Payment gateway | Membuat instruksi transaksi dan mengirimkan status transaksi melalui callback terautentikasi. |

# Ruang lingkup

## Termasuk baseline

- Pendaftaran Penyewa, autentikasi Admin/Penyewa, logout dan kontrol role.

- CRUD kategori dan data alat serta identitas unit fisik; nonaktifkan data tanpa menghapus riwayat.

- Landing page, katalog, pencarian, detail, harga harian, kalender ketersediaan dan pengelolaan perawatan.

- Pengajuan pesanan; pemeriksaan Admin; persetujuan atau penolakan dengan alasan; snapshot harga.

- Pembayaran riil melalui gateway terpilih, status transaksi, bukti yang terverifikasi, dan rekonsiliasi.

- Catatan penyerahan dan pengembalian, kondisi awal/akhir, keterlambatan atau kerusakan sebagai temuan, blokir unit dan perawatan.

- Dashboard Admin/Penyewa, riwayat, filter dan ekspor CSV.

## Di luar baseline

- Penjualan/pengadaan alat, pengiriman dan pelacakan lokasi langsung, penjadwalan operator, perbaikan/suku cadang, akuntansi, pajak dan penggajian.

- Pembatalan/refund PB-10, denda otomatis, blacklist dan penagihan belum disepakati dan bukan fitur wajib.

- Pembayaran tunai hanya diaktifkan setelah alur penerimaan dan rekonsiliasinya ditetapkan.

# Alur produk utama

| Tahap | Pengalaman / aturan |
| --- | --- |
| Temukan alat | Pengunjung menelusuri kategori, mencari alat, membaca harga/spesifikasi dan melihat unit tersedia pada tanggal pilihan. |
| Masuk dan ajukan | Penyewa login atau daftar, mengisi tanggal dan jumlah. Sistem memvalidasi rentang, menghitung hari inklusif dan total harga di server. |
| Periksa pesanan | Admin menilai ketersediaan/kondisi dan menyetujui atau menolak. Persetujuan mengalokasikan unit secara atomik; penolakan menyimpan alasan dan tidak menahan unit. |
| Bayar | Penyewa menyelesaikan pembayaran gateway. Callback terautentikasi diverifikasi. Status lunas menggerakkan pesanan ke Menunggu Penyerahan. |
| Ambil dan gunakan | Admin mencocokkan identitas penerima, unit, kondisi dan kelengkapan. Setelah penyerahan dicatat status menjadi Sedang Disewa. |
| Kembalikan dan tutup | Admin memeriksa kondisi akhir serta waktu aktual. Unit rusak/dirawat diblokir. Penyewaan selesai setelah kewajiban yang disepakati dituntaskan. |
| Pantau | Admin melihat antrean dan metrik; Penyewa melihat riwayat sendiri; CSV mengikuti filter dan perlindungan formula. |

# Kebutuhan fungsional

| ID | Area | Trace | Kebutuhan | Prioritas |
| --- | --- | --- | --- | --- |
| FR-01 | Akun dan role | M01 / PB-01 | Registrasi Penyewa, login sesuai role, logout; username unik, hash kata sandi, akun nonaktif ditolak. | P1 |
| FR-02 | Data alat dan unit | M02 / PB-02 | Admin mengelola kategori, katalog, harga, foto, unit, kondisi dan status aktif; riwayat tidak terhapus. | P1 |
| FR-03 | Katalog dan ketersediaan | M03 / PB-03 | Pencarian, filter, detail serta hitung ketersediaan per unit dengan alokasi dan perawatan. | P1 |
| FR-04 | Pemesanan | M04 / PB-04 | Penyewa ajukan rentang dan kuantitas; sistem hitung biaya server-side, simpan snapshot dan cegah duplikasi. | P1 |
| FR-05 | Persetujuan | M04 / PB-05 | Admin konfirmasi atau menolak dengan alasan; validasi ulang stok dan alokasi secara atomik. | P1 |
| FR-06 | Pembayaran | M05 / PB-06 | Satu atau lebih payment attempt; gateway, status, callback dan bukti transaksi terverifikasi. | P1 |
| FR-07 | Penyerahan | M06 / PB-07 | Admin memeriksa penerima dan mencatat unit, kondisi awal, kelengkapan serta waktu aktual. | P1 |
| FR-08 | Pengembalian | M07 / PB-08 | Admin catat kondisi akhir, keterlambatan/insiden dan return; kewajiban tuntas sebelum status selesai. | P1 |
| FR-09 | Dashboard dan riwayat | M08 / PB-09 | Ringkasan operasional dan tren dengan definisi metrik yang disepakati; riwayat sesuai role. | P1 |
| FR-10 | Ekspor laporan | M08 / PB-09 | Admin unduh CSV menurut filter, dengan minimisasi data pribadi dan proteksi formula. | P2 |

# Aturan bisnis

- Harga sewa per hari; tanggal awal dan akhir inklusif. Contoh 12–14 November dihitung tiga hari.

- Tanggal lampau, rentang terbalik dan jadwal yang berbenturan dengan alokasi/perawatan ditolak.

- Jenis alat dan unit fisik terpisah; ketersediaan dikurangi berdasarkan unit, kondisi, alokasi dan penggunaan aktual.

- Pesanan disetujui sebelum pembayaran. Pesanan lunas menjadi Menunggu Penyerahan. Pesanan menjadi Sedang Disewa setelah Admin mencatat handover.

- Perubahan status tidak menghapus riwayat. Permintaan ulang dan callback berulang harus idempoten.

- Tanggal operasional dilihat dalam WIB. Nominal disimpan sebagai bilangan rupiah bulat; harga browser tidak dipercaya.

# Kebutuhan kualitas

| Area | Kebutuhan |
| --- | --- |
| Keamanan | RBAC dan kepemilikan server-side; hash sandi; CSRF/sesi aman; rate limit login; validasi input/unggahan; secret gateway di server; audit perubahan penting. |
| Konsistensi | Transaksi database dan lock saat alokasi; callback pembayaran idempoten; status unit, order dan pembayaran terpisah. |
| Aksesibilitas dan responsif | Navigasi keyboard, kontras teks, label form, pesan kesalahan terbaca, tampilan desktop dan mobile. |
| Operabilitas | Migrasi repeatable; pemisahan dev/test/prod; logging tanpa secret; backup dan panduan pemulihan; .env.example tanpa rahasia. |
| Kinerja | Katalog dan tabel memakai pagination; query dashboard dibatasi periode dan indeks mengikuti pola akses terukur. |
| Ekspor | CSV mempertahankan encoding yang terbaca dan mencegah formula dari masukan pengguna. |

# Ketergantungan dan keputusan terbuka

- Konfirmasi gateway (Midtrans tersedia sebagai dependensi), metode yang didukung, biaya layanan dan proses uji sandbox.

- Tetapkan apakah bukti unggah manual diperlukan selain callback gateway; selaraskan konflik uraian awal dengan PB-06.

- Putuskan tunai di tempat, penerimaan Admin dan penerbitan bukti jika metode ini digunakan.

- Tetapkan batas pemesanan (2–30 hari sebelum mulai dan durasi 1–14 hari masih usulan), review Admin, hold jadwal dan tenggat bayar.

- Konfirmasi lokasi, jam pickup, persyaratan identitas, keterlambatan pengambilan dan penerima pengganti.

- Tetapkan denda, kerusakan, kehilangan, keterlambatan, pengembalian sebagian dan penyelesaian kewajiban.

- Tentukan wewenang pembatalan/refund dan penanganan alat mendadak tidak layak.

- Tentukan definisi tren bulanan dan definisi angka “penyerahan hari ini” (jadwal versus aktual).

- Cocokkan requirement ini dengan SRS final sebelum menetapkan baseline implementasi.

# Rencana rilis

| Urutan | Hasil |
| --- | --- |
| 0 | Fondasi Next.js/React dan Node.js, environment, Prisma/database, layout dan kontrak FE/BE. |
| 1 | M01 akun dan hak akses; M02 data alat dan unit. |
| 2 | M03 katalog/jadwal/ketersediaan; M04 pemesanan dan persetujuan. |
| 3 | M05 pembayaran riil sesudah keputusan gateway. |
| 4 | M06 penyerahan dan M07 pengembalian/kondisi unit. |
| 5 | M08 dashboard, riwayat, filter dan ekspor; uji lintas modul dan kesiapan rilis. |

# Penerimaan produk

Produk dapat diajukan untuk penerimaan ketika alur Penyewa dari penemuan alat hingga riwayat selesai bekerja dengan data tersimpan; Admin dapat mengelola inventaris dan seluruh tindakan operasional; pembayaran hanya dinyatakan lunas setelah verifikasi resmi; unit tidak dapat dialokasikan ganda; role dan kepemilikan dibuktikan di server; dashboard dan ekspor cocok dengan sumber; dan semua keputusan terbuka yang mengubah transaksi produksi sudah disetujui.

# Catatan prototipe saat ini

Repositori implementasi yang dituju sudah menggunakan Next.js 14 dengan React 18, Node.js Route Handlers, Prisma, SQLite untuk pengembangan lokal, serta dependensi Midtrans. Catatan ini menetapkan arah arsitektur, bukan pernyataan bahwa setiap kebutuhan telah lulus penerimaan atau pembayaran produksi siap digunakan. Data rahasia di `.env` tidak menjadi bagian dokumen. Database produksi dan kesiapan transaksi riil masih harus diputuskan serta diverifikasi.
