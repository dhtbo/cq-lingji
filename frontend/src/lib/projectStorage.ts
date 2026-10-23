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
const PROJECTS_INDEX_KEY = "cadquery_projects_index";

export interface ProjectMetadata {
  id: string;
  name: string;
  updatedAt: number;
  entrypoint?: string;
  filesCount?: number;
  sourceType?: "local_cache" | "local_folder" | "file";
  folderPath?: string;
}

/**
 * 获取本地所有暂存的项目文件夹列表
 */
export function listAllProjectFolders(): ProjectMetadata[] {
  try {
    const raw = localStorage.getItem(PROJECTS_INDEX_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * 获取最近打开的历史项目列表（默认前 5 条）
 */
export function getRecentProjects(limit = 5): ProjectMetadata[] {
  const list = listAllProjectFolders();
  return list.slice(0, limit);
}

/**
 * 记录一个项目至最近历史
 */
export function recordRecentProject(
  id: string,
  name: string,
  entrypoint?: string,
  filesCount?: number,
  sourceType: "local_cache" | "local_folder" | "file" = "local_cache",
  folderPath?: string
) {
  try {
    const list = listAllProjectFolders().filter((p) => p.id !== id && p.name !== name);
    list.unshift({
      id,
      name,
      updatedAt: Date.now(),
      entrypoint,
      filesCount: filesCount ?? 1,
      sourceType,
      folderPath,
    });
    localStorage.setItem(PROJECTS_INDEX_KEY, JSON.stringify(list.slice(0, 15)));
  } catch (e) {
    console.error("记录最近历史项目失败:", e);
  }
}

/**
 * 清空最近打开的历史项目
 */
export function clearRecentProjects(): void {
  try {
    localStorage.removeItem(PROJECTS_INDEX_KEY);
  } catch {}
}

/**
 * 按项目文件夹独立暂存工程
 */
export function saveWorkspaceByFolder(
  workspace: ProjectWorkspace,
  sourceType: "local_cache" | "local_folder" | "file" = "local_cache",
  folderPath?: string
): boolean {
  try {
    const archive = exportWorkspaceArchive(workspace);
    const projectId = workspace.id || workspace.name || "default_project";
    const projectKey = `cadquery_proj_${projectId}`;

    localStorage.setItem(projectKey, JSON.stringify(archive));
    localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(archive));

    // 更新索引列表 (将当前保存的工程排至第一位)
    const filesCount = archive.files ? Object.keys(archive.files).length : 1;
    recordRecentProject(projectId, workspace.name || "我的3D作品", workspace.entrypoint, filesCount, sourceType, folderPath);
    return true;
  } catch (e) {
    console.error("按项目文件夹暂存工程失败:", e);
    return false;
  }
}

/**
 * 从指定项目文件夹缓存恢复工程
 */
export function loadWorkspaceByFolder(projectId: string): ProjectWorkspace | null {
  try {
    const projectKey = `cadquery_proj_${projectId}`;
    const raw = localStorage.getItem(projectKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      const ws = importWorkspaceFromArchive(parsed);
      // 设为当前活跃工作区
      localStorage.setItem(WORKSPACE_STORAGE_KEY, raw);
      return ws;
    }
    return null;
  } catch (e) {
    console.error("从项目文件夹恢复工程失败:", e);
    return null;
  }
}

/**
 * 删除指定项目的本地缓存文件夹与数据
 */
export function deleteWorkspaceFolder(projectId: string): boolean {
  try {
    const projectKey = `cadquery_proj_${projectId}`;
    localStorage.removeItem(projectKey);

    // 从索引列表中移除
    const list = listAllProjectFolders().filter((p) => p.id !== projectId);
    localStorage.setItem(PROJECTS_INDEX_KEY, JSON.stringify(list));

    // 如果当前活跃工作区也是该项目，同时清空当前暂存
    const rawActive = localStorage.getItem(WORKSPACE_STORAGE_KEY);
    if (rawActive) {
      try {
        const parsed = JSON.parse(rawActive);
        if (parsed.id === projectId || parsed.name === projectId) {
          localStorage.removeItem(WORKSPACE_STORAGE_KEY);
        }
      } catch {}
    }
    return true;
  } catch (e) {
    console.error("删除项目本地缓存失败:", e);
    return false;
  }
}

/**
 * 清空当前活跃工作区暂存
 */
export function clearActiveWorkspaceStorage(): void {
  try {
    localStorage.removeItem(WORKSPACE_STORAGE_KEY);
  } catch {}
}

/**
 * 将多文件工程全量保存至浏览器本地存储
 */
export function saveWorkspaceToLocalStorage(workspace: ProjectWorkspace): boolean {
  return saveWorkspaceByFolder(workspace);
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
export async function readProjectOrWorkspaceFile(
  file: File
): Promise<{ workspace: ProjectWorkspace; isSingleFile: boolean }> {
  let text = "";
  if (typeof file.text === "function") {
    text = await file.text();
  } else {
    text = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve((e.target?.result as string) || "");
      reader.onerror = () => reject(new Error("文件读取出错"));
      reader.readAsText(file, "utf-8");
    });
  }

  const lowerName = file.name.toLowerCase();
  if (lowerName.endsWith(".cqproj.json") || lowerName.endsWith(".json") || lowerName.endsWith(".cq.json")) {
    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error("JSON 格式解析失败，请确保工程文件有效");
    }

    if (parsed.files && typeof parsed.files === "object") {
      const ws = importWorkspaceFromArchive(parsed);
      if (!parsed.projectName || parsed.projectName === "CadProject" || parsed.projectName === "导入工程") {
        const fileBaseName = file.name.replace(/\.(cqproj|cq)?\.json$/i, "").trim();
        if (fileBaseName) {
          ws.name = fileBaseName;
          if (ws.root) ws.root.name = fileBaseName;
        }
      }
      return { workspace: ws, isSingleFile: false };
    } else if (parsed.root && parsed.name) {
      // 兼容直接导入 ProjectWorkspace 结构
      return { workspace: parsed as ProjectWorkspace, isSingleFile: false };
    } else if (parsed.code !== undefined) {
      // 兼容 1.0 单文件存档
      const cleanName = parsed.projectName || file.name.replace(/\.(cqproj|cq)?\.json$/i, "");
      const ws = createDefaultProject(cleanName, parsed.code || "");
      if (parsed.blocklyXml) {
        ws.root = updateFileContent(ws.root, "main.py", parsed.code || "", parsed.blocklyXml);
      }
      return { workspace: ws, isSingleFile: true };
    }
  }

  // 单个 Python 脚本
  const ws = createDefaultProject(file.name.replace(/\.py$/i, ""), text);
  return { workspace: ws, isSingleFile: true };
}

