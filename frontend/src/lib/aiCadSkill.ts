/**
 * 三维数字编程智能体专业技能库 (CadQuery 3D Digital Programming Skill)
 * 深度融合《星际工程师：火星拓荒者计划》16 课航天拓扑工程体系与 CadQuery B-Rep 建模心智
 * 支持 OpenAI 兼容接口（Gemini 3.8 / DeepSeek / GPT 等）与流式 (SSE) 传输
 */

export type AiProgrammingMode = "build123d" | "cadquery" | "logoup";

/**
 * 智能体多 API 接口端点配置结构
 * 支持一个或多个 API 接口，每个接口可独立配置 Base URL、API Key 与专属的模型列表
 */
export interface AiEndpointConfig {
  id: string;
  name: string; // 接口名称，如 "灵机官方加速站", "DeepSeek 官方", "OpenAI 官方"
  baseUrl: string;
  apiKey: string;
  models: string[]; // 该接口可用的一个或多个模型
  isCustom?: boolean;
}

export const DEFAULT_AI_ENDPOINTS: AiEndpointConfig[] = [
  {
    id: "lingji-speed",
    name: "灵机官方加速站 (推荐)",
    baseUrl: "https://ag.ljcode.cn/v1",
    apiKey: "GZsVmzaF6PMf5O8GZm1XmcGNNMJxF6wo",
    models: [
      "gemini-3.8-flash-low",
      "gemini-3.8-flash-medium",
      "gemini-2.5-flash",
      "gemini-2.0-flash",
      "gemini-1.5-pro",
      "deepseek-chat",
      "deepseek-reasoner",
      "gpt-4o",
      "gpt-4o-mini",
      "claude-3-5-sonnet",
      "qwen-2.5-coder",
    ],
  },
  {
    id: "deepseek-official",
    name: "DeepSeek 官方 API",
    baseUrl: "https://api.deepseek.com/v1",
    apiKey: "",
    models: ["deepseek-chat", "deepseek-reasoner"],
  },
  {
    id: "openai-official",
    name: "OpenAI 官方 API",
    baseUrl: "https://api.openai.com/v1",
    apiKey: "",
    models: ["gpt-4o", "gpt-4o-mini", "o3-mini", "chatgpt-4o-latest"],
  },
  {
    id: "siliconflow-official",
    name: "硅基流动 (SiliconFlow)",
    baseUrl: "https://api.siliconflow.cn/v1",
    apiKey: "",
    models: [
      "deepseek-ai/DeepSeek-V3",
      "deepseek-ai/DeepSeek-R1",
      "Qwen/Qwen2.5-Coder-32B-Instruct",
      "Qwen/Qwen2.5-72B-Instruct",
    ],
  },
  {
    id: "local-ollama",
    name: "本地私有化 (Ollama)",
    baseUrl: "http://localhost:11434/v1",
    apiKey: "ollama",
    models: ["qwen2.5-coder:7b", "deepseek-r1:8b", "llama3.1:8b"],
  },
];

export const DEFAULT_AI_CONFIG = {
  baseUrl: DEFAULT_AI_ENDPOINTS[0].baseUrl,
  apiKey: DEFAULT_AI_ENDPOINTS[0].apiKey,
  model: DEFAULT_AI_ENDPOINTS[0].models[0],
  enableSkill: true,
  temperature: 0.3,
};

/**
 * 构造三维数字编程智能体专家 System Prompt (支持 build123d, cadquery, logoup 三种模式)
 */
