"use client";

import React, { useState } from "react";
import { ChevronDown, ShieldAlert, Clock, RefreshCw, AlertTriangle, FileText } from "lucide-react";

export default function RulesAccordion() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const rules = [
    {
      title: "Ketentuan Pengambilan Alat Fisik",
      icon: Clock,
      content:
        "Pengambilan alat hanya dapat dilakukan setelah pembayaran berstatus BERHASIL (Settlement) pada sistem. Penyewa wajib membawa kartu identitas (KTP) asli dan mengonfirmasi kode QR/Order Code pada petugas depot.",
    },
    {
      title: "Kebijakan Pembatalan Pesanan",
      icon: RefreshCw,
      content:
        "Pembatalan pesanan sebelum pembayaran dilakukan diizinkan penuh tanpa biaya penalti. Jika pembayaran sudah dikonfirmasi, pembatalan mengikuti prosedur persetujuan pengelola depot.",
    },
    {
      title: "Aturan Keterlambatan Pengembalian & Denda",
      icon: AlertTriangle,
      content:
        "Pengembalian yang melewati batas waktu jatuh tempo dikenakan denda keterlambatan harian (dihitung per hari terlambat sesuai tarif dasar harian alat). Denda wajib dilunasi sebelum transaksi diselesaikan.",
    },
    {
      title: "Pemeriksaan Kondisi Fisik & Kerusakan",
      icon: ShieldAlert,
      content:
        "Kondisi fisik alat dicatat saat penyerahan (Kondisi Awal) dan dibandingkan saat pengembalian (Kondisi Akhir). Jika terjadi kerusakan akibat kelalaian operasional atau kelengkapan hilang, penyewa menyepakati biaya perbaikan yang dicatat oleh admin.",
    },
  ];

  return (
    <section id="ketentuan" className="py-20 bg-[#FAF5E9]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 space-y-2">
          <span className="text-xs font-black uppercase tracking-wider text-[#195B3E] bg-[#e8f5ee] px-3 py-1 rounded-full border border-[#195B3E]/20">
            Kebijakan & Syarat
          </span>
          <h2 className="text-3xl font-black text-gray-900">Ketentuan Penyewaan Alat Tani</h2>
          <p className="text-sm text-gray-600">
            Informasi penting seputar batas waktu pembayaran, pembatalan, denda keterlambatan, dan pemeriksaan alat.
          </p>
        </div>

        <div className="space-y-4">
          {rules.map((rule, idx) => {
            const Icon = rule.icon;
            const isOpen = openIdx === idx;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm transition-all"
              >
                <button
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left font-bold text-gray-800 hover:bg-[#FAF5E9]/50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-[#e8f5ee] text-[#195B3E] flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-sm sm:text-base">{rule.title}</span>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${
                      isOpen ? "rotate-180 text-[#195B3E]" : ""
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-6 pb-5 pt-1 text-xs sm:text-sm text-gray-600 border-t border-gray-100 leading-relaxed bg-[#FAF5E9]/20">
                    {rule.content}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
