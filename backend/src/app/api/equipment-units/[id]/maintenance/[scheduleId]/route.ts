import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSessionUser } from "@/lib/auth";

type Context = { params: { id: string; scheduleId: string } | Promise<{ id: string; scheduleId: string }> };

export async function PATCH(req: Request, context: Context) {
  const { response } = await requireSessionUser("admin");
  if (response) return response;
  const { id, scheduleId } = await context.params;
  let body: { status?: unknown };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Data perubahan tidak valid." }, { status: 400 }); }
  if (body.status !== "selesai" && body.status !== "dibatalkan") return NextResponse.json({ error: "Status hanya dapat diubah menjadi selesai atau dibatalkan." }, { status: 400 });
  const result = await prisma.maintenanceSchedule.updateMany({ where: { id: scheduleId, unitId: id, status: "terjadwal" }, data: { status: body.status } });
  if (result.count !== 1) return NextResponse.json({ error: "Jadwal tidak ditemukan atau sudah diproses." }, { status: 409 });
  const schedule = await prisma.maintenanceSchedule.findUnique({ where: { id: scheduleId } });
  return NextResponse.json(schedule);
}
