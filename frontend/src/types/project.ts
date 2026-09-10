/**
 * 文件夹式项目工程类型定义 (Folder-based Project Types)
 */

export type NodeType = "file" | "directory";

export interface ProjectFileNode {
  id: string;
  name: string;
  path: string; // 相对根路径，如 "main.py" 或 "parts/handle.py" 或 "parts"
  type: NodeType;
  content?: string; // 文件代码内容
  blocklyXml?: string; // 积木 XML 数据
  children?: ProjectFileNode[]; // 目录子节点
  isEntry?: boolean; // 是否为主执行入口 (如 main.py)
}

export interface ProjectWorkspace {
  id: string;
  name: string;
  root: ProjectFileNode;
  activeFilePath: string;
  entrypoint: string;
  openFiles: string[];
  savedAt: number;
}

export interface ProjectExportArchive {
  version: "2.0";
  projectName: string;
  entrypoint: string;
  files: Record<string, { content: string; blocklyXml?: string }>;
  savedAt: number;
}
