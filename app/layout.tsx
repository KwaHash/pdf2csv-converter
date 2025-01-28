import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PDFデータをエクセル形式",
  description: "PDFデータをエクセル形式に変換するサイトです。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="jp">
      <body>
        {children}
      </body>
    </html>
  );
}
