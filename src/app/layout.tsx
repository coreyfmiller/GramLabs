import type { Metadata } from "next";
import { Archivo, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-archivo",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: "GramLab",
  description: "Premium ultralight outdoor intelligence",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${archivo.variable} ${jetbrainsMono.variable}`}>
      <body className="bg-[#0a0a0a] font-[family-name:var(--font-archivo)]">
        {children}
      </body>
    </html>
  );
}
