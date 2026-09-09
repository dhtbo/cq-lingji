"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  X,
  Bot,
  Send,
  PlusCircle,
  Code2,
  Check,
  Sparkles,
  User,
  Cpu,
  Settings,
  Loader2,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Play,
} from "lucide-react";
import { EditorSettings } from "../EditorSettings/EditorSettingsModal";
import { callAiChatCompletion, DEFAULT_AI_CONFIG } from "@/lib/aiCadSkill";

interface Message {
  id: string;
  sender: "ai" | "user";
  text: string;
  codeSnippet?: string;
  reasoning?: string;
}

interface AiDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertCode: (code: string) => void;
  settings?: EditorSettings;
  onOpenSettings?: () => void;
}

const STARTER_PROMPTS = [
  {
    title: "设计火星钝头防热大底 (L01)",
    prompt: "请帮我用 CadQuery 建立一个火星着陆舱的倒圆台碳陶防热大底，并熔合外环法兰！",
  },
  {
    title: "12 齿越野人字防滑轮 (L06)",
    prompt: "帮我编写一个参数化的 12 齿越野人字形火星车轮，带中心轴孔与极坐标防滑爪！",
  },
  {
    title: "双层中空防沙辐射穹顶 (L09)",
    prompt: "请用半球分割与差集切削，设计一个火星基地的双层中空保温防辐射生态主穹顶！",
  },
  {
    title: "土壤采样机械臂与铲斗 (L08)",
    prompt: "请帮我构建一个带回转云台、双段俯仰连杆和薄壁抽壳铲斗的火星采样机械臂！",
  },
  {
    title: "顶面打孔与棱边倒圆角",
    prompt: "如何用 B-Rep 方式在立方体顶面打中心孔，并对 4 条垂直外棱边做倒圆角？",
  },
];

