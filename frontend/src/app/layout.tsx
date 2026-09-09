import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CadQuery Blockly Studio - 视觉化 CAD 创意编程工作台",
  description: "面向青少年与初学者的 CadQuery 可视化积木与代码联动三维建模平台",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="dark">
      <body className="h-screen w-screen overflow-hidden bg-[#0d1117] text-white">
        {children}
      </body>
    </html>
  );
}
