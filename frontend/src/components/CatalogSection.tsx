"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Search, SlidersHorizontal } from "lucide-react";

interface Equipment {
  id: string;
  name: string;
  category: string;
  dailyRate: number;
  description: string;
  imageUrl: string;
  availableUnitsCount: number;
}
interface Category { id: string; name: string }

const rupiah = (amount: number) => `Rp${amount.toLocaleString("id-ID")}`;
const today = () => {
  const date = new Date();
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
};

export default function CatalogSection() {
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Semua");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/equipment-categories")
      .then((response) => response.ok ? response.json() : [])
      .then((data: unknown) => { if (active && Array.isArray(data)) setCategories(data); })
      .catch(() => { if (active) setCategories([]); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setLoadError("");
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (category !== "Semua") params.set("category", category);
      if (startDate && endDate) { params.set("startDate", startDate); params.set("endDate", endDate); }
      try {
        const response = await fetch(`/api/equipments?${params}`, { signal: controller.signal, cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Katalog gagal dimuat.");
        if (Array.isArray(data)) setEquipments(data);
        else throw new Error("Respons katalog tidak valid.");
      } catch (error) {
        if (!controller.signal.aborted) { setEquipments([]); setLoadError(error instanceof Error ? error.message : "Katalog gagal dimuat."); }
      } finally { if (!controller.signal.aborted) setLoading(false); }
    }, 250);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [search, category, startDate, endDate]);

  const invalidRange = Boolean(startDate && endDate && endDate < startDate);

  return (
    <section id="katalog" className="bg-[#fbfaf6] px-6 pb-16 pt-8 sm:px-10 lg:px-0">
      <div className="mx-auto max-w-[1280px]">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div><p className="eyebrow text-[#426451]">Pilihan alat untuk kebutuhan tanimu</p><h2 className="font-display mt-3 text-[30px] leading-tight text-[#243b30] sm:text-[34px]">Katalog alat pertanian.</h2></div>
          <span className="hidden shrink-0 items-center gap-2 text-[10px] text-[#68756b] sm:inline-flex"><SlidersHorizontal size={13} /> Cari alat & cek jadwal</span>
        </div>

        <div className="mb-5 grid items-end gap-3 border border-[#e3e5de] bg-white p-4 sm:grid-cols-2 lg:grid-cols-[minmax(260px,1.5fr)_minmax(180px,.85fr)_minmax(180px,1fr)_minmax(180px,1fr)]">
          <label className="relative block"><span className="sr-only">Cari alat</span><Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#778178]" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari nama atau spesifikasi alat" className="catalog-filter-control w-full border border-[#dce1d9] bg-[#fbfaf6] py-3 pl-10 pr-3 text-sm outline-none transition focus:border-[#426451] focus:ring-2 focus:ring-[#426451]/10" /></label>
          <label><span className="sr-only">Kategori alat</span><select value={category} onChange={(event) => setCategory(event.target.value)} className="catalog-filter-control w-full border border-[#dce1d9] bg-[#fbfaf6] px-3 py-3 text-sm text-[#354a3d] outline-none transition focus:border-[#426451] focus:ring-2 focus:ring-[#426451]/10"><option value="Semua">Semua kategori</option>{categories.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}</select></label>
          <label className="text-xs font-medium text-[#68756b]">Mulai sewa<input type="date" min={today()} value={startDate} onChange={(event) => { setStartDate(event.target.value); if (endDate && event.target.value > endDate) setEndDate(""); }} className="catalog-filter-control mt-1.5 w-full border border-[#dce1d9] bg-[#fbfaf6] px-3 py-[11px] text-sm font-normal text-[#354a3d] outline-none transition focus:border-[#426451] focus:ring-2 focus:ring-[#426451]/10" /></label>
          <label className="text-xs font-medium text-[#68756b]">Tanggal kembali<input type="date" min={startDate || today()} value={endDate} onChange={(event) => setEndDate(event.target.value)} className="catalog-filter-control mt-1.5 w-full border border-[#dce1d9] bg-[#fbfaf6] px-3 py-[11px] text-sm font-normal text-[#354a3d] outline-none transition focus:border-[#426451] focus:ring-2 focus:ring-[#426451]/10" /></label>
        </div>

        {invalidRange && <p role="alert" className="mb-4 text-xs text-red-700">Tanggal kembali harus sama atau setelah tanggal mulai.</p>}
        {startDate && !endDate && <p className="mb-4 text-[10px] text-[#68756b]">Pilih tanggal kembali untuk melihat jumlah unit yang tersedia.</p>}
        {loading ? <p className="py-12 text-center text-xs text-[#68756b]">Memuat katalog alat…</p> : loadError ? <div role="alert" className="border border-red-200 bg-red-50 px-5 py-8 text-center text-xs text-red-700">{loadError}</div> : equipments.length === 0 ? (
          <div className="border border-dashed border-[#cfd6cb] bg-white px-5 py-12 text-center"><p className="font-display text-xl text-[#304438]">Alat tidak ditemukan</p><p className="mt-2 text-xs text-[#778178]">Coba kata pencarian atau kategori lain.</p><button onClick={() => { setSearch(""); setCategory("Semua"); setStartDate(""); setEndDate(""); }} className="mt-4 border border-[#dce1d9] px-3 py-2 text-[10px] font-semibold text-[#354a3d] hover:bg-[#f5f6f0]">Hapus filter</button></div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {equipments.map((item, index) => <article key={item.id} className="product-card" style={{ animationDelay: `${Math.min(index * 70, 420)}ms` }}>
              <img src={item.imageUrl} alt={item.name} className="product-card__image" />
              <div className="flex flex-1 flex-col p-4"><p className="text-[11px] text-[#788078]">{item.category}</p><h3 className="font-display mt-1.5 text-[19px] leading-tight text-[#304438]">{item.name}</h3><p className="mt-2 line-clamp-2 min-h-10 text-[13px] leading-5 text-[#68766d]">{item.description}</p>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2"><p className="text-[14px] font-semibold text-[#243b30]">{rupiah(item.dailyRate)} <span className="text-[12px] font-normal text-[#7b817a]">/ hari</span></p><span className={`rounded-full px-2.5 py-1 text-[10px] ${item.availableUnitsCount > 0 ? "bg-[#e9eee5] text-[#426451]" : "bg-[#f4e9e5] text-[#9c4d3d]"}`}>{item.availableUnitsCount > 0 ? `${item.availableUnitsCount} unit tersedia` : "Tidak tersedia"}</span></div>
                <Link href={`/alat/${item.id}`} className="mt-auto inline-flex w-fit items-center gap-2 border border-[#dce1d9] px-3 py-2 text-[11px] text-[#354a3d] transition hover:border-[#285b43] hover:bg-[#f5f6f0]">Lihat detail & jadwal <ArrowUpRight size={13} /></Link>
              </div>
            </article>)}
          </div>
        )}
        <p className="mt-4 text-[9px] text-[#8b9088]">*Ketersediaan dihitung per unit aktif dan jadwal pesanan. Server akan memvalidasi ulang saat permintaan sewa.</p>
      </div>
    </section>
  );
}
