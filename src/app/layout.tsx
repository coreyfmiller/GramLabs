import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RIDGELINE",
  description: "Premium ultralight outdoor brand",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-[#0a0a0a] overflow-hidden">{children}</body>
    </html>
  );
}
