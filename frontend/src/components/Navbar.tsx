"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import logo from "../../image/logo.png";
import { useAuth } from "@/context/AuthContext";
import { ArrowUpRight, LayoutDashboard, LogOut, Menu, X } from "lucide-react";

export default function Navbar() {
  const { user, logout, setAuthModalOpen, setAuthMode } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const showAuth = (mode: "login" | "register") => { setAuthMode(mode); setAuthModalOpen(true); setMobileMenuOpen(false); };
  const links = [["Beranda", "/"], ["Katalog alat", "/#katalog"], ["Cara sewa", "/#cara-sewa"], ["Bantuan", "/#bantuan"]];

  return (
    <header className="sticky top-0 z-50 border-b border-[#e8e9e2]/70 bg-[#fbfaf6]/80 text-[#2e4035] backdrop-blur-xl">
      <div className="mx-auto flex h-[80px] max-w-[1312px] items-center justify-between px-6 sm:px-10 lg:px-0">
        <Link href="/" className="flex items-center" aria-label="SewaAlat beranda">
          <Image src={logo} alt="SewaAlat" priority className="h-auto w-[126px] object-contain sm:w-[142px]" />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {links.map(([label, href]) => <Link key={label} href={href} className="text-[14px] text-[#526257] transition hover:text-[#205b40]">{label}</Link>)}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <>
              <Link href={user.role === "admin" ? "/dashboard/admin" : "/dashboard/penyewa"} className="inline-flex items-center gap-2 rounded-sm bg-[#205b40] px-4 py-2.5 text-[13px] font-medium text-white transition hover:bg-[#16442f]"><LayoutDashboard size={15} />Dashboard</Link>
              <button onClick={() => void logout().catch((error) => window.alert(error.message))} aria-label="Keluar" className="p-2 text-[#526257] hover:text-[#205b40]"><LogOut size={15} /></button>
            </>
          ) : (
            <><button onClick={() => showAuth("login")} className="rounded-sm border border-[#dce1d9] bg-white px-4 py-2.5 text-[13px] text-[#405448] transition hover:border-[#285b43]">Masuk</button><button onClick={() => showAuth("register")} className="inline-flex items-center gap-2 rounded-sm bg-[#205b40] px-4 py-2.5 text-[13px] text-white transition hover:bg-[#16442f]">Daftar penyewa <ArrowUpRight size={14} /></button></>
          )}
        </div>

        <button aria-label={mobileMenuOpen ? "Tutup menu" : "Buka menu"} aria-expanded={mobileMenuOpen} onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-[#285b43] md:hidden">{mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}</button>
      </div>

      {mobileMenuOpen && <nav className="border-t border-[#e8e9e2] bg-[#fbfaf6] px-6 py-4 md:hidden">
        <div className="mx-auto flex max-w-[1312px] flex-col gap-3">
          {links.map(([label, href]) => <Link key={label} href={href} onClick={() => setMobileMenuOpen(false)} className="py-1 text-sm text-[#526257]">{label}</Link>)}
          {user ? <Link href={user.role === "admin" ? "/dashboard/admin" : "/dashboard/penyewa"} onClick={() => setMobileMenuOpen(false)} className="button-primary mt-2 justify-center">Dashboard</Link> : <div className="mt-2 grid grid-cols-2 gap-2"><button onClick={() => showAuth("login")} className="button-light justify-center">Masuk</button><button onClick={() => showAuth("register")} className="button-primary justify-center">Daftar penyewa</button></div>}
        </div>
      </nav>}
    </header>
  );
}
