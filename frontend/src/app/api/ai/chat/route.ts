import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 3D 编程智能体服务端转发代理 (Next.js App Route)
 * 彻底消除浏览器跨域 (CORS) 限制、广告插件阻断、
 * 以及模型生成耗时导致的 504 Gateway Timeout 浏览器报错
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      baseUrl = "https://ag.ljcode.cn/v1",
      apiKey = "",
      model = "gemini-3.8-flash-low",
      messages = [],
      temperature = 0.3,
      max_tokens = 4096,
      stream = false,
    } = body;

    if (!apiKey) {
      return NextResponse.json(
        { error: "未提供 API Key，请在工作台「设置 ➔ 3D 编程智能体」中配置有效密钥。" },
        { status: 400 }
      );
    }

    const cleanBaseUrl = (baseUrl || "https://ag.ljcode.cn/v1").replace(/\/+$/, "");
    const targetUrl = cleanBaseUrl.endsWith("/chat/completions")
      ? cleanBaseUrl
      : `${cleanBaseUrl}/chat/completions`;

    // 向上游 OpenAI 兼容接口发起请求 (Node.js 端不受浏览器 CORS 限制)
    const upstreamRes = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify({
        model: (model || "gemini-3.8-flash-low").trim(),
        messages,
        temperature,
        max_tokens,
        stream,
      }),
    });

    if (!upstreamRes.ok) {
      const errText = await upstreamRes.text();
      let friendlyMessage = `上游接口调用失败 (${upstreamRes.status})`;

      if (upstreamRes.status === 504) {
        friendlyMessage = `上游网关响应超时 (504 Gateway Timeout)。模型 [${model}] 推理耗时过长，建议在设置中切换极速模型 [gemini-3.8-flash-low] 或稍后重试。`;
      } else if (upstreamRes.status === 503) {
        friendlyMessage = `上游服务暂时不可用 (503 Service Unavailable)：${errText.slice(0, 160)}。该模型在目标代理商可能暂无配额，请在设置中切换模型。`;
      } else if (upstreamRes.status === 401) {
        friendlyMessage = "API 密钥验证失败 (401 Unauthorized)。请在设置中检查 API Key 是否正确填写。";
      } else if (upstreamRes.status === 404) {
        friendlyMessage = `接口路径或模型未找到 (404 Not Found)：请核对 Base URL [${baseUrl}] 与模型 [${model}]。`;
      } else {
        friendlyMessage = `${friendlyMessage}: ${errText.slice(0, 200)}`;
      }

      return NextResponse.json({ error: friendlyMessage }, { status: upstreamRes.status });
    }

    // 支持流式传输 (SSE)
    if (stream && upstreamRes.body) {
      return new Response(upstreamRes.body, {
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
          "X-Accel-Buffering": "no",
        },
      });
    }

    // 非流式 JSON 回显
    const data = await upstreamRes.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      {
        error: `服务代理端捕获异常: ${err.message || String(err)}。若使用内网或代理，请检查网络连通性。`,
      },
      { status: 500 }
    );
  }
}
