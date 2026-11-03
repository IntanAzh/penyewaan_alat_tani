import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/** Expires approved orders whose 24-hour payment window has elapsed. */
export async function expireOverduePayments(now = new Date()): Promise<number> {
  const overdue = await prisma.rental.findMany({
    where: {
      rentalStatus: "menunggu_pembayaran",
      exceptionStatus: null,
      payment: { is: { paymentDeadline: { lte: now }, paymentStatus: { not: "berhasil" } } },
    },
    select: { id: true },
    take: 200,
  });

  let expiredCount = 0;
  for (const { id } of overdue) {
    const didExpire = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw<Array<{ id: string }>>`SELECT id FROM Rental WHERE id = ${id} FOR UPDATE`;
      const rental = await tx.rental.findUnique({ where: { id }, include: { payment: true } });
      if (!rental || rental.rentalStatus !== "menunggu_pembayaran" || rental.payment?.paymentStatus === "berhasil" || !rental.payment?.paymentDeadline || rental.payment.paymentDeadline > now) return false;

      const changed = await tx.rental.updateMany({
        where: { id, rentalStatus: "menunggu_pembayaran", exceptionStatus: null },
        data: { rentalStatus: "kedaluwarsa", exceptionStatus: "kedaluwarsa" },
      });
      if (changed.count !== 1) return false;
      await tx.payment.updateMany({ where: { rentalId: id, paymentStatus: { not: "berhasil" } }, data: { paymentStatus: "kedaluwarsa", gatewayStatus: "local_deadline_expired" } });
      await tx.rentalStatusHistory.create({ data: { rentalId: id, fromStatus: "menunggu_pembayaran", toStatus: "kedaluwarsa", reason: "Batas pembayaran 24 jam telah berakhir." } });
      return true;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted, timeout: 5_000 });
    if (didExpire) expiredCount += 1;
  }
  return expiredCount;
}
