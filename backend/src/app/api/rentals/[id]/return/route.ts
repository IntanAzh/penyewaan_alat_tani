import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSessionUser } from "@/lib/auth";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { response } = await requireSessionUser("admin");
    if (response) return response;
    const { finalConditionNotes, damageFee, adminNotes, actualReturnDateStr } = await req.json();

    const rental = await prisma.rental.findUnique({
      where: { id: params.id },
      include: { unit: { include: { equipment: true } } },
    });

    if (!rental) {
      return NextResponse.json({ error: "Pesanan tidak ditemukan" }, { status: 404 });
    }

    const actualDate = actualReturnDateStr ? new Date(actualReturnDateStr) : new Date();
    const expectedEndDate = new Date(rental.endDate);

    // Calculate late days
    let lateDays = 0;
    if (actualDate > expectedEndDate) {
      const diffHours = (actualDate.getTime() - expectedEndDate.getTime()) / (1000 * 60 * 60);
      lateDays = Math.ceil(diffHours / 24);
    }

    const dailyRate = rental.dailyRate;
    const lateFee = lateDays * dailyRate;
    const parsedDamageFee = parseFloat(damageFee || 0);
    const totalFine = lateFee + parsedDamageFee;

    const returnRecord = await prisma.returnRecord.upsert({
      where: { rentalId: params.id },
      create: {
        rentalId: params.id,
        actualReturnDate: actualDate,
        lateDays,
        lateFee,
        damageFee: parsedDamageFee,
        totalFine,
        finePaymentStatus: totalFine > 0 ? "belum_dibayar" : "lunas",
        initialConditionNotes: "Kondisi awal tercatat",
        finalConditionNotes: finalConditionNotes || "Kondisi fisik sesuai",
        adminNotes: adminNotes || "",
      },
      update: {
        actualReturnDate: actualDate,
        lateDays,
        lateFee,
        damageFee: parsedDamageFee,
        totalFine,
        finePaymentStatus: totalFine > 0 ? "belum_dibayar" : "lunas",
        finalConditionNotes: finalConditionNotes || "Kondisi fisik sesuai",
        adminNotes: adminNotes || "",
      },
    });

    // Update rental status
    const newRentalStatus = totalFine > 0 ? "pemeriksaan_pengembalian" : "selesai";

    const updatedRental = await prisma.rental.update({
      where: { id: params.id },
      data: {
        rentalStatus: newRentalStatus,
      },
    });

    return NextResponse.json({
      message: totalFine > 0 
        ? "Pemeriksaan selesai. Terdapat denda yang harus dilunasi." 
        : "Pengembalian berhasil & transaksi SELESAI!",
      returnRecord,
      rental: updatedRental,
    });
  } catch (error) {
    console.error("Return Error:", error);
    return NextResponse.json({ error: "Gagal memproses pengembalian alat" }, { status: 500 });
  }
}

// Endpoint to mark fine as paid by admin
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { response } = await requireSessionUser("admin");
    if (response) return response;
    const returnRecord = await prisma.returnRecord.update({
      where: { rentalId: params.id },
      data: {
        finePaymentStatus: "lunas",
      },
    });

    // Complete rental status
    const updatedRental = await prisma.rental.update({
      where: { id: params.id },
      data: {
        rentalStatus: "selesai",
      },
    });

    return NextResponse.json({
      message: "Denda berhasil dilunasi & transaksi SELESAI!",
      returnRecord,
      rental: updatedRental,
    });
  } catch (error) {
    console.error("Pay Fine Error:", error);
    return NextResponse.json({ error: "Gagal memproses pelunasan denda" }, { status: 500 });
  }
}


