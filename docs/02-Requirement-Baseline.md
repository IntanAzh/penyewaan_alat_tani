# Requirement Baseline dan Traceability

SewaAlat · kebutuhan, status, data domain, dan kriteria penerimaan

| Versi | 1.0 · Baseline awal | Tanggal | 3 November 2026 |
| --- | --- | --- | --- |

# Tujuan dokumen

Dokumen ini menerjemahkan proses bisnis dan spesifikasi modul menjadi kontrak implementasi yang dapat ditinjau dari awal sampai akhir. Setiap kebutuhan ditautkan ke PB dan M, dilengkapi status kanonis, entitas inti, serta kondisi penerimaan. Jika ada perbedaan sumber atau keputusan yang belum ditetapkan, bagian itu ditandai sebagai keputusan produk.

# Sumber dan batas

- Proses_Bisnis_SewaAlat (2).docx: ruang lingkup PB-01–PB-09, aktor, aturan serta daftar keputusan terbuka.

- Spesifikasi_Modul_Pengembangan_SewaAlat.docx: fondasi dan M01–M08, ketergantungan FE/BE/data/integrasi serta kriteria modul.

- Figma All Design, node 107-54121: frame dashboard Admin sebagai rujukan visual; palet hijau-krem mengikuti catatan spesifikasi.

- SRS final belum tersedia untuk verifikasi; nomor 3.x di dokumen sumber harus dicocokkan sebelum baseline teknis.

# Baseline teknologi proyek

| Lapisan | Baseline | Catatan penerapan |
| --- | --- | --- |
| Frontend | React JS 18 dengan Next.js 14 App Router | Halaman dan komponen React berada di `src/app` dan `src/components`. |
| Backend | Node.js melalui Next.js Route Handlers | Endpoint server berada di `src/app/api`; autentikasi dan otorisasi harus ditegakkan di server. |
| ORM | Prisma | Model domain didefinisikan pada `prisma/schema.prisma`. |
| Database pengembangan | SQLite | Konfigurasi lokal saat ini; database produksi belum ditetapkan. |
| Pembayaran | Midtrans tersedia sebagai dependensi | Jangan menganggap kredensial atau alur produksi siap sebelum konfigurasi, callback, rekonsiliasi, dan keputusan operasional ditinjau. |

Kontrak implementasi tetap mengikuti kebutuhan bisnis di bawah ini. Jika struktur kode yang ada berbeda dari aturan bisnis atau kebutuhan keamanan, dokumentasikan gap dan selesaikan sebelum penerimaan modul.

# Traceability PB ke M

| PB | Proses | Modul | Hasil yang dapat ditinjau |
| --- | --- | --- | --- |
| PB-01 | Pendaftaran dan akses akun | M01 | Akun Penyewa tervalidasi; login sesuai role; logout menutup sesi. |
| PB-02 | Pengelolaan data alat | M02 | Kategori, katalog, harga dan unit terpisah; nonaktif menjaga riwayat. |
| PB-03 | Jadwal dan ketersediaan | M03 | Ketersediaan per unit dan rentang tanggal; perawatan memblokir alokasi. |
| PB-04 | Pemesanan alat | M04 | Pesanan menyimpan jadwal, snapshot harga, total, nomor dan status. |
| PB-05 | Persetujuan pesanan | M04 | Admin konfirmasi/menolak dengan audit; alokasi anti-benturan. |
| PB-06 | Pembayaran | M05 | Transaksi riil terverifikasi gateway; callback aman dan idempoten. |
| PB-07 | Penyerahan alat | M06 | Identitas penerima, unit, kondisi awal dan waktu dicatat. |
| PB-08 | Pengembalian dan penyelesaian | M07 | Kondisi akhir/insiden; unit diperbarui; kewajiban dituntaskan. |
| PB-09 | Dashboard, riwayat, laporan | M08 | Metrik, riwayat per role, filter dan CSV sejalan. |
| PB-10 | Pembatalan/refund (usulan) | Belum ditetapkan | Perlu perubahan lingkup, SRS, aturan dan acceptance. |

