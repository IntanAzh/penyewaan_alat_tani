"use client";

import React from "react";
import { Search, ShieldCheck, Calendar, Truck, ArrowRight } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative bg-[#195B3E] text-white overflow-hidden py-16 lg:py-24">
      {/* Background Subtle Pattern */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#FAF5E9_1px,transparent_1px)] [background-size:16px_16px]"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Headlines & Call to Action */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center space-x-2 bg-[#12432d] border border-[#237d56] px-3.5 py-1.5 rounded-full text-xs font-semibold text-[#FAF5E9]">
              <ShieldCheck className="w-4 h-4 text-[#FAF5E9]" />
              <span>Penyewaan Terpercaya #1 di Jawa Barat</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-none text-[#FAF5E9]">
              Sewa Alat Pertanian Modern <span className="text-[#a3d4bd] underline decoration-[#237d56]">Mudah & Cepat</span>
            </h1>

            <p className="text-lg text-[#c4e3d3] leading-relaxed max-w-2xl font-normal">
              Tingkatkan hasil panen Anda dengan armada traktor, mesin tanam padi, pompa air irigasi, dan combine harvester terbaik tanpa beban biaya perawatan fisik.
            </p>

            {/* Feature Highlights */}
            <div className="grid grid-cols-3 gap-4 py-2 border-y border-[#237d56]/60 text-xs text-[#FAF5E9]">
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-[#a3d4bd] flex-shrink-0" />
                <span>Sewa Harian Flexibel</span>
              </div>
              <div className="flex items-center space-x-2">
                <Truck className="w-5 h-5 text-[#a3d4bd] flex-shrink-0" />
                <span>Ambil Langsung di Depot</span>
              </div>
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-[#a3d4bd] flex-shrink-0" />
                <span>Unit Terawat & Siap Pakai</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 pt-2">
              <a
                href="#katalog"
                className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-[#FAF5E9] text-[#195B3E] font-black text-base hover:bg-white transition-all shadow-xl hover:scale-105"
              >
                <span>Cari Alat Tani Sekarang</span>
                <ArrowRight className="w-5 h-5 ml-2" />
              </a>
              <a
                href="#cara-sewa"
                className="inline-flex items-center justify-center px-6 py-4 rounded-xl border-2 border-[#FAF5E9] text-[#FAF5E9] font-bold text-base hover:bg-[#12432d] transition-all"
              >
                Panduan Cara Sewa
              </a>
            </div>
          </div>

          {/* Right Column: Hero Visual Image Card */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none rounded-3xl overflow-hidden shadow-2xl border-4 border-[#FAF5E9]/20 transform lg:rotate-1 hover:rotate-0 transition-transform duration-300">
              <img
                src="https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=1000&q=80"
                alt="Traktor Pertanian TaniSewa"
                className="w-full h-80 sm:h-96 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-6">
                <div className="text-white space-y-1">
                  <span className="inline-block px-2.5 py-1 bg-[#195B3E] text-[11px] font-extrabold rounded text-[#FAF5E9]">
                    Katalog Utama
                  </span>
                  <h3 className="text-xl font-bold text-white">Traktor Roda 4 Kubota M9540</h3>
                  <p className="text-xs text-gray-300">Tarif Sewa: Rp 450.000 / hari (Unit Fisik Siap Ambil)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
