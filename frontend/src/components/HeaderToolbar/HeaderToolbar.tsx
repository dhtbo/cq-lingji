"use client";

import React, { useState, useRef } from "react";
import {
  ChevronLeft,
  Home,
  Folder,
  Settings,
  HelpCircle,
  Code2,
  Check,
  Save,
  Share2,
  Download,
  Trophy,
  ChevronDown,
  User,
  Blocks,
  Columns3,
  Sparkles,
  FileCode,
  FileUp,
  FileDown,
  FolderOpen,
  Printer,
  Sun,
  Moon,
} from "lucide-react";
import { CAD_TEMPLATES, CadTemplate } from "../Templates/cadTemplates";
import { HelpModal } from "./HelpModal";
import {
  EditorSettings,
  THEME_COLOR_OPTIONS,
  ThemeColorOption,
} from "../EditorSettings/EditorSettingsModal";

export type ViewMode = "code" | "block";

interface HeaderToolbarProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  projectName: string;
  onProjectNameChange: (name: string) => void;
  onSave: () => void;
  onLoadSavedProject?: () => void;
  isSaved?: boolean;
  onRun: () => void;
  onExportStl: () => void;
  onExportStep: () => void;
  onDownloadPy?: () => void;
  onDownloadCadQueryPy?: () => void;
  onExportProject?: () => void;
  onImportProject?: (file: File) => void;
  saveToastMsg?: string | null;
  onSelectTemplate: (template: CadTemplate) => void;
  onOpenMissions?: () => void;
  onOpenPrintChecker?: () => void;
  loading: boolean;
  execTime?: number | null;
  backendOnline: boolean;
  settings: EditorSettings;
  onOpenSettings: () => void;
  onSelectThemeColor: (opt: ThemeColorOption) => void;
  onUpdateSettings?: (newSettings: EditorSettings) => void;
}

