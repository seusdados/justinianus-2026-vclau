import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Justinianus.AI - Gestão Jurídica Inteligente",
  description: "Sistema de gestão de casos jurídicos com IA",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="font-sans antialiased bg-gray-50 text-gray-900 min-h-screen">
        {children}
      </body>
    </html>
  );
}
