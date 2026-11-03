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
  const productionPayments = process.env.MIDTRANS_IS_PRODUCTION === "true";
  const midtransClientKey = process.env.MIDTRANS_CLIENT_KEY || "";
  const expectedKeyPrefix = productionPayments ? "Mid-client-" : "SB-Mid-client-";
  const snapScriptUrl = productionPayments
    ? "https://app.midtrans.com/snap/snap.js"
    : "https://app.sandbox.midtrans.com/snap/snap.js";
  return (
    <html lang="id" className="scroll-smooth">
      <head>{midtransClientKey.startsWith(expectedKeyPrefix) && <script type="text/javascript" src={snapScriptUrl} data-client-key={midtransClientKey} />}</head>
      <body className="antialiased">
        <AuthProvider><Navbar />{children}<AuthModal /></AuthProvider>
      </body>
    </html>
  );
}
