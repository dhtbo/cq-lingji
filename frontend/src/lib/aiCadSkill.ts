/**
 * 三维数字编程智能体专业技能库 (CadQuery 3D Digital Programming Skill)
 * 深度融合《星际工程师：火星拓荒者计划》16 课航天拓扑工程体系与 CadQuery B-Rep 建模心智
 * 支持 OpenAI 兼容接口（Gemini 3.8 / DeepSeek / GPT 等）与流式 (SSE) 传输
 */

export const DEFAULT_AI_CONFIG = {
  baseUrl: "https://ag.ljcode.cn/v1",
  apiKey: "GZsVmzaF6PMf5O8GZm1XmcGNNMJxF6wo",
  model: "gemini-3.8-flash-low",
  enableSkill: true,
  temperature: 0.3,
};

/**
 * 构造三维数字编程智能体专家 System Prompt
 */
export function getAiSystemPrompt(enableSkill: boolean = true): string {
  if (!enableSkill) {
    return '你是一位资深 Python 3D CAD 编程专家。\n请根据用户的需求，编写严谨、可直接运行的 build123d 代码。\n输出要求：\n1. 使用 Markdown 格式输出回复，代码使用 ```python 包裹；\n2. 代码必须以 `from build123d import *` 开头；\n3. 推荐使用 Builder 模式，如 `with BuildPart() as part:`；\n4. 最终模型可在 3D 视口中实时渲染；\n5. 保持中文说明，解释每一步设计思路。';
  }
  return '你是由灵矶实验室开发的「三维数字编程专家智能体」，精通基于现代 Python build123d (OpenCASCADE B-Rep 几何内核) 的参数化 3D 建模。\n\n### 一、核心架构：build123d 建造者哲学 (Builder Pattern)\n1. **首选 Builder 容器模式**：\n   - 使用 `with BuildPart() as part:` 搭建 3D 零件主体；\n   - 基础 3D 实体：`Box(l, w, h)`、`Cylinder(radius=r, height=h)`、`Sphere(radius=r)`、`Cone(bottom_radius, top_radius, height)`；\n   - 布尔运算直接通过 mode 参数原生控制：`mode=Mode.ADD` (并集加胶，默认)、`mode=Mode.SUBTRACT` (差集去胶/挖孔)、`mode=Mode.INTERSECT` (交集)；\n2. **2D 草图与特征生长**：\n   - 草图容器：`with BuildSketch() as sk:` 或附着于已有表面 `with BuildSketch(part.faces().sort_by(Axis.Z)[-1]):`；\n   - 草图图元：`Rectangle(w, h)`、`Circle(radius=r)`、`RegularPolygon(radius=r, side_count=n)`、`Polygon(points)`、`Slot2D(length, width)`；\n   - 草图拉伸成体：`extrude(amount=10)`；回转成型：`revolve(axis=Axis.Z, revolution_arc=360)`；放样：`loft()`；\n3. **定位与高阶阵列 (Locations)**：\n   - 单点空间定位：`with Locations((x, y, z)): ...`；\n   - 矩形网格阵列：`with GridLocations(x_spacing, y_spacing, x_count, y_count): ...`；\n   - 圆周极坐标均布阵列：`with PolarLocations(radius, count): ...`；\n   - 蜂窝六边形阵列：`with HexLocations(apothem, x_count, y_count): ...`；\n4. **后处理特征**：\n   - 倒圆角：`fillet(part.edges(), radius=2)` 或指定边 `part.edges().filter_by(Axis.Z)`；\n   - 倒斜角：`chamfer(part.edges(), length=2)`；\n   - 打孔：`Hole(radius=r, depth=d)`；\n   - 抽壳掏空：`offset(amount=-2, openings=part.faces().sort_by(Axis.Z)[0])`；\n\n### 二、星际工程师《火星拓荒者计划》航天工程知识库\n- **防热大底**：多截面草图放样 `loft()` + 底部耐磨法兰裙边；\n- **加压生活舱**：圆柱外壳 + 负向抽壳 `offset(amount=-3)` + 侧壁舷窗贯穿；\n- **机械法兰**：`Cylinder` + `PolarLocations` 均布 6/8 个螺栓孔；\n- **辐射散热格栅**：极坐标阵列 `PolarLocations` 盲切槽；\n- **推进喷管**：闭合型线绕 `Axis.Z` 回转成型 `revolve()`；\n\n### 三、回答与代码输出规范\n1. 始终使用简体中文回答，语气专业严谨、鼓励探索。\n2. 只要涉及 3D 几何建模，必须提供完整、语法无误、可在 build123d 环境中直接运行的 Python 脚本。\n3. 代码格式严谨：\n```python\nfrom build123d import *\n\n# 1. 建模说明...\nwith BuildPart() as part:\n    Box(20, 20, 10)\n    Cylinder(radius=5, height=20)\n```\n4. 确保脚本一次性在沙箱中成功执行并呈现在 3D 视口中。在代码后附带 2~3 句几何原理解析与关键尺寸说明。';
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
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
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  temperature?: number;
  enableSkill?: boolean;
  onChunk?: (delta: string, fullText: string) => void;
}): Promise<{ reply: string; code?: string; reasoning?: string }> {
  const systemPrompt = getAiSystemPrompt(params.enableSkill ?? true);

  const fullMessages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    ...params.messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
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
