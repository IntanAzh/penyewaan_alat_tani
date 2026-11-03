import { Sprout, Wheat, Waves, Leaf, ArrowUpRight } from "lucide-react";

const categories = [
  { icon: Sprout, title: "Pengolahan Tanah", description: "Persiapan lahan yang lebih cepat.", count: "32 alat" },
  { icon: Wheat, title: "Panen & Pascapanen", description: "Panen lebih cepat, hasil lebih rapi.", count: "24 alat" },
  { icon: Waves, title: "Irigasi", description: "Air yang tepat, tanaman yang sehat.", count: "38 alat" },
  { icon: Leaf, title: "Perawatan Tanaman", description: "Rawat tanaman dengan lebih ringan.", count: "25 alat" },
];

export default function CategorySection() {
  return (
    <section className="bg-[#fbfaf6] px-6 pb-8 pt-16 sm:px-10 lg:px-0">
      <div className="mx-auto max-w-[1280px]">
        <p className="eyebrow text-[#285b43]">Pilih kebutuhanmu, kami siapkan alat pertaniannya</p>
        <h2 className="font-display mt-3 text-[30px] leading-tight text-[#243b30] sm:text-[34px]">Musim berbeda, alatnya ada.</h2>
        <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map(({ icon: Icon, title, description, count }) => (
            <a key={title} href="#katalog" className="category-card group">
              <Icon size={20} strokeWidth={1.6} className="text-[#285b43]" />
              <h3 className="font-display mt-3 text-[17px] text-[#2d4035]">{title}</h3>
              <p className="mt-1.5 text-[11px] text-[#7b817a]">{description}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-[10px] font-medium text-[#426451]">{count} <ArrowUpRight size={11} /></span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
