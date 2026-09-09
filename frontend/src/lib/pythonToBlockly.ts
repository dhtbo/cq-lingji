/**
 * CadQuery Python 代码到 Blockly 积木逆向转换器 (Code-to-Blocks Engine)
 * 支持 Fluent API 链式调用与分步赋值语句的高容错 AST/词法解析，
 * 自动识别基准面、2D草图、3D拉伸、打孔、切削、倒角并构建垂直连接积木堆
 */

import * as Blockly from "blockly";

export interface ParsedBlockDef {
  type: string;
  fields: Record<string, string | number>;
}

interface PatternRule {
  type: string;
  regex: RegExp;
  extract: (match: RegExpExecArray) => Record<string, string | number>;
}

const PATTERN_RULES: PatternRule[] = [
  // 1. 初始化基准面
  {
    type: "cq_init_workplane",
    regex: /cq\.Workplane\s*\(\s*["'](XY|XZ|YZ)["']\s*\)/gi,
    extract: (m) => ({ PLANE: m[1].toUpperCase() }),
  },
  // 2. 复合特征：倒圆台放样
  {
    type: "cq_op_cone",
    regex: /\.circle\s*\(\s*([0-9.]+)\s*\)\s*\.workplane\s*\(\s*offset\s*=\s*([0-9.]+)\s*\)\s*\.circle\s*\(\s*([0-9.]+)\s*\)\s*\.loft\s*\([^)]*\)/gi,
    extract: (m) => ({
      R_BOTTOM: parseFloat(m[1]),
      HEIGHT: parseFloat(m[2]),
      R_TOP: parseFloat(m[3]),
    }),
  },
  // 3. 复合特征：极坐标孔系阵列
  {
    type: "cq_op_polar_array",
    regex: /\.polarArray\s*\(\s*(?:radius=)?([0-9.]+)\s*,\s*(?:startAngle=[0-9.]+\s*,\s*)?(?:angle=[0-9.]+\s*,\s*)?(?:count=)?([0-9]+)\s*\)\s*\.circle\s*\(\s*([0-9.]+)\s*\)\s*\.cutThruAll\s*\(\s*\)/gi,
    extract: (m) => ({
      RADIUS: parseFloat(m[1]),
      COUNT: parseInt(m[2], 10),
      DIAMETER: parseFloat(m[3]) * 2,
    }),
  },
  // 4. 复合特征：散热格栅槽切削
  {
    type: "cq_op_cooling_slots",
    regex: /\.polarArray\s*\([^)]*count\s*=\s*([0-9]+)[^)]*\)\s*\.rect\s*\(\s*([0-9.]+)\s*,\s*[0-9.]+\s*\)\s*\.cutBlind\s*\(\s*-?([0-9.]+)\s*\)/gi,
    extract: (m) => ({
      COUNT: parseInt(m[1], 10),
      WIDTH: parseFloat(m[2]),
      DEPTH: parseFloat(m[3]),
    }),
  },
  // 5. 面选择与局部工作面 (支持 centerOption)
  {
    type: "cq_sel_face",
    regex: /\.faces\s*\(\s*["']([^"']+)["']\s*\)\.workplane\s*\((?:[^)]*centerOption\s*=\s*["']([^"']+)["'])?[^)]*\)/gi,
    extract: (m) => ({
      SELECTOR: m[1],
      CENTER_OPTION: m[2] || "CenterOfMass",
    }),
  },
  // 6. 倒圆角: 圆形边缘 faces('>Z').edges('%Circle').fillet(...)
  {
    type: "cq_op_fillet",
    regex: /\.faces\s*\(\s*["'][^"']+["']\s*\)\.edges\s*\(\s*["']%Circle["']\s*\)\.fillet\s*\(\s*(?:radius=)?([0-9.]+)\s*\)/gi,
    extract: (m) => ({
      SELECTOR: "faces_Z_circle",
      RADIUS: parseFloat(m[1]),
    }),
  },
  // 7. 通用倒圆角
  {
    type: "cq_op_fillet",
    regex: /\.edges\s*\(\s*(?:["']([^"']+)["'])?\s*\)\.fillet\s*\(\s*(?:radius=)?([0-9.]+)\s*\)/gi,
    extract: (m) => ({
      SELECTOR: m[1] || "",
      RADIUS: parseFloat(m[2]),
    }),
  },
  // 8. 倒斜角 chamfer
  {
    type: "cq_op_chamfer",
    regex: /\.edges\s*\(\s*(?:["']([^"']+)["'])?\s*\)\.chamfer\s*\(\s*(?:length=)?([0-9.]+)\s*\)/gi,
    extract: (m) => ({
      SELECTOR: m[1] || "",
      LENGTH: parseFloat(m[2]),
    }),
  },
  // 9. 2D 草图: 圆形
  {
    type: "cq_sketch_circle",
    regex: /\.circle\s*\(\s*(?:radius=)?([0-9.]+)\s*\)/gi,
    extract: (m) => ({
      RADIUS: parseFloat(m[1]),
    }),
  },
  // 10. 2D 草图: 矩形
  {
    type: "cq_sketch_rect",
    regex: /\.rect\s*\(\s*(?:xLen=)?([0-9.]+)\s*,\s*(?:yLen=)?([0-9.]+)\s*\)/gi,
    extract: (m) => ({
      WIDTH: parseFloat(m[1]),
      HEIGHT: parseFloat(m[2]),
    }),
  },
  // 11. 2D 草图: 正多边形
  {
    type: "cq_sketch_polygon",
    regex: /\.polygon\s*\(\s*(?:nSides=)?([0-9]+)\s*,\s*(?:diameter=)?([0-9.]+)\s*\)/gi,
    extract: (m) => ({
      SIDES: parseInt(m[1], 10),
      DIAMETER: parseFloat(m[2]),
    }),
  },
  // 11.1 2D 草图: 自定义多边形区域 polyline
  {
    type: "cq_sketch_polyline",
    regex: /\.polyline\s*\(\s*(\[[^\]]+\]|[a-zA-Z_]\w*)\s*\)(?:\s*\.close\s*\(\s*\))?/gi,
    extract: (m) => ({
      POINTS: m[1],
      CLOSE: m[0].includes(".close") ? "TRUE" : "FALSE",
    }),
  },
  // 11.2 2D 草图: 腰形槽 slot2D
  {
    type: "cq_sketch_slot",
    regex: /\.slot2D\s*\(\s*(?:length=)?([0-9.]+)\s*,\s*(?:diameter=)?([0-9.]+)(?:\s*,\s*(?:angle=)?([0-9.-]+))?\s*\)/gi,
    extract: (m) => ({
      LENGTH: parseFloat(m[1]),
      DIAMETER: parseFloat(m[2]),
      ANGLE: m[3] ? parseFloat(m[3]) : 0,
    }),
  },
  // 11.3 2D 草图: 椭圆 ellipse
  {
    type: "cq_sketch_ellipse",
    regex: /\.ellipse\s*\(\s*(?:x_radius=)?([0-9.]+)\s*,\s*(?:y_radius=)?([0-9.]+)\s*\)/gi,
    extract: (m) => ({
      X_RADIUS: parseFloat(m[1]),
      Y_RADIUS: parseFloat(m[2]),
    }),
  },
  // 11.4 3D 操作: 表面抽壳 shell
  {
    type: "cq_op_shell",
    regex: /(?:\.faces\s*\(\s*["']([^"']+)["']\s*\))?\.shell\s*\(\s*(?:thickness=)?-?([0-9.]+)\s*\)/gi,
    extract: (m) => ({
      SELECTOR: m[1] || ">Z",
      THICKNESS: parseFloat(m[2]),
    }),
  },
  // 11.5 3D 操作: 3D 浮雕文字 text
  {
    type: "cq_op_text",
    regex: /\.text\s*\(\s*["']([^"']+)["']\s*(?:,\s*(?:fontsize=)?([0-9.]+))?(?:,\s*(?:distance=)?([0-9.]+))?[^)]*\)/gi,
    extract: (m) => ({
      TEXT: m[1],
      FONT_SIZE: m[2] ? parseFloat(m[2]) : 12,
      DISTANCE: m[3] ? parseFloat(m[3]) : 2,
    }),
  },
  // 12. 3D 操作: 拉伸 extrude
  {
    type: "cq_op_extrude",
    regex: /\.extrude\s*\(\s*(?:distance=)?([0-9.]+)\s*\)/gi,
    extract: (m) => ({
      DISTANCE: parseFloat(m[1]),
    }),
  },
  // 13. 3D 操作: 打孔 hole
  {
    type: "cq_op_hole",
    regex: /\.hole\s*\(\s*(?:diameter=)?([0-9.]+)\s*,\s*(?:depth=)?([0-9.]+)\s*\)/gi,
    extract: (m) => ({
      DIAMETER: parseFloat(m[1]),
      DEPTH: parseFloat(m[2]),
    }),
  },
  // 14. 3D 操作: 盲切 cutBlind
  {
    type: "cq_op_cut_blind",
    regex: /\.cutBlind\s*\(\s*(?:depth=)?-?([0-9.]+)\s*\)/gi,
    extract: (m) => ({
      DEPTH: parseFloat(m[1]),
    }),
  },
  // 15. 基础实体: 立方体 box
  {
    type: "cq_op_box",
    regex: /\.box\s*\(\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)\s*\)/gi,
    extract: (m) => ({
      LENGTH: parseFloat(m[1]),
      WIDTH: parseFloat(m[2]),
      HEIGHT: parseFloat(m[3]),
    }),
  },
  // 16. 基础实体: 圆柱体 cylinder
  {
    type: "cq_op_cylinder",
    regex: /\.cylinder\s*\(\s*([0-9.]+)\s*,\s*([0-9.]+)\s*\)/gi,
    extract: (m) => ({
      HEIGHT: parseFloat(m[1]),
      RADIUS: parseFloat(m[2]),
    }),
  },
  // 17. 基础实体: 球体 sphere
  {
    type: "cq_op_sphere",
    regex: /\.sphere\s*\(\s*([0-9.]+)\s*\)/gi,
    extract: (m) => ({
      RADIUS: parseFloat(m[1]),
    }),
  },
  // 18. 偏移基准面 workplane(offset=...)
  {
    type: "cq_sel_offset",
    regex: /\.workplane\s*\(\s*offset\s*=\s*([0-9.]+)\s*\)/gi,
    extract: (m) => ({
      OFFSET: parseFloat(m[1]),
    }),
  },
  // 19. 旋转成型 revolve
  {
    type: "cq_op_revolve",
    regex: /\.revolve\s*\(\s*([0-9.]+)\s*(?:,\s*\([^)]+\)\s*,\s*\(([0-9.]+),\s*([0-9.]+),\s*([0-9.]+)\))?\s*\)/gi,
    extract: (m) => {
      const angle = parseFloat(m[1]);
      let axis = "X";
      if (m[3] && parseFloat(m[3]) === 1) axis = "Y";
      if (m[4] && parseFloat(m[4]) === 1) axis = "Z";
      return { ANGLE: angle, AXIS: axis };
    },
  },
  // 20. 空间变换 transformed
  {
    type: "cq_op_transform",
    regex: /\.transformed\s*\(\s*rotate\s*=\s*\(\s*([0-9.-]+)\s*,\s*([0-9.-]+)\s*,\s*([0-9.-]+)\s*\)\s*,\s*offset\s*=\s*\(\s*([0-9.-]+)\s*,\s*([0-9.-]+)\s*,\s*([0-9.-]+)\s*\)\s*\)/gi,
    extract: (m) => ({
      RX: parseFloat(m[1]),
      RY: parseFloat(m[2]),
      RZ: parseFloat(m[3]),
      OX: parseFloat(m[4]),
      OY: parseFloat(m[5]),
      OZ: parseFloat(m[6]),
    }),
  },
];