# Penerimaan per modul

## M01 · Akun dan hak akses

Traceability: M01 / PB-01.

Kriteria penerimaan: Username duplikat dan sandi konfirmasi yang berbeda ditolak; registrasi membuat Penyewa saja; login role benar; akun nonaktif ditolak; akses Admin/data pengguna lain ditolak server; logout menutup sesi.

## M02 · Data alat

Traceability: M02 / PB-02.

Kriteria penerimaan: Admin dapat mengelola jenis alat dan beberapa unit dengan kode unik; input/foto tidak valid ditolak; alat nonaktif tidak menerima order baru; transaksi lama tetap terhubung.

## M03 · Katalog dan ketersediaan

Traceability: M03 / PB-03.

Kriteria penerimaan: Tanggal lampau/rentang salah/di luar aturan ditolak; stok tersedia dihitung per unit; perawatan/alokasi mengurangi ketersediaan; pencarian kosong memiliki empty state.

## M04 · Pemesanan dan persetujuan

Traceability: M04 / PB-04, PB-05.

Kriteria penerimaan: Tanggal inklusif menghitung 12–14 Nov sebagai tiga hari; biaya di server; dua Admin tidak dapat menyetujui alokasi bentrok; penolakan melepaskan alokasi; submit ulang tidak membuat order ganda.

## M05 · Pembayaran riil

Traceability: M05 / PB-06.

Kriteria penerimaan: Callback autentikasi dan nominal/referensi diverifikasi; palsu/nominal tidak cocok tidak melunasi; callback duplikat/terlambat idempoten; status tak pasti direkonsiliasi; bukti hanya untuk pihak berhak.

## M06 · Penyerahan alat

Traceability: M06 / PB-07.

Kriteria penerimaan: Order belum lunas, unit salah dan akses Penyewa menolak pencatatan; handover mencatat kondisi awal; status berubah setelah commit; submit serentak tidak menggandakan serah terima.

## M07 · Pengembalian alat

Traceability: M07 / PB-08.

Kriteria penerimaan: Hanya unit yang diserahkan dapat dikembalikan; return duplikat ditolak; unit belum kembali atau rusak tidak tersedia; order tidak selesai jika kewajiban belum tuntas.

## M08 · Dashboard, riwayat, ekspor

Traceability: M08 / PB-09.

Kriteria penerimaan: Penyewa hanya melihat data sendiri; angka dashboard cocok dengan daftar dan periode; beberapa unit dihitung benar; CSV mengikuti filter dan aman dari formula.

# Status dan transisi

| Objek | Status kerja | Aturan transisi |
| --- | --- | --- |
| Pesanan | Menunggu Konfirmasi → Dikonfirmasi → Menunggu Pembayaran → Menunggu Penyerahan → Sedang Disewa → Menunggu Penyelesaian → Selesai | Admin menyetujui sebelum pembayaran; gateway lunas memicu Menunggu Penyerahan; serah terima aktual memicu Sedang Disewa; return saja belum tentu menyelesaikan kewajiban. Cabang: Ditolak, Kedaluwarsa; Dibatalkan setelah kebijakan disepakati. |
| Pembayaran | Belum Dibayar → Menunggu Pembayaran → Lunas / Gagal / Kedaluwarsa / Perlu Rekonsiliasi | Gateway adalah sumber verifikasi status. Percobaan pembayaran disimpan terpisah dari pesanan; callback idempoten. |
| Unit | Tersedia / Dialokasikan / Disewa / Perawatan / Tidak Layak / Nonaktif | Perubahan order tidak menggantikan kondisi fisik unit. Lewat tanggal tanpa return tercatat tidak membebaskan unit. |

# Model entitas minimal

