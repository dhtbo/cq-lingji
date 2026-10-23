"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  FolderPlus,
  FolderOpen,
  Box,
  Clock,
  Trash2,
  Sparkles,
  ArrowRight,
  FileCode,
  X,
} from "lucide-react";
import { ProjectMetadata, listAllProjectFolders, deleteWorkspaceFolder } from "@/lib/projectStorage";

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNewProject: (projectName: string) => void;
  onOpenLocalFile: () => void;
  onOpenRecentProject: (projectId: string) => void;
  themeColor?: string;
  isLightMode?: boolean;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({
  isOpen,
  onClose,
  onNewProject,
  onOpenLocalFile,
  onOpenRecentProject,
  themeColor = "#FF8C1A",
  isLightMode = false,
}) => {
  const [newProjName, setNewProjName] = useState("我的3D作品");
  const [isCreating, setIsCreating] = useState(false);
  const [recentProjects, setRecentProjects] = useState<ProjectMetadata[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setRecentProjects(listAllProjectFolders());
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          onClose();
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCreateSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const name = newProjName.trim() || "我的3D作品";
    onNewProject(name);
    onClose();
  };

  const handleDeleteRecent = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteWorkspaceFolder(id);
    setRecentProjects(listAllProjectFolders());
  };

  const formatDate = (timestamp: number) => {
    const diffSec = Math.floor((Date.now() - timestamp) / 1000);
    if (diffSec < 60) return "刚刚";
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)} 分钟前`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} 小时前`;
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200 select-none">
      <div
        className={`relative w-[640px] max-w-full rounded-2xl border shadow-2xl overflow-hidden flex flex-col ${
          isLightMode
            ? "bg-white border-gray-200 text-gray-800"
            : "bg-[#161b22] border-[#30363d] text-gray-100"
        } animate-in zoom-in-95 duration-200`}
      >
        {/* 顶部彩色装饰光效与关闭按钮 */}
        <div
          className="h-2 w-full"
          style={{ backgroundColor: themeColor }}
        />
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-200 hover:bg-white/10 rounded-lg transition"
          title="关闭"
        >
          <X size={18} />
        </button>

        {/* 头部标题区 */}
        <div className="px-8 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg"
              style={{ backgroundColor: themeColor }}
            >
              <Box size={26} className="stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <span>欢迎使用 LogoUp 3D</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-mono">
                  B-Rep & Turtle
                </span>
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                面向创客与青少年的三维数字几何建模与积木编程工作台
              </p>
            </div>
          </div>
        </div>

        {/* 核心两大主卡片 */}
        <div className="px-8 py-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* 卡片 1: 新建项目 */}
          <div
            className={`p-5 rounded-xl border transition-all duration-200 flex flex-col justify-between ${
              isLightMode
                ? "bg-amber-50/50 hover:bg-amber-50 border-amber-200/80"
                : "bg-[#21262d]/70 hover:bg-[#21262d] border-[#30363d] hover:border-amber-500/50"
            }`}
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center mb-3">
                <FolderPlus size={22} />
              </div>
              <h3 className="font-bold text-sm mb-1 text-amber-400 flex items-center gap-1.5">
                <span>新建 3D 项目</span>
                <Sparkles size={14} />
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed mb-3">
                创建空白项目文件夹，开启全新三维积木与代码创作。
              </p>

              {isCreating ? (
                <form onSubmit={handleCreateSubmit} className="space-y-2 mt-2">
                  <input
                    ref={inputRef}
                    autoFocus
                    type="text"
                    value={newProjName}
                    onChange={(e) => setNewProjName(e.target.value)}
                    placeholder="输入项目名称..."
                    className="w-full px-2.5 py-1.5 bg-[#0d1117] border border-[#30363d] rounded-lg text-xs text-gray-100 focus:outline-none focus:border-amber-500"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      className="flex-1 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold transition shadow-sm"
                    >
                      立即创建
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCreating(false)}
                      className="px-2.5 py-1.5 bg-gray-700/60 hover:bg-gray-700 text-gray-300 rounded-lg text-xs transition"
                    >
                      取消
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setIsCreating(true)}
                  className="w-full mt-1 py-2 px-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-sm active:scale-98"
                >
                  <span>开始新建</span>
                  <ArrowRight size={14} />
                </button>
              )}
            </div>
          </div>

          {/* 卡片 2: 打开本地项目文件夹 */}
          <div
            onClick={onOpenLocalFile}
            className={`p-5 rounded-xl border transition-all duration-200 flex flex-col justify-between cursor-pointer ${
              isLightMode
                ? "bg-blue-50/50 hover:bg-blue-50 border-blue-200/80"
                : "bg-[#21262d]/70 hover:bg-[#21262d] border-[#30363d] hover:border-blue-500/50"
            }`}
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center mb-3">
                <FolderOpen size={22} />
              </div>
              <h3 className="font-bold text-sm mb-1 text-blue-400 flex items-center gap-1.5">
                <span>打开本地项目文件夹</span>
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed mb-3">
                选择本地磁盘的工程文件夹，或载入 .py 源码与 .json 存档。
              </p>
            </div>

            <button className="w-full mt-1 py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-sm active:scale-98">
              <span>选择本地工程...</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* 最近本地暂存项目列表 */}
        <div className="px-8 pt-4 pb-6">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-400 mb-2">
            <span className="flex items-center gap-1.5">
              <Clock size={13} />
              <span>最近本地暂存的项目</span>
            </span>
            {recentProjects.length > 0 && (
              <span className="text-[11px] text-gray-500 font-mono">
                {recentProjects.length} 个本地暂存
              </span>
            )}
          </div>

          {recentProjects.length === 0 ? (
            <div className="py-5 text-center text-xs text-gray-500 border border-dashed border-[#30363d] rounded-xl">
              暂无本地暂存工程，点击上方卡片创建或打开项目
            </div>
          ) : (
            <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 divide-y divide-[#30363d]/30">
              {recentProjects.slice(0, 5).map((proj) => (
                <div
                  key={proj.id}
                  onClick={() => {
                    onOpenRecentProject(proj.id);
                    onClose();
                  }}
                  className={`group p-2.5 rounded-xl flex items-center justify-between transition cursor-pointer ${
                    isLightMode ? "hover:bg-gray-100" : "hover:bg-[#21262d]"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileCode size={16} className="text-amber-500 shrink-0" />
                    <div className="truncate">
                      <div className="font-semibold text-xs text-gray-200 group-hover:text-amber-400 transition truncate">
                        {proj.name}
                      </div>
                      <div className="text-[10px] text-gray-500 font-mono">
                        {proj.filesCount ? `${proj.filesCount} 文件 · ` : ""}
                        最后修改: {formatDate(proj.updatedAt)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={(e) => handleDeleteRecent(e, proj.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-gray-500 hover:text-red-400 transition rounded"
                      title="清理删除该工程本地缓存"
                    >
                      <Trash2 size={13} />
                    </button>
                    <span className="text-[11px] text-amber-500 group-hover:translate-x-0.5 transition font-semibold flex items-center">
                      打开
                      <ArrowRight size={12} className="ml-0.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
