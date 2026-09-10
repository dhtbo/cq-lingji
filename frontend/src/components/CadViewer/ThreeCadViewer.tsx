"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import {
  Compass,
  RotateCcw,
  Sun,
  Moon,
  Grid3X3,
  Layers,
  FolderTree,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Crosshair,
  Sparkles,
  Check,
  Box,
  Spline,
  Dot,
  Copy,
  MousePointerClick,
  X,
  Search,
  Plus,
  CircleDot,
  Slash,
  Minimize2,
  ArrowUpSquare,
  Cylinder,
  MousePointer,
  Command,
  GripVertical,
  Wrench,
  Pencil,
  Square,
  Circle,
} from "lucide-react";
import { StepInfo } from "@/lib/api";

export interface PickedElements {
  pickTab: "face" | "edge" | "vertex";
  face: { name: string; selector: string; normal: string; desc: string };
  edge: { name: string; selector: string; desc: string };
  vertex: { x: number; y: number; z: number; pointStr: string };
}

interface ThreeCadViewerProps {
  meshData: any;
  loading: boolean;
  steps?: StepInfo[];
  currentStep?: number;
  totalSteps?: number;
  onStepChange?: (step: number) => void;
  onInjectCode?: (codeSnippet: string) => void;
  onApplyToBlockly?: (
    type: string,
    value?: string,
    coords?: [number, number, number],
    radius?: number,
    extraParams?: Record<string, any>
  ) => void;
  onExportStl?: () => void;
  onExportStep?: () => void;
  code?: string;
  onPickChange?: (data: PickedElements) => void;
  colorMode?: "dark" | "light";
}

