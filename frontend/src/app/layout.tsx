import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import AuthModal from "@/components/AuthModal";

export const metadata: Metadata = {
  title: "SewaAlat — Sewa mudah, hasil tani melimpah",
  description: "Temukan alat pertanian berkualitas untuk musim tanammu. Sewa alat dengan jadwal yang jelas dan unit yang terawat.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" className="scroll-smooth">
      <head>
        <script type="text/javascript" src="https://app.sandbox.midtrans.com/snap/snap.js" data-client-key={process.env.MIDTRANS_CLIENT_KEY || "SB-Mid-client-YOUR_SANDBOX_CLIENT_KEY"} />
      </head>
      <body className="antialiased">
        <AuthProvider><Navbar />{children}<AuthModal /></AuthProvider>
      </body>
    </html>
  );
}
