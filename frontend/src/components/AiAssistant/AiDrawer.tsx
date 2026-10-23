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
  Image as ImageIcon,
  Trash2,
  Maximize2,
} from "lucide-react";
import { EditorSettings } from "../EditorSettings/EditorSettingsModal";
import {
  callAiChatCompletion,
  DEFAULT_AI_CONFIG,
  AiProgrammingMode,
  DEFAULT_AI_ENDPOINTS,
} from "@/lib/aiCadSkill";

interface Message {
  id: string;
  sender: "ai" | "user";
  text: string;
  images?: string[];
  codeSnippet?: string;
  reasoning?: string;
}

/**
 * 客户端图片处理：将图像文件转为高质量 Base64 Data URL，自动进行等比平滑缩放与压缩优化
 */
async function processImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("仅支持图像文件"));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("读取图像文件失败"));
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (!result) {
        reject(new Error("获取图像数据失败"));
        return;
      }

      const img = new window.Image();
      img.onerror = () => resolve(result); // 解析异常时回退到原始 Data URL
      img.onload = () => {
        const maxDim = 1600;
        let { width, height } = img;

        // 若尺寸较小且体积适中，直接使用原始 Data URL
        if (width <= maxDim && height <= maxDim && file.size < 800 * 1024) {
          resolve(result);
          return;
        }

        // 等比例缩放至最大边不超过 maxDim
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(result);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        // 输出为质量 0.88 的 JPEG
        const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.88);
        resolve(compressedDataUrl);
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  });
}

export interface AiEnginePreset {
  id: string;
  name: string;
  provider: string;
}

