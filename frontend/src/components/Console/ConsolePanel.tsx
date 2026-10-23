"use client";

import React, { useState } from "react";
import { Terminal, AlertCircle, Copy, Check, Trash2, ChevronUp, ChevronDown } from "lucide-react";

interface ConsolePanelProps {
  stdout: string;
  errorMessage: string | null;
  execTime?: number | null;
  isLightMode?: boolean;
  isOpen?: boolean;
  onToggleOpen?: () => void;
  onClear?: () => void;
}

export const ConsolePanel: React.FC<ConsolePanelProps> = ({
  stdout,
  errorMessage,
  execTime,
  isLightMode = false,
  isOpen = true,
  onToggleOpen,
  onClear,
}) => {
  const [activeTab, setActiveTab] = useState<"output" | "diagnostics">(
    errorMessage ? "diagnostics" : "output"
  );
  const [copied, setCopied] = useState(false);

  // 监听报错自动切换到诊断页签
  React.useEffect(() => {
    if (errorMessage) {
      setActiveTab("diagnostics");
    }
  }, [errorMessage]);

  const handleCopy = () => {
    const text = activeTab === "output" ? stdout : (errorMessage || "无错误");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`w-full h-full flex flex-col ${
        isLightMode ? "bg-white text-gray-800" : "bg-[#161b22] text-gray-200"
      } select-none overflow-hidden`}
    >
      {/* 控制台顶栏 */}
      <div
        className={`h-9 px-3 flex items-center justify-between border-b ${
          isLightMode ? "bg-[#f3f4f6] border-[#e5e7eb]" : "bg-[#21262d] border-[#30363d]"
        } text-xs font-semibold shrink-0`}
      >
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              if (!isOpen && onToggleOpen) onToggleOpen();
              setActiveTab("output");
            }}
            className={`flex items-center space-x-1.5 px-2 py-1 rounded transition ${
              activeTab === "output"
                ? isLightMode
                  ? "bg-white text-amber-700 shadow-sm font-bold"
                  : "bg-[#161b22] text-amber-400 font-bold"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <Terminal size={13} />
            <span>控制台输出</span>
            {stdout && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            )}
          </button>

          <button
            onClick={() => {
              if (!isOpen && onToggleOpen) onToggleOpen();
              setActiveTab("diagnostics");
            }}
            className={`flex items-center space-x-1.5 px-2 py-1 rounded transition ${
              activeTab === "diagnostics"
                ? errorMessage
                  ? "bg-red-500/10 text-red-400 font-bold border border-red-500/20"
                  : isLightMode
                  ? "bg-white text-emerald-700 shadow-sm font-bold"
                  : "bg-[#161b22] text-emerald-400 font-bold"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <AlertCircle size={13} />
            <span>诊断与报错</span>
            {errorMessage ? (
              <span className="px-1.5 py-0.2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-full text-[10px] font-bold animate-pulse">
                1 错误
              </span>
            ) : (
              <span className="px-1.5 py-0.2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px]">
                正常
              </span>
            )}
          </button>
        </div>

        <div className="flex items-center space-x-2">
          {execTime !== undefined && execTime !== null && (
            <span
              className={`text-[10px] font-mono ${
                isLightMode ? "text-emerald-700" : "text-emerald-400"
              }`}
            >
              耗时 {execTime}ms
            </span>
          )}

          {/* 复制 */}
          <button
            onClick={handleCopy}
            className={`p-1 rounded transition ${
              isLightMode ? "hover:bg-gray-200 text-gray-600" : "hover:bg-[#30363d] text-gray-400"
            }`}
            title="复制控制台内容"
          >
            {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
          </button>

          {/* 清空 */}
          <button
            onClick={onClear}
            className={`p-1 rounded transition ${
              isLightMode ? "hover:bg-gray-200 text-gray-600" : "hover:bg-[#30363d] text-gray-400"
            }`}
            title="清空控制台"
          >
            <Trash2 size={12} />
          </button>

          {/* 展开/收起 */}
          {onToggleOpen && (
            <button
              onClick={onToggleOpen}
              className={`p-1 rounded transition ${
                isLightMode ? "hover:bg-gray-200 text-gray-600" : "hover:bg-[#30363d] text-gray-400"
              }`}
              title={isOpen ? "收起控制台" : "展开控制台"}
            >
              {isOpen ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
            </button>
          )}
        </div>
      </div>

      {/* 控制台内容区 */}
      {isOpen && (
        <div className="flex-1 p-2.5 font-mono text-xs overflow-y-auto select-text">
          {activeTab === "output" ? (
            stdout ? (
              <pre className="whitespace-pre-wrap leading-relaxed text-emerald-400/90 selection:bg-blue-500/30">
                {stdout}
              </pre>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500 text-xs italic">
                控制台输出就绪：在此处打印 Python 输出 (print) 与执行日志
              </div>
            )
          ) : (
            errorMessage ? (
              <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-md text-red-300 whitespace-pre-wrap leading-relaxed">
                <div className="flex items-center gap-1.5 font-semibold text-red-400 mb-1">
                  <AlertCircle size={14} />
                  <span>几何执行或语法异常：</span>
                </div>
                {errorMessage}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-emerald-500/70 text-xs italic">
                ✓ 运行状态正常：未检测到几何构造与语法错误
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};
