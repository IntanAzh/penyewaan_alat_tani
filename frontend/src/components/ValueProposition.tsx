import { Wallet, Leaf, ShieldCheck } from "lucide-react";

const benefits = [
  { icon: Wallet, title: "Hemat untuk benih dan pupuk", text: "Bayar sesuai hari pemakaian, bukan biaya beli alat." },
  { icon: ShieldCheck, title: "Terawat, bersih, siap tanam", text: "Setiap unit dicek sebelum diserahkan kepada penyewa." },
  { icon: Leaf, title: "Lebih bijak berbagi alat pertanian", text: "Satu alat bisa membantu lebih banyak petani." },
];

export default function ValueProposition() {
  return (
    <section className="bg-[#e9eee5] px-6 py-14 sm:px-10 lg:px-0 lg:py-16">
      <div className="mx-auto grid max-w-[1280px] items-center gap-9 lg:grid-cols-2 lg:gap-14">
        <div className="value-photo" role="img" aria-label="Peralatan pertanian tersimpan rapi dan siap digunakan" />
        <div className="max-w-[520px]">
          <p className="eyebrow text-[#426451]">Lebih banyak hasil, lebih sedikit beban</p>
          <h2 className="font-display mt-4 text-[32px] leading-[1.08] text-[#243b30] sm:text-[38px]">Tidak semua alat pertanian harus jadi milikmu.</h2>
          <p className="mt-4 text-[12px] leading-5 text-[#727a72]">Miliki hasil panennya, bukan biaya menyimpan dan merawat alat pertanian. Kami hadir untuk membantu musim tanammu berjalan lebih ringan.</p>
          <ul className="mt-6 space-y-4">
            {benefits.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-3">
                <Icon size={16} strokeWidth={1.8} className="mt-0.5 shrink-0 text-[#285b43]" />
                <div><h3 className="text-[11px] font-semibold text-[#354a3d]">{title}</h3><p className="mt-1 text-[10px] text-[#7b817a]">{text}</p></div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
