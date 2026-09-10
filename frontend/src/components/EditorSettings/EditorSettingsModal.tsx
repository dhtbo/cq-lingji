"use client";

import React, { useState } from "react";
import {
  X,
  Check,
  Bot,
  Sliders,
  Key,
  Globe,
  Cpu,
  Sparkles,
  Eye,
  EyeOff,
  RotateCcw,
  Wifi,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Code2,
  Blocks,
} from "lucide-react";
import { testAiApiConnection, DEFAULT_AI_CONFIG } from "@/lib/aiCadSkill";

export interface EditorSettings {
  colorMode: "light" | "dark";
  themeColor: string;
  themeName: string;
  syntaxCheck: boolean;
  indentGuides: boolean;
  translateErrors: boolean;
  toolboxPinned: boolean;
  defaultViewMode: "code" | "block";
  // 智能体配置 (OpenAI 兼容接口 / Gemini / DeepSeek)
  aiBaseUrl: string;
  aiApiKey: string;
  aiModel: string;
  aiEnableSkill: boolean;
  aiTemperature: number;
}

export interface ThemeColorOption {
  id: string;
  name: string;
  color: string;
  isLight: boolean;
}

export const THEME_COLOR_OPTIONS: ThemeColorOption[] = [
  { id: "yellow", name: "经典黄", color: "#FFDB29", isLight: true },
  { id: "blue", name: "清爽蓝", color: "#1677FF", isLight: false },
  { id: "green", name: "翠石绿", color: "#10B981", isLight: false },
  { id: "orange", name: "元气橙", color: "#FA541C", isLight: false },
  { id: "purple", name: "星辰紫", color: "#722ED1", isLight: false },
  { id: "pink", name: "桃花红", color: "#EB2F96", isLight: false },
];

export const DEFAULT_EDITOR_SETTINGS: EditorSettings = {
  colorMode: "dark",
  themeColor: "#FFDB29",
  themeName: "经典黄",
  syntaxCheck: true,
  indentGuides: true,
  translateErrors: true,
  toolboxPinned: false,
  defaultViewMode: "code",
  aiBaseUrl: DEFAULT_AI_CONFIG.baseUrl,
  aiApiKey: DEFAULT_AI_CONFIG.apiKey,
  aiModel: DEFAULT_AI_CONFIG.model,
  aiEnableSkill: DEFAULT_AI_CONFIG.enableSkill,
  aiTemperature: DEFAULT_AI_CONFIG.temperature,
};

const RECOMMENDED_MODELS = [
  { id: "gemini-3.8-flash-low", label: "gemini-3.8-flash-low", tag: "极速推荐 2~3s" },
  { id: "gemini-3.8-flash-medium", label: "gemini-3.8-flash-medium", tag: "深度思考" },
  { id: "gemini-2.5-flash", label: "gemini-2.5-flash", tag: "稳定兼顾" },
  { id: "gpt-4o-mini", label: "gpt-4o-mini", tag: "OpenAI官方" },
];

interface EditorSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: EditorSettings;
  onUpdateSettings: (newSettings: EditorSettings) => void;
  initialTab?: "general" | "ai";
}

