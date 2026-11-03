import React from "react";
import { Tractor, MapPin, Phone, Clock, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#195B3E] text-[#FAF5E9] pt-16 pb-8 border-t-4 border-[#12432d]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-[#237d56]">
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-[#FAF5E9] text-[#195B3E] flex items-center justify-center font-bold">
                <Tractor className="w-6 h-6" />
              </div>
              <span className="text-2xl font-black text-[#FAF5E9]">TaniSewa</span>
            </div>
            <p className="text-sm text-[#c4e3d3] leading-relaxed">
              Platform modern penyewaan alat pertanian terlengkap. Membantu petani meningkatkan produktivitas hasil panen secara efisien.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-bold text-white mb-4">Navigasi Cepat</h4>
            <ul className="space-y-2.5 text-sm text-[#c4e3d3]">
              <li><a href="/" className="hover:text-white transition-colors">Beranda Utama</a></li>
              <li><a href="/#katalog" className="hover:text-white transition-colors">Katalog Alat Tani</a></li>
              <li><a href="/#cara-sewa" className="hover:text-white transition-colors">Panduan Cara Sewa</a></li>
              <li><a href="/#ketentuan" className="hover:text-white transition-colors">Ketentuan & Denda</a></li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h4 className="text-lg font-bold text-white mb-4">Kontak Pengelola</h4>
            <ul className="space-y-3 text-sm text-[#c4e3d3]">
              <li className="flex items-start space-x-3">
                <Phone className="w-5 h-5 text-[#FAF5E9] flex-shrink-0 mt-0.5" />
                <span>+62 812-3456-7890 (Call / WhatsApp)</span>
              </li>
              <li className="flex items-start space-x-3">
                <Mail className="w-5 h-5 text-[#FAF5E9] flex-shrink-0 mt-0.5" />
                <span>layanan@tanisewa.id</span>
              </li>
              <li className="flex items-start space-x-3">
                <Clock className="w-5 h-5 text-[#FAF5E9] flex-shrink-0 mt-0.5" />
                <span>Senin - Minggu: 07.00 - 17.00 WIB</span>
              </li>
            </ul>
          </div>

          {/* Depot Location */}
          <div>
            <h4 className="text-lg font-bold text-white mb-4">Lokasi Depot Penyerahan</h4>
            <div className="flex items-start space-x-3 text-sm text-[#c4e3d3]">
              <MapPin className="w-5 h-5 text-[#FAF5E9] flex-shrink-0 mt-0.5" />
              <span>
                Jl. Raya Pertanian No. 88, Kertamukti, Kab. Subang, Jawa Barat 41251 (Depot Utama TaniSewa)
              </span>
            </div>
          </div>
        </div>

        <div className="pt-8 text-center text-xs text-[#a3d4bd] flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0">
          <p>© {new Date().getFullYear()} TaniSewa. Seluruh Hak Cipta Dilindungi.</p>
          <p className="font-semibold text-white">Sistem Penyewaan Alat Tani Versi 1.0.0 (Midtrans Snap Ready)</p>
        </div>
      </div>
    </footer>
  );
}
