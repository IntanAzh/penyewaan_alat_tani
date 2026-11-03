import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AuthModal from "@/components/AuthModal";

export const metadata: Metadata = {
  title: "TaniSewa — Platform Penyewaan Alat Tani Modern",
  description: "Website penyewaan alat pertanian terlengkap. Cari traktor, mesin tanam padi, pompa irigasi, bayar via Midtrans Snap.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="scroll-smooth">
      <head>
        {/* Midtrans Snap Sandbox JS SDK */}
        <script
          type="text/javascript"
          src="https://app.sandbox.midtrans.com/snap/snap.js"
          data-client-key={process.env.MIDTRANS_CLIENT_KEY || "SB-Mid-client-YOUR_SANDBOX_CLIENT_KEY"}
        ></script>
      </head>
      <body className="antialiased bg-[#FAF5E9] text-[#1F2937]">
        <AuthProvider>
          <Navbar />
          {children}
          <Footer />
          <AuthModal />
        </AuthProvider>
      </body>
    </html>
  );
}
