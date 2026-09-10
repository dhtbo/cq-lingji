/**
 * 文件夹式工程树操作工具库 (Project Tree Immutable Utilities)
 */
import { ProjectFileNode, ProjectWorkspace, NodeType, ProjectExportArchive } from "@/types/project";

/**
 * 标准化路径分隔符并去除首尾斜杠
 */
export function normalizePath(p: string): string {
  return p.replace(/\\/g, "/").replace(/^\/+|\/+$/g, "");
}

/**
 * 递归提取树中所有文件为扁平字典 { "path/to/file.py": "code" }
 */
export function getFlatFiles(node: ProjectFileNode): Record<string, string> {
  const result: Record<string, string> = {};

  function traverse(curr: ProjectFileNode) {
    if (curr.type === "file") {
      result[curr.path] = curr.content ?? "";
    } else if (curr.children) {
      for (const child of curr.children) {
        traverse(child);
      }
    }
  }

  traverse(node);
  return result;
}

/**
 * 根据规范化相对路径查找节点
 */
export function findNodeByPath(root: ProjectFileNode, targetPath: string): ProjectFileNode | null {
  const norm = normalizePath(targetPath);
  if (normalizePath(root.path) === norm) return root;

  if (root.children) {
    for (const child of root.children) {
      const found = findNodeByPath(child, norm);
      if (found) return found;
    }
  }
  return null;
}

/**
 * 获取所有文件的路径列表
 */
export function getAllFilePaths(root: ProjectFileNode): string[] {
  const paths: string[] = [];
  function traverse(curr: ProjectFileNode) {
    if (curr.type === "file") {
      paths.push(curr.path);
    } else if (curr.children) {
      for (const child of curr.children) {
        traverse(child);
      }
    }
  }
  traverse(root);
  return paths;
}

/**
 * 在指定父文件夹下添加新节点 (文件或目录)
 */
