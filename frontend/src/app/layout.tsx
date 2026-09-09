import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "灵机 3D 积木工坊 (build123d Blockly Studio) - 视觉化 CAD 创意编程工作台",
  description: "基于 build123d 现代几何引擎的可视化积木与 Python 代码双向无损联动三维建模平台",
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