export const AiDrawer: React.FC<AiDrawerProps> = ({
  isOpen,
  onClose,
  onInsertCode,
  settings,
  onOpenSettings,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "ai",
      text: "你好！我是「星际工程师 · 三维数字编程智能体」。我已装载《火星拓荒者计划》航天工程拓扑资产与 CadQuery B-Rep 建模法则，随时为你编写参数化 3D 实体代码或排查几何错误！",
    },
  ]);
  const [inputVal, setInputVal] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedReasoning, setExpandedReasoning] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const baseUrl = settings?.aiBaseUrl || DEFAULT_AI_CONFIG.baseUrl;
  const apiKey = settings?.aiApiKey || DEFAULT_AI_CONFIG.apiKey;
  const model = settings?.aiModel || DEFAULT_AI_CONFIG.model;
  const enableSkill = settings?.aiEnableSkill !== false;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, loading]);

  if (!isOpen) return null;

  const handleSend = async (textToSend?: string) => {
    const q = (textToSend || inputVal).trim();
    if (!q || loading) return;

    const baseUrl = settings?.aiBaseUrl || DEFAULT_AI_CONFIG.baseUrl;
    const apiKey = settings?.aiApiKey || DEFAULT_AI_CONFIG.apiKey;
    const model = settings?.aiModel || DEFAULT_AI_CONFIG.model;
    const enableSkill = settings?.aiEnableSkill ?? DEFAULT_AI_CONFIG.enableSkill;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: "user",
      text: q,
    };

    const aiMsgId = (Date.now() + 1).toString();
    const placeholderMsg: Message = {
      id: aiMsgId,
      sender: "ai",
      text: "",
    };

    setMessages((prev) => [...prev, userMsg, placeholderMsg]);
    setInputVal("");
    setLoading(true);

    try {
      // 构造对话上下文
      const history = messages
        .filter((m) => m.id !== "welcome" && m.id !== aiMsgId && m.text)
        .map((m) => ({
          role: (m.sender === "user" ? "user" : "assistant") as "user" | "assistant",
          content: m.codeSnippet
            ? `${m.text}\n\n\`\`\`python\n${m.codeSnippet}\n\`\`\``
            : m.text,
        }));

      history.push({ role: "user", content: q });

      const res = await callAiChatCompletion({
        baseUrl,
        apiKey,
        model,
        messages: history,
        temperature: settings?.aiTemperature ?? 0.3,
        enableSkill,
        onChunk: (_delta, fullText) => {
          // 实时提取代码块更新气泡
          const pythonMatch = fullText.match(/```(?:python|py)?\s*([\s\S]*?)```/i);
          const currentCode = pythonMatch && pythonMatch[1] ? pythonMatch[1].trim() : undefined;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === aiMsgId
                ? { ...m, text: fullText, codeSnippet: currentCode }
                : m
            )
          );
        },
      });

      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiMsgId
            ? {
                ...m,
                text: res.reply,
                codeSnippet: res.code,
                reasoning: res.reasoning,
              }
            : m
        )
      );
    } catch (err: any) {
      const errorText = `⚠️ 智能体调用异常: ${err.message || String(err)}`;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiMsgId
            ? {
                ...m,
                text: errorText,
              }
            : m
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setMessages([
      {
        id: Date.now().toString(),
        sender: "ai",
        text: "新会话已开启！告诉我想制造什么火星构件或 3D 机械零件吧！",
      },
    ]);
  };

  const handleCopyCode = (snippet: string, id: string) => {
    navigator.clipboard.writeText(snippet);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleReasoning = (id: string) => {
    setExpandedReasoning((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="fixed inset-y-0 right-0 w-[420px] sm:w-[460px] bg-[#161b22] border-l border-[#30363d] shadow-2xl z-[200] flex flex-col animate-slideInRight text-gray-200 select-none">
      {/* 头部：科技紫蓝渐变卡片 */}
      <div className="h-16 px-4 bg-gradient-to-r from-purple-800 via-indigo-800 to-purple-900 border-b border-purple-500/30 flex items-center justify-between shadow-md">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shadow-inner">
            <Bot size={22} className="text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <h2 className="text-sm font-bold text-white tracking-wide">
                3D 编程智能体
              </h2>
              <span className="px-1.5 py-0.2 bg-white/20 text-purple-100 text-[10px] font-mono font-semibold rounded-full truncate max-w-[120px]">
                {model}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-purple-200">
              {enableSkill ? (
                <span className="flex items-center gap-0.5 text-amber-300 font-semibold">
                  <Sparkles size={10} />
                  <span>星际拓荒 Skill 赋能</span>
                </span>
              ) : (
                <span>基础通用模式</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          {/* 设置入口 */}
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              title="配置智能体模型、接口地址与密钥"
              className="p-1.5 text-purple-200 hover:text-white hover:bg-white/10 rounded-lg transition"
            >
              <Settings size={16} />
            </button>
          )}

          {/* 开启新会话 */}
          <button
            onClick={handleReset}
            title="开启新会话"
            className="p-1.5 text-purple-200 hover:text-white hover:bg-white/10 rounded-lg transition"
          >
            <PlusCircle size={16} />
          </button>

          {/* 关闭抽屉 */}
          <button
            onClick={onClose}
            title="收起助手"
            className="p-1.5 text-purple-200 hover:text-white hover:bg-white/10 rounded-lg transition"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* 消息滚动流 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs select-text">
        {messages
          .filter((m) => m.text || m.reasoning || m.sender === "user")
          .map((m) => (
          <div
            key={m.id}
            className={`flex items-start gap-2.5 ${
              m.sender === "user" ? "flex-row-reverse" : "flex-row"
            }`}
          >
            {/* 头像 */}
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                m.sender === "user"
                  ? "bg-amber-500 text-gray-950 font-bold"
                  : "bg-purple-600 text-white shadow-sm"
              }`}
            >
              {m.sender === "user" ? <User size={14} /> : <Cpu size={14} />}
            </div>

            {/* 消息气泡 */}
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 leading-relaxed shadow-sm ${
                m.sender === "user"
                  ? "bg-amber-500 text-gray-950 font-medium rounded-tr-none"
                  : "bg-[#21262d] text-gray-200 border border-[#30363d] rounded-tl-none"
              }`}
            >
              {/* 深度思考折叠区 (reasoning_content) */}
              {m.reasoning && (
                <div className="mb-2 pb-2 border-b border-gray-700/60 text-[11px]">
                  <button
                    onClick={() => toggleReasoning(m.id)}
                    className="text-purple-300 hover:text-purple-200 flex items-center gap-1 font-semibold"
                  >
                    <Sparkles size={11} />
                    <span>智能体思维推导过程</span>
                    {expandedReasoning[m.id] ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>
                  {expandedReasoning[m.id] && (
                    <div className="mt-1.5 p-2 bg-[#0d1117] rounded-lg border border-gray-800 text-gray-400 font-mono text-[10px] whitespace-pre-wrap max-h-40 overflow-y-auto">
                      {m.reasoning}
                    </div>
                  )}
                </div>
              )}

              <div className="whitespace-pre-wrap">{m.text}</div>

              {/* 代码片段展示与一键插入 */}
              {m.codeSnippet && (
                <div className="mt-2.5 pt-2 border-t border-gray-700/60">
                  <div className="flex items-center justify-between text-[11px] text-gray-400 mb-1.5 font-mono">
                    <span className="flex items-center gap-1 text-cyan-400 font-bold">
                      <Code2 size={12} />
                      <span>CadQuery Python 3D 代码</span>
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleCopyCode(m.codeSnippet!, m.id)}
                        className="px-2 py-0.5 bg-[#30363d] hover:bg-gray-600 rounded text-[10px] text-gray-200 transition flex items-center gap-1"
                        title="复制完整代码"
                      >
                        {copiedId === m.id ? (
                          <>
                            <Check size={11} className="text-emerald-400" />
                            <span className="text-emerald-400">已复制</span>
                          </>
                        ) : (
                          <>
                            <Code2 size={11} />
                            <span>复制</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => onInsertCode(m.codeSnippet!)}
                        className="px-2.5 py-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded text-[10px] font-bold transition flex items-center gap-1 shadow-sm active:scale-95"
                        title="立即载入代码并渲染 3D 实体"
                      >
                        <Play size={10} className="fill-current" />
                        <span>注入并渲染</span>
                      </button>
                    </div>
                  </div>

                  <pre className="p-2.5 bg-[#0d1117] rounded-lg text-[11px] font-mono text-cyan-300 overflow-x-auto border border-[#30363d] max-h-60 overflow-y-auto">
                    <code>{m.codeSnippet}</code>
                  </pre>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* 思考中动效 */}
        {loading && (
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-full bg-purple-600 text-white flex items-center justify-center flex-shrink-0">
              <Loader2 size={14} className="animate-spin" />
            </div>
            <div className="bg-[#21262d] text-purple-300 border border-purple-500/30 rounded-2xl rounded-tl-none px-3.5 py-2 text-xs flex items-center gap-2">
              <Sparkles size={13} className="animate-pulse text-amber-400" />
              <span>智能体正在构思 3D 拓扑构型与 CadQuery 代码...</span>
            </div>
          </div>
        )}

        {/* 推荐提示词芯片 */}
        {messages.length <= 2 && !loading && (
          <div className="pt-2 space-y-2 select-none">
            <p className="text-[11px] text-gray-400 font-semibold flex items-center gap-1">
              <Sparkles size={12} className="text-amber-400" />
              <span>星际拓荒实战灵感推荐：</span>
            </p>
            <div className="flex flex-col gap-1.5">
              {STARTER_PROMPTS.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(p.prompt)}
                  className="w-full text-left px-3 py-2 bg-[#21262d] hover:bg-[#282e38] border border-[#30363d] rounded-xl text-gray-300 hover:text-white text-xs transition flex items-center justify-between group shadow-xs"
                >
                  <span className="truncate">{p.title}</span>
                  <span className="text-gray-500 group-hover:text-purple-400 text-[11px] flex-shrink-0 ml-2">
                    发送 →
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 底部输入框 */}
      <div className="p-3 bg-[#0d1117] border-t border-[#30363d] space-y-2">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="描述想要构建的 3D 零件或火星构件..."
            disabled={loading}
            className="flex-1 bg-[#161b22] border border-[#30363d] focus:border-purple-500 rounded-xl px-3.5 py-2 text-xs text-gray-200 placeholder-gray-500 focus:outline-none transition"
          />
          <button
            onClick={() => handleSend()}
            disabled={!inputVal.trim() || loading}
            className="p-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl transition shadow-md disabled:opacity-40 disabled:hover:from-purple-600"
            title="发送 (Enter)"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>

        <div className="flex items-center justify-between text-[10px] text-gray-500 px-1">
          <span>回车发送 · 支持 OpenAI 兼容模型</span>
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="text-purple-400 hover:text-purple-300 underline"
            >
              配置 API Key 与模型
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
