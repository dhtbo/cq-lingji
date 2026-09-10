"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  GripHorizontal,
  X,
  Sparkles,
  ArrowUpSquare,
  CircleDot,
  MinusCircle,
  Minimize2,
  Box,
  Spline,
  Dot,
  Slash,
  RotateCcw,
  Check,
  ChevronDown,
  Layers,
} from "lucide-react";

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

interface QuickInteractionBarProps {
  isOpen: boolean;
  onClose: () => void;
  pickTab: "face" | "edge" | "vertex";
  onPickTabChange: (tab: "face" | "edge" | "vertex") => void;
  pickedFace: PickedFaceInfo;
  pickedEdge: PickedEdgeInfo;
  pickedVertex: PickedVertexInfo;
  targetVar?: string;
  onInjectCode: (code: string) => void;
  onApplyToBlockly?: (
    type: string,
    value?: string,
    coords?: [number, number, number],
    radius?: number,
    extraParams?: Record<string, any>
  ) => void;
  showToast: (msg: string) => void;
}

export const QuickInteractionBar: React.FC<QuickInteractionBarProps> = ({
  isOpen,
  onClose,
  pickTab,
  onPickTabChange,
  pickedFace,
  pickedEdge,
  pickedVertex,
  targetVar = "part",
  onInjectCode,
  onApplyToBlockly,
  showToast,
}) => {
  // 可自由拖动位置状态 (默认 null 则居中底部悬浮)
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; mouseX: number; mouseY: number }>({
    startX: 0,
    startY: 0,
    mouseX: 0,
    mouseY: 0,
  });
  const barRef = useRef<HTMLDivElement>(null);

  // 面选择器缓存与多选模式扩展
  // 选项：单面 (当前拾取)、对称面 (>Z or <Z)、全部垂直侧面 (|Z)、全部水平面 (>Z or <Z)
  const [faceSelectorMode, setFaceSelectorMode] = useState<string>("single");
  const cachedFaceSelector =
    faceSelectorMode === "single"
      ? pickedFace.selector
      : faceSelectorMode === "both_z"
      ? ">Z or <Z"
      : faceSelectorMode === "sides"
      ? "|Z"
      : pickedFace.selector;

  // 线选择器缓存与多选模式扩展
  // 选项：单边/孔边 (%Circle)、全部竖直边 (|Z)、顶底所有圆边 (%Circle)、全部棱边
  const [edgeSelectorMode, setEdgeSelectorMode] = useState<string>("single");
  const cachedEdgeSelector =
    edgeSelectorMode === "single"
      ? pickedEdge.selector
      : edgeSelectorMode === "circle"
      ? "%Circle"
      : edgeSelectorMode === "vertical"
      ? "|Z"
      : edgeSelectorMode === "top_bottom"
      ? ">Z or <Z"
      : pickedEdge.selector;

  // 面操作选项卡：'extrude' (拉伸) | 'pocket' (挖槽) | 'hole' (中心孔) | 'shell' (抽壳)
  const [faceOp, setFaceOp] = useState<"extrude" | "pocket" | "hole" | "shell">("extrude");

  // 面拉伸参数配置
  const [extrudeShape, setExtrudeShape] = useState<"circle" | "rect">("circle");
  const [extrudeDistance, setExtrudeDistance] = useState<number>(10);
  const [extrudeRadius, setExtrudeRadius] = useState<number>(10);
  const [extrudeRect, setExtrudeRect] = useState<{ w: number; h: number }>({ w: 15, h: 15 });

  // 面挖槽参数配置
  const [pocketShape, setPocketShape] = useState<"rect" | "circle">("rect");
  const [pocketDepth, setPocketDepth] = useState<number>(5);
  const [pocketRect, setPocketRect] = useState<{ w: number; h: number }>({ w: 12, h: 12 });
  const [pocketRadius, setPocketRadius] = useState<number>(8);

  // 打孔参数配置
  const [holeDia, setHoleDia] = useState<number>(8);
  const [holeDepth, setHoleDepth] = useState<number>(12);

  // 倒角参数尺寸 (默认 1.5mm)
  const [filletRadius, setFilletRadius] = useState<number>(1.5);
  const [chamferDist, setChamferDist] = useState<number>(1.5);

  // 拖动事件监听
  useEffect(() => {
    if (!isDragging) return;

    const handlePointerMove = (e: PointerEvent) => {
      const dx = e.clientX - dragRef.current.mouseX;
      const dy = e.clientY - dragRef.current.mouseY;
      setPosition({
        x: Math.max(10, dragRef.current.startX + dx),
        y: Math.max(10, dragRef.current.startY + dy),
      });
    };

    const handlePointerUp = () => {
      setIsDragging(false);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [isDragging]);

  if (!isOpen) return null;

  const startDrag = (e: React.PointerEvent) => {
    e.preventDefault();
    if (!barRef.current) return;
    const rect = barRef.current.getBoundingClientRect();
    dragRef.current = {
      startX: rect.left,
      startY: rect.top,
      mouseX: e.clientX,
      mouseY: e.clientY,
    };
    setPosition({ x: rect.left, y: rect.top });
    setIsDragging(true);
  };

  const resetPosition = () => {
    setPosition(null);
  };

  const getFaceExpr = (selector: string, varName: string = targetVar) => {
    if (selector === ">Z") return `${varName}.faces().sort_by(Axis.Z)[-1]`;
    if (selector === "<Z") return `${varName}.faces().sort_by(Axis.Z)[0]`;
    if (selector === ">X") return `${varName}.faces().sort_by(Axis.X)[-1]`;
    if (selector === "<X") return `${varName}.faces().sort_by(Axis.X)[0]`;
    if (selector === ">Y") return `${varName}.faces().sort_by(Axis.Y)[-1]`;
    if (selector === "<Y") return `${varName}.faces().sort_by(Axis.Y)[0]`;
    if (selector === "|Z") return `${varName}.faces().filter_by(Axis.Z)`;
    return `${varName}.faces().sort_by(Axis.Z)[-1]`;
  };

  // --- 面操作生成逻辑 ---
  // 1. 面拉伸凸台
  const handleExecuteFaceExtrude = () => {
    const faceExpr = getFaceExpr(cachedFaceSelector);
    let snippet = "";
    if (extrudeShape === "circle") {
      snippet = `    with BuildSketch(${faceExpr}):\n        Circle(radius=${extrudeRadius})\n    extrude(amount=${extrudeDistance})\n`;
    } else {
      snippet = `    with BuildSketch(${faceExpr}):\n        Rectangle(${extrudeRect.w}, ${extrudeRect.h})\n    extrude(amount=${extrudeDistance})\n`;
    }
    onInjectCode(snippet);
    showToast(`已在表面 [${cachedFaceSelector}] 拉伸凸台 (${extrudeDistance}mm)`);
  };

  // 2. 面挖槽
  const handleExecuteFacePocket = () => {
    const faceExpr = getFaceExpr(cachedFaceSelector);
    let snippet = "";
    if (pocketShape === "rect") {
      snippet = `    with BuildSketch(${faceExpr}):\n        Rectangle(${pocketRect.w}, ${pocketRect.h})\n    extrude(amount=-${pocketDepth}, mode=Mode.SUBTRACT)\n`;
    } else {
      snippet = `    with BuildSketch(${faceExpr}):\n        Circle(radius=${pocketRadius})\n    extrude(amount=-${pocketDepth}, mode=Mode.SUBTRACT)\n`;
    }
    onInjectCode(snippet);
    showToast(`已在表面 [${cachedFaceSelector}] 盲切挖槽 (${pocketDepth}mm)`);
  };

  // 3. 表面中心打孔
  const handleExecuteFaceHole = () => {
    const faceExpr = getFaceExpr(cachedFaceSelector);
    const snippet = `    with Locations(${faceExpr}):\n        Hole(radius=${holeDia / 2}, depth=${holeDepth})\n`;
    onInjectCode(snippet);
    showToast(`已在表面 [${cachedFaceSelector}] 钻孔 (Φ${holeDia} 深${holeDepth}mm)`);
  };

  // 4. 表面抽壳
  const handleExecuteFaceShell = () => {
    const faceExpr = getFaceExpr(cachedFaceSelector);
    const snippet = `    offset(amount=-2.0, openings=${faceExpr})\n`;
    onInjectCode(snippet);
    showToast(`已在表面 [${cachedFaceSelector}] 执行薄壁抽壳 (-2mm)`);
  };

  // --- 线操作生成逻辑 ---
  // 1. 棱边倒圆角 (优先支持顶面内孔口)
  const handleExecuteEdgeFillet = () => {
    let snippet = "";
    if (cachedEdgeSelector === "%Circle" && cachedFaceSelector) {
      snippet = `    fillet(${targetVar}.faces().sort_by(Axis.Z)[-1].edges().filter_by(GeomType.CIRCLE), radius=${filletRadius})\n`;
    } else if (cachedEdgeSelector === "|Z") {
      snippet = `    fillet(${targetVar}.edges().filter_by(Axis.Z), radius=${filletRadius})\n`;
    } else {
      snippet = `    fillet(${targetVar}.faces().sort_by(Axis.Z)[-1].edges(), radius=${filletRadius})\n`;
    }
    onInjectCode(snippet);
    showToast(`已执行倒圆角 fillet(${filletRadius}mm)`);
  };

  // 2. 棱边倒斜角
  const handleExecuteEdgeChamfer = () => {
    let snippet = "";
    if (cachedEdgeSelector === "%Circle") {
      snippet = `    chamfer(${targetVar}.faces().sort_by(Axis.Z)[-1].edges().filter_by(GeomType.CIRCLE), length=${chamferDist})\n`;
    } else if (cachedEdgeSelector === "|Z") {
      snippet = `    chamfer(${targetVar}.edges().filter_by(Axis.Z), length=${chamferDist})\n`;
    } else {
      snippet = `    chamfer(${targetVar}.faces().sort_by(Axis.Z)[-1].edges(), length=${chamferDist})\n`;
    }
    onInjectCode(snippet);
    showToast(`已执行倒斜角 chamfer(${chamferDist}mm)`);
  };

  return (
    <div
      ref={barRef}
      style={
        position
          ? { left: `${position.x}px`, top: `${position.y}px`, position: "fixed" }
          : undefined
      }
      className={`${
        !position ? "absolute top-3 left-1/2 -translate-x-1/2" : ""
      } z-30 flex flex-col bg-[#161b22]/95 backdrop-blur-md border border-amber-500/30 shadow-2xl rounded-2xl text-xs text-gray-200 select-none animate-in fade-in zoom-in-95 duration-150 min-w-[360px] max-w-2xl ring-1 ring-white/10`}
    >
      {/* 顶部拖动手柄与状态切换栏 */}
      <div className="h-8 px-3 bg-[#21262d] rounded-t-2xl border-b border-[#30363d] flex items-center justify-between cursor-move">
        {/* 拖动提示条 */}
        <div
          onPointerDown={startDrag}
          className="flex items-center space-x-1.5 text-gray-400 hover:text-amber-400 transition"
          title="按住拖动可任意调整交互栏位置"
        >
          <GripHorizontal size={14} className="stroke-[2.5]" />
          <span className="text-[11px] font-bold text-gray-300">快速交互栏</span>
          <span className="text-[9px] px-1.5 py-0.2 bg-amber-500/20 text-amber-300 rounded font-semibold">
            可拖动
          </span>
        </div>

        {/* 模态切换胶囊 [面 (3) | 线 (2) | 点 (1)] */}
        <div className="flex items-center bg-[#161b22] p-0.5 rounded-lg border border-[#30363d]">
          <button
            onClick={() => onPickTabChange("face")}
            className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition flex items-center gap-1 ${
              pickTab === "face"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <Box size={10} />
            <span>面 [3]</span>
          </button>
          <button
            onClick={() => onPickTabChange("edge")}
            className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition flex items-center gap-1 ${
              pickTab === "edge"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <Spline size={10} />
            <span>线 [2]</span>
          </button>
          <button
            onClick={() => onPickTabChange("vertex")}
            className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition flex items-center gap-1 ${
              pickTab === "vertex"
                ? "bg-amber-600 text-white shadow-sm"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <Dot size={12} className="-mx-1" />
            <span>点 [1]</span>
          </button>
        </div>

        {/* 复位与关闭 */}
        <div className="flex items-center space-x-1">
          {position && (
            <button
              onClick={resetPosition}
              title="复位到视口底端居中"
              className="p-1 text-gray-400 hover:text-amber-400 hover:bg-white/10 rounded transition"
            >
              <RotateCcw size={12} />
            </button>
          )}
          <button
            onClick={onClose}
            title="关闭快速交互栏 (按 Esc 也可关闭)"
            className="p-1 text-gray-400 hover:text-red-400 hover:bg-white/10 rounded transition"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* 主体交互区域 */}
      <div className="p-3 space-y-3">
        {/* A. 实体【面】选择与链式操作流水线 */}
        {pickTab === "face" && (
          <div className="space-y-2.5">
            {/* 1. 已选中表面指示与多面选择器缓存 */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-[#0d1117] rounded-xl border border-[#30363d]">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                <span className="text-[11px] text-gray-400">已缓存基准面:</span>
                <span className="font-mono text-xs text-blue-400 font-bold bg-blue-950/80 px-2 py-0.5 rounded-lg border border-blue-800/80">
                  faces(&quot;{cachedFaceSelector}&quot;)
                </span>
              </div>

              {/* 多选模式选项胶囊 */}
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setFaceSelectorMode("single")}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono transition ${
                    faceSelectorMode === "single"
                      ? "bg-blue-600 text-white font-bold"
                      : "bg-[#21262d] text-gray-400 hover:text-gray-200"
                  }`}
                  title="仅选当前拾取的单面"
                >
                  单面
                </button>
                <button
                  onClick={() => setFaceSelectorMode("both_z")}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono transition ${
                    faceSelectorMode === "both_z"
                      ? "bg-blue-600 text-white font-bold"
                      : "bg-[#21262d] text-gray-400 hover:text-gray-200"
                  }`}
                  title="多选：顶面与底面 (>Z or <Z)"
                >
                  顶底双面
                </button>
                <button
                  onClick={() => setFaceSelectorMode("sides")}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono transition ${
                    faceSelectorMode === "sides"
                      ? "bg-blue-600 text-white font-bold"
                      : "bg-[#21262d] text-gray-400 hover:text-gray-200"
                  }`}
                  title="多选：全部竖直侧表面 (|Z)"
                >
                  所有侧面
                </button>
              </div>
            </div>

            {/* 2. 面功能操作选项卡 */}
            <div className="flex items-center space-x-1.5 border-b border-[#30363d] pb-1.5">
              <button
                onClick={() => setFaceOp("extrude")}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
                  faceOp === "extrude"
                    ? "bg-amber-500 text-gray-950 font-bold shadow-sm"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <ArrowUpSquare size={13} />
                <span>凸台拉伸</span>
              </button>
              <button
                onClick={() => setFaceOp("pocket")}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
                  faceOp === "pocket"
                    ? "bg-amber-500 text-gray-950 font-bold shadow-sm"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <MinusCircle size={13} />
                <span>盲切挖槽</span>
              </button>
              <button
                onClick={() => setFaceOp("hole")}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
                  faceOp === "hole"
                    ? "bg-amber-500 text-gray-950 font-bold shadow-sm"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <CircleDot size={13} />
                <span>打中心孔</span>
              </button>
              <button
                onClick={() => setFaceOp("shell")}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
                  faceOp === "shell"
                    ? "bg-amber-500 text-gray-950 font-bold shadow-sm"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <Minimize2 size={13} />
                <span>表面抽壳</span>
              </button>
            </div>

            {/* 3. 对应功能的参数配置与执行 */}
            {faceOp === "extrude" && (
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex items-center space-x-2">
                  <span className="text-gray-400">形状:</span>
                  <button
                    onClick={() => setExtrudeShape("circle")}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                      extrudeShape === "circle" ? "bg-blue-600 text-white" : "bg-[#21262d] text-gray-400"
                    }`}
                  >
                    圆形
                  </button>
                  <button
                    onClick={() => setExtrudeShape("rect")}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                      extrudeShape === "rect" ? "bg-blue-600 text-white" : "bg-[#21262d] text-gray-400"
                    }`}
                  >
                    矩形
                  </button>

                  {extrudeShape === "circle" ? (
                    <div className="flex items-center space-x-1">
                      <span className="text-gray-400">R:</span>
                      <input
                        type="number"
                        value={extrudeRadius}
                        onChange={(e) => setExtrudeRadius(Number(e.target.value))}
                        className="w-12 px-1 py-0.5 bg-[#0d1117] border border-[#30363d] rounded text-center text-xs text-white"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1">
                      <span className="text-gray-400">W:</span>
                      <input
                        type="number"
                        value={extrudeRect.w}
                        onChange={(e) => setExtrudeRect({ ...extrudeRect, w: Number(e.target.value) })}
                        className="w-10 px-1 py-0.5 bg-[#0d1117] border border-[#30363d] rounded text-center text-xs text-white"
                      />
                      <span className="text-gray-400">H:</span>
                      <input
                        type="number"
                        value={extrudeRect.h}
                        onChange={(e) => setExtrudeRect({ ...extrudeRect, h: Number(e.target.value) })}
                        className="w-10 px-1 py-0.5 bg-[#0d1117] border border-[#30363d] rounded text-center text-xs text-white"
                      />
                    </div>
                  )}

                  <div className="flex items-center space-x-1">
                    <span className="text-gray-400">高度:</span>
                    <input
                      type="number"
                      value={extrudeDistance}
                      onChange={(e) => setExtrudeDistance(Number(e.target.value))}
                      className="w-12 px-1 py-0.5 bg-[#0d1117] border border-[#30363d] rounded text-center text-xs text-white"
                    />
                    <span className="text-gray-500 text-[10px]">mm</span>
                  </div>
                </div>

                <button
                  onClick={handleExecuteFaceExtrude}
                  className="px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-md transition active:scale-95 flex items-center gap-1.5"
                >
                  <ArrowUpSquare size={13} />
                  <span>执行拉伸修改</span>
                </button>
              </div>
            )}

            {faceOp === "pocket" && (
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex items-center space-x-2">
                  <span className="text-gray-400">形状:</span>
                  <button
                    onClick={() => setPocketShape("rect")}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                      pocketShape === "rect" ? "bg-amber-600 text-white" : "bg-[#21262d] text-gray-400"
                    }`}
                  >
                    矩形槽
                  </button>
                  <button
                    onClick={() => setPocketShape("circle")}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                      pocketShape === "circle" ? "bg-amber-600 text-white" : "bg-[#21262d] text-gray-400"
                    }`}
                  >
                    圆槽
                  </button>

                  {pocketShape === "rect" ? (
                    <div className="flex items-center space-x-1">
                      <span className="text-gray-400">槽宽:</span>
                      <input
                        type="number"
                        value={pocketRect.w}
                        onChange={(e) => setPocketRect({ ...pocketRect, w: Number(e.target.value) })}
                        className="w-10 px-1 py-0.5 bg-[#0d1117] border border-[#30363d] rounded text-center text-xs text-white"
                      />
                      <span className="text-gray-400">槽长:</span>
                      <input
                        type="number"
                        value={pocketRect.h}
                        onChange={(e) => setPocketRect({ ...pocketRect, h: Number(e.target.value) })}
                        className="w-10 px-1 py-0.5 bg-[#0d1117] border border-[#30363d] rounded text-center text-xs text-white"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1">
                      <span className="text-gray-400">槽半径:</span>
                      <input
                        type="number"
                        value={pocketRadius}
                        onChange={(e) => setPocketRadius(Number(e.target.value))}
                        className="w-12 px-1 py-0.5 bg-[#0d1117] border border-[#30363d] rounded text-center text-xs text-white"
                      />
                    </div>
                  )}

                  <div className="flex items-center space-x-1">
                    <span className="text-gray-400">深度:</span>
                    <input
                      type="number"
                      value={pocketDepth}
                      onChange={(e) => setPocketDepth(Number(e.target.value))}
                      className="w-12 px-1 py-0.5 bg-[#0d1117] border border-[#30363d] rounded text-center text-xs text-white"
                    />
                    <span className="text-gray-500 text-[10px]">mm</span>
                  </div>
                </div>

                <button
                  onClick={handleExecuteFacePocket}
                  className="px-3.5 py-1.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold rounded-xl shadow-md transition active:scale-95 flex items-center gap-1.5"
                >
                  <MinusCircle size={13} />
                  <span>执行挖槽修改</span>
                </button>
              </div>
            )}

            {faceOp === "hole" && (
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1">
                    <span className="text-gray-400">孔径 Φ:</span>
                    <input
                      type="number"
                      value={holeDia}
                      onChange={(e) => setHoleDia(Number(e.target.value))}
                      className="w-12 px-1 py-0.5 bg-[#0d1117] border border-[#30363d] rounded text-center text-xs text-white"
                    />
                    <span className="text-gray-500 text-[10px]">mm</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="text-gray-400">深度:</span>
                    <input
                      type="number"
                      value={holeDepth}
                      onChange={(e) => setHoleDepth(Number(e.target.value))}
                      className="w-12 px-1 py-0.5 bg-[#0d1117] border border-[#30363d] rounded text-center text-xs text-white"
                    />
                    <span className="text-gray-500 text-[10px]">mm</span>
                  </div>
                </div>

                <button
                  onClick={handleExecuteFaceHole}
                  className="px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-md transition active:scale-95 flex items-center gap-1.5"
                >
                  <CircleDot size={13} />
                  <span>执行打孔修改</span>
                </button>
              </div>
            )}

            {faceOp === "shell" && (
              <div className="flex items-center justify-between pt-1">
                <span className="text-gray-400 text-xs">
                  移除当前所选表面，并将实体掏空为薄壁零件 (默认壁厚 2.0mm)
                </span>
                <button
                  onClick={handleExecuteFaceShell}
                  className="px-3.5 py-1.5 bg-[#262c36] hover:bg-[#30363d] border border-[#30363d] text-white font-bold rounded-xl transition active:scale-95 flex items-center gap-1.5"
                >
                  <Minimize2 size={13} />
                  <span>执行抽壳</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* B. 实体【线/棱边】选择与倒角/倒斜角流水线 */}
        {pickTab === "edge" && (
          <div className="space-y-2.5">
            {/* 1. 已选中棱边指示与多线选择器缓存 */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-[#0d1117] rounded-xl border border-[#30363d]">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[11px] text-gray-400">已缓存棱边:</span>
                <span className="font-mono text-xs text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded-lg border border-emerald-800/80">
                  edges(&quot;{cachedEdgeSelector}&quot;)
                </span>
              </div>

              {/* 多线模式切换 */}
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setEdgeSelectorMode("circle")}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono transition ${
                    edgeSelectorMode === "circle"
                      ? "bg-emerald-600 text-white font-bold"
                      : "bg-[#21262d] text-gray-400 hover:text-gray-200"
                  }`}
                  title="多选：所有圆孔或圆弧边 (%Circle)"
                >
                  所有圆弧边
                </button>
                <button
                  onClick={() => setEdgeSelectorMode("vertical")}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono transition ${
                    edgeSelectorMode === "vertical"
                      ? "bg-emerald-600 text-white font-bold"
                      : "bg-[#21262d] text-gray-400 hover:text-gray-200"
                  }`}
                  title="多选：所有竖直棱边 (|Z)"
                >
                  竖直边群
                </button>
                <button
                  onClick={() => setEdgeSelectorMode("top_bottom")}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono transition ${
                    edgeSelectorMode === "top_bottom"
                      ? "bg-emerald-600 text-white font-bold"
                      : "bg-[#21262d] text-gray-400 hover:text-gray-200"
                  }`}
                  title="多选：顶面与底面环形轮廓边 (>Z or <Z)"
                >
                  顶底轮廓边
                </button>
              </div>
            </div>

            {/* 2. 倒角参数与执行按钮组 (包含用户重点需求的内孔口倒圆角) */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex items-center space-x-2">
                <span className="text-gray-400 font-medium">圆角半径 R:</span>
                <input
                  type="number"
                  step="0.5"
                  min="0.1"
                  value={filletRadius}
                  onChange={(e) => setFilletRadius(Number(e.target.value))}
                  className="w-14 px-1.5 py-0.5 bg-[#0d1117] border border-[#30363d] rounded text-center text-xs text-white font-mono"
                />
                <span className="text-gray-500 text-[10px]">mm</span>

                {/* 常用尺寸胶囊 */}
                <div className="flex items-center space-x-1 pl-1">
                  {[0.5, 1.0, 1.5, 2.0, 3.0].map((preset) => (
                    <button
                      key={preset}
                      onClick={() => setFilletRadius(preset)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition ${
                        filletRadius === preset
                          ? "bg-emerald-600 text-white font-bold"
                          : "bg-[#21262d] text-gray-400 hover:text-gray-200"
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {/* 倒圆角 */}
                <button
                  onClick={handleExecuteEdgeFillet}
                  className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl shadow-md transition active:scale-95 flex items-center gap-1.5"
                  title="对当前缓存的线执行倒圆角"
                >
                  <Sparkles size={13} />
                  <span>倒圆角 ({filletRadius}mm)</span>
                </button>

                {/* 倒斜角 */}
                <button
                  onClick={handleExecuteEdgeChamfer}
                  className="px-3 py-1.5 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-gray-200 font-semibold rounded-xl transition active:scale-95 flex items-center gap-1"
                >
                  <Slash size={12} />
                  <span>倒斜角 ({chamferDist}mm)</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* C. 实体【点】选择 */}
        {pickTab === "vertex" && (
          <div className="flex items-center justify-between p-2 bg-[#0d1117] rounded-xl border border-[#30363d]">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span className="text-gray-400">已选空间坐标:</span>
              <span className="font-mono text-xs text-amber-400 font-bold bg-amber-950/60 px-2 py-0.5 rounded">
                {pickedVertex.pointStr}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  const snippet = `    with Locations((${pickedVertex.x}, ${pickedVertex.y}, ${pickedVertex.z})):\n        Hole(radius=2.0, depth=6)\n`;
                  onInjectCode(snippet);
                  showToast("已在此坐标中心打孔 (Φ4mm)");
                }}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl transition active:scale-95"
              >
                点坐标打孔
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
