import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { AppProviders } from "@/components/providers";
import Sidebar from "@/components/Sidebar";
import SearchOverlay from "@/components/SearchOverlay";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "AnimesFreak — Hindi Anime, Stream the Madness",
  description:
    "Hindi-dubbed anime series aur movies — trending titles, daily episodes, 4K quality. Sab kuch Hindi mein, sirf AnimesFreak par.",
};

export const viewport: Viewport = {
  themeColor: "#0a0a0e",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="grain bg-ink font-sans text-fg antialiased">
        <AppProviders>
          <Sidebar />
          <SearchOverlay />
          <div className="pt-14 md:pl-[76px] md:pt-0 lg:pl-[236px]">
            <main className="min-h-screen">{children}</main>
            <Footer />
          </div>
        </AppProviders>
      </body>
    </html>
  );
}