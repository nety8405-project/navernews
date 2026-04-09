import type { Metadata } from "next";
import { Black_Han_Sans, Gowun_Batang, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const blackHanSans = Black_Han_Sans({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const gowunBatang = Gowun_Batang({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "뉴스룸 디스패치 · 실시간 인사이트",
  description: "네이버 뉴스 검색과 AI 요약·키워드·감정·주제·트렌드 분석",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${blackHanSans.variable} ${gowunBatang.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