export function getAiSystemPrompt(
  mode: AiProgrammingMode = "build123d",
  enableSkill: boolean = true
): string {
  if (mode === "cadquery") {
    return `你是由灵机实验室开发的「CadQuery 3D 参数化建模专家智能体」，精通基于 Python CadQuery 2.x (OpenCASCADE 内核) 的 3D CAD 建模。

### 一、CadQuery 核心架构与 API 规范
1. **统一工作平面模式 (Workplane)**：
   - 必须使用 \`import cadquery as cq\` 开头；
   - 模型构建以 \`result = cq.Workplane("XY")...\` 链式调用起步；
   - 基础 3D 实体方法：
     - \`.box(length, width, height)\`：创建长方体；
     - \`.cylinder(height, radius)\`：创建圆柱体；
     - \`.sphere(radius)\`：创建球体；
     - \`.cone(height, radius1, radius2)\`：创建圆锥/圆台；
   - 工作面附着与方位选择器：
     - \`.faces(">Z").workplane()\`：在最高顶面新建工作平面；
     - \`.faces("<Z").workplane()\`：在最低底面新建工作平面；
     - \`.faces(">X").workplane()\` / \`.faces(">Y").workplane()\`；
   - 2D 草图图元与特征生长：
     - \`.circle(radius).extrude(distance)\`：圆草图向上拉伸加胶；
     - \`.rect(width, height).cutThruAll()\`：矩形截面贯穿挖槽；
     - \`.hole(diameter, depth)\`：打孔；
     - \`.cboreHole(diameter, cboreDiameter, cboreDepth, depth)\`：沉头螺栓孔；
   - 拓扑处理特征：
     - \`.edges("|Z").fillet(radius)\`：竖直轮廓边倒圆角；
     - \`.edges().chamfer(length)\`：倒斜角；
     - \`.shell(thickness)\`：薄壁抽壳；
2. **输出规范**：
   - 始终使用简体中文回答，解释每一步几何思路与参数设计意图；
   - 最终模型对象必须赋值给 \`result\` 变量；
   - 代码块必须使用 \`\`\`python 包裹，语法完整且可在 CadQuery 环境中直接运行呈现。`;
  }

  if (mode === "logoup") {
    return `你是由灵机实验室开发的「LogoUp 3D 几何建模专家智能体」，精通基于 Python build123d 的海龟式三维空间运动与立体造型。

### 一、LogoUp 3D 核心指令与心智体系
1. **代码头部引用规范**：
   必须包含：
   \`\`\`python
   from build123d import *
   from backend.logoup3d import *
   \`\`\`
2. **空间海龟位姿运动与朝向控制**：
   - 沿当前朝向平移：\`fd(dist)\` (前进), \`bk(dist)\` (后退)；
   - 垂向运动：\`step_up(dist)\` (向上抬升), \`step_down(dist)\` (向下降低)；
   - 水平偏航旋转：\`rt(angle)\` (右转角度), \`lt(angle)\` (左转角度)；
   - 俯仰旋转：\`pitch_up(deg)\` (向上仰头), \`pitch_down(deg)\` (向下低头)；
   - 翻滚旋转：\`roll_right(deg)\` (右翻滚), \`roll_left(deg)\` (左翻滚)；
   - 游标原点复位：\`home()\`；空间绝对定位：\`set_cursor(x, y, z)\`；
3. **2D 草图图元与特征拉伸**：
   - \`rect(width, height)\`：在当前草图基准平面绘制矩形；
   - \`circle(radius)\`：在当前草图平面绘制圆形；
   - \`regular_polygon(radius, sides)\`：正多边形草图；
   - \`fill_last_sketch()\`：填充当前未闭合/线框草图为面；
   - \`extrude(height)\`：沿当前局部法线方向向上拉伸为实体；
   - \`pyramid(height)\`：沿局部法线向上尖顶锥拉伸（圆草图拉伸为空心/实心尖顶圆锥，拉伸后游标位于底面中心）；
4. **三维构件直接建造 (建造完成后游标默认对齐至构件底面中心)**：
   - \`box(l, w, h)\`：长方体；
   - \`cylinder(r, h)\`：圆柱体；
   - \`cone(r1, h, r2=0)\`：圆锥/圆台；
   - \`pyramid_solid(sides, r, h)\`：棱锥构件；
   - \`sphere(r)\`：球体 (游标位于球心)；
   - \`ellipsoid(rx, ry, rz)\`：三轴半轴椭球体 (游标位于椭球中心)；
   - \`torus(r1, r2)\`：圆环 (游标位于圆环中心)；
5. **循环与几何阵列**：
   - 使用标准 Python 循环 \`for i in range(count):\` 配合位姿运动完成螺旋升降、回旋阶梯、环形阵列等复杂 3D 几何；
6. **输出规范**：
   - 始终使用简体中文回答；
   - 代码块必须使用 \`\`\`python 包裹，严格遵守 LogoUp 3D 语法，可在 3D 视口中实时执行并展示游标与实体！`;
  }

  // 默认 build123d 模式
  if (!enableSkill) {
    return '你是一位资深 Python 3D CAD 编程专家。\n请根据用户的需求，编写严谨、可直接运行的 build123d 代码。\n输出要求：\n1. 使用 Markdown 格式输出回复，代码使用 ```python 包裹；\n2. 代码必须以 `from build123d import *` 开头；\n3. 推荐使用 Builder 模式，如 `with BuildPart() as part:`；\n4. 最终模型可在 3D 视口中实时渲染；\n5. 保持中文说明，解释每一步设计思路。';
  }
  return '你是由灵机实验室开发的「三维数字编程专家智能体」，精通基于现代 Python build123d (OpenCASCADE B-Rep 几何内核) 的参数化 3D 建模。\n\n### 一、核心架构：build123d 建造者哲学 (Builder Pattern)\n1. **首选 Builder 容器模式**：\n   - 使用 `with BuildPart() as part:` 搭建 3D 零件主体；\n   - 基础 3D 实体：`Box(l, w, h)`、`Cylinder(radius=r, height=h)`、`Sphere(radius=r)`、`Cone(bottom_radius, top_radius, height)`；\n   - 布尔运算直接通过 mode 参数原生控制：`mode=Mode.ADD` (并集加胶，默认)、`mode=Mode.SUBTRACT` (差集去胶/挖孔)、`mode=Mode.INTERSECT` (交集)；\n2. **2D 草图与特征生长**：\n   - 草图容器：`with BuildSketch() as sk:` 或附着于已有表面 `with BuildSketch(part.faces().sort_by(Axis.Z)[-1]):`；\n   - 草图图元：`Rectangle(w, h)`、`Circle(radius=r)`、`RegularPolygon(radius=r, side_count=n)`、`Polygon(points)`、`Slot2D(length, width)`；\n   - 草图拉伸成体：`extrude(amount=10)`；回转成型：`revolve(axis=Axis.Z, revolution_arc=360)`；放样：`loft()`；\n3. **定位与高阶阵列 (Locations)**：\n   - 单点空间定位：`with Locations((x, y, z)): ...`；\n   - 矩形网格阵列：`with GridLocations(x_spacing, y_spacing, x_count, y_count): ...`；\n   - 圆周极坐标均布阵列：`with PolarLocations(radius, count): ...`；\n   - 蜂窝六边形阵列：`with HexLocations(apothem, x_count, y_count): ...`；\n4. **后处理特征**：\n   - 倒圆角：`fillet(part.edges(), radius=2)` 或指定边 `part.edges().filter_by(Axis.Z)`；\n   - 倒斜角：`chamfer(part.edges(), length=2)`；\n   - 打孔：`Hole(radius=r, depth=d)`；\n   - 抽壳掏空：`offset(amount=-2, openings=part.faces().sort_by(Axis.Z)[0])`；\n\n### 二、星际工程师《火星拓荒者计划》航天工程知识库\n- **防热大底**：多截面草图放样 `loft()` + 底部耐磨法兰裙边；\n- **加压生活舱**：圆柱外壳 + 负向抽壳 `offset(amount=-3)` + 侧壁舷窗贯穿；\n- **机械法兰**：`Cylinder` + `PolarLocations` 均布 6/8 个螺栓孔；\n- **辐射散热格栅**：极坐标阵列 `PolarLocations` 盲切槽；\n- **推进喷管**：闭合型线绕 `Axis.Z` 回转成型 `revolve()`；\n\n### 三、回答与代码输出规范\n1. 始终使用简体中文回答，语气专业严谨、鼓励探索。\n2. 只要涉及 3D 几何建模，必须提供完整、语法无误、可在 build123d 环境中直接运行的 Python 脚本。\n3. 代码格式严谨：\n```python\nfrom build123d import *\n\n# 1. 建模说明...\nwith BuildPart() as part:\n    Box(20, 20, 10)\n    Cylinder(radius=5, height=20)\n```\n4. 确保脚本一次性在沙箱中成功执行并呈现在 3D 视口中。在代码后附带 2~3 句几何原理解析与关键尺寸说明。';
}

