import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSessionUser } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const { response } = await requireSessionUser("admin");
    if (response) return response;
    const rentals = await prisma.rental.findMany({
      include: {
        user: true,
        unit: { include: { equipment: true } },
        payment: true,
        returnRecord: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // CSV Header Columns
    const headers = [
      "Kode Pesanan",
      "Kode Unit Fisik",
      "Nama Alat",
      "Nama Penyewa",
      "Email Penyewa",
      "Telepon Penyewa",
      "Tanggal Mulai",
      "Tanggal Jatuh Tempo",
      "Pengembalian Aktual",
      "Durasi (Hari)",
      "Tarif Harian (Rp)",
      "Biaya Sewa Pokok (Rp)",
      "Biaya Denda (Rp)",
      "Total Tagihan (Rp)",
      "Status Penyewaan",
      "Status Pembayaran",
      "Kondisi Awal Penyerahan",
      "Kondisi Akhir Pengembalian",
      "Catatan Pemeriksaan Admin",
    ];

    const rows = rentals.map((r) => {
      const startDate = new Date(r.startDate).toISOString().slice(0, 10);
      const endDate = new Date(r.endDate).toISOString().slice(0, 10);
      const actualReturn = r.returnRecord?.actualReturnDate
        ? new Date(r.returnRecord.actualReturnDate).toISOString().slice(0, 16).replace("T", " ")
        : "-";
      
      const fineAmount = r.returnRecord?.totalFine || 0;
      const totalInvoice = r.totalRentalFee + fineAmount;

      return [
        `"${r.orderCode}"`,
        `"${r.unit.unitCode}"`,
        `"${r.unit.equipment.name}"`,
        `"${r.user.name}"`,
        `"${r.user.email}"`,
        `"${r.user.phone}"`,
        `"${startDate}"`,
        `"${endDate}"`,
        `"${actualReturn}"`,
        r.durationDays,
        r.dailyRate,
        r.totalRentalFee,
        fineAmount,
        totalInvoice,
        `"${r.rentalStatus}"`,
        `"${r.payment?.paymentStatus || "belum_dibayar"}"`,
        `"${(r.returnRecord?.initialConditionNotes || "Kondisi fisik prima").replace(/"/g, '""')}"`,
        `"${(r.returnRecord?.finalConditionNotes || "-").replace(/"/g, '""')}"`,
        `"${(r.returnRecord?.adminNotes || "-").replace(/"/g, '""')}"`,
      ].join(",");
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\n"); // Add UTF-8 BOM for Excel

    return new Response(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="Laporan_Penyewaan_TaniSewa_${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    console.error("Export CSV Error:", error);
    return NextResponse.json({ error: "Gagal mengekspor laporan CSV" }, { status: 500 });
  }
}



