import React from "react";
import { Search, Send, CreditCard, MapPin, RotateCcw } from "lucide-react";

export default function HowToRent() {
  const steps = [
    {
      num: "01",
      title: "Pilih Alat Tani",
      desc: "Cari alat pertanian yang sesuai di katalog, tentukan tanggal mulai dan selesai sewa.",
      icon: Search,
    },
    {
      num: "02",
      title: "Ajukan Pesanan",
      desc: "Formulir dikirim ke admin untuk memeriksa kesiapan unit fisik dan konfirmasi jadwal.",
      icon: Send,
    },
    {
      num: "03",
      title: "Bayar Online",
      desc: "Setelah disetujui, lakukan pembayaran digital via Midtrans Snap (Transfer / QRIS / E-Wallet).",
      icon: CreditCard,
    },
    {
      num: "04",
      title: "Ambil di Depot",
      desc: "Tunjukkan bukti invoice lunas di depot pengelola, periksa kondisi fisik awal alat, dan bawa pulang.",
      icon: MapPin,
    },
    {
      num: "05",
      title: "Pengembalian",
      desc: "Kembalikan alat fisik tepat waktu ke depot untuk diverifikasi kelengkapannya oleh admin.",
      icon: RotateCcw,
    },
  ];

  return (
    <section id="cara-sewa" className="py-20 bg-[#e8f5ee] border-y border-[#195B3E]/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-black uppercase tracking-wider text-[#195B3E] bg-white px-3 py-1 rounded-full border border-[#195B3E]/20">
            Panduan Operasional
          </span>
          <h2 className="text-3xl font-black text-[#1F2937] tracking-tight">
            5 Langkah Mudah Menyewa Alat Pertanian
          </h2>
          <p className="text-sm text-gray-600">
            Proses pemesanan transparan, aman, dan dapat dipantau langsung dari dashboard Anda.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {steps.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="bg-white p-6 rounded-2xl shadow-sm border border-[#195B3E]/10 relative flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-black text-[#195B3E]">{item.num}</span>
                    <div className="w-10 h-10 rounded-xl bg-[#FAF5E9] text-[#195B3E] flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                  <h3 className="text-base font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-xs text-gray-600 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
