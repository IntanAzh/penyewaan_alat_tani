"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ArrowUpRight, CheckCircle2, Info, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface Equipment {
  id: string;
  name: string;
  category: string;
  dailyRate: number;
  description: string;
  imageUrl: string;
  availableUnitsCount: number;
  units: Array<{ id: string; unitCode: string; conditionStatus: string }>;
  isSample?: boolean;
}

const samples: Equipment[] = [
  { id: "sample-tiller", name: "Traktor Tangan", category: "Pengolahan Tanah", dailyRate: 150000, description: "Traktor tangan untuk menyiapkan lahan dengan cepat.", imageUrl: "https://images.unsplash.com/photo-1747025282853-4a043235b682?auto=format&fit=crop&w=720&q=80", availableUnitsCount: 4, units: [], isSample: true },
  { id: "sample-transplanter", name: "Mesin Perontok Padi", category: "Panen & Pascapanen", dailyRate: 175000, description: "Membantu proses panen dan pascapanen lebih rapi.", imageUrl: "https://images.unsplash.com/photo-1586771107445-d3ca888129ff?auto=format&fit=crop&w=720&q=80", availableUnitsCount: 3, units: [], isSample: true },
  { id: "sample-pump", name: "Pompa Air Irigasi", category: "Irigasi", dailyRate: 60000, description: "Pompa air untuk mendukung kebutuhan pengairan.", imageUrl: "https://images.unsplash.com/photo-1615811361523-6bd03d7748e7?auto=format&fit=crop&w=720&q=80", availableUnitsCount: 5, units: [], isSample: true },
  { id: "sample-mower", name: "Mesin Potong Rumput", category: "Perawatan Tanaman", dailyRate: 45000, description: "Perawatan area tanam dan kebun lebih mudah.", imageUrl: "https://images.unsplash.com/photo-1608624076549-9e27ec6fd229?auto=format&fit=crop&w=720&q=80", availableUnitsCount: 2, units: [], isSample: true },
];

const rupiah = (amount: number) => `Rp${amount.toLocaleString("id-ID")}`;

