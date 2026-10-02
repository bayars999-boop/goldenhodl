import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ThemeProvider from "./theme-provider";
import LegalFooter from "./legal-footer";
import CookieConsent, { ConsentTrackers } from "./cookie-consent";
import ChatWidget from "./components/ChatWidget"; // ChatWidget компонентыг импортлох

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GoldenHodl - Алтны Арилжаа & Зах Зээлийн Судалгаа",
  description: "Алтны зах зээл, захиалгын урсгал болон арилжааны ухаалаг хиймэл оюун ухаант туслах",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="mn" // Монгол хэл рүү өөрчлөв
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col">
        <ThemeProvider>
          <div className="site-content">{children}</div>
          <LegalFooter />
          <CookieConsent />
          <ConsentTrackers />
          <ChatWidget /> {/* Чатботын виджетийг энд байрлуулав */}
        </ThemeProvider>
      </body>
    </html>
  );
}