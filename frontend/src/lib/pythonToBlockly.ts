/**
 * build123d / CadQuery Python 代码到 Blockly 积木逆向转换器 (Code-to-Blocks Engine 2.0)
 * 深度支持 build123d Builder 容器层级嵌套语法 (BuildPart, BuildSketch, Locations 等)
 * 及 3D 实体、2D 草图、3D 特征、阵列模式与注释的无损还原；同时向下兼容 CadQuery 经典链式代码。
 */

import * as Blockly from "blockly";

export interface ParsedBlockDef {
  type: string;
  fields: Record<string, string | number>;
  inputs?: Record<string, ParsedBlockDef>; // 值输入插槽 (对应 ValueInput，例如 AMOUNT, WIDTH, HEIGHT, RADIUS, A, B)
  children?: ParsedBlockDef[]; // 容器子积木 (对应 Statement Input "DO")
}

/**
 * 递归解析简单数学表达式为 Blockly 积木定义树 (ParsedBlockDef)
 * 支持：
 * - 纯数字 -> math_number
 * - 变量标识符 -> b3d_var_get
 * - 四则运算 +, -, *, /, ** -> math_arithmetic
 * - 嵌套括号 (a + b) / 2
 */
export function parseExprToBlockDef(expr: string): ParsedBlockDef | null {
  if (!expr) return null;
  let s = expr.trim();
  if (!s) return null;

  // 1. 去除包裹的多余外层括号: 例如 ((a + b)) -> a + b
  while (s.startsWith("(") && s.endsWith(")")) {
    let depth = 0;
    let canStrip = true;
    for (let i = 0; i < s.length - 1; i++) {
      if (s[i] === "(") depth++;
      else if (s[i] === ")") depth--;
      if (depth === 0) {
        canStrip = false;
        break;
      }
    }
    if (canStrip) {
      s = s.slice(1, -1).trim();
    } else {
      break;
    }
  }

  // 2. 纯数字判断 (包括正负整数、浮点数)
  if (/^-?\d+(?:\.\d+)?$/.test(s)) {
    return {
      type: "math_number",
      fields: { NUM: Number(s) },
    };
  }

  // 3. 纯合法 Python 标识符 (变量引用)
  if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(s)) {
    return {
      type: "b3d_var_get",
      fields: { VAR: s },
    };
  }

  // 4. 操作符优先级分层拆分 (从低优先级到高优先级寻找顶层运算符)
  const tiers = [
    [
      { op: "+", blockOp: "ADD" },
      { op: "-", blockOp: "MINUS" },
    ],
    [
      { op: "*", blockOp: "MULTIPLY" },
      { op: "/", blockOp: "DIVIDE" },
    ],
    [
      { op: "**", blockOp: "POWER" },
    ],
  ];

  for (const tier of tiers) {
    let depth = 0;
    // 从右往左扫描以保持左结合律
    for (let i = s.length - 1; i >= 0; i--) {
      const ch = s[i];
      if (ch === ")") depth++;
      else if (ch === "(") depth--;
      else if (depth === 0) {
        for (const { op, blockOp } of tier) {
          if (op === "**") {
            if (s.slice(i, i + 2) === "**") {
              const leftStr = s.slice(0, i).trim();
              const rightStr = s.slice(i + 2).trim();
              const leftDef = parseExprToBlockDef(leftStr);
              const rightDef = parseExprToBlockDef(rightStr);
              if (leftDef && rightDef) {
                return {
                  type: "math_arithmetic",
                  fields: { OP: blockOp },
                  inputs: { A: leftDef, B: rightDef },
                };
              }
            }
          } else if (op === "*" && (s.slice(i, i + 2) === "**" || (i > 0 && s[i - 1] === "*"))) {
            // 跳过 **
            continue;
          } else if (s[i] === op) {
            // 排除一元负号
            if (op === "-" && (i === 0 || /[\+\-\*\/]\s*$/.test(s.slice(0, i)))) {
              continue;
            }
            const leftStr = s.slice(0, i).trim();
            const rightStr = s.slice(i + 1).trim();
            if (leftStr && rightStr) {
              const leftDef = parseExprToBlockDef(leftStr);
              const rightDef = parseExprToBlockDef(rightStr);
              if (leftDef && rightDef) {
                return {
                  type: "math_arithmetic",
                  fields: { OP: blockOp },
                  inputs: { A: leftDef, B: rightDef },
                };
              }
            }
          }
        }
      }
    }
  }

  return null;
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
 * 辅助：提取 with 语句中的 as 变量别名 (例如 with BuildPart() as ex15:)
 */
function extractVarAlias(text: string, defaultName: string): string {
  const m = text.match(/\bas\s+([a-zA-Z_]\w*)/i);
  return m ? m[1] : defaultName;
}

/**
 * 辅助：括号/元组敏感的顶层参数安全切分函数
 * 防止切断元组中的逗号，如 `l1 @ 1, l1 @ 1 + (0, b)` -> ["l1 @ 1", "l1 @ 1 + (0, b)"]
 */
function splitTopLevelArgs(argStr: string): string[] {
  const args: string[] = [];
  let current = "";
  let parenDepth = 0;
  let bracketDepth = 0;
  let braceDepth = 0;

  for (let i = 0; i < argStr.length; i++) {
    const char = argStr[i];
    if (char === "(") parenDepth++;
    else if (char === ")") parenDepth = Math.max(0, parenDepth - 1);
    else if (char === "[") bracketDepth++;
    else if (char === "]") bracketDepth = Math.max(0, bracketDepth - 1);
    else if (char === "{") braceDepth++;
    else if (char === "}") braceDepth = Math.max(0, braceDepth - 1);

    if (char === "," && parenDepth === 0 && bracketDepth === 0 && braceDepth === 0) {
      if (current.trim()) {
        args.push(current.trim());
      }
      current = "";
    } else {
      current += char;
    }
  }
  if (current.trim()) {
    args.push(current.trim());
  }
  return args;
}

/**
 * 辅助：安全切分顶层赋值语句中的 LHS 与 RHS
 * 仅在顶层单等号处切分，自动避开括号内的等号（如参数 kwargs `radius=10`）、比较符 `==`、`!=`、`<=`、`>=` 以及运算符 `+=` 等
 */
function splitTopLevelAssignment(line: string): { lhs: string; rhs: string } | null {
  let parenDepth = 0;
  let bracketDepth = 0;
  let braceDepth = 0;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === "(") parenDepth++;
    else if (char === ")") parenDepth = Math.max(0, parenDepth - 1);
    else if (char === "[") bracketDepth++;
    else if (char === "]") bracketDepth = Math.max(0, bracketDepth - 1);
    else if (char === "{") braceDepth++;
    else if (char === "}") braceDepth = Math.max(0, braceDepth - 1);

    if (parenDepth === 0 && bracketDepth === 0 && braceDepth === 0) {
      if (char === "=") {
        const prev = i > 0 ? line[i - 1] : "";
        const next = i + 1 < line.length ? line[i + 1] : "";
        if (
          prev === "=" ||
          prev === "!" ||
          prev === "<" ||
          prev === ">" ||
          prev === "+" ||
          prev === "-" ||
          prev === "*" ||
          prev === "/" ||
          next === "="
        ) {
          continue;
        }
        const lhs = line.slice(0, i).trim();
        const rhs = line.slice(i + 1).trim();
        if (lhs && rhs) {
          return { lhs, rhs };
        }
      }
    }
  }
  return null;
}

