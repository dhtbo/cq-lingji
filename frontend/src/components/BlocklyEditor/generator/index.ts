import * as Blockly from "blockly";
import { registerBuild123dGenerator, workspaceToBuild123d } from "./build123d";
import { registerCadQueryGenerator, generateCadQueryPython } from "./cadquery";
import { registerLogoUp3DGenerator } from "./logoup3d";
import { WorkingMode } from "../toolbox";

/**
 * 注册所有积木代码生成器 (build123d, CadQuery, LogoUp 3D)
 */
export function registerAllGenerators() {
  registerBuild123dGenerator();
  registerLogoUp3DGenerator();
  registerCadQueryGenerator();
}

/**
 * 根据当前工作模式将 Blockly Workspace 转换为对应框架的标准 Python 源码
 * @param workspace Blockly 绘图工作区
 * @param mode 工作模式 ('build123d' | 'cadquery' | 'logoup')
 * @returns 格式化后的 Python 代码
 */
export function generateCodeForMode(
  workspace: Blockly.WorkspaceSvg | Blockly.Workspace,
  mode: WorkingMode = "build123d"
): string {
  registerAllGenerators();

  if (mode === "cadquery") {
    return generateCadQueryPython(workspace as Blockly.WorkspaceSvg);
  }

  // 根据当前模式 (build123d 或 logoup) 严格生成对应方言的 Python 源码
  return workspaceToBuild123d(workspace, mode);
}

export { workspaceToBuild123d, generateCadQueryPython };
