import type { Metadata } from "next";
import {
  Geist,
  Geist_Mono,
  Playfair_Display,
  Bebas_Neue,
  Cormorant_Garamond,
  Oswald,
  Libre_Baskerville,
} from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfairDisplay = Playfair_Display({
  variable: "--font-book-1",
  subsets: ["latin"],
  weight: ["400", "700", "800"],
});

const bebasNeue = Bebas_Neue({
  variable: "--font-book-2",
  weight: "400",
  subsets: ["latin"],
});

const cormorantGaramond = Cormorant_Garamond({
  variable: "--font-book-3",
  weight: ["400", "600"],
  subsets: ["latin"],
});

const oswald = Oswald({
  variable: "--font-book-4",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const libreBaskerville = Libre_Baskerville({
  variable: "--font-book-5",
  weight: ["400", "700"],
  subsets: ["latin"],
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
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${playfairDisplay.variable} ${bebasNeue.variable} ${cormorantGaramond.variable} ${oswald.variable} ${libreBaskerville.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
