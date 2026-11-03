"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";

const questions = [
  { title: "Bagaimana cara menghitung biaya sewa?", answer: "Biaya harian dikalikan lama pemakaian. Perhitungan memasukkan hari pengambilan dan pengembalian. Contoh: 12–14 November dihitung 3 hari." },
  { title: "Kapan saya bisa melakukan pembayaran?", answer: "Pembayaran dilakukan setelah admin menyetujui pesanan dan memastikan alat tersedia pada tanggal yang dipilih." },
  { title: "Bagaimana jika tanggal yang saya pilih penuh?", answer: "Tanggal yang sudah terpesan atau masuk jadwal perawatan tidak dapat dipilih. Silakan pilih tanggal lain yang tersedia." },
  { title: "Di mana saya mengambil dan mengembalikan alat?", answer: "Pengambilan dan pengembalian dilakukan langsung di depot SewaAlat. Admin akan mencatat kondisi dan kelengkapan alat bersama penyewa." },
];

export default function RulesAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  return (
    <section id="bantuan" className="border-t border-[#e3e5dd] bg-[#fbfaf6] px-6 py-14 sm:px-10 lg:px-0">
      <div className="mx-auto grid max-w-[1280px] gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20">
        <div>
          <p className="eyebrow text-[#426451]">Sebelum mulai</p>
          <h2 className="font-display mt-3 text-[30px] leading-tight text-[#243b30]">Masih penasaran?</h2>
          <p className="mt-3 max-w-[270px] text-[11px] leading-5 text-[#7b817a]">Kami merangkum hal yang paling sering ditanyakan penyewa.</p>
          <a href="mailto:layanan@tanisewa.id" className="button-light mt-5 inline-flex">Hubungi tim kami <Plus size={12} /></a>
        </div>
        <div className="divide-y divide-[#dfe2da]">
          {questions.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div key={item.title}>
                <button aria-expanded={isOpen} onClick={() => setOpenIndex(isOpen ? null : index)} className="flex w-full items-center justify-between gap-4 py-4 text-left text-[11px] font-semibold text-[#34483b]">
                  {item.title}{isOpen ? <Minus size={13} className="shrink-0 text-[#56725f]" /> : <Plus size={13} className="shrink-0 text-[#56725f]" />}
                </button>
                {isOpen && <p className="max-w-[620px] pb-4 text-[10px] leading-5 text-[#7b817a]">{item.answer}</p>}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
