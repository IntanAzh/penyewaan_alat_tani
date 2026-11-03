import { ArrowRight } from "lucide-react";

const steps = [
  { number: "01", title: "Temukan alat & daftar", description: "Buka katalog alat pertanian, masuk atau daftar sebagai penyewa." },
  { number: "02", title: "Pilih alat & ajukan", description: "Cek jadwal ketersediaan, isi kebutuhan dan ajukan penyewaan." },
  { number: "03", title: "Admin meninjau pesanan", description: "Admin mengonfirmasi alat, jadwal dan kelengkapan pesanan." },
  { number: "04", title: "Pembayaran", description: "Setelah disetujui, bayar biaya sewa sesuai arahan." },
  { number: "05", title: "Ambil & gunakan alat", description: "Setelah pembayaran berhasil, ambil peralatan di depot." },
  { number: "06", title: "Kembali alat & selesai", description: "Admin memeriksa kondisi alat dan menandai penyewaan selesai." },
];

export default function HowToRent() {
  return (
    <section id="cara-sewa" className="bg-[#fbfaf6] px-6 py-14 sm:px-10 lg:px-0">
      <div className="mx-auto max-w-[1280px]">
        <p className="eyebrow text-[#426451]">Dari tanam sampai panen</p>
        <h2 className="font-display mt-3 text-[30px] leading-tight text-[#243b30] sm:text-[34px]">Langkah jelas. Musim tenang.</h2>
        <p className="mt-2 text-[11px] text-[#7b817a]">Pembayaran simulasi hanya tersedia setelah pesanan alat pertanian dikonfirmasi admin.</p>
        <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {steps.map((step) => (
            <article key={step.number} className="step-card">
              <span className="font-display text-[23px] leading-none text-[#50675a]">{step.number}</span>
              <h3 className="font-display mt-4 text-[15px] leading-[1.15] text-[#35483b]">{step.title}</h3>
              <p className="mt-3 text-[9px] leading-[1.45] text-[#858a82]">{step.description}</p>
            </article>
          ))}
        </div>
        <a href="#katalog" className="mt-6 inline-flex items-center gap-2 text-[10px] font-medium text-[#285b43]">Mulai dari katalog <ArrowRight size={13} /></a>
      </div>
    </section>
  );
}