| Entitas | Field/relasi utama | Keputusan desain |
| --- | --- | --- |
| users | nama, username, password_hash, role, aktif, kontak | Role pendaftaran publik selalu Penyewa. |
| categories | nama, slug, aktif | Nonaktifkan bila masih dirujuk; jangan hapus transaksi. |
| equipment | category_id, nama, harga_harian, deskripsi, aktif | Simpan tarif sebagai integer rupiah. |
| equipment_units | equipment_id, kode unik, kondisi, status | Satu jenis alat dapat memiliki banyak unit. |
| maintenance_schedules | unit_id, tanggal, alasan, status | Rentang inklusif; cek benturan. |
| orders / order_items | penyewa, nomor, tanggal, durasi, snapshot harga, jumlah, total, status | Total dihitung server, snapshot tidak berubah saat harga katalog berubah. |
| unit_allocations | order/item, unit, interval, status | Alokasi atomik; indeks/constraint cegah benturan. |
| order_status_history | order, dari/ke, aktor, waktu, alasan | Jejak append-only untuk keputusan penting. |
| payment_attempts / events | order, referensi gateway, nominal, status, callback terverifikasi | Simpan kunci unik/idempotensi; tidak menyimpan secret gateway. |
| handovers / returns | order, unit, admin, penerima, waktu, kondisi, kelengkapan | Cegah pencatatan ganda; bukti temuan memiliki akses privat. |
| incidents | unit, tipe, bukti, kewajiban/keputusan | Rumus denda dan blacklist menunggu keputusan produk. |

# Ketentuan kontrak dan keamanan

- Tanggal sewa `YYYY-MM-DD`; timestamp konsisten dan disajikan dalam WIB.

- Rupiah sebagai integer; format tampilan `id-ID`; server menghitung harga.

- Auth, role, kepemilikan, verifikasi gateway, CSRF dan validasi file berada di server.

- Respons kesalahan aman; log tidak menyimpan kata sandi, token, credential, atau data pembayaran sensitif.

- CSV mengikuti filter, encoding yang sesuai, minimisasi data, dan neutralisasi formula.

- Semua daftar besar memiliki pagination dan empty/loading/error state.

# Keputusan terbuka dan pemilik

| Keputusan | Pemilik | Batas modul |
| --- | --- | --- |
| Gateway, metode, fee, callback, rekonsiliasi | Pengelola + pengembang | Sebelum M05 |
| Unggah bukti manual versus gateway | Pengelola + pengembang | Sebelum M05 |
| Tunai, penerimaan Admin, kuitansi | Pengelola | Sebelum M05–M06 |
| Rentang pemesanan/durasi (2–30 hari; 1–14 durasi masih usulan) | Pengelola | Sebelum M03–M04 |
| Review Admin, hold jadwal, tenggat bayar/expired | Pengelola + pengembang | Sebelum M04–M05 |
| Pickup: lokasi, jam, ID, terlambat, wakil | Pengelola | Sebelum M06 |
| Keterlambatan, kerusakan, kehilangan, refund | Pengelola | Sebelum M07 dan produksi |
| Definisi tren dan penyerahan hari ini | Pemilik produk | Sebelum M08 |
| Finalisasi SRS bernomor 3.x | Pemilik produk + dosen/pengembang | Sebelum baseline teknis |

# Definition of Done

- UI, backend dan database terhubung; input dan otorisasi divalidasi di server.

- Setiap acceptance modul memiliki kasus dan bukti hasil; alur lintas modul ditinjau kembali.

- Tidak ada masalah akses lintas role, benturan unit, status pembayaran palsu, atau duplikasi transaksi yang belum ditangani.

- Loading, empty, error dan sukses tertangani serta UI responsif untuk target layar.

- README, migrasi, kontrak FE/BE, keputusan dan change log diperbarui.

- Review penerimaan dilakukan dengan pengelola sebelum menyatakan modul selesai.

# Catatan implementasi yang diserahkan

Repositori proyek yang dituju menggunakan React JS/Next.js untuk frontend, Node.js Route Handlers untuk backend, Prisma, dan SQLite untuk pengembangan lokal. Dependensi Midtrans sudah tersedia. Dokumen ini tetap menjadi target penerimaan; keberadaan halaman atau endpoint saja belum membuktikan seluruh kriteria keamanan, konsistensi data, dan proses bisnis telah terpenuhi. Database produksi dan kesiapan gateway harus ditinjau sebelum operasional.
