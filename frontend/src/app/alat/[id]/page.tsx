"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CalendarDays, Check, CheckCircle2, ChevronLeft, ChevronRight, Clock3, Info, PackageCheck, ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Footer from "@/components/Footer";

type CalendarDay = { date: string; availableUnitsCount: number; bookedUnitsCount: number; maintenanceUnitsCount: number };
type Equipment = { id: string; name: string; category: string; dailyRate: number; description: string; imageUrl: string; imageUrls?: unknown; availableUnitsCount: number; totalActiveUnits: number; units: Array<{ id: string; unitCode: string; conditionStatus: string; notes?: string | null }> };
const money = (amount: number) => `Rp${amount.toLocaleString("id-ID")}`;
const todayKey = () => { const now = new Date(); return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10); };
const localKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const monthKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
const dateLabel = (key: string) => key ? new Date(`${key}T00:00:00`).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "Pilih tanggal";

export default function EquipmentDetailPage() {
  const params = useParams<{ id: string }>();
  const equipmentId = params.id;
  const { user, setAuthModalOpen, setAuthMode } = useAuth();
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [pageState, setPageState] = useState<"loading" | "ready" | "not-found" | "error">("loading");
  const [calendarMonth, setCalendarMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [rangeAvailability, setRangeAvailability] = useState<number | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingNotice, setBookingNotice] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    let active = true;
    fetch(`/api/equipments?equipmentId=${encodeURIComponent(equipmentId)}`, { cache: "no-store" })
      .then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error(String(response.status)); return data; })
      .then((data) => { if (active) { if (Array.isArray(data) && data[0]) { setEquipment(data[0]); setSelectedPhotoIndex(0); setPageState("ready"); } else setPageState("not-found"); } })
      .catch((error) => { if (active) setPageState(error instanceof Error && error.message === "404" ? "not-found" : "error"); });
    return () => { active = false; };
  }, [equipmentId]);

  useEffect(() => {
    if (!equipment) return;
    const controller = new AbortController();
    setCalendarLoading(true);
    fetch(`/api/equipments/${encodeURIComponent(equipment.id)}/availability?month=${monthKey(calendarMonth)}`, { signal: controller.signal, cache: "no-store" })
      .then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error(data.error || "Kalender gagal dimuat."); return data; })
      .then((data) => { if (!controller.signal.aborted) setCalendarDays(Array.isArray(data.calendarDays) ? data.calendarDays : []); })
      .catch(() => { if (!controller.signal.aborted) setCalendarDays([]); })
      .finally(() => { if (!controller.signal.aborted) setCalendarLoading(false); });
    return () => controller.abort();
  }, [equipment, calendarMonth]);

  useEffect(() => {
    if (!equipment || !startDate || !endDate || endDate < startDate) { setRangeAvailability(null); return; }
    const controller = new AbortController();
    const query = new URLSearchParams({ equipmentId: equipment.id, startDate, endDate });
    setRangeAvailability(null);
    fetch(`/api/equipments?${query}`, { signal: controller.signal, cache: "no-store" })
      .then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error(data.error || "Gagal memeriksa jadwal."); return data; })
      .then((data) => { if (!controller.signal.aborted) setRangeAvailability(data[0]?.availableUnitsCount ?? 0); })
      .catch(() => { if (!controller.signal.aborted) setRangeAvailability(0); });
    return () => controller.abort();
  }, [equipment, startDate, endDate]);

  const calendarByDate = useMemo(() => new Map(calendarDays.map((day) => [day.date, day])), [calendarDays]);
  const galleryPhotos = useMemo(() => {
    if (!equipment) return [];
    const additional = Array.isArray(equipment.imageUrls) ? equipment.imageUrls.filter((url): url is string => typeof url === "string" && Boolean(url.trim())) : [];
    return [...new Set([equipment.imageUrl, ...additional].filter(Boolean))].slice(0, 6);
  }, [equipment]);
  const monthTitle = calendarMonth.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
  const calendarCells = useMemo(() => {
    const year = calendarMonth.getFullYear(); const month = calendarMonth.getMonth();
    const leading = (new Date(year, month, 1).getDay() + 6) % 7;
    const count = new Date(year, month + 1, 0).getDate();
    return [...Array.from({ length: leading }, () => null), ...Array.from({ length: count }, (_, index) => localKey(new Date(year, month, index + 1)))];
  }, [calendarMonth]);
  const durationDays = startDate && endDate && endDate >= startDate ? Math.floor((Date.parse(`${endDate}T00:00:00Z`) - Date.parse(`${startDate}T00:00:00Z`)) / 86_400_000) + 1 : 0;
  const total = equipment ? durationDays * equipment.dailyRate : 0;
  const changeMonth = useCallback((amount: number) => setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1)), []);

  const selectCalendarDate = (date: string) => {
    if (date < todayKey() || (calendarByDate.get(date)?.availableUnitsCount ?? 0) < 1) return;
    setBookingNotice(null);
    if (!startDate || endDate || date < startDate) { setStartDate(date); setEndDate(""); setRangeAvailability(null); return; }
    setEndDate(date);
  };

  const submitBooking = async () => {
    if (!equipment || !startDate || !endDate || durationDays < 1 || rangeAvailability === null || rangeAvailability < 1) return;
    if (!user) { setAuthMode("login"); setAuthModalOpen(true); return; }
    setBookingLoading(true); setBookingNotice(null);
    try {
      const response = await fetch("/api/rentals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ equipmentId: equipment.id, startDateStr: startDate, endDateStr: endDate }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Permintaan sewa gagal dikirim.");
      setBookingNotice({ kind: "success", text: `Permintaan ${result.rental.orderCode} berhasil dikirim. Admin akan memeriksa pesanan Anda.` });
      setRangeAvailability(Math.max(0, rangeAvailability - 1));
    } catch (error) { setBookingNotice({ kind: "error", text: error instanceof Error ? error.message : "Permintaan sewa gagal dikirim." }); }
    finally { setBookingLoading(false); }
  };

  if (pageState === "loading") return <main className="min-h-[60vh] bg-[#fbfaf6] px-6 py-20 text-center text-sm text-[#68756b]">Memuat detail alat…</main>;
  if (pageState !== "ready" || !equipment) return <main className="min-h-[60vh] bg-[#fbfaf6] px-6 py-20 text-center"><h1 className="font-display text-2xl text-[#243b30]">{pageState === "not-found" ? "Alat tidak ditemukan" : "Detail alat belum dapat dimuat"}</h1><Link href="/#katalog" className="button-primary mt-5">Kembali ke katalog</Link></main>;

  return (
    <main className="bg-[#fbfaf6] text-[#2e4035]">
      <div className="mx-auto max-w-[1280px] px-5 pb-12 pt-6 sm:px-8 lg:px-0">
        <nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap items-center gap-2 text-[10px] text-[#7c867d]"><Link href="/" className="hover:text-[#205b40]">Beranda</Link><span>/</span><Link href="/#katalog" className="hover:text-[#205b40]">Katalog alat</Link><span>/</span><span className="text-[#426451]">{equipment.category}</span><span>/</span><span className="font-semibold text-[#304438]">{equipment.name}</span></nav>

        <section className="grid gap-7 lg:grid-cols-[1.12fr_.88fr]">
          <div className="min-w-0">
            <div className="relative overflow-hidden rounded-[5px] bg-[#e9eee5]">
              <img src={galleryPhotos[selectedPhotoIndex] || equipment.imageUrl} alt={`${equipment.name} — foto ${selectedPhotoIndex + 1}`} className="h-[300px] w-full object-cover sm:h-[390px] lg:h-[405px]" />
              <span className="absolute bottom-3 left-3 bg-white/90 px-3 py-1.5 text-[9px] font-medium text-[#405448]">Foto utama · {equipment.category}</span>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {(galleryPhotos.length > 1 ? galleryPhotos.slice(1, 3) : [galleryPhotos[0] || equipment.imageUrl, galleryPhotos[0] || equipment.imageUrl]).map((photo, index) => {
                const photoIndex = galleryPhotos.length > 1 ? index + 1 : 0;
                const label = galleryPhotos.length > 1 ? `Foto ${photoIndex + 1}` : index === 0 ? "Tampak keseluruhan" : "Detail alat";
                return <button key={`${photo}-${index}`} type="button" onClick={() => setSelectedPhotoIndex(photoIndex)} className={`relative h-[82px] overflow-hidden rounded-[4px] bg-[#e9eee5] text-left sm:h-[105px] ${selectedPhotoIndex === photoIndex ? "ring-2 ring-[#205b40]" : ""}`}><img src={photo} alt={`${equipment.name} — ${label}`} className={`h-full w-full object-cover ${galleryPhotos.length === 1 ? index === 0 ? "object-[35%_center]" : "object-[75%_center]" : ""}`} /><span className="absolute bottom-1.5 left-2 bg-white/90 px-2 py-1 text-[8px] text-[#405448]">{label}</span></button>;
              })}
            </div>
          </div>

          <div className="flex flex-col justify-center py-1 lg:pl-2">
            <p className="eyebrow text-[#426451]">Detail alat pertanian</p>
            <h1 className="font-display mt-3 text-[32px] leading-[1.08] text-[#243b30] sm:text-[40px]">{equipment.name}</h1>
            <span className="mt-3 w-fit rounded-full bg-[#e9eee5] px-3 py-1.5 text-[9px] font-medium text-[#426451]">{equipment.category}</span>
            <p className="mt-4 max-w-[600px] text-[12px] leading-6 text-[#68756b]">{equipment.description || "Informasi alat akan dijelaskan oleh pengelola depot."}</p>
            <p className="font-display mt-5 text-[28px] text-[#285b43]">{money(equipment.dailyRate)} <span className="font-sans text-[11px] text-[#778178]">/ hari</span></p>
            <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 border-y border-[#dce1d9] py-4 text-[10px]">
              <span className="text-[#7b817a]">Unit siap sewa</span><strong className="text-right text-[#304438]">{equipment.availableUnitsCount} unit</strong>
              <span className="text-[#7b817a]">Kondisi</span><strong className="text-right text-[#304438]">{equipment.units.filter((unit) => unit.conditionStatus === "aktif").length} unit layak</strong>
              <span className="text-[#7b817a]">Pemeriksaan</span><strong className="text-right text-[#304438]">Diperiksa sebelum serah terima</strong>
            </div>
            <div className="mt-4 flex items-start gap-2.5 border border-[#dce1d9] bg-white p-3 text-[10px] leading-5 text-[#526257]"><Info size={14} className="mt-0.5 shrink-0 text-[#426451]" /><p>Jumlah unit dan tanggal sewa akan diperiksa kembali saat Anda mengajukan permintaan.</p></div>
          </div>
        </section>

        <section className="mt-7 grid gap-4 lg:grid-cols-[1.45fr_.8fr]">
          <div className="rounded-[5px] border border-[#e2e5dd] bg-white p-4 sm:p-5">
            <div className="mb-4 flex items-start justify-between gap-3"><div><p className="eyebrow text-[#426451]">Jadwal unit</p><h2 className="font-display mt-1 text-[19px] text-[#243b30]">Cek tanggal sebelum merencanakan</h2><p className="mt-1 text-[9px] text-[#7b817a]">Pilih tanggal mulai lalu tanggal kembali. Hari sewa dihitung inklusif.</p></div><CalendarDays size={18} className="text-[#426451]" /></div>
            <div className="mb-3 flex items-center justify-between border-y border-[#edf0e9] py-2"><button onClick={() => changeMonth(-1)} aria-label="Bulan sebelumnya" className="p-1 text-[#526257] hover:bg-[#f2f4ef]"><ChevronLeft size={15} /></button><span className="text-[11px] font-semibold capitalize text-[#304438]">{monthTitle}</span><button onClick={() => changeMonth(1)} aria-label="Bulan berikutnya" className="p-1 text-[#526257] hover:bg-[#f2f4ef]"><ChevronRight size={15} /></button></div>
            <div className="grid grid-cols-7 gap-1 text-center text-[8px] text-[#828980]">{["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].map((day) => <span key={day} className="py-1">{day}</span>)}</div>
            <div className="grid grid-cols-7 gap-1" aria-label={`Kalender ${monthTitle}`}>
              {calendarCells.map((date, index) => {
                if (!date) return <span key={`blank-${index}`} className="min-h-[37px] sm:min-h-[44px]" />;
                const item = calendarByDate.get(date);
                const isPast = date < todayKey();
                const isSelected = date === startDate || date === endDate;
                const inRange = Boolean(startDate && endDate && date > startDate && date < endDate);
                const available = item?.availableUnitsCount ?? 0;
                const statusClass = isPast ? "bg-[#f5f5f1] text-[#b3b8b0]" : available > 0 ? "bg-[#edf3e9] text-[#426451] hover:bg-[#dce8d7]" : item?.maintenanceUnitsCount ? "bg-[#fbf0d6] text-[#8a681c]" : "bg-[#f7e8e5] text-[#9b5146]";
                return <button key={date} type="button" disabled={isPast || available < 1 || calendarLoading} onClick={() => selectCalendarDate(date)} aria-pressed={isSelected || inRange} title={item ? `${available} unit tersedia${item.bookedUnitsCount ? `, ${item.bookedUnitsCount} terpesan` : ""}${item.maintenanceUnitsCount ? `, ${item.maintenanceUnitsCount} perawatan` : ""}` : "Memuat jadwal"} className={`relative min-h-[37px] rounded-[3px] text-[9px] transition sm:min-h-[44px] ${statusClass} ${isSelected ? "bg-[#205b40] text-white ring-2 ring-[#205b40] ring-offset-1" : inRange ? "bg-[#dce8d7] text-[#285b43]" : ""} disabled:cursor-not-allowed`}>
                  {Number(date.slice(-2))}{item?.maintenanceUnitsCount && available === 0 && !isPast ? <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-[#d6a52d]" /> : null}
                </button>;
              })}
            </div>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 border-t border-[#edf0e9] pt-3 text-[8px] text-[#68756b]">
              <span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[#a8c3a3]" /> Tersedia</span><span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[#cf8e82]" /> Terpesan / penuh</span><span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[#d6a52d]" /> Ada unit perawatan</span>
            </div>
            {calendarLoading && <p className="mt-2 text-[9px] text-[#7b817a]">Memuat ketersediaan…</p>}
            <p className="mt-2 text-[9px] leading-4 text-[#7b817a]">Kalender menunjukkan ringkasan unit aktif. Pesanan berjalan dan pemeriksaan pengembalian tetap memblokir unit hingga proses selesai.</p>
          </div>

          <aside className="h-fit rounded-[5px] border border-[#e2e5dd] bg-white p-4 sm:p-5">
            <p className="eyebrow text-[#426451]">Rencanakan penyewaan</p><h2 className="font-display mt-1 text-[20px] text-[#243b30]">Ringkasan sewa</h2>
            <div className="mt-4 space-y-3 border-y border-[#edf0e9] py-4 text-[10px]">
              <div className="flex items-center justify-between gap-3"><span className="text-[#7b817a]">Tanggal mulai</span><strong className="text-right text-[#304438]">{dateLabel(startDate)}</strong></div>
              <div className="flex items-center justify-between gap-3"><span className="text-[#7b817a]">Tanggal kembali</span><strong className="text-right text-[#304438]">{dateLabel(endDate)}</strong></div>
              <div className="flex items-center justify-between gap-3"><span className="text-[#7b817a]">Durasi</span><strong className="text-[#304438]">{durationDays || "—"} hari</strong></div>
              <div className="flex items-center justify-between gap-3"><span className="text-[#7b817a]">Unit tersedia pada rentang</span><strong className="text-right text-[#304438]">{rangeAvailability === null ? "Pilih dua tanggal" : `${rangeAvailability} unit`}</strong></div>
            </div>
            {durationDays > 0 && <div className="flex items-center justify-between py-4 text-[10px]"><span className="text-[#7b817a]">Estimasi biaya sewa</span><strong className="font-display text-[19px] text-[#285b43]">{money(total)}</strong></div>}
            {startDate && endDate && rangeAvailability === null && <p className="mb-3 text-[9px] text-[#7b817a]">Memeriksa ketersediaan untuk seluruh rentang…</p>}
            {startDate && endDate && rangeAvailability === 0 && <p role="alert" className="mb-3 rounded-[3px] bg-[#f7e8e5] p-2.5 text-[9px] leading-4 text-[#9b5146]">Tidak ada unit yang tersedia untuk seluruh rentang ini. Pilih tanggal lain.</p>}
            {bookingNotice && <p role="status" className={`mb-3 rounded-[3px] p-2.5 text-[9px] leading-4 ${bookingNotice.kind === "success" ? "bg-[#edf3e9] text-[#285b43]" : "bg-[#f7e8e5] text-[#9b5146]"}`}>{bookingNotice.text}</p>}
            <button type="button" onClick={submitBooking} disabled={!startDate || !endDate || durationDays < 1 || rangeAvailability === null || rangeAvailability < 1 || bookingLoading} className="button-primary w-full justify-center disabled:cursor-not-allowed disabled:opacity-45">{bookingLoading ? "Mengirim permintaan…" : user ? "Ajukan permintaan sewa" : "Masuk untuk menyewa"}<ArrowRight size={13} /></button>
            <p className="mt-2 flex items-start gap-1.5 text-[8px] leading-4 text-[#7b817a]"><ShieldCheck size={12} className="mt-0.5 shrink-0" /> Permintaan akan dikonfirmasi Admin sebelum pembayaran.</p>
          </aside>
        </section>

        <section className="mt-4 grid gap-4 lg:grid-cols-[1.45fr_.8fr]">
          <div className="rounded-[5px] border border-[#e2e5dd] bg-white p-4 sm:p-5"><h2 className="font-display text-[17px] text-[#243b30]">Kondisi & kelengkapan</h2><p className="mt-1 text-[9px] leading-5 text-[#7b817a]">Kondisi fisik dan kelengkapan unit dicatat bersama Admin saat alat diserahkan dan diperiksa kembali ketika dikembalikan.</p><div className="mt-3 grid gap-2 text-[9px] sm:grid-cols-2"><span className="flex items-center gap-2 text-[#526257]"><Check size={12} className="text-[#426451]" /> Status unit diperbarui oleh depot</span><span className="flex items-center gap-2 text-[#526257]"><PackageCheck size={12} className="text-[#426451]" /> Kode unit dicatat saat serah terima</span><span className="flex items-center gap-2 text-[#526257]"><CheckCircle2 size={12} className="text-[#426451]" /> Kondisi awal dan akhir didokumentasikan</span><span className="flex items-center gap-2 text-[#526257]"><Clock3 size={12} className="text-[#426451]" /> Pengembalian mengikuti tanggal yang dipilih</span></div></div>
          <div className="rounded-[5px] border border-[#e2e5dd] bg-white p-4 sm:p-5"><h2 className="font-display text-[17px] text-[#243b30]">Aturan penyewaan</h2><ul className="mt-2 space-y-2 text-[9px] leading-4 text-[#68756b]"><li>• Tanggal mulai dan kembali dihitung sebagai hari sewa.</li><li>• Permintaan menunggu pemeriksaan dan persetujuan Admin.</li><li>• Pembayaran dilakukan setelah permintaan disetujui.</li><li>• Jadwal dan ketersediaan diperiksa ulang saat permintaan dikirim.</li></ul><Link href="/#bantuan" className="mt-3 inline-flex items-center gap-1 text-[9px] font-semibold text-[#285b43] hover:underline">Baca bantuan sewa <ArrowRight size={11} /></Link></div>
        </section>
        <div className="mt-5 flex items-center justify-between border-t border-[#e2e5dd] pt-4 text-[9px] text-[#7b817a]"><Link href="/#katalog" className="inline-flex items-center gap-1 hover:text-[#285b43]"><ArrowLeft size={11} /> Kembali ke katalog</Link><span>Detail alat · SewaAlat</span></div>
      </div>
      <Footer />
    </main>
  );
}
