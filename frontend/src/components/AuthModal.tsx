"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { X, Lock, Mail, User as UserIcon, Phone, Leaf, ArrowRight } from "lucide-react";

export default function AuthModal() {
  const router = useRouter();
  const { isAuthModalOpen, setAuthModalOpen, authMode, setAuthMode, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthModalOpen) return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape" && !loading) setAuthModalOpen(false); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isAuthModalOpen, loading, setAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  const switchMode = (mode: "login" | "register") => {
    setErrorMsg("");
    setAuthMode(mode);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMsg("");
    if (authMode === "register" && password !== confirmPassword) {
      setErrorMsg("Konfirmasi kata sandi belum sama.");
      return;
    }
    setLoading(true);

    try {
      const response = await fetch(`/api/auth/${authMode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(authMode === "login"
          ? { email, password }
          : { name, email, phone, password, confirmPassword }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || (authMode === "login" ? "Login gagal." : "Pendaftaran gagal."));

      login(data.user);
      router.push(data.user.role === "admin" ? "/dashboard/admin" : "/dashboard/penyewa");
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : "Permintaan belum dapat diproses.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#10291f]/55 backdrop-blur-sm p-4 animate-fade-in"
      onMouseDown={(event) => { if (event.target === event.currentTarget && !loading) setAuthModalOpen(false); }}
    >
      <section role="dialog" aria-modal="true" aria-labelledby="auth-title" className="relative bg-[#FAF5E9] rounded-[26px] shadow-2xl max-w-[440px] w-full overflow-hidden border border-[#195B3E]/15">
        <div className="absolute inset-x-0 top-0 h-1.5 bg-[#B8CC83]" />
        <button
          type="button"
          aria-label="Tutup dialog"
          onClick={() => setAuthModalOpen(false)}
          disabled={loading}
          className="absolute top-5 right-5 p-2 text-[#195B3E]/65 hover:text-[#195B3E] hover:bg-[#195B3E]/10 rounded-full transition-colors disabled:opacity-40"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="px-8 pt-9 pb-5">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-2xl bg-[#195B3E] text-[#FAF5E9] grid place-items-center"><Leaf className="w-5 h-5" /></div>
            <div><p className="text-[10px] uppercase tracking-[.18em] text-[#66806a] font-bold">TaniSewa</p><p className="text-xs text-[#748174]">Penyewaan alat pertanian</p></div>
          </div>
          <p className="text-[11px] uppercase tracking-[.16em] text-[#66806a] font-bold">{authMode === "login" ? "Selamat datang kembali" : "Mulai dari sini"}</p>
          <h2 id="auth-title" className="text-[26px] leading-tight font-black text-[#183F30] mt-1">
            {authMode === "login" ? "Masuk ke akun Anda" : "Buat akun penyewa"}
          </h2>
          <p className="text-sm text-[#748174] mt-2">
            {authMode === "login" ? "Lanjutkan mengelola pesanan dan jadwal sewa." : "Daftar untuk mengajukan penyewaan alat tani."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-4">
          {errorMsg && <div role="alert" className="p-3 bg-[#fae9e3] border border-[#e6b7a9] text-[#984436] text-sm font-medium rounded-xl">{errorMsg}</div>}

          {authMode === "register" && <>
            <div>
              <label htmlFor="auth-name" className="block text-xs font-bold text-[#344b3d] mb-1.5">Nama lengkap</label>
              <div className="relative"><UserIcon aria-hidden="true" className="w-4 h-4 text-[#819083] absolute left-3.5 top-3.5" /><input id="auth-name" name="name" type="text" autoComplete="name" minLength={2} maxLength={100} required value={name} onChange={(event) => setName(event.target.value)} placeholder="Contoh: Ahmad Petani" className="w-full pl-10 pr-4 py-3 bg-white border border-[#dfe4d6] rounded-xl text-sm text-[#183F30] placeholder:text-[#a2aa9f] focus:outline-none focus:ring-2 focus:ring-[#52815b]/35 focus:border-[#52815b]" /></div>
            </div>
            <div>
              <label htmlFor="auth-phone" className="block text-xs font-bold text-[#344b3d] mb-1.5">Nomor telepon / WhatsApp</label>
              <div className="relative"><Phone aria-hidden="true" className="w-4 h-4 text-[#819083] absolute left-3.5 top-3.5" /><input id="auth-phone" name="phone" type="tel" autoComplete="tel" minLength={6} maxLength={24} required value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="081234567890" className="w-full pl-10 pr-4 py-3 bg-white border border-[#dfe4d6] rounded-xl text-sm text-[#183F30] placeholder:text-[#a2aa9f] focus:outline-none focus:ring-2 focus:ring-[#52815b]/35 focus:border-[#52815b]" /></div>
            </div>
          </>}

          <div>
            <label htmlFor="auth-email" className="block text-xs font-bold text-[#344b3d] mb-1.5">Alamat email</label>
            <div className="relative"><Mail aria-hidden="true" className="w-4 h-4 text-[#819083] absolute left-3.5 top-3.5" /><input id="auth-email" name="email" type="email" autoComplete="email" maxLength={254} required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="nama@email.com" className="w-full pl-10 pr-4 py-3 bg-white border border-[#dfe4d6] rounded-xl text-sm text-[#183F30] placeholder:text-[#a2aa9f] focus:outline-none focus:ring-2 focus:ring-[#52815b]/35 focus:border-[#52815b]" /></div>
          </div>
          <div>
            <label htmlFor="auth-password" className="block text-xs font-bold text-[#344b3d] mb-1.5">Kata sandi</label>
            <div className="relative"><Lock aria-hidden="true" className="w-4 h-4 text-[#819083] absolute left-3.5 top-3.5" /><input id="auth-password" name="password" type="password" autoComplete={authMode === "login" ? "current-password" : "new-password"} minLength={authMode === "register" ? 8 : undefined} maxLength={128} required value={password} onChange={(event) => setPassword(event.target.value)} placeholder={authMode === "register" ? "Minimal 8 karakter" : "Masukkan kata sandi"} className="w-full pl-10 pr-4 py-3 bg-white border border-[#dfe4d6] rounded-xl text-sm text-[#183F30] placeholder:text-[#a2aa9f] focus:outline-none focus:ring-2 focus:ring-[#52815b]/35 focus:border-[#52815b]" /></div>
            {authMode === "register" && <p className="text-[11px] text-[#7b897d] mt-1.5">Gunakan minimal 8 karakter.</p>}
          </div>
          {authMode === "register" && <div>
            <label htmlFor="auth-confirm-password" className="block text-xs font-bold text-[#344b3d] mb-1.5">Konfirmasi kata sandi</label>
            <div className="relative"><Lock aria-hidden="true" className="w-4 h-4 text-[#819083] absolute left-3.5 top-3.5" /><input id="auth-confirm-password" name="confirmPassword" type="password" autoComplete="new-password" minLength={8} maxLength={128} required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Ulangi kata sandi" className="w-full pl-10 pr-4 py-3 bg-white border border-[#dfe4d6] rounded-xl text-sm text-[#183F30] placeholder:text-[#a2aa9f] focus:outline-none focus:ring-2 focus:ring-[#52815b]/35 focus:border-[#52815b]" /></div>
          </div>}

          <button type="submit" disabled={loading} className="group w-full py-3.5 px-4 bg-[#195B3E] text-[#FAF5E9] font-bold rounded-xl hover:bg-[#12432d] shadow-md transition-all disabled:opacity-55 flex justify-center items-center gap-2">
            {loading ? "Memproses..." : authMode === "login" ? "Masuk" : "Daftar sebagai penyewa"}
            {!loading && <ArrowRight aria-hidden="true" className="w-4 h-4 transition-transform group-hover:translate-x-1" />}
          </button>
          <div className="pt-1 text-center text-sm text-[#68786b]">
            {authMode === "login" ? <>Belum punya akun? <button type="button" onClick={() => switchMode("register")} className="font-bold text-[#195B3E] hover:underline">Daftar di sini</button></> : <>Sudah punya akun? <button type="button" onClick={() => switchMode("login")} className="font-bold text-[#195B3E] hover:underline">Masuk</button></>}
          </div>
          {authMode === "register" && <p className="text-[10px] text-center leading-relaxed text-[#8a9588]">Pendaftaran akan membuat akun Penyewa. Hak Admin hanya dapat diberikan melalui pengelolaan server.</p>}
        </form>
      </section>
    </div>
  );
}
