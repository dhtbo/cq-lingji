"use client";

import React, { useState } from "react";
import { Check, Copy, X, Palette, Sparkles } from "lucide-react";

interface ColorPalettePopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyColor: (hex: string, rgb: [number, number, number]) => void;
  colorMode?: "light" | "dark";
}

// 6行 x 10列  调色板矩阵色彩
const COLOR_GRID = [
  // 灰度白黑系
  ["#FFFFFF", "#F3F4F6", "#E5E7EB", "#D1D5DB", "#9CA3AF", "#6B7280", "#4B5563", "#374151", "#1F2937", "#111827"],
  // 暖黄与奶咖系
  ["#FEF3C7", "#FDE68A", "#FCD34D", "#FBBF24", "#F59E0B", "#D97706", "#B45309", "#92400E", "#78350F", "#451A03"],
  // 阳光橙黄系
  ["#FFFBEB", "#FEF08A", "#FACC15", "#EAB308", "#CA8A04", "#A16207", "#FB923C", "#F97316", "#EA580C", "#C2410C"],
  // 翠绿与薄荷系
  ["#ECFDF5", "#A7F3D0", "#6EE7B7", "#34D399", "#10B981", "#059669", "#047857", "#065F46", "#064E3B", "#022C22"],
  // 青天与海蓝系
  ["#F0F9FF", "#BAE6FD", "#7DD3FC", "#38BDF8", "#0EA5E9", "#0284C7", "#0369A1", "#075985", "#0C4A6E", "#1E3A8A"],
  // 紫罗兰与霓虹系
  ["#FAF5FF", "#E9D5FF", "#D8B4FE", "#C084FC", "#A855F7", "#9333EA", "#7E22CE", "#6B21A8", "#EC4899", "#E11D48"],
];

function hexToRgb(hex: string): [number, number, number] {
  const cleanHex = hex.replace("#", "");
  const num = parseInt(cleanHex, 16);
  return [
    Math.round(((num >> 16) & 255) / 255 * 100) / 100,
    Math.round(((num >> 8) & 255) / 255 * 100) / 100,
    Math.round((num & 255) / 255 * 100) / 100,
  ];
}

