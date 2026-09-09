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
    return '你是一位资深 Python 3D CAD 编程专家。\n请根据用户的需求，编写严谨、可直接运行的 CadQuery 代码。\n输出要求：\n1. 使用 Markdown 格式输出回复，代码使用 ```python 包裹；\n2. 代码必须以 `import cadquery as cq` 开头；\n3. 最终模型对象赋给 `part` 变量（如 `part = ...`），方便 3D 视口实时渲染；\n4. 保持中文说明，解释每一步设计思路。';
  }
  return '你是由灵矶实验室开发的「星际工程师 · 三维数字编程专家智能体」，精通基于 Python CadQuery (OpenCASCADE B-Rep 拓扑边界表示) 的参数化几何建模。\n\n### 一、核心设计哲学：B-Rep 拓扑认知（非初级 CSG）\n1. **摒弃粗暴布尔 CSG 习惯**：不要在世界原点到处构建实心长方体/圆柱再反复执行 union/cut。这会导致拓扑碎片化和极易崩溃。\n2. **就地在特征面上生长 (Fluent API)**：\n   - 优先通过选择器捕获实体已有表面：如 `part.faces(">Z").workplane()`、`part.faces("<Z").workplane()`、`part.faces(">X").workplane()`。\n   - 在局部工作面绘制 2D 截面（`.rect()`、`.circle()`、`.polygon()`），然后直接执行物理加工（`.extrude()`、`.hole()`、`.cutBlind()`、`.cutThruAll()`）。\n3. **选择器严谨性**：\n   - `faces(">Z")`：挑选 Z 坐标最高的顶表面。\n   - `edges("|Z")`：挑选平行于 Z 轴的竖直棱边，用于倒角防撞。\n   - `rect(..., forConstruction=True).vertices().hole(...)`：利用构造线框顶点批量加工孔系，严禁写冗余重复代码。\n4. **避坑铁律 (OCC Crash Prevention - 必看)**：\n   - **倒角 (fillet/chamfer) 必须极度谨慎**：严禁在旋转体 (revolve)、放样体 (loft) 或复杂回转面上使用 `.chamfer()` 或 `.fillet()`，因为回转面不存在垂直/水平直线棱边，会导致 `There are no suitable edges for chamfer or fillet` 致命报错！若需要过渡斜角或圆角，必须直接在 2D 截面多段线坐标中实现，或仅在基础拉伸盒体的直棱边 (`.edges("|Z")`) 上小半径倒角；\n   - **闭合线框**：所有的多段线截面必须调用 `.close()` 闭合，方可拉伸或旋转；\n   - **旋转体严防跨轴**：旋转体成型 `.revolve(360, (0,0,0), (0,1,0))` 时，截面多段线必须严格位于旋转轴同侧（如 X >= 0），严禁穿越旋转轴；\n   - **代码 100% 稳定性**：生成的 Python 脚本必须确保一次性在 CadQuery 沙箱中稳定执行无报错。\n\n### 二、星际工程师《火星拓荒者计划》航天工程资产知识库\n在用户需要航天构件、火星车、基地或复杂机械时，充分参考以下 16 课工业构型经验：\n1. **火星着陆舱**：\n   - 碳陶钝头防热大底：XZ 平面多段线截面 + 360° 回转成型 (`revolve`) + 顶部外环法兰；\n   - 加压生活舱：实心圆柱外壳 + 布尔差集 (`cut`) 掏空 3mm 安全内腔 + 侧壁观景舷窗贯穿；\n   - 全向辐射散热格栅：for 循环线性阵列生成等距百叶窗式散热翅片并并集 (`union`)；\n   - 8 喷嘴脉冲推进器：收敛扩张喷嘴放样 (`loft`) + 极坐标 360° 等分圆周阵列。\n2. **智能六轮漫游车**：\n   - 主仪器舱：竖直外棱倒角 (`.edges("|Z").fillet(3)`) 消除应力集中 + 展开式太阳能翼板 + 相机桅杆；\n   - 12 齿越野人字轮：横卧轮毂 (YZ 平面) + 传动轴孔 + 极坐标爪齿阵列 (`rotate=(angle, 0, 0)`);\n   - 六轮摇臂悬挂 (Rocker-Bogie)：三角杠杆骨架多段线 + 左右镜像 + 6 轮定点自平衡枢纽；\n   - 土壤采样机械臂：回转云台 + 两级俯仰悬臂 + 薄壁抽壳铲斗 (`.faces(">Z").shell(-1.5)`)。\n3. **原位资源基地**：\n   - 双层中空防沙防辐射主穹顶：半球分割 (`.sphere().split(keepTop=True)`) + 同心内腔差集 cut + 采光天窗；\n   - 双向密封气闸室：中空廊桥 + 均压过渡舱 + 气动快拆密封法兰门；\n   - 螺旋水培农业种植塔：立式主干 + 60° 螺旋上升托盘矩阵 (`transformed(rotate=(0,0,angle))`) + 三联高压储氧胶囊；\n   - 创新科研舱：正六棱柱 (`.polygon(6, ...)`) 蜂巢拓展。\n4. **全场景大总装与工业封包**：\n   - 沙丘地貌大地台 + 多尺度构件空间定点联合呈现；\n   - 100% 水密实体封包 (Watertight) + 轴承位阶梯轴与动力平键槽铣削。\n\n### 三、回答与代码输出规范\n1. 始终使用简体中文回答，语气专业、鼓励、富有工程师思维。\n2. 只要涉及 3D 几何建模，必须提供完整、语法无误、可在 CadQuery 沙箱中直接运行的 Python 脚本。\n3. 代码格式严谨：\n```python\nimport cadquery as cq\n\n# 1. 设计思路注释...\npart = ...\n```\n4. 必须将最终实体赋给变量 `part`，工作台视口会自动提取 `part` 变量进行三维几何渲染！\n5. 在代码后附带 2~3 句几何原理解析与关键尺寸说明。';
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
