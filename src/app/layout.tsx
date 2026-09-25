import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Touchless Photo Booth",
  description:
    "Interactive touchless photo booth powered by AI hand tracking. Take photos with just a wave of your hand!",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-black text-white font-sans overflow-hidden">
        {children}
      </body>
    </html>
  );
}
