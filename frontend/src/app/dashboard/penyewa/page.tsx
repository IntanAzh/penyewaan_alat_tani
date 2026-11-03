"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { 
  Tractor, Calendar, CreditCard, Clock, CheckCircle2, 
  AlertCircle, ChevronRight, FileText, ArrowLeft, RefreshCw, X
} from "lucide-react";

declare global {
  interface Window {
    snap?: any;
  }
}

export default function PenyewaDashboard() {
  const { user, isAuthLoading } = useAuth();
  const [rentals, setRentals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [payLoading, setPayLoading] = useState<string | null>(null);
  const [selectedRental, setSelectedRental] = useState<any | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchRentals = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/rentals?userId=${user.id}&role=penyewa`);
      const data = await res.json();
      if (res.ok) setRentals(data);
    } catch (error) {
      console.error("Error fetching rentals", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRentals();
  }, [user]);

  // Trigger Midtrans Snap Sandbox Checkout
  const handlePaySnap = async (rental: any) => {
    setPayLoading(rental.id);
    try {
      const res = await fetch("/api/payments/snap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rentalId: rental.id }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Gagal membuat token pembayaran");

      if (window.snap && data.snapToken && !data.snapToken.startsWith("DEMO-SNAP")) {
        // Open Midtrans Snap Popup Widget
        window.snap.pay(data.snapToken, {
          onSuccess: function (result: any) {
            setToastMessage("Pembayaran Berhasil via Midtrans Snap!");
            fetchRentals();
          },
          onPending: function (result: any) {
            setToastMessage("Menunggu Pembayaran...");
            fetchRentals();
          },
          onError: function (result: any) {
            setToastMessage("Pembayaran Gagal.");
            fetchRentals();
          },
          onClose: function () {
            fetchRentals();
          },
        });
      } else {
        // Fallback for Sandbox Simulation mode
        const simRes = await fetch("/api/payments/snap", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rentalId: rental.id, paymentMethod: "Midtrans Snap Sandbox QRIS" }),
        });
        const simData = await simRes.json();
        if (simRes.ok) {
          setToastMessage("Simulasi Pembayaran Berhasil! Status berubah menjadi SIAP DIAMBIL.");
          fetchRentals();
        }
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setPayLoading(null);
    }
  };

  const getStatusBadge = (r: any) => {
    const status = r.rentalStatus;
    const payStatus = r.payment?.paymentStatus;

    if (status === "menunggu_persetujuan") {
      return <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full">Menunggu Persetujuan Admin</span>;
    }
    if (status === "menunggu_pembayaran") {
      return <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-full">Disetujui — Menunggu Pembayaran</span>;
    }
    if (status === "siap_diambil") {
      return <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">Lunas — Siap Diambil di Depot</span>;
    }
    if (status === "sedang_disewa") {
      return <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs font-bold rounded-full">Sedang Disewa (Aktif)</span>;
    }
    if (status === "pemeriksaan_pengembalian") {
      return <span className="px-3 py-1 bg-orange-100 text-orange-800 text-xs font-bold rounded-full">Proses Pemeriksaan & Denda</span>;
    }
    if (status === "selesai") {
      return <span className="px-3 py-1 bg-gray-100 text-gray-800 text-xs font-bold rounded-full">Transaksi Selesai</span>;
    }
    if (status === "ditolak") {
      return <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-bold rounded-full">Pesanan Ditolak</span>;
    }
    return <span className="px-3 py-1 bg-gray-100 text-gray-800 text-xs font-bold rounded-full">{status}</span>;
  };

  if (isAuthLoading) {
    return <div className="max-w-4xl mx-auto py-20 px-4 text-center text-sm text-gray-600">Memeriksa sesi...</div>;
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-4 text-center">
        <p className="text-lg font-bold text-gray-700">Silakan login untuk mengakses Dashboard Penyewa.</p>
        <Link href="/" className="mt-4 inline-block px-6 py-2.5 bg-[#195B3E] text-white font-bold rounded-xl">
          Kembali ke Beranda
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF5E9] py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Title Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-8 border-b border-[#195B3E]/10 gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold text-[#195B3E] mb-1">
              <Link href="/" className="hover:underline flex items-center">
                <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Beranda
              </Link>
              <span>/</span>
              <span>Dashboard Penyewa</span>
            </div>
            <h1 className="text-3xl font-black text-gray-900">Dashboard Penyewa</h1>
            <p className="text-xs text-gray-600">Selamat datang, <span className="font-bold text-[#195B3E]">{user.name}</span> ({user.email})</p>
          </div>

          <button
            onClick={fetchRentals}
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-100 transition-colors shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Muat Ulang Data</span>
          </button>
        </div>

        {/* Toast Notification */}
        {toastMessage && (
          <div className="mt-6 p-4 bg-emerald-700 text-white rounded-xl font-semibold text-sm flex justify-between items-center shadow-lg">
            <span>{toastMessage}</span>
            <button onClick={() => setToastMessage(null)} className="hover:text-gray-200">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Rentals List Section */}
        <div className="mt-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <Tractor className="w-5 h-5 text-[#195B3E] mr-2" />
            Daftar Pesanan & Penyewaan Anda
          </h2>

          {loading ? (
            <div className="text-center py-12 text-gray-500 font-medium">Memuat daftar pesanan...</div>
          ) : rentals.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center border border-gray-200 shadow-sm space-y-3">
              <p className="text-gray-600 font-medium text-sm">Anda belum memiliki riwayat pemesanan alat tani.</p>
              <Link
                href="/#katalog"
                className="inline-block px-6 py-2.5 bg-[#195B3E] text-white font-bold rounded-xl text-xs shadow hover:bg-[#12432d]"
              >
                Jelajahi Katalog Alat Tani
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {rentals.map((r) => {
                const isNeedPayment = r.rentalStatus === "menunggu_pembayaran";
                const isPaid = r.payment?.paymentStatus === "berhasil";

                return (
                  <div
                    key={r.id}
                    className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-gray-100 gap-2">
                      <div>
                        <span className="text-xs font-mono font-bold text-gray-400 block">{r.orderCode}</span>
                        <h3 className="text-lg font-black text-gray-900">{r.unit.equipment.name}</h3>
                        <span className="text-xs font-mono bg-[#e8f5ee] text-[#195B3E] px-2 py-0.5 rounded border border-[#195B3E]/20">
                          Kode Unit Fisik: {r.unit.unitCode}
                        </span>
                      </div>
                      <div>{getStatusBadge(r)}</div>
                    </div>

                    {/* Order Details Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                      <div>
                        <span className="text-gray-400 block font-medium">Jadwal Mulai</span>
                        <span className="font-bold text-gray-800">
                          {new Date(r.startDate).toLocaleDateString("id-ID", { dateStyle: "medium" })}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 block font-medium">Jadwal Pengembalian</span>
                        <span className="font-bold text-gray-800">
                          {new Date(r.endDate).toLocaleDateString("id-ID", { dateStyle: "medium" })}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 block font-medium">Durasi Sewa</span>
                        <span className="font-bold text-gray-800">{r.durationDays} Hari</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block font-medium">Total Biaya Pokok</span>
                        <span className="font-black text-[#195B3E] text-sm">
                          Rp {r.totalRentalFee.toLocaleString("id-ID")}
                        </span>
                      </div>
                    </div>

                    {r.rentalStatus === "ditolak" && r.rejectReason && (
                      <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">
                        <span className="block font-bold">Alasan pesanan ditolak</span>
                        <p className="mt-1">{r.rejectReason}</p>
                      </div>
                    )}

                    {Array.isArray(r.statusHistory) && r.statusHistory.length > 0 && (
                      <details className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-xs">
                        <summary className="cursor-pointer font-bold text-gray-700">Riwayat status pesanan ({r.statusHistory.length})</summary>
                        <ol className="mt-3 space-y-3 border-l border-[#195B3E]/20 pl-4">
                          {r.statusHistory.map((event: any) => (
                            <li key={event.id} className="relative">
                              <span className="absolute -left-[21px] top-1 h-2 w-2 rounded-full bg-[#52815b]" />
                              <p className="font-bold text-gray-800">{event.toStatus.replaceAll("_", " ")}</p>
                              <p className="mt-0.5 text-gray-500">{new Date(event.createdAt).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}{event.actor?.name ? ` · ${event.actor.name}` : ""}</p>
                              {event.reason && <p className="mt-1 text-gray-600">{event.reason}</p>}
                            </li>
                          ))}
                        </ol>
                      </details>
                    )}

                    {/* Fine details if return record exists */}
                    {r.returnRecord && r.returnRecord.totalFine > 0 && (
                      <div className="p-3 bg-red-50 rounded-xl border border-red-200 text-xs space-y-1">
                        <span className="font-bold text-red-800 block">Rincian Denda Pengembalian:</span>
                        <p className="text-red-700">
                          Terlambat: {r.returnRecord.lateDays} hari (Rp {r.returnRecord.lateFee.toLocaleString("id-ID")}) | Biaya Kerusakan: Rp {r.returnRecord.damageFee.toLocaleString("id-ID")}
                        </p>
                        <p className="font-black text-red-900">
                          Total Denda: Rp {r.returnRecord.totalFine.toLocaleString("id-ID")} ({r.returnRecord.finePaymentStatus === "lunas" ? "LUNAS" : "BELUM DIBAYAR"})
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="pt-2 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
                      <button
                        onClick={() => setSelectedRental(r)}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-100 transition-colors flex items-center justify-center space-x-1"
                      >
                        <FileText className="w-4 h-4" />
                        <span>Lihat Bukti Invoice</span>
                      </button>

                      {isNeedPayment && (
                        <button
                          onClick={() => handlePaySnap(r)}
                          disabled={payLoading === r.id}
                          className="px-6 py-2.5 bg-[#195B3E] text-white font-black rounded-xl text-xs hover:bg-[#12432d] shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                        >
                          <CreditCard className="w-4 h-4" />
                          <span>{payLoading === r.id ? "Memproses..." : "Bayar Sekarang (Midtrans Snap)"}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Invoice Modal */}
      {selectedRental && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto overscroll-contain bg-black/60 p-4 backdrop-blur-sm sm:items-center">
          <div className="my-auto max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto overscroll-contain rounded-2xl border border-gray-200 bg-white shadow-2xl">
            <div className="bg-[#195B3E] text-white p-6 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-black">Invoice Bukti Sewa</h3>
                <span className="text-xs text-[#a3d4bd] font-mono">{selectedRental.orderCode}</span>
              </div>
              <button onClick={() => setSelectedRental(null)} className="p-1 text-white/80 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="space-y-1 pb-3 border-b border-gray-200">
                <span className="text-gray-400 font-medium">Penyewa:</span>
                <p className="font-bold text-gray-900">{user.name} ({user.phone})</p>
              </div>

              <div className="space-y-1 pb-3 border-b border-gray-200">
                <span className="text-gray-400 font-medium">Alat Tani:</span>
                <p className="font-bold text-gray-900">{selectedRental.unit.equipment.name}</p>
                <p className="text-gray-500 font-mono">Kode Unit Fisik: {selectedRental.unit.unitCode}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 pb-3 border-b border-gray-200">
                <div>
                  <span className="text-gray-400 block">Jadwal Sewa:</span>
                  <span className="font-bold text-gray-800">
                    {new Date(selectedRental.startDate).toLocaleDateString("id-ID")} - {new Date(selectedRental.endDate).toLocaleDateString("id-ID")}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block">Status Pembayaran:</span>
                  <span className="font-bold uppercase text-[#195B3E]">
                    {selectedRental.payment?.paymentStatus || "belum_dibayar"}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center text-sm font-black text-gray-900">
                <span>Total Sewa Pokok:</span>
                <span className="text-[#195B3E]">Rp {selectedRental.totalRentalFee.toLocaleString("id-ID")}</span>
              </div>

              <div className="pt-4 flex justify-end space-x-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-[#195B3E] text-white font-bold rounded-xl hover:bg-[#12432d]"
                >
                  Cetak Bukti Transaksi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