export default function CatalogSection() {
  const { user, setAuthModalOpen, setAuthMode } = useAuth();
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [activeEquipment, setActiveEquipment] = useState<Equipment | null>(null);
  const [startDateStr, setStartDateStr] = useState("");
  const [endDateStr, setEndDateStr] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingMessage, setBookingMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/equipments")
      .then(async (response) => {
        if (!response.ok) throw new Error("Katalog belum tersedia");
        return response.json();
      })
      .then((data: unknown) => {
        if (active && Array.isArray(data)) setEquipments(data.slice(0, 4));
      })
      .catch(() => { if (active) setEquipments([]); });
    return () => { active = false; };
  }, []);

  const displayItems = equipments.length ? equipments : samples;
  const start = startDateStr ? new Date(`${startDateStr}T00:00:00`) : null;
  const end = endDateStr ? new Date(`${endDateStr}T00:00:00`) : null;
  const days = start && end && end >= start ? Math.floor((end.getTime() - start.getTime()) / 86400000) + 1 : 0;
  const total = activeEquipment ? days * activeEquipment.dailyRate : 0;

  const openBooking = (item: Equipment) => {
    if (!user) {
      setAuthMode("login");
      setAuthModalOpen(true);
      return;
    }
    setActiveEquipment(item);
    setStartDateStr("");
    setEndDateStr("");
    setBookingMessage(null);
  };

  const submitBooking = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || !activeEquipment || !startDateStr || !endDateStr) return;
    setBookingLoading(true);
    setBookingMessage(null);
    try {
      if (activeEquipment.isSample) throw new Error("Contoh katalog ini belum terhubung ke database. Hubungkan MySQL untuk menerima pesanan.");
      const response = await fetch("/api/rentals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, equipmentId: activeEquipment.id, startDateStr, endDateStr }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Gagal mengajukan pemesanan.");
      setBookingMessage({ type: "success", text: `Pesanan ${result.rental.orderCode} berhasil diajukan.` });
      const refreshed = await fetch("/api/equipments").then((res) => res.json());
      if (Array.isArray(refreshed)) setEquipments(refreshed.slice(0, 4));
    } catch (error) {
      setBookingMessage({ type: "error", text: error instanceof Error ? error.message : "Gagal mengajukan pemesanan." });
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <section id="katalog" className="bg-[#fbfaf6] px-6 pb-16 pt-8 sm:px-10 lg:px-0">
      <div className="mx-auto max-w-[1280px]">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow text-[#426451]">Pilihan paling dicari petani</p>
            <h2 className="font-display mt-3 text-[30px] leading-tight text-[#243b30] sm:text-[34px]">Andalan untuk musim panenmu.</h2>
          </div>
          <a href="#katalog" className="hidden shrink-0 items-center gap-2 border border-[#d9ded6] bg-white px-3 py-2 text-[10px] text-[#354a3d] transition hover:border-[#285b43] sm:inline-flex">Semua alat pertanian <ArrowUpRight size={12} /></a>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {displayItems.map((item) => (
            <article key={item.id} className="product-card">
              <img src={item.imageUrl} alt={item.name} className="product-card__image" />
              <div className="p-3">
                <p className="text-[9px] text-[#8a9088]">{item.category}</p>
                <h3 className="font-display mt-1 text-[16px] leading-tight text-[#304438]">{item.name}</h3>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <p className="text-[10px] font-semibold text-[#243b30]">{rupiah(item.dailyRate)} <span className="font-normal text-[#7b817a]">/ hari</span></p>
                  <span className="rounded-full bg-[#e9eee5] px-2 py-1 text-[8px] text-[#426451]">{item.availableUnitsCount > 0 ? "Tersedia" : "Penuh"}</span>
                </div>
                <button onClick={() => openBooking(item)} className="mt-3 inline-flex items-center gap-2 border border-[#dce1d9] px-2.5 py-1.5 text-[9px] text-[#354a3d] transition hover:border-[#285b43] hover:bg-[#f5f6f0]">Lihat detail <ArrowUpRight size={11} /></button>
              </div>
            </article>
          ))}
        </div>
        <p className="mt-4 text-[9px] text-[#8b9088]">*Harga per hari. Ketersediaan mengikuti tanggal yang dipilih, dan dikonfirmasi admin.</p>
      </div>

      {activeEquipment && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4" onClick={() => setActiveEquipment(null)}>
          <div role="dialog" aria-modal="true" aria-labelledby="booking-title" className="w-full max-w-[480px] bg-[#fbfaf6] p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div><p className="eyebrow text-[#426451]">Formulir penyewaan</p><h3 id="booking-title" className="font-display mt-2 text-2xl text-[#243b30]">{activeEquipment.name}</h3></div>
              <button onClick={() => setActiveEquipment(null)} aria-label="Tutup" className="p-1 text-[#526358]"><X size={18} /></button>
            </div>
            {bookingMessage && <p className={`mt-4 p-3 text-xs ${bookingMessage.type === "success" ? "bg-[#e9eee5] text-[#285b43]" : "bg-red-50 text-red-700"}`}>{bookingMessage.text}</p>}
            <form onSubmit={submitBooking} className="mt-5 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <label className="space-y-1">Mulai sewa<input required type="date" min={new Date().toISOString().slice(0, 10)} value={startDateStr} onChange={(event) => setStartDateStr(event.target.value)} className="w-full border border-[#dce1d9] bg-white px-3 py-2" /></label>
                <label className="space-y-1">Tanggal kembali<input required type="date" min={startDateStr || new Date().toISOString().slice(0, 10)} value={endDateStr} onChange={(event) => setEndDateStr(event.target.value)} className="w-full border border-[#dce1d9] bg-white px-3 py-2" /></label>
              </div>
              {days > 0 && <div className="flex justify-between border-y border-[#dce1d9] py-3 text-xs"><span>{days} hari × {rupiah(activeEquipment.dailyRate)}</span><strong>{rupiah(total)}</strong></div>}
              {activeEquipment.isSample && <p className="flex gap-2 text-[10px] text-[#727a72]"><Info size={14} className="shrink-0" />Kartu ini adalah contoh visual. Hubungkan database untuk memesan unit sebenarnya.</p>}
              <button disabled={bookingLoading || days < 1} className="button-primary w-full justify-center disabled:opacity-50">{bookingLoading ? "Mengirim…" : "Ajukan penyewaan"}</button>
              {bookingMessage?.type === "success" && <p className="flex items-center gap-2 text-xs text-[#285b43]"><CheckCircle2 size={15} />Permintaan terkirim.</p>}
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

