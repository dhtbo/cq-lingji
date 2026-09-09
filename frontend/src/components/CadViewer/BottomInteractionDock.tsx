"use client";

import React, { useState } from "react";
import {
  Box,
  Spline,
  Dot,
  ArrowUpSquare,
  MinusCircle,
  CircleDot,
  Sparkles,
  Slash,
  Copy,
  ChevronDown,
} from "lucide-react";
import { ThemeToken } from "@/lib/theme";

export interface PickedFaceInfo {
  name: string;
  selector: string;
  normal: string;
  desc: string;
}

export interface PickedEdgeInfo {
  name: string;
  selector: string;
  desc: string;
}

export interface PickedVertexInfo {
  x: number;
  y: number;
  z: number;
  pointStr: string;
}

interface BottomInteractionDockProps {
  pickTab: "face" | "edge" | "vertex";
  onPickTabChange: (tab: "face" | "edge" | "vertex") => void;
  pickedFace: PickedFaceInfo;
  pickedEdge: PickedEdgeInfo;
  pickedVertex: PickedVertexInfo;
  targetVar?: string;
  themeToken: ThemeToken;
  onInjectCode: (code: string) => void;
  onApplyToBlockly?: (
    type: string,
    value?: string,
    coords?: [number, number, number],
    radius?: number,
    extraParams?: Record<string, any>
  ) => void;
  showToast: (msg: string) => void;
  colorMode?: "light" | "dark";
}