export const EditorSettingsModal: React.FC<EditorSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  initialTab = "general",
}) => {
  const [activeTab, setActiveTab] = useState<"general" | "ai">(initialTab);
  const [showApiKey, setShowApiKey] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    latencyMs?: number;
    message?: string;
    rawReply?: string;
  } | null>(null);

  if (!isOpen) return null;

  const updateSetting = <K extends keyof EditorSettings>(key: K, value: EditorSettings[K]) => {
    onUpdateSettings({
      ...settings,
      [key]: value,
    });
  };

  const handleSelectThemeColor = (opt: ThemeColorOption) => {
    onUpdateSettings({
      ...settings,
      themeColor: opt.color,
      themeName: opt.name,
    });
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setTestResult(null);
    try {
      const res = await testAiApiConnection(
        settings.aiBaseUrl || DEFAULT_AI_CONFIG.baseUrl,
        settings.aiApiKey || DEFAULT_AI_CONFIG.apiKey,
        settings.aiModel || DEFAULT_AI_CONFIG.model
      );
      setTestResult(res);
    } catch (e: any) {
      setTestResult({
        success: false,
        message: `测试异常: ${e.message}`,
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleResetAiDefaults = () => {
    onUpdateSettings({
      ...settings,
      aiBaseUrl: DEFAULT_AI_CONFIG.baseUrl,
      aiApiKey: DEFAULT_AI_CONFIG.apiKey,
      aiModel: DEFAULT_AI_CONFIG.model,
      aiEnableSkill: DEFAULT_AI_CONFIG.enableSkill,
      aiTemperature: DEFAULT_AI_CONFIG.temperature,
    });
    setTestResult(null);
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-xs animate-fadeIn select-none p-4">
      <div className="w-[580px] max-w-[95%] bg-white rounded-2xl shadow-2xl overflow-hidden text-gray-800 border border-gray-100 flex flex-col">
        {/* 顶部标题与选项卡导航 */}
        <div className="flex items-center justify-between px-6 pt-4 pb-2 border-b border-gray-100">
          <div className="flex items-center space-x-2">
            <h2 className="text-base font-bold text-gray-900 mr-2">工作台偏好设置</h2>
            <div className="flex items-center p-0.5 bg-gray-100 rounded-lg text-xs font-semibold">
              <button
                onClick={() => setActiveTab("general")}
                className={`px-3 py-1 rounded-md transition flex items-center gap-1.5 ${
                  activeTab === "general"
                    ? "bg-white text-gray-900 shadow-xs font-bold"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Sliders size={13} />
                <span>偏好与主题</span>
              </button>
              <button
                onClick={() => setActiveTab("ai")}
                className={`px-3 py-1 rounded-md transition flex items-center gap-1.5 ${
                  activeTab === "ai"
                    ? "bg-white text-purple-700 shadow-xs font-bold"
                    : "text-gray-600 hover:text-purple-700"
                }`}
              >
                <Bot size={13} />
                <span>3D 编程智能体</span>
              </button>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
            title="关闭设置"
          >
            <X size={18} />
          </button>
        </div>

        {/* 设置项主体 */}
        <div className="p-6 space-y-5 text-sm max-h-[70vh] overflow-y-auto">
          {/* TAB 1: 偏好与主题 */}
          {activeTab === "general" && (
            <div className="space-y-5">
              {/* 1. 主题模式切换 (白天模式 / 黑夜模式) */}
              <div className="flex items-start justify-between">
                <span className="font-medium text-gray-700 pt-2 min-w-[72px]">主题模式：</span>
                <div className="flex-1 flex items-center justify-center space-x-6 pl-2">
                  {/* 白天模式卡片 */}
                  <div
                    onClick={() => updateSetting("colorMode", "light")}
                    className="flex flex-col items-center cursor-pointer group"
                  >
                    <div
                      className={`w-28 h-20 rounded-xl overflow-hidden border-2 relative transition shadow-xs ${
                        settings.colorMode === "light"
                          ? "border-amber-500 ring-2 ring-amber-400/30"
                          : "border-gray-200 opacity-70 group-hover:opacity-100"
                      }`}
                    >
                      <div className="w-full h-4 bg-amber-400"></div>
                      <div className="w-full h-16 bg-[#f8fafc] flex p-1 space-x-1">
                        <div className="w-1/3 h-full bg-white rounded border border-gray-200"></div>
                        <div className="w-2/3 h-full bg-white rounded border border-gray-200"></div>
                      </div>
                      {settings.colorMode === "light" && (
                        <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-amber-500 text-gray-900 flex items-center justify-center">
                          <Check size={10} className="stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <span
                      className={`text-xs mt-1.5 font-medium ${
                        settings.colorMode === "light" ? "text-amber-600 font-bold" : "text-gray-500"
                      }`}
                    >
                      白天模式
                    </span>
                  </div>

                  {/* 黑夜模式卡片 */}
                  <div
                    onClick={() => updateSetting("colorMode", "dark")}
                    className="flex flex-col items-center cursor-pointer group"
                  >
                    <div
                      className={`w-28 h-20 rounded-xl overflow-hidden border-2 relative transition shadow-xs ${
                        settings.colorMode === "dark"
                          ? "border-amber-500 ring-2 ring-amber-400/30"
                          : "border-gray-200 opacity-70 group-hover:opacity-100"
                      }`}
                    >
                      <div className="w-full h-4 bg-amber-400"></div>
                      <div className="w-full h-16 bg-[#0d1117] flex p-1 space-x-1">
                        <div className="w-1/3 h-full bg-[#161b22] rounded border border-gray-800"></div>
                        <div className="w-2/3 h-full bg-[#161b22] rounded border border-gray-800"></div>
                      </div>
                      {settings.colorMode === "dark" && (
                        <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-amber-500 text-gray-900 flex items-center justify-center">
                          <Check size={10} className="stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <span
                      className={`text-xs mt-1.5 font-medium ${
                        settings.colorMode === "dark" ? "text-amber-600 font-bold" : "text-gray-500"
                      }`}
                    >
                      黑夜模式
                    </span>
                  </div>
                </div>
              </div>

              <div className="h-px bg-gray-100 my-1"></div>

              {/* 2. 主题色彩 */}
              <div className="flex items-start justify-between">
                <span className="font-medium text-gray-700 pt-1 min-w-[72px]">主题配色：</span>
                <div className="flex-1 flex flex-wrap items-center justify-between gap-1 pl-2">
                  {THEME_COLOR_OPTIONS.map((opt) => {
                    const isSelected = settings.themeColor.toLowerCase() === opt.color.toLowerCase();
                    return (
                      <button
                        key={opt.id}
                        onClick={() => handleSelectThemeColor(opt)}
                        className={`px-2.5 py-1.5 rounded-xl border flex items-center space-x-1.5 transition ${
                          isSelected
                            ? "border-amber-500 bg-amber-50 text-amber-900 font-bold shadow-xs ring-1 ring-amber-400/40"
                            : "border-gray-200 hover:border-gray-300 text-gray-700 bg-white"
                        }`}
                        title={`选用 ${opt.name} 作为主色调`}
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-full inline-block shadow-xs flex-shrink-0"
                          style={{ backgroundColor: opt.color }}
                        />
                        <span className="text-xs">{opt.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="h-px bg-gray-100 my-1"></div>

              {/* 3. 语法纠错 */}
              <div className="flex items-center justify-between py-1">
                <span className="font-medium text-gray-700">语法纠错：</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.syntaxCheck}
                    onChange={(e) => updateSetting("syntaxCheck", e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-12 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#22c55e]"></div>
                </label>
              </div>

              {/* 4. 缩进提示 */}
              <div className="flex items-center justify-between py-1">
                <span className="font-medium text-gray-700">缩进提示：</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.indentGuides}
                    onChange={(e) => updateSetting("indentGuides", e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-12 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#22c55e]"></div>
                </label>
              </div>

              {/* 5. 报错提示汉化 */}
              <div className="flex items-center justify-between py-1">
                <span className="font-medium text-gray-700">报错提示汉化：</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.translateErrors}
                    onChange={(e) => updateSetting("translateErrors", e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-12 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#22c55e]"></div>
                </label>
              </div>

              {/* 6. 积木盒常驻 */}
              <div className="flex items-center justify-between py-1">
                <span className="font-medium text-gray-700">积木盒常驻：</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.toolboxPinned}
                    onChange={(e) => updateSetting("toolboxPinned", e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-12 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#22c55e]"></div>
                </label>
              </div>

              <div className="h-px bg-gray-100 my-1"></div>

              {/* 7. 默认工作区视图模式 (代码优先，可配置积木) */}
              <div className="flex items-center justify-between py-1">
                <div>
                  <span className="font-medium text-gray-700">默认工作区模式：</span>
                  <div className="text-[11px] text-gray-400">打开或刷新工作台时的首选编辑视图</div>
                </div>
                <div className="flex items-center p-0.5 bg-gray-100 rounded-lg text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => updateSetting("defaultViewMode", "code")}
                    className={`px-3 py-1.5 rounded-md transition flex items-center gap-1.5 ${
                      settings.defaultViewMode !== "block"
                        ? "bg-white text-gray-900 shadow-xs font-bold"
                        : "text-gray-500 hover:text-gray-800"
                    }`}
                  >
                    <Code2 size={13} />
                    <span>代码模式 (默认)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => updateSetting("defaultViewMode", "block")}
                    className={`px-3 py-1.5 rounded-md transition flex items-center gap-1.5 ${
                      settings.defaultViewMode === "block"
                        ? "bg-white text-amber-600 shadow-xs font-bold"
                        : "text-gray-500 hover:text-gray-800"
                    }`}
                  >
                    <Blocks size={13} />
                    <span>积木模式</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: 3D 编程智能体配置 */}
          {activeTab === "ai" && (
            <div className="space-y-4 text-xs">
              {/* 提示信息卡片 */}
              <div className="p-3 bg-purple-50 border border-purple-200/80 rounded-xl text-purple-900 leading-relaxed flex items-start gap-2">
                <Sparkles size={16} className="text-purple-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-xs text-purple-950">
                    OpenAI 兼容智能体接口 · Gemini 3.8 / DeepSeek 驱动
                  </div>
                  <div className="text-[11px] text-purple-800/80 mt-0.5">
                    支持使用 OpenAI SDK 兼容协议接入 Gemini、DeepSeek 或自定义大模型服务。
                  </div>
                </div>
              </div>

              {/* 1. 模型接口地址 (Base URL) */}
              <div className="space-y-1">
                <label className="font-bold text-gray-700 flex items-center gap-1">
                  <Globe size={13} className="text-purple-600" />
                  <span>接口地址 (Base URL)</span>
                </label>
                <input
                  type="text"
                  value={settings.aiBaseUrl || ""}
                  onChange={(e) => updateSetting("aiBaseUrl", e.target.value)}
                  placeholder="https://ag.ljcode.cn/v1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono text-gray-900 bg-white focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
                />
                <p className="text-[10px] text-gray-400">
                  支持 OpenAI 标准 Chat Completions 协议地址，默认为 https://ag.ljcode.cn/v1
                </p>
              </div>

              {/* 2. API Key */}
              <div className="space-y-1">
                <label className="font-bold text-gray-700 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Key size={13} className="text-purple-600" />
                    <span>接口密钥 (API Key)</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowApiKey((prev) => !prev)}
                    className="text-[11px] text-purple-600 hover:text-purple-800 flex items-center gap-0.5"
                  >
                    {showApiKey ? <EyeOff size={12} /> : <Eye size={12} />}
                    <span>{showApiKey ? "隐藏明文" : "显示明文"}</span>
                  </button>
                </label>
                <div className="relative">
                  <input
                    type={showApiKey ? "text" : "password"}
                    value={settings.aiApiKey || ""}
                    onChange={(e) => updateSetting("aiApiKey", e.target.value)}
                    placeholder="请输入 API Key"
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-xs font-mono text-gray-900 bg-white focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
                  />
                </div>
              </div>

              {/* 3. 模型名称 (Model) */}
              <div className="space-y-1.5">
                <label className="font-bold text-gray-700 flex items-center gap-1">
                  <Cpu size={13} className="text-purple-600" />
                  <span>智能体模型 (Model Name)</span>
                </label>
                <input
                  type="text"
                  value={settings.aiModel || ""}
                  onChange={(e) => updateSetting("aiModel", e.target.value)}
                  placeholder="gemini-3.8-flash-medium"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono text-gray-900 bg-white focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
                />

                {/* 推荐模型标签 */}
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <span className="text-[10px] text-gray-400 font-medium">推荐选用:</span>
                  {RECOMMENDED_MODELS.map((rm) => (
                    <button
                      key={rm.id}
                      type="button"
                      onClick={() => updateSetting("aiModel", rm.id)}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-mono border transition ${
                        settings.aiModel === rm.id
                          ? "bg-purple-100 border-purple-400 text-purple-800 font-bold"
                          : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {rm.label} ({rm.tag})
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. 三维数字编程 Skill (火星拓荒者 + CadQuery B-Rep) */}
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Sparkles size={14} className="text-amber-500" />
                    <span className="font-bold text-gray-800 text-xs">
                      启用三维数字编程智能体专业 Skill
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.aiEnableSkill !== false}
                      onChange={(e) => updateSetting("aiEnableSkill", e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-5 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  基于《星际工程师：火星拓荒者计划》16 课航天拓扑工程体系与 B-Rep
                  建模心智注入，大幅提升智能体生成代码的物理可行性与拓扑稳定性。
                </p>
              </div>

              {/* 5. 连通性测试与快速恢复 */}
              <div className="pt-2 flex items-center justify-between border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleResetAiDefaults}
                  className="text-gray-500 hover:text-gray-700 text-[11px] flex items-center gap-1 transition"
                  title="重置为默认 Gemini 3.8 接口与密钥"
                >
                  <RotateCcw size={12} />
                  <span>恢复默认智能体配置</span>
                </button>

                <button
                  type="button"
                  disabled={testingConnection}
                  onClick={handleTestConnection}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-xs transition active:scale-95 disabled:opacity-50"
                >
                  {testingConnection ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Wifi size={13} />
                  )}
                  <span>{testingConnection ? "测试连接中..." : "测试接口连通性"}</span>
                </button>
              </div>

              {/* 测试结果提示 */}
              {testResult && (
                <div
                  className={`p-2.5 rounded-lg text-xs border flex items-start gap-2 transition animate-fadeIn ${
                    testResult.success
                      ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                      : "bg-rose-50 border-rose-300 text-rose-800"
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 size={15} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle size={15} className="text-rose-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <span>{testResult.message}</span>
                      {testResult.latencyMs && (
                        <span className="font-mono text-[10px] px-1 bg-white/70 rounded border">
                          {testResult.latencyMs}ms
                        </span>
                      )}
                    </div>
                    {testResult.rawReply && (
                      <div className="text-[11px] opacity-90 mt-0.5 italic">
                        模型应答: "{testResult.rawReply}"
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 底部完成按钮 */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-900 hover:bg-gray-800 text-amber-400 font-bold text-xs rounded-xl shadow-xs transition active:scale-95"
          >
            完成设置
          </button>
        </div>
      </div>
    </div>
  );
};
