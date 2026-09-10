/**
 * 工程存档与本地文件存储工具库 (Project Storage & File Management)
 * 支持多文件/文件夹工程 LocalStorage 自动保存/恢复、Python 单脚本下载、.cqproj.json 工程归档导出与导入
 */
import { ProjectWorkspace, ProjectExportArchive } from "@/types/project";
import {
  createDefaultProject,
  exportWorkspaceArchive,
  importWorkspaceFromArchive,
  updateFileContent,
  findNodeByPath,
} from "./projectTree";

const WORKSPACE_STORAGE_KEY = "cadquery_studio_active_workspace";
const LEGACY_STORAGE_KEY = "cadquery_studio_active_project";

/**
 * 将多文件工程全量保存至浏览器本地存储
 */
export function saveWorkspaceToLocalStorage(workspace: ProjectWorkspace): boolean {
  try {
    const archive = exportWorkspaceArchive(workspace);
    localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(archive));
    return true;
  } catch (e) {
    console.error("保存工程至本地存储失败:", e);
    return false;
  }
}

/**
 * 从浏览器本地存储恢复工程 (支持 2.0 多文件与 1.0 单文件平滑迁移)
 */
export function loadWorkspaceFromLocalStorage(): ProjectWorkspace | null {
  try {
    // 优先读取 2.0 格式
    const raw2 = localStorage.getItem(WORKSPACE_STORAGE_KEY);
    if (raw2) {
      const parsed = JSON.parse(raw2);
      return importWorkspaceFromArchive(parsed);
    }

    // 兜底读取 1.0 格式
    const raw1 = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (raw1) {
      const parsed1 = JSON.parse(raw1);
      const ws = createDefaultProject(parsed1.projectName || "我的3D作品", parsed1.code || "");
      if (parsed1.blocklyXml) {
        ws.root = updateFileContent(ws.root, "main.py", parsed1.code || "", parsed1.blocklyXml);
      }
      return ws;
    }

    return null;
  } catch (e) {
    console.error("读取本地存储工程失败:", e);
    return null;
  }
}

/**
 * 兼容旧版的保存接口 (保存单文件/活动文件到旧 Key，同时保障向下兼容)
 */
export function saveProjectToLocalStorage(projectName: string, code: string, blocklyXml?: string): boolean {
  try {
    const data = {
      version: "1.0",
      projectName: projectName || "我的3D作品.py",
      code,
      blocklyXml,
      savedAt: Date.now(),
    };
    localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (e) {
    console.error("保存旧版工程失败:", e);
    return false;
  }
}

/**
 * 兼容旧版的读取接口
 */
export function loadProjectFromLocalStorage() {
  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * 触发浏览器直接下载 Python 源码文件 (.py)
 */
export function downloadPythonFile(filename: string, code: string) {
  let validName = (filename || "我的3D作品.py").trim();
  if (!validName.endsWith(".py")) {
    validName += ".py";
  }

  const blob = new Blob([code], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = validName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * 导出多文件工程完整归档文件 (.cqproj.json 或 .cq.json)
 */
export function exportWorkspaceArchiveFile(workspace: ProjectWorkspace) {
  let validName = (workspace.name || "CadProject").trim();
  if (validName.endsWith(".py")) {
    validName = validName.slice(0, -3);
  }
  const fullFilename = `${validName}.cqproj.json`;

  const archiveData = exportWorkspaceArchive(workspace);
  const jsonStr = JSON.stringify(archiveData, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fullFilename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * 兼容旧版导出接口
 */
export function exportProjectArchive(projectName: string, code: string, blocklyXml?: string) {
  let validName = (projectName || "我的3D工程").trim();
  if (validName.endsWith(".py")) {
    validName = validName.slice(0, -3);
  }
  const fullFilename = `${validName}.cq.json`;

  const archiveData = {
    version: "1.0",
    projectName,
    code,
    blocklyXml,
    savedAt: Date.now(),
  };

  const jsonStr = JSON.stringify(archiveData, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fullFilename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * 读取用户上传的工程归档或单文件 (.py, .cqproj.json, .cq.json)
 */
export function readProjectOrWorkspaceFile(
  file: File
): Promise<{ workspace: ProjectWorkspace; isSingleFile: boolean }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        if (file.name.endsWith(".cqproj.json") || file.name.endsWith(".json")) {
          const parsed = JSON.parse(text);
          if (parsed.version === "2.0" && parsed.files) {
            const ws = importWorkspaceFromArchive(parsed);
            resolve({ workspace: ws, isSingleFile: false });
            return;
          } else if (parsed.code) {
            // 兼容 1.0
            const ws = createDefaultProject(parsed.projectName || file.name.replace(/\.cq\.json$/, ""), parsed.code);
            if (parsed.blocklyXml) {
              ws.root = updateFileContent(ws.root, "main.py", parsed.code, parsed.blocklyXml);
            }
            resolve({ workspace: ws, isSingleFile: true });
            return;
          }
        }

        // 单个 Python 脚本
        const ws = createDefaultProject(file.name.replace(/\.py$/, ""), text);
        resolve({ workspace: ws, isSingleFile: true });
      } catch (err) {
        reject(new Error("文件解析失败，请确保格式正确"));
      }
    };
    reader.onerror = () => reject(new Error("文件读取出错"));
    reader.readAsText(file, "utf-8");
  });
}
