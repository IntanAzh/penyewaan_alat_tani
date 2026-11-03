"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Search, Filter, Calendar, CheckCircle2, AlertCircle, X, ChevronRight, Info } from "lucide-react";

interface Equipment {
  id: string;
  name: string;
  category: string;
  dailyRate: number;
  description: string;
  imageUrl: string;
  availableUnitsCount: number;
  units: Array<{
    id: string;
    unitCode: string;
    conditionStatus: string;
  }>;
}

export default function CatalogSection() {
  const { user, setAuthModalOpen, setAuthMode } = useAuth();
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State for Booking
  const [activeEquipment, setActiveEquipment] = useState<Equipment | null>(null);
  const [startDateStr, setStartDateStr] = useState("");
  const [endDateStr, setEndDateStr] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingMessage, setBookingMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const categories = ["Semua", "Traktor", "Mesin Tanam", "Pompa Air", "Panen"];

  const fetchEquipments = async () => {
    setLoading(true);
    try {
      const url = new URL("/api/equipments", window.location.origin);
      if (selectedCategory !== "Semua") url.searchParams.set("category", selectedCategory);
      if (searchQuery) url.searchParams.set("search", searchQuery);

      const res = await fetch(url.toString());
      const data = await res.json();
      if (res.ok) {
        setEquipments(data);
      }
    } catch (error) {
      console.error("Failed to load catalog", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipments();
  }, [selectedCategory, searchQuery]);

  // Calculate rental cost live
  const calculateTotalCost = () => {
    if (!startDateStr || !endDateStr || !activeEquipment) return { days: 0, total: 0 };
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) return { days: 0, total: 0 };
    
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const days = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    const total = days * activeEquipment.dailyRate;
    return { days, total };
  };

  const handleOpenBookingModal = (item: Equipment) => {
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

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !activeEquipment) return;
    setBookingLoading(true);
    setBookingMessage(null);

    try {
      const res = await fetch("/api/rentals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          equipmentId: activeEquipment.id,
          startDateStr,
          endDateStr,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal mengajukan pemesanan");
      }

      setBookingMessage({
        type: "success",
        text: `Pesanan berhasil diajukan dengan Kode Pesanan: ${data.rental.orderCode}! Silakan pantau dashboard untuk persetujuan admin.`,
      });
      fetchEquipments(); // refresh availability
    } catch (err: any) {
      setBookingMessage({
        type: "error",
        text: err.message,
      });
    } finally {
      setBookingLoading(false);
    }
  };

  const cost = calculateTotalCost();

  return (
    <section id="katalog" className="py-20 bg-[#FAF5E9]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <span className="text-xs font-black uppercase tracking-wider text-[#195B3E] bg-[#e8f5ee] px-3 py-1 rounded-full border border-[#195B3E]/20">
            Katalog Alat & Mesin Tani
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-[#1F2937] tracking-tight">
            Pilih Alat Pertanian Sesuai Kebutuhan Sawah Anda
          </h2>
          <p className="text-sm text-gray-600">
            Seluruh unit fisik terawat secara rutin, dilengkapi kode inventaris unik, dan siap diambil di lokasi depot.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-md border border-[#195B3E]/10 mb-10 space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-gray-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Cari nama alat (misal: Traktor, Pompa, Yanmar...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#FAF5E9]/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#195B3E]"
              />
            </div>

            {/* Category Tabs */}
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? "bg-[#195B3E] text-white shadow-sm"
                      : "bg-[#FAF5E9] text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Catalog Grid */}
        {loading ? (
          <div className="text-center py-16 text-gray-500 font-medium text-sm">
            Memuat data katalog alat tani...
          </div>
        ) : equipments.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
            <p className="text-gray-500 font-medium">Tidak ada alat tani yang cocok dengan pencarian Anda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {equipments.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Image & Badge */}
                  <div className="relative h-52 bg-gray-100 overflow-hidden">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 flex items-center space-x-2">
                      <span className="px-2.5 py-1 bg-[#195B3E] text-white text-[11px] font-extrabold rounded-lg shadow">
                        {item.category}
                      </span>
                    </div>
                    <div className="absolute bottom-3 right-3">
                      <span
                        className={`px-2.5 py-1 text-[11px] font-bold rounded-lg shadow ${
                          item.availableUnitsCount > 0
                            ? "bg-emerald-600 text-white"
                            : "bg-red-600 text-white"
                        }`}
                      >
                        {item.availableUnitsCount > 0
                          ? `${item.availableUnitsCount} Unit Tersedia`
                          : "Stok Sedang Habis"}
                      </span>
                    </div>
                  </div>

                  {/* Body Info */}
                  <div className="p-6 space-y-3">
                    <h3 className="text-lg font-black text-gray-900 line-clamp-1">{item.name}</h3>
                    <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">{item.description}</p>

                    {/* Code unit chips */}
                    <div className="pt-1 flex flex-wrap gap-1.5">
                      {item.units.map((unit) => (
                        <span
                          key={unit.id}
                          className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                            unit.conditionStatus === "aktif"
                              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                              : "bg-amber-50 border-amber-200 text-amber-800"
                          }`}
                        >
                          {unit.unitCode} ({unit.conditionStatus})
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer Price & Action */}
                <div className="p-6 pt-0 border-t border-gray-100 mt-4 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-gray-400 block font-medium">Tarif Sewa Harian</span>
                    <span className="text-xl font-black text-[#195B3E]">
                      Rp {item.dailyRate.toLocaleString("id-ID")}
                      <span className="text-xs font-normal text-gray-500"> / hari</span>
                    </span>
                  </div>

                  <button
                    onClick={() => handleOpenBookingModal(item)}
                    disabled={item.availableUnitsCount === 0}
                    className="px-4 py-2.5 bg-[#195B3E] text-white font-bold text-xs rounded-xl hover:bg-[#12432d] transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
                  >
                    {item.availableUnitsCount > 0 ? "Sewa Alat" : "Habis"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {activeEquipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-[#FAF5E9] rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-[#195B3E]/20">
            {/* Modal Header */}
            <div className="bg-[#195B3E] text-white px-6 py-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#a3d4bd]">Formulir Pemesanan</span>
                <h3 className="text-lg font-black text-[#FAF5E9] line-clamp-1">{activeEquipment.name}</h3>
              </div>
              <button
                onClick={() => setActiveEquipment(null)}
                className="p-1 text-white/80 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleBookingSubmit} className="p-6 space-y-4">
              {bookingMessage && (
                <div
                  className={`p-3.5 rounded-xl text-xs font-semibold ${
                    bookingMessage.type === "success"
                      ? "bg-emerald-100 border border-emerald-300 text-emerald-800"
                      : "bg-red-100 border border-red-300 text-red-800"
                  }`}
                >
                  {bookingMessage.text}
                </div>
              )}

              {/* Rate Summary */}
              <div className="bg-white p-3.5 rounded-xl border border-gray-200 flex justify-between items-center text-xs">
                <div>
                  <span className="text-gray-500 block">Tarif Harian</span>
                  <span className="font-bold text-[#195B3E] text-base">
                    Rp {activeEquipment.dailyRate.toLocaleString("id-ID")}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-gray-500 block">Lokasi Pengambilan</span>
                  <span className="font-bold text-gray-800">Depot TaniSewa Subang</span>
                </div>
              </div>

              {/* Date Inputs */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Tanggal Mulai Sewa</label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().slice(0, 10)}
                    value={startDateStr}
                    onChange={(e) => setStartDateStr(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs font-semibold text-gray-800 focus:ring-2 focus:ring-[#195B3E] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Tanggal Pengembalian</label>
                  <input
                    type="date"
                    required
                    min={startDateStr || new Date().toISOString().slice(0, 10)}
                    value={endDateStr}
                    onChange={(e) => setEndDateStr(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs font-semibold text-gray-800 focus:ring-2 focus:ring-[#195B3E] focus:outline-none"
                  />
                </div>
              </div>

              {/* Live Fee Calculator */}
              {cost.days > 0 && (
                <div className="bg-[#e8f5ee] p-4 rounded-xl border border-[#195B3E]/20 space-y-1.5">
                  <div className="flex justify-between text-xs text-gray-700">
                    <span>Estimasi Durasi:</span>
                    <span className="font-bold text-[#195B3E]">{cost.days} Hari</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-700">
                    <span>Perhitungan:</span>
                    <span>{cost.days} × Rp {activeEquipment.dailyRate.toLocaleString("id-ID")}</span>
                  </div>
                  <div className="border-t border-[#195B3E]/20 pt-1.5 flex justify-between items-center text-sm font-black text-[#195B3E]">
                    <span>Total Estimasi Biaya:</span>
                    <span>Rp {cost.total.toLocaleString("id-ID")}</span>
                  </div>
                </div>
              )}

              {/* Warning Info */}
              <div className="flex items-start space-x-2 text-[11px] text-gray-500 bg-white p-3 rounded-lg border border-gray-200">
                <Info className="w-4 h-4 text-[#195B3E] flex-shrink-0 mt-0.5" />
                <span>
                  Sistem akan memverifikasi ketersediaan unit fisik bebas bentrok jadwal. Pesanan yang disetujui admin dapat dilanjutkan ke pembayaran Midtrans Snap.
                </span>
              </div>

              {/* Modal Buttons */}
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveEquipment(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-300 transition-colors"
                >
                  Tutup
                </button>
                <button
                  type="submit"
                  disabled={bookingLoading || cost.days === 0}
                  className="px-6 py-2 bg-[#195B3E] text-white rounded-xl text-xs font-bold hover:bg-[#12432d] shadow transition-all disabled:opacity-40"
                >
                  {bookingLoading ? "Mengirim..." : "Ajukan Pemesanan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
