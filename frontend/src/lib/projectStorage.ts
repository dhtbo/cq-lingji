/**
 * 工程存档与本地文件存储工具库 (Project Storage & File Management)
 * 支持 LocalStorage 自动保存/恢复、Python 脚本下载、.cq.json 归档导出与导入
 */

export interface ProjectData {
  version: "1.0";
  projectName: string;
  code: string;
  blocklyXml?: string;
  savedAt: number;
}

const STORAGE_KEY = "cadquery_studio_active_project";

/**
 * 将当前工程全量保存至浏览器本地存储
 */
export function saveProjectToLocalStorage(projectName: string, code: string, blocklyXml?: string): boolean {
  try {
    const data: ProjectData = {
      version: "1.0",
      projectName: projectName || "我的3D作品.py",
      code,
      blocklyXml,
      savedAt: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (e) {
    console.error("保存至本地存储失败:", e);
    return false;
  }
}

/**
 * 从浏览器本地存储恢复工程
 */
export function loadProjectFromLocalStorage(): ProjectData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ProjectData;
  } catch (e) {
    console.error("读取本地存储工程失败:", e);
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
 * 导出完整工程归档文件 (.cq.json)
 */
export function exportProjectArchive(projectName: string, code: string, blocklyXml?: string) {
  let validName = (projectName || "我的3D工程").trim();
  if (validName.endsWith(".py")) {
    validName = validName.slice(0, -3);
  }
  const fullFilename = `${validName}.cq.json`;

  const archiveData: ProjectData = {
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
 * 读取用户上传的本地文件 (.py 或 .cq.json)
 */
export function readProjectFile(
  file: File
): Promise<{ projectName: string; code: string; blocklyXml?: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        if (file.name.endsWith(".json") || file.name.endsWith(".cq.json")) {
          // JSON 归档格式
          const parsed = JSON.parse(text);
          resolve({
            projectName: parsed.projectName || file.name.replace(/\.cq\.json$/, ""),
            code: parsed.code || "",
            blocklyXml: parsed.blocklyXml,
          });
        } else {
          // 纯 Python 代码文件
          resolve({
            projectName: file.name,
            code: text,
          });
        }
      } catch (err) {
        reject(new Error("文件解析失败，请确保格式正确"));
      }
    };
    reader.onerror = () => reject(new Error("文件读取出错"));
    reader.readAsText(file, "utf-8");
  });
}
