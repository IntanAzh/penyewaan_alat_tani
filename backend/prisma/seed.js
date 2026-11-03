const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { hashPassword } = require("./password");


async function main() {
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  const demoPassword = process.env.SEED_DEMO_USER_PASSWORD;
  if (!adminPassword || adminPassword.length < 8 || !demoPassword || demoPassword.length < 8) {
    throw new Error("Set SEED_ADMIN_PASSWORD and SEED_DEMO_USER_PASSWORD to values of at least 8 characters before seeding.");
  }

  console.log('Seeding TaniSewa Database...');

  // 1. Clean Database
  await prisma.returnRecord.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.rental.deleteMany({});
  await prisma.equipmentUnit.deleteMany({});
  await prisma.equipment.deleteMany({});
  await prisma.user.deleteMany({});

  // 2. Create Users
  const admin = await prisma.user.create({
    data: {
      name: 'Admin Utama Depot TaniSewa',
      email: 'admin@tanisewa.id',
      phone: '081299887766',
      password: await hashPassword(adminPassword),
      role: 'admin',
    },
  });

  const budi = await prisma.user.create({
    data: {
      name: 'Budi Santoso',
      email: 'budi@gmail.com',
      phone: '081234567890',
      password: await hashPassword(demoPassword),
      role: 'penyewa',
    },
  });

  const siti = await prisma.user.create({
    data: {
      name: 'Siti Rahmawati',
      email: 'siti@gmail.com',
      phone: '085711223344',
      password: await hashPassword(demoPassword),
      role: 'penyewa',
    },
  });

  // 3. Create Equipments & Physical Units
  const eqTraktor = await prisma.equipment.create({
    data: {
      name: 'Traktor Roda 4 Kubota M9540',
      category: 'Traktor',
      dailyRate: 450000,
      description: 'Traktor pembajak sawah 4WD 95 HP cocok untuk lahan luas, dilengkapi pisau bajak rotari standar industri.',
      imageUrl: 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=800&q=80',
      units: {
        create: [
          { unitCode: 'UNT-TKT-001', conditionStatus: 'aktif', notes: 'Kondisi oli baru, pisau bajak tajam' },
          { unitCode: 'UNT-TKT-002', conditionStatus: 'aktif', notes: 'Bahan bakar penuh, mesin halus' },
          { unitCode: 'UNT-TKT-003', conditionStatus: 'perawatan', notes: 'Servis transmisi berkala' },
        ],
      },
    },
    include: { units: true },
  });

  const eqTransplanter = await prisma.equipment.create({
    data: {
      name: 'Mesin Tanam Padi Yanmar VP6',
      category: 'Mesin Tanam',
      dailyRate: 280000,
      description: 'Mesin penanam bibit padi otomatis 6 baris efisien, mempercepat proses tanam hingga 5x lipat dibanding manual.',
      imageUrl: 'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?auto=format&fit=crop&w=800&q=80',
      units: {
        create: [
          { unitCode: 'UNT-MTP-001', conditionStatus: 'aktif', notes: 'Siap pakai di area berlumpur' },
          { unitCode: 'UNT-MTP-002', conditionStatus: 'aktif', notes: 'Sistem hidrolik berfungsi baik' },
        ],
      },
    },
    include: { units: true },
  });

  const eqPompa = await prisma.equipment.create({
    data: {
      name: 'Pompa Air Diesel Honda 3 Inch',
      category: 'Pompa Air',
      dailyRate: 95000,
      description: 'Pompa irigasi pertanian tekanan tinggi debit air 1.000 liter/menit, hemat bahan bakar solar/diesel.',
      imageUrl: 'https://images.unsplash.com/photo-1615811361523-6bd03d7748e7?auto=format&fit=crop&w=800&q=80',
      units: {
        create: [
          { unitCode: 'UNT-PMP-001', conditionStatus: 'aktif', notes: 'Dilengkapi selang spiral 10 meter' },
          { unitCode: 'UNT-PMP-002', conditionStatus: 'aktif', notes: 'Mesin siap operasional' },
          { unitCode: 'UNT-PMP-003', conditionStatus: 'aktif', notes: 'Filter air terpasang' },
        ],
      },
    },
    include: { units: true },
  });

  const eqHarvester = await prisma.equipment.create({
    data: {
      name: 'Combine Harvester Kubota DC-70 Plus',
      category: 'Panen',
      dailyRate: 650000,
      description: 'Mesin pemanen dan pengering gabah sekaligus, memotong, merontokkan, dan membersihkan bulir padi secara serentak.',
      imageUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80',
      units: {
        create: [
          { unitCode: 'UNT-HVS-001', conditionStatus: 'aktif', notes: 'Kondisi pisau pemotong prima' },
        ],
      },
    },
    include: { units: true },
  });

  const eqCultivator = await prisma.equipment.create({
    data: {
      name: 'Cultivator Traktor Tangan Quick C3000',
      category: 'Traktor',
      dailyRate: 175000,
      description: 'Traktor tangan pencacah tanah dan pembuatan bedengan kebun hortikultura, lincah di lahan sempit.',
      imageUrl: 'https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&w=800&q=80',
      units: {
        create: [
          { unitCode: 'UNT-CLT-001', conditionStatus: 'aktif', notes: 'Roda karet dan roda besi lengkap' },
          { unitCode: 'UNT-CLT-002', conditionStatus: 'aktif', notes: 'Kondisi mesin sangat baik' },
        ],
      },
    },
    include: { units: true },
  });

  // 4. Create Sample Rentals & Payments
  // Rental 1: Budi Santoso - Traktor (Siap Diambil & Pembayaran Berhasil)
  const rental1 = await prisma.rental.create({
    data: {
      orderCode: 'ORD-20261001-001',
      userId: budi.id,
      unitId: eqTraktor.units[0].id,
      startDate: new Date('2026-10-05T00:00:00.000Z'),
      endDate: new Date('2026-10-07T00:00:00.000Z'),
      durationDays: 2,
      dailyRate: 450000,
      totalRentalFee: 900000,
      rentalStatus: 'siap_diambil',
      payment: {
        create: {
          snapToken: 'SNAP-TEST-TOKEN-001',
          amount: 900000,
          paymentStatus: 'berhasil',
          paymentMethod: 'Bank Transfer (BCA)',
          paidAt: new Date('2026-10-01T14:20:00.000Z'),
        },
      },
    },
  });

  // Rental 2: Siti Rahmawati - Mesin Tanam (Menunggu Persetujuan Admin)
  const rental2 = await prisma.rental.create({
    data: {
      orderCode: 'ORD-20261002-002',
      userId: siti.id,
      unitId: eqTransplanter.units[0].id,
      startDate: new Date('2026-10-04T00:00:00.000Z'),
      endDate: new Date('2026-10-05T00:00:00.000Z'),
      durationDays: 1,
      dailyRate: 280000,
      totalRentalFee: 280000,
      rentalStatus: 'menunggu_persetujuan',
      payment: {
        create: {
          amount: 280000,
          paymentStatus: 'belum_dibayar',
        },
      },
    },
  });

  // Rental 3: Budi Santoso - Pompa Air (Selesai & Ada Return Record)
  const rental3 = await prisma.rental.create({
    data: {
      orderCode: 'ORD-20260925-003',
      userId: budi.id,
      unitId: eqPompa.units[0].id,
      startDate: new Date('2026-09-26T00:00:00.000Z'),
      endDate: new Date('2026-09-28T00:00:00.000Z'),
      durationDays: 2,
      dailyRate: 95000,
      totalRentalFee: 190000,
      rentalStatus: 'selesai',
      payment: {
        create: {
          snapToken: 'SNAP-TEST-TOKEN-003',
          amount: 190000,
          paymentStatus: 'berhasil',
          paymentMethod: 'QRIS',
          paidAt: new Date('2026-09-25T10:15:00.000Z'),
        },
      },
      returnRecord: {
        create: {
          actualReturnDate: new Date('2026-09-28T16:00:00.000Z'),
          lateDays: 0,
          lateFee: 0,
          damageFee: 0,
          totalFine: 0,
          finePaymentStatus: 'lunas',
          initialConditionNotes: 'Unit mulus, selang 10m lengkap, oli baru.',
          finalConditionNotes: 'Kembali bersih, selang lengkap, mesin berjalan normal.',
          adminNotes: 'Transaksi selesai tanpa denda.',
        },
      },
    },
  });

  console.log('Seeding completed successfully!');
  console.log('Admin Account: admin@tanisewa.id / admin123');
  console.log('User Account: budi@gmail.com / user123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });



