import type { Metadata } from "next";
import { Gothic_A1 } from "next/font/google";
import "./globals.css";

const gothic = Gothic_A1({
  weight: ["400", "700", "900"],
  subsets: ["latin"],
  variable: "--font-gothic",
  display: "swap",
});

export const metadata: Metadata = {
  title: "피카타워 — 무한 등정 로그라이크",
  description: "PokeAPI 기반 게임보이 스타일 무한 타워 로그라이크",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className={gothic.variable}>
      <body>
        <div className="scenery" aria-hidden>
          <div className="cloud" />
          <div className="cloud" />
          <div className="cloud" />
          <div className="mountains" />
        </div>
        {children}
      </body>
    </html>
  );
}
