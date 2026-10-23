"use client";

import React, { useRef, useState, useEffect } from "react";
import Editor, { OnMount } from "@monaco-editor/react";
import {
  Lock,
  Unlock,
  Copy,
  Check,
  Sparkles,
  Terminal,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Trash2,
  Search,
  Boxes,
  RefreshCw,
} from "lucide-react";
import { SearchReplaceWidget } from "./SearchReplaceWidget";
import { setupMonacoLoader } from "@/lib/monacoLoader";

// 立即配置 Monaco 智能高速镜像加载器 (国内百度源 / 阿里 NPM 镜像，海外 cdnjs)
setupMonacoLoader();

interface PythonEditorProps {
  code: string;
  onChange: (newCode: string) => void;
  isLocked: boolean;
  onToggleLock: () => void;
  errorMessage?: string | null;
  stdout?: string;
  execTime?: number | null;
  isSearchOpen?: boolean;
  onCloseSearch?: () => void;
  isConsoleOpen?: boolean;
  onToggleConsole?: () => void;
  indentGuides?: boolean;
  colorMode?: "light" | "dark";
  onCodeToBlockly?: (currentCode?: string) => void;
}

export const PythonEditor: React.FC<PythonEditorProps> = ({
  code,
  onChange,
  isLocked,
  onToggleLock,
  errorMessage,
  stdout,
  execTime,
  isSearchOpen: externalSearchOpen,
  onCloseSearch,
  isConsoleOpen: externalConsoleOpen,
  onToggleConsole,
  indentGuides = true,
  colorMode = "dark",
  onCodeToBlockly,
}) => {
  const [copied, setCopied] = useState(false);
  const [copiedConsole, setCopiedConsole] = useState(false);
  const [internalConsoleOpen, setInternalConsoleOpen] = useState(true);
  const [consoleTab, setConsoleTab] = useState<"output" | "diagnostics">("output");
  const [cleared, setCleared] = useState(false);

  // 浮动查找与替换状态
  const [internalSearchOpen, setInternalSearchOpen] = useState(false);
  const [matchCount, setMatchCount] = useState({ current: 0, total: 0 });
  const matchesRef = useRef<any[]>([]);
  const currentMatchIndexRef = useRef<number>(-1);

  const editorRef = useRef<any>(null);

  const isConsoleActive =
    externalConsoleOpen !== undefined ? externalConsoleOpen : internalConsoleOpen;
  const isSearchActive = Boolean(externalSearchOpen || internalSearchOpen);

  // 报错时自动展开控制台并切换到诊断 Tab
  useEffect(() => {
    if (errorMessage) {
      if (onToggleConsole && !externalConsoleOpen) {
        onToggleConsole();
      } else {
        setInternalConsoleOpen(true);
      }
      setConsoleTab("diagnostics");
    }
  }, [errorMessage, onToggleConsole, externalConsoleOpen]);

  // 有 stdout 输出且无错误时自动切换到控制台输出 Tab
  useEffect(() => {
    if (stdout && !errorMessage) {
      setCleared(false);
    }
  }, [stdout, errorMessage]);

  const activeStdout = cleared ? "" : stdout;

  const handleCopyConsole = () => {
    const content =
      consoleTab === "output"
        ? activeStdout || "无控制台输出"
        : errorMessage || "无错误诊断";
    navigator.clipboard.writeText(content);
    setCopiedConsole(true);
    setTimeout(() => setCopiedConsole(false), 2000);
  };

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // 绑定 Ctrl+F 唤起 浮动查找与替换面板
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyF, () => {
      setInternalSearchOpen(true);
    });

    // 注册 CadQuery API 智能补全项
    monaco.languages.registerCompletionItemProvider("python", {
      provideCompletionItems: (model: any, position: any) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };

        const build123dSuggestions = [
          {
            label: "BuildPart",
            kind: monaco.languages.CompletionItemKind.Class,
            insertText: "with BuildPart() as ${1:part}:\n\t${0}",
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: "build123d 3D 实体建造者容器 with BuildPart() as part:",
            range,
          },
          {
            label: "BuildSketch",
            kind: monaco.languages.CompletionItemKind.Class,
            insertText: "with BuildSketch(${1:Plane.XY}) as ${2:sk}:\n\t${0}",
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: "build123d 2D 草图建造者容器 with BuildSketch(Plane.XY):",
            range,
          },
          {
            label: "BuildLine",
            kind: monaco.languages.CompletionItemKind.Class,
            insertText: "with BuildLine() as ${1:ln}:\n\t${0}",
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: "build123d 1D 线框建造者容器 with BuildLine():",
            range,
          },
          {
            label: "Box",
            kind: monaco.languages.CompletionItemKind.Constructor,
            insertText: "Box(${1:20}, ${2:20}, ${3:10})",
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: "创建 3D 长方体 Box(length, width, height)",
            range,
          },
          {
            label: "Cylinder",
            kind: monaco.languages.CompletionItemKind.Constructor,
            insertText: "Cylinder(radius=${1:10}, height=${2:20})",
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: "创建 3D 圆柱体 Cylinder(radius, height)",
            range,
          },
          {
            label: "Sphere",
            kind: monaco.languages.CompletionItemKind.Constructor,
            insertText: "Sphere(radius=${1:10})",
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: "创建 3D 球体 Sphere(radius)",
            range,
          },
          {
            label: "Cone",
            kind: monaco.languages.CompletionItemKind.Constructor,
            insertText: "Cone(bottom_radius=${1:10}, top_radius=${2:5}, height=${3:20})",
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: "创建 3D 圆锥/圆台 Cone(bottom_radius, top_radius, height)",
            range,
          },
          {
            label: "Rectangle",
            kind: monaco.languages.CompletionItemKind.Constructor,
            insertText: "Rectangle(${1:20}, ${2:20})",
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: "草图矩形 Rectangle(width, height)",
            range,
          },
          {
            label: "Circle",
            kind: monaco.languages.CompletionItemKind.Constructor,
            insertText: "Circle(radius=${1:10})",
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: "草图圆形 Circle(radius)",
            range,
          },
          {
            label: "RegularPolygon",
            kind: monaco.languages.CompletionItemKind.Constructor,
            insertText: "RegularPolygon(radius=${1:15}, side_count=${2:6})",
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: "草图正多边形 RegularPolygon(radius, side_count)",
            range,
          },
          {
            label: "extrude",
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: "extrude(amount=${1:10})",
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: "草图拉伸为实体 extrude(amount)",
            range,
          },
          {
            label: "revolve",
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: "revolve(axis=Axis.${1:Z}, revolution_arc=${2:360})",
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: "草图旋转成型 revolve(axis, revolution_arc)",
            range,
          },
          {
            label: "loft",
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: "loft()",
            documentation: "多截面草图放样 loft()",
            range,
          },
          {
            label: "fillet",
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: "fillet(${1:part.edges()}, radius=${2:1.5})",
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: "边缘倒圆角 fillet(edges, radius)",
            range,
          },
          {
            label: "chamfer",
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: "chamfer(${1:part.edges()}, length=${2:1.5})",
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: "边缘倒斜角 chamfer(edges, length)",
            range,
          },
          {
            label: "Hole",
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: "Hole(radius=${1:5}, depth=${2:10})",
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: "开通孔或盲孔 Hole(radius, depth)",
            range,
          },
          {
            label: "offset",
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: "offset(amount=-${1:1.5})",
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: "表面抽壳或薄壁 offset(amount, openings)",
            range,
          },
          {
            label: "split",
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: "split(bisect_by=Plane.${1:XY}, keep=Keep.${2:TOP})",
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: "实体平面分割 cut/split(bisect_by, keep)",
            range,
          },
          {
            label: "Locations",
            kind: monaco.languages.CompletionItemKind.Class,
            insertText: "with Locations((${1:0}, ${2:0}, ${3:10})):\n\t${0}",
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: "空间定位 with Locations(pts):",
            range,
          },
          {
            label: "GridLocations",
            kind: monaco.languages.CompletionItemKind.Class,
            insertText: "with GridLocations(${1:20}, ${2:20}, ${3:2}, ${4:2}):\n\t${0}",
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: "笛卡尔网格阵列 with GridLocations(x_spacing, y_spacing, x_count, y_count):",
            range,
          },
          {
            label: "PolarLocations",
            kind: monaco.languages.CompletionItemKind.Class,
            insertText: "with PolarLocations(radius=${1:20}, count=${2:6}):\n\t${0}",
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: "极坐标圆周均布阵列 with PolarLocations(radius, count):",
            range,
          },
        ];

        return { suggestions: build123dSuggestions };
      },
    });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 搜索处理函数
  const handleFind = (
    query: string,
    matchCase: boolean,
    isRegex: boolean,
    forward: boolean
  ) => {
    if (!editorRef.current || !query) {
      setMatchCount({ current: 0, total: 0 });
      matchesRef.current = [];
      currentMatchIndexRef.current = -1;
      return;
    }
    const model = editorRef.current.getModel();
    if (!model) return;

    try {
      const matches = model.findMatches(query, true, isRegex, matchCase, null, true);
      matchesRef.current = matches;
      if (matches.length === 0) {
        setMatchCount({ current: 0, total: 0 });
        currentMatchIndexRef.current = -1;
        return;
      }

      let nextIdx = forward
        ? (currentMatchIndexRef.current + 1) % matches.length
        : (currentMatchIndexRef.current - 1 + matches.length) % matches.length;

      currentMatchIndexRef.current = nextIdx;
      setMatchCount({ current: nextIdx + 1, total: matches.length });

      const targetMatch = matches[nextIdx];
      editorRef.current.revealRangeInCenter(targetMatch.range);
      editorRef.current.setSelection(targetMatch.range);
    } catch (e) {
      // 捕获无效正则等错误
    }
  };

  // 替换处理函数
  const handleReplace = (query: string, replaceText: string, all: boolean) => {
    if (!editorRef.current || !query) return;
    const model = editorRef.current.getModel();
    if (!model) return;

    if (all) {
      const matches = matchesRef.current;
      if (matches.length === 0) return;
      const edits = matches.map((m) => ({
        range: m.range,
        text: replaceText,
      }));
      editorRef.current.executeEdits("search-replace", edits);
      handleFind(query, false, false, true);
    } else {
      const idx = currentMatchIndexRef.current;
      if (idx >= 0 && idx < matchesRef.current.length) {
        const match = matchesRef.current[idx];
        editorRef.current.executeEdits("search-replace", [
          { range: match.range, text: replaceText },
        ]);
        handleFind(query, false, false, true);
      }
    }
  };

  const isLight = colorMode === "light";

  return (
    <div className={`relative w-full h-full flex flex-col ${isLight ? "bg-white" : "bg-[#0d1117]"} overflow-hidden`}>
      {/* 面板头部工具栏 */}
      <div
        className={`h-9 px-3 flex items-center justify-between ${isLight
            ? "bg-[#f3f4f6] border-b border-[#e5e7eb] text-gray-800"
            : "bg-[#161b22] border-b border-[#30363d] text-gray-300"
          } text-xs font-semibold`}
      >
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
          <span>Python 编辑器 (Monaco)</span>
          {isLocked ? (
            <span
              className={`px-1.5 py-0.5 text-[10px] ${isLight ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-blue-900/50 text-blue-300 border-blue-700/50"
                } border rounded flex items-center gap-1`}
            >
              <Lock size={11} /> 积木同步中
            </span>
          ) : (
            <span
              className={`px-1.5 py-0.5 text-[10px] ${isLight ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-amber-900/50 text-amber-300 border-amber-700/50"
                } border rounded flex items-center gap-1`}
            >
              <Unlock size={11} /> 自由代码模式
            </span>
          )}
        </div>

        <div className="flex items-center space-x-1.5">
          {/* 查找与替换 (Ctrl + F) */}
          <button
            onClick={() => {
              if (isSearchActive) {
                setInternalSearchOpen(false);
                onCloseSearch?.();
              } else {
                setInternalSearchOpen(true);
              }
            }}
            title="查找与替换代码 (Ctrl + F)"
            className={`p-1 rounded transition ${isLight
                ? "text-gray-600 hover:text-gray-900 hover:bg-gray-200"
                : "text-gray-400 hover:text-white hover:bg-[#21262d]"
              } ${isSearchActive
                ? isLight
                  ? "text-amber-600 bg-amber-50 font-bold"
                  : "text-amber-400 bg-[#21262d]"
                : ""
              }`}
          >
            <Search size={14} />
          </button>

          {/* 锁定 / 解锁编辑切换 */}
          <button
            onClick={onToggleLock}
            title={isLocked ? "解锁直接编写代码 (不再受积木强制覆盖)" : "锁定为积木同步模式"}
            className={`px-2 py-1 text-xs rounded flex items-center gap-1 transition ${isLocked
                ? isLight
                  ? "bg-gray-200 text-gray-700 hover:bg-gray-300 font-medium"
                  : "bg-[#21262d] text-gray-300 hover:bg-[#30363d]"
                : "bg-amber-600 text-white hover:bg-amber-500 font-semibold"
              }`}
          >
            {isLocked ? <Unlock size={12} /> : <Lock size={12} />}
            <span>{isLocked ? "解锁代码" : "锁定同步"}</span>
          </button>

          {/* 代码逆向转积木 */}
          {onCodeToBlockly && (
            <button
              onClick={() => onCodeToBlockly(editorRef.current?.getValue() || code)}
              title="将当前 Monaco Python 代码逆向转换为图形化积木"
              className={`px-2 py-1 text-xs rounded flex items-center gap-1 transition shadow-xs ${
                isLight
                  ? "bg-purple-100 text-purple-800 hover:bg-purple-200 border border-purple-200 font-medium"
                  : "bg-purple-900/60 text-purple-200 hover:bg-purple-800/80 border border-purple-700/60 font-medium"
              }`}
            >
              <Boxes size={12} className="text-purple-400" />
              <span>转为积木</span>
            </button>
          )}

          {/* 复制按钮 */}
          <button
            onClick={handleCopy}
            title="复制代码"
            className={`p-1 rounded transition ${isLight
                ? "text-gray-600 hover:text-gray-900 hover:bg-gray-200"
                : "text-gray-400 hover:text-white hover:bg-[#21262d]"
              }`}
          >
            {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
          </button>
        </div>
      </div>

      {/* Monaco 代码编辑区 */}
      <div className="flex-1 min-h-0 w-full relative">
        {/*  浮动查找与替换卡片 */}
        <SearchReplaceWidget
          isOpen={isSearchActive}
          onClose={() => {
            if (onCloseSearch) onCloseSearch();
            setInternalSearchOpen(false);
          }}
          onFind={handleFind}
          onReplace={handleReplace}
          matchCount={matchCount}
        />

        <Editor
          height="100%"
          language="python"
          theme={colorMode === "light" ? "light" : "vs-dark"}
          value={code}
          loading={
            <div
              className={`flex flex-col items-center justify-center h-full w-full text-xs gap-2 select-none ${
                isLight ? "bg-white text-gray-500" : "bg-[#0d1117] text-gray-400"
              }`}
            >
              <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
              <span>正在载入 Monaco 智能代码编辑器 (国内镜像加速)...</span>
            </div>
          }
          onChange={(val) => {
            if (!isLocked && val !== undefined) {
              onChange(val);
            }
          }}
          onMount={handleEditorDidMount}
          options={{
            readOnly: isLocked,
            minimap: { enabled: false },
            fontSize: 13,
            lineNumbers: "on",
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 4,
            insertSpaces: true,
            wordWrap: "on",
            renderWhitespace: "selection",
            suggestOnTriggerCharacters: true,
            guides: { indentation: indentGuides },
            padding: { top: 8, bottom: 8 },
          }}
        />
      </div>
    </div>
  );
};
