"use client";

import React, { useState } from "react";
import {
  Search,
  ChevronDown,
  ChevronUp,
  X,
  CaseSensitive,
  Regex,
  ChevronRight,
  Replace,
} from "lucide-react";

interface SearchReplaceWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  onFind: (query: string, matchCase: boolean, isRegex: boolean, forward: boolean) => void;
  onReplace?: (query: string, replaceText: string, all: boolean) => void;
  matchCount?: { current: number; total: number };
}

export const SearchReplaceWidget: React.FC<SearchReplaceWidgetProps> = ({
  isOpen,
  onClose,
  onFind,
  onReplace,
  matchCount = { current: 0, total: 0 },
}) => {
  const [query, setQuery] = useState("");
  const [replaceText, setReplaceText] = useState("");
  const [matchCase, setMatchCase] = useState(false);
  const [isRegex, setIsRegex] = useState(false);
  const [showReplace, setShowReplace] = useState(false);

  if (!isOpen) return null;

  const handleSearch = (forward: boolean) => {
    if (!query) return;
    onFind(query, matchCase, isRegex, forward);
  };

  const handleReplaceOne = () => {
    if (onReplace && query) {
      onReplace(query, replaceText, false);
    }
  };

  const handleReplaceAll = () => {
    if (onReplace && query) {
      onReplace(query, replaceText, true);
    }
  };

  return (
    <div className="absolute top-2 right-4 z-30 bg-[#1e232b] border border-[#30363d] rounded-xl shadow-2xl p-1.5 flex flex-col gap-1.5 text-xs text-gray-200 select-none animate-fadeIn">
      {/* 搜索行 */}
      <div className="flex items-center space-x-1.5">
        {/* 展开/收起替换行切换 */}
        <button
          onClick={() => setShowReplace((prev) => !prev)}
          className={`p-1 rounded text-gray-400 hover:text-white hover:bg-white/10 transition ${
            showReplace ? "rotate-90 text-amber-400" : ""
          }`}
          title="切换替换输入框"
        >
          <ChevronRight size={14} className="transition-transform duration-150" />
        </button>

        {/* 搜索输入框 */}
        <div className="relative flex items-center">
          <Search size={13} className="absolute left-2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              onFind(e.target.value, matchCase, isRegex, true);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch(!e.shiftKey);
              } else if (e.key === "Escape") {
                onClose();
              }
            }}
            placeholder="查找代码..."
            autoFocus
            className="pl-7 pr-2 py-1 w-44 bg-[#0d1117] border border-[#30363d] rounded-lg text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:border-amber-400 transition"
          />
        </div>

        {/* 区分大小写 Aa */}
        <button
          onClick={() => {
            const next = !matchCase;
            setMatchCase(next);
            onFind(query, next, isRegex, true);
          }}
          className={`px-1.5 py-0.5 rounded text-[11px] font-mono font-semibold transition ${
            matchCase
              ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
              : "text-gray-400 hover:bg-white/10"
          }`}
          title="区分大小写 (Alt + C)"
        >
          Aa
        </button>

        {/* 正则表达式 .* */}
        <button
          onClick={() => {
            const next = !isRegex;
            setIsRegex(next);
            onFind(query, matchCase, next, true);
          }}
          className={`px-1.5 py-0.5 rounded text-[11px] font-mono font-semibold transition ${
            isRegex
              ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
              : "text-gray-400 hover:bg-white/10"
          }`}
          title="正则表达式 (Alt + R)"
        >
          .*
        </button>

        {/* 匹配计数器 */}
        <span className="text-[10px] text-gray-400 font-mono px-1 min-w-[28px] text-center">
          {matchCount.total > 0 ? `${matchCount.current}/${matchCount.total}` : "0/0"}
        </span>

        {/* 上一个 */}
        <button
          onClick={() => handleSearch(false)}
          className="p-1 rounded text-gray-400 hover:text-white hover:bg-white/10 transition"
          title="上一个匹配 (Shift + Enter)"
        >
          <ChevronUp size={14} />
        </button>

        {/* 下一个 */}
        <button
          onClick={() => handleSearch(true)}
          className="p-1 rounded text-gray-400 hover:text-white hover:bg-white/10 transition"
          title="下一个匹配 (Enter)"
        >
          <ChevronDown size={14} />
        </button>

        {/* 关闭 */}
        <button
          onClick={onClose}
          className="p-1 rounded text-gray-400 hover:text-red-400 hover:bg-white/10 transition"
          title="关闭 (Esc)"
        >
          <X size={14} />
        </button>
      </div>

      {/* 替换行 (展开显示) */}
      {showReplace && (
        <div className="flex items-center space-x-1.5 pl-6 pt-1 border-t border-[#30363d] animate-fadeIn">
          <input
            type="text"
            value={replaceText}
            onChange={(e) => setReplaceText(e.target.value)}
            placeholder="替换为..."
            className="px-2.5 py-1 w-44 bg-[#0d1117] border border-[#30363d] rounded-lg text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:border-amber-400 transition"
          />

          <button
            onClick={handleReplaceOne}
            disabled={!query}
            className="px-2 py-0.5 bg-[#262c36] hover:bg-[#30363d] border border-[#30363d] text-gray-200 text-[11px] rounded transition disabled:opacity-40"
          >
            替换
          </button>

          <button
            onClick={handleReplaceAll}
            disabled={!query}
            className="px-2 py-0.5 bg-[#262c36] hover:bg-[#30363d] border border-[#30363d] text-gray-200 text-[11px] rounded transition disabled:opacity-40"
          >
            全部
          </button>
        </div>
      )}
    </div>
  );
};
