import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "justinianus.ai - legal case management",
  description: "Sistema inteligente de gestão de casos jurídicos com IA",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="font-sans antialiased bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
