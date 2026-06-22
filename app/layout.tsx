import type { Metadata, Viewport } from "next";
import { Gothic_A1 } from "next/font/google";
import "./globals.css";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

const gothic = Gothic_A1({
  weight: ["400", "700", "900"],
  subsets: ["latin"],
  variable: "--font-gothic",
  display: "swap",
});

export const metadata: Metadata = {
  title: "피카타워 — 무한 등정 로그라이크",
  description: "PokeAPI 기반 게임보이 스타일 무한 타워 로그라이크",
  applicationName: "피카타워",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "피카타워",
  },
  icons: {
    icon: "/icon-192.png",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#182014",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className={gothic.variable}>
      <body>
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
