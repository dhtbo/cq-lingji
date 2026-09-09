"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import * as Blockly from "blockly";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { HeaderToolbar, ViewMode } from "@/components/HeaderToolbar/HeaderToolbar";
import { PythonEditor } from "@/components/MonacoEditor/PythonEditor";
import { CadTemplate } from "@/components/Templates/cadTemplates";
import { MissionModal } from "@/components/Missions/MissionModal";
import { AiDrawer } from "@/components/AiAssistant/AiDrawer";
import { ColorPalettePopover } from "@/components/ColorPalette/ColorPalettePopover";
import {
  EditorSettingsModal,
  EditorSettings,
  DEFAULT_EDITOR_SETTINGS,
} from "@/components/EditorSettings/EditorSettingsModal";
import {
  saveProjectToLocalStorage,
  loadProjectFromLocalStorage,
  downloadPythonFile,
  exportProjectArchive,
  readProjectFile,
} from "@/lib/projectStorage";
import { convertPythonToBlockly } from "@/lib/pythonToBlockly";
import { useDebounce } from "@/lib/useDebounce";
import {
  renderCadQueryCode,
  downloadCadExport,
  checkBackendHealth,
  StepInfo,
} from "@/lib/api";
import {
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Play,
  Bot,
  Search,
  Palette,
  Terminal,
  Clock,
  Check,
} from "lucide-react";
import { getThemeToken } from "@/lib/theme";
import {
  BottomInteractionDock,
  PickedFaceInfo,
  PickedEdgeInfo,
  PickedVertexInfo,
} from "@/components/CadViewer/BottomInteractionDock";
import type { PickedElements } from "@/components/CadViewer/ThreeCadViewer";

// 动态客户端加载以避免 SSR window/WebGL 报错
const BlocklyWorkspace = dynamic(
  () => import("@/components/BlocklyEditor/BlocklyWorkspace").then((mod) => mod.BlocklyWorkspace),
  { ssr: false }
);

const ThreeCadViewer = dynamic(
  () => import("@/components/CadViewer/ThreeCadViewer").then((mod) => mod.ThreeCadViewer),
  { ssr: false }
);