/**
 * 调用浏览器 Web File System Access API 打开原生操作系统本地文件夹
 * 递归读取其下代码与 CAD 资源文件构建多文件工程工作区
 */
export async function openLocalDirectoryPicker(): Promise<{
  workspace: ProjectWorkspace;
  folderName: string;
} | null> {
  // 1. 优先使用现代标准的 window.showDirectoryPicker
  if (typeof window !== "undefined" && "showDirectoryPicker" in window) {
    try {
      const dirHandle = await (window as any).showDirectoryPicker({
        mode: "read",
      });
      if (!dirHandle) return null;

      const folderName = dirHandle.name || "本地项目文件夹";
      const filesMap: Record<string, string> = {};

      async function scanDirectory(handle: any, currentPath: string = "") {
        for await (const entry of handle.values()) {
          const entryPath = currentPath ? `${currentPath}/${entry.name}` : entry.name;
          if (entry.kind === "file") {
            const ext = entry.name.split(".").pop()?.toLowerCase() || "";
            // 过滤常见代码与 CAD 资产文件
            if (["py", "json", "stl", "step", "stp", "brep", "svg", "dxf", "txt", "md"].includes(ext)) {
              try {
                const file = await entry.getFile();
                if (["stl", "step", "stp", "brep"].includes(ext)) {
                  const buf = await file.arrayBuffer();
                  const bytes = new Uint8Array(buf);
                  let binary = "";
                  for (let i = 0; i < bytes.byteLength; i++) {
                    binary += String.fromCharCode(bytes[i]);
                  }
                  filesMap[entryPath] = btoa(binary);
                } else {
                  const text = await file.text();
                  filesMap[entryPath] = text;
                }
              } catch (e) {
                console.warn(`读取文件失败: ${entryPath}`, e);
              }
            }
          } else if (entry.kind === "directory") {
            if (!entry.name.startsWith(".") && !["node_modules", "__pycache__", "venv", ".git"].includes(entry.name)) {
              await scanDirectory(entry, entryPath);
            }
          }
        }
      }

      await scanDirectory(dirHandle);

      if (Object.keys(filesMap).length === 0) {
        throw new Error("所选文件夹中未找到支持的代码或 CAD 文件 (.py, .json, .stl, .step 等)");
      }

      const filesObject: Record<string, { content: string; blocklyXml?: string }> = {};
      for (const [path, content] of Object.entries(filesMap)) {
        filesObject[path] = { content };
      }

      const archive: ProjectExportArchive = {
        version: "2.0",
        projectName: folderName,
        files: filesObject,
        entrypoint: filesMap["main.py"] ? "main.py" : Object.keys(filesMap).find((f) => f.endsWith(".py")) || Object.keys(filesMap)[0],
        savedAt: Date.now(),
      };
      const ws = importWorkspaceFromArchive(archive);
      return { workspace: ws, folderName };
    } catch (err: any) {
      if (err.name === "AbortError") {
        return null;
      }
      throw err;
    }
  }

  // 2. 降级方案：使用 input webkitdirectory
  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    (input as any).webkitdirectory = true;
    input.style.display = "none";
    input.onchange = async (e: any) => {
      const files: FileList = e.target?.files;
      if (!files || files.length === 0) {
        resolve(null);
        return;
      }
      try {
        const folderName = files[0].webkitRelativePath.split("/")[0] || "本地项目";
        const filesMap: Record<string, string> = {};

        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const relativePath = file.webkitRelativePath.substring(folderName.length + 1);
          if (!relativePath) continue;
          const ext = file.name.split(".").pop()?.toLowerCase() || "";
          if (["py", "json", "stl", "step", "stp", "brep", "svg", "dxf", "txt", "md"].includes(ext)) {
            if (["stl", "step", "stp", "brep"].includes(ext)) {
              const buf = await file.arrayBuffer();
              const bytes = new Uint8Array(buf);
              let binary = "";
              for (let j = 0; j < bytes.byteLength; j++) {
                binary += String.fromCharCode(bytes[j]);
              }
              filesMap[relativePath] = btoa(binary);
            } else {
              filesMap[relativePath] = await file.text();
            }
          }
        }

        const filesObject: Record<string, { content: string; blocklyXml?: string }> = {};
        for (const [path, content] of Object.entries(filesMap)) {
          filesObject[path] = { content };
        }

        const archive: ProjectExportArchive = {
          version: "2.0",
          projectName: folderName,
          files: filesObject,
          entrypoint: filesMap["main.py"] ? "main.py" : Object.keys(filesMap).find((f) => f.endsWith(".py")) || Object.keys(filesMap)[0],
          savedAt: Date.now(),
        };
        const ws = importWorkspaceFromArchive(archive);
        resolve({ workspace: ws, folderName });
      } catch (err) {
        reject(err);
      } finally {
        if (input.parentNode) {
          input.parentNode.removeChild(input);
        }
      }
    };
    document.body.appendChild(input);
    input.click();
  });
}
