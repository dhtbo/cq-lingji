"use client";

import React, { useState } from "react";
import {
  Trophy,
  CheckCircle2,
  Circle,
  HelpCircle,
  Sparkles,
  ChevronRight,
  Code2,
  Play,
  RotateCcw,
  Lightbulb,
  X,
  Layers,
  Rocket,
  Compass,
  Home,
  Check,
} from "lucide-react";
import { CAD_MISSIONS, Mission } from "./missions";
import { EditorSettings } from "../EditorSettings/EditorSettingsModal";

interface MissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCode: string;
  onLoadMissionCode: (code: string) => void;
  settings?: EditorSettings;
}

const STAGES = [
  { id: "all", label: "全部 (16)" },
  { id: "阶段一：先锋着陆舱", label: "阶段一：先锋着陆舱 (4)" },
  { id: "阶段二：六轮火星车", label: "阶段二：六轮漫游车 (4)" },
  { id: "阶段三：原位主基地", label: "阶段三：原位主基地 (4)" },
  { id: "阶段四：场景大总装", label: "阶段四：全景大总装 (4)" },
];

export const MissionModal: React.FC<MissionModalProps> = ({
  isOpen,
  onClose,
  currentCode,
  onLoadMissionCode,
  settings,
}) => {
  const [selectedStage, setSelectedStage] = useState<string>("all");
  const [selectedMissionId, setSelectedMissionId] = useState<string>(CAD_MISSIONS[0].id);
  const [showSolution, setShowSolution] = useState<boolean>(false);
  const [showHint, setShowHint] = useState<boolean>(false);

  if (!isOpen) return null;

  const isLight = settings?.colorMode === "light";
  const themeColor = settings?.themeColor || "#FFDB29";
  const isYellowTheme =
    themeColor.toLowerCase() === "#ffdb29" ||
    themeColor.toLowerCase() === "#ffc400" ||
    settings?.themeName === "经典黄";

  const primaryBtnText = isYellowTheme ? "#8A4B00" : "#ffffff";
  const primaryBg = isYellowTheme ? "#FFDB29" : themeColor;

  // 筛选符合当前阶段的关卡
  const filteredMissions =
    selectedStage === "all"
      ? CAD_MISSIONS
      : CAD_MISSIONS.filter((m) => m.stage === selectedStage);

  const currentMission =
    CAD_MISSIONS.find((m) => m.id === selectedMissionId) || filteredMissions[0] || CAD_MISSIONS[0];

  // 计算每个检查点的达成情况
  const evaluateCheckpoints = (mission: Mission, code: string) => {
    return mission.checkpoints.map((cp) => ({
      text: cp.text,
      passed: cp.regex.test(code),
    }));
  };

  const currentEvaluation = evaluateCheckpoints(currentMission, currentCode);
  const allPassed = currentEvaluation.every((e) => e.passed);

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fadeIn">
      <div
        className={`rounded-2xl w-full max-w-5xl h-[650px] flex flex-col shadow-2xl overflow-hidden border transition-colors duration-200 ${
          isLight
            ? "bg-white border-gray-200 text-gray-800 shadow-xl shadow-black/15"
            : "bg-[#161b22] border-[#30363d] text-gray-200"
        }`}
      >
        {/* 顶部 Header */}
        <div
          className={`h-14 px-6 border-b flex items-center justify-between transition-colors ${
            isLight ? "bg-[#f8fafc] border-gray-200" : "bg-[#0d1117] border-[#30363d]"
          }`}
        >
          <div className="flex items-center space-x-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shadow-md transition-colors"
              style={{ backgroundColor: primaryBg, color: primaryBtnText }}
            >
              <Trophy size={18} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className={`text-sm font-bold tracking-wide ${isLight ? "text-gray-900" : "text-white"}`}>
                  火星拓荒者计划 · 16 关构造型挑战
                </h2>
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full font-bold border transition-colors"
                  style={{
                    backgroundColor: primaryBg + (isLight ? "20" : "15"),
                    color: isLight && isYellowTheme ? "#8A4B00" : isYellowTheme ? "#FFDB29" : themeColor,
                    borderColor: primaryBg + "40",
                  }}
                >
                  Karpathy 构建即理解
                </span>
              </div>
              <p className={`text-[11px] ${isLight ? "text-gray-500" : "text-gray-400"}`}>
                从空间基准、回转体、布尔差集切削到原位建造与全场景星际大总装
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition ${
              isLight
                ? "text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                : "text-gray-400 hover:text-white hover:bg-[#21262d]"
            }`}
          >
            <X size={18} />
          </button>
        </div>

        {/* 阶段分类筛选 Tabs */}
        <div
          className={`px-4 py-2 border-b flex items-center space-x-1.5 overflow-x-auto select-none ${
            isLight ? "bg-gray-50/80 border-gray-200" : "bg-[#0d1117]/80 border-[#30363d]"
          }`}
        >
          <span className={`text-[11px] font-semibold uppercase tracking-wider mr-2 ${isLight ? "text-gray-400" : "text-gray-500"}`}>
            阶段选关:
          </span>
          {STAGES.map((s) => {
            const isActive = selectedStage === s.id;
            return (
              <button
                key={s.id}
                onClick={() => {
                  setSelectedStage(s.id);
                  const firstOfStage =
                    s.id === "all"
                      ? CAD_MISSIONS[0]
                      : CAD_MISSIONS.find((m) => m.stage === s.id);
                  if (firstOfStage) {
                    setSelectedMissionId(firstOfStage.id);
                    setShowSolution(false);
                    setShowHint(false);
                  }
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex-shrink-0 ${
                  isActive
                    ? "shadow-xs"
                    : isLight
                    ? "text-gray-600 hover:bg-gray-200/60"
                    : "text-gray-400 hover:bg-[#21262d]"
                }`}
                style={
                  isActive
                    ? { backgroundColor: primaryBg, color: primaryBtnText }
                    : undefined
                }
              >
                {s.label}
              </button>
            );
          })}
        </div>

        {/* 主体两栏布局 */}
        <div className="flex-1 flex overflow-hidden">
          {/* 左侧任务列表 */}
          <div
            className={`w-72 border-r flex flex-col p-3 space-y-2 overflow-y-auto select-none ${
              isLight ? "bg-[#f8fafc] border-gray-200" : "bg-[#0d1117]/60 border-[#30363d]"
            }`}
          >
            {filteredMissions.map((m) => {
              const evalRes = evaluateCheckpoints(m, currentCode);
              const doneCount = evalRes.filter((e) => e.passed).length;
              const isComplete = doneCount === evalRes.length;
              const isSelected = m.id === currentMission.id;

              return (
                <button
                  key={m.id}
                  onClick={() => {
                    setSelectedMissionId(m.id);
                    setShowSolution(false);
                    setShowHint(false);
                  }}
                  className={`w-full text-left p-3 rounded-xl border transition-all text-xs flex flex-col space-y-1.5 relative ${
                    isSelected
                      ? isLight
                        ? "shadow-sm border-2"
                        : "shadow-md border-2"
                      : isLight
                      ? "bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700"
                      : "bg-[#161b22] border-[#30363d] hover:border-gray-600 hover:bg-[#21262d]/50 text-gray-300"
                  }`}
                  style={
                    isSelected
                      ? {
                          borderColor: primaryBg,
                          backgroundColor: primaryBg + (isLight ? "15" : "20"),
                        }
                      : undefined
                  }
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${m.tagColor}`}>
                      {m.level}
                    </span>
                    <span className={`text-[10px] font-mono ${isLight ? "text-gray-500" : "text-gray-400"}`}>
                      {doneCount}/{evalRes.length}
                    </span>
                  </div>

                  <div className={`font-bold truncate ${isLight ? "text-gray-900" : "text-gray-100"}`}>
                    {m.title}
                  </div>

                  <div className={`flex items-center justify-between text-[11px] ${isLight ? "text-gray-500" : "text-gray-400"}`}>
                    <span className="truncate">{m.subtitle}</span>
                    {isComplete ? (
                      <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0 ml-1" />
                    ) : (
                      <Circle size={14} className={isLight ? "text-gray-300 flex-shrink-0 ml-1" : "text-gray-600 flex-shrink-0 ml-1"} />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* 右侧关卡详情与交互台 */}
          <div
            className={`flex-1 flex flex-col p-6 overflow-y-auto space-y-5 transition-colors ${
              isLight ? "bg-white" : "bg-[#161b22]"
            }`}
          >
            {/* 关卡标题 */}
            <div className={`border-b pb-4 ${isLight ? "border-gray-200" : "border-[#30363d]"}`}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center space-x-2">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded border ${currentMission.tagColor}`}>
                    {currentMission.level}
                  </span>
                  <h3 className={`text-base font-bold ${isLight ? "text-gray-900" : "text-white"}`}>
                    {currentMission.title}
                  </h3>
                </div>
                {allPassed && (
                  <div className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                    <CheckCircle2 size={14} />
                    <span>代码已达成目标！</span>
                  </div>
                )}
              </div>
              <p className={`text-xs ${isLight ? "text-gray-500" : "text-gray-400"}`}>{currentMission.subtitle}</p>
            </div>

            {/* Karpathy 思维卡片 */}
            <div
              className={`p-3.5 border rounded-xl space-y-1.5 ${
                isLight
                  ? "bg-amber-50/60 border-amber-200/80 text-amber-900"
                  : "bg-gradient-to-r from-amber-500/10 to-orange-500/5 border-amber-500/20 text-amber-100"
              }`}
            >
              <div className="flex items-center space-x-2 text-xs font-bold text-amber-600 dark:text-amber-300">
                <Sparkles size={14} />
                <span>Karpathy 的直觉思考 (心智模型)</span>
              </div>
              <p className="text-xs leading-relaxed font-sans opacity-90">
                “{currentMission.karpathyNote}”
              </p>
            </div>

            {/* 制造目标说明 */}
            <div className="space-y-1.5">
              <h4 className={`text-xs font-bold ${isLight ? "text-gray-900" : "text-gray-200"}`}>📌 关卡制造目标</h4>
              <p
                className={`text-xs leading-relaxed p-3 rounded-lg border ${
                  isLight
                    ? "bg-[#f8fafc] border-gray-200 text-gray-700"
                    : "bg-[#0d1117] border-[#30363d] text-gray-300"
                }`}
              >
                {currentMission.goalDescription}
              </p>
            </div>

            {/* 核心检查点实时比对 */}
            <div className="space-y-2">
              <h4 className={`text-xs font-bold ${isLight ? "text-gray-900" : "text-gray-200"}`}>
                🔍 实时达标检查项 (Checkpoints)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {currentEvaluation.map((item, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center space-x-2.5 p-2.5 rounded-lg border text-xs transition ${
                      item.passed
                        ? isLight
                          ? "bg-emerald-50 border-emerald-300 text-emerald-800 font-medium"
                          : "bg-emerald-950/20 border-emerald-500/40 text-emerald-300"
                        : isLight
                        ? "bg-gray-50 border-gray-200 text-gray-500"
                        : "bg-[#0d1117] border-[#30363d] text-gray-400"
                    }`}
                  >
                    {item.passed ? (
                      <CheckCircle2 size={15} className="text-emerald-500 flex-shrink-0" />
                    ) : (
                      <Circle size={15} className={isLight ? "text-gray-400 flex-shrink-0" : "text-gray-500 flex-shrink-0"} />
                    )}
                    <span className="font-mono">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 提示与解答抽屉 */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowHint((prev) => !prev)}
                  className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline flex items-center space-x-1"
                >
                  <Lightbulb size={13} />
                  <span>{showHint ? "收起提示" : "查看几何思路提示"}</span>
                </button>
                <span className={isLight ? "text-gray-300" : "text-gray-600"}>·</span>
                <button
                  onClick={() => setShowSolution((prev) => !prev)}
                  className="text-xs text-purple-600 dark:text-purple-400 hover:underline flex items-center space-x-1"
                >
                  <Code2 size={13} />
                  <span>{showSolution ? "隐藏参考代码" : "查看参考完成代码"}</span>
                </button>
              </div>

              {showHint && (
                <div
                  className={`p-3 rounded-lg text-xs border ${
                    isLight
                      ? "bg-cyan-50 border-cyan-200 text-cyan-900"
                      : "bg-cyan-950/20 border-cyan-800/40 text-cyan-200"
                  }`}
                >
                  {currentMission.hint}
                </div>
              )}

              {showSolution && (
                <pre
                  className={`p-3 rounded-lg text-[11px] font-mono overflow-x-auto border ${
                    isLight
                      ? "bg-[#f8fafc] border-gray-200 text-gray-800"
                      : "bg-[#0d1117] border-[#30363d] text-gray-300"
                  }`}
                >
                  <code>{currentMission.solutionCode}</code>
                </pre>
              )}
            </div>

            {/* 底部操作条 */}
            <div className={`pt-4 border-t flex items-center justify-between ${isLight ? "border-gray-200" : "border-[#30363d]"}`}>
              <span className={`text-[11px] ${isLight ? "text-gray-500" : "text-gray-500"}`}>
                载入后可在中间编辑器编写代码，右侧视口实时反馈
              </span>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    onLoadMissionCode(currentMission.starterCode);
                    onClose();
                  }}
                  className={`px-3.5 py-1.5 border text-xs font-semibold rounded-lg flex items-center space-x-1.5 transition active:scale-95 ${
                    isLight
                      ? "bg-gray-100 hover:bg-gray-200 border-gray-300 text-gray-800"
                      : "bg-[#21262d] hover:bg-[#30363d] border-[#30363d] text-gray-200"
                  }`}
                >
                  <RotateCcw size={13} />
                  <span>载入任务骨架</span>
                </button>

                <button
                  onClick={() => {
                    onLoadMissionCode(currentMission.solutionCode);
                    onClose();
                  }}
                  className="px-4 py-1.5 text-xs font-bold rounded-lg flex items-center space-x-1.5 shadow-md transition active:scale-95"
                  style={{
                    backgroundColor: primaryBg,
                    color: primaryBtnText,
                  }}
                >
                  <Play size={13} className="fill-current" />
                  <span>载入并立即执行</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