export const BottomInteractionDock: React.FC<BottomInteractionDockProps> = ({
  pickTab,
  onPickTabChange,
  pickedFace,
  pickedEdge,
  pickedVertex,
  targetVar = "part",
  themeToken,
  onInjectCode,
  onApplyToBlockly,
  showToast,
  colorMode = "dark",
}) => {
  // 尺寸参数 (默认 1.5mm)
  const [dimension, setDimension] = useState<number>(1.5);

  // 面选择器缓存模式
  const [faceSelectorMode, setFaceSelectorMode] = useState<string>("single");
  // 边选择器缓存模式
  const [edgeSelectorMode, setEdgeSelectorMode] = useState<string>("bore_circle");

  // 计算当前有效面选择器
  const activeFaceSelector =
    faceSelectorMode === "single"
      ? pickedFace.selector
      : faceSelectorMode === "both_z"
      ? ">Z or <Z"
      : faceSelectorMode === "sides"
      ? "|Z"
      : pickedFace.selector;

  // 1. 面拉伸
  const handleExtrude = () => {
    const codeSnippet = `${targetVar} = ${targetVar}.faces("${activeFaceSelector}").workplane().circle(8).extrude(${dimension})\n`;
    onInjectCode(codeSnippet);
    onApplyToBlockly?.("face", activeFaceSelector, undefined, undefined, { extrude: dimension });
    showToast(`已在 [${activeFaceSelector}] 拉伸 +${dimension}mm`);
  };

  // 2. 面盲切挖槽
  const handleCutBlind = () => {
    const codeSnippet = `${targetVar} = ${targetVar}.faces("${activeFaceSelector}").workplane().rect(10, 10).cutBlind(-${dimension})\n`;
    onInjectCode(codeSnippet);
    onApplyToBlockly?.("face", activeFaceSelector, undefined, undefined, { cutBlind: dimension });
    showToast(`已在 [${activeFaceSelector}] 挖槽 -${dimension}mm`);
  };

  // 3. 面开孔
  const handleFaceHole = () => {
    const codeSnippet = `${targetVar} = ${targetVar}.faces("${activeFaceSelector}").workplane(centerOption="CenterOfMass").hole(diameter=5, depth=${dimension * 2})\n`;
    onInjectCode(codeSnippet);
    onApplyToBlockly?.("hole", undefined, undefined, undefined, { diameter: 5, depth: dimension * 2 });
    showToast(`已在 [${activeFaceSelector}] 开孔 (d=5mm, 深=${dimension * 2}mm, 质心对齐)`);
  };

  // 4. 面建工作面
  const handleWorkplane = () => {
    const codeSnippet = `${targetVar} = ${targetVar}.faces("${activeFaceSelector}").workplane(centerOption="CenterOfMass")\n`;
    onInjectCode(codeSnippet);
    onApplyToBlockly?.("face", activeFaceSelector);
    showToast(`已在 [${activeFaceSelector}] 建立工作面 (CenterOfMass 质心对齐)`);
  };

  // 5. 边倒圆角
  const handleFillet = () => {
    let selStr = "";
    let codeSnippet = "";
    if (edgeSelectorMode === "bore_circle") {
      selStr = 'faces(">Z").edges("%Circle")';
      codeSnippet = `${targetVar} = ${targetVar}.faces(">Z").edges("%Circle").fillet(${dimension})\n`;
      onApplyToBlockly?.("edge", "faces_Z_circle", undefined, dimension);
    } else if (edgeSelectorMode === "all_circle") {
      selStr = 'edges("%Circle")';
      codeSnippet = `${targetVar} = ${targetVar}.edges("%Circle").fillet(${dimension})\n`;
      onApplyToBlockly?.("edge", "%Circle", undefined, dimension);
    } else if (edgeSelectorMode === "vertical") {
      selStr = 'edges("|Z")';
      codeSnippet = `${targetVar} = ${targetVar}.edges("|Z").fillet(${dimension})\n`;
      onApplyToBlockly?.("edge", "|Z", undefined, dimension);
    } else {
      selStr = `edges("${pickedEdge.selector}")`;
      codeSnippet = `${targetVar} = ${targetVar}.edges("${pickedEdge.selector}").fillet(${dimension})\n`;
      onApplyToBlockly?.("edge", pickedEdge.selector, undefined, dimension);
    }
    onInjectCode(codeSnippet);
    showToast(`已对 [${selStr}] 倒圆角 (${dimension}mm)`);
  };

  // 6. 边倒斜角
  const handleChamfer = () => {
    let selStr = "";
    let codeSnippet = "";
    if (edgeSelectorMode === "bore_circle") {
      selStr = 'faces(">Z").edges("%Circle")';
      codeSnippet = `${targetVar} = ${targetVar}.faces(">Z").edges("%Circle").chamfer(${dimension})\n`;
      onApplyToBlockly?.("edge", "faces_Z_circle", undefined, dimension);
    } else if (edgeSelectorMode === "all_circle") {
      selStr = 'edges("%Circle")';
      codeSnippet = `${targetVar} = ${targetVar}.edges("%Circle").chamfer(${dimension})\n`;
      onApplyToBlockly?.("edge", "%Circle", undefined, dimension);
    } else if (edgeSelectorMode === "vertical") {
      selStr = 'edges("|Z")';
      codeSnippet = `${targetVar} = ${targetVar}.edges("|Z").chamfer(${dimension})\n`;
      onApplyToBlockly?.("edge", "|Z", undefined, dimension);
    } else {
      selStr = `edges("${pickedEdge.selector}")`;
      codeSnippet = `${targetVar} = ${targetVar}.edges("${pickedEdge.selector}").chamfer(${dimension})\n`;
      onApplyToBlockly?.("edge", pickedEdge.selector, undefined, dimension);
    }
    onInjectCode(codeSnippet);
    showToast(`已对 [${selStr}] 倒斜角 (${dimension}mm)`);
  };

  // 7. 点打孔
  const handleVertexHole = () => {
    const codeSnippet = `${targetVar} = ${targetVar}.faces(">Z").workplane().pushPoints([(${pickedVertex.x}, ${pickedVertex.y})]).hole(diameter=4, depth=${dimension * 2})\n`;
    onInjectCode(codeSnippet);
    showToast(`已在点 (${pickedVertex.x}, ${pickedVertex.y}) 打孔`);
  };

  // 8. 复制坐标
  const handleCopyCoord = () => {
    navigator.clipboard?.writeText(pickedVertex.pointStr);
    showToast(`已复制坐标: ${pickedVertex.pointStr}`);
  };

  const isLight = colorMode === "light";

  return (
    <div
      data-testid="bottom-interaction-dock"
      className={`flex items-center space-x-2 ${
        isLight
          ? "bg-white/95 border-[#d0d7de] text-gray-800 shadow-sm"
          : "bg-[#1c2128]/95 border-[#30363d] text-gray-200 shadow-md"
      } rounded-2xl px-2.5 py-1 text-xs select-none backdrop-blur-md`}
    >
      {/* 1. 拾取模式切换: 面 [3] | 线 [2] | 点 [1] */}
      <div
        className={`flex items-center ${
          isLight ? "bg-[#f3f4f6] border-[#e1e4e8]" : "bg-[#161b22] border-[#30363d]/80"
        } rounded-xl p-0.5 border space-x-0.5`}
      >
        <button
          onClick={() => onPickTabChange("face")}
          title="面拾取模式 (快捷键: 3)"
          style={
            pickTab === "face"
              ? {
                  backgroundColor: themeToken.hex,
                  color: themeToken.isDarkText ? "#0f172a" : "#ffffff",
                }
              : undefined
          }
          className={`px-2 py-1 rounded-lg flex items-center gap-1 transition font-bold ${
            pickTab === "face"
              ? "shadow-sm"
              : isLight
              ? "text-gray-600 hover:text-gray-900 hover:bg-black/5"
              : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
          }`}
        >
          <Box size={13} />
          <span className="font-semibold text-[11px]">面</span>
        </button>

        <button
          onClick={() => onPickTabChange("edge")}
          title="线拾取模式 (快捷键: 2)"
          style={
            pickTab === "edge"
              ? {
                  backgroundColor: themeToken.hex,
                  color: themeToken.isDarkText ? "#0f172a" : "#ffffff",
                }
              : undefined
          }
          className={`px-2 py-1 rounded-lg flex items-center gap-1 transition font-bold ${
            pickTab === "edge"
              ? "shadow-sm"
              : isLight
              ? "text-gray-600 hover:text-gray-900 hover:bg-black/5"
              : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
          }`}
        >
          <Spline size={13} />
          <span className="font-semibold text-[11px]">线</span>
        </button>

        <button
          onClick={() => onPickTabChange("vertex")}
          title="点拾取模式 (快捷键: 1)"
          style={
            pickTab === "vertex"
              ? {
                  backgroundColor: themeToken.hex,
                  color: themeToken.isDarkText ? "#0f172a" : "#ffffff",
                }
              : undefined
          }
          className={`px-2 py-1 rounded-lg flex items-center gap-1 transition font-bold ${
            pickTab === "vertex"
              ? "shadow-sm"
              : isLight
              ? "text-gray-600 hover:text-gray-900 hover:bg-black/5"
              : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
          }`}
        >
          <Dot size={15} className="-mx-1" />
          <span className="font-semibold text-[11px]">点</span>
        </button>
      </div>

      {/* 2. 目标选择器模式下拉与缓存指示 */}
      <div
        className={`flex items-center ${
          isLight ? "bg-[#f3f4f6] border-[#e1e4e8]" : "bg-[#161b22] border-[#30363d]/80"
        } rounded-xl px-2 py-1 border text-[11px]`}
      >
        {pickTab === "face" && (
          <div className="flex items-center gap-1.5">
            <span className={`${isLight ? "text-gray-500" : "text-gray-400"} font-medium`}>目标:</span>
            <select
              value={faceSelectorMode}
              onChange={(e) => setFaceSelectorMode(e.target.value)}
              className={`bg-transparent ${
                isLight ? "text-amber-700 font-bold" : "text-amber-300"
              } font-mono focus:outline-none cursor-pointer text-[11px]`}
            >
              <option value="single" className={isLight ? "bg-white text-gray-800" : "bg-[#161b22] text-gray-200"}>
                当前拾取 ({pickedFace.selector})
              </option>
              <option value="both_z" className={isLight ? "bg-white text-gray-800" : "bg-[#161b22] text-gray-200"}>
                顶底端面 (&gt;Z or &lt;Z)
              </option>
              <option value="sides" className={isLight ? "bg-white text-gray-800" : "bg-[#161b22] text-gray-200"}>
                所有侧面 (|Z)
              </option>
            </select>
          </div>
        )}

        {pickTab === "edge" && (
          <div className="flex items-center gap-1.5">
            <span className={`${isLight ? "text-gray-500" : "text-gray-400"} font-medium`}>目标:</span>
            <select
              value={edgeSelectorMode}
              onChange={(e) => setEdgeSelectorMode(e.target.value)}
              className={`bg-transparent ${
                isLight ? "text-emerald-700 font-bold" : "text-emerald-300"
              } font-mono focus:outline-none cursor-pointer text-[11px]`}
            >
              <option value="bore_circle" className={isLight ? "bg-white text-gray-800" : "bg-[#161b22] text-gray-200"}>
                顶孔口边 faces('&gt;Z').edges('%Circle')
              </option>
              <option value="all_circle" className={isLight ? "bg-white text-gray-800" : "bg-[#161b22] text-gray-200"}>
                所有圆周边 (%Circle)
              </option>
              <option value="vertical" className={isLight ? "bg-white text-gray-800" : "bg-[#161b22] text-gray-200"}>
                竖直棱边 (|Z)
              </option>
              <option value="single" className={isLight ? "bg-white text-gray-800" : "bg-[#161b22] text-gray-200"}>
                拾取边 ({pickedEdge.selector})
              </option>
            </select>
          </div>
        )}

        {pickTab === "vertex" && (
          <div className={`flex items-center gap-1.5 font-mono text-[11px] ${isLight ? "text-cyan-700 font-semibold" : "text-cyan-300"}`}>
            <span className={isLight ? "text-gray-500" : "text-gray-400"}>点:</span>
            <span>({pickedVertex.x}, {pickedVertex.y}, {pickedVertex.z})</span>
          </div>
        )}
      </div>

      {/* 3. 尺寸微调 (默认 1.5mm) */}
      <div
        className={`flex items-center ${
          isLight ? "bg-[#f3f4f6] border-[#e1e4e8]" : "bg-[#161b22] border-[#30363d]/80"
        } rounded-xl px-2 py-0.5 border text-[11px] space-x-1`}
      >
        <span className={isLight ? "text-gray-500" : "text-gray-400"}>尺寸:</span>
        <input
          type="number"
          step="0.5"
          value={dimension}
          onChange={(e) => setDimension(Math.max(0.1, Number(e.target.value)))}
          className={`w-10 bg-transparent text-center font-mono ${
            isLight ? "text-gray-900 font-bold" : "text-gray-100"
          } focus:outline-none`}
        />
        <span className={`${isLight ? "text-gray-400" : "text-gray-500"} font-mono`}>mm</span>
      </div>

      {/* 4. 动作快捷按钮组 (按当前模式) */}
      <div className="flex items-center space-x-1">
        {pickTab === "face" && (
          <>
            <button
              onClick={handleExtrude}
              title={`在 ${activeFaceSelector} 拉伸 ${dimension}mm`}
              className={`px-2 py-1 ${
                isLight
                  ? "bg-[#f8fafc] hover:bg-blue-50 text-blue-700 border-[#d0d7de] hover:border-blue-300 shadow-2xs font-medium"
                  : "bg-[#21262d] hover:bg-blue-600/30 text-blue-300 hover:text-blue-100 border-[#30363d]"
              } rounded-lg flex items-center gap-1 border transition active:scale-95`}
            >
              <ArrowUpSquare size={13} className={isLight ? "text-blue-600" : "text-blue-400"} />
              <span>拉伸</span>
            </button>

            <button
              onClick={handleCutBlind}
              title={`在 ${activeFaceSelector} 挖槽 -${dimension}mm`}
              className={`px-2 py-1 ${
                isLight
                  ? "bg-[#f8fafc] hover:bg-red-50 text-red-700 border-[#d0d7de] hover:border-red-300 shadow-2xs font-medium"
                  : "bg-[#21262d] hover:bg-red-600/30 text-red-300 hover:text-red-100 border-[#30363d]"
              } rounded-lg flex items-center gap-1 border transition active:scale-95`}
            >
              <MinusCircle size={13} className={isLight ? "text-red-600" : "text-red-400"} />
              <span>挖槽</span>
            </button>

            <button
              onClick={handleFaceHole}
              title={`在 ${activeFaceSelector} 打圆孔`}
              className={`px-2 py-1 ${
                isLight
                  ? "bg-[#f8fafc] hover:bg-amber-50 text-amber-800 border-[#d0d7de] hover:border-amber-300 shadow-2xs font-medium"
                  : "bg-[#21262d] hover:bg-amber-600/30 text-amber-300 hover:text-amber-100 border-[#30363d]"
              } rounded-lg flex items-center gap-1 border transition active:scale-95`}
            >
              <CircleDot size={13} className={isLight ? "text-amber-600" : "text-amber-400"} />
              <span>开孔</span>
            </button>

            <button
              onClick={handleWorkplane}
              title={`在 ${activeFaceSelector} 建立新基准平面`}
              className={`px-2 py-1 ${
                isLight
                  ? "bg-[#f8fafc] hover:bg-purple-50 text-purple-700 border-[#d0d7de] hover:border-purple-300 shadow-2xs font-medium"
                  : "bg-[#21262d] hover:bg-purple-600/30 text-purple-300 hover:text-purple-100 border-[#30363d]"
              } rounded-lg flex items-center gap-1 border transition active:scale-95`}
            >
              <Box size={13} className={isLight ? "text-purple-600" : "text-purple-400"} />
              <span>工作面</span>
            </button>
          </>
        )}

        {pickTab === "edge" && (
          <>
            <button
              onClick={handleFillet}
              title={`对选定边倒圆角 (${dimension}mm)`}
              className={`px-2 py-1 ${
                isLight
                  ? "bg-[#f8fafc] hover:bg-emerald-50 text-emerald-700 border-[#d0d7de] hover:border-emerald-300 shadow-2xs font-medium"
                  : "bg-[#21262d] hover:bg-emerald-600/30 text-emerald-300 hover:text-emerald-100 border-[#30363d]"
              } rounded-lg flex items-center gap-1 border transition active:scale-95`}
            >
              <Sparkles size={13} className={isLight ? "text-emerald-600" : "text-emerald-400"} />
              <span>倒圆角</span>
            </button>

            <button
              onClick={handleChamfer}
              title={`对选定边倒斜角 (${dimension}mm)`}
              className={`px-2 py-1 ${
                isLight
                  ? "bg-[#f8fafc] hover:bg-teal-50 text-teal-700 border-[#d0d7de] hover:border-teal-300 shadow-2xs font-medium"
                  : "bg-[#21262d] hover:bg-teal-600/30 text-teal-300 hover:text-teal-100 border-[#30363d]"
              } rounded-lg flex items-center gap-1 border transition active:scale-95`}
            >
              <Slash size={13} className={isLight ? "text-teal-600" : "text-teal-400"} />
              <span>倒斜角</span>
            </button>
          </>
        )}

        {pickTab === "vertex" && (
          <>
            <button
              onClick={handleVertexHole}
              title="在坐标点打孔"
              className={`px-2 py-1 ${
                isLight
                  ? "bg-[#f8fafc] hover:bg-amber-50 text-amber-800 border-[#d0d7de] hover:border-amber-300 shadow-2xs font-medium"
                  : "bg-[#21262d] hover:bg-amber-600/30 text-amber-300 hover:text-amber-100 border-[#30363d]"
              } rounded-lg flex items-center gap-1 border transition active:scale-95`}
            >
              <CircleDot size={13} className={isLight ? "text-amber-600" : "text-amber-400"} />
              <span>打孔</span>
            </button>

            <button
              onClick={handleCopyCoord}
              title="复制世界三维坐标"
              className={`px-2 py-1 ${
                isLight
                  ? "bg-[#f8fafc] hover:bg-gray-100 text-gray-700 border-[#d0d7de] hover:border-gray-400 shadow-2xs font-medium"
                  : "bg-[#21262d] hover:bg-gray-700 text-gray-300 hover:text-white border-[#30363d]"
              } rounded-lg flex items-center gap-1 border transition active:scale-95`}
            >
              <Copy size={13} className={isLight ? "text-gray-500" : "text-gray-400"} />
              <span>复制坐标</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};
