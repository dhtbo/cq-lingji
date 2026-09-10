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

export interface RenderOptions {
  step?: number;
  tolerance?: number;
  angular_tolerance?: number;
  color?: string;
  files?: Record<string, string>;
  entrypoint?: string;
}

/**
 * 请求后端渲染 build123d / CadQuery 脚本并获取网格数据，支持单步时间旅行与多文件工程
 */
export async function renderBuild123dCode(
  code: string,
  options: RenderOptions = {}
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
      files: options.files,
      entrypoint: options.entrypoint,
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
 * 触发 STL 或 STEP 文件下载，支持多文件工程
 */
export async function downloadCadExport(
  code: string,
  format: "stl" | "step",
  filename?: string,
  files?: Record<string, string>,
  entrypoint?: string
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
      files,
      entrypoint,
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

export interface PrintCheckItem {
  name: string;
  passed: boolean;
  level: "success" | "warning" | "error";
  detail: string;
}

export interface PrintabilityReport {
  status: "success" | "warning" | "error";
  message?: string;
  score?: number;
  health_score?: number;
  grade?: string;
  dimensions?: {
    x: number;
    y: number;
    z: number;
  };
  fits_bed?: boolean;
  bed_size?: [number, number, number];
  volume_cm3?: number;
  area_cm2?: number;
  is_watertight?: boolean;
  is_solid?: boolean;
  solids_count?: number;
  estimated_filament_g?: number;
  estimated_hours?: number;
  metrics?: {
    volume_cm3?: number;
    filament_weight_g?: number;
    estimated_hours?: number;
  };
  checks?: PrintCheckItem[];
  suggestions?: string[];
}

/**
 * 3D 打印体检接口请求
 */
export async function analyzeCadPrintability(
  code: string,
  bedSize: { x: number; y: number; z: number } = { x: 220, y: 220, z: 250 },
  files?: Record<string, string>,
  entrypoint?: string
): Promise<PrintabilityReport> {
  const response = await fetch(`${API_BASE}/api/v1/analyze/printability`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      code,
      bed_x: bedSize.x,
      bed_y: bedSize.y,
      bed_z: bedSize.z,
      files,
      entrypoint,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: "体检服务响应异常" }));
    throw new Error(err.detail || "体检服务响应异常");
  }

  return await response.json();
}

export interface ModelPreviewResult {
  status: "success" | "error";
  execution_time_ms?: number;
  filename: string;
  format?: string;
  mesh?: any;
  detail?: string;
}

/**
 * 请求后端解析模型资产 (STEP, STL, SVG, BREP 等) 并生成 3D 拓扑网格
 * @param filename 模型文件名
 * @param content 模型内容 (UTF-8 文本或 Base64 Data URL)
 * @param color 默认预览基础着色
 * @param tolerance 细分公差
 * @returns 包含 mesh 网格的模型预览结果
 */
export async function previewModelAsset(
  filename: string,
  content: string,
  color: string = "#10B981",
  tolerance: number = 0.01
): Promise<ModelPreviewResult> {
  const response = await fetch(`${API_BASE}/api/v1/preview-model`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      filename,
      content,
      color,
      tolerance,
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(errData.detail || `模型资产解析失败 (${response.status})`);
  }

  return await response.json();
}

