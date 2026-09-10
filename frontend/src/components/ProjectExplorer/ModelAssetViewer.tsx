"use client";

import React, { useState } from "react";
import {
  Box,
  Image as ImageIcon,
  Copy,
  Check,
  RotateCw,
  Download,
  AlertCircle,
  Eye,
  Layers,
  Code2,
  Sparkles,
  Compass,
} from "lucide-react";

interface ModelAssetViewerProps {
  /** 当前文件相对路径 */
  filePath: string;
  /** 文件名 */
  fileName: string;
  /** 文件内容 (字符串或 Base64 Data URL) */
  fileContent: string;
  /** 是否为二进制文件 */
  isBinary?: boolean;
  /** 文件字节大小 */
  fileSize?: number;
  /** 是否白天模式 */
  isLightMode?: boolean;
  /** 3D 视口网格加载中状态 */
  loading?: boolean;
  /** 错误信息 */
  errorMessage?: string | null;
  /** 刷新/重新解析回调 */
  onReload?: () => void;
}

/**
 * 格式化文件大小为可读字符串
 * @param bytes 字节数
 * @returns 格式化大小
 */
function formatFileSize(bytes?: number): string {
  if (bytes === undefined || bytes === null || bytes === 0) return "未知大小";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * 根据模型扩展名生成对应的 build123d 引入代码片段
 * @param fileName 文件名
 * @returns Python 代码示例
 */
function generateImportSnippet(fileName: string): string {
  const ext = fileName.slice(fileName.lastIndexOf(".")).toLowerCase();
  switch (ext) {
    case ".step":
    case ".stp":
      return `# -*- coding: utf-8 -*-\nfrom build123d import *\n\n# 导入工程内的 STEP 工业模型文件\npart = import_step("${fileName}")\n\n# 可进一步进行拉伸、布尔运算或直接预览\nshow_object(part)\n`;
    case ".stl":
      return `# -*- coding: utf-8 -*-\nfrom build123d import *\n\n# 导入工程内的 STL 3D 网格资产\npart = import_stl("${fileName}")\n\nshow_object(part)\n`;
    case ".svg":
      return `# -*- coding: utf-8 -*-\nfrom build123d import *\n\n# 导入 SVG 矢量线框并构建实体\nwith BuildPart() as model:\n    with BuildSketch() as sk:\n        import_svg("${fileName}")\n    extrude(amount=5.0)\n\nshow_object(model.part)\n`;
    case ".brep":
      return `# -*- coding: utf-8 -*-\nfrom build123d import *\n\n# 导入 OpenCASCADE 原生 BREP 拓扑文件\npart = import_brep("${fileName}")\n\nshow_object(part)\n`;
    default:
      return `# 导入资产: ${fileName}\n`;
  }
}

/**
 * 3D 模型资产检视面板组件
 */
export function ModelAssetViewer({
  filePath,
  fileName,
  fileContent,
  isBinary = false,
  fileSize,
  isLightMode = false,
  loading = false,
  errorMessage = null,
  onReload,
}: ModelAssetViewerProps) {
  const [copied, setCopied] = useState(false);

  const ext = fileName.slice(fileName.lastIndexOf(".")).toLowerCase();
  const formatName = ext.replace(".", "").toUpperCase() || "3D";
  const snippet = generateImportSnippet(fileName);

  // 一键复制代码
  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 兼容不支持 clipboard API 环境
      const ta = document.createElement("textarea");
      ta.value = snippet;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // 下载原始文件
  const handleDownloadOriginal = () => {
    let url: string;
    if (fileContent.startsWith("data:")) {
      url = fileContent;
    } else {
      const blob = new Blob([fileContent], { type: "application/octet-stream" });
      url = URL.createObjectURL(blob);
    }
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    if (!fileContent.startsWith("data:")) {
      URL.revokeObjectURL(url);
    }
  };

  const isSvg = ext === ".svg";

  return (
    <div
      className={`w-full h-full flex flex-col overflow-y-auto ${
        isLightMode ? "bg-[#f8fafc] text-gray-800" : "bg-[#0d1117] text-gray-200"
      }`}
    >
      {/* 顶部资产头部 */}
      <div
        className={`px-6 py-5 border-b flex items-center justify-between ${
          isLightMode ? "bg-white border-gray-200 shadow-sm" : "bg-[#161b22] border-[#30363d]"
        }`}
      >
        <div className="flex items-center space-x-3.5">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center ${
              isSvg
                ? isLightMode
                  ? "bg-amber-50 text-amber-600 border border-amber-200"
                  : "bg-amber-950/40 text-amber-400 border border-amber-800/40"
                : isLightMode
                ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                : "bg-emerald-950/40 text-emerald-400 border border-emerald-800/40"
            }`}
          >
            {isSvg ? <ImageIcon size={22} /> : <Box size={22} />}
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <h2 className="text-base font-semibold tracking-tight">{fileName}</h2>
              <span
                className={`text-[11px] px-2 py-0.5 rounded-full font-mono font-medium ${
                  isLightMode
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                    : "bg-emerald-950/70 text-emerald-300 border border-emerald-700/60"
                }`}
              >
                {formatName} 模型
              </span>
            </div>
            <p
              className={`text-xs mt-0.5 font-mono ${
                isLightMode ? "text-gray-500" : "text-gray-400"
              }`}
            >
              路径: {filePath} · 大小: {formatFileSize(fileSize)}
            </p>
          </div>
        </div>

        {/* 顶部操作区 */}
        <div className="flex items-center space-x-2">
          {onReload && (
            <button
              onClick={onReload}
              disabled={loading}
              title="重新向视口注入渲染"
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                isLightMode
                  ? "bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300"
                  : "bg-[#21262d] hover:bg-[#30363d] text-gray-200 border border-[#30363d]"
              } ${loading ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              <RotateCw size={13} className={loading ? "animate-spin" : ""} />
              <span>{loading ? "解析中..." : "重新渲染"}</span>
            </button>
          )}

          <button
            onClick={handleDownloadOriginal}
            title="下载原始文件到本地"
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              isLightMode
                ? "bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300"
                : "bg-[#21262d] hover:bg-[#30363d] text-gray-200 border border-[#30363d]"
            }`}
          >
            <Download size={13} />
            <span>下载原文件</span>
          </button>
        </div>
      </div>

      {/* 主体内容 */}
      <div className="flex-1 p-6 space-y-6 max-w-4xl">
        {/* 状态通知横幅 */}
        {errorMessage ? (
          <div
            className={`p-4 rounded-xl border flex items-start space-x-3 ${
              isLightMode
                ? "bg-red-50 border-red-200 text-red-700"
                : "bg-red-950/30 border-red-800/50 text-red-300"
            }`}
          >
            <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-500" />
            <div>
              <h4 className="text-xs font-semibold">3D 模型网格化解析遇到问题</h4>
              <p className="text-xs mt-1 leading-relaxed opacity-90">{errorMessage}</p>
            </div>
          </div>
        ) : (
          <div
            className={`p-4 rounded-xl border flex items-center justify-between ${
              isLightMode
                ? "bg-emerald-50/70 border-emerald-200 text-emerald-900"
                : "bg-emerald-950/30 border-emerald-800/50 text-emerald-200"
            }`}
          >
            <div className="flex items-center space-x-3">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  isLightMode ? "bg-emerald-100 text-emerald-700" : "bg-emerald-900/60 text-emerald-400"
                }`}
              >
                <Eye size={16} />
              </div>
              <div>
                <h4 className="text-xs font-semibold">3D 视口已实时激活</h4>
                <p className="text-xs opacity-80 mt-0.5">
                  右侧 3D 拓扑视口已加载该模型的立体几何与 B-Rep 边线拓扑。
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-1.5 text-xs font-medium">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>就绪</span>
            </div>
          </div>
        )}

        {/* 卡片 1: Python 脚本调用指南 */}
        <div
          className={`rounded-xl border p-5 ${
            isLightMode ? "bg-white border-gray-200 shadow-sm" : "bg-[#161b22] border-[#30363d]"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Code2 size={16} className="text-emerald-500" />
              <h3 className="text-xs font-semibold uppercase tracking-wider">
                在 Python 脚本中引用此模型
              </h3>
            </div>
            <button
              onClick={handleCopyCode}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-medium transition ${
                copied
                  ? "bg-emerald-600 text-white"
                  : isLightMode
                  ? "bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300"
                  : "bg-[#21262d] hover:bg-[#30363d] text-gray-300 border border-[#30363d]"
              }`}
            >
              {copied ? (
                <>
                  <Check size={13} />
                  <span>已复制</span>
                </>
              ) : (
                <>
                  <Copy size={13} />
                  <span>复制代码</span>
                </>
              )}
            </button>
          </div>

          <div
            className={`p-3 rounded-lg font-mono text-xs overflow-x-auto border ${
              isLightMode
                ? "bg-[#f6f8fa] border-gray-200 text-gray-800"
                : "bg-[#0d1117] border-[#30363d] text-emerald-400"
            }`}
          >
            <pre className="whitespace-pre-wrap">{snippet}</pre>
          </div>
          <p
            className={`text-xs mt-2.5 leading-relaxed ${
              isLightMode ? "text-gray-500" : "text-gray-400"
            }`}
          >
            💡 提示：在您的工程 `main.py` 或任意组件脚本中，直接调用上述函数即可加载本资产参与布尔装配。
          </p>
        </div>

        {/* 卡片 2: 3D 拓扑交互提示 */}
        <div
          className={`rounded-xl border p-5 ${
            isLightMode ? "bg-white border-gray-200 shadow-sm" : "bg-[#161b22] border-[#30363d]"
          }`}
        >
          <div className="flex items-center space-x-2 mb-3">
            <Compass size={16} className="text-emerald-500" />
            <h3 className="text-xs font-semibold uppercase tracking-wider">3D 视口交互控制说明</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div
              className={`p-3 rounded-lg border ${
                isLightMode ? "bg-[#f8fafc] border-gray-200" : "bg-[#0d1117]/60 border-[#30363d]"
              }`}
            >
              <div className="font-semibold mb-1 flex items-center space-x-1.5 text-emerald-500">
                <Sparkles size={13} />
                <span>视角控制</span>
              </div>
              <p className={isLightMode ? "text-gray-600" : "text-gray-400"}>
                鼠标左键旋转轨道视角，右键拖拽平移，滚轮缩放聚焦。
              </p>
            </div>

            <div
              className={`p-3 rounded-lg border ${
                isLightMode ? "bg-[#f8fafc] border-gray-200" : "bg-[#0d1117]/60 border-[#30363d]"
              }`}
            >
              <div className="font-semibold mb-1 flex items-center space-x-1.5 text-emerald-500">
                <Layers size={13} />
                <span>拓扑拾取</span>
              </div>
              <p className={isLightMode ? "text-gray-600" : "text-gray-400"}>
                支持在右侧视口中点击模型表面，拾取点、线、面法向与特征选择器。
              </p>
            </div>

            <div
              className={`p-3 rounded-lg border ${
                isLightMode ? "bg-[#f8fafc] border-gray-200" : "bg-[#0d1117]/60 border-[#30363d]"
              }`}
            >
              <div className="font-semibold mb-1 flex items-center space-x-1.5 text-emerald-500">
                <Box size={13} />
                <span>剖切与检查</span>
              </div>
              <p className={isLightMode ? "text-gray-600" : "text-gray-400"}>
                可点击视口底部控制栏开启 X/Y/Z 平面剖切，检查内部拓扑结构。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
