"use client";

import React, { useState, useRef } from "react";
import {
  Folder,
  FolderOpen,
  FileCode,
  FilePlus,
  FolderPlus,
  Trash2,
  Edit2,
  Play,
  ChevronRight,
  ChevronDown,
  Upload,
  Download,
  Check,
  X,
  Box,
  Image,
  Compass,
  FileJson,
  FileText,
  UploadCloud,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { ProjectFileNode, ProjectWorkspace, NodeType } from "@/types/project";
import { normalizePath } from "@/lib/projectTree";

interface ProjectExplorerProps {
  workspace: ProjectWorkspace;
  isLightMode?: boolean;
  onSelectFile: (path: string) => void;
  onAddNode: (parentPath: string, name: string, type: NodeType, initialContent?: string, isBinary?: boolean, fileSize?: number) => void;
  onDeleteNode: (path: string) => void;
  onRenameNode: (oldPath: string, newName: string) => void;
  onSetEntrypoint: (path: string) => void;
  onExportProject: () => void;
  onImportProject: (file: File) => void;
  onImportFiles?: (targetParentPath: string, files: File[]) => void;
  isOpen: boolean;
  onToggleOpen: () => void;
}

/**
 * 根据文件类型获取专属彩色图标
 */
function getFileIcon(fileName: string, isEntry: boolean, isLight: boolean) {
  if (isEntry) {
    return <FileCode className="w-4 h-4 shrink-0 text-emerald-500" />;
  }
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  if (ext === "py") {
    return <FileCode className={`w-4 h-4 shrink-0 ${isLight ? "text-emerald-600" : "text-emerald-400"}`} />;
  }
  if (ext === "stl" || ext === "step" || ext === "stp" || ext === "brep") {
    return <Box className="w-4 h-4 shrink-0 text-violet-500" />;
  }
  if (ext === "svg") {
    return <Image className="w-4 h-4 shrink-0 text-amber-500" />;
  }
  if (ext === "dxf") {
    return <Compass className="w-4 h-4 shrink-0 text-cyan-500" />;
  }
  if (ext === "json") {
    return <FileJson className="w-4 h-4 shrink-0 text-sky-500" />;
  }
  return <FileText className={`w-4 h-4 shrink-0 ${isLight ? "text-slate-500" : "text-slate-400"}`} />;
}

export function ProjectExplorer({
  workspace,
  isLightMode = false,
  onSelectFile,
  onAddNode,
  onDeleteNode,
  onRenameNode,
  onSetEntrypoint,
  onExportProject,
  onImportProject,
  onImportFiles,
  isOpen,
  onToggleOpen,
}: ProjectExplorerProps) {
  // 折叠与展开的目录路径集合
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set([""]));
  // 正在内联创建新节点的上下文：{ parentPath: string, type: NodeType }
  const [creatingIn, setCreatingIn] = useState<{ parentPath: string; type: NodeType } | null>(null);
  const [creatingName, setCreatingName] = useState("");
  // 正在重命名的节点路径
  const [renamingPath, setRenamingPath] = useState<string | null>(null);
  const [renamingName, setRenamingName] = useState("");
  // 导入工程存档 input ref (.cqproj.json)
  const projectArchiveInputRef = useRef<HTMLInputElement>(null);
  // 导入通用本地文件 input ref (stl, step, svg, dxf, py, json...)
  const localFilesInputRef = useRef<HTMLInputElement>(null);
  // 当前待导入本地文件的目标目录相对路径
  const [uploadTargetParent, setUploadTargetParent] = useState<string>("");

  const toggleExpand = (path: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const startCreate = (parentPath: string, type: NodeType) => {
    setCreatingIn({ parentPath, type });
    setCreatingName(type === "file" ? "new_part.py" : "new_folder");
    setExpandedPaths((prev) => new Set(prev).add(parentPath));
  };

  const confirmCreate = () => {
    if (creatingIn && creatingName.trim()) {
      let finalName = creatingName.trim();
      if (creatingIn.type === "file" && !finalName.includes(".")) {
        finalName += ".py";
      }
      onAddNode(creatingIn.parentPath, finalName, creatingIn.type);
    }
    setCreatingIn(null);
    setCreatingName("");
  };

  const cancelCreate = () => {
    setCreatingIn(null);
    setCreatingName("");
  };

  const startRename = (path: string, currentName: string) => {
    setRenamingPath(path);
    setRenamingName(currentName);
  };

  const confirmRename = () => {
    if (renamingPath && renamingName.trim()) {
      onRenameNode(renamingPath, renamingName.trim());
    }
    setRenamingPath(null);
    setRenamingName("");
  };

  const cancelRename = () => {
    setRenamingPath(null);
    setRenamingName("");
  };

  // 触发选择本地文件上传
  const triggerImportLocalFiles = (targetDir: string) => {
    setUploadTargetParent(targetDir);
    setExpandedPaths((prev) => new Set(prev).add(targetDir));
    if (localFilesInputRef.current) {
      localFilesInputRef.current.value = "";
      localFilesInputRef.current.click();
    }
  };

  // 处理本地文件读取与导入
  const handleLocalFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (onImportFiles) {
      onImportFiles(uploadTargetParent, Array.from(files));
    } else {
      // 默认解析并写入节点
      Array.from(files).forEach((file) => {
        const ext = file.name.split(".").pop()?.toLowerCase() || "";
        const isBin = ["stl", "step", "stp", "brep"].includes(ext);

        const reader = new FileReader();
        if (isBin) {
          reader.readAsDataURL(file);
          reader.onload = () => {
            const dataUrl = reader.result as string;
            onAddNode(uploadTargetParent, file.name, "file", dataUrl, true, file.size);
          };
        } else {
          reader.readAsText(file, "utf-8");
          reader.onload = () => {
            const textContent = reader.result as string;
            onAddNode(uploadTargetParent, file.name, "file", textContent, false, file.size);
          };
        }
      });
    }
  };

  // 递归渲染树节点
  const renderNode = (node: ProjectFileNode, depth: number = 0) => {
    const isRoot = node.path === "";
    const isDir = node.type === "directory";
    const isExpanded = isRoot || expandedPaths.has(node.path);
    const isSelected = !isDir && workspace.activeFilePath === node.path;
    const isEntry = !isDir && workspace.entrypoint === node.path;
    const isRenaming = renamingPath === node.path;

    return (
      <div key={node.path || "root"} className="select-none text-xs">
        {/* 当前节点展示栏 (根节点跳过渲染行) */}
        {!isRoot && (
          <div
            style={{ paddingLeft: `${depth * 14 + 6}px` }}
            className={`group relative flex items-center gap-1.5 py-1 pr-2 rounded cursor-pointer transition-colors ${
              isSelected
                ? isLightMode
                  ? "bg-emerald-50 text-emerald-700 font-semibold border-l-2 border-emerald-500 shadow-xs"
                  : "bg-emerald-950/40 text-emerald-300 font-medium border-l-2 border-emerald-500"
                : isLightMode
                ? "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
            }`}
            onClick={() => {
              if (isDir) {
                toggleExpand(node.path);
              } else {
                onSelectFile(node.path);
              }
            }}
          >
            {/* 展开/折叠箭头 */}
            {isDir ? (
              <span
                className={`p-0.5 rounded transition-colors ${
                  isLightMode ? "hover:text-slate-900 text-slate-400" : "hover:text-white text-slate-400"
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpand(node.path);
                }}
              >
                {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </span>
            ) : (
              <span className="w-3.5 h-3.5 flex items-center justify-center opacity-0" />
            )}

            {/* 图标 (智能识别 STL, STEP, SVG, DXF, PY, JSON) */}
            {isDir ? (
              isExpanded ? (
                <FolderOpen className="w-4 h-4 text-amber-500 shrink-0" />
              ) : (
                <Folder className="w-4 h-4 text-amber-500 shrink-0" />
              )
            ) : (
              getFileIcon(node.name, isEntry, isLightMode)
            )}

            {/* 节点名称 或 重命名输入框 */}
            {isRenaming ? (
              <div
                className="flex items-center gap-1 grow"
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="text"
                  value={renamingName}
                  autoFocus
                  onChange={(e) => setRenamingName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") confirmRename();
                    if (e.key === "Escape") cancelRename();
                  }}
                  className={`px-1 py-0.5 rounded text-xs w-full outline-none border ${
                    isLightMode
                      ? "bg-white border-emerald-500 text-slate-900 shadow-xs"
                      : "bg-slate-950 border-emerald-500 text-white"
                  }`}
                />
                <button
                  onClick={confirmRename}
                  className="p-0.5 hover:bg-emerald-500/20 text-emerald-500 rounded"
                  title="确认重命名"
                >
                  <Check className="w-3 h-3" />
                </button>
                <button
                  onClick={cancelRename}
                  className="p-0.5 hover:bg-rose-500/20 text-rose-500 rounded"
                  title="取消"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <span className="truncate grow flex items-center gap-1.5" title={node.path}>
                <span className="truncate">{node.name}</span>
                {isEntry && (
                  <span
                    className={`px-1 py-0.2 rounded text-[9px] font-mono leading-none tracking-tight shrink-0 font-semibold border ${
                      isLightMode
                        ? "bg-emerald-100 text-emerald-700 border-emerald-400"
                        : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                    }`}
                    title="主执行入口脚本"
                  >
                    MAIN
                  </span>
                )}
                {node.isBinary && (
                  <span
                    className={`px-1 py-0.2 rounded text-[8px] font-mono leading-none tracking-tight shrink-0 border ${
                      isLightMode
                        ? "bg-violet-100 text-violet-700 border-violet-300"
                        : "bg-violet-500/20 text-violet-300 border-violet-500/30"
                    }`}
                    title="三维二进制资产"
                  >
                    3D
                  </span>
                )}
              </span>
            )}

            {/* 快捷悬浮操作按钮组 */}
            {!isRenaming && (
              <div
                className={`opacity-0 group-hover:opacity-100 flex items-center gap-0.5 shrink-0 transition-opacity px-1 py-0.5 rounded shadow-sm ${
                  isLightMode ? "bg-white border border-slate-200" : "bg-slate-900/90 border border-slate-700/60"
                }`}
                onClick={(e) => e.stopPropagation()}
              >
                {isDir && (
                  <>
                    <button
                      onClick={() => startCreate(node.path, "file")}
                      className={`p-1 rounded ${
                        isLightMode
                          ? "hover:text-emerald-700 text-slate-500 hover:bg-slate-100"
                          : "hover:text-emerald-400 text-slate-400 hover:bg-slate-800"
                      }`}
                      title="在此目录下新建脚本文件"
                    >
                      <FilePlus className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => startCreate(node.path, "directory")}
                      className={`p-1 rounded ${
                        isLightMode
                          ? "hover:text-amber-700 text-slate-500 hover:bg-slate-100"
                          : "hover:text-amber-400 text-slate-400 hover:bg-slate-800"
                      }`}
                      title="在此目录下新建子文件夹"
                    >
                      <FolderPlus className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => triggerImportLocalFiles(node.path)}
                      className={`p-1 rounded ${
                        isLightMode
                          ? "hover:text-violet-700 text-slate-500 hover:bg-slate-100"
                          : "hover:text-violet-400 text-slate-400 hover:bg-slate-800"
                      }`}
                      title="导入本地文件到此目录 (STL, STEP, SVG, DXF, PY)"
                    >
                      <UploadCloud className="w-3 h-3" />
                    </button>
                  </>
                )}

                {!isDir && !isEntry && (
                  <button
                    onClick={() => onSetEntrypoint(node.path)}
                    className={`p-1 rounded ${
                      isLightMode
                        ? "hover:text-emerald-700 text-slate-500 hover:bg-slate-100"
                        : "hover:text-emerald-400 text-slate-400 hover:bg-slate-800"
                    }`}
                    title="设为主执行入口 (main entrypoint)"
                  >
                    <Play className="w-3 h-3" />
                  </button>
                )}

                <button
                  onClick={() => startRename(node.path, node.name)}
                  className={`p-1 rounded ${
                    isLightMode
                      ? "hover:text-amber-700 text-slate-500 hover:bg-slate-100"
                      : "hover:text-amber-400 text-slate-400 hover:bg-slate-800"
                  }`}
                  title="重命名"
                >
                  <Edit2 className="w-3 h-3" />
                </button>

                <button
                  onClick={() => {
                    if (confirm(`确定删除 ${node.name} 吗？`)) {
                      onDeleteNode(node.path);
                    }
                  }}
                  className={`p-1 rounded ${
                    isLightMode
                      ? "hover:text-rose-700 text-slate-500 hover:bg-slate-100"
                      : "hover:text-rose-400 text-slate-400 hover:bg-slate-800"
                  }`}
                  title="删除"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* 目录子节点 */}
        {isDir && isExpanded && (
          <div>
            {/* 正在该目录下创建新节点 */}
            {creatingIn?.parentPath === node.path && (
              <div
                style={{ paddingLeft: `${(depth + 1) * 14 + 6}px` }}
                className="flex items-center gap-1 py-1 pr-2 text-xs"
              >
                {creatingIn.type === "file" ? (
                  <FileCode className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : (
                  <Folder className="w-4 h-4 text-amber-500 shrink-0" />
                )}
                <input
                  type="text"
                  value={creatingName}
                  autoFocus
                  onChange={(e) => setCreatingName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") confirmCreate();
                    if (e.key === "Escape") cancelCreate();
                  }}
                  className={`px-1 py-0.5 rounded text-xs grow outline-none border ${
                    isLightMode
                      ? "bg-white border-emerald-500 text-slate-800 shadow-xs"
                      : "bg-slate-950 border-emerald-500 text-white"
                  }`}
                  placeholder={creatingIn.type === "file" ? "文件名.py" : "文件夹名"}
                />
                <button
                  onClick={confirmCreate}
                  className="p-0.5 hover:bg-emerald-500/20 text-emerald-500 rounded"
                  title="确认"
                >
                  <Check className="w-3 h-3" />
                </button>
                <button
                  onClick={cancelCreate}
                  className="p-0.5 hover:bg-rose-500/20 text-rose-500 rounded"
                  title="取消"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            {node.children &&
              node.children
                .slice()
                .sort((a, b) => {
                  if (a.type !== b.type) return a.type === "directory" ? -1 : 1;
                  return a.name.localeCompare(b.name);
                })
                .map((child) => renderNode(child, isRoot ? 0 : depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className={`flex flex-col h-full w-full transition-all duration-200 ${
        isLightMode
          ? "bg-[#ffffff] border-r border-slate-200 text-slate-700"
          : "bg-slate-900 border-r border-slate-800 text-slate-300"
      }`}
    >
      {/* 侧栏顶栏（收起/展开按钮已移至右侧分割线居中位置） */}
      <div
        className={`flex items-center justify-between px-2.5 py-2 border-b shrink-0 h-9 ${
          isLightMode ? "bg-slate-50 border-slate-200" : "bg-slate-950/70 border-slate-800"
        }`}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <FolderOpen className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span className="text-[11px] font-semibold text-slate-400 select-none truncate">
            文件管理器
          </span>
        </div>
        <div className="flex items-center gap-0.5">
          {/* 新建根目录文件 */}
          <button
            onClick={() => startCreate("", "file")}
            className={`p-1 rounded transition-colors ${
              isLightMode
                ? "hover:text-emerald-700 text-slate-500 hover:bg-slate-200"
                : "hover:text-white text-slate-400 hover:bg-slate-800"
            }`}
            title="新建根目录文件"
          >
            <FilePlus className="w-3.5 h-3.5" />
          </button>
          {/* 新建根目录文件夹 */}
          <button
            onClick={() => startCreate("", "directory")}
            className={`p-1 rounded transition-colors ${
              isLightMode
                ? "hover:text-amber-700 text-slate-500 hover:bg-slate-200"
                : "hover:text-white text-slate-400 hover:bg-slate-800"
            }`}
            title="新建根目录文件夹"
          >
            <FolderPlus className="w-3.5 h-3.5" />
          </button>
          {/* 导入本地文件 (STL, STEP, SVG, DXF, PY等) */}
          <button
            onClick={() => triggerImportLocalFiles("")}
            className={`p-1 rounded transition-colors ${
              isLightMode
                ? "hover:text-emerald-700 text-slate-500 hover:bg-slate-200"
                : "hover:text-emerald-400 text-slate-400 hover:bg-slate-800"
            }`}
            title="导入本地文件 (STL, STEP, SVG, DXF, PY, JSON 等)"
          >
            <UploadCloud className="w-3.5 h-3.5" />
          </button>
          {/* 导出项目工程 */}
          <button
            onClick={onExportProject}
            className={`p-1 rounded transition-colors ${
              isLightMode
                ? "hover:text-sky-700 text-slate-500 hover:bg-slate-200"
                : "hover:text-white text-slate-400 hover:bg-slate-800"
            }`}
            title="导出工程文件 (.cqproj.json)"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          {/* 导入项目工程 */}
          <button
            onClick={() => projectArchiveInputRef.current?.click()}
            className={`p-1 rounded transition-colors ${
              isLightMode
                ? "hover:text-slate-900 text-slate-500 hover:bg-slate-200"
                : "hover:text-white text-slate-400 hover:bg-slate-800"
            }`}
            title="打开工程存档 (.cqproj.json)"
          >
            <Upload className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 隐藏的工程存档上传 input */}
      <input
        type="file"
        ref={projectArchiveInputRef}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            onImportProject(file);
          }
          if (e.target) e.target.value = "";
        }}
        accept=".json,.cqproj.json,.cq.json"
        className="hidden"
      />

      {/* 隐藏的本地多文件上传 input (STL, STEP, SVG, DXF, PY, JSON等) */}
      <input
        type="file"
        ref={localFilesInputRef}
        onChange={handleLocalFilesSelected}
        multiple
        accept=".stl,.step,.stp,.brep,.svg,.dxf,.py,.json,.txt"
        className="hidden"
      />

      {/* 文件树内容区 */}
      {isOpen && (
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-1.5 custom-scrollbar">
          {renderNode(workspace.root, 0)}
        </div>
      )}
    </div>
  );
}

/**
 * 顶部标签栏组件 (Editor Tabs) - 默认高亮翠石绿，适配白天/黑夜模式
 */
interface EditorTabsProps {
  workspace: ProjectWorkspace;
  isLightMode?: boolean;
  onSelectFile: (path: string) => void;
  onCloseFile: (path: string) => void;
}

export function EditorTabs({ workspace, isLightMode = false, onSelectFile, onCloseFile }: EditorTabsProps) {
  return (
    <div
      className={`flex items-center overflow-x-auto no-scrollbar select-none shrink-0 h-9 border-b ${
        isLightMode
          ? "bg-slate-100/90 border-slate-200"
          : "bg-slate-950 border-slate-800"
      }`}
    >
      {workspace.openFiles.map((path) => {
        const isActive = workspace.activeFilePath === path;
        const isEntry = workspace.entrypoint === path;
        const fileName = path.split("/").pop() || path;

        return (
          <div
            key={path}
            onClick={() => onSelectFile(path)}
            className={`group flex items-center gap-1.5 px-3 py-1.5 text-xs cursor-pointer transition-colors max-w-[160px] border-r ${
              isLightMode
                ? isActive
                  ? "bg-white text-emerald-600 border-t-2 border-t-emerald-500 font-semibold border-r-slate-200 shadow-xs"
                  : "bg-transparent text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 border-r-slate-200/80"
                : isActive
                ? "bg-slate-900 text-emerald-400 border-t-2 border-t-emerald-500 font-medium border-r-slate-800"
                : "bg-transparent text-slate-400 hover:bg-slate-900/60 hover:text-slate-200 border-r-slate-800/80"
            }`}
            title={path}
          >
            {getFileIcon(fileName, isEntry, isLightMode)}
            <span className="truncate">{fileName}</span>
            {isEntry && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" title="主入口" />
            )}
            {workspace.openFiles.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseFile(path);
                }}
                className={`opacity-0 group-hover:opacity-100 p-0.5 rounded transition-opacity ${
                  isLightMode
                    ? "hover:bg-slate-200 hover:text-rose-600"
                    : "hover:bg-slate-800 hover:text-rose-400"
                }`}
                title="关闭标签"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