export const ThreeCadViewer: React.FC<ThreeCadViewerProps> = ({
  meshData,
  loading,
  steps = [],
  currentStep = 1,
  totalSteps = 1,
  onStepChange,
  onInjectCode,
  onApplyToBlockly,
  onExportStl,
  onExportStep,
  code = "",
  onPickChange,
  colorMode = "dark",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const displayRef = useRef<any>(null);

  // 智能推断主 CAD 实体变量名 (如 example, flange, part)
  const targetVar = useMemo(() => {
    if (!code) return "part";
    const buildPartMatch = code.match(/with\s+BuildPart\s*\(.*?\)\s*as\s+([a-zA-Z_]\w*)/i);
    if (buildPartMatch && buildPartMatch[1]) return buildPartMatch[1];
    const showMatch = code.match(/show_object\s*\(\s*([a-zA-Z_]\w*)/);
    if (showMatch && showMatch[1]) return showMatch[1];
    const assignMatches = Array.from(code.matchAll(/^([a-zA-Z_]\w*)\s*=/gm));
    if (assignMatches.length > 0) {
      return assignMatches[assignMatches.length - 1][1];
    }
    return "part";
  }, [code]);

  // 根据面方位选择器生成精确的 build123d 实体拓扑面代码表达式
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

  const [theme, setTheme] = useState<"dark" | "light">(colorMode);

  // 监听父级 colorMode 变化并同步更新 3D 视口渲染引擎底色
  useEffect(() => {
    if (colorMode && colorMode !== theme) {
      setTheme(colorMode);
      if (displayRef.current) {
        try {
          displayRef.current.setTheme(colorMode);
        } catch (e) {
          console.error("同步主题到 3D 视口失败:", e);
        }
      }
    }
  }, [colorMode]);

  const [isOrtho, setIsOrtho] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [showAxes, setShowAxes] = useState(true);
  const [blackEdges, setBlackEdges] = useState(true);
  const [showTree, setShowTree] = useState(false);

  // 时间旅行自动播放状态
  const [isPlaying, setIsPlaying] = useState(false);

  // 点、线、面 3D 智能拾取状态 (快速几何模式: 1 点, 2 线, 3 面)
  const [pickTab, setPickTab] = useState<"face" | "edge" | "vertex">("face");
  const pickTabRef = useRef(pickTab);
  pickTabRef.current = pickTab;

  const [isInspectorOpen, setIsInspectorOpen] = useState(true);
  const [copiedAction, setCopiedAction] = useState<string | null>(null);

  // 3D 快速倒角/参数尺寸输入 (默认 1.5mm)
  const [quickRadius, setQuickRadius] = useState<number>(1.5);

  const [pickedData, setPickedData] = useState<{
    face: { name: string; selector: string; normal: string; desc: string };
    edge: { name: string; selector: string; desc: string };
    vertex: { x: number; y: number; z: number; pointStr: string };
  }>({
    face: {
      name: "顶面 Top Face (+Z)",
      selector: ">Z",
      normal: "[0.0, 0.0, 1.0]",
      desc: "实体最高特征面，常用作新建工作基准面打孔或加胶",
    },
    edge: {
      name: "竖直外棱边 (|Z)",
      selector: "|Z",
      desc: "平行于 Z 轴的竖直轮廓边，适合倒圆角 fillet",
    },
    vertex: {
      x: 0,
      y: 0,
      z: 20,
      pointStr: "(0.0, 0.0, 20.0)",
    },
  });

  // 同步 3D 拾取状态到父级工作台 (用于底栏快捷交互中枢联动)
  useEffect(() => {
    onPickChange?.({
      pickTab,
      face: pickedData.face,
      edge: pickedData.edge,
      vertex: pickedData.vertex,
    });
  }, [pickTab, pickedData, onPickChange]);

  // --- 3D CAD 快捷交互系统状态 ---
  // 1. Shift + A 悬浮添加菜单
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [addCategory, setAddCategory] = useState<"mesh" | "sketch" | "mechanical">("mesh");

  // 几何基本体参数配置
  const [boxParams, setBoxParams] = useState({ length: 20, width: 20, height: 10 });
  const [cylParams, setCylParams] = useState({ height: 30, radius: 15 });
  const [sphParams, setSphParams] = useState({ radius: 15 });
  const [coneParams, setConeParams] = useState({ height: 30, bottomR: 20, topR: 10 });
  const [sketchRectParams, setSketchRectParams] = useState({ width: 30, height: 20, extrude: 10 });
  const [sketchCircleParams, setSketchCircleParams] = useState({ radius: 15, extrude: 10 });
  const [flangeParams, setFlangeParams] = useState({ outerR: 30, centerD: 12, thickness: 6 });
  const [bushingParams, setBushingParams] = useState({ outerR: 20, holeD: 14, height: 35 });
  const [pipeParams, setPipeParams] = useState({ outerR: 25, innerR: 18, height: 40 });

  // 2. 鼠标右键上下文菜单
  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });

  // 3. 3D F3 / Space 极速命令搜索面板
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [commandSearchQuery, setCommandSearchQuery] = useState("");
  const [commandSelectedIndex, setCommandSelectedIndex] = useState(0);

  // 4. 左侧 3D 工具栏浮动与折叠隐藏状态 (可自由拖动 + 折叠收起)
  const [activeTool, setActiveTool] = useState<
    "select" | "sketch" | "add" | "extrude" | "hole" | "fillet" | "chamfer" | "shell"
  >("select");

  // 3D 视口多图层独立实时显示控制 (基准平面 · 2D草图 · 3D实体模型)
  const [showPlaneLayer, setShowPlaneLayer] = useState(true);
  const [showSketchLayer, setShowSketchLayer] = useState(true);
  const [showModelLayer, setShowModelLayer] = useState(true);

  // 鼠标平面交互绘制草图状态 (圆形 / 矩形 / 多边形区域)
  const [sketchShape, setSketchShape] = useState<"circle" | "rect" | "polygon">("circle");
  const [isSketchDrawing, setIsSketchDrawing] = useState(false);
  const [sketchStart, setSketchStart] = useState<THREE.Vector3 | null>(null);
  const [sketchCurrent, setSketchCurrent] = useState<THREE.Vector3 | null>(null);
  const [polygonPoints, setPolygonPoints] = useState<THREE.Vector3[]>([]);

  const [isToolbarCollapsed, setIsToolbarCollapsed] = useState(false);
  const [toolbarPos, setToolbarPos] = useState<{ x: number; y: number } | null>(null);
  const [isDraggingToolbar, setIsDraggingToolbar] = useState(false);
  const toolbarDragRef = useRef<{ startX: number; startY: number; mouseX: number; mouseY: number }>({
    startX: 0,
    startY: 0,
    mouseX: 0,
    mouseY: 0,
  });
  const toolbarRef = useRef<HTMLDivElement>(null);

  const startDragToolbar = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!toolbarRef.current) return;
    const rect = toolbarRef.current.getBoundingClientRect();
    toolbarDragRef.current = {
      startX: rect.left,
      startY: rect.top,
      mouseX: e.clientX,
      mouseY: e.clientY,
    };
    setIsDraggingToolbar(true);
  };

  useEffect(() => {
    if (!isDraggingToolbar) return;
    const handlePointerMove = (e: PointerEvent) => {
      const dx = e.clientX - toolbarDragRef.current.mouseX;
      const dy = e.clientY - toolbarDragRef.current.mouseY;
      setToolbarPos({
        x: Math.max(10, toolbarDragRef.current.startX + dx),
        y: Math.max(10, toolbarDragRef.current.startY + dy),
      });
    };
    const handlePointerUp = () => setIsDraggingToolbar(false);
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [isDraggingToolbar]);

  // 5. Toast 快捷操作视觉反馈
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2200);
  };

  // 快速复制提示辅助
  const triggerCopyToast = (tag: string, text: string) => {
    try {
      navigator.clipboard?.writeText(text);
    } catch {}
    setCopiedAction(tag);
    showToast(text);
    setTimeout(() => setCopiedAction(null), 1800);
  };

  // 计算鼠标在当前活动基准工作平面上的 3D 空间坐标
  const getPlaneIntersection = (e: React.PointerEvent | MouseEvent): THREE.Vector3 | null => {
    const viewer = displayRef.current?.viewer;
    if (!viewer || !viewer.rendered) return null;
    const canvas = containerRef.current?.querySelector("canvas");
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    if (
      e.clientX < rect.left ||
      e.clientX > rect.right ||
      e.clientY < rect.top ||
      e.clientY > rect.bottom
    ) {
      return null;
    }

    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const camera = viewer.rendered.camera?.camera || viewer.rendered.camera;
    if (!camera) return null;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), camera);

    // 默认基准工作平面为 XY 平面 (Z=0)
    let normal = new THREE.Vector3(0, 0, 1);
    let origin = new THREE.Vector3(0, 0, 0);

    // 如果选定了实体表面，以表面高度为基准
    if (pickTab === "face" && pickedData.vertex && pickedData.face?.selector === ">Z") {
      origin.set(0, 0, pickedData.vertex.z || 0);
    }

    const plane = new THREE.Plane();
    plane.setFromNormalAndCoplanarPoint(normal, origin);

    const hit = new THREE.Vector3();
    const res = raycaster.ray.intersectPlane(plane, hit);
    if (res) return hit;
    return raycaster.ray.at(50, hit);
  };

  // 将 3D 坐标投影为视口 2D 像素坐标 (用于 SVG 动态指示器)
  const projectToScreen = (vec: THREE.Vector3): { x: number; y: number } | null => {
    const viewer = displayRef.current?.viewer;
    const camera = viewer?.rendered?.camera?.camera || viewer?.rendered?.camera;
    const canvas = containerRef.current?.querySelector("canvas");
    if (!camera || !canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const p = vec.clone().project(camera);
    return {
      x: ((p.x + 1) / 2) * rect.width,
      y: ((-p.y + 1) / 2) * rect.height,
    };
  };

  // 多图层显隐响应逻辑 (基准平面 · 2D草图 · 3D模型)
  useEffect(() => {
    const viewer = displayRef.current?.viewer;
    const scene = viewer?.rendered?.scene;
    if (scene) {
      scene.traverse((child: any) => {
        const name = (child.name || "").toLowerCase();
        if (name.includes("sketch")) {
          child.visible = showSketchLayer;
        } else if (name.includes("model")) {
          child.visible = showModelLayer;
        }
      });
    }
    if (displayRef.current?.setGrid) {
      try {
        displayRef.current.setGrid("grid", showPlaneLayer);
      } catch {}
    }
  }, [showPlaneLayer, showSketchLayer, showModelLayer]);

  // 鼠标草图交互事件处理
  const handleSketchPointerDown = (e: React.PointerEvent) => {
    if (activeTool !== "sketch" || e.button !== 0) return;
    const hit = getPlaneIntersection(e);
    if (!hit) return;

    if (sketchShape === "circle" || sketchShape === "rect") {
      setSketchStart(hit);
      setSketchCurrent(hit);
      setIsSketchDrawing(true);
    } else if (sketchShape === "polygon") {
      // 若距离多边形起点很近，自动闭合
      if (polygonPoints.length >= 3) {
        const startScreen = projectToScreen(polygonPoints[0]);
        const canvas = containerRef.current?.querySelector("canvas");
        if (startScreen && canvas) {
          const rect = canvas.getBoundingClientRect();
          const curX = e.clientX - rect.left;
          const curY = e.clientY - rect.top;
          if (Math.hypot(curX - startScreen.x, curY - startScreen.y) < 18) {
            handleSketchFinishPolygon();
            return;
          }
        }
      }
      setPolygonPoints((prev) => [...prev, hit]);
    }
  };

  const handleSketchPointerMove = (e: React.PointerEvent) => {
    if (activeTool !== "sketch") return;
    const hit = getPlaneIntersection(e);
    if (!hit) return;
    setSketchCurrent(hit);
  };

  // 检查代码末尾是否已处于草图/工作面状态（尚未拉伸为实体）
  const isInSketchStack = useMemo(() => {
    if (!code) return false;
    const cleanLines = code
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("#"));
    if (cleanLines.length === 0) return false;
    const lastLine = cleanLines[cleanLines.length - 1];
    const isSolidEnd = /extrude|hole|fillet|chamfer|shell|cut|box|sphere|cylinder|cone/i.test(lastLine);
    const isSketchEnd = /circle|rect|close|slot2D|ellipse|polyline/i.test(lastLine);
    return isSketchEnd && !isSolidEnd;
  }, [code]);

  const handleSketchPointerUp = () => {
    if (activeTool !== "sketch" || !isSketchDrawing || !sketchStart || !sketchCurrent) return;

    const faceExpr = getFaceExpr(pickedData.face.selector);

    if (sketchShape === "circle") {
      const radius = Math.round(sketchStart.distanceTo(sketchCurrent) * 10) / 10;
      if (radius >= 1.0) {
        const codeSnippet = isInSketchStack
          ? `        Circle(radius=${radius})\n`
          : `    with BuildSketch(${faceExpr}):\n        Circle(radius=${radius})\n`;
        onInjectCode?.(codeSnippet);
        onApplyToBlockly?.("face", pickedData.face.selector);
        showToast(`✅ 已在 [${pickedData.face.name || pickedData.face.selector}] 绘制 R=${radius}mm 圆形草图`);
      }
    } else if (sketchShape === "rect") {
      const w = Math.round(Math.abs(sketchCurrent.x - sketchStart.x) * 10) / 10;
      const h = Math.round(Math.abs(sketchCurrent.y - sketchStart.y) * 10) / 10;
      if (w >= 1.0 && h >= 1.0) {
        const codeSnippet = isInSketchStack
          ? `        Rectangle(${w}, ${h})\n`
          : `    with BuildSketch(${faceExpr}):\n        Rectangle(${w}, ${h})\n`;
        onInjectCode?.(codeSnippet);
        onApplyToBlockly?.("face", pickedData.face.selector);
        showToast(`✅ 已在 [${pickedData.face.name || pickedData.face.selector}] 绘制 ${w}×${h}mm 矩形草图`);
      }
    }

    setIsSketchDrawing(false);
    setSketchStart(null);
    setSketchCurrent(null);
  };

  const handleSketchFinishPolygon = () => {
    if (polygonPoints.length < 3) {
      showToast("⚠️ 多边形区域至少需要 3 个顶点");
      return;
    }
    const ptsStr = polygonPoints
      .map((p) => `(${Math.round(p.x * 10) / 10}, ${Math.round(p.y * 10) / 10})`)
      .join(", ");
    const faceExpr = getFaceExpr(pickedData.face.selector);
    const codeSnippet = isInSketchStack
      ? `        Polyline([${ptsStr}], close=True)\n`
      : `    with BuildSketch(${faceExpr}):\n        Polyline([${ptsStr}], close=True)\n`;
    onInjectCode?.(codeSnippet);
    onApplyToBlockly?.("face", pickedData.face.selector);
    showToast(`✅ 已在 [${pickedData.face.name || pickedData.face.selector}] 生成 ${polygonPoints.length} 顶点多边形闭合草图`);
    setPolygonPoints([]);
    setSketchCurrent(null);
  };

  // 初始化 three-cad-viewer 实例
  useEffect(() => {
    if (!containerRef.current) return;

    let displayInstance: any = null;
    let isDisposed = false;

    const initViewer = async () => {
      try {
        const { Display, Viewer } = await import("three-cad-viewer");

        if (isDisposed || !containerRef.current) return;

        containerRef.current.innerHTML = "";

        const width = containerRef.current.clientWidth || 600;
        const height = containerRef.current.clientHeight || 500;

        // Display 配置: tools 保持开启以提供 explode/vertex 原生能力，但无外部悬浮遮挡
        displayInstance = new Display(containerRef.current, {
          cadWidth: width,
          height: height,
          treeWidth: 0,
          theme: theme,
          tools: true,
          pinning: false,
          glass: true,
          explodeTool: true,
          selectTool: true,
          measureTools: false,
          zscaleTool: false,
          zebraTool: false,
          studioTool: false,
          externalMeasurementBackend: false,
        });

        // 外部状态通知监听
        const notifyCallback = (changes: any) => {
          if (!changes) return;
        };

        const viewerInstance = new Viewer(
          displayInstance,
          {
            ortho: isOrtho,
            grid: [showGrid, false, false],
            axes: showAxes,
            axes0: showAxes,
            transparent: false,
            blackEdges: blackEdges,
            theme: theme,
          },
          notifyCallback
        );

        displayRef.current = displayInstance;

        if (meshData && displayInstance.viewer) {
          renderMesh(displayInstance, meshData);
        }
      } catch (err) {
        console.error("初始化 three-cad-viewer 失败:", err);
      }
    };

    initViewer();

    // 响应式画布缩放
    const resizeObserver = new ResizeObserver((entries) => {
      if (!displayRef.current || !entries[0]) return;
      const { width, height } = entries[0].contentRect;
      if (width > 50 && height > 50) {
        try {
          displayRef.current.setSizes({
            cadWidth: Math.floor(width),
            height: Math.floor(height),
          });
        } catch {
          // ignore layout transition
        }
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      isDisposed = true;
      resizeObserver.disconnect();
      if (displayInstance) {
        try {
          displayInstance.dispose();
        } catch (e) {
          console.error("dispose 异常:", e);
        }
      }
      displayRef.current = null;
    };
  }, []);

  // 键盘快捷键 (3D 快捷交互体系: Shift+A 添加, F3/Space 搜索, Ctrl+B 倒角, E 拉伸, I 打孔, 1/2/3 模态, Tab 轮转, Esc 退出)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) {
        if (e.key === "Escape") {
          setIsCommandPaletteOpen(false);
          setIsAddMenuOpen(false);
          setIsContextMenuOpen(false);
        }
        return;
      }

      // 1. Shift + A: 开启添加基本体菜单
      if (e.shiftKey && e.key.toLowerCase() === "a") {
        e.preventDefault();
        setIsAddMenuOpen((prev) => !prev);
        setIsContextMenuOpen(false);
        setIsCommandPaletteOpen(false);
        return;
      }

      // 2. F3 或 Space (空格键): 开启快速命令面板
      if (e.key === "F3" || e.key === " " || e.code === "Space" || e.key === "Space") {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
        setCommandSearchQuery("");
        setCommandSelectedIndex(0);
        setIsContextMenuOpen(false);
        setIsAddMenuOpen(false);
        return;
      }

      // 3. Ctrl + B: 倒圆角 (Bevel / Fillet)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        if (pickTabRef.current === "face") {
          onInjectCode?.(`    fillet(${targetVar}.faces().sort_by(Axis.Z)[-1].edges().filter_by(GeomType.CIRCLE), radius=${quickRadius})\n`);
          triggerCopyToast("bore-fillet", `已孔口倒圆角 (${quickRadius}mm)`);
        } else {
          onInjectCode?.(`    fillet(${targetVar}.edges().filter_by(Axis.Z), radius=${quickRadius})\n`);
          triggerCopyToast("fillet", `已倒圆角 (${quickRadius}mm)`);
        }
        return;
      }

      // 4. E / e: 拉伸成体 (Extrude)
      if (e.key.toLowerCase() === "e" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        onInjectCode?.(`    with BuildSketch(${targetVar}.faces().sort_by(Axis.Z)[-1]):\n        Circle(radius=10)\n    extrude(amount=10)\n`);
        triggerCopyToast("extrude", "已执行表面拉伸 (10mm)");
        return;
      }

      // 5. I / i: 表面打孔 (Inset / Hole)
      if (e.key.toLowerCase() === "i" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        onInjectCode?.(`    with Locations(${targetVar}.faces().sort_by(Axis.Z)[-1]):\n        Hole(radius=2.5, depth=10)\n`);
        triggerCopyToast("hole", "已执行打孔 (d=5mm, depth=10mm)");
        return;
      }

      // 6. Tab: 模态轮转 (点 -> 线 -> 面 -> 点)
      if (e.key === "Tab") {
        e.preventDefault();
        setPickTab((prev) => (prev === "vertex" ? "edge" : prev === "edge" ? "face" : "vertex"));
        return;
      }

      // 7. 数字键 1, 2, 3
      if (e.key === "1") {
        setPickTab("vertex");
      } else if (e.key === "2") {
        setPickTab("edge");
      } else if (e.key === "3") {
        setPickTab("face");
      } else if (e.key === "Escape") {
        setIsInspectorOpen(false);
        setIsAddMenuOpen(false);
        setIsContextMenuOpen(false);
        setIsCommandPaletteOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pickedData, quickRadius, onInjectCode, onApplyToBlockly]);

  // 鼠标在 3D 实体表面拾取射线检测 (Raycasting for Point, Line, Face)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleContextMenuEvent = (e: MouseEvent) => {
      e.preventDefault();
      const rect = container.getBoundingClientRect();
      const x = Math.min(Math.max(10, e.clientX - rect.left), rect.width - 240);
      const y = Math.min(Math.max(10, e.clientY - rect.top), rect.height - 300);
      setContextMenuPos({ x, y });
      setIsContextMenuOpen(true);
      setIsAddMenuOpen(false);
    };

    const handlePointerDown = (e: MouseEvent) => {
      setIsContextMenuOpen(false);
      // 仅响应鼠标左键单选拾取
      if (e.button !== 0) return;

      const viewer = displayRef.current?.viewer;
      if (!viewer || !viewer.rendered) return;

      const canvas = container.querySelector("canvas");
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      if (
        e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY < rect.top ||
        e.clientY > rect.bottom
      ) {
        return;
      }

      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      const camera = viewer.rendered.camera?.camera || viewer.rendered.camera;
      const scene = viewer.rendered.scene;
      if (!camera || !scene) return;

      const currentMode = pickTabRef.current;
      const raycaster = new THREE.Raycaster();
      if (currentMode === "edge") {
        raycaster.params.Line.threshold = 4.0;
      } else if (currentMode === "vertex") {
        raycaster.params.Points.threshold = 4.0;
      }
      raycaster.setFromCamera(new THREE.Vector2(x, y), camera);

      const intersects = raycaster.intersectObjects(scene.children, true);
      if (intersects.length === 0) return;

      const hit = intersects[0];
      const point = hit.point;

      // 提取表面法向
      const normal = hit.face?.normal ? hit.face.normal.clone() : new THREE.Vector3(0, 0, 1);
      if (hit.object) {
        normal.transformDirection(hit.object.matrixWorld);
      }

      // 1. 面解析 (Face)
      let faceSelector = ">Z";
      let faceName = "顶面 Top Face (+Z)";
      let faceDesc = "实体顶端表面，包含内孔口与外周轮廓边";

      if (normal.z > 0.65) {
        faceSelector = ">Z";
        faceName = "顶面 Top Face (+Z)";
        faceDesc = "实体顶端表面，包含内孔口与外周轮廓边";
      } else if (normal.z < -0.65) {
        faceSelector = "<Z";
        faceName = "底面 Bottom Face (-Z)";
        faceDesc = "实体底端表面，适合反向开孔或建立底座基准";
      } else if (normal.x > 0.65) {
        faceSelector = ">X";
        faceName = "右侧面 Right Face (+X)";
        faceDesc = "垂直于 X 正方向的侧表面";
      } else if (normal.x < -0.65) {
        faceSelector = "<X";
        faceName = "左侧面 Left Face (-X)";
        faceDesc = "垂直于 X 负方向的侧表面";
      } else if (normal.y > 0.65) {
        faceSelector = ">Y";
        faceName = "后侧面 Back Face (+Y)";
        faceDesc = "垂直于 Y 正方向的表面";
      } else if (normal.y < -0.65) {
        faceSelector = "<Y";
        faceName = "前侧面 Front Face (-Y)";
        faceDesc = "垂直于 Y 负方向的正面特征";
      } else {
        faceSelector = "|Z";
        faceName = "侧曲面 (%CYLINDER)";
        faceDesc = "回转曲面，平行于 Z 轴中心轴";
      }

      // 2. 线/棱边解析 (Edge)
      // 在 CadQuery 中，孔口圆边以 %Circle 最具代表性
      let edgeSelector = "%Circle";
      let edgeName = "圆孔/轮廓圆边 (%Circle)";
      let edgeDesc = "圆周特征边缘，最适宜倒圆角 fillet 与倒斜角 chamfer";

      const distFromCenterXY = Math.sqrt(point.x * point.x + point.y * point.y);
      if (Math.abs(normal.z) < 0.35 && distFromCenterXY > 5) {
        edgeSelector = "|Z";
        edgeName = "竖直棱边 (|Z)";
        edgeDesc = "平行于 Z 轴的竖直棱边，适合批量倒圆角 fillet";
      } else if (point.z > 0) {
        edgeSelector = "%Circle";
        edgeName = "顶周圆孔边缘 (%Circle)";
        edgeDesc = "顶部圆孔口或外周圆边";
      } else {
        edgeSelector = "<Z";
        edgeName = "底面边缘 (<Z)";
        edgeDesc = "底部轮廓边";
      }

      // 3. 点坐标解析 (Vertex)
      const px = Number(point.x.toFixed(1));
      const py = Number(point.y.toFixed(1));
      const pz = Number(point.z.toFixed(1));

      setPickedData({
        face: {
          name: faceName,
          selector: faceSelector,
          normal: `[${normal.x.toFixed(2)}, ${normal.y.toFixed(2)}, ${normal.z.toFixed(2)}]`,
          desc: faceDesc,
        },
        edge: {
          name: edgeName,
          selector: edgeSelector,
          desc: edgeDesc,
        },
        vertex: {
          x: px,
          y: py,
          z: pz,
          pointStr: `(${px}, ${py}, ${pz})`,
        },
      });
      setIsInspectorOpen(true);
    };

    container.addEventListener("pointerdown", handlePointerDown);
    container.addEventListener("contextmenu", handleContextMenuEvent, { capture: true });
    return () => {
      container.removeEventListener("pointerdown", handlePointerDown);
      container.removeEventListener("contextmenu", handleContextMenuEvent, { capture: true } as any);
    };
  }, []);

  // 渲染几何网格并居中对焦
  const renderMesh = (display: any, data: any) => {
    if (!display || !display.viewer || !data) return;

    try {
      display.viewer.clear();

      const renderOptions = {
        edgeColor: 0x111827,
        defaultColor: "#3b82f6",
        defaultOpacity: 1.0,
        blackEdges: blackEdges,
        normalLen: 0,
      };

      const viewerOptions = {
        ortho: isOrtho,
        grid: [showGrid, false, false],
        axes: showAxes,
        axes0: showAxes,
        transparent: false,
        blackEdges: blackEdges,
        theme: theme,
      };

      display.viewer.render(data, renderOptions, viewerOptions);

      // 视口居中聚焦保证
      setTimeout(() => {
        if (typeof display.setView === "function") {
          display.setView("iso", true);
        } else if (typeof display.viewer?.presetCamera === "function") {
          display.viewer.presetCamera("iso");
          display.viewer.reset();
        }
      }, 50);
    } catch (e) {
      console.error("渲染 CadQuery 网格失败:", e);
    }
  };

  useEffect(() => {
    if (displayRef.current && meshData) {
      renderMesh(displayRef.current, meshData);
    }
  }, [meshData]);

  // 时间旅行自动播放循环
  useEffect(() => {
    if (!isPlaying) return;
    if (!totalSteps || totalSteps <= 1) {
      setIsPlaying(false);
      return;
    }

    const timer = setInterval(() => {
      if (currentStep >= totalSteps) {
        onStepChange?.(1);
      } else {
        onStepChange?.(currentStep + 1);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isPlaying, currentStep, totalSteps, onStepChange]);

  // 相机视角预设切换
  const handlePresetCamera = (dir: "iso" | "top" | "front" | "right") => {
    if (!displayRef.current?.viewer) return;
    try {
      displayRef.current.viewer.presetCamera(dir);
    } catch (e) {
      console.error(`视角切换 ${dir} 失败:`, e);
    }
  };

  // 重置视角对焦
  const handleResetCamera = () => {
    if (!displayRef.current) return;
    try {
      if (typeof displayRef.current.setView === "function") {
        displayRef.current.setView("iso", true);
      } else {
        displayRef.current.viewer.reset();
      }
    } catch (e) {
      console.error("重置相机失败:", e);
    }
  };

  // 投影模式切换
  const toggleOrtho = () => {
    if (!displayRef.current?.viewer) return;
    const nextOrtho = !isOrtho;
    setIsOrtho(nextOrtho);
    try {
      displayRef.current.viewer.switchCamera(nextOrtho);
    } catch (e) {
      console.error("切换正交/透视失败:", e);
    }
  };

  // 网格切换
  const toggleGrid = () => {
    if (!displayRef.current?.viewer) return;
    const nextGrid = !showGrid;
    setShowGrid(nextGrid);
    try {
      displayRef.current.setGrid("grid", nextGrid);
    } catch (e) {
      console.error("切换网格失败:", e);
    }
  };

  // 拓扑黑边切换
  const toggleBlackEdges = () => {
    if (!displayRef.current?.viewer) return;
    const nextBlack = !blackEdges;
    setBlackEdges(nextBlack);
    try {
      displayRef.current.setBlackEdges("black_edges", nextBlack);
    } catch (e) {
      console.error("切换轮廓线失败:", e);
    }
  };

  // 明暗主题切换
  const toggleTheme = () => {
    if (!displayRef.current) return;
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    try {
      displayRef.current.setTheme(nextTheme);
    } catch (e) {
      console.error("切换主题失败:", e);
    }
  };

  // 展开 / 收起结构树
  const toggleTreeSidebar = () => {
    setShowTree((prev) => !prev);
    setTimeout(() => {
      if (displayRef.current && containerRef.current) {
        displayRef.current.setSizes({
          cadWidth: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    }, 100);
  };

  // 1. 添加立方体
  const handleCreateBox = () => {
    const { length, width, height } = boxParams;
    onInjectCode?.(`    Box(${length}, ${width}, ${height})\n`);
    onApplyToBlockly?.("box", undefined, undefined, undefined, { length, width, height });
    triggerCopyToast("box", `已创建立方体 (${length}x${width}x${height})`);
    setIsAddMenuOpen(false);
  };

  // 2. 添加圆柱体
  const handleCreateCylinder = () => {
    const { height, radius } = cylParams;
    onInjectCode?.(`    Cylinder(radius=${radius}, height=${height})\n`);
    onApplyToBlockly?.("cylinder", undefined, undefined, undefined, { height, radius });
    triggerCopyToast("cylinder", `已创建圆柱体 (h=${height}, r=${radius})`);
    setIsAddMenuOpen(false);
  };

  // 3. 添加球体
  const handleCreateSphere = () => {
    const { radius } = sphParams;
    onInjectCode?.(`    Sphere(radius=${radius})\n`);
    onApplyToBlockly?.("sphere", undefined, undefined, undefined, { radius });
    triggerCopyToast("sphere", `已创建球体 (r=${radius})`);
    setIsAddMenuOpen(false);
  };

  // 4. 添加圆锥台
  const handleCreateCone = () => {
    const { height, bottomR, topR } = coneParams;
    onInjectCode?.(`    Cone(bottom_radius=${bottomR}, top_radius=${topR}, height=${height})\n`);
    triggerCopyToast("cone", `已创建圆锥台 (h=${height}, r1=${bottomR}, r2=${topR})`);
    setIsAddMenuOpen(false);
  };

  // 5. 添加矩形草图并拉伸
  const handleCreateSketchRect = () => {
    const { width, height, extrude } = sketchRectParams;
    onInjectCode?.(`    with BuildSketch():\n        Rectangle(${width}, ${height})\n    extrude(amount=${extrude})\n`);
    onApplyToBlockly?.("extrude", undefined, undefined, undefined, { distance: extrude });
    triggerCopyToast("sketch-rect", `已拉伸矩形草图 (${width}x${height} -> ${extrude}mm)`);
    setIsAddMenuOpen(false);
  };

  // 6. 添加圆形草图并拉伸
  const handleCreateSketchCircle = () => {
    const { radius, extrude } = sketchCircleParams;
    onInjectCode?.(`    with BuildSketch():\n        Circle(radius=${radius})\n    extrude(amount=${extrude})\n`);
    onApplyToBlockly?.("extrude", undefined, undefined, undefined, { distance: extrude });
    triggerCopyToast("sketch-circle", `已拉伸圆形草图 (r=${radius} -> ${extrude}mm)`);
    setIsAddMenuOpen(false);
  };

  // 7. 添加机械法兰盘
  const handleCreateFlange = () => {
    const { outerR, centerD, thickness } = flangeParams;
    onInjectCode?.(`    Cylinder(radius=${outerR}, height=${thickness})\n    Hole(radius=${centerD / 2}, depth=${thickness})\n`);
    onApplyToBlockly?.("flange", undefined, undefined, undefined, { outerR, centerD, thickness });
    triggerCopyToast("flange", `已创建机械法兰盘 (R=${outerR}, 孔=${centerD})`);
    setIsAddMenuOpen(false);
  };

  // 8. 添加衬套 / 轴套
  const handleCreateBushing = () => {
    const { outerR, holeD, height } = bushingParams;
    onInjectCode?.(`    Cylinder(radius=${outerR}, height=${height})\n    Hole(radius=${holeD / 2}, depth=${height})\n`);
    triggerCopyToast("bushing", `已创建机械衬套轴套 (R=${outerR}, 内径=${holeD})`);
    setIsAddMenuOpen(false);
  };

  // 9. 添加空心管件
  const handleCreatePipe = () => {
    const { outerR, innerR, height } = pipeParams;
    onInjectCode?.(`    Cylinder(radius=${outerR}, height=${height})\n    Hole(radius=${innerR}, depth=${height})\n`);
    triggerCopyToast("pipe", `已创建空心管件 (外R=${outerR}, 内R=${innerR})`);
    setIsAddMenuOpen(false);
  };

  // 右键菜单与画布点击处理
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.min(Math.max(10, e.clientX - rect.left), rect.width - 240);
    const y = Math.min(Math.max(10, e.clientY - rect.top), rect.height - 300);
    setContextMenuPos({ x, y });
    setIsContextMenuOpen(true);
    setIsAddMenuOpen(false);
  };

  const handleViewportClick = () => {
    if (isContextMenuOpen) {
      setIsContextMenuOpen(false);
    }
  };

  // 3D CAD 命令面板配置
  const COMMANDS = [
    {
      id: "add-box",
      title: "添加立方体 (Box 20x20x10)",
      category: "基本体",
      shortcut: "Shift + A",
      icon: Box,
      action: () => handleCreateBox(),
    },
    {
      id: "add-cylinder",
      title: "添加圆柱体 (Cylinder h=30, r=15)",
      category: "基本体",
      shortcut: "Shift + A",
      icon: Cylinder,
      action: () => handleCreateCylinder(),
    },
    {
      id: "add-sphere",
      title: "添加球体 (Sphere r=15)",
      category: "基本体",
      shortcut: "Shift + A",
      icon: Dot,
      action: () => handleCreateSphere(),
    },
    {
      id: "add-flange",
      title: "添加机械法兰盘 (Flange)",
      category: "机械件",
      shortcut: "Shift + A",
      icon: Box,
      action: () => handleCreateFlange(),
    },
    {
      id: "op-fillet",
      title: `棱边倒圆角 (Fillet ${quickRadius}mm)`,
      category: "特征修改",
      shortcut: "Ctrl + B",
      icon: Sparkles,
      action: () => {
        onInjectCode?.(`    fillet(${targetVar}.edges().filter_by(Axis.Z), radius=${quickRadius})\n`);
        onApplyToBlockly?.("edge", pickedData.edge.selector, undefined, quickRadius);
        triggerCopyToast("fillet", `已倒圆角 (${quickRadius}mm)`);
      },
    },
    {
      id: "op-bore-fillet",
      title: `顶面内孔口倒圆角 (faces('>Z').edges('%Circle'))`,
      category: "特征修改",
      shortcut: "🔘",
      icon: Sparkles,
      action: () => {
        onInjectCode?.(`    fillet(${targetVar}.faces().sort_by(Axis.Z)[-1].edges().filter_by(GeomType.CIRCLE), radius=${quickRadius})\n`);
        onApplyToBlockly?.("edge", "faces_Z_circle", undefined, quickRadius);
        triggerCopyToast("bore-fillet", `已注入内孔口倒圆角 (${quickRadius}mm)`);
      },
    },
    {
      id: "op-chamfer",
      title: `棱边倒斜角 (Chamfer ${quickRadius}mm)`,
      category: "特征修改",
      shortcut: "📐",
      icon: Slash,
      action: () => {
        onInjectCode?.(`    chamfer(${targetVar}.faces().sort_by(Axis.Z)[-1].edges(), length=${quickRadius})\n`);
        onApplyToBlockly?.("edge", pickedData.edge.selector, undefined, quickRadius);
        triggerCopyToast("chamfer", `已倒斜角 (${quickRadius}mm)`);
      },
    },
    {
      id: "op-extrude",
      title: "表面拉伸凸台 (Extrude 10mm)",
      category: "建模操作",
      shortcut: "E",
      icon: ArrowUpSquare,
      action: () => {
        onInjectCode?.(
          `    with BuildSketch(${targetVar}.faces().sort_by(Axis.Z)[-1]):\n        Circle(radius=10)\n    extrude(amount=10)\n`
        );
        onApplyToBlockly?.("extrude", undefined, undefined, undefined, { distance: 10 });
        triggerCopyToast("extrude", "已执行表面拉伸 (10mm)");
      },
    },
    {
      id: "op-hole",
      title: "表面打孔 (Hole d=5mm, depth=10mm)",
      category: "建模操作",
      shortcut: "I",
      icon: CircleDot,
      action: () => {
        onInjectCode?.(`    with Locations(${targetVar}.faces().sort_by(Axis.Z)[-1]):\n        Hole(radius=2.5, depth=10)\n`);
        onApplyToBlockly?.("hole", undefined, undefined, undefined, { diameter: 5, depth: 10 });
        triggerCopyToast("hole", "已在表面打孔 (d=5mm, depth=10mm)");
      },
    },
    {
      id: "op-shell",
      title: "表面抽壳挖空 (Shell 2mm)",
      category: "建模操作",
      shortcut: "🐚",
      icon: Minimize2,
      action: () => {
        onInjectCode?.(`    offset(amount=-2, openings=${targetVar}.faces().sort_by(Axis.Z)[-1])\n`);
        triggerCopyToast("shell", "已执行抽壳挖空 (-2mm)");
      },
    },
    {
      id: "op-workplane",
      title: "在此面新建草图 (BuildSketch)",
      category: "草图面",
      shortcut: "✏️",
      icon: Spline,
      action: () => {
        const faceExpr = getFaceExpr(pickedData.face.selector);
        onInjectCode?.(`    with BuildSketch(${faceExpr}):\n        Circle(radius=5)\n`);
        onApplyToBlockly?.("face", pickedData.face.selector);
        triggerCopyToast("wp", "已建立草图建造容器 BuildSketch");
      },
    },
    {
      id: "mode-vertex",
      title: "切换为顶点拾取模式 (Vertex Mode)",
      category: "视图模式",
      shortcut: "1",
      icon: Dot,
      action: () => setPickTab("vertex"),
    },
    {
      id: "mode-edge",
      title: "切换为棱边拾取模式 (Edge Mode)",
      category: "视图模式",
      shortcut: "2",
      icon: Spline,
      action: () => setPickTab("edge"),
    },
    {
      id: "mode-face",
      title: "切换为表面拾取模式 (Face Mode)",
      category: "视图模式",
      shortcut: "3",
      icon: Box,
      action: () => setPickTab("face"),
    },
    {
      id: "view-iso",
      title: "视角切换: 等轴测视图 (Iso View)",
      category: "视图",
      shortcut: "Iso",
      icon: Compass,
      action: () => handlePresetCamera("iso"),
    },
    {
      id: "view-top",
      title: "视角切换: 俯视图 (Top View)",
      category: "视图",
      shortcut: "Top",
      icon: Compass,
      action: () => handlePresetCamera("top"),
    },
    {
      id: "export-step",
      title: "导出工业标准 STEP 文件",
      category: "导出",
      shortcut: "Ctrl + S",
      icon: Check,
      action: () => onExportStep?.(),
    },
    {
      id: "export-stl",
      title: "导出 3D 打印 STL 网格",
      category: "导出",
      shortcut: "STL",
      icon: Check,
      action: () => onExportStl?.(),
    },
  ];

  const filteredCommands = COMMANDS.filter((cmd) => {
    if (!commandSearchQuery.trim()) return true;
    const q = commandSearchQuery.toLowerCase();
    return (
      cmd.title.toLowerCase().includes(q) ||
      cmd.category.toLowerCase().includes(q) ||
      cmd.id.toLowerCase().includes(q)
    );
  });

  const handleCommandPaletteKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsCommandPaletteOpen(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setCommandSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredCommands.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCommandSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % Math.max(1, filteredCommands.length));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredCommands[commandSelectedIndex]) {
        filteredCommands[commandSelectedIndex].action();
        setIsCommandPaletteOpen(false);
      }
    }
  };

  // 当前回放步骤代码
  const currentStepCode =
    steps.length > 0 && currentStep <= steps.length
      ? steps[currentStep - 1].code
      : "完整实体模型";

  return (
    <div className={`relative w-full h-full flex flex-col ${theme === "light" ? "bg-[#f0f2f5]" : "bg-[#0d1117]"} overflow-hidden select-none`}>
      {/* 顶部标题与整合式视口工具栏 (彻底消除视口内部遮挡) */}
      <div
        className={`h-9 px-3 flex items-center justify-between ${
          theme === "light"
            ? "bg-white border-b border-[#e5e7eb] text-gray-800"
            : "bg-[#161b22] border-b border-[#30363d] text-gray-300"
        } text-xs font-semibold z-10`}
      >
        <div className="flex items-center space-x-2 flex-shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>CAD 拓扑视口</span>
          <span className="text-[10px] text-emerald-500 font-mono font-normal px-1.5 py-0.2 bg-emerald-500/10 border border-emerald-500/20 rounded hidden md:inline-block">
            B-Rep Active
          </span>

          {/* 1/2/3 选点/线/面模式快捷切换 */}
          <div
            className={`flex items-center ${
              theme === "light" ? "bg-[#f3f4f6] border-[#e5e7eb]" : "bg-[#21262d] border-[#30363d]"
            } rounded-md p-0.5 border text-[11px] ml-1`}
          >
            <button
              onClick={() => setPickTab("vertex")}
              className={`px-1.5 py-0.5 rounded font-medium transition flex items-center gap-1 ${
                pickTab === "vertex"
                  ? "bg-amber-600 text-white shadow-sm font-semibold"
                  : theme === "light"
                  ? "text-gray-600 hover:text-gray-900"
                  : "text-gray-400 hover:text-gray-200"
              }`}
              title="按快捷键 [1]: 选点 (Vertex)"
            >
              <span className="font-mono text-[9px] opacity-70">1</span>
              <span>点</span>
            </button>
            <button
              onClick={() => setPickTab("edge")}
              className={`px-1.5 py-0.5 rounded font-medium transition flex items-center gap-1 ${
                pickTab === "edge"
                  ? "bg-emerald-600 text-white shadow-sm font-semibold"
                  : theme === "light"
                  ? "text-gray-600 hover:text-gray-900"
                  : "text-gray-400 hover:text-gray-200"
              }`}
              title="按快捷键 [2]: 选边 (Edge)"
            >
              <span className="font-mono text-[9px] opacity-70">2</span>
              <span>线</span>
            </button>
            <button
              onClick={() => setPickTab("face")}
              className={`px-1.5 py-0.5 rounded font-medium transition flex items-center gap-1 ${
                pickTab === "face"
                  ? "bg-blue-600 text-white shadow-sm font-semibold"
                  : theme === "light"
                  ? "text-gray-600 hover:text-gray-900"
                  : "text-gray-400 hover:text-gray-200"
              }`}
              title="按快捷键 [3]: 选面 (Face)"
            >
              <span className="font-mono text-[9px] opacity-70">3</span>
              <span>面</span>
            </button>
          </div>
        </div>

        {/* 3D 视图图层实时显示控制：基准平面 · 2D草图 · 3D模型 */}
        <div
          className={`flex items-center ${
            theme === "light" ? "bg-[#f3f4f6] border-[#e5e7eb]" : "bg-[#21262d] border-[#30363d]"
          } rounded-lg p-0.5 border text-[11px]`}
        >
          <button
            onClick={() => setShowPlaneLayer(!showPlaneLayer)}
            title={showPlaneLayer ? "点击隐藏基准平面网格" : "点击显示基准平面网格"}
            className={`px-1.5 py-0.5 rounded font-medium transition flex items-center gap-1 ${
              showPlaneLayer
                ? "bg-purple-600 text-white shadow-sm"
                : theme === "light"
                ? "text-gray-500 hover:text-gray-800"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            <span>📐 平面</span>
          </button>
          <button
            onClick={() => setShowSketchLayer(!showSketchLayer)}
            title={showSketchLayer ? "点击隐藏 2D 草图线" : "点击显示 2D 草图线"}
            className={`px-1.5 py-0.5 rounded font-medium transition flex items-center gap-1 ${
              showSketchLayer
                ? "bg-amber-600 text-white shadow-sm"
                : theme === "light"
                ? "text-gray-500 hover:text-gray-800"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            <span>✏️ 草图</span>
          </button>
          <button
            onClick={() => setShowModelLayer(!showModelLayer)}
            title={showModelLayer ? "点击隐藏 3D 实体模型" : "点击显示 3D 实体模型"}
            className={`px-1.5 py-0.5 rounded font-medium transition flex items-center gap-1 ${
              showModelLayer
                ? "bg-blue-600 text-white shadow-sm"
                : theme === "light"
                ? "text-gray-500 hover:text-gray-800"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            <span>📦 模型</span>
          </button>
        </div>

        {/* 视口核心相机与显示模式控制组 (集成于顶部 Header，0 视口遮挡) */}
        <div className="flex items-center space-x-1.5">
          {/* 相机视角切换组 */}
          <div
            className={`flex items-center ${
              theme === "light" ? "bg-[#f3f4f6] border-[#e5e7eb]" : "bg-[#21262d] border-[#30363d]"
            } rounded-lg p-0.5 border`}
          >
            <button
              onClick={() => handlePresetCamera("iso")}
              title="等轴测视角 (Isometric)"
              className={`px-1.5 py-0.5 ${
                theme === "light" ? "hover:bg-white text-gray-700" : "hover:bg-[#30363d] text-gray-200"
              } rounded text-[11px] font-medium transition`}
            >
              Iso
            </button>
            <button
              onClick={() => handlePresetCamera("top")}
              title="顶视 (Top)"
              className={`px-1.5 py-0.5 ${
                theme === "light" ? "hover:bg-white text-gray-700" : "hover:bg-[#30363d] text-gray-200"
              } rounded text-[11px] font-medium transition`}
            >
              Top
            </button>
            <button
              onClick={() => handlePresetCamera("front")}
              title="正视 (Front)"
              className={`px-1.5 py-0.5 ${
                theme === "light" ? "hover:bg-white text-gray-700" : "hover:bg-[#30363d] text-gray-200"
              } rounded text-[11px] font-medium transition`}
            >
              Front
            </button>
            <button
              onClick={() => handlePresetCamera("right")}
              title="右侧视 (Right)"
              className={`px-1.5 py-0.5 ${
                theme === "light" ? "hover:bg-white text-gray-700" : "hover:bg-[#30363d] text-gray-200"
              } rounded text-[11px] font-medium transition`}
            >
              Right
            </button>
          </div>

          <span className={`w-px h-3.5 ${theme === "light" ? "bg-[#e5e7eb]" : "bg-[#30363d]"}`}></span>

          {/* 正交/透视 */}
          <button
            onClick={toggleOrtho}
            title={isOrtho ? "切换为透视投影" : "切换为工程正交投影"}
            className={`p-1 rounded transition ${
              isOrtho
                ? "bg-blue-600 text-white"
                : theme === "light"
                ? "text-gray-600 hover:text-gray-900 hover:bg-[#f3f4f6]"
                : "text-gray-400 hover:text-white hover:bg-[#21262d]"
            }`}
          >
            <Compass size={13} />
          </button>

          {/* 底面网格 */}
          <button
            onClick={toggleGrid}
            title={showGrid ? "隐藏网格" : "显示网格"}
            className={`p-1 rounded transition ${
              showGrid
                ? "text-blue-500 bg-blue-500/10"
                : theme === "light"
                ? "text-gray-500 hover:text-gray-900 hover:bg-[#f3f4f6]"
                : "text-gray-500 hover:text-white hover:bg-[#21262d]"
            }`}
          >
            <Grid3X3 size={13} />
          </button>

          {/* 拓扑黑边 */}
          <button
            onClick={toggleBlackEdges}
            title={blackEdges ? "隐藏拓扑黑边" : "显示拓扑黑边"}
            className={`p-1 rounded transition ${
              blackEdges
                ? "text-emerald-500 bg-emerald-500/10"
                : theme === "light"
                ? "text-gray-500 hover:text-gray-900 hover:bg-[#f3f4f6]"
                : "text-gray-500 hover:text-white hover:bg-[#21262d]"
            }`}
          >
            <Layers size={13} />
          </button>

          {/* 视角重置 */}
          <button
            onClick={handleResetCamera}
            title="居中重置视角"
            className={`p-1 ${
              theme === "light"
                ? "text-gray-600 hover:text-gray-900 hover:bg-[#f3f4f6]"
                : "text-gray-400 hover:text-white hover:bg-[#21262d]"
            } rounded transition`}
          >
            <RotateCcw size={13} />
          </button>

          {/* 明暗底色 */}
          <button
            onClick={toggleTheme}
            title="明暗底色切换"
            className={`p-1 ${
              theme === "light"
                ? "text-gray-600 hover:text-gray-900 hover:bg-[#f3f4f6]"
                : "text-gray-400 hover:text-white hover:bg-[#21262d]"
            } rounded transition`}
          >
            {theme === "dark" ? <Sun size={13} /> : <Moon size={13} />}
          </button>

          {/* 结构树侧栏 */}
          <button
            onClick={toggleTreeSidebar}
            title={showTree ? "收起结构树" : "展开拓扑结构树"}
            className={`p-1 rounded transition ${
              showTree
                ? "text-indigo-500 bg-indigo-500/10"
                : theme === "light"
                ? "text-gray-500 hover:text-gray-900 hover:bg-[#f3f4f6]"
                : "text-gray-500 hover:text-white hover:bg-[#21262d]"
            }`}
          >
            <FolderTree size={13} />
          </button>
        </div>
      </div>

      {/* 3D Viewport 画布区 (无顶栏遮挡，three-cad-viewer 原生工具完全露显) */}
      <div
        className="relative flex-1 w-full h-full overflow-hidden"
        onContextMenu={handleContextMenu}
        onClick={handleViewportClick}
      >
        {/* three-cad-viewer 容器 */}
        <div
          ref={containerRef}
          className={`w-full h-full cad-viewer-container cursor-crosshair ${showTree ? "show-tree" : ""} ${
            theme === "light" ? "bg-[#f0f2f5]" : "bg-[#090d13]"
          }`}
        />

        {/* 草图交互全屏绘制层与 SVG 动态尺寸投影标注 */}
        {activeTool === "sketch" && (
          <div
            data-testid="sketch-drawing-layer"
            className="absolute inset-0 z-30 cursor-crosshair select-none"
            onPointerDown={handleSketchPointerDown}
            onPointerMove={handleSketchPointerMove}
            onPointerUp={handleSketchPointerUp}
          >
            {/* SVG 实时几何尺寸跟随投影预览 */}
            <svg className="w-full h-full pointer-events-none absolute inset-0">
              {/* 0. 选定草图附着面的 3D 投影基准面高亮网格 */}
              {(() => {
                const z = pickedData.vertex?.z || 0;
                const size = 20;
                const c1 = projectToScreen(new THREE.Vector3(-size, -size, z));
                const c2 = projectToScreen(new THREE.Vector3(size, -size, z));
                const c3 = projectToScreen(new THREE.Vector3(size, size, z));
                const c4 = projectToScreen(new THREE.Vector3(-size, size, z));
                const center = projectToScreen(new THREE.Vector3(0, 0, z));
                if (!c1 || !c2 || !c3 || !c4 || !center) return null;
                return (
                  <g opacity="0.85">
                    <polygon
                      points={`${c1.x},${c1.y} ${c2.x},${c2.y} ${c3.x},${c3.y} ${c4.x},${c4.y}`}
                      fill="rgba(168, 85, 247, 0.12)"
                      stroke="#a855f7"
                      strokeWidth="1.5"
                      strokeDasharray="4 3"
                    />
                    <circle cx={center.x} cy={center.y} r="3.5" fill="#a855f7" />
                    <line x1={center.x - 10} y1={center.y} x2={center.x + 10} y2={center.y} stroke="#a855f7" strokeWidth="1" />
                    <line x1={center.x} y1={center.y - 10} x2={center.x} y2={center.y + 10} stroke="#a855f7" strokeWidth="1" />
                    <rect
                      x={center.x + 12}
                      y={center.y - 12}
                      width="155"
                      height="20"
                      rx="4"
                      fill="#161b22"
                      fillOpacity="0.9"
                      stroke="#a855f7"
                      strokeWidth="0.8"
                    />
                    <text x={center.x + 16} y={center.y + 2} fill="#c084fc" fontSize="10" fontFamily="monospace" fontWeight="bold">
                      草图附着面 ({pickedData.face.selector} Z={z})
                    </text>
                  </g>
                );
              })()}

              {/* 1. 圆形实时动态预览 */}
              {isSketchDrawing && sketchShape === "circle" && sketchStart && sketchCurrent && (() => {
                const p1 = projectToScreen(sketchStart);
                const p2 = projectToScreen(sketchCurrent);
                if (!p1 || !p2) return null;
                const screenR = Math.hypot(p2.x - p1.x, p2.y - p1.y);
                const worldR = Math.round(sketchStart.distanceTo(sketchCurrent) * 10) / 10;
                return (
                  <g>
                    <circle
                      cx={p1.x}
                      cy={p1.y}
                      r={screenR}
                      fill="rgba(245, 158, 11, 0.18)"
                      stroke="#f59e0b"
                      strokeWidth="2"
                      strokeDasharray="4 3"
                    />
                    <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#f59e0b" strokeWidth="1.5" />
                    <circle cx={p1.x} cy={p1.y} r="4" fill="#f59e0b" />
                    <circle cx={p2.x} cy={p2.y} r="3" fill="#ffffff" />
                    <rect
                      x={p2.x + 8}
                      y={p2.y - 12}
                      width="74"
                      height="20"
                      rx="4"
                      fill="#161b22"
                      fillOpacity="0.85"
                    />
                    <text x={p2.x + 12} y={p2.y + 2} fill="#f59e0b" fontSize="11" fontFamily="monospace" fontWeight="bold">
                      R={worldR}mm
                    </text>
                  </g>
                );
              })()}

              {/* 2. 矩形实时动态预览 */}
              {isSketchDrawing && sketchShape === "rect" && sketchStart && sketchCurrent && (() => {
                const p1 = projectToScreen(sketchStart);
                const p2 = projectToScreen(sketchCurrent);
                if (!p1 || !p2) return null;
                const left = Math.min(p1.x, p2.x);
                const top = Math.min(p1.y, p2.y);
                const w = Math.abs(p2.x - p1.x);
                const h = Math.abs(p2.y - p1.y);
                const worldW = Math.round(Math.abs(sketchCurrent.x - sketchStart.x) * 10) / 10;
                const worldH = Math.round(Math.abs(sketchCurrent.y - sketchStart.y) * 10) / 10;
                return (
                  <g>
                    <rect
                      x={left}
                      y={top}
                      width={w}
                      height={h}
                      fill="rgba(59, 130, 246, 0.18)"
                      stroke="#3b82f6"
                      strokeWidth="2"
                      strokeDasharray="4 3"
                    />
                    <circle cx={p1.x} cy={p1.y} r="4" fill="#3b82f6" />
                    <circle cx={p2.x} cy={p2.y} r="3" fill="#ffffff" />
                    <rect
                      x={p2.x + 8}
                      y={p2.y - 12}
                      width="90"
                      height="20"
                      rx="4"
                      fill="#161b22"
                      fillOpacity="0.85"
                    />
                    <text x={p2.x + 12} y={p2.y + 2} fill="#60a5fa" fontSize="11" fontFamily="monospace" fontWeight="bold">
                      {worldW}×{worldH}mm
                    </text>
                  </g>
                );
              })()}

              {/* 3. 多边形折线闭合区域动态预览 */}
              {sketchShape === "polygon" && (() => {
                if (polygonPoints.length === 0) return null;
                const screenPts = polygonPoints.map((pt) => projectToScreen(pt)).filter(Boolean) as { x: number; y: number }[];
                if (screenPts.length === 0) return null;
                const currentScreen = sketchCurrent ? projectToScreen(sketchCurrent) : null;
                const pointsStr = screenPts.map((p) => `${p.x},${p.y}`).join(" ");

                return (
                  <g>
                    {screenPts.length > 1 && (
                      <polyline
                        points={pointsStr}
                        fill="rgba(16, 185, 129, 0.12)"
                        stroke="#10b981"
                        strokeWidth="2"
                      />
                    )}
                    {/* 当前鼠标连线虚线 */}
                    {currentScreen && (
                      <line
                        x1={screenPts[screenPts.length - 1].x}
                        y1={screenPts[screenPts.length - 1].y}
                        x2={currentScreen.x}
                        y2={currentScreen.y}
                        stroke="#10b981"
                        strokeWidth="1.5"
                        strokeDasharray="3 3"
                      />
                    )}
                    {/* 起点闭合高亮环 */}
                    <circle
                      cx={screenPts[0].x}
                      cy={screenPts[0].y}
                      r="6"
                      fill="#10b981"
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                    {/* 其它已定点 */}
                    {screenPts.slice(1).map((p, idx) => (
                      <circle key={idx} cx={p.x} cy={p.y} r="4" fill="#34d399" />
                    ))}
                  </g>
                );
              })()}
            </svg>
          </div>
        )}

        {/* 草图模式浮动 HUD 操作岛 */}
        {activeTool === "sketch" && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 bg-[#161b22]/95 border border-amber-500/50 backdrop-blur-md rounded-xl shadow-2xl px-3 py-1.5 flex items-center gap-2 text-xs select-none flex-nowrap whitespace-nowrap">
            <div className="flex items-center gap-1.5 border-r border-[#30363d] pr-2.5 text-amber-400 font-semibold tracking-wide flex-shrink-0">
              <Pencil size={14} />
              <span>build123d 草图</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-mono bg-purple-950/60 border border-purple-800/60 px-2 py-0.5 rounded text-purple-300">
              <span>附着面:</span>
              <span className="font-bold text-amber-300">{getFaceExpr(pickedData.face.selector)}</span>
            </div>

            {/* 草图形状切换 */}
            <div className="flex items-center bg-[#21262d] rounded-lg p-0.5 border border-[#30363d] text-[11px] gap-0.5 flex-shrink-0">
              <button
                onClick={() => {
                  setSketchShape("circle");
                  setPolygonPoints([]);
                }}
                className={`px-2.5 py-1 rounded-md transition flex items-center gap-1 ${
                  sketchShape === "circle" ? "bg-amber-600 text-white shadow font-semibold" : "text-gray-400 hover:text-white"
                }`}
              >
                <Circle size={12} />
                <span>圆</span>
              </button>
              <button
                onClick={() => {
                  setSketchShape("rect");
                  setPolygonPoints([]);
                }}
                className={`px-2.5 py-1 rounded-md transition flex items-center gap-1 ${
                  sketchShape === "rect" ? "bg-blue-600 text-white shadow font-semibold" : "text-gray-400 hover:text-white"
                }`}
              >
                <Square size={12} />
                <span>矩形</span>
              </button>
              <button
                onClick={() => setSketchShape("polygon")}
                className={`px-2.5 py-1 rounded-md transition flex items-center gap-1 ${
                  sketchShape === "polygon" ? "bg-emerald-600 text-white shadow font-semibold" : "text-gray-400 hover:text-white"
                }`}
              >
                <Spline size={12} />
                <span>多边形折线</span>
              </button>
            </div>

            {/* 多边形模式下的完成/清除按钮 */}
            {sketchShape === "polygon" && (
              <div className="flex items-center gap-1.5 pl-1 flex-shrink-0">
                <button
                  onClick={handleSketchFinishPolygon}
                  disabled={polygonPoints.length < 3}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white rounded-md text-[11px] font-medium transition shadow-sm"
                >
                  闭合完成 ({polygonPoints.length}点)
                </button>
                {polygonPoints.length > 0 && (
                  <button
                    onClick={() => setPolygonPoints([])}
                    className="px-2 py-1 hover:bg-red-600/30 text-red-400 rounded-md text-[11px] transition"
                  >
                    清空
                  </button>
                )}
              </div>
            )}

            {/* 退出草图模式 */}
            <button
              onClick={() => {
                setActiveTool("select");
                setIsSketchDrawing(false);
                setSketchStart(null);
                setSketchCurrent(null);
                setPolygonPoints([]);
              }}
              className="p-1 hover:bg-[#30363d] text-gray-400 hover:text-white rounded-lg transition ml-1 flex-shrink-0"
              title="退出草图绘制模式"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* 左侧 3D CAD 悬浮工具栏 (可自由拖动 + 折叠隐藏) */}
        <div
          ref={toolbarRef}
          style={
            toolbarPos
              ? { left: `${toolbarPos.x}px`, top: `${toolbarPos.y}px`, position: "fixed" }
              : undefined
          }
          className={`${
            !toolbarPos ? "absolute top-14 left-3" : ""
          } z-20 flex flex-col items-center ${
            theme === "light"
              ? "bg-white/95 border-[#d0d7de] text-gray-800"
              : "bg-[#161b22]/95 border-[#30363d] text-gray-200"
          } backdrop-blur-md border shadow-2xl rounded-xl text-xs select-none animate-in fade-in slide-in-from-left-2 duration-150 ring-1 ring-black/5`}
        >
          {/* 顶部拖动手柄与折叠切换 */}
          <div
            className={`w-full flex items-center justify-between p-1 ${
              theme === "light" ? "bg-[#f3f4f6] border-b border-[#e5e7eb]" : "bg-[#21262d] border-b border-[#30363d]"
            } rounded-t-xl cursor-move`}
          >
            <div
              onPointerDown={startDragToolbar}
              className={`p-1 ${
                theme === "light" ? "text-gray-500 hover:text-amber-600" : "text-gray-400 hover:text-amber-400"
              } transition`}
              title="按住可拖动工具栏位置"
            >
              <GripVertical size={13} />
            </div>
            <button
              onClick={() => setIsToolbarCollapsed(!isToolbarCollapsed)}
              title={isToolbarCollapsed ? "展开 3D 工具箱" : "折叠隐藏 3D 工具箱"}
              className={`p-1 ${
                theme === "light"
                  ? "text-gray-500 hover:text-gray-800 hover:bg-gray-200"
                  : "text-gray-400 hover:text-white hover:bg-[#30363d]"
              } rounded transition`}
            >
              {isToolbarCollapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
            </button>
          </div>

          {/* 折叠微缩状态 */}
          {isToolbarCollapsed ? (
            <button
              onClick={() => setIsToolbarCollapsed(false)}
              title="点击展开 3D 建模工具栏"
              className="p-2 text-amber-400 hover:text-amber-300 transition flex flex-col items-center gap-1"
            >
              <Wrench size={16} />
              <span className="text-[9px] font-bold text-gray-400 [writing-mode:vertical-lr]">工具</span>
            </button>
          ) : (
            /* 展开状态的工具项列表 */
            <div className="p-1 flex flex-col items-center space-y-1">
              {/* 选择模式 */}
              <button
                onClick={() => {
                  setActiveTool("select");
                  setIsSketchDrawing(false);
                  setSketchStart(null);
                  setSketchCurrent(null);
                  setPolygonPoints([]);
                }}
                title={`拾取工具 (当前: ${pickTab === "face" ? "面 [3]" : pickTab === "edge" ? "线 [2]" : "点 [1]"})`}
                className={`p-2 rounded-lg transition ${
                  activeTool === "select"
                    ? "bg-blue-600 text-white shadow-sm"
                    : theme === "light"
                    ? "text-gray-600 hover:text-gray-950 hover:bg-gray-100"
                    : "text-gray-400 hover:text-white hover:bg-[#21262d]"
                }`}
              >
                <MousePointer size={15} />
              </button>

              {/* 平面草图绘制模式 */}
              <button
                onClick={() => {
                  if (activeTool === "sketch") {
                    setActiveTool("select");
                    setIsSketchDrawing(false);
                    setSketchStart(null);
                    setSketchCurrent(null);
                    setPolygonPoints([]);
                  } else {
                    setActiveTool("sketch");
                    showToast("✏️ 已进入草图绘制模式，在基准面上点击或拖拽绘制");
                  }
                }}
                title={activeTool === "sketch" ? "退出草图绘制模式" : "平面草图交互绘制 (圆/矩形/多边形)"}
                className={`p-2 rounded-lg transition ${
                  activeTool === "sketch"
                    ? "bg-amber-600 text-white shadow-sm ring-2 ring-amber-400/40"
                    : theme === "light"
                    ? "text-gray-600 hover:text-gray-950 hover:bg-gray-100"
                    : "text-gray-400 hover:text-white hover:bg-[#21262d]"
                }`}
              >
                <Pencil size={15} />
              </button>

              <div className={`w-4 h-[1px] ${theme === "light" ? "bg-gray-200" : "bg-[#30363d]"} my-0.5`} />

              {/* 添加基本体 (Shift + A) */}
              <button
                onClick={() => {
                  setIsAddMenuOpen(true);
                  setIsContextMenuOpen(false);
                }}
                title="添加基本体 (Shift + A)"
                className={`p-2 rounded-lg ${
                  theme === "light"
                    ? "text-gray-600 hover:text-gray-950 hover:bg-gray-100"
                    : "text-gray-400 hover:text-white hover:bg-[#21262d]"
                } transition`}
              >
                <Plus size={15} />
              </button>

              {/* 拉伸成体 (E) */}
              <button
                onClick={() => {
                  const faceExpr = getFaceExpr(pickedData.face.selector);
                  onInjectCode?.(
                    `    with BuildSketch(${faceExpr}):\n        Circle(radius=10)\n    extrude(amount=10)\n`
                  );
                  onApplyToBlockly?.("extrude", undefined, undefined, undefined, { distance: 10 });
                  triggerCopyToast("extrude", "已执行表面拉伸 (10mm)");
                }}
                title="表面拉伸 (E)"
                className={`p-2 rounded-lg ${
                  theme === "light"
                    ? "text-gray-600 hover:text-gray-950 hover:bg-gray-100"
                    : "text-gray-400 hover:text-white hover:bg-[#21262d]"
                } transition`}
              >
                <ArrowUpSquare size={15} />
              </button>

              {/* 表面打孔 (I) */}
              <button
                onClick={() => {
                  const faceExpr = getFaceExpr(pickedData.face.selector);
                  onInjectCode?.(`    with Locations(${faceExpr}):\n        Hole(radius=2.5, depth=10)\n`);
                  onApplyToBlockly?.("hole", undefined, undefined, undefined, { diameter: 5, depth: 10 });
                  triggerCopyToast("hole", "已表面打孔 hole(d=5, depth=10)");
                }}
                title="表面打孔 (I)"
                className={`p-2 rounded-lg ${
                  theme === "light"
                    ? "text-gray-600 hover:text-gray-950 hover:bg-gray-100"
                    : "text-gray-400 hover:text-white hover:bg-[#21262d]"
                } transition`}
              >
                <CircleDot size={15} />
              </button>

              {/* 倒圆角 (Ctrl + B) */}
              <button
                onClick={() => {
                  if (pickTab === "face") {
                    onInjectCode?.(
                      `    fillet(${targetVar}.faces().sort_by(Axis.Z)[-1].edges().filter_by(GeomType.CIRCLE), radius=${quickRadius})\n`
                    );
                    onApplyToBlockly?.("edge", "faces_Z_circle", undefined, quickRadius);
                    triggerCopyToast("bore-fillet", `已孔口倒圆角 (${quickRadius}mm)`);
                  } else {
                    onInjectCode?.(`    fillet(${targetVar}.faces().sort_by(Axis.Z)[-1].edges(), radius=${quickRadius})\n`);
                    onApplyToBlockly?.("edge", pickedData.edge.selector, undefined, quickRadius);
                    triggerCopyToast("fillet", `已倒圆角 (${quickRadius}mm)`);
                  }
                }}
                title={`倒圆角 (Ctrl + B) - 当前 R=${quickRadius}mm`}
                className={`p-2 rounded-lg ${
                  theme === "light"
                    ? "text-gray-600 hover:text-gray-950 hover:bg-gray-100"
                    : "text-gray-400 hover:text-white hover:bg-[#21262d]"
                } transition`}
              >
                <Sparkles size={15} />
              </button>

              {/* 倒斜角 */}
              <button
                onClick={() => {
                  onInjectCode?.(`    chamfer(${targetVar}.faces().sort_by(Axis.Z)[-1].edges(), length=${quickRadius})\n`);
                  onApplyToBlockly?.("edge", pickedData.edge.selector, undefined, quickRadius);
                  triggerCopyToast("chamfer", `已倒斜角 (${quickRadius}mm)`);
                }}
                title="倒斜角 (Chamfer)"
                className={`p-2 rounded-lg ${
                  theme === "light"
                    ? "text-gray-600 hover:text-gray-950 hover:bg-gray-100"
                    : "text-gray-400 hover:text-white hover:bg-[#21262d]"
                } transition`}
              >
                <Slash size={15} />
              </button>

              {/* 表面抽壳 */}
              <button
                onClick={() => {
                  const faceExpr = getFaceExpr(pickedData.face.selector);
                  onInjectCode?.(`    offset(amount=-2, openings=${faceExpr})\n`);
                  triggerCopyToast("shell", "已执行表面抽壳 (-2mm)");
                }}
                title="表面抽壳 (Shell -2mm)"
                className={`p-2 rounded-lg ${
                  theme === "light"
                    ? "text-gray-600 hover:text-gray-950 hover:bg-gray-100"
                    : "text-gray-400 hover:text-white hover:bg-[#21262d]"
                } transition`}
              >
                <Minimize2 size={15} />
              </button>

              <div className={`w-4 h-[1px] ${theme === "light" ? "bg-gray-200" : "bg-[#30363d]"} my-0.5`} />

              {/* 快速命令搜索 (F3 / Space) */}
              <button
                onClick={() => {
                  setIsCommandPaletteOpen(true);
                  setCommandSearchQuery("");
                  setCommandSelectedIndex(0);
                }}
                title="3D 极速命令搜索 (F3 / Space)"
                className={`p-2 rounded-lg ${
                  theme === "light"
                    ? "text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    : "text-blue-400 hover:text-blue-300 hover:bg-blue-950/40"
                } transition`}
              >
                <Search size={15} />
              </button>
            </div>
          )}
        </div>

        {/* Toast 快捷操作视觉反馈 */}
        {toastMessage && (
          <div className={`absolute ${activeTool === "sketch" ? "top-14" : "top-3"} left-1/2 -translate-x-1/2 z-40 bg-[#161b22]/95 border border-blue-500/60 text-blue-300 px-4 py-1.5 rounded-full text-xs shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-150`}>
            <Check size={13} className="text-emerald-400 flex-shrink-0" />
            <span className="font-mono">{toastMessage}</span>
          </div>
        )}

        {/* 1. 特征生长步进调试已整合至底部状态栏，视口底部保持 100% 纯净无遮挡 */}

        {/* 2. 快捷交互栏已平移固定至全局底栏【运行】按钮左侧，3D 视口保持 100% 极简无遮挡 */}

        {/* 3. 鼠标右键 3D CAD 上下文动作菜单 */}
        {isContextMenuOpen && (
          <div
            data-testid="cad-context-menu"
            style={{ left: contextMenuPos.x, top: contextMenuPos.y }}
            className="absolute z-50 w-56 bg-[#161b22]/95 backdrop-blur-md border border-[#30363d] rounded-xl shadow-2xl py-1 text-xs text-gray-200 divide-y divide-[#30363d]/50 animate-in fade-in zoom-in-95 duration-100 select-none"
          >
            <div className="px-3 py-1.5 flex items-center justify-between text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
              <span>3D CAD 快捷动作</span>
              <span className="text-blue-400 font-mono">
                {pickTab === "face" ? "面 [3]" : pickTab === "edge" ? "线 [2]" : "点 [1]"}
              </span>
            </div>

            <div className="p-1 space-y-0.5">
              {pickTab === "face" && (
                <>
                  <button
                    onClick={() => {
                      onInjectCode?.(
                        `    fillet(${targetVar}.faces().sort_by(Axis.Z)[-1].edges().filter_by(GeomType.CIRCLE), radius=${quickRadius})\n`
                      );
                      onApplyToBlockly?.("edge", "faces_Z_circle", undefined, quickRadius);
                      triggerCopyToast("bore-fillet", `已孔口倒圆角 (${quickRadius}mm)`);
                      setIsContextMenuOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 hover:bg-blue-600/20 hover:text-blue-300 rounded-lg flex items-center justify-between transition"
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles size={13} className="text-blue-400" />
                      <span>孔口圆周倒角</span>
                    </div>
                    <span className="text-[10px] text-gray-500 font-mono">{quickRadius}mm</span>
                  </button>

                  <button
                    onClick={() => {
                      const faceExpr = getFaceExpr(pickedData.face.selector);
                      onInjectCode?.(`    with Locations(${faceExpr}):\n        Hole(radius=2.5, depth=10)\n`);
                      onApplyToBlockly?.("hole", undefined, undefined, undefined, { diameter: 5, depth: 10 });
                      triggerCopyToast("hole", "已执行打孔 hole(d=5, depth=10)");
                      setIsContextMenuOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 hover:bg-[#21262d] rounded-lg flex items-center justify-between transition"
                  >
                    <div className="flex items-center gap-2">
                      <CircleDot size={13} className="text-amber-400" />
                      <span>在此面打中心孔</span>
                    </div>
                    <span className="text-[10px] text-gray-500 font-mono">I</span>
                  </button>

                  <button
                    onClick={() => {
                      const faceExpr = getFaceExpr(pickedData.face.selector);
                      onInjectCode?.(`    with BuildSketch(${faceExpr}):\n        Circle(radius=5)\n`);
                      onApplyToBlockly?.("face", pickedData.face.selector);
                      triggerCopyToast("wp", "已在表面新建草图");
                      setIsContextMenuOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 hover:bg-[#21262d] rounded-lg flex items-center justify-between transition"
                  >
                    <div className="flex items-center gap-2">
                      <Spline size={13} className="text-purple-400" />
                      <span>在此面新建草图 (BuildSketch)</span>
                    </div>
                    <span className="text-[10px] text-gray-500 font-mono">{pickedData.face.selector}</span>
                  </button>

                  <button
                    onClick={() => {
                      const faceExpr = getFaceExpr(pickedData.face.selector);
                      onInjectCode?.(`    offset(amount=-2, openings=${faceExpr})\n`);
                      triggerCopyToast("shell", "已执行表面抽壳 (-2mm)");
                      setIsContextMenuOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 hover:bg-[#21262d] rounded-lg flex items-center justify-between transition"
                  >
                    <div className="flex items-center gap-2">
                      <Minimize2 size={13} className="text-purple-400" />
                      <span>表面抽壳挖空</span>
                    </div>
                    <span className="text-[10px] text-gray-500 font-mono">-2mm</span>
                  </button>
                </>
              )}

              {pickTab === "edge" && (
                <>
                  <button
                    onClick={() => {
                      onInjectCode?.(`    fillet(${targetVar}.faces().sort_by(Axis.Z)[-1].edges(), radius=${quickRadius})\n`);
                      onApplyToBlockly?.("edge", pickedData.edge.selector, undefined, quickRadius);
                      triggerCopyToast("fillet", `已倒圆角 (${quickRadius}mm)`);
                      setIsContextMenuOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 hover:bg-emerald-600/20 hover:text-emerald-300 rounded-lg flex items-center justify-between transition"
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles size={13} className="text-emerald-400" />
                      <span>棱边倒圆角</span>
                    </div>
                    <span className="text-[10px] text-gray-500 font-mono">Ctrl+B</span>
                  </button>

                  <button
                    onClick={() => {
                      onInjectCode?.(`    chamfer(${targetVar}.faces().sort_by(Axis.Z)[-1].edges(), length=${quickRadius})\n`);
                      onApplyToBlockly?.("edge", pickedData.edge.selector, undefined, quickRadius);
                      triggerCopyToast("chamfer", `已倒斜角 (${quickRadius}mm)`);
                      setIsContextMenuOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 hover:bg-[#21262d] rounded-lg flex items-center justify-between transition"
                  >
                    <div className="flex items-center gap-2">
                      <Slash size={13} className="text-teal-400" />
                      <span>棱边倒斜角</span>
                    </div>
                    <span className="text-[10px] text-gray-500 font-mono">{quickRadius}mm</span>
                  </button>
                </>
              )}

              {pickTab === "vertex" && (
                <>
                  <button
                    onClick={() => {
                      onInjectCode?.(
                        `    with Locations((${pickedData.vertex.x}, ${pickedData.vertex.y}, ${pickedData.vertex.z})):\n        Hole(radius=2.0, depth=6)\n`
                      );
                      triggerCopyToast("vertex-hole", "已注入点开孔代码");
                      setIsContextMenuOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 hover:bg-amber-600/20 hover:text-amber-300 rounded-lg flex items-center justify-between transition"
                  >
                    <div className="flex items-center gap-2">
                      <CircleDot size={13} className="text-amber-400" />
                      <span>坐标打孔 (4mm)</span>
                    </div>
                    <span className="text-[10px] text-gray-500 font-mono">4mm</span>
                  </button>

                  <button
                    onClick={() => {
                      triggerCopyToast("copy-coord", pickedData.vertex.pointStr);
                      setIsContextMenuOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 hover:bg-[#21262d] rounded-lg flex items-center justify-between transition"
                  >
                    <div className="flex items-center gap-2">
                      <Copy size={13} className="text-gray-400" />
                      <span>复制世界坐标</span>
                    </div>
                    <span className="text-[10px] text-gray-500 font-mono">{pickedData.vertex.pointStr}</span>
                  </button>
                </>
              )}
            </div>

            <div className="p-1 space-y-0.5">
              <button
                onClick={() => {
                  setIsAddMenuOpen(true);
                  setIsContextMenuOpen(false);
                }}
                className="w-full text-left px-2.5 py-1.5 hover:bg-[#21262d] text-blue-400 hover:text-blue-300 rounded-lg flex items-center justify-between transition"
              >
                <div className="flex items-center gap-2">
                  <Plus size={13} />
                  <span>添加几何基本体...</span>
                </div>
                <span className="text-[10px] text-gray-500 font-mono">Shift+A</span>
              </button>

              <button
                onClick={() => {
                  onInjectCode?.(`    # 围绕 Z 轴旋转 90 度\n    # rotate(about=Axis.Z, angle=90)\n`);
                  triggerCopyToast("rotate", "已围绕 Z 轴旋转 90°");
                  setIsContextMenuOpen(false);
                }}
                className="w-full text-left px-2.5 py-1.5 hover:bg-[#21262d] rounded-lg flex items-center justify-between transition"
              >
                <div className="flex items-center gap-2">
                  <RotateCcw size={13} className="text-gray-400" />
                  <span>围绕 Z 轴旋转 90°</span>
                </div>
                <span className="text-[10px] text-gray-500 font-mono">90°</span>
              </button>

              <button
                onClick={() => {
                  setIsCommandPaletteOpen(true);
                  setCommandSearchQuery("");
                  setCommandSelectedIndex(0);
                  setIsContextMenuOpen(false);
                }}
                className="w-full text-left px-2.5 py-1.5 hover:bg-[#21262d] rounded-lg flex items-center justify-between transition"
              >
                <div className="flex items-center gap-2">
                  <Search size={13} className="text-gray-400" />
                  <span>命令搜索面板...</span>
                </div>
                <span className="text-[10px] text-gray-500 font-mono">F3 / Space</span>
              </button>
            </div>
          </div>
        )}

        {/* 4. Shift + A 添加几何特征悬浮菜单 */}
        {isAddMenuOpen && (
          <div data-testid="cad-add-menu" className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="w-[460px] max-w-[95%] bg-[#161b22] border border-[#30363d] rounded-2xl shadow-2xl p-5 text-xs text-gray-200 animate-in zoom-in-95 duration-150">
              {/* 弹窗头部 */}
              <div className="flex items-center justify-between pb-3 border-b border-[#30363d]">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-600/20 text-blue-400 rounded-lg">
                    <Plus size={16} />
                  </div>
                  <span className="font-semibold text-sm text-gray-100">添加几何特征 (Add Menu)</span>
                  <span className="text-[10px] text-gray-500 font-mono border border-[#30363d] px-1.5 py-0.5 rounded">
                    Shift + A
                  </span>
                </div>
                <button
                  onClick={() => setIsAddMenuOpen(false)}
                  className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-[#21262d] transition"
                >
                  <X size={15} />
                </button>
              </div>

              {/* 分类切换 Tab */}
              <div className="flex items-center space-x-1 bg-[#0d1117] p-1 rounded-xl border border-[#30363d] my-3">
                <button
                  onClick={() => setAddCategory("mesh")}
                  className={`flex-1 py-1.5 rounded-lg font-medium transition ${
                    addCategory === "mesh"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-gray-400 hover:text-gray-200"
                  }`}
                >
                  📦 网格基本体
                </button>
                <button
                  onClick={() => setAddCategory("sketch")}
                  className={`flex-1 py-1.5 rounded-lg font-medium transition ${
                    addCategory === "sketch"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-gray-400 hover:text-gray-200"
                  }`}
                >
                  ✏️ 2D草图拉伸
                </button>
                <button
                  onClick={() => setAddCategory("mechanical")}
                  className={`flex-1 py-1.5 rounded-lg font-medium transition ${
                    addCategory === "mechanical"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-gray-400 hover:text-gray-200"
                  }`}
                >
                  ⚙️ 机械零部件
                </button>
              </div>

              {/* Tab 1: 几何基本体 */}
              {addCategory === "mesh" && (
                <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                  {/* 立方体 */}
                  <div className="p-3 bg-[#0d1117]/80 rounded-xl border border-[#30363d]/70 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-gray-200 flex items-center gap-1.5">
                        <Box size={14} className="text-blue-400" />
                        <span>立方体 (Box)</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1.5 text-gray-400 text-[11px]">
                        <span>长:</span>
                        <input
                          type="number"
                          value={boxParams.length}
                          onChange={(e) => setBoxParams({ ...boxParams, length: Number(e.target.value) })}
                          className="w-12 px-1 py-0.5 bg-[#161b22] border border-[#30363d] rounded text-center font-mono text-gray-200"
                        />
                        <span>宽:</span>
                        <input
                          type="number"
                          value={boxParams.width}
                          onChange={(e) => setBoxParams({ ...boxParams, width: Number(e.target.value) })}
                          className="w-12 px-1 py-0.5 bg-[#161b22] border border-[#30363d] rounded text-center font-mono text-gray-200"
                        />
                        <span>高:</span>
                        <input
                          type="number"
                          value={boxParams.height}
                          onChange={(e) => setBoxParams({ ...boxParams, height: Number(e.target.value) })}
                          className="w-12 px-1 py-0.5 bg-[#161b22] border border-[#30363d] rounded text-center font-mono text-gray-200"
                        />
                      </div>
                    </div>
                    <button
                      onClick={handleCreateBox}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition shadow-sm"
                    >
                      创建
                    </button>
                  </div>

                  {/* 圆柱体 */}
                  <div className="p-3 bg-[#0d1117]/80 rounded-xl border border-[#30363d]/70 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-gray-200 flex items-center gap-1.5">
                        <Cylinder size={14} className="text-cyan-400" />
                        <span>圆柱体 (Cylinder)</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1.5 text-gray-400 text-[11px]">
                        <span>高度 H:</span>
                        <input
                          type="number"
                          value={cylParams.height}
                          onChange={(e) => setCylParams({ ...cylParams, height: Number(e.target.value) })}
                          className="w-12 px-1 py-0.5 bg-[#161b22] border border-[#30363d] rounded text-center font-mono text-gray-200"
                        />
                        <span>半径 R:</span>
                        <input
                          type="number"
                          value={cylParams.radius}
                          onChange={(e) => setCylParams({ ...cylParams, radius: Number(e.target.value) })}
                          className="w-12 px-1 py-0.5 bg-[#161b22] border border-[#30363d] rounded text-center font-mono text-gray-200"
                        />
                      </div>
                    </div>
                    <button
                      onClick={handleCreateCylinder}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition shadow-sm"
                    >
                      创建
                    </button>
                  </div>

                  {/* 球体 */}
                  <div className="p-3 bg-[#0d1117]/80 rounded-xl border border-[#30363d]/70 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-gray-200 flex items-center gap-1.5">
                        <Dot size={18} className="text-amber-400 -mx-1" />
                        <span>球体 (Sphere)</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1.5 text-gray-400 text-[11px]">
                        <span>半径 R:</span>
                        <input
                          type="number"
                          value={sphParams.radius}
                          onChange={(e) => setSphParams({ ...sphParams, radius: Number(e.target.value) })}
                          className="w-14 px-1 py-0.5 bg-[#161b22] border border-[#30363d] rounded text-center font-mono text-gray-200"
                        />
                      </div>
                    </div>
                    <button
                      onClick={handleCreateSphere}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition shadow-sm"
                    >
                      创建
                    </button>
                  </div>

                  {/* 圆锥台 */}
                  <div className="p-3 bg-[#0d1117]/80 rounded-xl border border-[#30363d]/70 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-gray-200 flex items-center gap-1.5">
                        <Box size={14} className="text-purple-400" />
                        <span>圆锥台 (Cone)</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1.5 text-gray-400 text-[11px]">
                        <span>高:</span>
                        <input
                          type="number"
                          value={coneParams.height}
                          onChange={(e) => setConeParams({ ...coneParams, height: Number(e.target.value) })}
                          className="w-10 px-1 py-0.5 bg-[#161b22] border border-[#30363d] rounded text-center font-mono text-gray-200"
                        />
                        <span>底R:</span>
                        <input
                          type="number"
                          value={coneParams.bottomR}
                          onChange={(e) => setConeParams({ ...coneParams, bottomR: Number(e.target.value) })}
                          className="w-10 px-1 py-0.5 bg-[#161b22] border border-[#30363d] rounded text-center font-mono text-gray-200"
                        />
                        <span>顶R:</span>
                        <input
                          type="number"
                          value={coneParams.topR}
                          onChange={(e) => setConeParams({ ...coneParams, topR: Number(e.target.value) })}
                          className="w-10 px-1 py-0.5 bg-[#161b22] border border-[#30363d] rounded text-center font-mono text-gray-200"
                        />
                      </div>
                    </div>
                    <button
                      onClick={handleCreateCone}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition shadow-sm"
                    >
                      创建
                    </button>
                  </div>
                </div>
              )}

              {/* Tab 2: 2D 草图拉伸 */}
              {addCategory === "sketch" && (
                <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                  {/* 矩形草图拉伸 */}
                  <div className="p-3 bg-[#0d1117]/80 rounded-xl border border-[#30363d]/70 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-gray-200 flex items-center gap-1.5">
                        <Box size={14} className="text-emerald-400" />
                        <span>矩形草图拉伸 (.rect.extrude)</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1.5 text-gray-400 text-[11px]">
                        <span>宽:</span>
                        <input
                          type="number"
                          value={sketchRectParams.width}
                          onChange={(e) => setSketchRectParams({ ...sketchRectParams, width: Number(e.target.value) })}
                          className="w-12 px-1 py-0.5 bg-[#161b22] border border-[#30363d] rounded text-center font-mono text-gray-200"
                        />
                        <span>高:</span>
                        <input
                          type="number"
                          value={sketchRectParams.height}
                          onChange={(e) => setSketchRectParams({ ...sketchRectParams, height: Number(e.target.value) })}
                          className="w-12 px-1 py-0.5 bg-[#161b22] border border-[#30363d] rounded text-center font-mono text-gray-200"
                        />
                        <span>厚:</span>
                        <input
                          type="number"
                          value={sketchRectParams.extrude}
                          onChange={(e) => setSketchRectParams({ ...sketchRectParams, extrude: Number(e.target.value) })}
                          className="w-12 px-1 py-0.5 bg-[#161b22] border border-[#30363d] rounded text-center font-mono text-gray-200"
                        />
                      </div>
                    </div>
                    <button
                      onClick={handleCreateSketchRect}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition shadow-sm"
                    >
                      拉伸
                    </button>
                  </div>

                  {/* 圆形草图拉伸 */}
                  <div className="p-3 bg-[#0d1117]/80 rounded-xl border border-[#30363d]/70 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-gray-200 flex items-center gap-1.5">
                        <CircleDot size={14} className="text-teal-400" />
                        <span>圆形草图拉伸 (.circle.extrude)</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1.5 text-gray-400 text-[11px]">
                        <span>半径 R:</span>
                        <input
                          type="number"
                          value={sketchCircleParams.radius}
                          onChange={(e) => setSketchCircleParams({ ...sketchCircleParams, radius: Number(e.target.value) })}
                          className="w-14 px-1 py-0.5 bg-[#161b22] border border-[#30363d] rounded text-center font-mono text-gray-200"
                        />
                        <span>拉伸厚度:</span>
                        <input
                          type="number"
                          value={sketchCircleParams.extrude}
                          onChange={(e) => setSketchCircleParams({ ...sketchCircleParams, extrude: Number(e.target.value) })}
                          className="w-14 px-1 py-0.5 bg-[#161b22] border border-[#30363d] rounded text-center font-mono text-gray-200"
                        />
                      </div>
                    </div>
                    <button
                      onClick={handleCreateSketchCircle}
                      className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg font-medium transition shadow-sm"
                    >
                      拉伸
                    </button>
                  </div>
                </div>
              )}

              {/* Tab 3: 机械零部件 */}
              {addCategory === "mechanical" && (
                <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                  {/* 法兰盘 */}
                  <div className="p-3 bg-[#0d1117]/80 rounded-xl border border-[#30363d]/70 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-gray-200 flex items-center gap-1.5">
                        <Box size={14} className="text-indigo-400" />
                        <span>机械法兰盘基座 (Flange Mount)</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1.5 text-gray-400 text-[11px]">
                        <span>外R:</span>
                        <input
                          type="number"
                          value={flangeParams.outerR}
                          onChange={(e) => setFlangeParams({ ...flangeParams, outerR: Number(e.target.value) })}
                          className="w-10 px-1 py-0.5 bg-[#161b22] border border-[#30363d] rounded text-center font-mono text-gray-200"
                        />
                        <span>内孔D:</span>
                        <input
                          type="number"
                          value={flangeParams.centerD}
                          onChange={(e) => setFlangeParams({ ...flangeParams, centerD: Number(e.target.value) })}
                          className="w-10 px-1 py-0.5 bg-[#161b22] border border-[#30363d] rounded text-center font-mono text-gray-200"
                        />
                        <span>厚度:</span>
                        <input
                          type="number"
                          value={flangeParams.thickness}
                          onChange={(e) => setFlangeParams({ ...flangeParams, thickness: Number(e.target.value) })}
                          className="w-10 px-1 py-0.5 bg-[#161b22] border border-[#30363d] rounded text-center font-mono text-gray-200"
                        />
                      </div>
                    </div>
                    <button
                      onClick={handleCreateFlange}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition shadow-sm"
                    >
                      创建
                    </button>
                  </div>

                  {/* 轴套 */}
                  <div className="p-3 bg-[#0d1117]/80 rounded-xl border border-[#30363d]/70 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-gray-200 flex items-center gap-1.5">
                        <Cylinder size={14} className="text-amber-400" />
                        <span>机械轴套衬套 (Bushing)</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1.5 text-gray-400 text-[11px]">
                        <span>外R:</span>
                        <input
                          type="number"
                          value={bushingParams.outerR}
                          onChange={(e) => setBushingParams({ ...bushingParams, outerR: Number(e.target.value) })}
                          className="w-10 px-1 py-0.5 bg-[#161b22] border border-[#30363d] rounded text-center font-mono text-gray-200"
                        />
                        <span>内径D:</span>
                        <input
                          type="number"
                          value={bushingParams.holeD}
                          onChange={(e) => setBushingParams({ ...bushingParams, holeD: Number(e.target.value) })}
                          className="w-10 px-1 py-0.5 bg-[#161b22] border border-[#30363d] rounded text-center font-mono text-gray-200"
                        />
                        <span>高度:</span>
                        <input
                          type="number"
                          value={bushingParams.height}
                          onChange={(e) => setBushingParams({ ...bushingParams, height: Number(e.target.value) })}
                          className="w-10 px-1 py-0.5 bg-[#161b22] border border-[#30363d] rounded text-center font-mono text-gray-200"
                        />
                      </div>
                    </div>
                    <button
                      onClick={handleCreateBushing}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-medium transition shadow-sm"
                    >
                      创建
                    </button>
                  </div>

                  {/* 空心管 */}
                  <div className="p-3 bg-[#0d1117]/80 rounded-xl border border-[#30363d]/70 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-gray-200 flex items-center gap-1.5">
                        <CircleDot size={14} className="text-cyan-400" />
                        <span>同心空心管件 (Hollow Pipe)</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1.5 text-gray-400 text-[11px]">
                        <span>外R:</span>
                        <input
                          type="number"
                          value={pipeParams.outerR}
                          onChange={(e) => setPipeParams({ ...pipeParams, outerR: Number(e.target.value) })}
                          className="w-10 px-1 py-0.5 bg-[#161b22] border border-[#30363d] rounded text-center font-mono text-gray-200"
                        />
                        <span>内R:</span>
                        <input
                          type="number"
                          value={pipeParams.innerR}
                          onChange={(e) => setPipeParams({ ...pipeParams, innerR: Number(e.target.value) })}
                          className="w-10 px-1 py-0.5 bg-[#161b22] border border-[#30363d] rounded text-center font-mono text-gray-200"
                        />
                        <span>高:</span>
                        <input
                          type="number"
                          value={pipeParams.height}
                          onChange={(e) => setPipeParams({ ...pipeParams, height: Number(e.target.value) })}
                          className="w-10 px-1 py-0.5 bg-[#161b22] border border-[#30363d] rounded text-center font-mono text-gray-200"
                        />
                      </div>
                    </div>
                    <button
                      onClick={handleCreatePipe}
                      className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-medium transition shadow-sm"
                    >
                      创建
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 5. F3 / Space: 3D CAD 快速命令面板 (Command Palette) */}
        {isCommandPaletteOpen && (
          <div data-testid="cad-command-palette" className="absolute inset-0 z-50 flex items-start justify-center pt-16 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="w-[480px] max-w-[95%] bg-[#161b22] border border-[#30363d] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
              {/* 搜索输入框 */}
              <div className="flex items-center px-4 py-3 border-b border-[#30363d] bg-[#0d1117]">
                <Search size={16} className="text-blue-400 mr-2.5 flex-shrink-0" />
                <input
                  autoFocus
                  type="text"
                  value={commandSearchQuery}
                  onChange={(e) => {
                    setCommandSearchQuery(e.target.value);
                    setCommandSelectedIndex(0);
                  }}
                  onKeyDown={handleCommandPaletteKeyDown}
                  placeholder="搜索 3D CAD 命令 (如: 倒角, 孔, 立方体, 拉伸, step)..."
                  className="w-full bg-transparent text-sm text-gray-100 placeholder-gray-500 focus:outline-none"
                />
                <span className="text-[10px] text-gray-500 border border-[#30363d] rounded px-1.5 py-0.5 ml-2 font-mono whitespace-nowrap">
                  Esc 退出
                </span>
              </div>

              {/* 命令列表 */}
              <div className="max-h-72 overflow-y-auto p-1.5 divide-y divide-[#21262d]/40 text-xs">
                {filteredCommands.length === 0 ? (
                  <div className="py-6 text-center text-gray-500">无匹配命令，按 Esc 退出</div>
                ) : (
                  filteredCommands.map((cmd, idx) => {
                    const IconComp = cmd.icon;
                    const isSelected = idx === commandSelectedIndex;
                    return (
                      <button
                        key={cmd.id}
                        onClick={() => {
                          cmd.action();
                          setIsCommandPaletteOpen(false);
                        }}
                        onMouseEnter={() => setCommandSelectedIndex(idx)}
                        className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between transition ${
                          isSelected
                            ? "bg-blue-600 text-white font-medium shadow-sm"
                            : "text-gray-300 hover:bg-[#21262d]"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <IconComp
                            size={14}
                            className={isSelected ? "text-white" : "text-blue-400"}
                          />
                          <span>{cmd.title}</span>
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                              isSelected
                                ? "bg-blue-700/80 text-blue-100"
                                : "bg-[#21262d] text-gray-400"
                            }`}
                          >
                            {cmd.category}
                          </span>
                        </div>
                        {cmd.shortcut && (
                          <span
                            className={`text-[10px] font-mono ${
                              isSelected ? "text-blue-200" : "text-gray-500"
                            }`}
                          >
                            {cmd.shortcut}
                          </span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