export type ChatMessageContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string; detail?: "auto" | "low" | "high" } };

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string | ChatMessageContentPart[];
}

/**
 * 校验并测试 OpenAI 兼容接口连通性
 */
export async function testAiApiConnection(
  baseUrl: string,
  apiKey: string,
  model: string
): Promise<{ success: boolean; latencyMs?: number; message?: string; rawReply?: string }> {
  const startTime = Date.now();

  try {
    // 优先通过同源后端代理探针（杜绝浏览器跨域与广告插件阻断）
    let response: Response;
    try {
      response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseUrl,
          apiKey,
          model: model.trim(),
          messages: [{ role: "user", content: "Ping" }],
          max_tokens: 20,
          temperature: 0.1,
          stream: false,
        }),
      });
    } catch {
      // 若同源代理接口无法访问，回退至前端直连
      const cleanBaseUrl = baseUrl.replace(/\/+$/, "");
      const targetUrl = cleanBaseUrl.endsWith("/chat/completions")
        ? cleanBaseUrl
        : `${cleanBaseUrl}/chat/completions`;

      response = await fetch(targetUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey.trim()}`,
        },
        body: JSON.stringify({
          model: model.trim(),
          messages: [{ role: "user", content: "Ping" }],
          max_tokens: 20,
          temperature: 0.1,
        }),
      });
    }

    const latencyMs = Date.now() - startTime;

    if (!response.ok) {
      let errDetail = "";
      try {
        const errJson = await response.json();
        errDetail = errJson.error || JSON.stringify(errJson);
      } catch {
        errDetail = (await response.text()).slice(0, 150);
      }
      return {
        success: false,
        latencyMs,
        message: `HTTP ${response.status}: ${errDetail}`,
      };
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "连接成功";

    return {
      success: true,
      latencyMs,
      message: "API 握手成功，智能体就绪！",
      rawReply: reply.trim(),
    };
  } catch (err: any) {
    return {
      success: false,
      latencyMs: Date.now() - startTime,
      message: `网络连接异常: ${err.message || String(err)}`,
    };
  }
}

/**
 * 调用 3D 编程智能体聊天接口（支持流式 SSE 打字机与极速同源转发）
 */
export async function callAiChatCompletion(params: {
  baseUrl: string;
  apiKey: string;
  model: string;
  messages: Array<{ role: "user" | "assistant"; content: string; images?: string[] }>;
  mode?: AiProgrammingMode;
  temperature?: number;
  enableSkill?: boolean;
  onChunk?: (delta: string, fullText: string) => void;
}): Promise<{ reply: string; code?: string; reasoning?: string }> {
  const systemPrompt = getAiSystemPrompt(params.mode || "build123d", params.enableSkill ?? true);

  const fullMessages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    ...params.messages.map((m) => {
      if (m.images && m.images.length > 0) {
        const parts: ChatMessageContentPart[] = [];
        const textContent = m.content?.trim() || "请根据提供的参考图片，编写准确的 3D CAD 参数化建模代码。";
        parts.push({ type: "text", text: textContent });
        for (const img of m.images) {
          parts.push({
            type: "image_url",
            image_url: { url: img, detail: "high" },
          });
        }
        return {
          role: m.role,
          content: parts,
        };
      }
      return {
        role: m.role,
        content: m.content,
      };
    }),
  ];

  const payload = {
    baseUrl: params.baseUrl,
    apiKey: params.apiKey,
    model: (params.model || "gemini-3.8-flash-low").trim(),
    messages: fullMessages,
    temperature: params.temperature ?? 0.3,
    max_tokens: 4096,
    stream: Boolean(params.onChunk),
  };

  let response: Response;

  try {
    // 1. 优先调用同源服务端代理 /api/ai/chat（无 CORS 限制、无插件拦截）
    response = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (netErr: any) {
    // 2. 若代理不可达，尝试直连上游
    const cleanBaseUrl = (params.baseUrl || "https://ag.ljcode.cn/v1").replace(/\/+$/, "");
    const targetUrl = cleanBaseUrl.endsWith("/chat/completions")
      ? cleanBaseUrl
      : `${cleanBaseUrl}/chat/completions`;

    try {
      response = await fetch(targetUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${params.apiKey.trim()}`,
        },
        body: JSON.stringify({
          model: payload.model,
          messages: fullMessages,
          temperature: payload.temperature,
          max_tokens: payload.max_tokens,
          stream: false,
        }),
      });
    } catch (directErr: any) {
      const msg = directErr.message || String(directErr);
      throw new Error(
        `网络请求未能成功送达 (Failed to fetch)。\n排查建议：\n1. 请检查浏览器是否有广告拦截插件（如 uBlock/Brave Shields）拦截跨域请求；\n2. 推荐使用推荐极速模型 [gemini-3.8-flash-low]；\n3. 详细信息: ${msg}`
      );
    }
  }

  if (!response.ok) {
    let errDetail = "";
    try {
      const errJson = await response.json();
      errDetail = errJson.error || JSON.stringify(errJson);
    } catch {
      errDetail = (await response.text()).slice(0, 200);
    }
    throw new Error(`智能体请求失败 (${response.status}): ${errDetail}`);
  }

  // 3. 处理流式传输 (SSE)
  if (params.onChunk && response.body) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let fullReply = "";
    let fullReasoning = "";
    let buffer = "";

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith(":")) continue;
          if (trimmed === "data: [DONE]") break;

          if (trimmed.startsWith("data: ")) {
            try {
              const data = JSON.parse(trimmed.slice(6));
              const delta = data.choices?.[0]?.delta;
              if (delta?.content) {
                fullReply += delta.content;
                params.onChunk(delta.content, fullReply);
              }
              if (delta?.reasoning_content) {
                fullReasoning += delta.reasoning_content;
              }
            } catch {
              // 忽略解析非 JSON 异常
            }
          }
        }
      }
    } catch (streamErr: any) {
      if (!fullReply) {
        throw new Error(`数据流传输中断: ${streamErr.message || String(streamErr)}`);
      }
    }

    // 提取 Python 代码块
    let extractedCode: string | undefined = undefined;
    const pythonMatch = fullReply.match(/```(?:python|py)?\s*([\s\S]*?)```/i);
    if (pythonMatch && pythonMatch[1]) {
      extractedCode = pythonMatch[1].trim();
    }

    return {
      reply: fullReply,
      code: extractedCode,
      reasoning: fullReasoning || undefined,
    };
  }

  // 4. 处理非流式 JSON 响应
  const data = await response.json();
  const choice = data.choices?.[0];
  const message = choice?.message;
  const replyContent = message?.content || "";
  const reasoningContent = message?.reasoning_content || undefined;

  let extractedCode: string | undefined = undefined;
  const pythonMatch = replyContent.match(/```(?:python|py)?\s*([\s\S]*?)```/i);
  if (pythonMatch && pythonMatch[1]) {
    extractedCode = pythonMatch[1].trim();
  }

  return {
    reply: replyContent,
    code: extractedCode,
    reasoning: reasoningContent,
  };
}