export const HeaderToolbar: React.FC<HeaderToolbarProps> = ({
  viewMode,
  onViewModeChange,
  projectName,
  onProjectNameChange,
  onSave,
  onLoadSavedProject,
  isSaved = true,
  onRun,
  onExportStl,
  onExportStep,
  onDownloadPy,
  onDownloadCadQueryPy,
  onExportProject,
  onImportProject,
  saveToastMsg,
  onSelectTemplate,
  onOpenMissions,
  onOpenPrintChecker,
  loading,
  execTime,
  backendOnline,
  settings,
  onOpenSettings,
  onSelectThemeColor,
  onUpdateSettings,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [showFileMenu, setShowFileMenu] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showHelpMenu, setShowHelpMenu] = useState(false);
  const [showShareToast, setShowShareToast] = useState(false);
  const [showLoginToast, setShowLoginToast] = useState(false);

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onImportProject) {
      onImportProject(file);
    }
    if (e.target) e.target.value = "";
  };

  // 判断是否为经典黄主题 ( 配色)
  const isYellowTheme =
    settings.themeColor.toLowerCase() === "#ffdb29" ||
    settings.themeColor.toLowerCase() === "#ffc400" ||
    settings.themeName === "经典黄";

  // 配色计算
  const headerBg = isYellowTheme ? "#FFDB29" : settings.themeColor;
  const iconTextColor = isYellowTheme ? "text-[#D97E00]" : "text-white";
  const iconHoverBg = isYellowTheme ? "hover:bg-black/5" : "hover:bg-white/10";
  const dividerColor = isYellowTheme ? "bg-[#D97E00]/25" : "bg-white/20";
  const switchContainerBg = isYellowTheme ? "bg-[#FFCE1C]" : "bg-black/20";
  const switchInactiveText = isYellowTheme
    ? "text-[#D97E00] hover:text-[#B46700]"
    : "text-white/80 hover:text-white";
  const switchActiveBg = isYellowTheme
    ? "bg-white text-[#D97E00] shadow-xs"
    : "bg-white text-gray-950 shadow-xs";
  const inputBg = isYellowTheme
    ? "bg-[#FFCE1C] text-[#D97E00] placeholder-[#D97E00]/60 border-transparent focus:border-[#D97E00]"
    : "bg-white/20 text-white placeholder-white/70 border-transparent focus:border-white";

  const handleShare = () => {
    setShowShareToast(true);
    setTimeout(() => setShowShareToast(false), 2500);
  };

  const handleLogin = () => {
    setShowLoginToast(true);
    setTimeout(() => setShowLoginToast(false), 2500);
  };

  return (
    <>
      <header
        style={{ backgroundColor: headerBg }}
        className="relative z-[150] h-10 px-3 flex items-center justify-between select-none shadow-xs border-b border-black/5 transition-colors duration-200"
      >
        {/* 左侧：< 🏠 | 📁▾ ⚙️▾ ❓▾ </> */}
        <div className="flex items-center space-x-1">
          {/* 返回按钮 < */}
          <button
            onClick={() => window.history.length > 1 ? window.history.back() : window.location.reload()}
            title="返回上一页 / 刷新"
            className={`p-1 rounded-md ${iconTextColor} ${iconHoverBg} transition active:scale-95`}
          >
            <ChevronLeft size={17} className="stroke-[2.6]" />
          </button>

          {/* 首页 🏠 */}
          <button
            onClick={() => window.location.href = "/"}
            title="返回工作台首页"
            className={`p-1 rounded-md ${iconTextColor} ${iconHoverBg} transition active:scale-95`}
          >
            <Home size={16} className="stroke-[2.4]" />
          </button>

          {/* 竖线分隔符 | */}
          <div className={`h-4 w-[1.5px] ${dividerColor} mx-1`} />

          {/* 文件菜单 📁 ▾ */}
          <div className="relative">
            <button
              onClick={() => {
                setShowFileMenu((prev) => !prev);
                setShowSettingsMenu(false);
                setShowHelpMenu(false);
              }}
              className={`px-1.5 py-1 rounded-md ${iconTextColor} ${iconHoverBg} font-bold text-xs flex items-center space-x-0.5 transition active:scale-95`}
              title="作品与模板库文件菜单"
            >
              <Folder size={15} className="fill-current stroke-[2]" />
              <ChevronDown size={11} className="stroke-[2.5]" />
            </button>

            {showFileMenu && (
              <div
                className="absolute top-full left-0 mt-1.5 w-52 bg-white rounded-xl shadow-xl py-1.5 z-[250] text-xs border border-gray-100 text-gray-800 animate-fadeIn"
                onMouseLeave={() => setShowFileMenu(false)}
              >
                <div className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  作品工程
                </div>
                <button
                  onClick={() => {
                    onSave();
                    setShowFileMenu(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-amber-50 hover:text-amber-700 flex items-center justify-between"
                >
                  <span className="flex items-center gap-1.5">
                    <Save size={13} className="text-amber-600" />
                    <span>保存工程到本地暂存</span>
                  </span>
                  <span className="text-[10px] text-gray-400">Ctrl+S</span>
                </button>
                {onLoadSavedProject && (
                  <button
                    onClick={() => {
                      onLoadSavedProject();
                      setShowFileMenu(false);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-amber-50 hover:text-amber-700 flex items-center justify-between"
                  >
                    <span className="flex items-center gap-1.5">
                      <FolderOpen size={13} className="text-amber-600" />
                      <span>从本地暂存载入工程</span>
                    </span>
                    <span className="text-[10px] bg-amber-100 text-amber-800 px-1 rounded font-mono">Load</span>
                  </button>
                )}
                {onDownloadPy && (
                  <button
                    onClick={() => {
                      onDownloadPy();
                      setShowFileMenu(false);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-amber-50 hover:text-amber-700 flex items-center justify-between"
                  >
                    <span className="flex items-center gap-1.5">
                      <FileCode size={13} className="text-blue-600" />
                      <span>下载 build123d 源码 (.py)</span>
                    </span>
                    <span className="text-[10px] bg-blue-100 text-blue-700 px-1 rounded font-mono">B3D</span>
                  </button>
                )}
                {onDownloadCadQueryPy && (
                  <button
                    onClick={() => {
                      onDownloadCadQueryPy();
                      setShowFileMenu(false);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-amber-50 hover:text-amber-700 flex items-center justify-between"
                  >
                    <span className="flex items-center gap-1.5">
                      <FileCode size={13} className="text-amber-600" />
                      <span>导出为 CadQuery 脚本 (.py) [单向]</span>
                    </span>
                    <span className="text-[10px] bg-amber-100 text-amber-700 px-1 rounded font-mono">CQ</span>
                  </button>
                )}
                {onExportProject && (
                  <button
                    onClick={() => {
                      onExportProject();
                      setShowFileMenu(false);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-amber-50 hover:text-amber-700 flex items-center justify-between"
                  >
                    <span className="flex items-center gap-1.5">
                      <FileDown size={13} className="text-purple-600" />
                      <span>导出完整工程存档 (.cq.json)</span>
                    </span>
                    <span className="text-[10px] bg-purple-100 text-purple-700 px-1 rounded font-mono">Zip</span>
                  </button>
                )}
                {onImportProject && (
                  <button
                    onClick={() => {
                      fileInputRef.current?.click();
                      setShowFileMenu(false);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-amber-50 hover:text-amber-700 flex items-center justify-between"
                  >
                    <span className="flex items-center gap-1.5">
                      <FileUp size={13} className="text-emerald-600" />
                      <span>打开本地文件 (.py / .json)...</span>
                    </span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1 rounded font-mono">Open</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    onExportStep();
                    setShowFileMenu(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-amber-50 hover:text-amber-700 flex items-center justify-between"
                >
                  <span className="flex items-center gap-1.5">
                    <Download size={13} className="text-teal-600" />
                    <span>导出工业实体 (.step)</span>
                  </span>
                  <span className="text-[10px] bg-teal-100 text-teal-700 px-1 rounded font-mono">CAD</span>
                </button>
                {onOpenPrintChecker && (
                  <button
                    onClick={() => {
                      onOpenPrintChecker();
                      setShowFileMenu(false);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-amber-50 hover:text-amber-700 flex items-center justify-between"
                  >
                    <span className="flex items-center gap-1.5">
                      <Printer size={13} className="text-emerald-600" />
                      <span>3D打印体检与流形评估</span>
                    </span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1 rounded font-mono">Check</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    onExportStl();
                    setShowFileMenu(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-amber-50 hover:text-amber-700 flex items-center justify-between"
                >
                  <span className="flex items-center gap-1.5">
                    <Download size={13} className="text-cyan-600" />
                    <span>导出3D打印网格 (.stl)</span>
                  </span>
                  <span className="text-[10px] bg-cyan-100 text-cyan-700 px-1 rounded font-mono">Mesh</span>
                </button>

                <div className="my-1 border-t border-gray-100" />

                <div className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  精选教学案例模板
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {CAD_TEMPLATES.map((tpl) => (
                    <button
                      key={tpl.id}
                      onClick={() => {
                        onSelectTemplate(tpl);
                        setShowFileMenu(false);
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-amber-50 hover:text-amber-700 transition truncate"
                    >
                      {tpl.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 设置菜单 ⚙️ ▾ */}
          <div className="relative">
            <button
              onClick={() => {
                setShowSettingsMenu((prev) => !prev);
                setShowFileMenu(false);
                setShowHelpMenu(false);
              }}
              className={`px-1.5 py-1 rounded-md ${iconTextColor} ${iconHoverBg} font-bold text-xs flex items-center space-x-0.5 transition active:scale-95`}
              title="设置菜单与主题配色"
            >
              <Settings size={15} className="stroke-[2.2]" />
              <ChevronDown size={11} className="stroke-[2.5]" />
            </button>

            {showSettingsMenu && (
              <div
                className="absolute top-full left-0 mt-1.5 w-44 bg-white rounded-xl shadow-xl py-1.5 z-[250] text-xs border border-gray-100 text-gray-800 animate-fadeIn"
                onMouseLeave={() => setShowSettingsMenu(false)}
              >
                <div className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  主题色彩
                </div>
                <div className="grid grid-cols-3 gap-1.5 px-3 py-1.5">
                  {THEME_COLOR_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => {
                        onSelectThemeColor(opt);
                        setShowSettingsMenu(false);
                      }}
                      title={opt.name}
                      className="w-7 h-7 rounded-lg flex items-center justify-center border border-black/10 hover:scale-110 transition shadow-xs"
                      style={{ backgroundColor: opt.color }}
                    >
                      {settings.themeColor.toLowerCase() === opt.color.toLowerCase() && (
                        <Check size={12} className={opt.isLight ? "text-gray-900" : "text-white"} />
                      )}
                    </button>
                  ))}
                </div>

                <div className="my-1 border-t border-gray-100" />

                {onUpdateSettings && (
                  <button
                    onClick={() => {
                      const nextMode = settings.colorMode === "light" ? "dark" : "light";
                      onUpdateSettings({ ...settings, colorMode: nextMode });
                      setShowSettingsMenu(false);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-emerald-50 hover:text-emerald-700 flex items-center justify-between transition-colors"
                  >
                    <span className="flex items-center gap-1.5">
                      {settings.colorMode === "light" ? (
                        <Moon size={13} className="text-indigo-500" />
                      ) : (
                        <Sun size={13} className="text-amber-500" />
                      )}
                      <span>{settings.colorMode === "light" ? "切换至深色黑夜" : "切换至浅色白天"}</span>
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono">
                      {settings.colorMode === "light" ? "Dark" : "Light"}
                    </span>
                  </button>
                )}

                <button
                  onClick={() => {
                    onOpenSettings();
                    setShowSettingsMenu(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-amber-50 hover:text-amber-700 flex items-center justify-between"
                >
                  <span>编辑器高级偏好</span>
                  <Settings size={12} className="text-gray-400" />
                </button>
              </div>
            )}
          </div>

          {/* 帮助菜单 ❓ ▾ */}
          <div className="relative">
            <button
              onClick={() => {
                setShowHelpMenu((prev) => !prev);
                setShowFileMenu(false);
                setShowSettingsMenu(false);
              }}
              className={`px-1.5 py-1 rounded-md ${iconTextColor} ${iconHoverBg} font-bold text-xs flex items-center space-x-0.5 transition active:scale-95`}
              title="帮助中心与启发式关卡"
            >
              <HelpCircle size={15} className="stroke-[2.2]" />
              <ChevronDown size={11} className="stroke-[2.5]" />
            </button>

            {showHelpMenu && (
              <div
                className="absolute top-full left-0 mt-1.5 w-44 bg-white rounded-xl shadow-xl py-1.5 z-[250] text-xs border border-gray-100 text-gray-800 animate-fadeIn"
                onMouseLeave={() => setShowHelpMenu(false)}
              >
                <button
                  onClick={() => {
                    setShowHelp(true);
                    setShowHelpMenu(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-amber-50 hover:text-amber-700 flex items-center justify-between"
                >
                  <span> 帮助中心</span>
                  <HelpCircle size={12} className="text-amber-500" />
                </button>

                {onOpenMissions && (
                  <button
                    onClick={() => {
                      onOpenMissions();
                      setShowHelpMenu(false);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-amber-50 hover:text-amber-700 flex items-center justify-between"
                  >
                    <span>火星拓荒者挑战关卡</span>
                    <Trophy size={12} className="text-amber-500" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* 右侧垂直分隔条 */}
          <div className={`h-4 w-[1.5px] ${dividerColor} mx-1`} />

          {/* 代码/积木切换器 (二态模式：代码优先，可一键切换积木) */}
          <div
            className={`flex items-center rounded-lg p-0.5 ${switchContainerBg} shadow-inner transition-colors duration-200`}
          >
            <button
              onClick={() => onViewModeChange("code")}
              className={`flex items-center space-x-1 px-2.5 py-0.5 rounded-md font-bold text-xs transition active:scale-95 ${viewMode === "code" ? switchActiveBg : switchInactiveText
                }`}
              title="纯代码模式 (Python + 3D)"
            >
              <Code2 size={13} className="stroke-[2.4]" />
              <span>代码</span>
            </button>
            <button
              onClick={() => onViewModeChange("block")}
              className={`flex items-center space-x-1 px-2.5 py-0.5 rounded-md font-bold text-xs transition active:scale-95 ${viewMode === "block" ? switchActiveBg : switchInactiveText
                }`}
              title="图形积木模式 (Blockly + 3D)"
            >
              <Blocks size={13} className="stroke-[2.4]" />
              <span>积木</span>
            </button>
          </div>
        </div>

        {/* 中间：工程文件名输入框 */}
        <div className="flex-1 max-w-xs mx-3">
          <input
            type="text"
            value={projectName}
            onChange={(e) => onProjectNameChange(e.target.value)}
            className={`w-full text-center font-bold text-xs px-2.5 py-1 rounded-md border focus:outline-hidden transition shadow-inner ${inputBg}`}
            placeholder="项目名称..."
          />
        </div>

        {/* 右侧：保存、分享、登录 */}
        <div className="flex items-center space-x-2">
          {/* 3D 打印体检按钮 (LogoUp 3D 特色) */}
          {onOpenPrintChecker && (
            <button
              onClick={onOpenPrintChecker}
              title="3D 打印前置体检（流形检查、尺寸合规、耗材与工时估算）"
              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition active:scale-95 flex items-center space-x-1"
            >
              <Printer size={13} />
              <span>打印体检</span>
            </button>
          )}

          {/* 保存按钮 (活力橙 #FF8C1A) */}
          <button
            onClick={onSave}
            title={isSaved ? "工程已保存 (Ctrl+S)" : "有未保存修改，点击保存 (Ctrl+S)"}
            className="px-3.5 py-1 bg-[#FF8C1A] hover:bg-[#E67A10] text-white text-xs font-bold rounded-lg shadow-xs transition active:scale-95 flex items-center space-x-1.5"
          >
            <Save size={13} />
            <span>保存</span>
            {!isSaved && <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />}
          </button>

          {/* 分享按钮 (海龟紫 #7869FF) */}
          <button
            onClick={handleShare}
            title="分享作品"
            className="px-3.5 py-1 bg-[#7869FF] hover:bg-[#6855FF] text-white text-xs font-bold rounded-lg shadow-xs transition active:scale-95"
          >
            分享
          </button>

          {/* 登录按钮 (琥珀金文本 #D97E00) */}
          <button
            onClick={handleLogin}
            title="登录 / 用户中心"
            className={`px-1.5 py-1 ${iconTextColor} hover:opacity-80 font-bold text-xs transition active:scale-95 flex items-center`}
          >
            登录
          </button>
        </div>
      </header>

      {/* 隐藏的文件输入组件，用于打开本地文件 */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelected}
        accept=".py,.json,.cq.json"
        className="hidden"
      />

      {/* 保存反馈 Toast */}
      {saveToastMsg && (
        <div className="fixed top-12 left-1/2 -translate-x-1/2 bg-emerald-700 text-white px-4 py-2 rounded-xl shadow-2xl text-xs font-semibold flex items-center gap-2 z-[350] animate-fadeIn border border-emerald-500/40">
          <Check size={14} className="text-emerald-200" />
          <span>{saveToastMsg}</span>
        </div>
      )}

      {/* 分享成功微提示 Toast */}
      {showShareToast && (
        <div className="fixed top-12 right-6 bg-gray-900/90 text-white text-xs px-3 py-2 rounded-lg shadow-xl z-50 animate-fadeIn flex items-center space-x-1.5 backdrop-blur-sm">
          <Sparkles size={14} className="text-amber-400" />
          <span>作品链接已就绪，可随时分享给同学！</span>
        </div>
      )}

      {/* 登录微提示 Toast */}
      {showLoginToast && (
        <div className="fixed top-12 right-6 bg-gray-900/90 text-white text-xs px-3 py-2 rounded-lg shadow-xl z-50 animate-fadeIn flex items-center space-x-1.5 backdrop-blur-sm">
          <User size={14} className="text-emerald-400" />
          <span>当前处于本地教学工作台模式，无需远程账号</span>
        </div>
      )}

      {/* 帮助中心模态弹窗 */}
      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} settings={settings} />
    </>
  );
};
