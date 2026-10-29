import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hospital de Clínicas San Jorge | Portal & Historia Clínica Digital",
  description: "Portal Institucional, Servicios Médicos Hospitalarios y Sistema de Historia Clínica Digital de la Clínica San Jorge.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="bg-slate-50 text-slate-800 antialiased selection:bg-teal-800 selection:text-white">
        {children}
      </body>
    </html>
  );
}
