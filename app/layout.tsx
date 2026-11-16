import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Wantit — la tua wishlist universale",
  description: "Salva prodotti da qualsiasi sito in una wishlist bellissima.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" className="dark">
      <body className={`${inter.variable} font-sans`}>
        {children}
        {/* Notifiche "toast" in basso a destra */}
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: { background: "#111", border: "1px solid #1A1A1A", color: "#f5f5f5" },
          }}
        />
      </body>
    </html>
  );
}
