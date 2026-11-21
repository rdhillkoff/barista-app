import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Barista Training Store | สั่งสินค้าจากห้องเทรน",
  description: "ระบบสั่งสินค้าสำหรับผู้เรียนบาริสต้า ส่งตรงถึงเซลล์ขายหน้าร้าน",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body className="antialiased">{children}</body>
    </html>
  );
}
