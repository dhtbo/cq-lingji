"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import * as Blockly from "blockly";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { HeaderToolbar, ViewMode } from "@/components/HeaderToolbar/HeaderToolbar";
import { PythonEditor } from "@/components/MonacoEditor/PythonEditor";
import { CadTemplate } from "@/components/Templates/cadTemplates";
import { MissionModal } from "@/components/Missions/MissionModal";
import { PrintCheckerModal } from "@/components/PrintChecker/PrintCheckerModal";
import { AiDrawer } from "@/components/AiAssistant/AiDrawer";
import { ColorPalettePopover } from "@/components/ColorPalette/ColorPalettePopover";
import {
  EditorSettingsModal,
  EditorSettings,
  DEFAULT_EDITOR_SETTINGS,
} from "@/components/EditorSettings/EditorSettingsModal";
import {
  saveWorkspaceToLocalStorage,
  loadWorkspaceFromLocalStorage,
  saveProjectToLocalStorage,
  loadProjectFromLocalStorage,
  downloadPythonFile,
  exportWorkspaceArchiveFile,
  exportProjectArchive,
  readProjectOrWorkspaceFile,
} from "@/lib/projectStorage";
import { ProjectWorkspace, NodeType } from "@/types/project";
import {
  createDefaultProject,
  getFlatFiles,
  findNodeByPath,
  addNode,
  deleteNode,
  renameNode,
  updateFileContent,
  setEntrypoint,
} from "@/lib/projectTree";
import { ProjectExplorer, EditorTabs } from "@/components/ProjectExplorer/ProjectExplorer";
import { ModelAssetViewer } from "@/components/ProjectExplorer/ModelAssetViewer";
import { convertPythonToBlockly } from "@/lib/pythonToBlockly";
import { convertBuild123dToCadQuery } from "@/lib/build123dToCadquery";
import { workspaceToBuild123d } from "@/components/BlocklyEditor/generator/build123d";
import { useDebounce } from "@/lib/useDebounce";
import {
  renderBuild123dCode,
  downloadCadExport,
  checkBackendHealth,
  previewModelAsset,
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
  const [isLocked, setIsLocked] = useState<boolean>(false); // 默认代码模式下自由编写代码
  const isLockedRef = useRef<boolean>(false);
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

  // 文件夹式多文件工程状态
  const [workspace, setWorkspace] = useState<ProjectWorkspace>(() =>
    createDefaultProject("我的3D作品", "")
  );
  const [isExplorerOpen, setIsExplorerOpen] = useState<boolean>(true);

  // 3D 模型资产预览状态管理
  const [modelLoading, setModelLoading] = useState<boolean>(false);
  const [modelError, setModelError] = useState<string | null>(null);
  const prevActivePathRef = useRef<string>(workspace.activeFilePath);
  const lastLoadedModelPathRef = useRef<string | null>(null);

  // 当前激活节点推导
  const activeNode = useMemo(() => {
    return findNodeByPath(workspace.root, workspace.activeFilePath);
  }, [workspace.root, workspace.activeFilePath]);

  // 判断当前激活的文件是否为 3D 模型资产 (STEP, STL, SVG, BREP 等)
  const isCurrentFileModelAsset = useMemo(() => {
    if (!workspace.activeFilePath) return false;
    const ext = workspace.activeFilePath.slice(workspace.activeFilePath.lastIndexOf(".")).toLowerCase();
    return [".step", ".stp", ".stl", ".brep", ".svg"].includes(ext);
  }, [workspace.activeFilePath]);

  // 视图模态：'code' (代码模式，默认) | 'block' (积木模式)
  const [viewMode, setViewMode] = useState<ViewMode>("code");
  const [projectName, setProjectName] = useState<string>("我的3D作品.py");
  const [isSaved, setIsSaved] = useState<boolean>(true);
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  // 待恢复的积木 XML 与积木代码比对引用
  const pendingBlocklyXmlRef = useRef<string | null>(null);
  const lastBlocklyCodeRef = useRef<string>("");
  const blocklyWorkspaceRef = useRef<any>(null);

  // 侧边浮动工具栈展开状态
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

  // 3D 打印体检模态窗状态 (LogoUp 3D)
  const [isPrintCheckerOpen, setIsPrintCheckerOpen] = useState<boolean>(false);

  // 编辑器设置状态与持久化
  const [settings, setSettings] = useState<EditorSettings>(DEFAULT_EDITOR_SETTINGS);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("cadquery_editor_settings");
      if (saved) {
        const parsed = JSON.parse(saved);
        setSettings((prev) => ({ ...prev, ...parsed }));
        if (parsed.defaultViewMode) {
          setViewMode(parsed.defaultViewMode);
        }
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
    setTimeout(() => setSaveToastMsg(null), 3500);
  }, []);

  // 页面加载时自动恢复本地暂存工程 (支持 2.0 多文件结构与 1.0 单文件)
  useEffect(() => {
    try {
      const savedWs = loadWorkspaceFromLocalStorage();
      if (savedWs && savedWs.root) {
        setWorkspace(savedWs);
        setProjectName(savedWs.name || "我的3D作品");
        const activeNode = findNodeByPath(savedWs.root, savedWs.activeFilePath);
        const fileContent = activeNode?.content ?? "";
        setCode(fileContent);
        setIsSaved(true);
        if (activeNode?.blocklyXml) {
          pendingBlocklyXmlRef.current = activeNode.blocklyXml;
          if (blocklyWorkspaceRef.current) {
            try {
              const dom = Blockly.utils.xml.textToDom(activeNode.blocklyXml);
              blocklyWorkspaceRef.current.clear();
              Blockly.Xml.domToWorkspace(dom, blocklyWorkspaceRef.current);
            } catch (e) {
              console.warn("恢复积木工作区失败:", e);
            }
          }
        }
        showToast(`📦 已自动恢复本地工程「${savedWs.name || "我的3D作品"}」`);
      }
    } catch (e) {
      console.warn("读取本地暂存工程失败:", e);
    }
  }, [showToast]);

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

  // 防抖 400ms
  const debouncedCode = useDebounce(code, 400);

  // 智能推断当前模型主要实体变量名 (优先匹配 with BuildPart() as <varName>:)
  const targetPartVar = useMemo(() => {
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

  // 执行渲染核心逻辑 (支持多文件项目、虚拟模块加载、单步特征时间旅行与控制台 stdout 捕获)
  const performRender = useCallback(
    async (targetCode?: string, targetStep?: number, targetWs?: ProjectWorkspace) => {
      const activeWs = targetWs || workspace;
      const currentActiveCode = typeof targetCode === "string" ? targetCode : code;

      // 提取工程中所有文件源码
      const files = getFlatFiles(activeWs.root);
      if (activeWs.activeFilePath) {
        files[activeWs.activeFilePath] = currentActiveCode;
      }

      // 决定主执行入口代码 (若有指定的 entrypoint 文件则执行入口，否则执行当前文件)
      const entryPath = activeWs.entrypoint || "main.py";
      let entryCode = files[entryPath];
      if (!entryCode || !entryCode.trim()) {
        entryCode = currentActiveCode;
      }

      if (!entryCode || !entryCode.trim()) return;

      setLoading(true);
      setErrorMessage(null);

      try {
        const res = await renderBuild123dCode(entryCode, {
          step: targetStep,
          files,
          entrypoint: entryPath,
        });
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
    [code, workspace, formatErrorMessage]
  );

  // 响应防抖代码更新 (默认渲染最终完整特征状态)
  useEffect(() => {
    if (debouncedCode) {
      performRender(debouncedCode);
    }
  }, [debouncedCode, performRender]);

  // 暴露全局代码设置钩子以便快速调试与自动化测试
  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).__setStudioCode = (newCode: string) => {
        setCode(newCode);
        performRender(newCode);
      };
    }
  }, [performRender]);

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
      setWorkspace((prev) => ({
        ...prev,
        root: updateFileContent(prev.root, prev.activeFilePath, newCode),
      }));
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

  // 载入模型资产 (STEP, STL, SVG, BREP 等) 并在 3D 视口中实时网格化
  const loadModelAssetPreview = useCallback(
    async (fileName: string, fileContent: string) => {
      if (!fileContent) {
        setModelError("模型文件内容为空");
        return;
      }
      setModelLoading(true);
      setModelError(null);
      setLoading(true);
      try {
        const res = await previewModelAsset(fileName, fileContent, "#10B981", 0.01);
        if (res.status === "success" && res.mesh) {
          setMeshData(res.mesh);
          if (res.execution_time_ms !== undefined) {
            setExecTime(res.execution_time_ms);
          }
          setSteps([]);
          setCurrentStep(1);
          setTotalSteps(1);
          setModelError(null);
          showToast(`✨ 已成功在 3D 视口载入模型: ${fileName}`);
        } else {
          const err = res.detail || "无法解析模型几何数据";
          setModelError(err);
          showToast(`⚠️ 模型载入异常: ${err}`);
        }
      } catch (err: any) {
        const msg = err.message || "请求模型几何渲染失败";
        setModelError(msg);
        showToast(`⚠️ 模型载入失败: ${msg}`);
      } finally {
        setModelLoading(false);
        setLoading(false);
      }
    },
    [showToast]
  );

  // 监听当前文件切换，自动在代码编辑与 3D 模型资产视口预览之间无缝流转
  useEffect(() => {
    const currentPath = workspace.activeFilePath;
    const prevPath = prevActivePathRef.current;
    prevActivePathRef.current = currentPath;

    if (!currentPath) return;

    const ext = currentPath.slice(currentPath.lastIndexOf(".")).toLowerCase();
    const isModel = [".step", ".stp", ".stl", ".brep", ".svg"].includes(ext);

    if (isModel) {
      if (lastLoadedModelPathRef.current !== currentPath) {
        const node = findNodeByPath(workspace.root, currentPath);
        if (node && node.content) {
          lastLoadedModelPathRef.current = currentPath;
          loadModelAssetPreview(node.name, node.content);
        }
      }
    } else {
      if (lastLoadedModelPathRef.current !== null) {
        // 从 3D 模型切回 Python 代码文件，重置标记并重新编译当前代码以恢复视口
        lastLoadedModelPathRef.current = null;
        const node = findNodeByPath(workspace.root, currentPath);
        const targetCode = node?.content ?? code;
        performRender(targetCode);
      }
    }
  }, [workspace.activeFilePath, workspace.root, loadModelAssetPreview, performRender, code]);

  // 手动运行渲染 (执行当前多文件工程，若当前为模型资产则刷新预览)
  const handleManualRun = () => {
    if (isCurrentFileModelAsset && activeNode) {
      loadModelAssetPreview(activeNode.name, activeNode.content || "");
    } else {
      performRender(code);
    }
  };

  // 切换活动编辑文件
  const handleSelectFile = useCallback(
    (filePath: string) => {
      setWorkspace((prev) => {
        // 先把当前文件的最新内容和积木同步存回当前节点
        let updatedRoot = prev.root;
        if (prev.activeFilePath) {
          let xmlStr: string | undefined;
          if (blocklyWorkspaceRef.current) {
            try {
              const xmlDom = Blockly.Xml.workspaceToDom(blocklyWorkspaceRef.current);
              xmlStr = Blockly.Xml.domToText(xmlDom);
            } catch { }
          }
          updatedRoot = updateFileContent(updatedRoot, prev.activeFilePath, code, xmlStr);
        }

        const targetNode = findNodeByPath(updatedRoot, filePath);
        if (!targetNode || targetNode.type !== "file") return prev;

        const openFiles = prev.openFiles.includes(filePath)
          ? prev.openFiles
          : [...prev.openFiles, filePath];

        const targetContent = targetNode.content ?? "";
        setCode(targetContent);
        setIsSaved(true);

        // 如果存在积木数据且当前为积木工作区，恢复积木
        if (targetNode.blocklyXml && blocklyWorkspaceRef.current) {
          try {
            Blockly.Events.disable();
            blocklyWorkspaceRef.current.clear();
            const dom = Blockly.utils.xml.textToDom(targetNode.blocklyXml);
            Blockly.Xml.domToWorkspace(dom, blocklyWorkspaceRef.current);
            Blockly.Events.enable();
          } catch { }
        } else if (blocklyWorkspaceRef.current && targetContent) {
          convertPythonToBlockly(targetContent, blocklyWorkspaceRef.current);
        }

        const nextWs: ProjectWorkspace = {
          ...prev,
          root: updatedRoot,
          activeFilePath: filePath,
          openFiles,
        };
        saveWorkspaceToLocalStorage(nextWs);
        return nextWs;
      });
    },
    [code]
  );

  // 关闭标签页
  const handleCloseFile = useCallback((filePath: string) => {
    setWorkspace((prev) => {
      const nextOpen = prev.openFiles.filter((p) => p !== filePath);
      if (nextOpen.length === 0) return prev; // 至少保留一个文件

      let nextActive = prev.activeFilePath;
      if (prev.activeFilePath === filePath) {
        nextActive = nextOpen[nextOpen.length - 1];
        const targetNode = findNodeByPath(prev.root, nextActive);
        setCode(targetNode?.content || "");
      }

      const nextWs: ProjectWorkspace = {
        ...prev,
        openFiles: nextOpen,
        activeFilePath: nextActive,
      };
      saveWorkspaceToLocalStorage(nextWs);
      return nextWs;
    });
  }, []);

  // 添加文件或文件夹 (支持文本文件与二进制 3D 资产)
  const handleAddNode = useCallback(
    (
      parentPath: string,
      name: string,
      type: NodeType,
      customContent?: string,
      isBinary?: boolean,
      fileSize?: number
    ) => {
      setWorkspace((prev) => {
        const fullPath = parentPath ? `${parentPath}/${name}` : name;
        const initialContent =
          customContent !== undefined
            ? customContent
            : type === "file"
            ? `# -*- coding: utf-8 -*-\nfrom build123d import *\n\n# 模块: ${name}\n`
            : "";
        const updatedRoot = addNode(
          prev.root,
          parentPath,
          name,
          type,
          initialContent,
          isBinary ?? false,
          fileSize
        );

        let nextActive = prev.activeFilePath;
        let nextOpen = prev.openFiles;

        if (type === "file") {
          nextActive = fullPath;
          if (!nextOpen.includes(fullPath)) {
            nextOpen = [...nextOpen, fullPath];
          }
          setCode(initialContent);
        }

        const nextWs: ProjectWorkspace = {
          ...prev,
          root: updatedRoot,
          activeFilePath: nextActive,
          openFiles: nextOpen,
        };
        saveWorkspaceToLocalStorage(nextWs);
        showToast(`✨ 已创建${type === "file" ? "文件" : "文件夹"}: ${name}`);
        return nextWs;
      });
    },
    [showToast]
  );

  // 批量导入本地文件 (STL, STEP, SVG, DXF, PY 等)
  const handleImportFiles = useCallback(
    (targetParentPath: string, files: File[]) => {
      let importedCount = 0;
      files.forEach((file) => {
        const ext = file.name.split(".").pop()?.toLowerCase() || "";
        const isBin = ["stl", "step", "stp", "brep"].includes(ext);

        const reader = new FileReader();
        if (isBin) {
          reader.readAsDataURL(file);
          reader.onload = () => {
            const dataUrl = reader.result as string;
            handleAddNode(targetParentPath, file.name, "file", dataUrl, true, file.size);
          };
        } else {
          reader.readAsText(file, "utf-8");
          reader.onload = () => {
            const textContent = reader.result as string;
            handleAddNode(targetParentPath, file.name, "file", textContent, false, file.size);
          };
        }
        importedCount++;
      });
      showToast(`📁 正在导入 ${importedCount} 个本地文件...`);
    },
    [handleAddNode, showToast]
  );

  // 删除文件或文件夹
  const handleDeleteNode = useCallback(
    (path: string) => {
      setWorkspace((prev) => {
        if (path === prev.entrypoint) {
          showToast("⚠️ 无法删除当前主执行入口文件，请先指定其他文件为入口");
          return prev;
        }

        const updatedRoot = deleteNode(prev.root, path);
        let nextOpen = prev.openFiles.filter((p) => !p.startsWith(path));
        if (nextOpen.length === 0) {
          nextOpen = [prev.entrypoint];
        }

        let nextActive = prev.activeFilePath;
        if (prev.activeFilePath.startsWith(path)) {
          nextActive = nextOpen[0];
          const targetNode = findNodeByPath(updatedRoot, nextActive);
          setCode(targetNode?.content || "");
        }

        const nextWs: ProjectWorkspace = {
          ...prev,
          root: updatedRoot,
          openFiles: nextOpen,
          activeFilePath: nextActive,
        };
        saveWorkspaceToLocalStorage(nextWs);
        showToast(`🗑️ 已删除: ${path}`);
        return nextWs;
      });
    },
    [showToast]
  );

  // 重命名文件或文件夹
  const handleRenameNode = useCallback(
    (oldPath: string, newName: string) => {
      setWorkspace((prev) => {
        const { newRoot, newPath } = renameNode(prev.root, oldPath, newName);
        const nextOpen = prev.openFiles.map((p) => (p === oldPath ? newPath : p));
        const nextActive = prev.activeFilePath === oldPath ? newPath : prev.activeFilePath;
        const nextEntry = prev.entrypoint === oldPath ? newPath : prev.entrypoint;

        const nextWs: ProjectWorkspace = {
          ...prev,
          root: newRoot,
          openFiles: nextOpen,
          activeFilePath: nextActive,
          entrypoint: nextEntry,
        };
        saveWorkspaceToLocalStorage(nextWs);
        showToast(`✏️ 已重命名为: ${newName}`);
        return nextWs;
      });
    },
    [showToast]
  );

  // 设置指定文件为主执行入口
  const handleSetEntrypoint = useCallback(
    (path: string) => {
      setWorkspace((prev) => {
        const updatedRoot = setEntrypoint(prev.root, path);
        const nextWs: ProjectWorkspace = {
          ...prev,
          root: updatedRoot,
          entrypoint: path,
        };
        saveWorkspaceToLocalStorage(nextWs);
        showToast(`🎯 已将「${path}」设为主执行入口 (main)`);
        return nextWs;
      });
    },
    [showToast]
  );

  // 保存整个工程至本地暂存库 (LocalStorage)
  const handleSave = () => {
    let xmlStr: string | undefined;
    if (blocklyWorkspaceRef.current) {
      try {
        const xmlDom = Blockly.Xml.workspaceToDom(blocklyWorkspaceRef.current);
        xmlStr = Blockly.Xml.domToText(xmlDom);
      } catch { }
    }

    const updatedRoot = updateFileContent(workspace.root, workspace.activeFilePath, code, xmlStr);
    const updatedWs: ProjectWorkspace = {
      ...workspace,
      name: projectName,
      root: updatedRoot,
      savedAt: Date.now(),
    };
    setWorkspace(updatedWs);

    const okWs = saveWorkspaceToLocalStorage(updatedWs);
    // 兼容保存旧版单文件格式
    saveProjectToLocalStorage(projectName, code, xmlStr);
    setIsSaved(true);
    if (okWs) {
      showToast(`✅ 工程「${projectName}」所有文件已成功保存到本地存储！`);
    } else {
      showToast("⚠️ 保存失败，请检查浏览器存储权限");
    }
  };

  // 从本地暂存载入工程 (显式读取)
  const handleLoadSavedProject = useCallback(() => {
    try {
      const savedWs = loadWorkspaceFromLocalStorage();
      if (!savedWs || !savedWs.root) {
        showToast("⚠️ 本地暂存库暂无工程记录，请先编辑并点击保存");
        return;
      }
      setWorkspace(savedWs);
      setProjectName(savedWs.name || "我的3D作品");
      const activeNode = findNodeByPath(savedWs.root, savedWs.activeFilePath);
      const activeContent = activeNode?.content || "";
      setCode(activeContent);
      setIsSaved(true);

      if (activeNode?.blocklyXml && blocklyWorkspaceRef.current) {
        try {
          Blockly.Events.disable();
          blocklyWorkspaceRef.current.clear();
          const dom = Blockly.utils.xml.textToDom(activeNode.blocklyXml);
          Blockly.Xml.domToWorkspace(dom, blocklyWorkspaceRef.current);
          Blockly.Events.enable();
        } catch (e) {
          console.warn("恢复积木失败:", e);
        }
      } else if (blocklyWorkspaceRef.current && activeContent) {
        convertPythonToBlockly(activeContent, blocklyWorkspaceRef.current);
      }
      performRender(activeContent, undefined, savedWs);
      showToast(`📦 已成功载入本地暂存工程「${savedWs.name || "我的3D作品"}」`);
    } catch (e: any) {
      showToast(`⚠️ 载入暂存工程失败: ${e.message || String(e)}`);
    }
  }, [performRender, showToast]);

  // 积木工作区挂载就绪回调
  const handleWorkspaceReady = useCallback((ws: any) => {
    blocklyWorkspaceRef.current = ws;
    if (typeof window !== "undefined") {
      (window as any).__blocklyWorkspace = ws;
      (window as any).Blockly = Blockly;
    }
    if (pendingBlocklyXmlRef.current) {
      try {
        Blockly.Events.disable();
        ws.clear();
        const dom = Blockly.utils.xml.textToDom(pendingBlocklyXmlRef.current);
        Blockly.Xml.domToWorkspace(dom, ws);
        Blockly.Events.enable();
      } catch (e) {
        console.warn("恢复暂存积木失败:", e);
      }
    } else if (code && code.trim()) {
      convertPythonToBlockly(code, ws);
    }
  }, [code]);

  // 视图模式无损切换：代码优先，切积木不丢失积木或代码
  const handleSwitchViewMode = useCallback(
    (newMode: ViewMode) => {
      if (newMode === viewMode) return;

      if (newMode === "code") {
        // 从积木模式切到代码模式：若积木工作区存在，把最新拼装的 Python 代码提取并更新到编辑器
        if (blocklyWorkspaceRef.current) {
          try {
            const generated = workspaceToBuild123d(blocklyWorkspaceRef.current);
            if (generated && generated.trim()) {
              setCode(generated);
              lastBlocklyCodeRef.current = generated;
              // 同步更新树节点
              setWorkspace((prev) => ({
                ...prev,
                root: updateFileContent(prev.root, prev.activeFilePath, generated),
              }));
            }
          } catch (e) {
            console.warn("提取积木代码失败:", e);
          }
        }
        setViewMode("code");
      } else if (newMode === "block") {
        // 从代码模式切到积木模式：
        // 若 Monaco 中的代码与积木上次生成的代码不一致，说明用户编辑了代码，自动逆向转为积木！
        if (blocklyWorkspaceRef.current) {
          if (code && code.trim() && code.trim() !== lastBlocklyCodeRef.current.trim()) {
            const res = convertPythonToBlockly(code, blocklyWorkspaceRef.current);
            if (res.success) {
              lastBlocklyCodeRef.current = code;
            }
          }
          // 延迟自适应尺寸
          setTimeout(() => {
            if (blocklyWorkspaceRef.current) {
              Blockly.svgResize(blocklyWorkspaceRef.current);
            }
          }, 50);
        }
        setViewMode("block");
      }
    },
    [viewMode, code]
  );

  // 暴露给外部或自动化测试的无损注入接口
  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).__setStudioCode = (newCode: string) => {
        setIsLocked(false);
        setCode(newCode);
        performRender(newCode);
      };
    }
  }, [performRender]);

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
          handleSwitchViewMode("code");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [code, performRender, viewMode, handleSwitchViewMode]);

  // 下载当前活动文件 Python 源码 (.py)
  const handleDownloadPy = () => {
    const activeFileName = workspace.activeFilePath.split("/").pop() || projectName;
    downloadPythonFile(activeFileName, code);
    showToast(`✅ 已下载源码脚本: ${activeFileName}`);
  };

  // 单向导出为 CadQuery 脚本 (.py)
  const handleDownloadCadQueryPy = () => {
    const cqCode = convertBuild123dToCadQuery(code);
    const activeFileName = workspace.activeFilePath.split("/").pop() || projectName;
    const cqName = activeFileName.replace(/\.(py|json)$/i, "") + "_cadquery.py";
    downloadPythonFile(cqName, cqCode);
    showToast(`✅ 已导出 CadQuery 单向脚本: ${cqName}`);
  };

  // 导出完整多文件工程归档包 (.cqproj.json)
  const handleExportProject = () => {
    let xmlStr: string | undefined;
    if (blocklyWorkspaceRef.current) {
      try {
        const xmlDom = Blockly.Xml.workspaceToDom(blocklyWorkspaceRef.current);
        xmlStr = Blockly.Xml.domToText(xmlDom);
      } catch { }
    }

    const updatedRoot = updateFileContent(workspace.root, workspace.activeFilePath, code, xmlStr);
    const updatedWs: ProjectWorkspace = {
      ...workspace,
      name: projectName,
      root: updatedRoot,
      savedAt: Date.now(),
    };
    exportWorkspaceArchiveFile(updatedWs);
    showToast("✅ 多文件完整工程归档已导出 (.cqproj.json)");
  };

  // 打开本地工程归档 (.cqproj.json, .cq.json) 或 Python 脚本文件
  const handleImportProject = async (file: File) => {
    try {
      const res = await readProjectOrWorkspaceFile(file);
      const loadedWs = res.workspace;
      setWorkspace(loadedWs);
      setProjectName(loadedWs.name);

      const activeNode = findNodeByPath(loadedWs.root, loadedWs.activeFilePath);
      const fileCode = activeNode?.content ?? "";
      setCode(fileCode);
      setIsLocked(false);
      isLockedRef.current = false;
      setIsSaved(true);

      if (activeNode?.blocklyXml && blocklyWorkspaceRef.current) {
        try {
          Blockly.Events.disable();
          blocklyWorkspaceRef.current.clear();
          const dom = Blockly.utils.xml.textToDom(activeNode.blocklyXml);
          Blockly.Xml.domToWorkspace(dom, blocklyWorkspaceRef.current);
          Blockly.Events.enable();
        } catch { }
      } else if (blocklyWorkspaceRef.current && fileCode) {
        convertPythonToBlockly(fileCode, blocklyWorkspaceRef.current);
      }

      performRender(fileCode, undefined, loadedWs);
      showToast(`✅ 成功载入文件/工程: ${file.name}`);
    } catch (err: any) {
      showToast(`⚠️ 载入失败: ${err.message || String(err)}`);
    }
  };

  // 代码逆向转换至图形积木
  const handleCodeToBlockly = (currentCode?: string) => {
    const targetCode = typeof currentCode === "string" && currentCode.trim() ? currentCode : code;
    setCode(targetCode);
    if (!blocklyWorkspaceRef.current) {
      handleSwitchViewMode("block");
      return;
    }
    const res = convertPythonToBlockly(targetCode, blocklyWorkspaceRef.current);
    if (res.success) {
      showToast(`✅ ${res.message}`);
      handleSwitchViewMode("block");
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
    // 尝试同步逆向转换为图形积木
    if (blocklyWorkspaceRef.current) {
      convertPythonToBlockly(codeSnippet, blocklyWorkspaceRef.current);
    }
    showToast("🤖 AI 代码已注入并自动同步更新积木！");
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

    // 将 3D 拾取选择器转换为 build123d 草图附着面
    const mapSelectorToPlane = (sel: string) => {
      if (sel === ">Z") return "TOP_FACE";
      if (sel === "<Z") return "BOTTOM_FACE";
      if (sel === ">X") return "RIGHT_FACE";
      if (sel === "<X") return "LEFT_FACE";
      if (sel === ">Y") return "FRONT_FACE";
      if (sel === "<Y") return "BACK_FACE";
      return "TOP_FACE";
    };

    if (type === "face") {
      const planeVal = mapSelectorToPlane(value || ">Z");
      const faceExpr =
        planeVal === "TOP_FACE"
          ? `${targetPartVar}.faces().sort_by(Axis.Z)[-1]`
          : planeVal === "BOTTOM_FACE"
          ? `${targetPartVar}.faces().sort_by(Axis.Z)[0]`
          : planeVal === "RIGHT_FACE"
          ? `${targetPartVar}.faces().sort_by(Axis.X)[-1]`
          : planeVal === "LEFT_FACE"
          ? `${targetPartVar}.faces().sort_by(Axis.X)[0]`
          : `${targetPartVar}.faces().sort_by(Axis.Z)[-1]`;

      const applyToBlock = (b: any) => {
        b.setFieldValue(planeVal, "PLANE");
        if (b.getField("PARENT_VAR")) b.setFieldValue(targetPartVar, "PARENT_VAR");
        if (b.getField("FACE_EXPR")) b.setFieldValue(faceExpr, "FACE_EXPR");
        b.render();
      };

      const selectedBlock: any = Blockly.common?.getSelected?.();
      if (selectedBlock && selectedBlock.type === "b3d_build_sketch") {
        applyToBlock(selectedBlock);
        showToast(`已将选中草图附着面切换为 [${planeVal}]`);
        return;
      }
      const sketchBlock = allBlocks
        .slice()
        .reverse()
        .find((b: any) => b.type === "b3d_build_sketch");

      if (sketchBlock) {
        applyToBlock(sketchBlock);
        showToast(`已将草图建造者附着面同步为 [${planeVal}]`);
      } else {
        const newBlock = ws.newBlock("b3d_build_sketch");
        applyToBlock(newBlock);
        newBlock.initSvg();
        newBlock.render();
        newBlock.moveTo(new (Blockly as any).utils.Coordinate(100, 180));
        showToast(`已为表面 [${value || ">Z"}] 创建草图建造者积木`);
      }
    } else if (type === "edge") {
      const filletBlock = allBlocks
        .slice()
        .reverse()
        .find((b: any) => b.type === "b3d_fillet");

      if (filletBlock) {
        filletBlock.setFieldValue(radius || 1.5, "RADIUS");
        filletBlock.render();
      } else {
        const newBlock = ws.newBlock("b3d_fillet");
        newBlock.setFieldValue(radius || 1.5, "RADIUS");
        newBlock.initSvg();
        newBlock.render();
        newBlock.moveTo(new (Blockly as any).utils.Coordinate(120, 220));
      }
    } else if (type === "box") {
      const newBlock = ws.newBlock("b3d_box");
      newBlock.setFieldValue(extraParams?.length ?? 20, "LENGTH");
      newBlock.setFieldValue(extraParams?.width ?? 20, "WIDTH");
      newBlock.setFieldValue(extraParams?.height ?? 10, "HEIGHT");
      newBlock.setFieldValue("ADD", "MODE");
      newBlock.initSvg();
      newBlock.render();
      newBlock.moveTo(new (Blockly as any).utils.Coordinate(80, 120));
    } else if (type === "cylinder") {
      const newBlock = ws.newBlock("b3d_cylinder");
      newBlock.setFieldValue(extraParams?.radius ?? 10, "RADIUS");
      newBlock.setFieldValue(extraParams?.height ?? 20, "HEIGHT");
      newBlock.setFieldValue("ADD", "MODE");
      newBlock.initSvg();
      newBlock.render();
      newBlock.moveTo(new (Blockly as any).utils.Coordinate(80, 120));
    } else if (type === "sphere") {
      const newBlock = ws.newBlock("b3d_sphere");
      newBlock.setFieldValue(extraParams?.radius ?? 10, "RADIUS");
      newBlock.setFieldValue("ADD", "MODE");
      newBlock.initSvg();
      newBlock.render();
      newBlock.moveTo(new (Blockly as any).utils.Coordinate(80, 120));
    } else if (type === "extrude") {
      const newBlock = ws.newBlock("b3d_extrude");
      newBlock.setFieldValue(extraParams?.distance ?? 10, "AMOUNT");
      newBlock.setFieldValue("ADD", "MODE");
      newBlock.initSvg();
      newBlock.render();
      newBlock.moveTo(new (Blockly as any).utils.Coordinate(100, 200));
    } else if (type === "hole") {
      const newBlock = ws.newBlock("b3d_hole");
      newBlock.setFieldValue((extraParams?.diameter ?? 6) / 2, "RADIUS");
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

  // 导出 STL (支持多文件工程)
  const handleExportStl = async () => {
    try {
      const files = getFlatFiles(workspace.root);
      files[workspace.activeFilePath] = code;
      await downloadCadExport(code, "stl", undefined, files, workspace.entrypoint);
    } catch (e: any) {
      alert(`导出 STL 失败: ${e.message}`);
    }
  };

  // 导出 STEP (支持多文件工程)
  const handleExportStep = async () => {
    try {
      const files = getFlatFiles(workspace.root);
      files[workspace.activeFilePath] = code;
      await downloadCadExport(code, "step", undefined, files, workspace.entrypoint);
    } catch (e: any) {
      alert(`导出 STEP 失败: ${e.message}`);
    }
  };

  // 载入预置教学案例
  const handleSelectTemplate = (template: CadTemplate) => {
    setIsLocked(false);
    setCode(template.code);
    setWorkspace((prev) => ({
      ...prev,
      root: updateFileContent(prev.root, prev.activeFilePath, template.code),
    }));
    performRender(template.code);
  };

  // 载入挑战关卡任务代码
  const handleLoadMissionCode = (missionCode: string) => {
    setIsLocked(false);
    setCode(missionCode);
    setWorkspace((prev) => ({
      ...prev,
      root: updateFileContent(prev.root, prev.activeFilePath, missionCode),
    }));
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
        onViewModeChange={handleSwitchViewMode}
        projectName={projectName}
        onProjectNameChange={setProjectName}
        onSave={handleSave}
        onLoadSavedProject={handleLoadSavedProject}
        isSaved={isSaved}
        onRun={handleManualRun}
        onExportStl={handleExportStl}
        onExportStep={handleExportStep}
        onDownloadPy={handleDownloadPy}
        onDownloadCadQueryPy={handleDownloadCadQueryPy}
        onExportProject={handleExportProject}
        onImportProject={handleImportProject}
        saveToastMsg={saveToastMsg}
        onSelectTemplate={handleSelectTemplate}
        onOpenMissions={() => setIsMissionOpen(true)}
        onOpenPrintChecker={() => setIsPrintCheckerOpen(true)}
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
        onUpdateSettings={handleUpdateSettings}
      />

      {/* 主工作区 (二态自适应：代码优先 / 积木模式，常驻挂载以保障零延迟与无损切换) */}
      <main className="flex-1 w-full h-[calc(100vh-3.25rem-3.5rem)] relative">
        <PanelGroup direction="horizontal" className="w-full h-full">
          {/* 左侧编辑器与积木容器 (含文件夹式资源管理器 + 顶部标签栏) (60%) */}
          <Panel defaultSize={60} minSize={30} className="relative h-full overflow-hidden flex flex-row">
            {/* 1. 文件夹式多文件工程资源管理器侧边栏 */}
            <ProjectExplorer
              workspace={workspace}
              isLightMode={isLightMode}
              onSelectFile={handleSelectFile}
              onAddNode={handleAddNode}
              onDeleteNode={handleDeleteNode}
              onRenameNode={handleRenameNode}
              onSetEntrypoint={handleSetEntrypoint}
              onExportProject={handleExportProject}
              onImportProject={handleImportProject}
              onImportFiles={handleImportFiles}
              isOpen={isExplorerOpen}
              onToggleOpen={() => setIsExplorerOpen((prev) => !prev)}
            />

            {/* 2. 编辑器与积木工作区主区域 */}
            <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
              {/* 顶部标签栏 */}
              <EditorTabs
                workspace={workspace}
                isLightMode={isLightMode}
                onSelectFile={handleSelectFile}
                onCloseFile={handleCloseFile}
              />

              {/* 核心工作区 (模型资产检视 / Monaco 代码 / Blockly 积木) */}
              <div className="flex-1 relative min-h-0 overflow-hidden">
                {isCurrentFileModelAsset && activeNode ? (
                  <ModelAssetViewer
                    filePath={workspace.activeFilePath}
                    fileName={activeNode.name}
                    fileContent={activeNode.content || ""}
                    isBinary={activeNode.isBinary}
                    fileSize={activeNode.fileSize}
                    isLightMode={isLightMode}
                    loading={modelLoading}
                    errorMessage={modelError}
                    onReload={() => loadModelAssetPreview(activeNode.name, activeNode.content || "")}
                  />
                ) : (
                  <>
                    {/* 1. 代码模式视图 (Monaco) */}
                    <div
                      className={`w-full h-full ${viewMode === "code" ? "block" : "hidden"}`}
                      style={{ display: viewMode === "code" ? "block" : "none" }}
                    >
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
                    </div>

                    {/* 2. 积木模式视图 (Blockly) */}
                    <div
                      className={`w-full h-full ${viewMode === "block" ? "block" : "hidden"}`}
                      style={{ display: viewMode === "block" ? "block" : "none" }}
                    >
                      <BlocklyWorkspace
                        onCodeChange={handleBlocklyCodeChange}
                        workspaceRefOut={blocklyWorkspaceRef}
                        onWorkspaceReady={handleWorkspaceReady}
                        colorMode={settings.colorMode}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          </Panel>

          <PanelResizeHandle className="resize-handle" />

          {/* 右侧 3D 视口 (40%) */}
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
            targetVar={targetPartVar}
            themeToken={themeToken}
            onInjectCode={handleInjectCode}
            onApplyToBlockly={handleApplyToBlockly}
            showToast={showToast}
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
              handleSwitchViewMode("code");
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

      {/* 3D 打印体检与流形评估弹窗 (LogoUp 3D) */}
      <PrintCheckerModal
        isOpen={isPrintCheckerOpen}
        onClose={() => setIsPrintCheckerOpen(false)}
        code={code}
        files={getFlatFiles(workspace.root)}
        entrypoint={workspace.entrypoint}
        onExportStl={handleExportStl}
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