/**
 * 辅助：提取指定函数调用及其参数字符串与赋值变量名
 * 能够精确匹配嵌套括号，避免被内联注释或后续语句干扰
 */
function extractFunctionCall(line: string, fnName: string): { varName: string; argsStr: string } | null {
  const regex = new RegExp(`(?:([a-zA-Z_]\\w*)\\s*=\\s*)?${fnName}\\s*\\(`, "i");
  const match = line.match(regex);
  if (!match || match.index === undefined) return null;

  const varName = match[1] || "";
  const startIdx = match.index + match[0].length;
  let depth = 1;
  let endIdx = -1;

  for (let i = startIdx; i < line.length; i++) {
    const char = line[i];
    if (char === "(" || char === "[" || char === "{") depth++;
    else if (char === ")" || char === "]" || char === "}") {
      depth--;
      if (depth === 0) {
        endIdx = i;
        break;
      }
    }
  }

  if (endIdx === -1) return null;
  const argsStr = line.slice(startIdx, endIdx).trim();
  return { varName, argsStr };
}

/**
 * 辅助：提取 with <ContainerName>(...) 容器语句的参数字符串与别名
 * 支持深层括号嵌套，例如 with BuildSketch(example.faces().sort_by(Axis.Z)[-1]):
 * 以及可选的 as 别名，例如 with BuildSketch(...) as sk:
 */
function extractWithBlockCall(
  line: string,
  containerName: string
): { argsStr: string; alias: string; hasAlias: boolean } | null {
  const regex = new RegExp(`(?:^|\\s|\\b)with\\s+${containerName}\\s*\\(`, "i");
  const match = line.match(regex);
  if (!match || match.index === undefined) return null;

  const startIdx = match.index + match[0].length;
  let depth = 1;
  let endIdx = -1;

  for (let i = startIdx; i < line.length; i++) {
    const char = line[i];
    if (char === "(" || char === "[" || char === "{") depth++;
    else if (char === ")" || char === "]" || char === "}") {
      depth--;
      if (depth === 0) {
        endIdx = i;
        break;
      }
    }
  }

  if (endIdx === -1) return null;
  const argsStr = line.slice(startIdx, endIdx).trim();
  const rest = line.slice(endIdx + 1);
  const aliasMatch = rest.match(/\bas\s+([a-zA-Z_]\w*)/i);
  const hasAlias = !!aliasMatch;
  const alias = aliasMatch ? aliasMatch[1] : "";

  return { argsStr, alias, hasAlias };
}

/**
 * 逐行与缩进语法分析器，将 Python 代码解析为结构化积木树
 */