/**
 * 解析 Python CadQuery 源码中的几何操作链
 */
export function parseCadQueryCode(code: string): ParsedBlockDef[] {
  interface MatchItem {
    start: number;
    end: number;
    type: string;
    fields: Record<string, string | number>;
  }

  const allMatches: MatchItem[] = [];

  // 1. 优先提取单行独立注释 (# ...) 作为注释积木
  const commentRegex = /^[ \t]*#[ \t]*(.*?)[ \t]*$/gm;
  let cMatch: RegExpExecArray | null;
  while ((cMatch = commentRegex.exec(code)) !== null) {
    const text = cMatch[1].trim();
    if (text && !text.startsWith("-*-") && !text.startsWith("coding:")) {
      allMatches.push({
        start: cMatch.index,
        end: cMatch.index + cMatch[0].length,
        type: "cq_comment",
        fields: { TEXT: text },
      });
    }
  }

  // 2. 将代码中的注释替换为等长空格，保持字符索引偏移 100% 一致
  let cleanCode = code.replace(/#.*$/gm, (m) => " ".repeat(m.length));

  // 3. 智能提取顶层定义的数值常量变量 (例如 radius = 15.0, height = 40)
  const varMap: Record<string, number> = {};
  const varRegex = /^\s*([a-zA-Z_]\w*)\s*=\s*(-?[0-9]+(?:\.[0-9]+)?)\s*$/gm;
  let vMatch: RegExpExecArray | null;
  while ((vMatch = varRegex.exec(cleanCode)) !== null) {
    varMap[vMatch[1]] = parseFloat(vMatch[2]);
  }

  // 4. 将几何调用中的变量引用替换为对应数值字面量，提升逆向解析兼容性
  for (const [varName, val] of Object.entries(varMap)) {
    const wordRegex = new RegExp(`(?<=[(,=\\s+\\-*\\/])${varName}(?=[),=\\s+\\-*\\/])`, "g");
    cleanCode = cleanCode.replace(wordRegex, String(val));
  }

  for (const rule of PATTERN_RULES) {
    rule.regex.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = rule.regex.exec(cleanCode)) !== null) {
      try {
        const fields = rule.extract(match);
        allMatches.push({
          start: match.index,
          end: match.index + match[0].length,
          type: rule.type,
          fields,
        });
      } catch (err) {
        console.warn("提取特征参数失败:", err);
      }
    }
  }

  // 按照代码出现顺序从小到大排序
  allMatches.sort((a, b) => a.start - b.start);

  // 贪婪去除重叠匹配（如多步宏匹配与子操作重叠）
  const filtered: ParsedBlockDef[] = [];
  let lastEnd = 0;

  for (const item of allMatches) {
    if (item.start >= lastEnd) {
      filtered.push({
        type: item.type,
        fields: item.fields,
      });
      lastEnd = item.end;
    }
  }

  // 默认兜底：如果没找到 Workplane 起点，但找到了几何特征，在首个非注释特征前插入默认 XY 基准面
  const hasWorkplane = filtered.some((m) => m.type === "cq_init_workplane");
  if (!hasWorkplane && filtered.length > 0) {
    const firstGeomIdx = filtered.findIndex((m) => m.type !== "cq_comment");
    if (firstGeomIdx !== -1) {
      filtered.splice(firstGeomIdx, 0, {
        type: "cq_init_workplane",
        fields: { PLANE: "XY" },
      });
    } else {
      filtered.push({
        type: "cq_init_workplane",
        fields: { PLANE: "XY" },
      });
    }
  }

  return filtered;
}

