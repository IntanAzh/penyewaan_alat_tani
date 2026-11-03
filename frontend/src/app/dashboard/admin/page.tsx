"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { 
  Tractor, Download, CheckCircle2, XCircle, Clock, PackageCheck, 
  AlertTriangle, DollarSign, ArrowLeft, RefreshCw, Plus, FileSpreadsheet, X
} from "lucide-react";

export default function AdminDashboard() {
  const { user, isAuthLoading } = useAuth();
  const [rentals, setRentals] = useState<any[]>([]);
  const [equipments, setEquipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"transaksi" | "katalog">("transaksi");

  // Modals
  const [handoverModalRental, setHandoverModalRental] = useState<any | null>(null);
  const [initialCondition, setInitialCondition] = useState("Kondisi fisik prima, bahan bakar penuh, komponen lengkap.");

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
  const [newEquipUnitCodes, setNewEquipUnitCodes] = useState("");

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const resRent = await fetch("/api/rentals?role=admin");
      const dataRent = await resRent.json();
      if (resRent.ok) setRentals(dataRent);

      const resEq = await fetch("/api/equipments");
      const dataEq = await resEq.json();
      if (resEq.ok) setEquipments(dataEq);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleApprove = async (rentalId: string, action: "approve" | "reject") => {
    const rejectReason = action === "reject" ? prompt("Masukkan alasan penolakan:") : undefined;
    if (action === "reject" && !rejectReason) return;

    try {
      const res = await fetch(`/api/rentals/${rentalId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, rejectReason }),
      });
      if (res.ok) {
        fetchAdminData();
      }
    } catch (err: any) {
      alert(err.message);
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
      const res = await fetch("/api/equipments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newEquipName,
          category: newEquipCat,
          dailyRate: newEquipRate,
          description: newEquipDesc,
          imageUrl: newEquipImg || "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=800&q=80",
          unitCodes: codes.length > 0 ? codes : [`UNT-${newEquipName.slice(0, 3).toUpperCase()}-001`],
        }),
      });
      if (res.ok) {
        setNewEquipModalOpen(false);
        fetchAdminData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Stats
  const totalOrders = rentals.length;
  const activeRentals = rentals.filter((r) => r.rentalStatus === "sedang_disewa").length;
  const pendingApprovals = rentals.filter((r) => r.rentalStatus === "menunggu_persetujuan").length;
  const totalRevenue = rentals
    .filter((r) => r.payment?.paymentStatus === "berhasil")
    .reduce((sum, r) => sum + r.totalRentalFee, 0);

  if (isAuthLoading) {
    return <div className="max-w-4xl mx-auto py-20 px-4 text-center text-sm text-gray-600">Memeriksa sesi...</div>;
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="max-w-4xl mx-auto py-20 px-4 text-center">
        <p className="text-lg font-bold text-red-600">Akses Terbatas. Halaman ini khusus untuk Pengelola Depot (Admin).</p>
        <Link href="/" className="mt-4 inline-block px-6 py-2.5 bg-[#195B3E] text-white font-bold rounded-xl">
          Kembali ke Beranda
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF5E9] py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Title & Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-8 border-b border-[#195B3E]/10 gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold text-[#195B3E] mb-1">
              <Link href="/" className="hover:underline flex items-center">
                <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Beranda
              </Link>
              <span>/</span>
              <span>Dashboard Admin</span>
            </div>
            <h1 className="text-3xl font-black text-gray-900">Dashboard Pengelola Depot (Admin)</h1>
            <p className="text-xs text-gray-600">Manajemen Inventaris Alat, Persetujuan Pesanan, Verifikasi Pengembalian & Laporan CSV</p>
          </div>

          <div className="flex items-center space-x-3">
            <a
              href="/api/reports/export"
              target="_blank"
              rel="noreferrer"
              className="flex items-center space-x-2 px-4 py-2.5 bg-[#195B3E] text-white rounded-xl text-xs font-bold hover:bg-[#12432d] shadow transition-all"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Unduh Laporan CSV</span>
            </a>
            <button
              onClick={() => setNewEquipModalOpen(true)}
              className="flex items-center space-x-2 px-4 py-2.5 bg-emerald-700 text-white rounded-xl text-xs font-bold hover:bg-emerald-800 shadow transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Alat Baru</span>
            </button>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-1">
            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Total Pesanan</span>
            <div className="text-3xl font-black text-gray-900">{totalOrders}</div>
            <p className="text-[11px] text-gray-500">Semua riwayat pemesanan masuk</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-1">
            <span className="text-xs text-amber-700 font-bold uppercase tracking-wider">Menunggu Persetujuan</span>
            <div className="text-3xl font-black text-amber-600">{pendingApprovals}</div>
            <p className="text-[11px] text-gray-500">Perlu tinjauan admin</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-1">
            <span className="text-xs text-purple-700 font-bold uppercase tracking-wider">Sedang Disewa</span>
            <div className="text-3xl font-black text-purple-600">{activeRentals}</div>
            <p className="text-[11px] text-gray-500">Unit fisik sedang di tangan penyewa</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-1">
            <span className="text-xs text-[#195B3E] font-bold uppercase tracking-wider">Total Penerimaan Sewa</span>
            <div className="text-2xl font-black text-[#195B3E]">
              Rp {totalRevenue.toLocaleString("id-ID")}
            </div>
            <p className="text-[11px] text-gray-500">Pembayaran terverifikasi lunas</p>
          </div>
        </div>

        {/* Tabs & Table Section */}
        <div className="mt-10">
          <div className="flex border-b border-gray-300 space-x-4 mb-6">
            <button
              onClick={() => setActiveTab("transaksi")}
              className={`pb-3 text-sm font-bold border-b-2 transition-all ${
                activeTab === "transaksi"
                  ? "border-[#195B3E] text-[#195B3E]"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              Manajemen Transaksi Penyewaan ({rentals.length})
            </button>
            <button
              onClick={() => setActiveTab("katalog")}
              className={`pb-3 text-sm font-bold border-b-2 transition-all ${
                activeTab === "katalog"
                  ? "border-[#195B3E] text-[#195B3E]"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              Master Inventaris Alat ({equipments.length})
            </button>
          </div>

          {activeTab === "transaksi" ? (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF5E9] text-[#195B3E] uppercase font-bold text-[11px] border-b border-gray-200">
                  <tr>
                    <th className="p-4">Kode Transaksi</th>
                    <th className="p-4">Penyewa</th>
                    <th className="p-4">Alat & Kode Unit</th>
                    <th className="p-4">Jadwal Sewa</th>
                    <th className="p-4">Total Biaya</th>
                    <th className="p-4">Status Transaksi</th>
                    <th className="p-4 text-center">Aksi Operasional</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rentals.map((r) => {
                    const isPendingApprove = r.rentalStatus === "menunggu_persetujuan";
                    const isPaidForHandover = r.rentalStatus === "menunggu_pembayaran" && r.payment?.paymentStatus === "berhasil";
                    const isRentedActive = r.rentalStatus === "sedang_disewa";
                    const isInspecting = r.rentalStatus === "pemeriksaan_pengembalian";

                    return (
                      <tr key={r.id} className="hover:bg-gray-50">
                        <td className="p-4 font-mono font-bold text-gray-900">{r.orderCode}</td>
                        <td className="p-4">
                          <span className="font-bold block text-gray-900">{r.user.name}</span>
                          <span className="text-gray-500">{r.user.phone}</span>
                        </td>
                        <td className="p-4">
                          <span className="font-bold text-gray-800 block">{r.unit.equipment.name}</span>
                          <span className="font-mono text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                            {r.unit.unitCode}
                          </span>
                        </td>
                        <td className="p-4">
                          <span>
                            {new Date(r.startDate).toLocaleDateString("id-ID")} - {new Date(r.endDate).toLocaleDateString("id-ID")}
                          </span>
                          <span className="block text-gray-400">{r.durationDays} Hari</span>
                        </td>
                        <td className="p-4 font-black text-[#195B3E]">
                          Rp {r.totalRentalFee.toLocaleString("id-ID")}
                        </td>
                        <td className="p-4">
                          <span className="font-semibold uppercase text-[10px] px-2.5 py-1 rounded-full bg-gray-100 text-gray-800 border">
                            {r.rentalStatus}
                          </span>
                          <span className="block text-[10px] text-gray-500 mt-1">
                            Bayar: {r.payment?.paymentStatus || "belum"}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            {/* 1. Persetujuan */}
                            {isPendingApprove && (
                              <>
                                <button
                                  onClick={() => handleApprove(r.id, "approve")}
                                  className="px-3 py-1 bg-emerald-600 text-white rounded font-bold hover:bg-emerald-700"
                                >
                                  Setujui
                                </button>
                                <button
                                  onClick={() => handleApprove(r.id, "reject")}
                                  className="px-3 py-1 bg-red-600 text-white rounded font-bold hover:bg-red-700"
                                >
                                  Tolak
                                </button>
                              </>
                            )}

                            {/* 2. Handover Penyerahan */}
                            {isPaidForHandover && (
                              <button
                                onClick={() => setHandoverModalRental(r)}
                                className="px-3 py-1 bg-purple-700 text-white rounded font-bold hover:bg-purple-800"
                              >
                                Serah Terima Unit
                              </button>
                            )}

                            {/* 3. Pengembalian Inspeksi */}
                            {isRentedActive && (
                              <button
                                onClick={() => setReturnModalRental(r)}
                                className="px-3 py-1 bg-amber-600 text-white rounded font-bold hover:bg-amber-700"
                              >
                                Process Return
                              </button>
                            )}

                            {/* 4. Lunasi Denda */}
                            {isInspecting && r.returnRecord?.finePaymentStatus !== "lunas" && (
                              <button
                                onClick={() => handlePayFine(r.id)}
                                className="px-3 py-1 bg-blue-600 text-white rounded font-bold hover:bg-blue-700"
                              >
                                Lunasi Denda (Rp {r.returnRecord?.totalFine?.toLocaleString("id-ID")})
                              </button>
                            )}

                            {r.rentalStatus === "selesai" && (
                              <span className="text-gray-400 font-bold">✔ Selesai</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {equipments.map((item) => (
                <div key={item.id} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-3">
                  <div className="h-40 overflow-hidden rounded-xl bg-gray-100">
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <h3 className="font-black text-gray-900 text-base">{item.name}</h3>
                  <p className="text-xs text-gray-500">{item.description}</p>
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-[#195B3E]">Rp {item.dailyRate.toLocaleString("id-ID")} / hari</span>
                    <span className="px-2 py-0.5 bg-gray-100 rounded text-gray-700 font-mono">
                      {item.units.length} Unit Fisik
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Handover Modal */}
      {handoverModalRental && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl p-6 space-y-4">
            <h3 className="text-lg font-black text-gray-900">Serah Terima Unit Fisik Alat</h3>
            <p className="text-xs text-gray-600">
              Mencatat kondisi fisik awal unit <span className="font-mono font-bold text-[#195B3E]">{handoverModalRental.unit.unitCode}</span> sebelum dibawa oleh penyewa.
            </p>

            <form onSubmit={handleConfirmPickup} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Catatan Kondisi Fisik Awal</label>
                <textarea
                  required
                  rows={3}
                  value={initialCondition}
                  onChange={(e) => setInitialCondition(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-[#195B3E]"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setHandoverModalRental(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 font-bold rounded-xl text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-purple-700 text-white font-bold rounded-xl text-xs hover:bg-purple-800"
                >
                  Konfirmasi Penyerahan (Sedang Disewa)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Return Inspection Modal */}
      {returnModalRental && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl p-6 space-y-4">
            <h3 className="text-lg font-black text-gray-900">Form Pemeriksaan Pengembalian Alat</h3>
            <p className="text-xs text-gray-600">
              Input catatan fisik akhir dan hitung biaya keterlambatan / kerusakan untuk unit <span className="font-mono font-bold text-[#195B3E]">{returnModalRental.unit.unitCode}</span>.
            </p>

            <form onSubmit={handleConfirmReturn} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Catatan Kondisi Akhir Pengembalian</label>
                <textarea
                  required
                  rows={2}
                  value={finalCondition}
                  onChange={(e) => setFinalCondition(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-[#195B3E]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Biaya Ganti Kerusakan / Komponen (Rp)</label>
                <input
                  type="number"
                  value={damageFeeInput}
                  onChange={(e) => setDamageFeeInput(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs font-bold text-gray-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Catatan Tambahan Admin</label>
                <input
                  type="text"
                  placeholder="Catatan servis/denda..."
                  value={adminNotesInput}
                  onChange={(e) => setAdminNotesInput(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs text-gray-800"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setReturnModalRental(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 font-bold rounded-xl text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-amber-600 text-white font-bold rounded-xl text-xs hover:bg-amber-700"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl p-6 space-y-4">
            <h3 className="text-lg font-black text-gray-900">Tambah Master Alat Tani Baru</h3>

            <form onSubmit={handleAddEquipment} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Nama Alat</label>
                <input
                  type="text"
                  required
                  value={newEquipName}
                  onChange={(e) => setNewEquipName(e.target.value)}
                  placeholder="Contoh: Mesin Spray Pestisida 50L"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Kategori</label>
                  <select
                    value={newEquipCat}
                    onChange={(e) => setNewEquipCat(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="Traktor">Traktor</option>
                    <option value="Mesin Tanam">Mesin Tanam</option>
                    <option value="Pompa Air">Pompa Air</option>
                    <option value="Panen">Panen</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Tarif Harian (Rp)</label>
                  <input
                    type="number"
                    required
                    value={newEquipRate}
                    onChange={(e) => setNewEquipRate(e.target.value)}
                    placeholder="150000"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Deskripsi Ringkas</label>
                <textarea
                  rows={2}
                  value={newEquipDesc}
                  onChange={(e) => setNewEquipDesc(e.target.value)}
                  className="w-full p-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Kode Unit Fisik (Pisahkan Koma)</label>
                <input
                  type="text"
                  value={newEquipUnitCodes}
                  onChange={(e) => setNewEquipUnitCodes(e.target.value)}
                  placeholder="UNT-[#1]-001, UNT-[#1]-002"
                  className="w-full px-3 py-2 border rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">URL Foto Alat</label>
                <input
                  type="url"
                  value={newEquipImg}
                  onChange={(e) => setNewEquipImg(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setNewEquipModalOpen(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 font-bold rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#195B3E] text-white font-bold rounded-lg hover:bg-[#12432d]"
                >
                  Simpan Alat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

