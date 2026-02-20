import type { Metadata } from "next";
import {
  Geist,
  Geist_Mono,
  Nunito,
  Quicksand,
  Fredoka,
  Lexend,
  Baloo_2,
} from "next/font/google";
import { LanguageProvider } from "@/lib/LanguageContext";
import { CoinProvider } from "@/lib/CoinContext";
import { ThemeProvider } from "@/lib/ThemeProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/* Kid-friendly sans-serif book cover fonts (no serifs) */
const nunito = Nunito({
  variable: "--font-book-1",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const quicksand = Quicksand({
  variable: "--font-book-2",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const fredoka = Fredoka({
  variable: "--font-book-3",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const lexend = Lexend({
  variable: "--font-book-4",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const baloo2 = Baloo_2({
  variable: "--font-book-5",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Storytime",
  description: "Turn ideas into immersive bedtime stories",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${nunito.variable} ${quicksand.variable} ${fredoka.variable} ${lexend.variable} ${baloo2.variable} antialiased`}
      >
        <ThemeProvider>
          <LanguageProvider>
            <CoinProvider>{children}</CoinProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