/**
 * 将 Python 源码逆向解析并注入渲染至 Blockly 工作区
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

  const parsed = parseCadQueryCode(code);

  if (parsed.length === 0) {
    return {
      success: false,
      blockCount: 0,
      message: "未在代码中识别到可转换的 CadQuery 几何特征语句（支持 Workplane、box、cylinder、circle、rect、extrude、hole、faces 等）",
    };
  }

  try {
    // 禁用积木工作区事件广播，防止重复触发向 Monaco 同步代码
    Blockly.Events.disable();
    workspace.clear();

    let prevBlock: Blockly.BlockSvg | null = null;
    let topBlock: Blockly.BlockSvg | null = null;
    let count = 0;

    for (let i = 0; i < parsed.length; i++) {
      const def = parsed[i];
      try {
        const block = workspace.newBlock(def.type) as Blockly.BlockSvg;

        // 填充参数字段
        for (const [key, val] of Object.entries(def.fields)) {
          block.setFieldValue(val as any, key);
        }

        block.initSvg();
        block.render();

        if (i === 0) {
          topBlock = block;
          block.moveTo(new Blockly.utils.Coordinate(40, 40));
        } else if (prevBlock && prevBlock.nextConnection && block.previousConnection) {
          prevBlock.nextConnection.connect(block.previousConnection);
        }

        prevBlock = block;
        count++;
      } catch (blockErr) {
        console.warn(`创建积木失败 [${def.type}]:`, blockErr);
      }
    }

    Blockly.Events.enable();

    if (topBlock) {
      (topBlock as any).bumpNeighbours?.();
    }

    return {
      success: true,
      blockCount: count,
      message: `成功解析并生成 ${count} 个 CadQuery 几何积木！`,
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
