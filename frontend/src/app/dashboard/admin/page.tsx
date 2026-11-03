"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { 
  Tractor, Download, CheckCircle2, XCircle, Clock, PackageCheck, 
  AlertTriangle, DollarSign, ArrowLeft, RefreshCw, Plus, FileSpreadsheet, 
  X, Search, Filter, TrendingUp, TrendingDown, Layers, Calendar, 
  Phone, Mail, ArrowUpRight, ShieldCheck, Wrench, Check, HelpCircle
} from "lucide-react";

export default function AdminDashboard() {
  const { user, isAuthLoading } = useAuth();
  const [rentals, setRentals] = useState<any[]>([]);
  const [equipments, setEquipments] = useState<any[]>([]);
  const [equipmentCategories, setEquipmentCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Navigation & Filtering
  const [activeTab, setActiveTab] = useState<"transaksi" | "katalog">("transaksi");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [timeRange, setTimeRange] = useState<"all" | "month" | "week">("all");

  // Modals State
  const [handoverModalRental, setHandoverModalRental] = useState<any | null>(null);
  const [initialCondition, setInitialCondition] = useState("Kondisi fisik prima, bahan bakar penuh, kelengkapan normal.");

  const [returnModalRental, setReturnModalRental] = useState<any | null>(null);
  const [finalCondition, setFinalCondition] = useState("Fisik mulus, fungsi berjalan normal.");
  const [damageFeeInput, setDamageFeeInput] = useState("0");
  const [adminNotesInput, setAdminNotesInput] = useState("");

  const [newEquipModalOpen, setNewEquipModalOpen] = useState(false);
  const [newEquipName, setNewEquipName] = useState("");
  const [newEquipCat, setNewEquipCat] = useState("Traktor");
  const [newEquipRate, setNewEquipRate] = useState("");
  const [newEquipDesc, setNewEquipDesc] = useState("");
  const [newEquipImg, setNewEquipImg] = useState("");
  const [newEquipExtraImgs, setNewEquipExtraImgs] = useState("");
  const [newEquipUnitCodes, setNewEquipUnitCodes] = useState("");

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const resRent = await fetch("/api/rentals?role=admin");
      const dataRent = await resRent.json();
      if (resRent.ok && Array.isArray(dataRent)) setRentals(dataRent);

      const resEq = await fetch("/api/equipments?includeInactive=true");
      const dataEq = await resEq.json();
      if (resEq.ok && Array.isArray(dataEq)) setEquipments(dataEq);
      const resCategories = await fetch("/api/equipment-categories?includeInactive=true");
      const dataCategories = await resCategories.json();
      if (resCategories.ok && Array.isArray(dataCategories)) setEquipmentCategories(dataCategories.filter((category: any) => category.isActive));
    } catch (e) {
      console.error("Gagal mengambil data admin:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleApprove = async (rentalId: string, action: "approve" | "reject") => {
    let rejectReason: string | undefined = undefined;
    if (action === "reject") {
      const reason = prompt("Masukkan alasan penolakan:");
      if (!reason) return;
      rejectReason = reason;
    }

    try {
      const res = await fetch(`/api/rentals/${rentalId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, rejectReason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Pesanan gagal diproses.");
      await fetchAdminData();
    } catch (err: any) {
      alert(err instanceof Error ? err.message : "Pesanan gagal diproses.");
    }
  };

  const handleConfirmPickup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!handoverModalRental) return;

    try {
      const res = await fetch(`/api/rentals/${handoverModalRental.id}/pickup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initialConditionNotes: initialCondition }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal konfirmasi penyerahan");

      setHandoverModalRental(null);
      fetchAdminData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleConfirmReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnModalRental) return;

    try {
      const res = await fetch(`/api/rentals/${returnModalRental.id}/return`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          finalConditionNotes: finalCondition,
          damageFee: damageFeeInput,
          adminNotes: adminNotesInput,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal konfirmasi pengembalian");

      setReturnModalRental(null);
      fetchAdminData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handlePayFine = async (rentalId: string) => {
    try {
      const res = await fetch(`/api/rentals/${rentalId}/return`, {
        method: "PUT",
      });
      if (res.ok) fetchAdminData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const codes = newEquipUnitCodes.split(",").map((s) => s.trim()).filter(Boolean);
      const galleryUrls = [newEquipImg, ...newEquipExtraImgs.split(",")].map((url) => url.trim()).filter(Boolean);
      const res = await fetch("/api/equipments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newEquipName,
          category: newEquipCat,
          dailyRate: newEquipRate,
          description: newEquipDesc,
          imageUrl: newEquipImg || "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=800&q=80",
          imageUrls: galleryUrls,
          unitCodes: codes.length > 0 ? codes : [`UNT-${newEquipName.slice(0, 3).toUpperCase()}-001`],
        }),
      });
      if (res.ok) {
        setNewEquipModalOpen(false);
        setNewEquipName("");
        setNewEquipRate("");
        setNewEquipDesc("");
        setNewEquipUnitCodes("");
        setNewEquipImg("");
        setNewEquipExtraImgs("");
        fetchAdminData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const updateEquipment = async (id: string, changes: Record<string, unknown>) => {
    const res = await fetch(`/api/equipments/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(changes) });
    const data = await res.json();
    if (!res.ok) { alert(data.error || "Perubahan gagal disimpan."); return; }
    await fetchAdminData();
  };

  const addEquipmentUnits = async (id: string) => {
    const input = prompt("Masukkan kode unit baru, pisahkan dengan koma:");
    if (!input) return;
    const res = await fetch(`/api/equipments/${id}/units`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ unitCodes: input.split(",") }) });
    const data = await res.json();
    if (!res.ok) { alert(data.error || "Unit gagal ditambahkan."); return; }
    await fetchAdminData();
  };

  const updateUnitStatus = async (unitId: string, conditionStatus: string) => {
    const res = await fetch(`/api/equipment-units/${unitId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ conditionStatus }) });
    const data = await res.json();
    if (!res.ok) { alert(data.error || "Status unit gagal diperbarui."); await fetchAdminData(); return; }
    await fetchAdminData();
  };

  const addEquipmentCategory = async () => {
    const name = prompt("Nama kategori alat baru:")?.trim();
    if (!name) return;
    const res = await fetch("/api/equipment-categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
    const data = await res.json();
    if (!res.ok) { alert(data.error || "Kategori gagal ditambahkan."); return; }
    setEquipmentCategories((current) => [...current, data]);
    setNewEquipCat(data.name);
  };

  const manageEquipmentCategories = async () => {
    const current = await fetch("/api/equipment-categories?includeInactive=true").then((res) => res.json());
    if (!Array.isArray(current) || !current.length) { alert("Belum ada kategori."); return; }
    const selected = prompt(`Pilih nomor kategori untuk dikelola:\n${current.map((category: any, index: number) => `${index + 1}. ${category.name}${category.isActive ? "" : " (nonaktif)"}`).join("\n")}`);
    const category = current[Number(selected) - 1];
    if (!category) return;
    const action = prompt(`Kategori: ${category.name}\nKetik: ubah, ${category.isActive ? "nonaktifkan" : "aktifkan"}`)?.toLowerCase();
    if (!action) return;
    const changes: any = {};
    if (action === "ubah") { const name = prompt("Nama kategori baru:")?.trim(); if (!name) return; changes.name = name; }
    else if (action === "nonaktifkan" && category.isActive) changes.isActive = false;
    else if (action === "aktifkan" && !category.isActive) changes.isActive = true;
    else return;
    const res = await fetch(`/api/equipment-categories/${category.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(changes) });
    const data = await res.json();
    if (!res.ok) { alert(data.error || "Kategori gagal diperbarui."); return; }
    await fetchAdminData();
  };

  const editEquipment = async (item: any) => {
    const name = prompt("Nama alat:", item.name); if (!name?.trim()) return;
    const category = prompt("Kategori:", item.category); if (!category?.trim()) return;
    const rate = prompt("Tarif sewa harian (Rp):", String(item.dailyRate)); if (!rate) return;
    const description = prompt("Deskripsi alat:", item.description || ""); if (description === null) return;
    const imageUrl = prompt("URL foto:", item.imageUrl || ""); if (imageUrl === null) return;
    const extraPhotos = prompt("URL foto tambahan (pisahkan koma, maksimal 5):", Array.isArray(item.imageUrls) ? item.imageUrls.slice(1).join(", ") : ""); if (extraPhotos === null) return;
    const imageUrls = [imageUrl, ...extraPhotos.split(",")].map((url) => url.trim()).filter(Boolean);
    await updateEquipment(item.id, { name, category, dailyRate: rate, description, imageUrl, imageUrls });
  };

  // Aggregated Metrics Calculations
  const stats = useMemo(() => {
    const totalOrders = rentals.length;
    const pendingApprovals = rentals.filter((r) => r.rentalStatus === "menunggu_persetujuan").length;
    const readyForPickup = rentals.filter((r) => r.rentalStatus === "siap_diambil" || (r.rentalStatus === "menunggu_pembayaran" && r.payment?.paymentStatus === "berhasil")).length;
    const activeRentals = rentals.filter((r) => r.rentalStatus === "sedang_disewa").length;
    const inspectingReturns = rentals.filter((r) => r.rentalStatus === "pemeriksaan_pengembalian").length;
    const completedOrders = rentals.filter((r) => r.rentalStatus === "selesai").length;

    const totalRevenue = rentals
      .filter((r) => r.payment?.paymentStatus === "berhasil")
      .reduce((sum, r) => sum + (r.totalRentalFee || 0), 0);

    // Total Physical Units Count
    let totalPhysicalUnits = 0;
    let activePhysicalUnits = 0;
    let maintenancePhysicalUnits = 0;

    equipments.forEach((eq) => {
      if (Array.isArray(eq.units)) {
        totalPhysicalUnits += eq.units.length;
        activePhysicalUnits += eq.units.filter((u: any) => u.conditionStatus === "aktif").length;
        maintenancePhysicalUnits += eq.units.filter((u: any) => u.conditionStatus !== "aktif").length;
      }
    });

    const rentedPhysicalUnits = activeRentals;
    const freeAvailableUnits = Math.max(0, activePhysicalUnits - rentedPhysicalUnits);
    const utilizationRate = totalPhysicalUnits > 0 ? Math.round(((rentedPhysicalUnits) / totalPhysicalUnits) * 100) : 0;

    // Categories Distribution
    const categoryCounts: Record<string, number> = {
      Traktor: 0,
      "Mesin Tanam": 0,
      "Pompa Air": 0,
      Panen: 0,
    };
    rentals.forEach((r) => {
      const cat = r.unit?.equipment?.category;
      if (cat && categoryCounts[cat] !== undefined) {
        categoryCounts[cat] += 1;
      } else if (cat) {
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      }
    });

    return {
      totalOrders,
      pendingApprovals,
      readyForPickup,
      activeRentals,
      inspectingReturns,
      completedOrders,
      totalRevenue,
      totalPhysicalUnits,
      activePhysicalUnits,
      freeAvailableUnits,
      maintenancePhysicalUnits,
      utilizationRate,
      categoryCounts,
    };
  }, [rentals, equipments]);

  // Filtered Rentals for Table
  const filteredRentals = useMemo(() => {
    return rentals.filter((r) => {
      // Search Match
      const searchMatch = !searchQuery || 
        r.orderCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.unit?.equipment?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.unit?.unitCode?.toLowerCase().includes(searchQuery.toLowerCase());

      // Status Match
      let statusMatch = true;
      if (statusFilter === "pending") statusMatch = r.rentalStatus === "menunggu_persetujuan";
      else if (statusFilter === "ready") statusMatch = r.rentalStatus === "siap_diambil" || (r.rentalStatus === "menunggu_pembayaran" && r.payment?.paymentStatus === "berhasil");
      else if (statusFilter === "rented") statusMatch = r.rentalStatus === "sedang_disewa";
      else if (statusFilter === "inspecting") statusMatch = r.rentalStatus === "pemeriksaan_pengembalian";
      else if (statusFilter === "completed") statusMatch = r.rentalStatus === "selesai";

      return searchMatch && statusMatch;
    });
  }, [rentals, searchQuery, statusFilter]);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#FAF5E9] flex items-center justify-center">
        <div className="text-center space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin text-[#195B3E] mx-auto" />
          <p className="text-sm font-bold text-gray-700">Memeriksa hak akses pengelola...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-[#FAF5E9] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-red-200 shadow-xl text-center space-y-4">
          <div className="w-14 h-14 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-black text-gray-900">Akses Terbatas</h2>
          <p className="text-xs text-gray-600">
            Halaman ini khusus untuk Pengelola Depot (Admin). Silakan masuk menggunakan akun pengelola yang terdaftar.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center w-full px-5 py-3 bg-[#195B3E] text-white font-bold rounded-xl text-xs hover:bg-[#12432d] transition-all shadow"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Kembali ke Beranda
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-gray-900">
      {/* Top Background Pattern */}
      <div className="w-full bg-[#195B3E] text-white pt-8 pb-24 px-4 sm:px-6 lg:px-8 border-b border-[#12432d]">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Breadcrumb & Live Status Pill */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2 text-emerald-200">
              <Link href="/" className="hover:text-white flex items-center transition-colors">
                <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Beranda Publik
              </Link>
              <span>/</span>
              <span className="text-white font-bold">Depot Control Center</span>
            </div>

            <div className="flex items-center space-x-3">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-900/60 text-emerald-200 border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 mr-2 animate-pulse" />
                Depot Barlingmascakep Aktif (09:00 - 17:00 WIB)
              </span>
              <button 
                onClick={fetchAdminData}
                disabled={loading}
                className="p-1.5 rounded-lg bg-emerald-800/60 hover:bg-emerald-800 text-emerald-100 transition-all border border-emerald-600/30"
                title="Refresh Data"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {/* Title Header with Action Buttons */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
                <span className="p-2 bg-emerald-800/80 rounded-xl border border-emerald-600/40">
                  <Tractor className="w-6 h-6 text-emerald-300" />
                </span>
                Dashboard Pengelola Depot (Admin)
              </h1>
              <p className="text-xs sm:text-sm text-emerald-100/80 mt-1 max-w-2xl">
                Monitoring ketersediaan unit fisik, persetujuan sewa, serah terima alat, verifikasi denda, dan laporan operasional.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <a
                href="/api/reports/export"
                target="_blank"
                rel="noreferrer"
                className="flex items-center space-x-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold transition-all shadow-sm backdrop-blur-sm"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
                <span>Unduh Laporan CSV</span>
              </a>

              <button
                onClick={() => setNewEquipModalOpen(true)}
                className="flex items-center space-x-2 px-4 py-2.5 bg-emerald-400 hover:bg-emerald-300 text-gray-950 rounded-xl text-xs font-black transition-all shadow-lg hover:shadow-emerald-400/20"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Tambah Alat Baru</span>
              </button>
              <button onClick={manageEquipmentCategories} className="flex items-center space-x-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold transition-all">
                <Layers className="w-4 h-4" /><span>Kelola Kategori</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container Overlapping Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 pb-16 space-y-8">
        
        {/* ROW 1: 4 KPI Cards Matching Figma 107-54121 Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Card 1: Featured Dark Gradient Highlight Card */}
          <div className="bg-gradient-to-br from-[#12432d] to-[#195B3E] text-white p-6 rounded-3xl border border-emerald-700/40 shadow-xl relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none" />
            <div>
              <div className="flex justify-between items-start mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-200">
                  Total Penerimaan Sewa
                </span>
                <span className="p-2 bg-white/10 rounded-xl">
                  <DollarSign className="w-4 h-4 text-emerald-300" />
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Rp {stats.totalRevenue.toLocaleString("id-ID")}
              </div>
            </div>

            <div className="pt-4 border-t border-emerald-600/30 flex items-center justify-between text-xs">
              <span className="inline-flex items-center text-emerald-300 font-bold">
                <TrendingUp className="w-3.5 h-3.5 mr-1" /> Terverifikasi Lunas
              </span>
              <span className="text-emerald-200/80 text-[11px]">Midtrans Gateway</span>
            </div>
          </div>

          {/* Card 2: Permintaan Menunggu (Pending Approvals) */}
          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
                  Perlu Persetujuan
                </span>
                <span className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                  <Clock className="w-4 h-4" />
                </span>
              </div>
              <div className="text-3xl font-black text-gray-900">
                {stats.pendingApprovals}
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs">
              <span className="text-amber-600 font-bold text-[11px]">Butuh Keputusan Admin</span>
              <button 
                onClick={() => setStatusFilter("pending")}
                className="text-[11px] font-bold text-[#195B3E] hover:underline"
              >
                Lihat Antrean →
              </button>
            </div>
          </div>

          {/* Card 3: Unit Sedang Disewa with "Meningkat" Pill */}
          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700">
                  Sedang Disewa
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  <TrendingUp className="w-3 h-3 mr-0.5" /> Aktif
                </span>
              </div>
              <div className="text-3xl font-black text-gray-900">
                {stats.activeRentals} <span className="text-sm font-semibold text-gray-400">Unit</span>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs">
              <span className="text-gray-500 text-[11px]">Di tangan petani/penyewa</span>
              <span className="text-purple-600 font-mono font-bold text-[11px]">
                {stats.utilizationRate}% Utilisasi
              </span>
            </div>
          </div>

          {/* Card 4: Total Riwayat Pesanan */}
          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  Total Riwayat Pesanan
                </span>
                <span className="p-2 bg-gray-100 text-gray-600 rounded-xl">
                  <PackageCheck className="w-4 h-4" />
                </span>
              </div>
              <div className="text-3xl font-black text-gray-900">
                {stats.totalOrders}
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs">
              <span className="text-gray-500 text-[11px]">{stats.completedOrders} transaksi tuntas</span>
              <span className="text-emerald-700 font-bold text-[11px]">100% Tercatat</span>
            </div>
          </div>
        </div>

        {/* ROW 2: Analytics & Operational Intelligence (Figma Middle Section) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Panel 1: Circular Utilisasi Progress Chart */}
          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-black text-gray-900">Tingkat Utilisasi Armada Unit</h3>
                <p className="text-[11px] text-gray-500">Kapasitas {stats.totalPhysicalUnits} unit fisik di depot</p>
              </div>
              <span className="text-xs font-bold text-[#195B3E] bg-[#FAF5E9] px-2.5 py-1 rounded-lg">
                Depot Info
              </span>
            </div>

            <div className="flex items-center justify-center py-2">
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#E5E7EB"
                    strokeWidth="10"
                    fill="transparent"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#195B3E"
                    strokeWidth="10"
                    strokeDasharray={`${stats.utilizationRate * 2.51} 251`}
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute text-center">
                  <span className="text-2xl font-black text-gray-900">{stats.utilizationRate}%</span>
                  <span className="block text-[9px] font-bold uppercase text-gray-400">Terpakai</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-100 text-center">
              <div className="p-2 rounded-xl bg-emerald-50/60">
                <span className="block text-xs font-black text-emerald-800">{stats.freeAvailableUnits}</span>
                <span className="text-[10px] text-emerald-700 font-semibold">Tersedia</span>
              </div>
              <div className="p-2 rounded-xl bg-purple-50/60">
                <span className="block text-xs font-black text-purple-800">{stats.activeRentals}</span>
                <span className="text-[10px] text-purple-700 font-semibold">Disewa</span>
              </div>
              <div className="p-2 rounded-xl bg-amber-50/60">
                <span className="block text-xs font-black text-amber-800">{stats.maintenancePhysicalUnits}</span>
                <span className="text-[10px] text-amber-700 font-semibold">Perawatan</span>
              </div>
            </div>
          </div>

          {/* Panel 2: Distribusi Kategori Alat (Horizontal Bars) */}
          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-black text-gray-900">Distribusi Kategori Sewa</h3>
                <p className="text-[11px] text-gray-500">Alat paling diminati petani</p>
              </div>
              <Layers className="w-4 h-4 text-gray-400" />
            </div>

            <div className="space-y-3.5 pt-1">
              {[
                { name: "Traktor (Roda 2 & 4)", count: stats.categoryCounts["Traktor"] || 0, color: "bg-emerald-600" },
                { name: "Mesin Tanam Padi (Transplanter)", count: stats.categoryCounts["Mesin Tanam"] || 0, color: "bg-blue-600" },
                { name: "Pompa Air Irigasi 3 Inch", count: stats.categoryCounts["Pompa Air"] || 0, color: "bg-cyan-600" },
                { name: "Mesin Panen & Perontok", count: stats.categoryCounts["Panen"] || 0, color: "bg-amber-600" },
              ].map((item, idx) => {
                const total = Math.max(1, stats.totalOrders);
                const pct = Math.round((item.count / total) * 100);
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-gray-700">{item.name}</span>
                      <span className="font-semibold text-gray-500">{item.count} sewa ({pct}%)</span>
                    </div>
                    <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${item.color} rounded-full transition-all duration-700`}
                        style={{ width: `${Math.max(5, pct)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="text-[10px] text-gray-400 pt-2 border-t border-gray-100">
              Perhitungan data berdasarkan total pesanan masuk secara real-time.
            </p>
          </div>

          {/* Panel 3: Agenda & Tindakan Cepat Operasional Hari Ini */}
          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-black text-gray-900">Agenda Operasional Hari Ini</h3>
                <span className="text-[10px] bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-full">
                  Prioritas
                </span>
              </div>

              <div className="space-y-2.5">
                {/* 1. Siap Handover */}
                <div 
                  onClick={() => setStatusFilter("ready")}
                  className="p-3 rounded-2xl bg-[#FAF5E9] hover:bg-[#f3ebd3] border border-[#195B3E]/10 cursor-pointer transition-all flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-xl bg-[#195B3E] text-white flex items-center justify-center font-bold text-xs">
                      {stats.readyForPickup}
                    </div>
                    <div>
                      <span className="font-bold text-xs text-gray-900 block">Siap Serah Terima Fisik</span>
                      <span className="text-[10px] text-gray-500">Penyewa sudah bayar lunas</span>
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-[#195B3E]" />
                </div>

                {/* 2. Sedang Diperiksa Pengembalian */}
                <div 
                  onClick={() => setStatusFilter("inspecting")}
                  className="p-3 rounded-2xl bg-amber-50 hover:bg-amber-100/70 border border-amber-200/50 cursor-pointer transition-all flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold text-xs">
                      {stats.inspectingReturns}
                    </div>
                    <div>
                      <span className="font-bold text-xs text-gray-900 block">Pemeriksaan & Denda</span>
                      <span className="text-[10px] text-gray-500">Perlu input cek fisik / pelunasan</span>
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-amber-700" />
                </div>
              </div>
            </div>

            <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
              <span className="text-[11px] font-bold text-gray-600">Ekspor rekapitulasi data:</span>
              <a
                href="/api/reports/export"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-black text-[#195B3E] hover:underline flex items-center"
              >
                CSV Otomatis <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
              </a>
            </div>
          </div>

        </div>

        {/* ROW 3: Wavy Activity Spline Chart (Figma Style Trend Visualization) */}
        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-black text-gray-900">Tren Aktivitas & Permintaan Alat Tani</h3>
              <p className="text-[11px] text-gray-500">Fluktuasi peminjaman pada masa tanam dan panen</p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center text-[11px] font-bold text-[#195B3E] bg-[#FAF5E9] px-3 py-1 rounded-full border border-[#195B3E]/10">
                <span className="w-2 h-2 rounded-full bg-[#195B3E] mr-1.5" /> Musim Tanam 2026
              </span>
            </div>
          </div>

          {/* SVG Wavy Line Spline Area Chart */}
          <div className="h-44 w-full relative pt-4">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 800 120" preserveAspectRatio="none">
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#195B3E" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#195B3E" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              
              {/* Grid Lines */}
              <line x1="0" y1="30" x2="800" y2="30" stroke="#F3F4F6" strokeDasharray="4 4" />
              <line x1="0" y1="70" x2="800" y2="70" stroke="#F3F4F6" strokeDasharray="4 4" />
              <line x1="0" y1="110" x2="800" y2="110" stroke="#F3F4F6" strokeDasharray="4 4" />

              {/* Area Under Curve */}
              <path
                d="M 0 90 Q 100 40 200 60 T 400 30 T 600 50 T 800 20 L 800 120 L 0 120 Z"
                fill="url(#chartGradient)"
              />
              
              {/* Wavy Line */}
              <path
                d="M 0 90 Q 100 40 200 60 T 400 30 T 600 50 T 800 20"
                fill="none"
                stroke="#195B3E"
                strokeWidth="3.5"
                strokeLinecap="round"
              />

              {/* Data Points */}
              <circle cx="200" cy="60" r="4.5" fill="#195B3E" stroke="#FFFFFF" strokeWidth="2" />
              <circle cx="400" cy="30" r="4.5" fill="#195B3E" stroke="#FFFFFF" strokeWidth="2" />
              <circle cx="600" cy="50" r="4.5" fill="#195B3E" stroke="#FFFFFF" strokeWidth="2" />
              <circle cx="800" cy="20" r="5" fill="#D97706" stroke="#FFFFFF" strokeWidth="2" />
            </svg>
            <div className="flex justify-between text-[10px] text-gray-400 mt-2 px-1">
              <span>Minggu 1</span>
              <span>Minggu 2</span>
              <span>Minggu 3</span>
              <span>Minggu 4</span>
              <span className="font-bold text-[#195B3E]">Puncak Permintaan (Hari Ini)</span>
            </div>
          </div>
        </div>

        {/* ROW 4: Main Tabbed Tables Section (Transaksi vs Master Alat) */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
          
          {/* Section Toolbar */}
          <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* View Switcher Tabs */}
            <div className="grid w-full grid-cols-2 rounded-2xl border border-[#195B3E]/10 bg-[#FAF5E9] p-1 sm:w-fit">
              <button
                onClick={() => setActiveTab("transaksi")}
                className={`rounded-xl px-2 py-2 text-[10px] font-black leading-tight transition-all sm:px-4 sm:text-xs ${
                  activeTab === "transaksi"
                    ? "bg-[#195B3E] text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Manajemen Transaksi ({rentals.length})
              </button>
              <button
                onClick={() => setActiveTab("katalog")}
                className={`rounded-xl px-2 py-2 text-[10px] font-black leading-tight transition-all sm:px-4 sm:text-xs ${
                  activeTab === "katalog"
                    ? "bg-[#195B3E] text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Master Inventaris Alat ({equipments.length})
              </button>
            </div>

            {/* Search & Filter Controls */}
            {activeTab === "transaksi" && (
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative min-w-[240px]">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari kode, penyewa, atau alat..."
                    className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#195B3E] focus:bg-white transition-all"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery("")} className="absolute right-2.5 top-2.5 text-gray-400">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#195B3E]"
                >
                  <option value="all">Semua Status</option>
                  <option value="pending">Menunggu Persetujuan</option>
                  <option value="ready">Siap Diambil (Lunas)</option>
                  <option value="rented">Sedang Disewa</option>
                  <option value="inspecting">Pemeriksaan Return</option>
                  <option value="completed">Selesai</option>
                </select>
              </div>
            )}
          </div>

          {/* Table Content */}
          {activeTab === "transaksi" ? (
            <div className="space-y-3 p-4 md:hidden">
              {filteredRentals.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-300 px-4 py-10 text-center text-xs text-gray-500">Tidak ada transaksi yang cocok.</div>
              ) : filteredRentals.map((r) => {
                const pending = r.rentalStatus === "menunggu_persetujuan";
                const paidForHandover = r.rentalStatus === "siap_diambil" || (r.rentalStatus === "menunggu_pembayaran" && r.payment?.paymentStatus === "berhasil");
                const rented = r.rentalStatus === "sedang_disewa";
                const inspecting = r.rentalStatus === "pemeriksaan_pengembalian";
                const completed = r.rentalStatus === "selesai";
                return (
                  <article key={r.id} className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0"><p className="break-all font-mono text-[10px] font-bold text-gray-500">{r.orderCode}</p><h3 className="mt-1 break-words text-sm font-black text-gray-900">{r.unit?.equipment?.name || "Alat Tani"}</h3><p className="text-[11px] text-gray-500">{r.user?.name} · {r.user?.phone}</p></div>
                      <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-800">{r.rentalStatus.replaceAll("_", " ")}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 border-y border-gray-100 py-3 text-[11px]">
                      <div><span className="block text-gray-400">Unit fisik</span><strong className="break-all text-gray-800">{r.unit?.unitCode}</strong></div>
                      <div><span className="block text-gray-400">Total biaya</span><strong className="text-gray-800">Rp {(r.totalRentalFee || 0).toLocaleString("id-ID")}</strong></div>
                      <div><span className="block text-gray-400">Jadwal sewa</span><strong className="text-gray-800">{new Date(r.startDate).toLocaleDateString("id-ID")} – {new Date(r.endDate).toLocaleDateString("id-ID")}</strong></div>
                      <div><span className="block text-gray-400">Pembayaran</span><strong className="text-gray-800">{r.payment?.paymentStatus || "belum dibayar"}</strong></div>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {pending && <><button onClick={() => handleApprove(r.id, "approve")} className="w-full rounded-lg bg-[#195B3E] px-3 py-2.5 text-xs font-bold text-white">Setujui pesanan</button><button onClick={() => handleApprove(r.id, "reject")} className="w-full rounded-lg bg-red-50 px-3 py-2.5 text-xs font-bold text-red-700">Tolak pesanan</button></>}
                      {paidForHandover && <button onClick={() => setHandoverModalRental(r)} className="w-full rounded-lg bg-purple-700 px-3 py-2.5 text-xs font-bold text-white">Serah terima unit</button>}
                      {rented && <button onClick={() => setReturnModalRental(r)} className="w-full rounded-lg bg-amber-600 px-3 py-2.5 text-xs font-bold text-white">Proses pengembalian</button>}
                      {inspecting && r.returnRecord?.finePaymentStatus !== "lunas" && <button onClick={() => handlePayFine(r.id)} className="w-full rounded-lg bg-blue-600 px-3 py-2.5 text-xs font-bold text-white">Lunasi denda · Rp {(r.returnRecord?.totalFine || 0).toLocaleString("id-ID")}</button>}
                      {completed && <p className="text-center text-xs font-bold text-emerald-700">Transaksi tuntas</p>}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : null}

          {activeTab === "transaksi" ? (
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF5E9]/60 text-[#195B3E] uppercase font-bold text-[10px] tracking-wider border-b border-gray-200">
                  <tr>
                    <th className="py-4 px-6">Kode Transaksi</th>
                    <th className="py-4 px-6">Penyewa & Kontak</th>
                    <th className="py-4 px-6">Alat & Kode Unit</th>
                    <th className="py-4 px-6">Jadwal Sewa</th>
                    <th className="py-4 px-6">Total Biaya & Gateway</th>
                    <th className="py-4 px-6">Status Transaksi</th>
                    <th className="py-4 px-6 text-center">Tindakan Operasional</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredRentals.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-gray-400">
                        <PackageCheck className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                        <p className="text-xs font-bold text-gray-600">Tidak ada transaksi yang cocok.</p>
                        <p className="text-[11px] text-gray-400">Silakan ubah filter pencarian atau tunggu pesanan baru.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredRentals.map((r) => {
                      const isPendingApprove = r.rentalStatus === "menunggu_persetujuan";
                      const isPaidForHandover = r.rentalStatus === "siap_diambil" || (r.rentalStatus === "menunggu_pembayaran" && r.payment?.paymentStatus === "berhasil");
                      const isRentedActive = r.rentalStatus === "sedang_disewa";
                      const isInspecting = r.rentalStatus === "pemeriksaan_pengembalian";
                      const isCompleted = r.rentalStatus === "selesai";

                      return (
                        <tr key={r.id} className="hover:bg-emerald-50/20 transition-colors">
                          {/* Kode Transaksi */}
                          <td className="py-4 px-6">
                            <span className="font-mono font-black text-gray-900 block text-xs">
                              {r.orderCode}
                            </span>
                            <span className="text-[10px] text-gray-400">
                              {new Date(r.createdAt).toLocaleDateString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </td>

                          {/* Penyewa */}
                          <td className="py-4 px-6">
                            <div className="flex items-center space-x-2">
                              <div className="w-7 h-7 rounded-full bg-[#195B3E]/10 text-[#195B3E] font-black flex items-center justify-center text-[11px]">
                                {r.user?.name?.charAt(0) || "P"}
                              </div>
                              <div>
                                <span className="font-bold text-gray-900 block">{r.user?.name}</span>
                                <span className="text-[11px] text-gray-500 flex items-center">
                                  <Phone className="w-2.5 h-2.5 mr-1" /> {r.user?.phone}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Alat & Unit Fisik */}
                          <td className="py-4 px-6">
                            <span className="font-bold text-gray-900 block">
                              {r.unit?.equipment?.name || "Alat Tani"}
                            </span>
                            <span className="font-mono text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md inline-block mt-0.5">
                              {r.unit?.unitCode}
                            </span>
                          </td>

                          {/* Jadwal */}
                          <td className="py-4 px-6">
                            <span className="font-semibold text-gray-800 block">
                              {new Date(r.startDate).toLocaleDateString("id-ID")} - {new Date(r.endDate).toLocaleDateString("id-ID")}
                            </span>
                            <span className="text-[11px] text-[#195B3E] font-bold">
                              {r.durationDays} Hari Sewa
                            </span>
                          </td>

                          {/* Total Biaya & Gateway */}
                          <td className="py-4 px-6">
                            <span className="font-black text-gray-900 block text-xs">
                              Rp {(r.totalRentalFee || 0).toLocaleString("id-ID")}
                            </span>
                            <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 ${
                              r.payment?.paymentStatus === "berhasil" 
                                ? "bg-emerald-100 text-emerald-800"
                                : r.payment?.paymentStatus === "tertunda"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-gray-100 text-gray-600"
                            }`}>
                              Bayar: {r.payment?.paymentStatus || "belum"}
                            </span>
                          </td>

                          {/* Status Transaksi */}
                          <td className="py-4 px-6">
                            <span className={`inline-flex items-center text-[11px] font-bold px-2.5 py-1 rounded-xl border ${
                              isPendingApprove
                                ? "bg-amber-50 text-amber-800 border-amber-200"
                                : isPaidForHandover
                                ? "bg-purple-50 text-purple-800 border-purple-200"
                                : isRentedActive
                                ? "bg-blue-50 text-blue-800 border-blue-200"
                                : isInspecting
                                ? "bg-rose-50 text-rose-800 border-rose-200"
                                : isCompleted
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                : "bg-gray-50 text-gray-700 border-gray-200"
                            }`}>
                              {r.rentalStatus === "menunggu_persetujuan" && "Menunggu Review"}
                              {r.rentalStatus === "menunggu_pembayaran" && (r.payment?.paymentStatus === "berhasil" ? "Siap Diambil" : "Menunggu Bayar")}
                              {r.rentalStatus === "siap_diambil" && "Siap Diambil (Lunas)"}
                              {r.rentalStatus === "sedang_disewa" && "Sedang Digunakan"}
                              {r.rentalStatus === "pemeriksaan_pengembalian" && "Pemeriksaan Fisik"}
                              {r.rentalStatus === "selesai" && "Selesai"}
                              {!["menunggu_persetujuan", "menunggu_pembayaran", "siap_diambil", "sedang_disewa", "pemeriksaan_pengembalian", "selesai"].includes(r.rentalStatus) && r.rentalStatus}
                            </span>
                          </td>

                          {/* Aksi Operasional */}
                          <td className="py-4 px-6 text-center">
                            <div className="flex items-center justify-center space-x-1.5">
                              {/* 1. Review & Approve */}
                              {isPendingApprove && (
                                <>
                                  <button
                                    onClick={() => handleApprove(r.id, "approve")}
                                    className="px-3 py-1.5 bg-[#195B3E] text-white rounded-xl font-bold text-xs hover:bg-[#12432d] shadow-sm transition-all"
                                  >
                                    Setujui
                                  </button>
                                  <button
                                    onClick={() => handleApprove(r.id, "reject")}
                                    className="px-3 py-1.5 bg-red-100 text-red-700 rounded-xl font-bold text-xs hover:bg-red-200 transition-all"
                                  >
                                    Tolak
                                  </button>
                                </>
                              )}

                              {/* 2. Handover Serah Terima */}
                              {isPaidForHandover && (
                                <button
                                  onClick={() => setHandoverModalRental(r)}
                                  className="px-3 py-1.5 bg-purple-700 text-white rounded-xl font-bold text-xs hover:bg-purple-800 shadow-sm transition-all"
                                >
                                  Serah Terima Unit
                                </button>
                              )}

                              {/* 3. Pengembalian Return */}
                              {isRentedActive && (
                                <button
                                  onClick={() => setReturnModalRental(r)}
                                  className="px-3 py-1.5 bg-amber-600 text-white rounded-xl font-bold text-xs hover:bg-amber-700 shadow-sm transition-all"
                                >
                                  Proses Return
                                </button>
                              )}

                              {/* 4. Lunasi Denda */}
                              {isInspecting && r.returnRecord?.finePaymentStatus !== "lunas" && (
                                <button
                                  onClick={() => handlePayFine(r.id)}
                                  className="px-3 py-1.5 bg-blue-600 text-white rounded-xl font-bold text-xs hover:bg-blue-700 shadow-sm transition-all"
                                >
                                  Lunasi Denda (Rp {(r.returnRecord?.totalFine || 0).toLocaleString("id-ID")})
                                </button>
                              )}

                              {/* 5. Tuntas */}
                              {isCompleted && (
                                <span className="inline-flex items-center text-emerald-700 font-bold text-xs">
                                  <Check className="w-4 h-4 mr-1" /> Tuntas
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            /* Master Inventaris Alat Grid */
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              {equipments.map((item) => (
                <div key={item.id} className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm hover:shadow-md transition-all space-y-3">
                  <div className="h-44 overflow-hidden rounded-2xl bg-gray-100 relative">
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    <span className={`absolute top-3 left-3 ${item.isActive === false ? "bg-gray-700" : "bg-[#195B3E]"} text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow`}>
                      {item.category}
                    </span>
                    {item.isActive === false && <span className="absolute top-3 right-3 bg-red-700 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">Nonaktif</span>}
                  </div>
                  <div>
                    <h3 className="font-black text-gray-900 text-base">{item.name}</h3>
                    <p className="text-xs text-gray-500 line-clamp-2 mt-1">{item.description}</p>
                  </div>
                  <div className="pt-2 border-t border-gray-100 flex justify-between items-center text-xs">
                    <div>
                      <span className="text-[10px] text-gray-400 block font-semibold">Tarif Sewa Harian</span>
                      <span className="font-black text-[#195B3E] text-sm">
                        Rp {item.dailyRate?.toLocaleString("id-ID")}
                      </span>
                    </div>
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-800 rounded-xl font-mono font-bold text-xs">
                      {item.units?.length || 0} Unit Fisik
                    </span>
                  </div>
                  <div className="space-y-2 pt-1">
                    <div className="flex gap-2">
                      <button onClick={() => editEquipment(item)} className="flex-1 rounded-lg border border-gray-200 px-2 py-2 text-[10px] font-bold text-gray-700 hover:bg-gray-50">Edit Data</button>
                      <button onClick={() => addEquipmentUnits(item.id)} className="flex-1 rounded-lg border border-gray-200 px-2 py-2 text-[10px] font-bold text-gray-700 hover:bg-gray-50">+ Tambah Unit</button>
                      <button onClick={() => updateEquipment(item.id, { isActive: item.isActive === false })} className={`flex-1 rounded-lg px-2 py-2 text-[10px] font-bold ${item.isActive === false ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}>{item.isActive === false ? "Aktifkan Alat" : "Nonaktifkan Alat"}</button>
                    </div>
                    {(item.units || []).map((unit: any) => (
                      <div key={unit.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-2.5 py-2 text-[10px]">
                        <span className="font-mono font-bold text-gray-700">{unit.unitCode}</span>
                        <select aria-label={`Status ${unit.unitCode}`} value={unit.conditionStatus} onChange={(e) => updateUnitStatus(unit.id, e.target.value)} className="rounded-md border border-gray-200 bg-white px-1.5 py-1 text-[10px]">
                          <option value="aktif">Aktif</option><option value="perawatan">Perawatan</option><option value="rusak">Rusak</option><option value="nonaktif">Nonaktif</option>
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

      </div>

      {/* Handover Modal */}
      {handoverModalRental && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto overscroll-contain bg-black/60 p-4 backdrop-blur-sm sm:items-center">
          <div className="my-auto max-h-[calc(100dvh-2rem)] w-full max-w-md space-y-4 overflow-y-auto overscroll-contain rounded-3xl bg-white p-5 shadow-2xl sm:p-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-black text-gray-900">Serah Terima Unit Fisik</h3>
                <p className="text-xs text-gray-500">Mencatat kondisi awal sebelum fisik alat dibawa penyewa.</p>
              </div>
              <button onClick={() => setHandoverModalRental(null)} className="p-1 rounded-lg text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100 text-xs space-y-1">
              <span className="block font-bold text-emerald-900">
                {handoverModalRental.unit?.equipment?.name}
              </span>
              <span className="font-mono text-emerald-700 font-bold block">
                Kode Unit: {handoverModalRental.unit?.unitCode}
              </span>
              <span className="text-gray-600 block">Penyewa: {handoverModalRental.user?.name}</span>
            </div>

            <form onSubmit={handleConfirmPickup} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Catatan Kondisi Fisik Awal</label>
                <textarea
                  required
                  rows={3}
                  value={initialCondition}
                  onChange={(e) => setInitialCondition(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-2xl text-xs focus:ring-2 focus:ring-[#195B3E] focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setHandoverModalRental(null)}
                  className="px-4 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-xl text-xs hover:bg-gray-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-purple-700 text-white font-bold rounded-xl text-xs hover:bg-purple-800 shadow"
                >
                  Konfirmasi Serah Terima (Sedang Disewa)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Return Inspection Modal */}
      {returnModalRental && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto overscroll-contain bg-black/60 p-4 backdrop-blur-sm sm:items-center">
          <div className="my-auto max-h-[calc(100dvh-2rem)] w-full max-w-md space-y-4 overflow-y-auto overscroll-contain rounded-3xl bg-white p-5 shadow-2xl sm:p-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-black text-gray-900">Pemeriksaan Pengembalian Alat</h3>
                <p className="text-xs text-gray-500">Cek kondisi fisik akhir & hitung denda jika ada keterlambatan/kerusakan.</p>
              </div>
              <button onClick={() => setReturnModalRental(null)} className="p-1 rounded-lg text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-100 text-xs space-y-1">
              <span className="block font-bold text-amber-900">
                {returnModalRental.unit?.equipment?.name} ({returnModalRental.unit?.unitCode})
              </span>
              <span className="text-gray-600 block">Penyewa: {returnModalRental.user?.name}</span>
            </div>

            <form onSubmit={handleConfirmReturn} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Catatan Kondisi Fisik Akhir</label>
                <textarea
                  required
                  rows={2}
                  value={finalCondition}
                  onChange={(e) => setFinalCondition(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-2xl text-xs focus:ring-2 focus:ring-[#195B3E] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Biaya Kerusakan / Servis (Rp)</label>
                <input
                  type="number"
                  value={damageFeeInput}
                  onChange={(e) => setDamageFeeInput(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl font-bold text-gray-800"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Catatan Tambahan Depot</label>
                <input
                  type="text"
                  placeholder="Catatan kebersihan, oli, atau komponen..."
                  value={adminNotesInput}
                  onChange={(e) => setAdminNotesInput(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-gray-800"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReturnModalRental(null)}
                  className="px-4 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-amber-600 text-white font-bold rounded-xl hover:bg-amber-700 shadow"
                >
                  Simpan Hasil Pemeriksaan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Equipment Modal */}
      {newEquipModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto overscroll-contain bg-black/60 p-4 backdrop-blur-sm sm:items-center">
          <div className="my-auto max-h-[calc(100dvh-2rem)] w-full max-w-md space-y-4 overflow-y-auto overscroll-contain rounded-3xl bg-white p-5 shadow-2xl sm:p-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-black text-gray-900">Tambah Master Alat Baru</h3>
                <p className="text-xs text-gray-500">Mendaftarkan alat dan kode unit fisik baru ke inventaris depot.</p>
              </div>
              <button onClick={() => setNewEquipModalOpen(false)} className="p-1 rounded-lg text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddEquipment} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Nama Alat Pertanian</label>
                <input
                  type="text"
                  required
                  value={newEquipName}
                  onChange={(e) => setNewEquipName(e.target.value)}
                  placeholder="Contoh: Traktor Quick Boxer 8.5 HP"
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Kategori</label>
                  <select
                    value={newEquipCat}
                    onChange={(e) => setNewEquipCat(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl font-semibold"
                  >
                    {equipmentCategories.length > 0 ? (
                      equipmentCategories.map((category: any) => <option key={category.id} value={category.name}>{category.name}</option>)
                    ) : (
                      <>
                        <option value="Traktor">Traktor</option>
                        <option value="Mesin Tanam">Mesin Tanam</option>
                        <option value="Pompa Air">Pompa Air</option>
                        <option value="Panen">Panen</option>
                      </>
                    )}
                  </select>
                  <button type="button" onClick={addEquipmentCategory} className="mt-1 text-[10px] font-bold text-[#195B3E]">+ Tambah kategori</button>
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Tarif Harian (Rp)</label>
                  <input
                    type="number"
                    required
                    value={newEquipRate}
                    onChange={(e) => setNewEquipRate(e.target.value)}
                    placeholder="150000"
                    className="w-full px-3 py-2 border rounded-xl font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Deskripsi & Spesifikasi</label>
                <textarea
                  rows={2}
                  value={newEquipDesc}
                  onChange={(e) => setNewEquipDesc(e.target.value)}
                  placeholder="Kapasitas, efisiensi bahan bakar, kelengkapan..."
                  className="w-full p-2.5 border rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Kode Unit Fisik (Pisahkan Koma)</label>
                <input
                  type="text"
                  value={newEquipUnitCodes}
                  onChange={(e) => setNewEquipUnitCodes(e.target.value)}
                  placeholder="UNT-TKT-001, UNT-TKT-002"
                  className="w-full px-3 py-2 border rounded-xl font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">URL Foto Alat</label>
                <input
                  type="url"
                  value={newEquipImg}
                  onChange={(e) => setNewEquipImg(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 border rounded-xl"
                />
                <label className="mt-2 block font-bold text-gray-700 mb-1">URL Foto Tambahan (Pisahkan Koma, Maksimal 5)</label>
                <textarea
                  rows={2}
                  value={newEquipExtraImgs}
                  onChange={(e) => setNewEquipExtraImgs(e.target.value)}
                  placeholder="https://...foto-samping.jpg, https://...detail-alat.jpg"
                  className="w-full p-2.5 border rounded-xl"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setNewEquipModalOpen(false)}
                  className="px-4 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#195B3E] text-white font-bold rounded-xl hover:bg-[#12432d] shadow"
                >
                  Simpan Master Alat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
