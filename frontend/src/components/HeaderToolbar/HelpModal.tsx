"use client";

import React from "react";
import { X, Keyboard, BookOpen, Sparkles, ExternalLink, HelpCircle, Box, Compass, Wrench } from "lucide-react";
import { EditorSettings } from "../EditorSettings/EditorSettingsModal";

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings?: EditorSettings;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose, settings }) => {
  if (!isOpen) return null;

  const isLight = settings?.colorMode === "light";
  const themeColor = settings?.themeColor || "#FFDB29";
  const isYellowTheme =
    themeColor.toLowerCase() === "#ffdb29" ||
    themeColor.toLowerCase() === "#ffc400" ||
    settings?.themeName === "经典黄";

  // 主题文字与高亮颜色适配
  const primaryBadgeText = isYellowTheme ? "#8A4B00" : "#ffffff";
  const primaryBadgeBg = isYellowTheme ? "#FFDB29" : themeColor;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn p-4">
      <div
        className={`rounded-2xl w-full max-w-2xl max-h-[85vh] shadow-2xl flex flex-col overflow-hidden border transition-colors duration-200 ${isLight
            ? "bg-white border-gray-200 text-gray-800 shadow-xl shadow-black/10"
            : "bg-[#161b22] border-[#30363d] text-gray-200"
          }`}
      >
        {/* 顶部标题栏 */}
        <div
          className={`h-14 px-6 border-b flex items-center justify-between ${isLight ? "bg-[#f8fafc] border-gray-200" : "bg-[#0d1117] border-[#30363d]"
            }`}
        >
          <div className="flex items-center space-x-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center font-bold shadow-sm transition-colors"
              style={{ backgroundColor: primaryBadgeBg, color: primaryBadgeText }}
            >
              <HelpCircle size={18} />
            </div>
            <div>
              <h2 className={`text-sm font-bold tracking-wide ${isLight ? "text-gray-900" : "text-white"}`}>
                帮助中心 & 快捷键指南
              </h2>
              <p className={`text-[11px] ${isLight ? "text-gray-500" : "text-gray-400"}`}>
                双界面可视化 3D CAD 建模高效操作参考
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition ${isLight
                ? "text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                : "text-gray-400 hover:text-white hover:bg-white/10"
              }`}
          >
            <X size={18} />
          </button>
        </div>

        {/* 内容滚动区 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {/* 1. 核心高频快捷键 */}
          <section>
            <h3
              className="font-bold flex items-center gap-1.5 mb-3 text-xs uppercase tracking-wider"
              style={{ color: isLight && isYellowTheme ? "#B46700" : isYellowTheme ? "#FBBF24" : themeColor }}
            >
              <Keyboard size={14} /> 常用快捷键速查 (Windows / Mac)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div
                className={`p-2.5 rounded-lg flex items-center justify-between border ${isLight ? "bg-gray-50 border-gray-200" : "bg-[#0d1117] border-[#30363d]"
                  }`}
              >
                <span className={isLight ? "text-gray-700 font-medium" : "text-gray-300"}>运行并渲染模型</span>
                <kbd
                  className="px-2 py-0.5 rounded font-mono text-[10px] font-bold shadow-xs border"
                  style={{
                    backgroundColor: primaryBadgeBg + (isLight ? "25" : "20"),
                    color: isLight && isYellowTheme ? "#8A4B00" : isYellowTheme ? "#FFDB29" : themeColor,
                    borderColor: primaryBadgeBg + "40",
                  }}
                >
                  Ctrl + Enter
                </kbd>
              </div>

              <div
                className={`p-2.5 rounded-lg flex items-center justify-between border ${isLight ? "bg-gray-50 border-gray-200" : "bg-[#0d1117] border-[#30363d]"
                  }`}
              >
                <span className={isLight ? "text-gray-700 font-medium" : "text-gray-300"}>保存作品工程</span>
                <kbd
                  className={`px-2 py-0.5 rounded font-mono text-[10px] border ${isLight
                      ? "bg-blue-50 text-blue-700 border-blue-200"
                      : "bg-blue-500/20 text-blue-300 border-blue-500/30"
                    }`}
                >
                  Ctrl + S
                </kbd>
              </div>

              <div
                className={`p-2.5 rounded-lg flex items-center justify-between border ${isLight ? "bg-gray-50 border-gray-200" : "bg-[#0d1117] border-[#30363d]"
                  }`}
              >
                <span className={isLight ? "text-gray-700 font-medium" : "text-gray-300"}>查找与替换代码</span>
                <kbd
                  className={`px-2 py-0.5 rounded font-mono text-[10px] border ${isLight
                      ? "bg-purple-50 text-purple-700 border-purple-200"
                      : "bg-purple-500/20 text-purple-300 border-purple-500/30"
                    }`}
                >
                  Ctrl + F
                </kbd>
              </div>

              <div
                className={`p-2.5 rounded-lg flex items-center justify-between border ${isLight ? "bg-gray-50 border-gray-200" : "bg-[#0d1117] border-[#30363d]"
                  }`}
              >
                <span className={isLight ? "text-gray-700 font-medium" : "text-gray-300"}>撤销 / 重做</span>
                <kbd
                  className={`px-2 py-0.5 rounded font-mono text-[10px] border ${isLight ? "bg-gray-200 text-gray-800 border-gray-300" : "bg-gray-800 text-gray-200 border-gray-700"
                    }`}
                >
                  Ctrl + Z / Ctrl + Y
                </kbd>
              </div>
            </div>
          </section>

          {/* 2. 3D CAD 核心建模快捷键 */}
          <section>
            <h3 className="text-cyan-500 font-bold flex items-center gap-1.5 mb-3 text-xs uppercase tracking-wider">
              <Sparkles size={14} /> 3D CAD 核心建模快捷键 (Blender 风格)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div
                className={`p-2.5 rounded-lg flex items-center justify-between border ${isLight ? "bg-gray-50 border-gray-200" : "bg-[#0d1117] border-[#30363d]"
                  }`}
              >
                <span className={isLight ? "text-gray-700 font-medium" : "text-gray-300"}>
                  新建基本体 (立方体/圆柱/球)
                </span>
                <kbd className="px-2 py-0.5 bg-cyan-500/10 text-cyan-600 dark:text-cyan-300 border border-cyan-500/30 rounded font-mono text-[10px]">
                  Shift + A
                </kbd>
              </div>

              <div
                className={`p-2.5 rounded-lg flex items-center justify-between border ${isLight ? "bg-gray-50 border-gray-200" : "bg-[#0d1117] border-[#30363d]"
                  }`}
              >
                <span className={isLight ? "text-gray-700 font-medium" : "text-gray-300"}>右键动作上下文菜单</span>
                <kbd className="px-2 py-0.5 bg-cyan-500/10 text-cyan-600 dark:text-cyan-300 border border-cyan-500/30 rounded font-mono text-[10px]">
                  鼠标右键
                </kbd>
              </div>

              <div
                className={`p-2.5 rounded-lg flex items-center justify-between border ${isLight ? "bg-gray-50 border-gray-200" : "bg-[#0d1117] border-[#30363d]"
                  }`}
              >
                <span className={isLight ? "text-gray-700 font-medium" : "text-gray-300"}>极速命令搜索面板</span>
                <kbd className="px-2 py-0.5 bg-cyan-500/10 text-cyan-600 dark:text-cyan-300 border border-cyan-500/30 rounded font-mono text-[10px]">
                  F3 / Space
                </kbd>
              </div>

              <div
                className={`p-2.5 rounded-lg flex items-center justify-between border ${isLight ? "bg-gray-50 border-gray-200" : "bg-[#0d1117] border-[#30363d]"
                  }`}
              >
                <span className={isLight ? "text-gray-700 font-medium" : "text-gray-300"}>棱边倒圆角 (Fillet)</span>
                <kbd className="px-2 py-0.5 bg-cyan-500/10 text-cyan-600 dark:text-cyan-300 border border-cyan-500/30 rounded font-mono text-[10px]">
                  Ctrl + B
                </kbd>
              </div>
            </div>
          </section>

          {/* 3. 视口漫游手势说明 */}
          <section>
            <h3 className="text-emerald-500 font-bold flex items-center gap-1.5 mb-3 text-xs uppercase tracking-wider">
              <Compass size={14} /> 3D 视口相机视角漫游指南
            </h3>
            <div
              className={`p-3.5 rounded-xl border space-y-2 leading-relaxed ${isLight ? "bg-emerald-50/50 border-emerald-200 text-gray-700" : "bg-emerald-950/20 border-emerald-800/30 text-emerald-100"
                }`}
            >
              <div className="flex items-center gap-2">
                <span className="font-bold text-emerald-600 dark:text-emerald-400">旋转视口：</span>
                <span>鼠标左键按住拖动 (Orbit)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-emerald-600 dark:text-emerald-400">平移视口：</span>
                <span>鼠标右键按住拖动 / Shift + 鼠标中键 (Pan)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-emerald-600 dark:text-emerald-400">缩放视口：</span>
                <span>鼠标滚轮滚动 (Zoom In/Out)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-emerald-600 dark:text-emerald-400">几何特征拾取：</span>
                <span>直接单击 3D 模型表面、棱边或顶点，即可在底部交互栏联动应用倒角、切削与草图打孔！</span>
              </div>
            </div>
          </section>
        </div>

        {/* 底部按钮栏 */}
        <div
          className={`h-14 px-6 border-t flex items-center justify-between ${isLight ? "bg-[#f8fafc] border-gray-200" : "bg-[#0d1117] border-[#30363d]"
            }`}
        >
          <span className={`text-[11px] ${isLight ? "text-gray-500" : "text-gray-400"}`}>
            · 筑梦先锋队 3D 图形化编程平台
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-bold transition active:scale-95 shadow-xs"
            style={{ backgroundColor: primaryBadgeBg, color: primaryBadgeText }}
          >
            知道了，开始创作
          </button>
        </div>
      </div>
    </div>
  );
};