export function parseBuild123dCode(code: string): ParsedBlockDef[] {
  // 预处理多语句行 (如分号或同行误拼)
  const rawLines = code.split(/\r?\n/);
  const lines: string[] = [];
  for (const l of rawLines) {
    if (l.includes(";") && !l.includes("#")) {
      for (const sub of l.split(";")) {
        if (sub.trim()) lines.push(sub);
      }
      continue;
    }
    const inlineMatch = l.match(/^(\s*)(.*?\))\s{2,}((?:extrude|revolve|loft|fillet|chamfer|Circle|Rectangle|Box|Hole)\s*\(.*)$/);
    if (inlineMatch) {
      lines.push(inlineMatch[1] + inlineMatch[2]);
      lines.push(inlineMatch[1] + inlineMatch[3]);
      continue;
    }
    lines.push(l);
  }

  const blocks: ParsedBlockDef[] = [];

  // 当前激活的容器栈: { indent: number, block: ParsedBlockDef, isExplicitClose?: boolean }
  const stack: { indent: number; block: ParsedBlockDef; isExplicitClose?: boolean }[] = [];

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const rawLine = lines[lineIndex];
    const trimmed = rawLine.trim();

    // 跳过空行、pass 或标准导入
    if (
      !trimmed ||
      trimmed === "pass" ||
      trimmed.startsWith("from build123d") ||
      trimmed.startsWith("import build123d") ||
      trimmed.startsWith("from ocp_vscode") ||
      trimmed.startsWith("import ocp_vscode") ||
      trimmed.startsWith("import cadquery")
    ) {
      continue;
    }

    // 计算当前行缩进空格数
    const indent = rawLine.search(/\S|$/);

    // 弹出缩进比当前行更深或相等的容器 (若为显式闭合容器如 branch 则仅在当前行缩进严格小于其起始缩进时弹出)
    while (stack.length > 0) {
      const top = stack[stack.length - 1];
      if (top.isExplicitClose) {
        if (indent < top.indent) {
          stack.pop();
        } else {
          break;
        }
      } else if (top.indent >= indent) {
        stack.pop();
      } else {
        break;
      }
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
    if (/(?:^|\s|\b)with\s+BuildPart\s*\(/i.test(trimmed)) {
      const call = extractWithBlockCall(trimmed, "BuildPart");
      const plane = call && call.argsStr ? extractPlane(call.argsStr) : "XY";
      const varName = call && call.alias ? call.alias : extractVarAlias(trimmed, "part");
      const block: ParsedBlockDef = {
        type: "b3d_build_part",
        fields: { PLANE: plane, VAR_NAME: varName },
        children: [],
      };
      addBlock(block);
      stack.push({ indent, block });
      continue;
    }

    // 3. with BuildSketch(...) 容器 (支持任意面选择与嵌套参数)
    if (/(?:^|\s|\b)with\s+BuildSketch\s*\(/i.test(trimmed)) {
      const call = extractWithBlockCall(trimmed, "BuildSketch");
      let plane = "XY";
      let faceExpr = "";
      let parentVar = "part";

      // 从当前激活的容器栈中查找最近的 BuildPart 变量名
      for (let sIdx = stack.length - 1; sIdx >= 0; sIdx--) {
        if (stack[sIdx].block.type === "b3d_build_part") {
          const pv = String(stack[sIdx].block.fields.VAR_NAME || "").trim();
          if (pv) {
            parentVar = pv;
            break;
          }
        }
      }

      if (call && call.argsStr) {
        const arg = call.argsStr.trim();
        faceExpr = arg;

        // 若参数中显式写有实体变量名，如 example.faces()
        const varMatch = arg.match(/^([a-zA-Z_]\w*)\.faces\(\)/i);
        if (varMatch && varMatch[1]) {
          parentVar = varMatch[1];
        }

        // 智能方位判断
        if (/Axis\.Z/i.test(arg) && (/\[-1\]/i.test(arg) || /top/i.test(arg) || />Z/i.test(arg))) {
          plane = "TOP_FACE";
        } else if (/Axis\.Z/i.test(arg) && (/\[0\]/i.test(arg) || /bottom/i.test(arg) || /<Z/i.test(arg))) {
          plane = "BOTTOM_FACE";
        } else if (/Axis\.X/i.test(arg) && (/\[-1\]/i.test(arg) || />X/i.test(arg))) {
          plane = "RIGHT_FACE";
        } else if (/Axis\.X/i.test(arg) && (/\[0\]/i.test(arg) || /<X/i.test(arg))) {
          plane = "LEFT_FACE";
        } else if (/Axis\.Y/i.test(arg) && (/\[-1\]/i.test(arg) || />Y/i.test(arg))) {
          plane = "FRONT_FACE";
        } else if (/Axis\.Y/i.test(arg) && (/\[0\]/i.test(arg) || /<Y/i.test(arg))) {
          plane = "BACK_FACE";
        } else if (/Plane\.XZ/i.test(arg)) {
          plane = "XZ";
        } else if (/Plane\.YZ/i.test(arg)) {
          plane = "YZ";
        } else if (/Plane\.XY/i.test(arg) || !arg) {
          plane = "XY";
        } else {
          plane = "CUSTOM";
        }
      }

      const varName = call?.alias || "sk";
      const hasAlias = call?.hasAlias ? "TRUE" : "FALSE";

      const block: ParsedBlockDef = {
        type: "b3d_build_sketch",
        fields: {
          PLANE: plane,
          VAR_NAME: varName,
          FACE_EXPR: faceExpr || `${parentVar}.faces().sort_by(Axis.Z)[-1]`,
          PARENT_VAR: parentVar,
          HAS_ALIAS: hasAlias,
        },
        children: [],
      };
      addBlock(block);
      stack.push({ indent, block });
      continue;
    }

    // 3.5 with BuildLine(...) 路径建造者容器
    if (/with\s+BuildLine\s*\((.*?)\)/i.test(trimmed)) {
      const varName = extractVarAlias(trimmed, "ln");
      const block: ParsedBlockDef = {
        type: "b3d_build_line",
        fields: { VAR_NAME: varName },
        children: [],
      };
      addBlock(block);
      stack.push({ indent, block });
      continue;
    }

    // 3.5 with Turtle3D(...) 3D 空间海龟绘图容器
    if (/(?:^|\s|\b)with\s+Turtle3D\s*\(/i.test(trimmed)) {
      const call = extractWithBlockCall(trimmed, "Turtle3D");
      let radius = "1.0";
      let color = "#10b981";
      if (call && call.argsStr) {
        const args = splitTopLevelArgs(call.argsStr);
        for (const arg of args) {
          if (/^radius\s*=/i.test(arg)) radius = arg.replace(/^radius\s*=\s*/i, "").trim();
          else if (/^color\s*=/i.test(arg)) color = arg.replace(/^color\s*=\s*["']?([^"']+)["']?/i, "$1").trim();
          else if (!arg.includes("=")) radius = arg.trim();
        }
      }
      const varName = call && call.alias ? call.alias : "t";
      const block: ParsedBlockDef = {
        type: "b3d_turtle3d_container",
        fields: {
          VAR_NAME: varName,
          RADIUS: Number(radius) || 1.0,
          COLOR: color,
        },
        children: [],
      };
      addBlock(block);
      stack.push({ indent, block });
      continue;
    }

    // 4. with Locations(...) 定位容器
    if (/with\s+Locations\s*\((.*)\)/i.test(trimmed)) {
      const innerMatch = trimmed.match(/with\s+Locations\s*\((.*)\)/i);
      const inner = innerMatch ? innerMatch[1].trim() : "";
      const tupleMatch = inner.match(/\(\s*([^\)]+)\s*\)/);
      const parts = tupleMatch ? splitTopLevelArgs(tupleMatch[1]) : splitTopLevelArgs(inner);
      const block: ParsedBlockDef = {
        type: "b3d_locations",
        fields: {
          X: parts[0] || "0",
          Y: parts[1] || "0",
          Z: parts[2] || "0",
        },
        children: [],
      };
      addBlock(block);
      stack.push({ indent, block });
      continue;
    }

    // 5. with GridLocations(...) 矩形网格阵列
    if (/with\s+GridLocations\s*\((.*)\)/i.test(trimmed)) {
      const argsMatch = trimmed.match(/with\s+GridLocations\s*\((.*)\)/i);
      const innerArgs = argsMatch ? argsMatch[1] : "";
      const args = splitTopLevelArgs(innerArgs);
      let xs = "15", ys = "15", xc = "3", yc = "3";
      let posIdx = 0;
      for (const arg of args) {
        if (/^x_spacing\s*=/i.test(arg)) xs = arg.replace(/^x_spacing\s*=\s*/i, "").trim();
        else if (/^y_spacing\s*=/i.test(arg)) ys = arg.replace(/^y_spacing\s*=\s*/i, "").trim();
        else if (/^x_count\s*=/i.test(arg)) xc = arg.replace(/^x_count\s*=\s*/i, "").trim();
        else if (/^y_count\s*=/i.test(arg)) yc = arg.replace(/^y_count\s*=\s*/i, "").trim();
        else if (!arg.includes("=")) {
          if (posIdx === 0) xs = arg;
          else if (posIdx === 1) ys = arg;
          else if (posIdx === 2) xc = arg;
          else if (posIdx === 3) yc = arg;
          posIdx++;
        }
      }
      const block: ParsedBlockDef = {
        type: "b3d_grid_locations",
        fields: {
          X_SPACING: xs,
          Y_SPACING: ys,
          X_COUNT: xc,
          Y_COUNT: yc,
        },
        children: [],
      };
      addBlock(block);
      stack.push({ indent, block });
      continue;
    }

    // 6. with PolarLocations(...) 环形极坐标阵列
    if (/with\s+PolarLocations\s*\((.*)\)/i.test(trimmed)) {
      const innerMatch = trimmed.match(/with\s+PolarLocations\s*\((.*)\)/i);
      const innerArgs = innerMatch ? innerMatch[1] : "";
      const args = splitTopLevelArgs(innerArgs);
      let r = "20", c = "6";
      let posIdx = 0;
      for (const arg of args) {
        if (/^radius\s*=/i.test(arg)) r = arg.replace(/^radius\s*=\s*/i, "").trim();
        else if (/^count\s*=/i.test(arg)) c = arg.replace(/^count\s*=\s*/i, "").trim();
        else if (!arg.includes("=")) {
          if (posIdx === 0) r = arg;
          else if (posIdx === 1) c = arg;
          posIdx++;
        }
      }
      const block: ParsedBlockDef = {
        type: "b3d_polar_locations",
        fields: {
          RADIUS: r,
          COUNT: c,
        },
        children: [],
      };
      addBlock(block);
      stack.push({ indent, block });
      continue;
    }

    // 7. with HexLocations(...) 蜂窝六边形阵列
    if (/with\s+HexLocations\s*\((.*)\)/i.test(trimmed)) {
      const innerMatch = trimmed.match(/with\s+HexLocations\s*\((.*)\)/i);
      const innerArgs = innerMatch ? innerMatch[1] : "";
      const args = splitTopLevelArgs(innerArgs);
      let apothem = "10", xc = "3", yc = "3";
      let posIdx = 0;
      for (const arg of args) {
        if (/^apothem\s*=/i.test(arg)) apothem = arg.replace(/^apothem\s*=\s*/i, "").trim();
        else if (/^x_count\s*=/i.test(arg)) xc = arg.replace(/^x_count\s*=\s*/i, "").trim();
        else if (/^y_count\s*=/i.test(arg)) yc = arg.replace(/^y_count\s*=\s*/i, "").trim();
        else if (!arg.includes("=")) {
          if (posIdx === 0) apothem = arg;
          else if (posIdx === 1) xc = arg;
          else if (posIdx === 2) yc = arg;
          posIdx++;
        }
      }
      const block: ParsedBlockDef = {
        type: "b3d_hex_locations",
        fields: {
          APOTHEM: apothem,
          X_COUNT: xc,
          Y_COUNT: yc,
        },
        children: [],
      };
      addBlock(block);
      stack.push({ indent, block });
      continue;
    }

    // 8. 3D 基础实体: Box
    if (/(?:^|\s|\b)Box\s*\((.*)\)/i.test(trimmed)) {
      const innerMatch = trimmed.match(/Box\s*\((.*)\)/i);
      const innerArgs = innerMatch ? innerMatch[1] : "";
      const args = splitTopLevelArgs(innerArgs);
      let l = "20", w = "20", h = "10";
      let posIdx = 0;
      for (const arg of args) {
        if (/^length\s*=/i.test(arg)) l = arg.replace(/^length\s*=\s*/i, "").trim();
        else if (/^width\s*=/i.test(arg)) w = arg.replace(/^width\s*=\s*/i, "").trim();
        else if (/^height\s*=/i.test(arg)) h = arg.replace(/^height\s*=\s*/i, "").trim();
        else if (/^mode\s*=/i.test(arg)) { /* handled by extractMode */ }
        else if (!arg.includes("=")) {
          if (posIdx === 0) l = arg;
          else if (posIdx === 1) w = arg;
          else if (posIdx === 2) h = arg;
          posIdx++;
        }
      }
      addBlock({
        type: "b3d_box",
        fields: {
          LENGTH: l,
          WIDTH: w,
          HEIGHT: h,
          MODE: extractMode(trimmed),
        },
      });
      continue;
    }

    // 9. 3D 基础实体: Cylinder
    if (/(?:^|\s|\b)Cylinder\s*\((.*)\)/i.test(trimmed)) {
      const innerMatch = trimmed.match(/Cylinder\s*\((.*)\)/i);
      const innerArgs = innerMatch ? innerMatch[1] : "";
      const args = splitTopLevelArgs(innerArgs);
      let r = "10", h = "20";
      let posIdx = 0;
      for (const arg of args) {
        if (/^radius\s*=/i.test(arg)) r = arg.replace(/^radius\s*=\s*/i, "").trim();
        else if (/^height\s*=/i.test(arg)) h = arg.replace(/^height\s*=\s*/i, "").trim();
        else if (!arg.includes("=")) {
          if (posIdx === 0) r = arg;
          else if (posIdx === 1) h = arg;
          posIdx++;
        }
      }
      addBlock({
        type: "b3d_cylinder",
        fields: {
          RADIUS: r,
          HEIGHT: h,
          MODE: extractMode(trimmed),
        },
      });
      continue;
    }

    // 10. 3D 基础实体: Sphere
    if (/(?:^|\s|\b)Sphere\s*\((.*)\)/i.test(trimmed)) {
      const innerMatch = trimmed.match(/Sphere\s*\((.*)\)/i);
      const innerArgs = innerMatch ? innerMatch[1] : "";
      const args = splitTopLevelArgs(innerArgs);
      let r = "10";
      for (const arg of args) {
        if (/^radius\s*=/i.test(arg)) r = arg.replace(/^radius\s*=\s*/i, "").trim();
        else if (!arg.includes("=")) r = arg;
      }
      addBlock({
        type: "b3d_sphere",
        fields: {
          RADIUS: r,
          MODE: extractMode(trimmed),
        },
      });
      continue;
    }

    // 11. 3D 基础实体: Cone
    if (/(?:^|\s|\b)Cone\s*\((.*)\)/i.test(trimmed)) {
      const innerMatch = trimmed.match(/Cone\s*\((.*)\)/i);
      const innerArgs = innerMatch ? innerMatch[1] : "";
      const args = splitTopLevelArgs(innerArgs);
      let r1 = "15", r2 = "5", h = "20";
      let posIdx = 0;
      for (const arg of args) {
        if (/^(?:bottom_radius|r1)\s*=/i.test(arg)) r1 = arg.replace(/^(?:bottom_radius|r1)\s*=\s*/i, "").trim();
        else if (/^(?:top_radius|r2)\s*=/i.test(arg)) r2 = arg.replace(/^(?:top_radius|r2)\s*=\s*/i, "").trim();
        else if (/^height\s*=/i.test(arg)) h = arg.replace(/^height\s*=\s*/i, "").trim();
        else if (!arg.includes("=")) {
          if (posIdx === 0) r1 = arg;
          else if (posIdx === 1) r2 = arg;
          else if (posIdx === 2) h = arg;
          posIdx++;
        }
      }
      addBlock({
        type: "b3d_cone",
        fields: {
          R1: r1,
          R2: r2,
          HEIGHT: h,
          MODE: extractMode(trimmed),
        },
      });
      continue;
    }

    // 12. 3D 基础实体: Torus
    if (/(?:^|\s|\b)Torus\s*\((.*)\)/i.test(trimmed)) {
      const innerMatch = trimmed.match(/Torus\s*\((.*)\)/i);
      const innerArgs = innerMatch ? innerMatch[1] : "";
      const args = splitTopLevelArgs(innerArgs);
      let r1 = "20", r2 = "5";
      let posIdx = 0;
      for (const arg of args) {
        if (/^(?:major_radius|r1)\s*=/i.test(arg)) r1 = arg.replace(/^(?:major_radius|r1)\s*=\s*/i, "").trim();
        else if (/^(?:minor_radius|r2)\s*=/i.test(arg)) r2 = arg.replace(/^(?:minor_radius|r2)\s*=\s*/i, "").trim();
        else if (!arg.includes("=")) {
          if (posIdx === 0) r1 = arg;
          else if (posIdx === 1) r2 = arg;
          posIdx++;
        }
      }
      addBlock({
        type: "b3d_torus",
        fields: {
          R1: r1,
          R2: r2,
          MODE: extractMode(trimmed),
        },
      });
      continue;
    }

    // 12.5 3D 基础实体: Wedge (斜角楔形实体)
    if (/(?:^|\s|\b)Wedge\s*\((.*)\)/i.test(trimmed)) {
      const call = extractFunctionCall(trimmed, "Wedge");
      let dx = "20", dy = "20", dz = "15", xmin = "5", zmin = "0", xmax = "15", zmax = "10";
      if (call) {
        const args = splitTopLevelArgs(call.argsStr);
        for (const arg of args) {
          if (/^dx\s*=/i.test(arg)) dx = arg.replace(/^dx\s*=/i, "").trim();
          else if (/^dy\s*=/i.test(arg)) dy = arg.replace(/^dy\s*=/i, "").trim();
          else if (/^dz\s*=/i.test(arg)) dz = arg.replace(/^dz\s*=/i, "").trim();
          else if (/^xmin\s*=/i.test(arg)) xmin = arg.replace(/^xmin\s*=/i, "").trim();
          else if (/^zmin\s*=/i.test(arg)) zmin = arg.replace(/^zmin\s*=/i, "").trim();
          else if (/^xmax\s*=/i.test(arg)) xmax = arg.replace(/^xmax\s*=/i, "").trim();
          else if (/^zmax\s*=/i.test(arg)) zmax = arg.replace(/^zmax\s*=/i, "").trim();
        }
      }
      addBlock({
        type: "b3d_wedge",
        fields: {
          DX: dx,
          DY: dy,
          DZ: dz,
          XMIN: xmin,
          ZMIN: zmin,
          XMAX: xmax,
          ZMAX: zmax,
          MODE: extractMode(trimmed),
        },
      });
      continue;
    }

    // 13. 2D 草图: Rectangle
    if (/(?:^|\s|\b)Rectangle\s*\((.*)\)/i.test(trimmed)) {
      const call = extractFunctionCall(trimmed, "Rectangle");
      const args = call ? splitTopLevelArgs(call.argsStr) : splitTopLevelArgs(trimmed.match(/Rectangle\s*\((.*)\)/i)?.[1] || "");
      let w = "20", h = "20";
      let posIdx = 0;
      for (const arg of args) {
        if (/^(?:width|xLen)\s*=/i.test(arg)) w = arg.replace(/^(?:width|xLen)\s*=\s*/i, "").trim();
        else if (/^(?:height|yLen)\s*=/i.test(arg)) h = arg.replace(/^(?:height|yLen)\s*=\s*/i, "").trim();
        else if (/^mode\s*=/i.test(arg)) { /* handled by extractMode */ }
        else if (!arg.includes("=")) {
          if (posIdx === 0) w = arg.trim();
          else if (posIdx === 1) h = arg.trim();
          posIdx++;
        }
      }
      const wVal = parseExprToBlockDef(w);
      const hVal = parseExprToBlockDef(h);
      const inputs: Record<string, ParsedBlockDef> = {};
      const fields: Record<string, string | number> = {
        MODE: extractMode(trimmed),
      };
      if (wVal) inputs["WIDTH"] = wVal;
      else fields["WIDTH"] = w;
      if (hVal) inputs["HEIGHT"] = hVal;
      else fields["HEIGHT"] = h;

      addBlock({
        type: "b3d_sketch_rect",
        fields,
        inputs: Object.keys(inputs).length > 0 ? inputs : undefined,
      });
      continue;
    }

    // 14. 2D 草图: Circle
    if (/(?:^|\s|\b)Circle\s*\((.*)\)/i.test(trimmed)) {
      const call = extractFunctionCall(trimmed, "Circle");
      const args = call ? splitTopLevelArgs(call.argsStr) : splitTopLevelArgs(trimmed.match(/Circle\s*\((.*)\)/i)?.[1] || "");
      let r = "10";
      let posIdx = 0;
      for (const arg of args) {
        if (/^radius\s*=/i.test(arg)) r = arg.replace(/^radius\s*=\s*/i, "").trim();
        else if (/^mode\s*=/i.test(arg)) { /* handled by extractMode */ }
        else if (!arg.includes("=")) {
          if (posIdx === 0) r = arg.trim();
          posIdx++;
        }
      }
      const rVal = parseExprToBlockDef(r);
      const inputs: Record<string, ParsedBlockDef> = {};
      const fields: Record<string, string | number> = {
        MODE: extractMode(trimmed),
      };
      if (rVal) inputs["RADIUS"] = rVal;
      else fields["RADIUS"] = r;

      addBlock({
        type: "b3d_sketch_circle",
        fields,
        inputs: Object.keys(inputs).length > 0 ? inputs : undefined,
      });
      continue;
    }

    // 15. 2D 草图: RegularPolygon (支持数值、变量名或运算表达式)
    if (/(?:^|\s|\b)RegularPolygon\s*\((.*)\)/i.test(trimmed)) {
      const call = extractFunctionCall(trimmed, "RegularPolygon");
      let r = "10", sides = "6";
      if (call) {
        const args = splitTopLevelArgs(call.argsStr);
        let posIdx = 0;
        for (const arg of args) {
          if (/^radius\s*=/i.test(arg)) r = arg.replace(/^radius\s*=\s*/i, "").trim();
          else if (/^side_count\s*=/i.test(arg)) sides = arg.replace(/^side_count\s*=\s*/i, "").trim();
          else if (/^mode\s*=/i.test(arg)) { /* handled by extractMode */ }
          else if (!arg.includes("=")) {
            if (posIdx === 0) r = arg.trim();
            else if (posIdx === 1) sides = arg.trim();
            posIdx++;
          }
        }
      }
      addBlock({
        type: "b3d_sketch_regular_polygon",
        fields: {
          RADIUS: r,
          SIDES: sides,
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

    // 16.2 路径线段: Line (支持 l1 = Line(...) 及 @ 端点运算符 / 向量运算)
    const lineCall = extractFunctionCall(trimmed, "Line");
    if (lineCall) {
      const args = splitTopLevelArgs(lineCall.argsStr);
      addBlock({
        type: "b3d_line",
        fields: {
          VAR_NAME: lineCall.varName,
          START_PT: args[0] || "(0, 0)",
          END_PT: args[1] || "(10, 0)",
        },
      });
      continue;
    }

    // 16.25 三点圆弧: ThreePointArc (支持 a1 = ThreePointArc(...) 或直接 ThreePointArc(...))
    const arcCall = extractFunctionCall(trimmed, "ThreePointArc");
    if (arcCall) {
      let argsStr = arcCall.argsStr.trim();
      if (/^pts\s*=/i.test(argsStr)) {
        argsStr = argsStr.replace(/^pts\s*=\s*/i, "").trim();
      }
      if (argsStr.startsWith("[") && argsStr.endsWith("]")) {
        argsStr = argsStr.slice(1, -1).trim();
      }
      const rawArgs = splitTopLevelArgs(argsStr);
      const positionalArgs = rawArgs.filter((a) => !/^\s*mode\s*=/i.test(a));
      addBlock({
        type: "b3d_three_point_arc",
        fields: {
          VAR_NAME: arcCall.varName,
          PT1: positionalArgs[0] || "(0, 0)",
          PT2: positionalArgs[1] || "(5, 5)",
          PT3: positionalArgs[2] || "(10, 0)",
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
    // 17. 2D 草图: Slot2D
    if (/(?:^|\s|\b)Slot2D\s*\((.*)\)/i.test(trimmed)) {
      const innerMatch = trimmed.match(/Slot2D\s*\((.*)\)/i);
      const innerArgs = innerMatch ? innerMatch[1] : "";
      const args = splitTopLevelArgs(innerArgs);
      let l = "30", w = "10", rot = "0";
      let posIdx = 0;
      for (const arg of args) {
        if (/^length\s*=/i.test(arg)) l = arg.replace(/^length\s*=\s*/i, "").trim();
        else if (/^width\s*=/i.test(arg)) w = arg.replace(/^width\s*=\s*/i, "").trim();
        else if (/^rotation\s*=/i.test(arg)) rot = arg.replace(/^rotation\s*=\s*/i, "").trim();
        else if (!arg.includes("=")) {
          if (posIdx === 0) l = arg;
          else if (posIdx === 1) w = arg;
          else if (posIdx === 2) rot = arg;
          posIdx++;
        }
      }
      addBlock({
        type: "b3d_sketch_slot",
        fields: {
          LENGTH: l,
          WIDTH: w,
          ROTATION: rot,
          MODE: extractMode(trimmed),
        },
      });
      continue;
    }

    // 17.5 2D 草图: Ellipse (椭圆)
    if (/(?:^|\s|\b)Ellipse\s*\((.*)\)/i.test(trimmed)) {
      const call = extractFunctionCall(trimmed, "Ellipse");
      let xr = "20", yr = "10";
      if (call) {
        const args = splitTopLevelArgs(call.argsStr);
        let posIdx = 0;
        for (const arg of args) {
          if (/^(?:x_radius|x_r)\s*=/i.test(arg)) xr = arg.replace(/^(?:x_radius|x_r)\s*=\s*/i, "").trim();
          else if (/^(?:y_radius|y_r)\s*=/i.test(arg)) yr = arg.replace(/^(?:y_radius|y_r)\s*=\s*/i, "").trim();
          else if (/^mode\s*=/i.test(arg)) { /* handled by extractMode */ }
          else if (!arg.includes("=")) {
            if (posIdx === 0) xr = arg.trim();
            else if (posIdx === 1) yr = arg.trim();
            posIdx++;
          }
        }
      }
      addBlock({
        type: "b3d_sketch_ellipse",
        fields: {
          X_RADIUS: xr,
          Y_RADIUS: yr,
          MODE: extractMode(trimmed),
        },
      });
      continue;
    }

    // 17.6 2D 草图: Text (刻字文本)
    if (/(?:^|\s|\b)Text\s*\((.*)\)/i.test(trimmed)) {
      const call = extractFunctionCall(trimmed, "Text");
      let text = "BUILD123D", size = "12";
      if (call) {
        const args = splitTopLevelArgs(call.argsStr);
        let posIdx = 0;
        for (const arg of args) {
          if (/^(?:txt|text)\s*=/i.test(arg)) {
            const raw = arg.replace(/^(?:txt|text)\s*=\s*/i, "").trim();
            text = raw.replace(/^["']|["']$/g, "");
          } else if (/^font_size\s*=/i.test(arg)) {
            size = arg.replace(/^font_size\s*=\s*/i, "").trim();
          } else if (/^mode\s*=/i.test(arg)) {
            // handled by extractMode
          } else if (!arg.includes("=")) {
            if (posIdx === 0) text = arg.trim().replace(/^["']|["']$/g, "");
            else if (posIdx === 1) size = arg.trim();
            posIdx++;
          }
        }
      }
      addBlock({
        type: "b3d_sketch_text",
        fields: {
          TEXT: text,
          FONT_SIZE: size,
          MODE: extractMode(trimmed),
        },
      });
      continue;
    }

    // 18. 3D 特征: extrude (支持数值、变量名或运算表达式，如 2 * thickness、(a + b) / 2)
    if (/(?:^|\s|\b)extrude\s*\((.*)\)/i.test(trimmed)) {
      const call = extractFunctionCall(trimmed, "extrude");
      let amount = "10";
      if (call) {
        const args = splitTopLevelArgs(call.argsStr);
        let posIdx = 0;
        for (const arg of args) {
          if (/^amount\s*=/i.test(arg)) {
            amount = arg.replace(/^amount\s*=\s*/i, "").trim();
          } else if (/^mode\s*=/i.test(arg)) {
            // handled by extractMode
          } else if (!arg.includes("=")) {
            if (posIdx === 0) amount = arg.trim();
            posIdx++;
          }
        }
      }
      const amountVal = parseExprToBlockDef(amount);
      const inputs: Record<string, ParsedBlockDef> = {};
      const fields: Record<string, string | number> = {
        MODE: extractMode(trimmed),
      };
      if (amountVal) inputs["AMOUNT"] = amountVal;
      else fields["AMOUNT"] = amount;

      addBlock({
        type: "b3d_extrude",
        fields,
        inputs: Object.keys(inputs).length > 0 ? inputs : undefined,
      });
      continue;
    }

    // 19. 3D 特征: revolve (支持角度运算表达式，如 360 / 2、revolution_arc=angle_step * 4)
    if (/(?:^|\s|\b)revolve\s*\((.*)\)/i.test(trimmed)) {
      const call = extractFunctionCall(trimmed, "revolve");
      let angle = "360";
      let axis = "Axis.Z";
      if (call) {
        const args = splitTopLevelArgs(call.argsStr);
        let posIdx = 0;
        for (const arg of args) {
          if (/^(?:revolution_arc|angle)\s*=/i.test(arg)) {
            angle = arg.replace(/^(?:revolution_arc|angle)\s*=\s*/i, "").trim();
          } else if (/^axis\s*=/i.test(arg)) {
            const axisVal = arg.replace(/^axis\s*=\s*/i, "").trim();
            if (/Axis\.X/i.test(axisVal)) axis = "Axis.X";
            else if (/Axis\.Y/i.test(axisVal)) axis = "Axis.Y";
            else axis = "Axis.Z";
          } else if (/^mode\s*=/i.test(arg)) {
            // handled by extractMode
          } else if (!arg.includes("=")) {
            if (/Axis\.[XYZ]/i.test(arg)) {
              if (/Axis\.X/i.test(arg)) axis = "Axis.X";
              else if (/Axis\.Y/i.test(arg)) axis = "Axis.Y";
              else axis = "Axis.Z";
            } else {
              angle = arg.trim();
            }
            posIdx++;
          }
        }
      }
      const angleVal = parseExprToBlockDef(angle);
      const inputs: Record<string, ParsedBlockDef> = {};
      const fields: Record<string, string | number> = {
        AXIS: axis,
        MODE: extractMode(trimmed),
      };
      if (angleVal) inputs["ANGLE"] = angleVal;
      else fields["ANGLE"] = angle;

      addBlock({
        type: "b3d_revolve",
        fields,
        inputs: Object.keys(inputs).length > 0 ? inputs : undefined,
      });
      continue;
    }

    // 20. 3D 特征: fillet
    if (/(?:^|\s|\b)fillet\s*\((.*)\)/i.test(trimmed)) {
      const innerMatch = trimmed.match(/fillet\s*\((.*)\)/i);
      const innerArgs = innerMatch ? innerMatch[1] : "";
      const args = splitTopLevelArgs(innerArgs);
      let target = "";
      let radius = "2";
      for (const arg of args) {
        if (/^radius\s*=/i.test(arg)) {
          radius = arg.replace(/^radius\s*=\s*/i, "").trim();
        } else if (/^(?:edges|objects)\s*=/i.test(arg)) {
          target = arg.replace(/^(?:edges|objects)\s*=\s*/i, "").trim();
        } else if (!arg.includes("=")) {
          if (!target) target = arg;
          else radius = arg;
        }
      }
      if (!target) target = "part.edges()";
      addBlock({
        type: "b3d_fillet",
        fields: {
          RADIUS: radius,
          TARGET: target,
        },
      });
      continue;
    }

    // 21. 3D 特征: chamfer
    if (/(?:^|\s|\b)chamfer\s*\((.*)\)/i.test(trimmed)) {
      const innerMatch = trimmed.match(/chamfer\s*\((.*)\)/i);
      const innerArgs = innerMatch ? innerMatch[1] : "";
      const args = splitTopLevelArgs(innerArgs);
      let target = "";
      let length = "1";
      for (const arg of args) {
        if (/^length\s*=/i.test(arg)) {
          length = arg.replace(/^length\s*=\s*/i, "").trim();
        } else if (/^(?:edges|objects)\s*=/i.test(arg)) {
          target = arg.replace(/^(?:edges|objects)\s*=\s*/i, "").trim();
        } else if (!arg.includes("=")) {
          if (!target) target = arg;
          else length = arg;
        }
      }
      if (!target) target = "part.edges()";
      addBlock({
        type: "b3d_chamfer",
        fields: {
          LENGTH: length,
          TARGET: target,
        },
      });
      continue;
    }

    // 22. 3D 特征: Hole
    if (/(?:^|\s|\b)Hole\s*\((.*)\)/i.test(trimmed)) {
      const innerMatch = trimmed.match(/Hole\s*\((.*)\)/i);
      const innerArgs = innerMatch ? innerMatch[1] : "";
      const args = splitTopLevelArgs(innerArgs);
      let r = "3";
      let depth = "";
      let posIdx = 0;
      for (const arg of args) {
        if (/^radius\s*=/i.test(arg)) {
          r = arg.replace(/^radius\s*=\s*/i, "").trim();
        } else if (/^depth\s*=/i.test(arg)) {
          depth = arg.replace(/^depth\s*=\s*/i, "").trim();
        } else if (!arg.includes("=")) {
          if (posIdx === 0) r = arg;
          else if (posIdx === 1) depth = arg;
          posIdx++;
        }
      }
      addBlock({
        type: "b3d_hole",
        fields: {
          RADIUS: r,
          DEPTH: depth,
        },
      });
      continue;
    }

    // 23. 3D 特征: offset (支持数值、变量名或运算表达式)
    if (/(?:^|\s|\b)offset\s*\((.*)\)/i.test(trimmed)) {
      const call = extractFunctionCall(trimmed, "offset");
      let amount = "2";
      if (call) {
        const args = splitTopLevelArgs(call.argsStr);
        let posIdx = 0;
        for (const arg of args) {
          if (/^amount\s*=/i.test(arg)) {
            amount = arg.replace(/^amount\s*=/i, "").trim();
          } else if (!arg.includes("=")) {
            if (posIdx === 0) amount = arg.trim();
            posIdx++;
          }
        }
      }
      addBlock({
        type: "b3d_offset",
        fields: {
          AMOUNT: amount,
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

    // 25.5 镜像对称操作: mirror
    if (/mirror\s*\((.*)\)/i.test(trimmed)) {
      const innerMatch = trimmed.match(/mirror\s*\((.*)\)/i);
      const innerArgs = innerMatch ? innerMatch[1] : "";
      const args = splitTopLevelArgs(innerArgs);
      let target = "";
      let about = "Plane.YZ";
      for (const arg of args) {
        if (/about\s*=\s*(.+)/i.test(arg)) {
          const abMatch = arg.match(/about\s*=\s*(.+)/i);
          if (abMatch) {
            const rawAbout = abMatch[1].trim();
            if (/XZ/i.test(rawAbout)) about = "Plane.XZ";
            else if (/XY/i.test(rawAbout)) about = "Plane.XY";
            else if (/YZ/i.test(rawAbout)) about = "Plane.YZ";
            else about = rawAbout;
          }
        } else if (/objects\s*=\s*(.+)/i.test(arg)) {
          const objMatch = arg.match(/objects\s*=\s*(.+)/i);
          if (objMatch) target = objMatch[1].trim();
        } else if (arg.trim()) {
          target = arg.trim();
        }
      }
      addBlock({
        type: "b3d_mirror",
        fields: {
          TARGET: target,
          ABOUT: about,
        },
      });
      continue;
    }

    // 25.6 3D 空间海龟绘图方法识别 (LogoUp 3D Turtle)
    // t.forward / t.fd / t.backward / t.bk
    const turtleMoveMatch = trimmed.match(/^([a-zA-Z_]\w*)\.(forward|fd|backward|bk)\s*\((.*)\)/i);
    if (turtleMoveMatch) {
      const vName = turtleMoveMatch[1];
      const fn = turtleMoveMatch[2].toLowerCase();
      const dist = turtleMoveMatch[3].trim() || "20";
      const dir = (fn === "backward" || fn === "bk") ? "BACKWARD" : "FORWARD";
      addBlock({
        type: "b3d_turtle3d_forward",
        fields: {
          VAR_NAME: vName,
          DIR: dir,
          DISTANCE: Number(dist) || 20,
        },
      });
      continue;
    }

    // t.turn_left / t.lt / t.turn_right / t.rt / t.turn
    const turtleTurnMatch = trimmed.match(/^([a-zA-Z_]\w*)\.(turn_left|lt|turn_right|rt|turn)\s*\((.*)\)/i);
    if (turtleTurnMatch) {
      const vName = turtleTurnMatch[1];
      const fn = turtleTurnMatch[2].toLowerCase();
      let rawAng = turtleTurnMatch[3].trim() || "90";
      let numAng = Number(rawAng);
      let dir = (fn === "turn_right" || fn === "rt") ? "RIGHT" : "LEFT";
      if (fn === "turn") {
        if (!isNaN(numAng) && numAng < 0) {
          dir = "LEFT";
          numAng = Math.abs(numAng);
        } else {
          dir = "RIGHT";
        }
      }
      addBlock({
        type: "b3d_turtle3d_turn",
        fields: {
          VAR_NAME: vName,
          DIR: dir,
          ANGLE: !isNaN(numAng) ? numAng : 90,
        },
      });
      continue;
    }

    // t.pitch_up / t.up / t.pitch_down / t.down / t.pitch
    const turtlePitchMatch = trimmed.match(/^([a-zA-Z_]\w*)\.(pitch_up|up_turn|up|pitch_down|down_turn|down|pitch)\s*\((.*)\)/i);
    if (turtlePitchMatch) {
      const vName = turtlePitchMatch[1];
      const fn = turtlePitchMatch[2].toLowerCase();
      let rawAng = turtlePitchMatch[3].trim() || "45";
      let numAng = Number(rawAng);
      let dir = fn.includes("down") ? "DOWN" : "UP";
      if (fn === "pitch") {
        if (!isNaN(numAng) && numAng < 0) {
          dir = "DOWN";
          numAng = Math.abs(numAng);
        } else {
          dir = "UP";
        }
      }
      addBlock({
        type: "b3d_turtle3d_pitch",
        fields: {
          VAR_NAME: vName,
          DIR: dir,
          ANGLE: !isNaN(numAng) ? numAng : 45,
        },
      });
      continue;
    }

    // t.roll_left / t.roll_l / t.roll_right / t.roll_r / t.roll
    const turtleRollMatch = trimmed.match(/^([a-zA-Z_]\w*)\.(roll_left|roll_l|roll_right|roll_r|roll)\s*\((.*)\)/i);
    if (turtleRollMatch) {
      const vName = turtleRollMatch[1];
      const fn = turtleRollMatch[2].toLowerCase();
      let rawAng = turtleRollMatch[3].trim() || "45";
      let numAng = Number(rawAng);
      let dir = (fn.includes("right") || fn === "roll_r" || fn === "roll") ? "RIGHT" : "LEFT";
      if (fn === "roll" && !isNaN(numAng) && numAng < 0) {
        dir = "LEFT";
        numAng = Math.abs(numAng);
      }
      addBlock({
        type: "b3d_turtle3d_roll",
        fields: {
          VAR_NAME: vName,
          DIR: dir,
          ANGLE: !isNaN(numAng) ? numAng : 45,
        },
      });
      continue;
    }

    // t.arc_left / t.arc_right / t.arc_up / t.arc_down
    const turtleArcMatch = trimmed.match(/^([a-zA-Z_]\w*)\.(arc_left|arc_right|arc_up|arc_down)\s*\((.*)\)/i);
    if (turtleArcMatch) {
      const vName = turtleArcMatch[1];
      const fn = turtleArcMatch[2].toLowerCase();
      const args = splitTopLevelArgs(turtleArcMatch[3]);
      const rad = args[0] || "15";
      const ang = args[1] || "90";
      let dir = "LEFT";
      if (fn === "arc_right") dir = "RIGHT";
      else if (fn === "arc_up") dir = "UP";
      else if (fn === "arc_down") dir = "DOWN";
      addBlock({
        type: "b3d_turtle3d_arc",
        fields: {
          VAR_NAME: vName,
          DIR: dir,
          RADIUS: Number(rad) || 15,
          ANGLE: Number(ang) || 90,
        },
      });
      continue;
    }

    // t.pen_down / t.pd / t.pen_up / t.pu
    const turtlePenMatch = trimmed.match(/^([a-zA-Z_]\w*)\.(pen_down|pd|pen_up|pu)\s*\(\)/i);
    if (turtlePenMatch) {
      const vName = turtlePenMatch[1];
      const fn = turtlePenMatch[2].toLowerCase();
      const state = (fn === "pen_up" || fn === "pu") ? "UP" : "DOWN";
      addBlock({
        type: "b3d_turtle3d_pen",
        fields: {
          VAR_NAME: vName,
          STATE: state,
        },
      });
      continue;
    }

    // t.set_radius
    const turtleRadMatch = trimmed.match(/^([a-zA-Z_]\w*)\.set_radius\s*\((.*)\)/i);
    if (turtleRadMatch) {
      const vName = turtleRadMatch[1];
      const rad = turtleRadMatch[2].trim() || "1.5";
      addBlock({
        type: "b3d_turtle3d_set_radius",
        fields: {
          VAR_NAME: vName,
          RADIUS: Number(rad) || 1.5,
        },
      });
      continue;
    }

    // t.home
    const turtleHomeMatch = trimmed.match(/^([a-zA-Z_]\w*)\.home\s*\(\)/i);
    if (turtleHomeMatch) {
      const vName = turtleHomeMatch[1];
      addBlock({
        type: "b3d_turtle3d_home",
        fields: {
          VAR_NAME: vName,
        },
      });
      continue;
    }

    // t.push() -> open branch container
    const turtlePushMatch = trimmed.match(/^([a-zA-Z_]\w*)\.push\s*\(\)/i);
    if (turtlePushMatch) {
      const vName = turtlePushMatch[1];
      const block: ParsedBlockDef = {
        type: "b3d_turtle3d_branch",
        fields: { VAR_NAME: vName },
        children: [],
      };
      addBlock(block);
      stack.push({ indent, block, isExplicitClose: true });
      continue;
    }

    // t.pop() -> close branch container
    if (/^[a-zA-Z_]\w*\.pop\s*\(\)/i.test(trimmed)) {
      if (stack.length > 0 && stack[stack.length - 1].block.type === "b3d_turtle3d_branch") {
        stack.pop();
      }
      continue;
    }

    // 25.8 变量赋值与多变量复合解构赋值识别 (如 length, width, thickness = 80.0, 60.0, 10.0 或 hole_dia = 6.0)
    const assignMatch = splitTopLevelAssignment(trimmed);
    if (assignMatch) {
      const { lhs, rhs } = assignMatch;
      if (lhs.includes(",")) {
        addBlock({
          type: "b3d_multi_var_assign",
          fields: {
            VARS: lhs,
            VALUES: rhs,
          },
        });
        continue;
      } else {
        addBlock({
          type: "b3d_var_assign",
          fields: {
            VAR: lhs,
            VALUE: rhs,
          },
        });
        continue;
      }
    }

    // 26. 兜底识别任意自定义 Python 代码行 (如特殊控制流、函数调用等)
    addBlock({
      type: "b3d_custom_code",
      fields: {
        CODE: trimmed,
      },
    });
  }

  // 仅当包含需要 BuildPart 容器的 3D 实体/特征，且未被任何顶层容器包裹时，才自动包裹首层 BuildPart
  const hasAnyContainer = blocks.some(
    (b) =>
      b.type === "b3d_build_part" ||
      b.type === "b3d_build_sketch" ||
      b.type === "b3d_build_line" ||
      b.type === "b3d_turtle3d_container"
  );
  const requiresPartContainer = blocks.some((b) =>
    [
      "b3d_box",
      "b3d_cylinder",
      "b3d_sphere",
      "b3d_cone",
      "b3d_torus",
      "b3d_wedge",
      "b3d_extrude",
      "b3d_revolve",
      "b3d_loft",
      "b3d_sweep",
    ].includes(b.type)
  );
  if (!hasAnyContainer && requiresPartContainer) {
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
 * 递归构建值输入插槽的积木树 (例如 math_arithmetic, math_number, b3d_var_get)
 */
function buildValueBlock(
  workspace: Blockly.WorkspaceSvg,
  valDef: ParsedBlockDef
): { block: Blockly.BlockSvg; count: number } {
  const block = workspace.newBlock(valDef.type) as Blockly.BlockSvg;
  for (const [k, v] of Object.entries(valDef.fields)) {
    block.setFieldValue(v as any, k);
  }
  let count = 1;

  if (valDef.inputs) {
    for (const [inputName, childValDef] of Object.entries(valDef.inputs)) {
      const input = block.getInput(inputName);
      if (input && input.connection) {
        const childRes = buildValueBlock(workspace, childValDef);
        count += childRes.count;
        if (childRes.block.outputConnection) {
          input.connection.connect(childRes.block.outputConnection);
        }
      }
    }
  }

  block.initSvg();
  block.render();
  return { block, count };
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
        if (block.getField(k)) {
          block.setFieldValue(v as any, k);
        }
      }

      // 处理值输入插槽 (Value Inputs, 如 AMOUNT, WIDTH, HEIGHT, RADIUS 等)
      if (def.inputs) {
        for (const [inputName, valDef] of Object.entries(def.inputs)) {
          const input = block.getInput(inputName);
          if (input && input.connection) {
            const valRes = buildValueBlock(workspace, valDef);
            totalCount += valRes.count;
            if (valRes.block.outputConnection) {
              input.connection.connect(valRes.block.outputConnection);
            }
          }
        }
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
