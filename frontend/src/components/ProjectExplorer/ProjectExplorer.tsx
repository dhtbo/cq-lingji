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
  MoreVertical,
  Check,
  X,
  Plus,
} from "lucide-react";
import { ProjectFileNode, ProjectWorkspace, NodeType } from "@/types/project";
import { normalizePath } from "@/lib/projectTree";

interface ProjectExplorerProps {
  workspace: ProjectWorkspace;
  onSelectFile: (path: string) => void;
  onAddNode: (parentPath: string, name: string, type: NodeType) => void;
  onDeleteNode: (path: string) => void;
  onRenameNode: (oldPath: string, newName: string) => void;
  onSetEntrypoint: (path: string) => void;
  onExportProject: () => void;
  onImportProject: (file: File) => void;
  isOpen: boolean;
  onToggleOpen: () => void;
}

export function ProjectExplorer({
  workspace,
  onSelectFile,
  onAddNode,
  onDeleteNode,
  onRenameNode,
  onSetEntrypoint,
  onExportProject,
  onImportProject,
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
  // 文件上传 input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    // 确保父目录处于展开状态
    setExpandedPaths((prev) => new Set(prev).add(parentPath));
  };

  const confirmCreate = () => {
    if (creatingIn && creatingName.trim()) {
      let finalName = creatingName.trim();
      if (creatingIn.type === "file" && !finalName.endsWith(".py")) {
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
        {/* 当前节点展示栏 (根节点跳过渲染行，直接渲染子集或根栏) */}
        {!isRoot && (
          <div
            style={{ paddingLeft: `${depth * 14 + 6}px` }}
            className={`group relative flex items-center gap-1.5 py-1 pr-2 rounded hover:bg-slate-800/80 cursor-pointer transition-colors ${
              isSelected ? "bg-blue-900/40 text-blue-300 font-medium border-l-2 border-blue-500" : "text-slate-300"
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
                className="p-0.5 hover:text-white text-slate-400"
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

            {/* 图标 */}
            {isDir ? (
              isExpanded ? (
                <FolderOpen className="w-4 h-4 text-amber-400 shrink-0" />
              ) : (
                <Folder className="w-4 h-4 text-amber-400 shrink-0" />
              )
            ) : (
              <FileCode className={`w-4 h-4 shrink-0 ${isEntry ? "text-emerald-400" : "text-sky-400"}`} />
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
                  className="bg-slate-950 border border-blue-500 text-white px-1 py-0.5 rounded text-xs w-full outline-none"
                />
                <button
                  onClick={confirmRename}
                  className="p-0.5 hover:bg-slate-700 text-emerald-400 rounded"
                  title="确认重命名"
                >
                  <Check className="w-3 h-3" />
                </button>
                <button
                  onClick={cancelRename}
                  className="p-0.5 hover:bg-slate-700 text-rose-400 rounded"
                  title="取消"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <span className="truncate grow flex items-center gap-1.5" title={node.path}>
                {node.name}
                {isEntry && (
                  <span
                    className="px-1 py-0.2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded text-[9px] font-mono leading-none tracking-tight shrink-0"
                    title="主执行入口脚本"
                  >
                    MAIN
                  </span>
                )}
              </span>
            )}

            {/* 快捷悬浮操作按钮组 */}
            {!isRenaming && (
              <div
                className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 shrink-0 transition-opacity bg-slate-900/90 px-1 py-0.5 rounded shadow"
                onClick={(e) => e.stopPropagation()}
              >
                {isDir && (
                  <>
                    <button
                      onClick={() => startCreate(node.path, "file")}
                      className="p-1 hover:text-white text-slate-400 hover:bg-slate-700 rounded"
                      title="在此目录下新建文件"
                    >
                      <FilePlus className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => startCreate(node.path, "directory")}
                      className="p-1 hover:text-white text-slate-400 hover:bg-slate-700 rounded"
                      title="在此目录下新建文件夹"
                    >
                      <FolderPlus className="w-3 h-3" />
                    </button>
                  </>
                )}

                {!isDir && !isEntry && (
                  <button
                    onClick={() => onSetEntrypoint(node.path)}
                    className="p-1 hover:text-emerald-400 text-slate-400 hover:bg-slate-700 rounded"
                    title="设为主执行入口 (main entrypoint)"
                  >
                    <Play className="w-3 h-3" />
                  </button>
                )}

                <button
                  onClick={() => startRename(node.path, node.name)}
                  className="p-1 hover:text-amber-400 text-slate-400 hover:bg-slate-700 rounded"
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
                  className="p-1 hover:text-rose-400 text-slate-400 hover:bg-slate-700 rounded"
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
                  <FileCode className="w-4 h-4 text-sky-400 shrink-0" />
                ) : (
                  <Folder className="w-4 h-4 text-amber-400 shrink-0" />
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
                  className="bg-slate-950 border border-blue-500 text-white px-1 py-0.5 rounded text-xs grow outline-none"
                  placeholder={creatingIn.type === "file" ? "文件名.py" : "文件夹名"}
                />
                <button
                  onClick={confirmCreate}
                  className="p-0.5 hover:bg-slate-700 text-emerald-400 rounded"
                  title="确认"
                >
                  <Check className="w-3 h-3" />
                </button>
                <button
                  onClick={cancelCreate}
                  className="p-0.5 hover:bg-slate-700 text-rose-400 rounded"
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
                  // 文件夹排在前面，同类型按名称字母排序
                  if (a.type !== b.type) return a.type === "directory" ? -1 : 1;
                  return a.name.localeCompare(b.name);
                })
                .map((child) => renderNode(child, isRoot ? 0 : depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={`flex flex-col h-full bg-slate-900 border-r border-slate-800 transition-all duration-200 ${
        isOpen ? "w-64" : "w-10"
      }`}
    >
      {/* 侧栏顶栏 */}
      <div className="flex items-center justify-between px-2.5 py-2 border-b border-slate-800 bg-slate-950/60 shrink-0">
        {isOpen ? (
          <>
            <div className="flex items-center gap-1.5 truncate">
              <span className="text-xs font-semibold text-slate-200 truncate" title={workspace.name}>
                {workspace.name || "CAD 项目资源"}
              </span>
            </div>
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => startCreate("", "file")}
                className="p-1 hover:text-white text-slate-400 hover:bg-slate-800 rounded transition-colors"
                title="新建根目录文件"
              >
                <FilePlus className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => startCreate("", "directory")}
                className="p-1 hover:text-white text-slate-400 hover:bg-slate-800 rounded transition-colors"
                title="新建根目录文件夹"
              >
                <FolderPlus className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onExportProject}
                className="p-1 hover:text-white text-slate-400 hover:bg-slate-800 rounded transition-colors"
                title="导出项目工程 (.cqproj.json)"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-1 hover:text-white text-slate-400 hover:bg-slate-800 rounded transition-colors"
                title="导入项目或脚本 (.cqproj.json, .py)"
              >
                <Upload className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onToggleOpen}
                className="p-1 hover:text-white text-slate-400 hover:bg-slate-800 rounded transition-colors ml-1"
                title="收起资源管理器"
              >
                <ChevronRight className="w-3.5 h-3.5 rotate-180" />
              </button>
            </div>
          </>
        ) : (
          <button
            onClick={onToggleOpen}
            className="w-full flex justify-center py-1 hover:text-white text-slate-400 rounded transition-colors"
            title="展开项目资源管理器"
          >
            <Folder className="w-4 h-4 text-amber-400" />
          </button>
        )}
      </div>

      {/* 隐藏的上传 input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            onImportProject(file);
          }
          if (e.target) e.target.value = "";
        }}
        accept=".json,.cqproj.json,.cq.json,.py"
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
 * 顶部标签栏组件 (Editor Tabs)
 */
interface EditorTabsProps {
  workspace: ProjectWorkspace;
  onSelectFile: (path: string) => void;
  onCloseFile: (path: string) => void;
}

export function EditorTabs({ workspace, onSelectFile, onCloseFile }: EditorTabsProps) {
  return (
    <div className="flex items-center bg-slate-950 border-b border-slate-800 overflow-x-auto no-scrollbar select-none shrink-0 h-9">
      {workspace.openFiles.map((path) => {
        const isActive = workspace.activeFilePath === path;
        const isEntry = workspace.entrypoint === path;
        const fileName = path.split("/").pop() || path;

        return (
          <div
            key={path}
            onClick={() => onSelectFile(path)}
            className={`group flex items-center gap-1.5 px-3 py-1.5 text-xs border-r border-slate-800/80 cursor-pointer transition-colors max-w-[160px] ${
              isActive
                ? "bg-slate-900 text-sky-400 border-t-2 border-t-sky-500 font-medium"
                : "bg-slate-950/80 text-slate-400 hover:bg-slate-900/60 hover:text-slate-200"
            }`}
            title={path}
          >
            <FileCode className={`w-3.5 h-3.5 shrink-0 ${isEntry ? "text-emerald-400" : "text-sky-400"}`} />
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
                className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-slate-800 hover:text-rose-400 rounded transition-opacity"
                title="关闭"
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
