import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Internal TemuDataku",
  description: "Diagram relasi database TemuDataku, live dari schema.prisma.",
};

// Jalan SEBELUM halaman tampil, supaya tidak ada kilatan tema yang salah.
// Urutan: pilihan tersimpan user -> preferensi sistem -> gelap.
const themeInitScript = `
(function () {
  try {
    var t = localStorage.getItem("erd-theme");
    if (t !== "light" && t !== "dark") {
      t = window.matchMedia("(prefers-color-scheme: light)").matches
        ? "light"
        : "dark";
    }
    document.documentElement.setAttribute("data-theme", t);
  } catch (e) {
    document.documentElement.setAttribute("data-theme", "dark");
  }
})();
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: atribut data-theme ditambahkan oleh script di
    // atas sebelum React hydrate, jadi sengaja berbeda dari HTML server.
    <html
      lang="id"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="h-full bg-erd-bg text-erd-text">{children}</body>
    </html>
  );
}