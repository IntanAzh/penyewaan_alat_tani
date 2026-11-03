import Link from "next/link";
import { Leaf, ArrowUpRight } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#205b40] text-[#f7f7ef]">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-5 px-6 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-10 lg:px-0">
        <Link href="/" className="flex items-center gap-2.5"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10"><Leaf size={16} /></span><span className="font-display text-[19px]">SewaAlat</span></Link>
        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-[10px] text-white/75"><Link href="/#katalog" className="hover:text-white">Katalog alat</Link><Link href="/#cara-sewa" className="hover:text-white">Cara sewa</Link><Link href="/#bantuan" className="hover:text-white">Bantuan</Link><a href="mailto:layanan@tanisewa.id" className="inline-flex items-center gap-1 hover:text-white">Hubungi kami <ArrowUpRight size={11} /></a></nav>
        <p className="text-[9px] text-white/60">© {new Date().getFullYear()} SewaAlat</p>
      </div>
    </footer>
  );
}
