/**
 * 后端 API 交互客户端
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface StepInfo {
  step: number;
  code: string;
  end_line: number;
}

export interface RenderResult {
  status: "success" | "error";
  execution_time_ms: number;
  mesh: any;
  steps?: StepInfo[];
  current_step?: number;
  total_steps?: number;
  stdout?: string;
  detail?: string;
}

/**
 * 请求后端渲染 build123d / CadQuery 脚本并获取网格数据，支持单步时间旅行
 */
export async function renderBuild123dCode(
  code: string,
  options: {
    step?: number;
    tolerance?: number;
    angular_tolerance?: number;
    color?: string;
  } = {}
): Promise<RenderResult> {
  const response = await fetch(`${API_BASE}/api/v1/render/b3d`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      code,
      step: options.step,
      tolerance: options.tolerance ?? 0.01,
      angular_tolerance: options.angular_tolerance ?? 0.1,
      color: options.color ?? "#3b82f6",
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(errData.detail || `服务端响应错误 (${response.status})`);
  }

  return await response.json();
}

export const renderCadQueryCode = renderBuild123dCode;

/**
 * 触发 STL 或 STEP 文件下载
 */
export async function downloadCadExport(
  code: string,
  format: "stl" | "step",
  filename?: string
): Promise<void> {
  const endpoint = `${API_BASE}/api/v1/export/${format}`;
  const defaultName = `cad_model_${Date.now()}.${format}`;
  const outName = filename || defaultName;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      code,
      filename: outName,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: "导出失败" }));
    throw new Error(err.detail || "导出失败");
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = outName;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

/**
 * 后端服务状态检查
 */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/health`, {
      method: "GET",
      signal: AbortSignal.timeout(3000),
    });
    return res.ok;
  } catch {
    return false;
  }
}
