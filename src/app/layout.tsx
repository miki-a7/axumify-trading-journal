import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "Axumify | Institutional ICT Trading Journal Terminal",
  description:
    "Professional Blue + Black trading journal terminal for performance analytics, ICT/SMC setup tracking, trade planning, psychology, and backtesting.",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable} dark`}>
      <body className="bg-[#050B14] text-[#F8FAFC] antialiased min-h-screen selection:bg-[#2563EB] selection:text-white font-sans">
        {children}
      </body>
    </html>
  );
}
