"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Tractor, LogOut, LayoutDashboard, Menu, X } from "lucide-react";

export default function Navbar() {
  const { user, logout, setAuthModalOpen, setAuthMode } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleOpenLogin = () => {
    setAuthMode("login");
    setAuthModalOpen(true);
  };

  const handleOpenRegister = () => {
    setAuthMode("register");
    setAuthModalOpen(true);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#195B3E] text-white shadow-md border-b border-[#12432d]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-12 h-12 rounded-xl bg-[#FAF5E9] text-[#195B3E] flex items-center justify-center font-bold shadow-inner group-hover:scale-105 transition-transform">
              <Tractor className="w-7 h-7" />
            </div>
            <div>
              <span className="text-2xl font-black tracking-tight text-[#FAF5E9] block leading-none">
                TaniSewa
              </span>
              <span className="text-xs text-[#a3d4bd] font-medium tracking-wide">
                Penyewaan Alat Tani Modern
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8 font-medium text-sm">
            <Link href="/" className="hover:text-[#FAF5E9] transition-colors">
              Beranda
            </Link>
            <Link href="/#katalog" className="hover:text-[#FAF5E9] transition-colors">
              Katalog Alat
            </Link>
            <Link href="/#cara-sewa" className="hover:text-[#FAF5E9] transition-colors">
              Cara Menyewa
            </Link>
            <Link href="/#ketentuan" className="hover:text-[#FAF5E9] transition-colors">
              Syarat & Ketentuan
            </Link>
          </nav>

          {/* Auth Action Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <Link
                  href={user.role === "admin" ? "/dashboard/admin" : "/dashboard/penyewa"}
                  className="flex items-center space-x-2 bg-[#FAF5E9] text-[#195B3E] px-4 py-2.5 rounded-lg font-semibold text-sm hover:bg-white transition-all shadow-sm"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard {user.role === "admin" ? "Admin" : "Penyewa"}</span>
                </Link>
                <div className="text-right">
                  <span className="block text-xs font-bold text-[#FAF5E9]">{user.name}</span>
                  <span className="inline-block text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-[#12432d] text-[#FAF5E9]">
                    {user.role}
                  </span>
                </div>
                <button
                  onClick={() => void logout().catch((error) => window.alert(error.message))}
                  title="Logout"
                  className="p-2 rounded-lg text-white hover:bg-[#12432d] transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleOpenLogin}
                  className="px-4 py-2 rounded-lg text-sm font-semibold border border-[#FAF5E9] text-[#FAF5E9] hover:bg-[#12432d] transition-colors"
                >
                  Masuk
                </button>
                <button
                  onClick={handleOpenRegister}
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-[#FAF5E9] text-[#195B3E] hover:bg-white shadow-sm transition-all"
                >
                  Daftar
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu trigger */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-white hover:bg-[#12432d] rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#12432d] border-t border-[#195B3E] px-4 pt-3 pb-6 space-y-3">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-white py-2 font-medium hover:text-[#FAF5E9]"
          >
            Beranda
          </Link>
          <Link
            href="/#katalog"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-white py-2 font-medium hover:text-[#FAF5E9]"
          >
            Katalog Alat
          </Link>
          <Link
            href="/#cara-sewa"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-white py-2 font-medium hover:text-[#FAF5E9]"
          >
            Cara Menyewa
          </Link>
          <Link
            href="/#ketentuan"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-white py-2 font-medium hover:text-[#FAF5E9]"
          >
            Syarat & Ketentuan
          </Link>

          <div className="pt-4 border-t border-[#195B3E] space-y-2">
            {user ? (
              <>
                <Link
                  href={user.role === "admin" ? "/dashboard/admin" : "/dashboard/penyewa"}
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center space-x-2 bg-[#FAF5E9] text-[#195B3E] py-2.5 rounded-lg font-bold text-sm"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard {user.role === "admin" ? "Admin" : "Penyewa"}</span>
                </Link>
                <button
                  onClick={() => {
                    void logout().then(() => setMobileMenuOpen(false)).catch((error) => window.alert(error.message));
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2 bg-red-700 text-white rounded-lg font-medium text-sm"
                >
                  Logout ({user.name})
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    handleOpenLogin();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2.5 border border-[#FAF5E9] text-[#FAF5E9] rounded-lg text-sm font-semibold"
                >
                  Masuk
                </button>
                <button
                  onClick={() => {
                    handleOpenRegister();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2.5 bg-[#FAF5E9] text-[#195B3E] rounded-lg text-sm font-bold"
                >
                  Daftar
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}



