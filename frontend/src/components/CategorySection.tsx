import Image from "next/image";
import pengolahanTanah from "../../image/pengolahan_tanah.png";
import panenPascapanen from "../../image/panen_pascapanen.png";
import irigasi from "../../image/irigasi.png";
import perawatanTanaman from "../../image/perawatan_tanaman.png";
import { ArrowUpRight } from "lucide-react";

const categories = [
  { image: pengolahanTanah, title: "Pengolahan Tanah", description: "Persiapan lahan yang lebih cepat.", count: "32 alat" },
  { image: panenPascapanen, title: "Panen & Pascapanen", description: "Panen lebih cepat, hasil lebih rapi.", count: "24 alat" },
  { image: irigasi, title: "Irigasi", description: "Air yang tepat, tanaman yang sehat.", count: "38 alat" },
  { image: perawatanTanaman, title: "Perawatan Tanaman", description: "Rawat tanaman dengan lebih ringan.", count: "25 alat" },
];

export default function CategorySection() {
  return (
    <section className="bg-[#fbfaf6] px-6 pb-8 pt-16 sm:px-10 lg:px-0">
      <div className="mx-auto max-w-[1280px]">
        <p className="eyebrow text-[#285b43]">Pilih kebutuhanmu, kami siapkan alat pertaniannya</p>
        <h2 className="font-display mt-3 text-[30px] leading-tight text-[#243b30] sm:text-[34px]">Musim berbeda, alatnya ada.</h2>
        <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map(({ image, title, description, count }) => (
            <a key={title} href="#katalog" className="category-card group">
              <Image src={image} alt="" className="h-7 w-7 object-contain" />
              <h3 className="font-display mt-3 text-[19px] text-[#2d4035]">{title}</h3>
              <p className="mt-1.5 text-[13px] text-[#68766d]">{description}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-[12px] font-medium text-[#426451]">{count} <ArrowUpRight size={13} /></span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