export const ColorPalettePopover: React.FC<ColorPalettePopoverProps> = ({
  isOpen,
  onClose,
  onApplyColor,
  colorMode = "dark",
}) => {
  const [activeTab, setActiveTab] = useState<"grid" | "custom">("grid");
  const [selectedColor, setSelectedColor] = useState<string>("#FFDB29");
  const [recentColors, setRecentColors] = useState<string[]>([
    "#FFFFFF",
    "#FFDB29",
    "#38BDF8",
    "#10B981",
    "#A855F7",
    "#F97316",
  ]);
  const [copied, setCopied] = useState(false);

  const isLight = colorMode === "light";

  if (!isOpen) return null;

  const handleSelect = (hex: string) => {
    setSelectedColor(hex);
    if (!recentColors.includes(hex)) {
      setRecentColors((prev) => [hex, ...prev.slice(0, 5)]);
    }
  };

  const handleApply = () => {
    onApplyColor(selectedColor, hexToRgb(selectedColor));
    onClose();
  };

  const handleCopyHex = () => {
    navigator.clipboard.writeText(selectedColor);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`absolute bottom-16 right-4 z-40 ${isLight
          ? "bg-white border-gray-200 text-gray-800 shadow-xl"
          : "bg-[#1e232b] border-[#30363d] text-gray-200 shadow-2xl"
        } border rounded-2xl w-80 p-4 text-xs select-none animate-slideUp`}
    >
      {/* 顶部 Tab 切换与关闭 */}
      <div className={`flex items-center justify-between pb-3 border-b ${isLight ? "border-gray-200" : "border-[#30363d]"}`}>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setActiveTab("grid")}
            className={`pb-1 font-semibold transition relative ${activeTab === "grid"
                ? isLight
                  ? "text-amber-600 border-b-2 border-amber-600"
                  : "text-amber-400 border-b-2 border-amber-400"
                : isLight
                  ? "text-gray-500 hover:text-gray-800"
                  : "text-gray-400 hover:text-white"
              }`}
          >
            色板
          </button>
          <button
            onClick={() => setActiveTab("custom")}
            className={`pb-1 font-semibold transition relative ${activeTab === "custom"
                ? isLight
                  ? "text-amber-600 border-b-2 border-amber-600"
                  : "text-amber-400 border-b-2 border-amber-400"
                : isLight
                  ? "text-gray-500 hover:text-gray-800"
                  : "text-gray-400 hover:text-white"
              }`}
          >
            自定义
          </button>
        </div>

        <button
          onClick={onClose}
          className={`p-1 rounded-lg ${isLight ? "text-gray-400 hover:text-gray-700 hover:bg-gray-100" : "text-gray-400 hover:text-white hover:bg-white/10"
            } transition`}
        >
          <X size={15} />
        </button>
      </div>

      {/* 色板主体 */}
      {activeTab === "grid" ? (
        <div className="py-3 space-y-3">
          {/* 6x10 预设色彩矩阵 */}
          <div
            className={`grid grid-cols-10 gap-1.5 p-1 ${isLight ? "bg-gray-50 border-gray-200" : "bg-[#161b22] border-[#30363d]"
              } rounded-xl border`}
          >
            {COLOR_GRID.flatMap((row, rIdx) =>
              row.map((color, cIdx) => (
                <button
                  key={`${rIdx}-${cIdx}`}
                  onClick={() => handleSelect(color)}
                  style={{ backgroundColor: color }}
                  className="w-5 h-5 rounded-md flex items-center justify-center transition hover:scale-110 shadow-sm relative"
                  title={color}
                >
                  {selectedColor.toLowerCase() === color.toLowerCase() && (
                    <Check
                      size={12}
                      className={
                        color === "#FFFFFF" || color === "#F3F4F6" || color === "#FEF3C7"
                          ? "text-gray-900 font-bold"
                          : "text-white font-bold"
                      }
                    />
                  )}
                </button>
              ))
            )}
          </div>

          {/* 最近使用 */}
          <div>
            <p className="text-[11px] text-gray-400 mb-1.5 font-medium">最近使用</p>
            <div className="flex items-center space-x-1.5">
              {recentColors.map((hex, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelect(hex)}
                  style={{ backgroundColor: hex }}
                  className="w-5 h-5 rounded-md border border-white/20 transition hover:scale-110 shadow-sm"
                  title={hex}
                />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="py-4 space-y-4">
          {/* 自定义原生颜色挑选器 */}
          <div className="flex items-center space-x-3">
            <input
              type="color"
              value={selectedColor}
              onChange={(e) => handleSelect(e.target.value)}
              className="w-14 h-14 rounded-xl border border-[#30363d] cursor-pointer bg-transparent"
            />
            <div className="space-y-1">
              <span className="text-[11px] text-gray-400">选择任意高精度 RGB 颜色</span>
              <div className="font-mono text-sm font-bold text-amber-400">{selectedColor}</div>
            </div>
          </div>
        </div>
      )}

      {/* 底部控制行：HEX 输入框与应用按钮 */}
      <div className="pt-2 border-t border-[#30363d] flex items-center justify-between gap-2">
        <div className="flex items-center bg-[#161b22] border border-[#30363d] rounded-lg px-2 py-1 w-28">
          <span className="text-[10px] text-gray-400 font-mono mr-1">HEX</span>
          <input
            type="text"
            value={selectedColor}
            onChange={(e) => setSelectedColor(e.target.value)}
            className="bg-transparent text-xs text-white font-mono w-full focus:outline-none uppercase"
          />
        </div>

        <div className="flex items-center space-x-1.5">
          <button
            onClick={handleCopyHex}
            className="p-1.5 rounded-lg bg-[#262c36] hover:bg-[#30363d] border border-[#30363d] text-gray-300 transition"
            title="复制 HEX 色值"
          >
            {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
          </button>

          <button
            onClick={handleApply}
            className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-gray-950 font-bold rounded-lg text-xs transition shadow-md shadow-amber-500/20 active:scale-95 flex items-center gap-1"
          >
            <Sparkles size={12} />
            <span>应用到模型</span>
          </button>
        </div>
      </div>
    </div>
  );
};
