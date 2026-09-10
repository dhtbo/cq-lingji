"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  X,
  Printer,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Download,
  Box,
  Scale,
  Clock,
  Sparkles,
  ShieldCheck,
  Cpu,
} from "lucide-react";
import { EditorSettings } from "../EditorSettings/EditorSettingsModal";
import {
  analyzeCadPrintability,
  PrintabilityReport,
  PrintCheckItem,
} from "@/lib/api";

interface PrintCheckerModalProps {
  isOpen: boolean;
  onClose: () => void;
  code: string;
  onExportStl?: () => void;
  settings?: EditorSettings;
  files?: Record<string, string>;
  entrypoint?: string;
}

// 常见 3D 打印机热床预设
const BED_PRESETS = [
  { name: "标准 220×220×250 (Ender-3等)", x: 220, y: 220, z: 250 },
  { name: "拓竹 256×256×256 (Bambu X1/P1/A1)", x: 256, y: 256, z: 256 },
  { name: "大型 300×300×400 (CR-10/Neptune Plus)", x: 300, y: 300, z: 400 },
  { name: "迷你 180×180×180 (A1 mini/Prusa Mini)", x: 180, y: 180, z: 180 },
];

export const PrintCheckerModal: React.FC<PrintCheckerModalProps> = ({
  isOpen,
  onClose,
  code,
  onExportStl,
  settings,
  files,
  entrypoint,
}) => {
  const [bedSize, setBedSize] = useState({ x: 220, y: 220, z: 250 });
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<PrintabilityReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isLight = settings?.colorMode === "light";
  const themeColor = settings?.themeColor || "#FFDB29";
  const isYellowTheme =
    themeColor.toLowerCase() === "#ffdb29" ||
    themeColor.toLowerCase() === "#ffc400" ||
    settings?.themeName === "经典黄";

  const primaryBadgeText = isYellowTheme ? "#8A4B00" : "#ffffff";
  const primaryBadgeBg = isYellowTheme ? "#FFDB29" : themeColor;

  const runAnalysis = useCallback(async () => {
    if (!code.trim() && (!files || Object.keys(files).length === 0)) {
      setError("当前工程无代码，请先编写建模代码或载入案例");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await analyzeCadPrintability(code, bedSize, files, entrypoint);
      setReport(res);
      if (res.status === "error" && res.message) {
        setError(res.message);
      }
    } catch (err: any) {
      setError(err.message || "体检服务连接失败");
    } finally {
      setLoading(false);
    }
  }, [code, bedSize, files, entrypoint]);

  useEffect(() => {
    if (isOpen) {
      runAnalysis();
    }
  }, [isOpen, runAnalysis]);

  if (!isOpen) return null;

  // 综合得分与等级计算 (完美兼容后端 health_score 与标准评分结构)
  const score = report?.health_score ?? report?.score ?? 0;
  const grade =
    report?.grade ||
    (score >= 90 ? "A+" : score >= 80 ? "A" : score >= 70 ? "B" : score >= 60 ? "C" : "F");
  const volumeCm3 = report?.metrics?.volume_cm3 ?? report?.volume_cm3 ?? 0;
  const filamentWeightG =
    report?.metrics?.filament_weight_g ?? report?.estimated_filament_g ?? 0;
  const estimatedHours =
    report?.metrics?.estimated_hours ?? report?.estimated_hours ?? 0;

  // 综合细则项生成 (兼容 report.checks 与 issues 格式)
  const checks: PrintCheckItem[] =
    report?.checks && report.checks.length > 0
      ? report.checks
      : [
          {
            name: "热床成型边界核验 (Bed Bounds)",
            passed: report?.fits_bed ?? true,
            level: (report?.fits_bed ?? true) ? "success" : "error",
            detail: (report?.fits_bed ?? true)
              ? `模型尺寸位于 ${bedSize.x}×${bedSize.y}×${bedSize.z} mm 安全成型区内`
              : `模型尺寸超出目标打印机成型热床限制`,
          },
          {
            name: "封闭流形结构检测 (Watertight Manifold)",
            passed: report?.is_watertight ?? true,
            level: (report?.is_watertight ?? true) ? "success" : "warning",
            detail: (report?.is_watertight ?? true)
              ? "三维实体连续无破面漏水风险，切片软件可完美切片"
              : "检测到未封闭或非流形特征，切片可能需要支撑或修复",
          },
          {
            name: "3D 实体特征有效性",
            passed: (report?.is_solid ?? true) && volumeCm3 > 0,
            level: (report?.is_solid ?? true) ? "success" : "error",
            detail: (report?.is_solid ?? true)
              ? `检测到有效 3D 实体共 ${report?.solids_count ?? 1} 个，体积 ${volumeCm3} cm³`
              : "当前图形无封闭实体体素",
          },
        ];

  const getScoreColor = () => {
    if (score >= 90) return "text-emerald-500 border-emerald-500/30 bg-emerald-500/10";
    if (score >= 75) return "text-blue-500 border-blue-500/30 bg-blue-500/10";
    if (score >= 60) return "text-amber-500 border-amber-500/30 bg-amber-500/10";
    return "text-rose-500 border-rose-500/30 bg-rose-500/10";
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn p-4">
      <div
        className={`rounded-2xl w-full max-w-3xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden border transition-colors duration-200 ${
          isLight
            ? "bg-white border-gray-200 text-gray-800 shadow-xl shadow-black/10"
            : "bg-[#161b22] border-[#30363d] text-gray-200"
        }`}
      >
        {/* 顶部标题栏 */}
        <div
          className={`h-14 px-6 border-b flex items-center justify-between shrink-0 ${
            isLight ? "bg-[#f8fafc] border-gray-200" : "bg-[#0d1117] border-[#30363d]"
          }`}
        >
          <div className="flex items-center space-x-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center font-bold shadow-xs transition-colors"
              style={{ backgroundColor: primaryBadgeBg, color: primaryBadgeText }}
            >
              <Printer size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className={`text-sm font-bold tracking-wide ${isLight ? "text-gray-900" : "text-white"}`}>
                  3D 打印体检中心
                </h2>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                  LogoUp 3D 打印健康评估
                </span>
              </div>
              <p className={`text-[11px] ${isLight ? "text-gray-500" : "text-gray-400"}`}>
                智能流形检测、尺寸适配与制造物理耗材参数核验
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition ${
              isLight
                ? "text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                : "text-gray-400 hover:text-white hover:bg-white/10"
            }`}
          >
            <X size={18} />
          </button>
        </div>

        {/* 主体滚动区 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 热床机型快速选择器 */}
          <div
            className={`p-3 rounded-xl border flex flex-wrap items-center justify-between gap-2 text-xs ${
              isLight ? "bg-gray-50 border-gray-200" : "bg-black/20 border-[#30363d]"
            }`}
          >
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              <Cpu size={14} className="text-amber-500" />
              <span>目标打印机成型热床：</span>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={`${bedSize.x}x${bedSize.y}x${bedSize.z}`}
                onChange={(e) => {
                  const [x, y, z] = e.target.value.split("x").map(Number);
                  setBedSize({ x, y, z });
                }}
                className={`text-xs px-2.5 py-1 rounded-lg border outline-hidden font-medium ${
                  isLight
                    ? "bg-white border-gray-200 text-gray-800"
                    : "bg-[#0d1117] border-[#30363d] text-gray-200"
                }`}
              >
                {BED_PRESETS.map((p) => (
                  <option key={p.name} value={`${p.x}x${p.y}x${p.z}`}>
                    {p.name}
                  </option>
                ))}
              </select>
              <button
                onClick={runAnalysis}
                disabled={loading}
                className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold flex items-center gap-1 transition text-xs shadow-xs"
              >
                <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
                <span>重新体检</span>
              </button>
            </div>
          </div>

          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center space-y-3">
              <RefreshCw size={32} className="animate-spin text-amber-500" />
              <p className="text-xs font-semibold text-gray-400">
                正在通过 OpenCASCADE 内核进行封闭流形与切片适应性分析...
              </p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-start gap-3">
              <XCircle size={18} className="shrink-0 mt-0.5" />
              <div>
                <div className="font-bold">体检分析未完成</div>
                <div className="mt-1 text-gray-400">{error}</div>
              </div>
            </div>
          ) : report ? (
            <>
              {/* 核心评分看板 */}
              <div
                className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 ${
                  isLight ? "bg-slate-50 border-slate-200" : "bg-[#0d1117] border-[#30363d]"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-18 h-18 rounded-2xl border-2 flex flex-col items-center justify-center font-black ${getScoreColor()}`}
                  >
                    <span className="text-2xl tracking-tighter leading-none">{score}</span>
                    <span className="text-[10px] uppercase font-bold tracking-wider mt-0.5">
                      等级 {grade}
                    </span>
                  </div>
                  <div>
                    <div className="text-sm font-bold flex items-center gap-1.5">
                      <ShieldCheck size={16} className="text-emerald-500" />
                      <span>
                        {score >= 90
                          ? "优秀，模型完全适合 3D 打印"
                          : score >= 75
                          ? "良好，轻微注意悬空即可切片"
                          : score >= 60
                          ? "注意，部分几何特征需调校"
                          : "警告，模型存在打印缺陷"}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {report.is_watertight
                        ? "已通过封闭流形 (Watertight) 检测，无破面漏水风险，切片软件可直接解析实体实心/填充。"
                        : "警告：模型未闭合或存在开放壳面，FDM 切片可能会出现漏层或实心误判。"}
                    </div>
                  </div>
                </div>

                <div className="shrink-0">
                  {onExportStl && (
                    <button
                      onClick={onExportStl}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1.5 active:scale-95"
                    >
                      <Download size={14} />
                      <span>直接导出 STL 打印</span>
                    </button>
                  )}
                </div>
              </div>

              {/* 四大核心物理参数卡片 */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* 尺寸规格 */}
                <div
                  className={`p-3 rounded-xl border ${
                    isLight ? "bg-white border-gray-200" : "bg-white/5 border-[#30363d]"
                  }`}
                >
                  <div className="text-gray-400 text-[11px] flex items-center gap-1 font-medium mb-1">
                    <Box size={13} className="text-blue-500" />
                    <span>成型尺寸 (XYZ)</span>
                  </div>
                  <div className="text-xs font-mono font-bold">
                    {report.dimensions?.x ?? 0} × {report.dimensions?.y ?? 0} ×{" "}
                    {report.dimensions?.z ?? 0} mm
                  </div>
                  <div className="text-[10px] text-gray-400 mt-1">
                    热床上限: {bedSize.x}×{bedSize.y}×{bedSize.z} mm
                  </div>
                </div>

                {/* 几何气密性 */}
                <div
                  className={`p-3 rounded-xl border ${
                    isLight ? "bg-white border-gray-200" : "bg-white/5 border-[#30363d]"
                  }`}
                >
                  <div className="text-gray-400 text-[11px] flex items-center gap-1 font-medium mb-1">
                    <CheckCircle2 size={13} className="text-emerald-500" />
                    <span>流形完整性</span>
                  </div>
                  <div className="text-xs font-bold flex items-center gap-1">
                    {report.is_watertight ? (
                      <span className="text-emerald-500 font-bold">封闭流形 (Manifold)</span>
                    ) : (
                      <span className="text-amber-500 font-bold">开放壳体 (Open)</span>
                    )}
                  </div>
                  <div className="text-[10px] text-gray-400 mt-1">
                    实体数: {report.solids_count ?? 1} 个
                  </div>
                </div>

                {/* 预估耗材 */}
                <div
                  className={`p-3 rounded-xl border ${
                    isLight ? "bg-white border-gray-200" : "bg-white/5 border-[#30363d]"
                  }`}
                >
                  <div className="text-gray-400 text-[11px] flex items-center gap-1 font-medium mb-1">
                    <Scale size={13} className="text-amber-500" />
                    <span>预估耗材 (PLA)</span>
                  </div>
                  <div className="text-xs font-mono font-bold text-amber-500">
                    ~{filamentWeightG} g
                  </div>
                  <div className="text-[10px] text-gray-400 mt-1">
                    体积: {volumeCm3} cm³ (20%填充)
                  </div>
                </div>

                {/* 预估耗时 */}
                <div
                  className={`p-3 rounded-xl border ${
                    isLight ? "bg-white border-gray-200" : "bg-white/5 border-[#30363d]"
                  }`}
                >
                  <div className="text-gray-400 text-[11px] flex items-center gap-1 font-medium mb-1">
                    <Clock size={13} className="text-indigo-500" />
                    <span>预估耗时</span>
                  </div>
                  <div className="text-xs font-mono font-bold text-indigo-400">
                    ~{estimatedHours} 小时
                  </div>
                  <div className="text-[10px] text-gray-400 mt-1">以标准速度 50mm/s 估算</div>
                </div>
              </div>

              {/* 逐项检测明细 */}
              {checks.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    体检细则项
                  </div>
                  <div
                    className={`rounded-xl border divide-y overflow-hidden ${
                      isLight
                        ? "bg-white border-gray-200 divide-gray-100"
                        : "bg-[#0d1117] border-[#30363d] divide-[#21262d]"
                    }`}
                  >
                    {checks.map((item: PrintCheckItem, idx: number) => (
                      <div key={idx} className="p-3 flex items-start gap-3 text-xs">
                        {item.passed ? (
                          <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                        ) : item.level === "error" ? (
                          <XCircle size={16} className="text-rose-500 shrink-0 mt-0.5" />
                        ) : (
                          <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <div className="font-bold text-xs">{item.name}</div>
                          <div className="text-gray-400 text-[11px] mt-0.5">{item.detail}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 打印建议 */}
              {report.suggestions && report.suggestions.length > 0 && (
                <div
                  className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                    isLight
                      ? "bg-amber-50/50 border-amber-200/60 text-amber-900"
                      : "bg-amber-950/20 border-amber-800/40 text-amber-200"
                  }`}
                >
                  <div className="font-bold flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                    <Sparkles size={14} />
                    <span>切片与打印优化建议</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-[11px] opacity-90 pl-1">
                    {report.suggestions.map((sug: string, i: number) => (
                      <li key={i}>{sug}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* 底部操作栏 */}
        <div
          className={`h-12 px-6 border-t flex items-center justify-between shrink-0 ${
            isLight ? "bg-[#f8fafc] border-gray-200" : "bg-[#0d1117] border-[#30363d]"
          }`}
        >
          <div className="text-[11px] text-gray-400">
            遵循 ISO/ASTM 52900 增材制造测试准则
          </div>
          <button
            onClick={onClose}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
              isLight
                ? "bg-gray-200 hover:bg-gray-300 text-gray-800"
                : "bg-white/10 hover:bg-white/20 text-white"
            }`}
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};
