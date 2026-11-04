import Image from "next/image";
import Link from "next/link";
import { Mail } from "lucide-react";
import logo from "../../image/logo.png";

const menuLinks = [
  ["Beranda", "/"],
  ["Katalog Alat", "/#katalog"],
  ["Cara Sewa", "/#cara-sewa"],
  ["Bantuan", "/#bantuan"],
];

const categoryLinks = [
  ["Pengolahan Tanah", "/#katalog"],
  ["Irigasi", "/#katalog"],
  ["Panen & Pascapanen", "/#katalog"],
  ["Perawatan Tanaman", "/#katalog"],
];

export default function Footer() {
  return (
    <footer className="bg-[#205b40] text-[#d1e6c5]">
      <div className="mx-auto grid max-w-[1280px] gap-x-12 gap-y-10 px-6 py-12 sm:px-10 md:grid-cols-[1.35fr_.65fr_.8fr] md:py-14 lg:px-0">
        <div>
          <Link href="/" className="inline-flex items-center gap-3 text-white" aria-label="SewaAlat beranda">
            <span className="relative h-10 w-10 shrink-0 overflow-hidden" aria-hidden="true">
              <Image src={logo} alt="" className="absolute -left-3 -top-2.5 h-16 w-48 max-w-none object-contain" />
            </span>
            <span className="font-display text-[25px] font-semibold tracking-[-0.03em]">SewaAlat</span>
          </Link>
          <p className="mt-5 max-w-[440px] text-[15px] leading-7 text-[#d1e6c5]">
            Platform penyewaan alat pertanian untuk membantu petani mengakses alat yang tepat sesuai kebutuhan musim tanam.
          </p>
          <a href="mailto:layanan@tanisewa.id" className="mt-6 inline-flex items-center gap-2 text-[14px] text-[#d1e6c5] transition hover:text-white">
            <Mail size={17} aria-hidden="true" /> layanan@tanisewa.id
          </a>
        </div>

        <nav aria-label="Menu footer">
          <h2 className="mb-5 text-[15px] font-bold uppercase tracking-wide text-white">Menu</h2>
          <ul className="space-y-3.5 text-[14px]">
            {menuLinks.map(([label, href]) => <li key={label}><Link className="transition hover:text-white" href={href}>{label}</Link></li>)}
          </ul>
        </nav>

        <nav aria-label="Kategori alat">
          <h2 className="mb-5 text-[15px] font-bold uppercase tracking-wide text-white">Kategori</h2>
          <ul className="space-y-3.5 text-[14px]">
            {categoryLinks.map(([label, href]) => <li key={label}><Link className="transition hover:text-white" href={href}>{label}</Link></li>)}
          </ul>
        </nav>

        <div className="col-span-full flex flex-col gap-3 border-t border-white/20 pt-6 text-[12px] text-white/70 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} SewaAlat. Seluruh hak dilindungi.</p>
          <p>Dibuat untuk memajukan pertanian Indonesia</p>
        </div>
      </div>
    </footer>
  );
}
