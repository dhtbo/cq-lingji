/**
 * build123d / CadQuery Python 代码到 Blockly 积木逆向转换器 (Code-to-Blocks Engine 2.0)
 * 深度支持 build123d Builder 容器层级嵌套语法 (BuildPart, BuildSketch, Locations 等)
 * 及 3D 实体、2D 草图、3D 特征、阵列模式与注释的无损还原；同时向下兼容 CadQuery 经典链式代码。
 */

import * as Blockly from "blockly";

export interface ParsedBlockDef {
  type: string;
  fields: Record<string, string | number>;
  children?: ParsedBlockDef[]; // 容器子积木 (对应 Statement Input "DO")
}

/**
 * 辅助：提取 mode 参数
 */
function extractMode(text: string): string {
  if (/Mode\.SUBTRACT/i.test(text)) return "SUBTRACT";
  if (/Mode\.INTERSECT/i.test(text)) return "INTERSECT";
  return "ADD";
}

/**
 * 辅助：提取工作平面
 */
function extractPlane(text: string): string {
  if (/Plane\.XZ/i.test(text) || /["']XZ["']/i.test(text)) return "XZ";
  if (/Plane\.YZ/i.test(text) || /["']YZ["']/i.test(text)) return "YZ";
  return "XY";
}

/**
 * 逐行与缩进语法分析器，将 Python 代码解析为结构化积木树
 */
export function parseBuild123dCode(code: string): ParsedBlockDef[] {
  const lines = code.split(/\r?\n/);
  const blocks: ParsedBlockDef[] = [];

  // 当前激活的容器栈: { indent: number, block: ParsedBlockDef }
  const stack: { indent: number; block: ParsedBlockDef }[] = [];

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const rawLine = lines[lineIndex];
    const trimmed = rawLine.trim();

    // 跳过空行或标准导入
    if (!trimmed || trimmed.startsWith("from build123d") || trimmed.startsWith("import build123d") || trimmed.startsWith("import cadquery")) {
      continue;
    }

    // 计算当前行缩进空格数
    const indent = rawLine.search(/\S|$/);

    // 弹出缩进比当前行更深或相等的容器
    while (stack.length > 0 && stack[stack.length - 1].indent >= indent) {
      stack.pop();
    }

    const currentContainer = stack.length > 0 ? stack[stack.length - 1].block : null;

    const addBlock = (b: ParsedBlockDef) => {
      if (currentContainer) {
        if (!currentContainer.children) currentContainer.children = [];
        currentContainer.children.push(b);
      } else {
        blocks.push(b);
      }
    };

    // 1. 注释识别
    if (trimmed.startsWith("#")) {
      const commentText = trimmed.replace(/^#+\s*/, "");
      addBlock({
        type: "b3d_comment",
        fields: { TEXT: commentText },
      });
      continue;
    }

    // 2. with BuildPart(...) 容器
    if (/with\s+BuildPart\s*\((.*?)\)/i.test(trimmed)) {
      const planeMatch = trimmed.match(/with\s+BuildPart\s*\((.*?)\)/i);
      const plane = planeMatch ? extractPlane(planeMatch[1]) : "XY";
      const block: ParsedBlockDef = {
        type: "b3d_build_part",
        fields: { PLANE: plane },
        children: [],
      };
      addBlock(block);
      stack.push({ indent, block });
      continue;
    }

    // 3. with BuildSketch(...) 容器
    if (/with\s+BuildSketch\s*\((.*?)\)/i.test(trimmed)) {
      const planeMatch = trimmed.match(/with\s+BuildSketch\s*\((.*?)\)/i);
      let plane = "XY";
      if (planeMatch) {
        const arg = planeMatch[1];
        if (/faces\(\).*?top|faces\(\).*?\[-1\]/i.test(arg)) {
          plane = "TOP_FACE";
        } else if (/faces\(\).*?bottom|faces\(\).*?\[0\]/i.test(arg)) {
          plane = "BOTTOM_FACE";
        } else {
          plane = extractPlane(arg);
        }
      }
      const block: ParsedBlockDef = {
        type: "b3d_build_sketch",
        fields: { PLANE: plane },
        children: [],
      };
      addBlock(block);
      stack.push({ indent, block });
      continue;
    }

    // 3.5 with BuildLine(...) 路径建造者容器
    if (/with\s+BuildLine\s*\((.*?)\)/i.test(trimmed)) {
      const block: ParsedBlockDef = {
        type: "b3d_build_line",
        fields: {},
        children: [],
      };
      addBlock(block);
      stack.push({ indent, block });
      continue;
    }

    // 4. with Locations(...) 定位容器
    if (/with\s+Locations\s*\(\s*\(\s*([-\d.]+)\s*,\s*([-\d.]+)(?:\s*,\s*([-\d.]+))?\s*\)\s*\)/i.test(trimmed)) {
      const m = trimmed.match(/with\s+Locations\s*\(\s*\(\s*([-\d.]+)\s*,\s*([-\d.]+)(?:\s*,\s*([-\d.]+))?\s*\)\s*\)/i)!;
      const block: ParsedBlockDef = {
        type: "b3d_locations",
        fields: {
          X: parseFloat(m[1]),
          Y: parseFloat(m[2]),
          Z: m[3] ? parseFloat(m[3]) : 0,
        },
        children: [],
      };
      addBlock(block);
      stack.push({ indent, block });
      continue;
    }

    // 5. with GridLocations(...) 矩形网格阵列
    if (/with\s+GridLocations\s*\((.*?)\)/i.test(trimmed)) {
      const argsMatch = trimmed.match(/with\s+GridLocations\s*\((.*?)\)/i)!;
      const parts = argsMatch[1].split(",").map((s) => parseFloat(s.trim())).filter((n) => !isNaN(n));
      const block: ParsedBlockDef = {
        type: "b3d_grid_locations",
        fields: {
          X_SPACING: parts[0] ?? 15,
          Y_SPACING: parts[1] ?? 15,
          X_COUNT: parts[2] ?? 3,
          Y_COUNT: parts[3] ?? 3,
        },
        children: [],
      };
      addBlock(block);
      stack.push({ indent, block });
      continue;
    }

    // 6. with PolarLocations(...) 环形极坐标阵列
    if (/with\s+PolarLocations\s*\((.*?)\)/i.test(trimmed)) {
      const rMatch = trimmed.match(/(?:radius\s*=\s*)?([-\d.]+)/i);
      const cMatch = trimmed.match(/(?:count\s*=\s*)?(\d+)\s*\)/i);
      const block: ParsedBlockDef = {
        type: "b3d_polar_locations",
        fields: {
          RADIUS: rMatch ? parseFloat(rMatch[1]) : 20,
          COUNT: cMatch ? parseInt(cMatch[1], 10) : 6,
        },
        children: [],
      };
      addBlock(block);
      stack.push({ indent, block });
      continue;
    }

    // 7. with HexLocations(...) 蜂窝六边形阵列
    if (/with\s+HexLocations\s*\((.*?)\)/i.test(trimmed)) {
      const parts = trimmed.replace(/with\s+HexLocations\s*\(/i, "").replace(/\).*/, "").split(",").map((s) => parseFloat(s.trim())).filter((n) => !isNaN(n));
      const block: ParsedBlockDef = {
        type: "b3d_hex_locations",
        fields: {
          APOTHEM: parts[0] ?? 10,
          X_COUNT: parts[1] ?? 3,
          Y_COUNT: parts[2] ?? 3,
        },
        children: [],
      };
      addBlock(block);
      stack.push({ indent, block });
      continue;
    }

    // 8. 3D 基础实体: Box
    if (/Box\s*\((.*?)\)/i.test(trimmed)) {
      const nums = trimmed.match(/([-\d.]+)/g) || [];
      addBlock({
        type: "b3d_box",
        fields: {
          LENGTH: nums[0] ? parseFloat(nums[0]) : 20,
          WIDTH: nums[1] ? parseFloat(nums[1]) : 20,
          HEIGHT: nums[2] ? parseFloat(nums[2]) : 10,
          MODE: extractMode(trimmed),
        },
      });
      continue;
    }

    // 9. 3D 基础实体: Cylinder
    if (/Cylinder\s*\((.*?)\)/i.test(trimmed)) {
      const rMatch = trimmed.match(/radius\s*=\s*([-\d.]+)/i) || trimmed.match(/Cylinder\s*\(\s*([-\d.]+)/i);
      const hMatch = trimmed.match(/height\s*=\s*([-\d.]+)/i) || trimmed.match(/,\s*([-\d.]+)/i);
      addBlock({
        type: "b3d_cylinder",
        fields: {
          RADIUS: rMatch ? parseFloat(rMatch[1]) : 10,
          HEIGHT: hMatch ? parseFloat(hMatch[1]) : 20,
          MODE: extractMode(trimmed),
        },
      });
      continue;
    }

    // 10. 3D 基础实体: Sphere
    if (/Sphere\s*\((.*?)\)/i.test(trimmed)) {
      const rMatch = trimmed.match(/radius\s*=\s*([-\d.]+)/i) || trimmed.match(/Sphere\s*\(\s*([-\d.]+)/i);
      addBlock({
        type: "b3d_sphere",
        fields: {
          RADIUS: rMatch ? parseFloat(rMatch[1]) : 10,
          MODE: extractMode(trimmed),
        },
      });
      continue;
    }

    // 11. 3D 基础实体: Cone
    if (/Cone\s*\((.*?)\)/i.test(trimmed)) {
      const nums = trimmed.match(/([-\d.]+)/g) || [];
      addBlock({
        type: "b3d_cone",
        fields: {
          R1: nums[0] ? parseFloat(nums[0]) : 15,
          R2: nums[1] ? parseFloat(nums[1]) : 5,
          HEIGHT: nums[2] ? parseFloat(nums[2]) : 20,
          MODE: extractMode(trimmed),
        },
      });
      continue;
    }

    // 12. 3D 基础实体: Torus
    if (/Torus\s*\((.*?)\)/i.test(trimmed)) {
      const nums = trimmed.match(/([-\d.]+)/g) || [];
      addBlock({
        type: "b3d_torus",
        fields: {
          R1: nums[0] ? parseFloat(nums[0]) : 20,
          R2: nums[1] ? parseFloat(nums[1]) : 5,
          MODE: extractMode(trimmed),
        },
      });
      continue;
    }

    // 13. 2D 草图: Rectangle
    if (/Rectangle\s*\((.*?)\)/i.test(trimmed)) {
      const nums = trimmed.match(/([-\d.]+)/g) || [];
      addBlock({
        type: "b3d_sketch_rect",
        fields: {
          WIDTH: nums[0] ? parseFloat(nums[0]) : 20,
          HEIGHT: nums[1] ? parseFloat(nums[1]) : 20,
          MODE: extractMode(trimmed),
        },
      });
      continue;
    }

    // 14. 2D 草图: Circle
    if (/Circle\s*\((.*?)\)/i.test(trimmed)) {
      const rMatch = trimmed.match(/radius\s*=\s*([-\d.]+)/i) || trimmed.match(/Circle\s*\(\s*([-\d.]+)/i);
      addBlock({
        type: "b3d_sketch_circle",
        fields: {
          RADIUS: rMatch ? parseFloat(rMatch[1]) : 10,
          MODE: extractMode(trimmed),
        },
      });
      continue;
    }

    // 15. 2D 草图: RegularPolygon
    if (/RegularPolygon\s*\((.*?)\)/i.test(trimmed)) {
      const rMatch = trimmed.match(/radius\s*=\s*([-\d.]+)/i) || trimmed.match(/RegularPolygon\s*\(\s*([-\d.]+)/i);
      const sMatch = trimmed.match(/side_count\s*=\s*(\d+)/i) || trimmed.match(/,\s*(\d+)/i);
      addBlock({
        type: "b3d_sketch_regular_polygon",
        fields: {
          RADIUS: rMatch ? parseFloat(rMatch[1]) : 10,
          SIDES: sMatch ? parseInt(sMatch[1], 10) : 6,
          MODE: extractMode(trimmed),
        },
      });
      continue;
    }

    // 16. 2D 草图: Polygon / Polyline
    if (/Polygon\s*\((.*?)\)/i.test(trimmed)) {
      const ptsMatch = trimmed.match(/\[\s*\(.*?\)\]/);
      addBlock({
        type: "b3d_sketch_polygon",
        fields: {
          POINTS: ptsMatch ? ptsMatch[0] : "[(0,0), (20,0), (20,15), (0,15)]",
          MODE: extractMode(trimmed),
        },
      });
      continue;
    }

    // 16.1 生成草图截面: make_face()
    if (/make_face\s*\(\s*\)/i.test(trimmed)) {
      addBlock({
        type: "b3d_make_face",
        fields: {},
      });
      continue;
    }

    // 16.2 路径线段: Line
    if (/Line\s*\(\s*(\(.*?\))\s*,\s*(\(.*?\))\s*\)/i.test(trimmed)) {
      const lineMatch = trimmed.match(/Line\s*\(\s*(\(.*?\))\s*,\s*(\(.*?\))\s*\)/i);
      addBlock({
        type: "b3d_line",
        fields: {
          START_PT: lineMatch ? lineMatch[1] : "(0, 0)",
          END_PT: lineMatch ? lineMatch[2] : "(10, 0)",
        },
      });
      continue;
    }

    // 16.3 连续折线: Polyline
    if (/Polyline\s*\((.*?)\)/i.test(trimmed)) {
      const ptsMatch = trimmed.match(/\[\s*\(.*?\)\]/);
      const hasCloseTrue = /close\s*=\s*True/i.test(trimmed);
      addBlock({
        type: "b3d_sketch_polyline",
        fields: {
          POINTS: ptsMatch ? ptsMatch[0] : "[(0,0), (10,5), (20,0)]",
          CLOSE: hasCloseTrue ? "TRUE" : "FALSE",
        },
      });
      continue;
    }

    // 17. 2D 草图: Slot2D
    if (/Slot2D\s*\((.*?)\)/i.test(trimmed)) {
      const nums = trimmed.match(/([-\d.]+)/g) || [];
      addBlock({
        type: "b3d_sketch_slot",
        fields: {
          LENGTH: nums[0] ? parseFloat(nums[0]) : 30,
          WIDTH: nums[1] ? parseFloat(nums[1]) : 10,
          ROTATION: nums[2] ? parseFloat(nums[2]) : 0,
          MODE: extractMode(trimmed),
        },
      });
      continue;
    }

    // 18. 3D 特征: extrude
    if (/extrude\s*\((.*?)\)/i.test(trimmed)) {
      const amountMatch = trimmed.match(/amount\s*=\s*([-\d.]+)/i) || trimmed.match(/extrude\s*\(\s*([-\d.]+)/i);
      addBlock({
        type: "b3d_extrude",
        fields: {
          AMOUNT: amountMatch ? parseFloat(amountMatch[1]) : 10,
          MODE: extractMode(trimmed),
        },
      });
      continue;
    }

    // 19. 3D 特征: revolve
    if (/revolve\s*\((.*?)\)/i.test(trimmed)) {
      const angleMatch = trimmed.match(/(?:revolution_arc|angle)\s*=\s*([-\d.]+)/i) || trimmed.match(/revolve\s*\([^,]+,\s*([-\d.]+)/i);
      let axis = "Axis.Z";
      if (/Axis\.X/i.test(trimmed)) axis = "Axis.X";
      else if (/Axis\.Y/i.test(trimmed)) axis = "Axis.Y";
      addBlock({
        type: "b3d_revolve",
        fields: {
          ANGLE: angleMatch ? parseFloat(angleMatch[1]) : 360,
          AXIS: axis,
          MODE: extractMode(trimmed),
        },
      });
      continue;
    }

    // 20. 3D 特征: fillet
    if (/fillet\s*\((.*?)\)/i.test(trimmed)) {
      const rMatch = trimmed.match(/radius\s*=\s*([-\d.]+)/i) || trimmed.match(/,\s*([-\d.]+)\s*\)/i);
      let target = "ALL";
      if (/filter_by\s*\(\s*Axis\.Z\s*\)/i.test(trimmed)) target = "PARALLEL_Z";
      else if (/sort_by\s*\(\s*Axis\.Z\s*\)\[-1\]/i.test(trimmed)) target = "TOP";
      addBlock({
        type: "b3d_fillet",
        fields: {
          RADIUS: rMatch ? parseFloat(rMatch[1]) : 2,
          TARGET: target,
        },
      });
      continue;
    }

    // 21. 3D 特征: chamfer
    if (/chamfer\s*\((.*?)\)/i.test(trimmed)) {
      const lMatch = trimmed.match(/length\s*=\s*([-\d.]+)/i) || trimmed.match(/,\s*([-\d.]+)\s*\)/i);
      let target = "ALL";
      if (/filter_by\s*\(\s*Axis\.Z\s*\)/i.test(trimmed)) target = "PARALLEL_Z";
      else if (/sort_by\s*\(\s*Axis\.Z\s*\)\[-1\]/i.test(trimmed)) target = "TOP";
      addBlock({
        type: "b3d_chamfer",
        fields: {
          LENGTH: lMatch ? parseFloat(lMatch[1]) : 2,
          TARGET: target,
        },
      });
      continue;
    }

    // 22. 3D 特征: Hole
    if (/Hole\s*\((.*?)\)/i.test(trimmed)) {
      const rMatch = trimmed.match(/radius\s*=\s*([-\d.]+)/i) || trimmed.match(/Hole\s*\(\s*([-\d.]+)/i);
      const dMatch = trimmed.match(/depth\s*=\s*([-\d.]+)/i) || trimmed.match(/,\s*([-\d.]+)\s*\)/i);
      addBlock({
        type: "b3d_hole",
        fields: {
          RADIUS: rMatch ? parseFloat(rMatch[1]) : 3,
          DEPTH: dMatch ? parseFloat(dMatch[1]) : 10,
        },
      });
      continue;
    }

    // 23. 3D 特征: offset
    if (/offset\s*\((.*?)\)/i.test(trimmed)) {
      const aMatch = trimmed.match(/amount\s*=\s*([-\d.]+)/i) || trimmed.match(/offset\s*\(\s*([-\d.]+)/i);
      addBlock({
        type: "b3d_offset",
        fields: {
          AMOUNT: aMatch ? parseFloat(aMatch[1]) : 2,
        },
      });
      continue;
    }

    // 24. 3D 特征: split
    if (/split\s*\((.*?)\)/i.test(trimmed)) {
      let plane = "Plane.XZ";
      if (/Plane\.YZ/i.test(trimmed)) plane = "Plane.YZ";
      else if (/Plane\.XY/i.test(trimmed)) plane = "Plane.XY";
      addBlock({
        type: "b3d_split",
        fields: {
          PLANE: plane,
        },
      });
      continue;
    }

    // 25. 颜色设置
    if (/\.color\s*=\s*Color\s*\(\s*["']([^"']+)["']\s*\)/i.test(trimmed)) {
      const cMatch = trimmed.match(/\.color\s*=\s*Color\s*\(\s*["']([^"']+)["']\s*\)/i);
      addBlock({
        type: "b3d_color",
        fields: {
          COLOR: cMatch ? cMatch[1] : "#3b82f6",
        },
      });
      continue;
    }

    // ==================== 兼容旧 CadQuery 语句 ====================
    if (/cq\.Workplane\s*\(\s*["'](XY|XZ|YZ)["']\s*\)/i.test(trimmed)) {
      const plane = extractPlane(trimmed);
      const block: ParsedBlockDef = {
        type: "b3d_build_part",
        fields: { PLANE: plane },
        children: [],
      };
      addBlock(block);
      stack.push({ indent, block });
      continue;
    }

    if (/\.box\s*\((.*?)\)/i.test(trimmed)) {
      const nums = trimmed.match(/([-\d.]+)/g) || [];
      addBlock({
        type: "b3d_box",
        fields: {
          LENGTH: nums[0] ? parseFloat(nums[0]) : 20,
          WIDTH: nums[1] ? parseFloat(nums[1]) : 20,
          HEIGHT: nums[2] ? parseFloat(nums[2]) : 10,
          MODE: "ADD",
        },
      });
      continue;
    }
  }

  // 如果解析出的有效实体积木没有被包裹在 BuildPart 中，自动包裹在首层 BuildPart 内
  const hasPartContainer = blocks.some((b) => b.type === "b3d_build_part");
  if (!hasPartContainer && blocks.length > 0) {
    const rootPart: ParsedBlockDef = {
      type: "b3d_build_part",
      fields: { PLANE: "XY" },
      children: [...blocks],
    };
    return [rootPart];
  }

  return blocks;
}

/**
 * 递归构建积木连接树
 */
function buildBlockTree(
  workspace: Blockly.WorkspaceSvg,
  defs: ParsedBlockDef[],
  parentConnection: Blockly.Connection | null
): { firstBlock: Blockly.BlockSvg | null; count: number } {
  let prevBlock: Blockly.BlockSvg | null = null;
  let firstBlock: Blockly.BlockSvg | null = null;
  let totalCount = 0;

  for (let i = 0; i < defs.length; i++) {
    const def = defs[i];
    try {
      const block = workspace.newBlock(def.type) as Blockly.BlockSvg;

      // 填充字段
      for (const [k, v] of Object.entries(def.fields)) {
        block.setFieldValue(v as any, k);
      }

      block.initSvg();
      block.render();

      if (i === 0) {
        firstBlock = block;
        if (parentConnection && block.previousConnection) {
          parentConnection.connect(block.previousConnection);
        }
      } else if (prevBlock && prevBlock.nextConnection && block.previousConnection) {
        prevBlock.nextConnection.connect(block.previousConnection);
      }

      totalCount++;

      // 如果含有子容器槽位 (DO statement)
      if (def.children && def.children.length > 0) {
        const doInput = block.getInput("DO");
        if (doInput && doInput.connection) {
          const subResult = buildBlockTree(workspace, def.children, doInput.connection);
          totalCount += subResult.count;
        }
      }

      prevBlock = block;
    } catch (e) {
      console.warn(`创建积木失败 [${def.type}]:`, e);
    }
  }

  return { firstBlock, count: totalCount };
}

/**
 * 将 Python (build123d / CadQuery) 源码逆向解析并注入渲染至 Blockly 工作区
 */
export function convertPythonToBlockly(
  code: string,
  workspace: Blockly.WorkspaceSvg | null
): { success: boolean; blockCount: number; message: string } {
  if (!workspace) {
    return { success: false, blockCount: 0, message: "积木工作区未初始化或未加载" };
  }

  if (!code || !code.trim()) {
    return { success: false, blockCount: 0, message: "待转换代码为空" };
  }

  const parsed = parseBuild123dCode(code);

  if (parsed.length === 0) {
    return {
      success: false,
      blockCount: 0,
      message: "未在代码中识别到可转换的 build123d 几何建模语句（支持 BuildPart、Box、Cylinder、BuildSketch、extrude、Locations 等）",
    };
  }

  try {
    Blockly.Events.disable();
    workspace.clear();

    const { firstBlock, count } = buildBlockTree(workspace, parsed, null);

    if (firstBlock) {
      firstBlock.moveTo(new Blockly.utils.Coordinate(40, 40));
      (firstBlock as any).bumpNeighbours?.();
    }

    Blockly.Events.enable();

    return {
      success: true,
      blockCount: count,
      message: `成功逆向解析并还原 ${count} 个 build123d 几何积木！`,
    };
  } catch (err: any) {
    Blockly.Events.enable();
    return {
      success: false,
      blockCount: 0,
      message: `转换过程发生异常: ${err.message || String(err)}`,
    };
  }
}

// 保持别名导出
export const parseCadQueryCode = parseBuild123dCode;