export function addNode(
  root: ProjectFileNode,
  parentPath: string,
  name: string,
  type: NodeType,
  initialContent: string = ""
): ProjectFileNode {
  const normParent = normalizePath(parentPath);
  const cleanName = name.trim();
  if (!cleanName) return root;

  const newPath = normParent ? `${normParent}/${cleanName}` : cleanName;

  function cloneAndAdd(curr: ProjectFileNode): ProjectFileNode {
    const currNorm = normalizePath(curr.path);
    if (currNorm === normParent && curr.type === "directory") {
      // 检查重名
      const existing = curr.children?.some((c) => c.name === cleanName);
      if (existing) {
        return curr;
      }
      const newNode: ProjectFileNode = {
        id: `node_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        name: cleanName,
        path: newPath,
        type,
        content: type === "file" ? initialContent : undefined,
        children: type === "directory" ? [] : undefined,
        isEntry: false,
      };
      return {
        ...curr,
        children: [...(curr.children || []), newNode],
      };
    }

    if (curr.children) {
      return {
        ...curr,
        children: curr.children.map(cloneAndAdd),
      };
    }
    return curr;
  }

  return cloneAndAdd(root);
}

/**
 * 删除指定路径的节点
 */
export function deleteNode(root: ProjectFileNode, targetPath: string): ProjectFileNode {
  const normTarget = normalizePath(targetPath);
  if (!normTarget || normTarget === normalizePath(root.path)) {
    // 禁止删除根目录
    return root;
  }

  function cloneAndDelete(curr: ProjectFileNode): ProjectFileNode {
    if (!curr.children) return curr;
    return {
      ...curr,
      children: curr.children
        .filter((child) => normalizePath(child.path) !== normTarget)
        .map(cloneAndDelete),
    };
  }

  return cloneAndDelete(root);
}

/**
 * 重命名指定路径的节点
 */
export function renameNode(
  root: ProjectFileNode,
  oldPath: string,
  newName: string
): { newRoot: ProjectFileNode; newPath: string } {
  const normOld = normalizePath(oldPath);
  const cleanName = newName.trim();
  if (!cleanName || !normOld || normOld === normalizePath(root.path)) {
    return { newRoot: root, newPath: oldPath };
  }

  // 计算新的 path
  const parts = normOld.split("/");
  parts[parts.length - 1] = cleanName;
  const computedNewPath = parts.join("/");

  function updateChildPaths(node: ProjectFileNode, oldPrefix: string, newPrefix: string): ProjectFileNode {
    const updatedPath = node.path.startsWith(oldPrefix)
      ? newPrefix + node.path.slice(oldPrefix.length)
      : node.path;
    return {
      ...node,
      path: updatedPath,
      children: node.children?.map((c) => updateChildPaths(c, oldPrefix, newPrefix)),
    };
  }

  function cloneAndRename(curr: ProjectFileNode): ProjectFileNode {
    const currNorm = normalizePath(curr.path);
    if (currNorm === normOld) {
      const renamed: ProjectFileNode = {
        ...curr,
        name: cleanName,
        path: computedNewPath,
        children: curr.children?.map((c) => updateChildPaths(c, normOld, computedNewPath)),
      };
      return renamed;
    }

    if (curr.children) {
      return {
        ...curr,
        children: curr.children.map(cloneAndRename),
      };
    }
    return curr;
  }

  return {
    newRoot: cloneAndRename(root),
    newPath: computedNewPath,
  };
}

/**
 * 更新指定文件的内容与积木 XML
 */
export function updateFileContent(
  root: ProjectFileNode,
  targetPath: string,
  content: string,
  blocklyXml?: string
): ProjectFileNode {
  const normTarget = normalizePath(targetPath);

  function cloneAndUpdate(curr: ProjectFileNode): ProjectFileNode {
    if (curr.type === "file" && normalizePath(curr.path) === normTarget) {
      return {
        ...curr,
        content,
        blocklyXml: blocklyXml !== undefined ? blocklyXml : curr.blocklyXml,
      };
    }

    if (curr.children) {
      return {
        ...curr,
        children: curr.children.map(cloneAndUpdate),
      };
    }
    return curr;
  }

  return cloneAndUpdate(root);
}

/**
 * 设置指定文件为主执行入口
 */
export function setEntrypoint(root: ProjectFileNode, entryPath: string): ProjectFileNode {
  const normTarget = normalizePath(entryPath);

  function cloneAndSet(curr: ProjectFileNode): ProjectFileNode {
    if (curr.type === "file") {
      return {
        ...curr,
        isEntry: normalizePath(curr.path) === normTarget,
      };
    }
    if (curr.children) {
      return {
        ...curr,
        children: curr.children.map(cloneAndSet),
      };
    }
    return curr;
  }

  return cloneAndSet(root);
}

/**
 * 创建默认工程工作区
 */
export function createDefaultProject(
  projectName: string = "CadProject",
  initialCode: string = ""
): ProjectWorkspace {
  const defaultCode =
    initialCode ||
    `from build123d import *

# 主入口建模脚本
with BuildPart() as example:
    Box(length=30, width=30, height=10)
    Cylinder(radius=8, height=20)
`;

  const mainFile: ProjectFileNode = {
    id: "main_file",
    name: "main.py",
    path: "main.py",
    type: "file",
    content: defaultCode,
    isEntry: true,
  };

  const root: ProjectFileNode = {
    id: "root_dir",
    name: projectName,
    path: "",
    type: "directory",
    children: [mainFile],
  };

  return {
    id: `proj_${Date.now()}`,
    name: projectName,
    root,
    activeFilePath: "main.py",
    entrypoint: "main.py",
    openFiles: ["main.py"],
    savedAt: Date.now(),
  };
}

/**
 * 将多文件工程打包成导出数据结构
 */
export function exportWorkspaceArchive(workspace: ProjectWorkspace): ProjectExportArchive {
  const files: Record<string, { content: string; blocklyXml?: string }> = {};

  function traverse(curr: ProjectFileNode) {
    if (curr.type === "file") {
      files[curr.path] = {
        content: curr.content ?? "",
        blocklyXml: curr.blocklyXml,
      };
    } else if (curr.children) {
      for (const child of curr.children) {
        traverse(child);
      }
    }
  }

  traverse(workspace.root);

  return {
    version: "2.0",
    projectName: workspace.name,
    entrypoint: workspace.entrypoint || "main.py",
    files,
    savedAt: Date.now(),
  };
}

/**
 * 从多文件归档数据还原工作区
 */
export function importWorkspaceFromArchive(archiveData: any): ProjectWorkspace {
  if (archiveData.version === "2.0" && archiveData.files) {
    const projectName = archiveData.projectName || "导入工程";
    const entrypoint = archiveData.entrypoint || "main.py";

    // 建立树形目录
    let root: ProjectFileNode = {
      id: "root_dir",
      name: projectName,
      path: "",
      type: "directory",
      children: [],
    };

    const fileEntries = Object.entries(archiveData.files) as [
      string,
      { content: string; blocklyXml?: string }
    ][];

    for (const [filePath, fileData] of fileEntries) {
      const norm = normalizePath(filePath);
      const parts = norm.split("/");
      let currParentPath = "";

      for (let i = 0; i < parts.length - 1; i++) {
        const dirName = parts[i];
        const dirPath = currParentPath ? `${currParentPath}/${dirName}` : dirName;
        // 如果目录不存在则创建
        if (!findNodeByPath(root, dirPath)) {
          root = addNode(root, currParentPath, dirName, "directory");
        }
        currParentPath = dirPath;
      }

      const fileName = parts[parts.length - 1];
      root = addNode(
        root,
        currParentPath,
        fileName,
        "file",
        typeof fileData === "string" ? fileData : fileData.content || ""
      );
      if (typeof fileData === "object" && fileData.blocklyXml) {
        root = updateFileContent(root, norm, fileData.content || "", fileData.blocklyXml);
      }
    }

    // 设置入口
    root = setEntrypoint(root, entrypoint);

    const allPaths = getAllFilePaths(root);
    const active = allPaths.includes(entrypoint) ? entrypoint : allPaths[0] || "";

    return {
      id: `proj_${Date.now()}`,
      name: projectName,
      root,
      activeFilePath: active,
      entrypoint,
      openFiles: active ? [active] : [],
      savedAt: Date.now(),
    };
  }

  // 兼容 1.0 单文件存档
  return createDefaultProject(
    archiveData.projectName || "未命名工程",
    archiveData.code || ""
  );
}