export const AI_ENGINE_PRESETS: AiEnginePreset[] = [
  { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash (极速推荐)", provider: "Google" },
  { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash (轻量高效)", provider: "Google" },
  { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro (深度复杂)", provider: "Google" },
  { id: "deepseek-chat", name: "DeepSeek-V3 (通用代码)", provider: "DeepSeek" },
  { id: "deepseek-reasoner", name: "DeepSeek-R1 (深度推理)", provider: "DeepSeek" },
  { id: "gpt-4o", name: "GPT-4o (全能高精)", provider: "OpenAI" },
  { id: "gpt-4o-mini", name: "GPT-4o Mini (轻巧灵敏)", provider: "OpenAI" },
  { id: "claude-3-5-sonnet", name: "Claude 3.5 Sonnet", provider: "Anthropic" },
  { id: "qwen-2.5-coder", name: "Qwen 2.5 Coder (通义千问)", provider: "Alibaba" },
];

interface AiDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertCode: (code: string) => void;
  settings?: EditorSettings;
  onOpenSettings?: () => void;
  onUpdateSettings?: (settings: EditorSettings) => void;
}

const MODE_STARTER_PROMPTS: Record<AiProgrammingMode, Array<{ title: string; prompt: string }>> = {
  build123d: [
    {
      title: "圆柱法兰与均布螺栓孔 (BuildPart)",
      prompt: "请使用 build123d 建造者模式，构建一个带沉头中心轴孔和圆周均布螺栓孔的安装法兰！",
    },
    {
      title: "双层中空防辐射穹顶 (Sphere + cut)",
      prompt: "请用 build123d 半球与差集切削，设计一个双层中空保温防辐射生态主穹顶！",
    },
    {
      title: "机械臂连杆与薄壁铲斗 (BuildPart)",
      prompt: "请用 build123d 构建一个带回转云台、双段俯仰连杆和薄壁抽壳铲斗的机械臂结构！",
    },
    {
      title: "顶面打孔与垂直棱边倒角",
      prompt: "如何用 build123d 在立方体顶面打孔，并对垂直外棱边做 fillet 倒圆角？",
    },
  ],
  cadquery: [
    {
      title: "火星钝头倒圆台防热大底 (CadQuery)",
      prompt: "请帮我用 CadQuery 建立一个火星着陆舱的倒圆台碳陶防热大底，并熔合外环法兰！",
    },
    {
      title: "12 齿越野人字防滑轮 (CadQuery)",
      prompt: "帮我用 CadQuery 编写一个参数化的 12 齿越野人字形火星车轮，带中心轴孔与防滑爪！",
    },
    {
      title: "薄壁矩形机箱壳体 (shell)",
      prompt: "请用 CadQuery 工作平面拉伸一个带内部加强筋和沉头孔的薄壁电子设备壳体！",
    },
    {
      title: "工作平面沉头螺栓孔 (cboreHole)",
      prompt: "请用 CadQuery 在实体表面阵列打 4 个标准沉头螺栓孔 (cboreHole)！",
    },
  ],
  logoup: [
    {
      title: "向前 30 绘制矩形向上拉伸 15 (LogoUp)",
      prompt: "请用 LogoUp 3D 编写指令：海龟向前移动 30，绘制一个 20x10 的矩形草图，并向上拉伸 15！",
    },
    {
      title: "绘制圆草图进行尖顶锥拉伸 (pyramid)",
      prompt: "请用 LogoUp 3D 绘制一个半径 15 的圆形草图，并调用 pyramid 积木进行尖顶圆锥拉伸！",
    },
    {
      title: "空间螺旋上升阶梯造型 (fd + step_up + rt)",
      prompt: "请用 LogoUp 3D 通过循环、fd、step_up 和 rt 偏航转向，建造一座三维螺旋旋转楼梯！",
    },
    {
      title: "构建椭球体与圆环构件 (ellipsoid + torus)",
      prompt: "请用 LogoUp 3D 构建一个椭球构件和一个圆环构件，展示三维空间构件造型能力！",
    },
  ],
};

export const AiDrawer: React.FC<AiDrawerProps> = ({
  isOpen,
  onClose,
  onInsertCode,
  settings,
  onOpenSettings,
  onUpdateSettings,
}) => {
  const activeWorkingMode = settings?.workingMode || "build123d";
  const [programmingMode, setProgrammingMode] = useState<AiProgrammingMode>(
    activeWorkingMode as AiProgrammingMode
  );

  // 当外部工作模式切换时，自动同步智能体模式
  useEffect(() => {
    if (activeWorkingMode) {
      setProgrammingMode(activeWorkingMode as AiProgrammingMode);
    }
  }, [activeWorkingMode]);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "ai",
      text: "你好！我是「三维数字编程智能体」。我已根据当前工作模式智能适配，随时为你编写参数化 3D 实体代码或排查几何错误！",
    },
  ]);
  const [inputVal, setInputVal] = useState("");
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [previewModalImage, setPreviewModalImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingImages, setIsProcessingImages] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedReasoning, setExpandedReasoning] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  }, [messages, isOpen, loading, selectedImages]);

  // 监听 ESC 键关闭全屏图片预览
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && previewModalImage) {
        setPreviewModalImage(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [previewModalImage]);

  /**
   * 批量处理文件并加入待发送图片列表（上限 9 张）
   */
  const addImagesFromFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (fileArray.length === 0) return;

    setIsProcessingImages(true);
    try {
      const newBase64s: string[] = [];
      for (const file of fileArray) {
        const base64 = await processImageFile(file);
        newBase64s.push(base64);
      }
      setSelectedImages((prev) => {
        const combined = [...prev, ...newBase64s];
        return combined.slice(0, 9);
      });
    } catch (err: any) {
      console.error("处理图像出错:", err);
    } finally {
      setIsProcessingImages(false);
    }
  };

  /**
   * 处理剪贴板粘贴图片 (Ctrl + V)
   */
  const handlePaste = (e: React.ClipboardEvent) => {
    const clipboardItems = e.clipboardData?.items;
    if (!clipboardItems) return;

    const imageFiles: File[] = [];
    for (let i = 0; i < clipboardItems.length; i++) {
      const item = clipboardItems[i];
      if (item.kind === "file" && item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) {
          imageFiles.push(file);
        }
      }
    }

    if (imageFiles.length > 0) {
      e.preventDefault();
      addImagesFromFiles(imageFiles);
    }
  };

  /**
   * 文件选择回调
   */
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addImagesFromFiles(e.target.files);
    }
    e.target.value = "";
  };

  /**
   * 拖拽图片放入
   */
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addImagesFromFiles(e.dataTransfer.files);
    }
  };

  /**
   * 移除待发送列表中的单张图片
   */
  const removeSelectedImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, idx) => idx !== index));
  };

  if (!isOpen) return null;

  const handleSend = async (textToSend?: string) => {
    const q = (textToSend !== undefined ? textToSend : inputVal).trim();
    const currentImages = [...selectedImages];

    // 若无文字且无图片，则不发送
    if (!q && currentImages.length === 0) return;
    if (loading) return;

    const baseUrl = settings?.aiBaseUrl || DEFAULT_AI_CONFIG.baseUrl;
    const apiKey = settings?.aiApiKey || DEFAULT_AI_CONFIG.apiKey;
    const model = settings?.aiModel || DEFAULT_AI_CONFIG.model;
    const enableSkill = settings?.aiEnableSkill ?? DEFAULT_AI_CONFIG.enableSkill;

    const finalPromptText = q || "请参考所附带的参考图片，为我编写对应的 3D 参数化 CAD 零件模型。";

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: "user",
      text: finalPromptText,
      images: currentImages.length > 0 ? currentImages : undefined,
    };

    const aiMsgId = (Date.now() + 1).toString();
    const placeholderMsg: Message = {
      id: aiMsgId,
      sender: "ai",
      text: "",
    };

    setMessages((prev) => [...prev, userMsg, placeholderMsg]);
    setInputVal("");
    setSelectedImages([]);
    setLoading(true);

    try {
      // 构造对话上下文（携带历史中的多模态图片）
      const history = messages
        .filter((m) => m.id !== "welcome" && m.id !== aiMsgId && (m.text || (m.images && m.images.length > 0)))
        .map((m) => ({
          role: (m.sender === "user" ? "user" : "assistant") as "user" | "assistant",
          content: m.codeSnippet
            ? `${m.text}\n\n\`\`\`python\n${m.codeSnippet}\n\`\`\``
            : m.text,
          images: m.images,
        }));

      history.push({
        role: "user",
        content: finalPromptText,
        images: currentImages.length > 0 ? currentImages : undefined,
      });

      const res = await callAiChatCompletion({
        baseUrl,
        apiKey,
        model,
        messages: history,
        mode: programmingMode,
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
    setSelectedImages([]);
    setLoading(false);
    setInputVal("");
    setMessages([
      {
        id: Date.now().toString(),
        sender: "ai",
        text: "新会话已开启！告诉我想制造什么火星构件或 3D 机械零件吧，也支持上传零件图纸或实物照片！",
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

      {/* 🚀 大模型引擎快捷切换条 (包含接口与模型完整信息) */}
      <div className="px-3 py-1.5 bg-[#161b22] border-b border-[#30363d] flex items-center justify-between gap-2 text-xs shrink-0">
        <div className="flex items-center gap-1.5 text-gray-300">
          <Cpu size={13} className="text-indigo-400 shrink-0" />
          <span className="text-[11px] font-semibold">模型接口:</span>
        </div>
        <div className="flex-1 max-w-[280px] relative">
          {(() => {
            const endpoints =
              settings?.aiEndpoints && settings.aiEndpoints.length > 0
                ? settings.aiEndpoints
                : DEFAULT_AI_ENDPOINTS;

            let selectedValue = "";
            const activeEp = endpoints.find((ep) => ep.id === settings?.aiActiveEndpointId);
            if (activeEp && activeEp.models.includes(model)) {
              selectedValue = `${activeEp.id}:::${model}`;
            } else {
              const foundEp = endpoints.find((ep) => ep.models.includes(model));
              if (foundEp) {
                selectedValue = `${foundEp.id}:::${model}`;
              } else {
                selectedValue = `${endpoints[0].id}:::${model}`;
              }
            }

            return (
              <select
                value={selectedValue}
                onChange={(e) => {
                  const [epId, chosenModel] = e.target.value.split(":::");
                  const targetEp = endpoints.find((ep) => ep.id === epId);
                  if (targetEp && onUpdateSettings && settings) {
                    onUpdateSettings({
                      ...settings,
                      aiActiveEndpointId: targetEp.id,
                      aiBaseUrl: targetEp.baseUrl,
                      aiApiKey: targetEp.apiKey,
                      aiModel: chosenModel,
                    });
                  }
                }}
                className="w-full bg-[#0d1117] border border-[#30363d] hover:border-purple-500 rounded-lg px-2 py-1 text-xs text-gray-200 focus:outline-none focus:border-purple-500 transition cursor-pointer font-mono"
                title="选择大模型及其服务接口"
              >
                {endpoints.map((ep) => (
                  <optgroup
                    key={ep.id}
                    label={`🌐 ${ep.name}`}
                    className="bg-[#161b22] text-purple-300 font-bold"
                  >
                    {ep.models.map((m) => {
                      const prefix = ep.name.replace(/官方|加速站/g, "").trim();
                      return (
                        <option
                          key={`${ep.id}:::${m}`}
                          value={`${ep.id}:::${m}`}
                          className="bg-[#0d1117] text-gray-200 font-mono"
                        >
                          [{prefix}] {m}
                        </option>
                      );
                    })}
                  </optgroup>
                ))}
              </select>
            );
          })()}
        </div>
      </div>

      {/* 编程模式栏 (根据当前工作模式智能隔离与隐藏无关模式) */}
      <div className="px-3 py-1.5 bg-[#0d1117] border-b border-[#30363d] flex items-center justify-between gap-1 text-xs shrink-0">
        <span className="text-[11px] text-gray-400 font-medium shrink-0">智能体模式:</span>
        <div className="flex items-center bg-[#21262d] rounded-lg p-0.5 border border-[#30363d] text-[11px] grow justify-center">
          {activeWorkingMode === "build123d" && (
            <div className="w-full px-2 py-1 rounded font-semibold bg-blue-600/90 text-white shadow-sm flex items-center justify-center gap-1.5">
              <span>🧱 build123d 专业建造者模式</span>
            </div>
          )}
          {activeWorkingMode === "cadquery" && (
            <div className="w-full px-2 py-1 rounded font-semibold bg-purple-600/90 text-white shadow-sm flex items-center justify-center gap-1.5">
              <span>📐 CadQuery B-Rep 建模模式</span>
            </div>
          )}
          {activeWorkingMode === "logoup" && (
            <div className="w-full px-2 py-1 rounded font-semibold bg-amber-600/90 text-white shadow-sm flex items-center justify-center gap-1.5">
              <span>🧭 LogoUp 3D 空间海龟构件模式</span>
            </div>
          )}
          {!["build123d", "cadquery", "logoup"].includes(activeWorkingMode) && (
            <div className="w-full px-2 py-1 rounded font-semibold bg-blue-600/90 text-white shadow-sm flex items-center justify-center gap-1.5">
              <span>🧱 build123d 专业建造者模式</span>
            </div>
          )}
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

              {/* 用户上传图片展示区 (单图自适应 / 多图网格) */}
              {m.images && m.images.length > 0 && (
                <div className="mb-2">
                  {m.images.length === 1 ? (
                    <div
                      onClick={() => setPreviewModalImage(m.images![0])}
                      className="relative group cursor-pointer overflow-hidden rounded-xl border border-black/20 shadow-sm max-w-[240px] bg-black/10"
                      title="点击放大查看"
                    >
                      <img
                        src={m.images[0]}
                        alt="参考图片"
                        className="w-full max-h-48 object-cover rounded-xl transition duration-200 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[11px] font-semibold gap-1 pointer-events-none">
                        <Maximize2 size={13} />
                        <span>点击放大</span>
                      </div>
                    </div>
                  ) : (
                    <div
                      className={`grid gap-1.5 ${
                        m.images.length === 2 || m.images.length === 4
                          ? "grid-cols-2 max-w-[210px]"
                          : "grid-cols-3 max-w-[260px]"
                      }`}
                    >
                      {m.images.map((img, idx) => (
                        <div
                          key={idx}
                          onClick={() => setPreviewModalImage(img)}
                          className="relative group cursor-pointer aspect-square rounded-lg overflow-hidden border border-black/20 bg-black/10 shadow-xs"
                          title={`参考图 ${idx + 1} (点击放大)`}
                        >
                          <img
                            src={img}
                            alt={`参考图 ${idx + 1}`}
                            className="w-full h-full object-cover transition duration-200 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white pointer-events-none">
                            <Maximize2 size={12} />
                          </div>
                        </div>
                      ))}
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
              <span>{programmingMode === "logoup" ? "LogoUp 3D 快速造型指令推荐：" : programmingMode === "cadquery" ? "CadQuery 经典建模灵感推荐：" : "build123d 建造者实战推荐："}</span>
            </p>
            <div className="flex flex-col gap-1.5">
              {(MODE_STARTER_PROMPTS[programmingMode] || MODE_STARTER_PROMPTS.build123d).map((p, idx) => (
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

      {/* 底部输入框与图片操作区 */}
      <div className="p-3 bg-[#0d1117] border-t border-[#30363d] space-y-2">
        {/* 隐藏的系统文件选择框 */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          multiple
          onChange={handleFileInputChange}
          className="hidden"
        />

        {/* 待发送图片缩略图托盘 */}
        {selectedImages.length > 0 && (
          <div className="p-2 bg-[#161b22] border border-[#30363d] rounded-xl flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[11px] text-gray-400 px-1">
              <span className="flex items-center gap-1 font-medium text-purple-300">
                <ImageIcon size={12} />
                <span>已附加参考图 ({selectedImages.length}/9)</span>
              </span>
              <button
                onClick={() => setSelectedImages([])}
                className="text-gray-500 hover:text-rose-400 flex items-center gap-0.5 text-[10px] transition"
                title="清空已选图片"
              >
                <Trash2 size={10} />
                <span>清空</span>
              </button>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {selectedImages.map((img, idx) => (
                <div
                  key={idx}
                  className="relative group shrink-0 w-12 h-12 rounded-lg overflow-hidden border border-[#30363d] bg-black/40 shadow-xs"
                >
                  <img
                    src={img}
                    alt={`待发送图 ${idx + 1}`}
                    className="w-full h-full object-cover cursor-pointer hover:opacity-90"
                    onClick={() => setPreviewModalImage(img)}
                    title="点击放大查看"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeSelectedImage(idx);
                    }}
                    className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/80 hover:bg-rose-600 text-white flex items-center justify-center transition"
                    title="删除图片"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
              {selectedImages.length < 9 && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="shrink-0 w-12 h-12 rounded-lg border border-dashed border-[#30363d] hover:border-purple-500 flex flex-col items-center justify-center text-gray-400 hover:text-purple-300 text-[9px] gap-0.5 transition"
                  title="继续添加图片 (上限 9 张)"
                >
                  <PlusCircle size={13} />
                  <span>加图</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* 输入框主容器：支持拖拽与粘贴 */}
        <div
          onPaste={handlePaste}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`relative bg-[#161b22] border rounded-xl transition flex flex-col ${
            isDragging
              ? "border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/10"
              : "border-[#30363d] focus-within:border-purple-500"
          }`}
        >
          <textarea
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={
              selectedImages.length > 0
                ? "输入具体建模要求 (可直接回车发送让智能体分析图片并建模)..."
                : "描述想要构建的 3D 零件，支持 Ctrl+V 粘贴截图或拖入/上传图片..."
            }
            rows={2}
            disabled={loading}
            className="w-full bg-transparent px-3.5 pt-2.5 pb-1 text-xs text-gray-200 placeholder-gray-500 focus:outline-none resize-none min-h-[44px] max-h-[140px]"
          />

          <div className="flex items-center justify-between px-2.5 py-1.5 border-t border-[#30363d]/40">
            <div className="flex items-center gap-1.5">
              {/* 上传图片按钮 */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading || selectedImages.length >= 9}
                className="px-2 py-1 text-gray-400 hover:text-purple-300 hover:bg-white/5 rounded-lg transition flex items-center gap-1 text-[11px] disabled:opacity-30"
                title="上传参考图 (可一次多选，也支持在输入框直接 Ctrl+V 粘贴截图)"
              >
                <ImageIcon size={14} />
                <span>传图/粘贴</span>
              </button>

              {isProcessingImages && (
                <span className="flex items-center gap-1 text-[10px] text-purple-400">
                  <Loader2 size={11} className="animate-spin" />
                  <span>图片解析中...</span>
                </span>
              )}
            </div>

            <button
              onClick={() => handleSend()}
              disabled={(!inputVal.trim() && selectedImages.length === 0) || loading}
              className="px-3 py-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg transition shadow-md disabled:opacity-35 disabled:hover:from-purple-600 flex items-center gap-1 text-xs font-semibold"
              title="发送 (Enter)"
            >
              {loading ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
              <span>发送</span>
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] text-gray-500 px-1">
          <span>Enter 发送 · Shift+Enter 换行 · 支持粘贴图片</span>
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

      {/* 全屏大图预览 Lightbox 模态框 */}
      {previewModalImage && (
        <div
          onClick={() => setPreviewModalImage(null)}
          className="fixed inset-0 z-[400] bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-4 select-none"
        >
          <div className="relative max-w-4xl max-h-[85vh] flex flex-col items-center">
            <button
              onClick={() => setPreviewModalImage(null)}
              className="absolute -top-10 right-0 text-gray-400 hover:text-white p-1 rounded-full bg-white/10 hover:bg-white/20 transition"
              title="关闭 (ESC)"
            >
              <X size={20} />
            </button>
            <img
              src={previewModalImage}
              alt="大图预览"
              onClick={(e) => e.stopPropagation()}
              className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl border border-white/10"
            />
            <span className="text-[11px] text-gray-400 mt-2">按 ESC 键或点击空白区域关闭</span>
          </div>
        </div>
      )}
    </div>
  );
};