export default function StudioPage() {
  const [code, setCode] = useState<string>("");
  const [isLocked, setIsLocked] = useState<boolean>(true); // 默认跟随积木锁定
  const isLockedRef = useRef<boolean>(true);
  const [meshData, setMeshData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [execTime, setExecTime] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [stdout, setStdout] = useState<string>("");
  const [backendOnline, setBackendOnline] = useState<boolean>(false);

  // 3D 几何特征交互拾取状态 (面/线/点联动底栏控制中枢)
  const [pickTab, setPickTab] = useState<"face" | "edge" | "vertex">("face");
  const [pickedData, setPickedData] = useState<{
    face: PickedFaceInfo;
    edge: PickedEdgeInfo;
    vertex: PickedVertexInfo;
  }>({
    face: {
      name: "顶面 Top Face (+Z)",
      selector: ">Z",
      normal: "[0.0, 0.0, 1.0]",
      desc: "实体最高特征面",
    },
    edge: {
      name: "竖直外棱边 (|Z)",
      selector: "|Z",
      desc: "平行于 Z 轴的竖直轮廓边",
    },
    vertex: {
      x: 0,
      y: 0,
      z: 20,
      pointStr: "(0.0, 0.0, 20.0)",
    },
  });

  const handlePickChange = useCallback((data: PickedElements) => {
    setPickTab(data.pickTab);
    setPickedData({
      face: data.face,
      edge: data.edge,
      vertex: data.vertex,
    });
  }, []);

  //  视图模态：'block' (积木模式) | 'code' (代码模式) | 'split' (双屏联动)
  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const [projectName, setProjectName] = useState<string>("我的3D作品.py");
  const [isSaved, setIsSaved] = useState<boolean>(true);
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  //  侧边浮动工具栈展开状态
  const [isAiOpen, setIsAiOpen] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState<boolean>(false);
  const [isConsoleOpen, setIsConsoleOpen] = useState<boolean>(false);

  // 渐进式时间旅行与步进状态 (Karpathy 构建即理解)
  const [steps, setSteps] = useState<StepInfo[]>([]);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [totalSteps, setTotalSteps] = useState<number>(1);

  // 启发式教学挑战关卡模态窗状态
  const [isMissionOpen, setIsMissionOpen] = useState<boolean>(false);

  // 编辑器设置状态与持久化
  const [settings, setSettings] = useState<EditorSettings>(DEFAULT_EDITOR_SETTINGS);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("cadquery_editor_settings");
      if (saved) {
        setSettings((prev) => ({ ...prev, ...JSON.parse(saved) }));
      }
    } catch { }
  }, []);

  const handleUpdateSettings = (newSettings: EditorSettings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem("cadquery_editor_settings", JSON.stringify(newSettings));
    } catch { }
  };

  // 保存反馈与操作提示 Toast
  const [saveToastMsg, setSaveToastMsg] = useState<string | null>(null);
  const showToast = useCallback((msg: string) => {
    setSaveToastMsg(msg);
    setTimeout(() => setSaveToastMsg(null), 3000);
  }, []);

  // 页面加载时自动恢复本地暂存工程
  useEffect(() => {
    try {
      const savedProject = loadProjectFromLocalStorage();
      if (savedProject && savedProject.code) {
        setProjectName(savedProject.projectName || "我的3D作品.py");
        setCode(savedProject.code);
        setIsSaved(true);
      }
    } catch { }
  }, []);

  // 全工作台主题设计令牌 (支持 6 色主题与高对比度文字自动计算)
  const themeToken = getThemeToken(settings.themeColor);

  // 报错信息汉化转换器 ( 规格)
  const formatErrorMessage = useCallback(
    (rawMsg: string): string => {
      if (!rawMsg) return "渲染出错";
      if (!settings.translateErrors) return rawMsg;

      if (rawMsg.includes("BRep_API: command not done") || rawMsg.includes("StdFail_NotDone")) {
        return `${rawMsg}\n\n💡 汉化提示：CAD 拓扑几何构造失败！常见原因包括：\n1. 倒角 (fillet) 或倒斜角 (chamfer) 尺寸过大，超出了模型边界或面尺寸。\n2. 挖槽 (cutBlind) 或拉伸 (extrude) 产生了自相交几何。\n建议：调小尺寸参数（如从 5.5 改为 1.5），或确认选取的基准面与边是否有效。`;
      }
      if (rawMsg.includes("name 'show_object' is not defined")) {
        return `${rawMsg}\n\n💡 汉化提示：检测到调用了 show_object，沙箱已自动注入，请检查实体变量是否正确。`;
      }
      if (rawMsg.includes("name '") && rawMsg.includes("' is not defined")) {
        const varMatch = rawMsg.match(/name '(\w+)' is not defined/);
        const v = varMatch ? varMatch[1] : "";
        return `${rawMsg}\n\n💡 汉化提示：变量或函数名 '${v}' 尚未定义，请检查拼写是否正确。`;
      }
      if (rawMsg.includes("SyntaxError")) {
        return `${rawMsg}\n\n💡 汉化提示：Python 语法错误，请检查是否缺少英文闭合括号 ()、引号或冒号 :。`;
      }
      if (rawMsg.includes("IndentationError")) {
        return `${rawMsg}\n\n💡 汉化提示：Python 缩进错误，请检查代码行首空格是否对齐（推荐 4 个空格）。`;
      }
      if (rawMsg.includes("AttributeError")) {
        return `${rawMsg}\n\n💡 汉化提示：对象属性或方法不存在，请检查是否在正确的工作平面或实体上调用了 CadQuery API。`;
      }
      return rawMsg;
    },
    [settings.translateErrors]
  );

  const blocklyWorkspaceRef = useRef<any>(null);

  // 防抖 400ms
  const debouncedCode = useDebounce(code, 400);

  // 执行渲染核心逻辑 (支持单步特征时间旅行与控制台 stdout 捕获)
  const performRender = useCallback(
    async (targetCode: string, targetStep?: number) => {
      if (!targetCode || !targetCode.trim()) return;

      setLoading(true);
      setErrorMessage(null);

      try {
        const res = await renderCadQueryCode(targetCode, { step: targetStep });
        if (res.stdout !== undefined) {
          setStdout(res.stdout);
        }

        if (res.status === "success") {
          setMeshData(res.mesh);
          setExecTime(res.execution_time_ms);
          if (res.steps && res.steps.length > 0) {
            setSteps(res.steps);
          }
          if (res.current_step !== undefined) {
            setCurrentStep(res.current_step);
          }
          if (res.total_steps !== undefined) {
            setTotalSteps(res.total_steps);
          }
        } else {
          setErrorMessage(formatErrorMessage(res.detail || "渲染出错"));
        }
      } catch (err: any) {
        setErrorMessage(
          formatErrorMessage(err.message || "请求几何渲染失败，请检查语法或后端服务状态")
        );
      } finally {
        setLoading(false);
      }
    },
    [formatErrorMessage]
  );

  // 响应防抖代码更新 (默认渲染最终完整特征状态)
  useEffect(() => {
    if (debouncedCode) {
      performRender(debouncedCode);
    }
  }, [debouncedCode, performRender]);

  // 后端健康状态自检
  useEffect(() => {
    let timer: any;
    const check = async () => {
      const ok = await checkBackendHealth();
      setBackendOnline(ok);
    };
    check();
    timer = setInterval(check, 8000);
    return () => clearInterval(timer);
  }, []);

  // 全局快捷键绑定 (Ctrl+Enter 运行渲染, Ctrl+S 保存/导出 STEP, Ctrl+F 搜索)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Enter or Cmd+Enter: 立即触发渲染
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        performRender(code);
      }
      // Ctrl+S: 保存
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleSave();
      }
      // Ctrl+F: 呼出查找替换
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
        if (viewMode === "block") {
          setViewMode("split");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [code, performRender, viewMode]);

  // 积木发生改变时的回调
  const handleBlocklyCodeChange = (newCode: string) => {
    setIsSaved(false);
    if (isLockedRef.current) {
      setCode(newCode);
    }
  };

  // 手动在 Monaco 中编写代码时的回调
  const handleMonacoCodeChange = (newCode: string) => {
    setIsSaved(false);
    if (!isLockedRef.current) {
      setCode(newCode);
    }
  };

  // 切换积木与代码自由编辑锁定状态
  const handleToggleLock = () => {
    setIsLocked((prev) => {
      const next = !prev;
      isLockedRef.current = next;
      // 当从自由代码模式切换回锁定同步时，自动将最新代码逆向转换为积木
      if (next && blocklyWorkspaceRef.current && code.trim()) {
        const res = convertPythonToBlockly(code, blocklyWorkspaceRef.current);
        if (res.success) {
          showToast(`🔒 已锁定为积木同步模式，${res.message}`);
        }
      }
      return next;
    });
  };

  // 手动运行渲染
  const handleManualRun = () => {
    performRender(code);
  };

  // 保存工程至本地暂存库 (LocalStorage)
  const handleSave = () => {
    let xmlStr: string | undefined;
    if (blocklyWorkspaceRef.current) {
      try {
        const xmlDom = Blockly.Xml.workspaceToDom(blocklyWorkspaceRef.current);
        xmlStr = Blockly.Xml.domToText(xmlDom);
      } catch { }
    }
    const ok = saveProjectToLocalStorage(projectName, code, xmlStr);
    setIsSaved(true);
    if (ok) {
      showToast("✅ 工程已成功保存到本地存储！");
    } else {
      showToast("⚠️ 保存失败，请检查浏览器存储权限");
    }
  };

  // 下载当前 Python 源码文件 (.py)
  const handleDownloadPy = () => {
    downloadPythonFile(projectName, code);
    showToast(`✅ 已下载 Python 脚本: ${projectName}`);
  };

  // 导出完整工程归档包 (.cq.json)
  const handleExportProject = () => {
    let xmlStr: string | undefined;
    if (blocklyWorkspaceRef.current) {
      try {
        const xmlDom = Blockly.Xml.workspaceToDom(blocklyWorkspaceRef.current);
        xmlStr = Blockly.Xml.domToText(xmlDom);
      } catch { }
    }
    exportProjectArchive(projectName, code, xmlStr);
    showToast("✅ 完整工程存档已导出 (.cq.json)");
  };

  // 打开本地工程或 Python 脚本文件
  const handleImportProject = async (file: File) => {
    try {
      const res = await readProjectFile(file);
      setProjectName(res.projectName);
      setCode(res.code);
      setIsLocked(false);
      isLockedRef.current = false;
      setIsSaved(true);
      performRender(res.code);

      if (res.blocklyXml && blocklyWorkspaceRef.current) {
        try {
          Blockly.Events.disable();
          blocklyWorkspaceRef.current.clear();
          const dom = Blockly.utils.xml.textToDom(res.blocklyXml);
          Blockly.Xml.domToWorkspace(dom, blocklyWorkspaceRef.current);
          Blockly.Events.enable();
        } catch { }
      } else if (blocklyWorkspaceRef.current) {
        convertPythonToBlockly(res.code, blocklyWorkspaceRef.current);
      }

      showToast(`✅ 成功载入本地文件: ${res.projectName}`);
    } catch (err: any) {
      showToast(`⚠️ 载入失败: ${err.message || String(err)}`);
    }
  };

  // 代码逆向转换至图形积木
  const handleCodeToBlockly = (currentCode?: string) => {
    if (!blocklyWorkspaceRef.current) {
      showToast("积木工作区未加载，请切换到「双屏」或「积木」视图");
      return;
    }
    const targetCode = (typeof currentCode === "string" && currentCode.trim()) ? currentCode : code;
    setCode(targetCode);
    const res = convertPythonToBlockly(targetCode, blocklyWorkspaceRef.current);
    if (res.success) {
      showToast(`✅ ${res.message}`);
      if (viewMode === "code") {
        setViewMode("split");
      }
    } else {
      showToast(`⚠️ ${res.message}`);
    }
  };

  // 时间旅行拖动条步长变更
  const handleStepChange = (targetStep: number) => {
    setCurrentStep(targetStep);
    performRender(code, targetStep);
  };

  // 实体表面智能探针 (Iron Man Suit) 一键代码注入与交互草图注入
  const handleInjectCode = (codeSnippet: string) => {
    isLockedRef.current = false;
    setIsLocked(false);
    setIsSaved(false);
    const updatedCode = code.trim() ? `${code.trim()}\n${codeSnippet}` : codeSnippet;
    setCode(updatedCode);
    performRender(updatedCode);
    // 自动将最新代码同步逆向转换为图形积木
    if (blocklyWorkspaceRef.current) {
      convertPythonToBlockly(updatedCode, blocklyWorkspaceRef.current);
    }
  };

  // AI 代码助手一键注入 (自动同步到 Monaco 与积木)
  const handleAiInsertCode = (codeSnippet: string) => {
    isLockedRef.current = false;
    setIsLocked(false);
    setIsSaved(false);
    setCode(codeSnippet);
    performRender(codeSnippet);
    // 自动切换至双屏联动以查看积木与代码同步
    if (viewMode === "block") {
      setViewMode("split");
    }
    // 尝试同步逆向转换为图形积木
    if (blocklyWorkspaceRef.current) {
      convertPythonToBlockly(codeSnippet, blocklyWorkspaceRef.current);
    }
    showToast("🤖 AI 代码已注入并自动同步生成积木！");
  };

  // 调色板颜色应用 ( 智能材质着色)
  const handleApplyColor = (hex: string, rgb: [number, number, number]) => {
    isLockedRef.current = false;
    setIsLocked(false);
    setIsSaved(false);

    // 智能推断代码中主要 CadQuery 实体变量名 (从现有的 show_object 或赋值语句推导)
    let targetVar = "part";
    const showMatch = code.match(/show_object\s*\(\s*([a-zA-Z_]\w*)/);
    if (showMatch && showMatch[1]) {
      targetVar = showMatch[1];
    } else {
      // 匹配最近一次形如 `varName = cq.` 或 `varName = ...` 的赋值
      const assignMatches = Array.from(code.matchAll(/^([a-zA-Z_]\w*)\s*=/gm));
      if (assignMatches.length > 0) {
        targetVar = assignMatches[assignMatches.length - 1][1];
      }
    }

    const colorCall = `show_object(${targetVar}, options={"color": (${rgb[0]}, ${rgb[1]}, ${rgb[2]})})`;

    let updated = code;
    // 若代码中已有 show_object(...)，进行就地替换，避免多次重复调用
    if (/show_object\s*\(.*?\)/.test(updated)) {
      updated = updated.replace(/show_object\s*\(.*?\)/g, colorCall);
    } else {
      updated = updated.trim() ? `${updated.trim()}\n\n# 材质色彩配置\n${colorCall}` : colorCall;
    }

    setCode(updated);
    performRender(updated);
    setIsPaletteOpen(false);
  };

  // 撤销与重做
  const handleUndo = () => {
    if (blocklyWorkspaceRef.current) {
      blocklyWorkspaceRef.current.undo(false);
    }
  };

  const handleRedo = () => {
    if (blocklyWorkspaceRef.current) {
      blocklyWorkspaceRef.current.undo(true);
    }
  };

  // 缩放操作
  const handleZoom = (delta: number) => {
    setZoomLevel((prev) => {
      const next = Math.max(50, Math.min(200, prev + delta));
      if (blocklyWorkspaceRef.current) {
        blocklyWorkspaceRef.current.zoomCenter(delta > 0 ? 1 : -1);
      }
      return next;
    });
  };

  const handleResetZoom = () => {
    setZoomLevel(100);
    if (blocklyWorkspaceRef.current) {
      blocklyWorkspaceRef.current.zoomReset();
    }
  };

  // 点/线/面 3D 拾取与 Blockly 积木联动回调
  const handleApplyToBlockly = (
    type: string,
    value?: string,
    coords?: [number, number, number],
    radius?: number,
    extraParams?: Record<string, any>
  ) => {
    const ws = blocklyWorkspaceRef.current;
    if (!ws) return;

    const allBlocks = ws.getAllBlocks(false);

    if (type === "face") {
      const selectedBlock: any = Blockly.common?.getSelected?.();
      if (
        selectedBlock &&
        (selectedBlock.type === "cq_sel_face" || selectedBlock.type === "cq_chain_face_select")
      ) {
        selectedBlock.setFieldValue(value || ">Z", "SELECTOR");
        return;
      }
      const faceBlock = allBlocks
        .slice()
        .reverse()
        .find((b: any) => b.type === "cq_sel_face" || b.type === "cq_chain_face_select");

      if (faceBlock) {
        faceBlock.setFieldValue(value || ">Z", "SELECTOR");
      } else {
        const newBlock = ws.newBlock("cq_sel_face");
        newBlock.setFieldValue(value || ">Z", "SELECTOR");
        newBlock.initSvg();
        newBlock.render();
        newBlock.moveTo(new (Blockly as any).utils.Coordinate(100, 180));
      }
    } else if (type === "edge") {
      const filletBlock = allBlocks
        .slice()
        .reverse()
        .find((b: any) => b.type === "cq_op_fillet");

      if (filletBlock) {
        filletBlock.setFieldValue(radius || 1.5, "RADIUS");
        if (value) {
          filletBlock.setFieldValue(value, "SELECTOR");
        }
      } else {
        const newBlock = ws.newBlock("cq_op_fillet");
        newBlock.setFieldValue(radius || 1.5, "RADIUS");
        if (value) {
          newBlock.setFieldValue(value, "SELECTOR");
        }
        newBlock.initSvg();
        newBlock.render();
        newBlock.moveTo(new (Blockly as any).utils.Coordinate(120, 220));
      }
    } else if (type === "box") {
      const newBlock = ws.newBlock("cq_op_box");
      newBlock.setFieldValue(extraParams?.length ?? 20, "LENGTH");
      newBlock.setFieldValue(extraParams?.width ?? 20, "WIDTH");
      newBlock.setFieldValue(extraParams?.height ?? 10, "HEIGHT");
      newBlock.initSvg();
      newBlock.render();
      newBlock.moveTo(new (Blockly as any).utils.Coordinate(80, 120));
    } else if (type === "cylinder") {
      const newBlock = ws.newBlock("cq_op_cylinder");
      newBlock.setFieldValue(extraParams?.height ?? 30, "HEIGHT");
      newBlock.setFieldValue(extraParams?.radius ?? 15, "RADIUS");
      newBlock.initSvg();
      newBlock.render();
      newBlock.moveTo(new (Blockly as any).utils.Coordinate(80, 120));
    } else if (type === "sphere") {
      const newBlock = ws.newBlock("cq_op_sphere");
      newBlock.setFieldValue(extraParams?.radius ?? 15, "RADIUS");
      newBlock.initSvg();
      newBlock.render();
      newBlock.moveTo(new (Blockly as any).utils.Coordinate(80, 120));
    } else if (type === "extrude") {
      const newBlock = ws.newBlock("cq_op_extrude");
      newBlock.setFieldValue(extraParams?.distance ?? 10, "DISTANCE");
      newBlock.initSvg();
      newBlock.render();
      newBlock.moveTo(new (Blockly as any).utils.Coordinate(100, 200));
    } else if (type === "hole") {
      const newBlock = ws.newBlock("cq_op_hole");
      newBlock.setFieldValue(extraParams?.diameter ?? 5, "DIAMETER");
      newBlock.setFieldValue(extraParams?.depth ?? 10, "DEPTH");
      newBlock.initSvg();
      newBlock.render();
      newBlock.moveTo(new (Blockly as any).utils.Coordinate(100, 220));
    } else if (type === "flange") {
      const newBlock = ws.newBlock("cq_macro_flange");
      newBlock.setFieldValue(extraParams?.outerR ?? 25, "OUTER_R");
      newBlock.setFieldValue(extraParams?.centerD ?? 10, "CENTER_D");
      newBlock.setFieldValue(extraParams?.thickness ?? 8, "THICKNESS");
      newBlock.initSvg();
      newBlock.render();
      newBlock.moveTo(new (Blockly as any).utils.Coordinate(80, 100));
    } else if (type === "vertex" && coords) {
      navigator.clipboard?.writeText(`(${coords[0]}, ${coords[1]}, ${coords[2]})`);
    }
  };

  // 导出 STL
  const handleExportStl = async () => {
    try {
      await downloadCadExport(code, "stl");
    } catch (e: any) {
      alert(`导出 STL 失败: ${e.message}`);
    }
  };

  // 导出 STEP
  const handleExportStep = async () => {
    try {
      await downloadCadExport(code, "step");
    } catch (e: any) {
      alert(`导出 STEP 失败: ${e.message}`);
    }
  };

  // 载入预置教学案例
  const handleSelectTemplate = (template: CadTemplate) => {
    setIsLocked(false);
    setCode(template.code);
    performRender(template.code);
  };

  // 载入挑战关卡任务代码
  const handleLoadMissionCode = (missionCode: string) => {
    setIsLocked(false);
    setCode(missionCode);
    performRender(missionCode);
  };

  const isLightMode = settings.colorMode === "light";

  return (
    <div
      className={`flex flex-col h-screen w-screen overflow-hidden ${isLightMode ? "theme-light bg-[#f6f8fa] text-gray-900" : "theme-dark bg-[#0d1117] text-gray-100"
        }`}
      style={{
        "--theme-primary": themeToken.hex,
        "--theme-text": themeToken.isDarkText ? "#0f172a" : "#ffffff",
      } as React.CSSProperties}
    >
      {/* 顶部 活力黄主导航工具栏 */}
      <HeaderToolbar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        projectName={projectName}
        onProjectNameChange={setProjectName}
        onSave={handleSave}
        isSaved={isSaved}
        onRun={handleManualRun}
        onExportStl={handleExportStl}
        onExportStep={handleExportStep}
        onDownloadPy={handleDownloadPy}
        onExportProject={handleExportProject}
        onImportProject={handleImportProject}
        saveToastMsg={saveToastMsg}
        onSelectTemplate={handleSelectTemplate}
        onOpenMissions={() => setIsMissionOpen(true)}
        loading={loading}
        execTime={execTime}
        backendOnline={backendOnline}
        settings={settings}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onSelectThemeColor={(opt) =>
          handleUpdateSettings({
            ...settings,
            themeColor: opt.color,
            themeName: opt.name,
          })
        }
      />

      {/* 主工作区 (根据 viewMode 自适应展示) */}
      <main className="flex-1 w-full h-[calc(100vh-3.25rem-3.5rem)] relative">
        {/* 1. 积木模式 (Block Mode: Blockly 60% + 3D 视口 40%) */}
        {viewMode === "block" && (
          <PanelGroup direction="horizontal" className="w-full h-full">
            <Panel defaultSize={60} minSize={30} className="relative h-full">
              <BlocklyWorkspace
                onCodeChange={handleBlocklyCodeChange}
                workspaceRefOut={blocklyWorkspaceRef}
                colorMode={settings.colorMode}
              />
            </Panel>
            <PanelResizeHandle className="resize-handle" />
            <Panel defaultSize={40} minSize={25} className="relative h-full">
              <ThreeCadViewer
                meshData={meshData}
                loading={loading}
                steps={steps}
                currentStep={currentStep}
                totalSteps={totalSteps}
                onStepChange={handleStepChange}
                onInjectCode={handleInjectCode}
                onApplyToBlockly={handleApplyToBlockly}
                onExportStl={handleExportStl}
                onExportStep={handleExportStep}
                code={code}
                onPickChange={handlePickChange}
                colorMode={settings.colorMode}
              />
            </Panel>
          </PanelGroup>
        )}

        {/* 2. 代码模式 (Code Mode: Monaco 60% + 3D 视口 40%) */}
        {viewMode === "code" && (
          <PanelGroup direction="horizontal" className="w-full h-full">
            <Panel defaultSize={60} minSize={30} className="relative h-full">
              <PythonEditor
                code={code}
                onChange={handleMonacoCodeChange}
                isLocked={isLocked}
                onToggleLock={handleToggleLock}
                errorMessage={errorMessage}
                stdout={stdout}
                execTime={execTime}
                isSearchOpen={isSearchOpen}
                onCloseSearch={() => setIsSearchOpen(false)}
                isConsoleOpen={isConsoleOpen}
                onToggleConsole={() => setIsConsoleOpen((prev) => !prev)}
                indentGuides={settings.indentGuides}
                colorMode={settings.colorMode}
                onCodeToBlockly={handleCodeToBlockly}
              />
            </Panel>
            <PanelResizeHandle className="resize-handle" />
            <Panel defaultSize={40} minSize={25} className="relative h-full">
              <ThreeCadViewer
                meshData={meshData}
                loading={loading}
                steps={steps}
                currentStep={currentStep}
                totalSteps={totalSteps}
                onStepChange={handleStepChange}
                onInjectCode={handleInjectCode}
                onApplyToBlockly={handleApplyToBlockly}
                onExportStl={handleExportStl}
                onExportStep={handleExportStep}
                code={code}
                onPickChange={handlePickChange}
                colorMode={settings.colorMode}
              />
            </Panel>
          </PanelGroup>
        )}

        {/* 3. 双屏联动模式 (Split Mode: Blockly 33% + Monaco 33% + 3D 视口 34%) */}
        {viewMode === "split" && (
          <PanelGroup direction="horizontal" className="w-full h-full">
            <Panel defaultSize={33} minSize={20} className="relative h-full">
              <BlocklyWorkspace
                onCodeChange={handleBlocklyCodeChange}
                workspaceRefOut={blocklyWorkspaceRef}
                colorMode={settings.colorMode}
              />
            </Panel>
            <PanelResizeHandle className="resize-handle" />
            <Panel defaultSize={33} minSize={20} className="relative h-full">
              <PythonEditor
                code={code}
                onChange={handleMonacoCodeChange}
                isLocked={isLocked}
                onToggleLock={handleToggleLock}
                errorMessage={errorMessage}
                stdout={stdout}
                execTime={execTime}
                isSearchOpen={isSearchOpen}
                onCloseSearch={() => setIsSearchOpen(false)}
                isConsoleOpen={isConsoleOpen}
                onToggleConsole={() => setIsConsoleOpen((prev) => !prev)}
                indentGuides={settings.indentGuides}
                colorMode={settings.colorMode}
                onCodeToBlockly={handleCodeToBlockly}
              />
            </Panel>
            <PanelResizeHandle className="resize-handle" />
            <Panel defaultSize={34} minSize={20} className="relative h-full">
              <ThreeCadViewer
                meshData={meshData}
                loading={loading}
                steps={steps}
                currentStep={currentStep}
                totalSteps={totalSteps}
                onStepChange={handleStepChange}
                onInjectCode={handleInjectCode}
                onApplyToBlockly={handleApplyToBlockly}
                onExportStl={handleExportStl}
                onExportStep={handleExportStep}
                code={code}
                onPickChange={handlePickChange}
                colorMode={settings.colorMode}
              />
            </Panel>
          </PanelGroup>
        )}
      </main>

      {/*  底部常驻 Dock 栏与大尺寸运行按钮 */}
      <footer
        className={`h-14 px-4 ${isLightMode
            ? "bg-white border-t border-[#e1e4e8] text-gray-800 shadow-sm"
            : "bg-[#161b22] border-t border-[#30363d] text-gray-300"
          } flex items-center justify-between z-30 select-none text-xs`}
      >
        {/* 左侧：撤销 / 重做 / 缩放控制器 */}
        <div className="flex items-center space-x-2">
          {/* 撤销 / 重做 */}
          <div
            className={`flex items-center ${isLightMode ? "bg-[#f3f4f6] border-[#e1e4e8]" : "bg-[#21262d] border-[#30363d]"
              } rounded-xl p-1 border`}
          >
            <button
              onClick={handleUndo}
              title="撤销 (Ctrl + Z)"
              className={`p-1.5 rounded-lg ${isLightMode ? "text-gray-600 hover:text-gray-950 hover:bg-black/5" : "text-gray-400 hover:text-white hover:bg-white/10"
                } transition`}
            >
              <Undo2 size={15} />
            </button>
            <button
              onClick={handleRedo}
              title="重做 (Ctrl + Y)"
              className={`p-1.5 rounded-lg ${isLightMode ? "text-gray-600 hover:text-gray-950 hover:bg-black/5" : "text-gray-400 hover:text-white hover:bg-white/10"
                } transition`}
            >
              <Redo2 size={15} />
            </button>
          </div>

          <span className={`w-px h-4 ${isLightMode ? "bg-[#e1e4e8]" : "bg-[#30363d]"}`}></span>

          {/* 缩放控制器 */}
          <div
            className={`flex items-center ${isLightMode ? "bg-[#f3f4f6] border-[#e1e4e8]" : "bg-[#21262d] border-[#30363d]"
              } rounded-xl p-1 border space-x-1`}
          >
            <button
              onClick={() => handleZoom(-10)}
              title="缩小积木画布"
              className={`p-1 rounded-lg ${isLightMode ? "text-gray-600 hover:text-gray-950 hover:bg-black/5" : "text-gray-400 hover:text-white hover:bg-white/10"
                } transition`}
            >
              <ZoomOut size={14} />
            </button>
            <span
              className={`px-1 text-[11px] font-mono ${isLightMode ? "text-gray-800 font-semibold" : "text-gray-300"
                } min-w-[36px] text-center`}
            >
              {zoomLevel}%
            </span>
            <button
              onClick={() => handleZoom(10)}
              title="放大积木画布"
              className={`p-1 rounded-lg ${isLightMode ? "text-gray-600 hover:text-gray-950 hover:bg-black/5" : "text-gray-400 hover:text-white hover:bg-white/10"
                } transition`}
            >
              <ZoomIn size={14} />
            </button>
            <button
              onClick={handleResetZoom}
              title="复位缩放与居中"
              className={`p-1 rounded-lg ${isLightMode ? "text-gray-600 hover:text-gray-950 hover:bg-black/5" : "text-gray-400 hover:text-white hover:bg-white/10"
                } transition`}
            >
              <Maximize2 size={13} />
            </button>
          </div>
        </div>

        {/* 中间：时间旅行与特征步进调试器 */}
        {totalSteps > 1 && (
          <div
            className={`hidden lg:flex items-center space-x-2 ${isLightMode ? "bg-[#f3f4f6] border-[#e1e4e8]" : "bg-[#21262d] border-[#30363d]"
              } px-3 py-1.5 rounded-xl border`}
          >
            <Clock size={13} style={{ color: themeToken.hex }} />
            <span className={`text-[11px] ${isLightMode ? "text-gray-700 font-bold" : "text-gray-300 font-semibold"}`}>
              步进调试
            </span>
            <input
              type="range"
              min={1}
              max={totalSteps}
              value={currentStep}
              onChange={(e) => handleStepChange(Number(e.target.value))}
              style={{ accentColor: themeToken.hex }}
              className={`w-24 h-1.5 ${isLightMode ? "bg-gray-300" : "bg-gray-700"} rounded-lg appearance-none cursor-pointer`}
            />
            <span className="text-[10px] font-mono font-bold" style={{ color: themeToken.hex }}>
              {currentStep}/{totalSteps}
            </span>
          </div>
        )}

        {/* 右侧：底栏快捷交互中枢 (紧邻运行按钮) + 大尺寸主题色【▶ 运行】按钮 */}
        <div className="flex items-center space-x-2.5">
          {/* 紧邻运行按钮的底栏快捷交互中枢 (彻底消除 3D 视口遮挡) */}
          <BottomInteractionDock
            pickTab={pickTab}
            onPickTabChange={setPickTab}
            pickedFace={pickedData.face}
            pickedEdge={pickedData.edge}
            pickedVertex={pickedData.vertex}
            targetVar="part"
            themeToken={themeToken}
            onInjectCode={handleInjectCode}
            onApplyToBlockly={handleApplyToBlockly}
            showToast={(msg) => console.log(msg)}
            colorMode={settings.colorMode}
          />

          {execTime !== null && (
            <span className="text-[11px] text-emerald-500 font-mono font-semibold hidden xl:inline-block">
              {execTime}ms
            </span>
          )}

          {/* 大尺寸主题色【▶ 运行】按钮 (纯白高对比度文字) */}
          <button
            onClick={handleManualRun}
            disabled={loading}
            title="运行并渲染 CAD 模型 (快捷键: Ctrl + Enter)"
            style={{
              backgroundColor: themeToken.hex,
              color: "#ffffff",
              boxShadow: themeToken.glowShadow,
            }}
            className="px-5 py-2 hover:opacity-95 text-sm font-black rounded-full flex items-center space-x-2 shadow-lg transition active:scale-95 disabled:opacity-50 text-white"
          >
            <Play
              size={16}
              className={loading ? "animate-spin" : "fill-current"}
            />
            <span>{loading ? "渲染计算中..." : "运行"}</span>
            <kbd className="hidden sm:inline-block text-[9px] px-1.5 py-0.5 rounded-md font-mono bg-white/20 text-white">
              Ctrl+↵
            </kbd>
          </button>
        </div>
      </footer>

      {/*  右侧垂直 4 联悬浮工具胶囊 */}
      <div className="fixed bottom-20 right-4 z-30 flex flex-col items-center space-y-2.5 select-none">
        {/* 1. 🟣 AI 编程助手 */}
        <button
          onClick={() => setIsAiOpen((prev) => !prev)}
          title="打开 AI 3D 编程助手 (DeepSeek 驱动)"
          className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-700 to-indigo-600 hover:from-purple-600 hover:to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-purple-500/30 transition hover:scale-110 active:scale-95 border border-purple-400/30"
        >
          <Bot size={20} />
        </button>

        {/* 2. 🔍 查找与替换 */}
        <button
          onClick={() => {
            setIsSearchOpen((prev) => !prev);
            if (viewMode === "block") {
              setViewMode("split");
            }
          }}
          title="查找与替换代码 (Ctrl + F)"
          className={`w-10 h-10 rounded-full ${isLightMode
              ? "bg-white hover:bg-gray-50 text-amber-600 border-[#e1e4e8] shadow-md"
              : "bg-[#21262d] hover:bg-[#30363d] text-amber-400 border-[#30363d] shadow-lg"
            } flex items-center justify-center transition hover:scale-110 active:scale-95 border`}
        >
          <Search size={18} />
        </button>

        {/* 3. 🎨 调色板与材质 */}
        <button
          onClick={() => setIsPaletteOpen((prev) => !prev)}
          title="3D 模型材质与颜色调色板"
          className={`w-10 h-10 rounded-full ${isLightMode
              ? "bg-white hover:bg-gray-50 text-pink-600 border-[#e1e4e8] shadow-md"
              : "bg-[#21262d] hover:bg-[#30363d] text-pink-400 border-[#30363d] shadow-lg"
            } flex items-center justify-center transition hover:scale-110 active:scale-95 border`}
        >
          <Palette size={18} />
        </button>

        {/* 4. 🖥️ 控制台终端 */}
        <button
          onClick={() => setIsConsoleOpen((prev) => !prev)}
          title="展开 / 折叠运行控制台与错误诊断"
          className={`w-10 h-10 rounded-full ${isLightMode
              ? "bg-white hover:bg-gray-50 text-cyan-700 border-[#e1e4e8] shadow-md"
              : "bg-[#21262d] hover:bg-[#30363d] text-cyan-400 border-[#30363d] shadow-lg"
            } flex items-center justify-center transition hover:scale-110 active:scale-95 border`}
        >
          <Terminal size={18} />
        </button>
      </div>

      {/* AI 3D 编程助手抽屉 */}
      <AiDrawer
        isOpen={isAiOpen}
        onClose={() => setIsAiOpen(false)}
        onInsertCode={handleAiInsertCode}
        settings={settings}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* 3D 调色板与材质弹窗 */}
      <ColorPalettePopover
        isOpen={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
        onApplyColor={handleApplyColor}
        colorMode={settings.colorMode}
      />

      {/* 启发式 CAD 挑战关卡弹窗 (Karpathy 构建即理解) */}
      <MissionModal
        isOpen={isMissionOpen}
        onClose={() => setIsMissionOpen(false)}
        currentCode={code}
        onLoadMissionCode={handleLoadMissionCode}
        settings={settings}
      />

      {/* 编辑器设置模态弹窗 (白天/黑夜模式、6色主题、4项配置开关) */}
      <EditorSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
      />
    </div>
  );
}
