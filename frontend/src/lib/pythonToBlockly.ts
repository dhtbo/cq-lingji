/**
 * build123d / CadQuery Python 代码到 Blockly 积木逆向转换器 (Code-to-Blocks Engine 2.0)
 * 深度支持 build123d Builder 容器层级嵌套语法 (BuildPart, BuildSketch, Locations 等)
 * 及 3D 实体、2D 草图、3D 特征、阵列模式与注释的无损还原；同时向下兼容 CadQuery 经典链式代码。
 */

import * as Blockly from "blockly";
import type { WorkingMode } from "../components/BlocklyEditor/toolbox";

export interface ParsedBlockDef {
  type: string;
  fields: Record<string, string | number>;
  inputs?: Record<string, ParsedBlockDef>; // 值输入插槽 (对应 ValueInput，例如 AMOUNT, WIDTH, HEIGHT, RADIUS, A, B)
  children?: ParsedBlockDef[]; // 容器子积木 (对应 Statement Input "DO" 或 "BRANCH")
  elseChildren?: ParsedBlockDef[]; // 否则分支子积木 (对应 Statement Input "ELSE")
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

  // 2. 布尔常量与纯数字判断
  if (s === "True") {
    return { type: "logoup_true", fields: {} };
  }
  if (s === "False") {
    return { type: "logoup_false", fields: {} };
  }

  if (/^-?\d+(?:\.\d+)?$/.test(s)) {
    return {
      type: "math_number",
      fields: { NUM: Number(s) },
    };
  }

  // 3. 逻辑非 (not ...)
  if (s.startsWith("not ") && s.length > 4) {
    const subDef = parseExprToBlockDef(s.slice(4).trim());
    if (subDef) {
      return {
        type: "logoup_not",
        fields: {},
        inputs: { BOOL: subDef },
      };
    }
  }

  // 4. 函数调用表达式 (如 getx(), gety(), geth(), my_func(a, b))
  const fnMatch = s.match(/^([a-zA-Z_]\w*)\s*\((.*)\)$/);
  if (fnMatch) {
    const fnName = fnMatch[1];
    const argsStr = fnMatch[2].trim();
    if (fnName === "getx" && !argsStr) {
      return { type: "logoup_getx", fields: {} };
    }
    if (fnName === "gety" && !argsStr) {
      return { type: "logoup_gety", fields: {} };
    }
    if (fnName === "geth" && !argsStr) {
      return { type: "logoup_geth", fields: {} };
    }
    // 排除特定非函数标识
    if (!["range", "len"].includes(fnName)) {
      return {
        type: "logoup_call_func_expr",
        fields: { NAME: fnName, ARGS: argsStr },
      };
    }
  }

  // 5. 纯合法 Python 标识符 (变量引用)
  if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(s)) {
    return {
      type: "b3d_var_get",
      fields: { VAR: s },
    };
  }

  // 6. 操作符优先级分层拆分 (从低优先级到高优先级寻找顶层运算符)
  const tiers: { op: string; blockType: string; blockOp?: string; isWord?: boolean }[][] = [
    [
      { op: " or ", blockType: "logoup_or", isWord: true },
    ],
    [
      { op: " and ", blockType: "logoup_and", isWord: true },
    ],
    [
      { op: "==", blockType: "logoup_eq" },
      { op: "!=", blockType: "logoup_neq" },
      { op: "<=", blockType: "logoup_lte" },
      { op: ">=", blockType: "logoup_gte" },
      { op: "<", blockType: "logoup_lt" },
      { op: ">", blockType: "logoup_gt" },
    ],
    [
      { op: "+", blockType: "logoup_add", blockOp: "ADD" },
      { op: "-", blockType: "logoup_sub", blockOp: "MINUS" },
    ],
    [
      { op: "*", blockType: "logoup_mul", blockOp: "MULTIPLY" },
      { op: "/", blockType: "logoup_div", blockOp: "DIVIDE" },
      { op: "%", blockType: "logoup_mod" },
    ],
    [
      { op: "**", blockType: "math_arithmetic", blockOp: "POWER" },
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
        for (const item of tier) {
          const { op, blockType, blockOp, isWord } = item;
          if (isWord) {
            const opLen = op.length;
            if (i >= opLen - 1 && s.slice(i - opLen + 1, i + 1) === op) {
              const leftStr = s.slice(0, i - opLen + 1).trim();
              const rightStr = s.slice(i + 1).trim();
              const leftDef = parseExprToBlockDef(leftStr);
              const rightDef = parseExprToBlockDef(rightStr);
              if (leftDef && rightDef) {
                return {
                  type: blockType,
                  fields: {},
                  inputs: { A: leftDef, B: rightDef },
                };
              }
            }
          } else if (op === "**") {
            if (s.slice(i, i + 2) === "**") {
              const leftStr = s.slice(0, i).trim();
              const rightStr = s.slice(i + 2).trim();
              const leftDef = parseExprToBlockDef(leftStr);
              const rightDef = parseExprToBlockDef(rightStr);
              if (leftDef && rightDef) {
                return {
                  type: blockType,
                  fields: blockOp ? { OP: blockOp } : {},
                  inputs: { A: leftDef, B: rightDef },
                };
              }
            }
          } else if (op === "*" && (s.slice(i, i + 2) === "**" || (i > 0 && s[i - 1] === "*"))) {
            // 跳过 **
            continue;
          } else if (op.length === 2 && s.slice(i - 1, i + 1) === op) {
            // 双字符操作符如 ==, !=, <=, >=
            const leftStr = s.slice(0, i - 1).trim();
            const rightStr = s.slice(i + 1).trim();
            const leftDef = parseExprToBlockDef(leftStr);
            const rightDef = parseExprToBlockDef(rightStr);
            if (leftDef && rightDef) {
              return {
                type: blockType,
                fields: {},
                inputs: { A: leftDef, B: rightDef },
              };
            }
          } else if (op.length === 1 && s[i] === op) {
            // 排除被双字符操作符占据的单字符
            const prevChar = i > 0 ? s[i - 1] : "";
            const nextChar = i + 1 < s.length ? s[i + 1] : "";
            if (
              (op === "=" && (prevChar === "!" || prevChar === "<" || prevChar === ">" || prevChar === "=" || nextChar === "=")) ||
              (op === "<" && nextChar === "=") ||
              (op === ">" && nextChar === "=")
            ) {
              continue;
            }
            // 排除一元负号
            if (op === "-" && (i === 0 || /[\+\-\*\/%<>=!]\s*$/.test(s.slice(0, i)))) {
              continue;
            }
            const leftStr = s.slice(0, i).trim();
            const rightStr = s.slice(i + 1).trim();
            if (leftStr && rightStr) {
              const leftDef = parseExprToBlockDef(leftStr);
              const rightDef = parseExprToBlockDef(rightStr);
              if (leftDef && rightDef) {
                return {
                  type: blockType,
                  fields: blockOp ? { OP: blockOp } : {},
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
 * 辅助：提取指定函数调用及其参数字符串与赋值变量名 (用于 build123d 构造器)
 * 能够精确匹配嵌套括号，避免被内联注释或后续语句干扰
 */
function extractFunctionCall(line: string, fnName: string): { varName: string; argsStr: string } | null {
  const regex = new RegExp(`^(?:([a-zA-Z_]\\w*)\\s*=\\s*)?${fnName}\\s*\\(`, "i");
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
 * 辅助：严格大小写敏感且行首锚定的 LogoUp 函数调用提取器
 * 严禁匹配大写 Box(...) 或方法链 part.box(...)，彻底杜绝跨模式串扰
 */
function extractLogoUpCall(line: string, fnName: string): { argsStr: string; trailingComment: string } | null {
  const regex = new RegExp(`^${fnName}\\s*\\(`);
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
  const trailingComment = line.slice(endIdx + 1).trim();
  return { argsStr, trailingComment };
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
 * 去除字符串首尾的引号
 */
function stripQuotes(str: string): string {
  if (!str) return "";
  const s = str.trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1);
  }
  return s;
}

export interface ContainerStackEntry {
  indent: number;
  block: ParsedBlockDef;
  isExplicitClose?: boolean;
  isElseBranch?: boolean;
}

/**
 * 解析三模式通用的控制流语句 (for _ in range, if, else, def, return)
 */
function parseSharedControlStatement(
  trimmed: string,
  indent: number,
  stack: ContainerStackEntry[],
  addBlock: (b: ParsedBlockDef) => void,
  getCurrentList: () => ParsedBlockDef[]
): boolean {
  // 1. 开始帽子积木注释跳过（由顶层统一冠名唯一 logoup_start）
  if (trimmed.startsWith("# 🏁 开始")) {
    return true;
  }

  // 2. 控制流 - 循环 for _ in range(N):
  const repeatMatch = trimmed.match(/^for\s+(?:_|[a-zA-Z_]\w*)\s+in\s+range\((.*?)\)\s*:/);
  if (repeatMatch) {
    const timesExpr = repeatMatch[1].trim();
    const valDef = parseExprToBlockDef(timesExpr) || { type: "math_number", fields: { NUM: 4 } };
    const block: ParsedBlockDef = {
      type: "logoup_repeat",
      fields: {},
      inputs: { TIMES: valDef },
      children: [],
    };
    addBlock(block);
    stack.push({ indent, block });
    return true;
  }

  // 3. 控制流 - 条件 if <cond>:
  const ifMatch = trimmed.match(/^if\s+(.*?)\s*:/);
  if (ifMatch && !trimmed.startsWith("if __name__")) {
    const condExpr = ifMatch[1].trim();
    const condDef = parseExprToBlockDef(condExpr);
    const block: ParsedBlockDef = {
      type: "logoup_if",
      fields: {},
      inputs: condDef ? { CONDITION: condDef } : undefined,
      children: [],
    };
    addBlock(block);
    stack.push({ indent, block });
    return true;
  }

  // 3.5 控制流 - 否则分支 else: (自动将同级前驱 logoup_if 升级为 logoup_if_else)
  if (/^else\s*:/.test(trimmed)) {
    const currentList = getCurrentList();
    const prevBlock = currentList.length > 0 ? currentList[currentList.length - 1] : null;
    if (prevBlock && (prevBlock.type === "logoup_if" || prevBlock.type === "logoup_if_else")) {
      prevBlock.type = "logoup_if_else";
      if (!prevBlock.elseChildren) prevBlock.elseChildren = [];
      stack.push({ indent, block: prevBlock, isElseBranch: true });
      return true;
    }
  }

  // 4. 控制流 - 函数定义 def my_func(params):
  const defFuncMatch = trimmed.match(/^def\s+([a-zA-Z_]\w*)\s*\((.*?)\)\s*:/);
  if (defFuncMatch) {
    const fnName = defFuncMatch[1].trim();
    const fnParams = defFuncMatch[2].trim();
    const block: ParsedBlockDef = {
      type: "logoup_def_func",
      fields: { NAME: fnName, PARAMS: fnParams },
      children: [],
    };
    addBlock(block);
    stack.push({ indent, block });
    return true;
  }

  // 5. 控制流 - return
  if (trimmed === "return") {
    addBlock({ type: "logoup_return", fields: {} });
    return true;
  }
  const returnValMatch = trimmed.match(/^return\s+(.+)$/);
  if (returnValMatch) {
    const valDef = parseExprToBlockDef(returnValMatch[1].trim());
    addBlock({
      type: "logoup_return_val",
      fields: {},
      inputs: valDef ? { VALUE: valDef } : undefined,
    });
    return true;
  }

  return false;
}

/**
 * 解析 LogoUp 3D 模式专属语句并转换为对应的 logoup_* 积木节点
 * 仅在 mode === "logoup" 下调用，严禁混入 build123d 或 CadQuery 模式
 */
function parseLogoUpStatement(
  trimmed: string,
  indent: number,
  stack: ContainerStackEntry[],
  addBlock: (b: ParsedBlockDef) => void,
  getCurrentList: () => ParsedBlockDef[]
): boolean {
  if (parseSharedControlStatement(trimmed, indent, stack, addBlock, getCurrentList)) {
    return true;
  }

  // 控制流 - push() / pop()
  if (trimmed === "push()") {
    addBlock({ type: "logoup_push", fields: {} });
    return true;
  }
  if (trimmed === "pop()") {
    addBlock({ type: "logoup_pop", fields: {} });
    return true;
  }

  // 三维构件与三维绘图 (严格小写行首调用)
  // box(l, w, h)
  const boxCall = extractLogoUpCall(trimmed, "box");
  if (boxCall) {
    const args = splitTopLevelArgs(boxCall.argsStr);
    addBlock({
      type: "logoup_box",
      fields: {
        LENGTH: Number(args[0]) || 20,
        WIDTH: Number(args[1]) || 20,
        HEIGHT: Number(args[2]) || 10,
      },
    });
    return true;
  }

  // cylinder(r, h)
  const cylCall = extractLogoUpCall(trimmed, "cylinder");
  if (cylCall) {
    const args = splitTopLevelArgs(cylCall.argsStr);
    addBlock({
      type: "logoup_cylinder",
      fields: {
        RADIUS: Number(args[0]) || 10,
        HEIGHT: Number(args[1]) || 20,
      },
    });
    return true;
  }

  // cone(r, h)
  const coneCall = extractLogoUpCall(trimmed, "cone");
  if (coneCall) {
    const args = splitTopLevelArgs(coneCall.argsStr);
    addBlock({
      type: "logoup_cone",
      fields: {
        RADIUS: Number(args[0]) || 10,
        HEIGHT: Number(args[1]) || 15,
      },
    });
    return true;
  }

  // sphere(r)
  const sphCall = extractLogoUpCall(trimmed, "sphere");
  if (sphCall) {
    const args = splitTopLevelArgs(sphCall.argsStr);
    addBlock({
      type: "logoup_sphere",
      fields: { RADIUS: Number(args[0]) || 10 },
    });
    return true;
  }

  // ellipsoid(rx, ry, rz)
  const ellipsoidCall = extractLogoUpCall(trimmed, "ellipsoid");
  if (ellipsoidCall) {
    const args = splitTopLevelArgs(ellipsoidCall.argsStr);
    addBlock({
      type: "logoup_ellipsoid",
      fields: {
        RX: Number(args[0]) || 15,
        RY: Number(args[1]) || 10,
        RZ: Number(args[2]) || 10,
      },
    });
    return true;
  }

  // pyramid_solid(sides, r, h)
  const pyrSolidCall = extractLogoUpCall(trimmed, "pyramid_solid");
  if (pyrSolidCall) {
    const args = splitTopLevelArgs(pyrSolidCall.argsStr);
    addBlock({
      type: "logoup_pyramid_solid",
      fields: {
        SIDES: Number(args[0]) || 4,
        RADIUS: Number(args[1]) || 15,
        HEIGHT: Number(args[2]) || 25,
      },
    });
    return true;
  }

  // torus(r1, r2) -> 注意 logoup_torus 使用 ValueInput (MAJOR_RADIUS, MINOR_RADIUS)
  const torusCall = extractLogoUpCall(trimmed, "torus");
  if (torusCall) {
    const args = splitTopLevelArgs(torusCall.argsStr);
    const r1Def = parseExprToBlockDef(args[0] || "10") || { type: "math_number", fields: { NUM: 10 } };
    const r2Def = parseExprToBlockDef(args[1] || "4") || { type: "math_number", fields: { NUM: 4 } };
    addBlock({
      type: "logoup_torus",
      fields: {},
      inputs: {
        MAJOR_RADIUS: r1Def,
        MINOR_RADIUS: r2Def,
      },
    });
    return true;
  }

  // rect(l, w)
  const rectCall = extractLogoUpCall(trimmed, "rect");
  if (rectCall) {
    const args = splitTopLevelArgs(rectCall.argsStr);
    addBlock({
      type: "logoup_rect",
      fields: {
        LENGTH: Number(args[0]) || 20,
        WIDTH: Number(args[1]) || 20,
      },
    });
    return true;
  }

  // square(s)
  const sqCall = extractLogoUpCall(trimmed, "square");
  if (sqCall) {
    const args = splitTopLevelArgs(sqCall.argsStr);
    addBlock({
      type: "logoup_square",
      fields: { SIZE: Number(args[0]) || 20 },
    });
    return true;
  }

  // rounded_rect(l, w, r)
  const rRectCall = extractLogoUpCall(trimmed, "rounded_rect");
  if (rRectCall) {
    const args = splitTopLevelArgs(rRectCall.argsStr);
    addBlock({
      type: "logoup_rounded_rect",
      fields: {
        LENGTH: Number(args[0]) || 30,
        WIDTH: Number(args[1]) || 20,
        RADIUS: Number(args[2]) || 4,
      },
    });
    return true;
  }

  // rounded_square(s, r)
  const rSqCall = extractLogoUpCall(trimmed, "rounded_square");
  if (rSqCall) {
    const args = splitTopLevelArgs(rSqCall.argsStr);
    addBlock({
      type: "logoup_rounded_square",
      fields: {
        SIZE: Number(args[0]) || 20,
        RADIUS: Number(args[1]) || 3,
      },
    });
    return true;
  }

  // circle(r) 或 circle(r) # 弧线 angle°
  const cirCall = extractLogoUpCall(trimmed, "circle");
  if (cirCall) {
    const args = splitTopLevelArgs(cirCall.argsStr);
    const arcCommentMatch = cirCall.trailingComment.match(/弧线\s*([-\d.]+)/);
    if (arcCommentMatch) {
      addBlock({
        type: "logoup_arc",
        fields: {
          RADIUS: Number(args[0]) || 10,
          ANGLE: Number(arcCommentMatch[1]) || 90,
        },
      });
    } else {
      addBlock({
        type: "logoup_circle",
        fields: { RADIUS: Number(args[0]) || 10 },
      });
    }
    return true;
  }

  // ellipse(a, b)
  const ellCall = extractLogoUpCall(trimmed, "ellipse");
  if (ellCall) {
    const args = splitTopLevelArgs(ellCall.argsStr);
    addBlock({
      type: "logoup_ellipse",
      fields: {
        A: Number(args[0]) || 20,
        B: Number(args[1]) || 10,
      },
    });
    return true;
  }

  // egg(rx, ry)
  const eggCall = extractLogoUpCall(trimmed, "egg");
  if (eggCall) {
    const args = splitTopLevelArgs(eggCall.argsStr);
    addBlock({
      type: "logoup_egg",
      fields: {
        RX: Number(args[0]) || 12,
        RY: Number(args[1]) || 18,
      },
    });
    return true;
  }

  // polygon(sides, r)
  const polyCall = extractLogoUpCall(trimmed, "polygon");
  if (polyCall) {
    const args = splitTopLevelArgs(polyCall.argsStr);
    addBlock({
      type: "logoup_polygon",
      fields: {
        SIDES: Number(args[0]) || 6,
        RADIUS: Number(args[1]) || 15,
      },
    });
    return true;
  }

  // star(p, r)
  const starCall = extractLogoUpCall(trimmed, "star");
  if (starCall) {
    const args = splitTopLevelArgs(starCall.argsStr);
    addBlock({
      type: "logoup_star",
      fields: {
        POINTS: Number(args[0]) || 5,
        RADIUS: Number(args[1]) || 15,
      },
    });
    return true;
  }

  // five_star(r)
  const fStarCall = extractLogoUpCall(trimmed, "five_star");
  if (fStarCall) {
    const args = splitTopLevelArgs(fStarCall.argsStr);
    addBlock({
      type: "logoup_five_star",
      fields: { RADIUS: Number(args[0]) || 15 },
    });
    return true;
  }

  // six_star(r)
  const sStarCall = extractLogoUpCall(trimmed, "six_star");
  if (sStarCall) {
    const args = splitTopLevelArgs(sStarCall.argsStr);
    addBlock({
      type: "logoup_six_star",
      fields: { RADIUS: Number(args[0]) || 15 },
    });
    return true;
  }

  // four_star(r)
  const fourStarCall = extractLogoUpCall(trimmed, "four_star");
  if (fourStarCall) {
    const args = splitTopLevelArgs(fourStarCall.argsStr);
    addBlock({
      type: "logoup_four_star",
      fields: { RADIUS: Number(args[0]) || 15 },
    });
    return true;
  }

  // spirograph(R, r, d, ang)
  const spiroCall = extractLogoUpCall(trimmed, "spirograph");
  if (spiroCall) {
    const args = splitTopLevelArgs(spiroCall.argsStr);
    addBlock({
      type: "logoup_spirograph",
      fields: {
        R: Number(args[0]) || 20,
        r: Number(args[1]) || 8,
        d: Number(args[2]) || 6,
        ANGLE: Number(args[3]) || 360,
      },
    });
    return true;
  }

  // up(d) / down(d)
  const upCall = extractLogoUpCall(trimmed, "up");
  if (upCall) {
    const args = splitTopLevelArgs(upCall.argsStr);
    addBlock({
      type: "logoup_up",
      fields: { DISTANCE: Number(args[0]) ?? 10 },
    });
    return true;
  }
  const downCall = extractLogoUpCall(trimmed, "down");
  if (downCall) {
    const args = splitTopLevelArgs(downCall.argsStr);
    addBlock({
      type: "logoup_up",
      fields: { DISTANCE: -(Number(args[0]) || 10) },
    });
    return true;
  }

  // extrude(h)
  const extrudeCall = extractLogoUpCall(trimmed, "extrude");
  if (extrudeCall) {
    const args = splitTopLevelArgs(extrudeCall.argsStr);
    addBlock({
      type: "logoup_extrude",
      fields: { HEIGHT: Number(args[0]) || 10 },
    });
    return true;
  }

  // cextrude(h)
  const cextrudeCall = extractLogoUpCall(trimmed, "cextrude");
  if (cextrudeCall) {
    const args = splitTopLevelArgs(cextrudeCall.argsStr);
    addBlock({
      type: "logoup_cextrude",
      fields: { HEIGHT: Number(args[0]) || 10 },
    });
    return true;
  }

  // pyramid(h)
  const pyrCall = extractLogoUpCall(trimmed, "pyramid");
  if (pyrCall) {
    const args = splitTopLevelArgs(pyrCall.argsStr);
    addBlock({
      type: "logoup_pyramid",
      fields: { HEIGHT: Number(args[0]) || 15 },
    });
    return true;
  }

  // cave(d)
  const caveCall = extractLogoUpCall(trimmed, "cave");
  if (caveCall) {
    const args = splitTopLevelArgs(caveCall.argsStr);
    addBlock({
      type: "logoup_cave",
      fields: { DEPTH: Number(args[0]) || 5 },
    });
    return true;
  }

  // body() / reset() / done() / link()
  if (trimmed === "body()") {
    addBlock({ type: "logoup_body", fields: {} });
    return true;
  }
  if (trimmed === "reset()") {
    addBlock({ type: "logoup_reset", fields: {} });
    return true;
  }
  if (trimmed === "done()") {
    addBlock({ type: "logoup_done_3d", fields: {} });
    return true;
  }
  if (trimmed === "link()") {
    addBlock({ type: "logoup_link", fields: {} });
    return true;
  }

  // color(c)
  const colorCall = extractLogoUpCall(trimmed, "color");
  if (colorCall) {
    const args = splitTopLevelArgs(colorCall.argsStr);
    addBlock({
      type: "logoup_color",
      fields: { COLOR: stripQuotes(args[0]) || "#10B981" },
    });
    return true;
  }

  // scale(f)
  const scaleCall = extractLogoUpCall(trimmed, "scale");
  if (scaleCall) {
    const args = splitTopLevelArgs(scaleCall.argsStr);
    addBlock({
      type: "logoup_scale",
      fields: { FACTOR: Number(args[0]) || 1.5 },
    });
    return true;
  }

  // yaw(a) / pitch(a) / roll(a)
  const yawCall = extractLogoUpCall(trimmed, "yaw");
  if (yawCall) {
    const args = splitTopLevelArgs(yawCall.argsStr);
    addBlock({
      type: "logoup_yaw",
      fields: { ANGLE: Number(args[0]) ?? 45 },
    });
    return true;
  }
  const pitchCall = extractLogoUpCall(trimmed, "pitch");
  if (pitchCall) {
    const args = splitTopLevelArgs(pitchCall.argsStr);
    addBlock({
      type: "logoup_pitch",
      fields: { ANGLE: Number(args[0]) ?? 45 },
    });
    return true;
  }
  const rollCall = extractLogoUpCall(trimmed, "roll");
  if (rollCall) {
    const args = splitTopLevelArgs(rollCall.argsStr);
    addBlock({
      type: "logoup_roll",
      fields: { ANGLE: Number(args[0]) ?? 45 },
    });
    return true;
  }

  // jump(d)
  const jumpCall = extractLogoUpCall(trimmed, "jump");
  if (jumpCall) {
    const args = splitTopLevelArgs(jumpCall.argsStr);
    addBlock({
      type: "logoup_jump",
      fields: { DISTANCE: Number(args[0]) ?? 10 },
    });
    return true;
  }

  // move(dx, dy, dz)
  const moveCall = extractLogoUpCall(trimmed, "move");
  if (moveCall) {
    const args = splitTopLevelArgs(moveCall.argsStr);
    addBlock({
      type: "logoup_move",
      fields: {
        DX: Number(args[0]) || 0,
        DY: Number(args[1]) || 0,
        DZ: Number(args[2]) || 0,
      },
    });
    return true;
  }

  // shift(dx, dy)
  const shiftCall = extractLogoUpCall(trimmed, "shift");
  if (shiftCall) {
    const args = splitTopLevelArgs(shiftCall.argsStr);
    addBlock({
      type: "logoup_shift",
      fields: {
        DX: Number(args[0]) || 0,
        DY: Number(args[1]) || 0,
      },
    });
    return true;
  }

  // subtract(mode)
  const subCall = extractLogoUpCall(trimmed, "subtract");
  if (subCall) {
    const args = splitTopLevelArgs(subCall.argsStr);
    addBlock({
      type: "logoup_subtract",
      fields: { MODE: /true/i.test(args[0]) ? "ENABLE" : "DISABLE" },
    });
    return true;
  }

  // moveto(x, y, z) 或 moveto(getx(), gety(), z)
  const movetoCall = extractLogoUpCall(trimmed, "moveto");
  if (movetoCall) {
    const args = splitTopLevelArgs(movetoCall.argsStr);
    if (args[0]?.trim() === "getx()" && args[1]?.trim() === "gety()") {
      addBlock({
        type: "logoup_movezto",
        fields: { Z: Number(args[2]) || 0 },
      });
    } else {
      addBlock({
        type: "logoup_moveto",
        fields: {
          X: Number(args[0]) || 0,
          Y: Number(args[1]) || 0,
          Z: Number(args[2]) || 0,
        },
      });
    }
    return true;
  }

  // go(d) / fd(d) / forward(d) / bk(d) / backward(d)
  const goCall =
    extractLogoUpCall(trimmed, "go") ||
    extractLogoUpCall(trimmed, "fd") ||
    extractLogoUpCall(trimmed, "forward");
  if (goCall) {
    const args = splitTopLevelArgs(goCall.argsStr);
    addBlock({
      type: "logoup_go",
      fields: { DISTANCE: Number(args[0]) ?? 20 },
    });
    return true;
  }
  const bkCall = extractLogoUpCall(trimmed, "bk") || extractLogoUpCall(trimmed, "backward");
  if (bkCall) {
    const args = splitTopLevelArgs(bkCall.argsStr);
    addBlock({
      type: "logoup_go",
      fields: { DISTANCE: -(Number(args[0]) || 20) },
    });
    return true;
  }

  // turn(a) / rt(a)
  const turnCall = extractLogoUpCall(trimmed, "turn") || extractLogoUpCall(trimmed, "rt");
  if (turnCall) {
    const args = splitTopLevelArgs(turnCall.argsStr);
    addBlock({
      type: "logoup_turn",
      fields: { ANGLE: Number(args[0]) ?? 90 },
    });
    return true;
  }

  // turn_left(a) / lt(a)
  const turnLCall = extractLogoUpCall(trimmed, "turn_left") || extractLogoUpCall(trimmed, "lt");
  if (turnLCall) {
    const args = splitTopLevelArgs(turnLCall.argsStr);
    addBlock({
      type: "logoup_turn_left",
      fields: { ANGLE: Number(args[0]) ?? 90 },
    });
    return true;
  }

  // draw() / fill() / clear() / home() / close() / clear_sketch()
  if (trimmed === "draw()") {
    addBlock({ type: "logoup_draw", fields: {} });
    return true;
  }
  if (trimmed === "fill()") {
    addBlock({ type: "logoup_fill", fields: {} });
    return true;
  }
  if (trimmed === "clear()") {
    addBlock({ type: "logoup_clear", fields: {} });
    return true;
  }
  if (trimmed === "home()") {
    addBlock({ type: "logoup_home", fields: {} });
    return true;
  }
  if (trimmed === "close()") {
    addBlock({ type: "logoup_close", fields: {} });
    return true;
  }
  if (trimmed === "clear_sketch()") {
    addBlock({ type: "logoup_clearsketch", fields: {} });
    return true;
  }

  // erase(mode)
  const eraseCall = extractLogoUpCall(trimmed, "erase");
  if (eraseCall) {
    const args = splitTopLevelArgs(eraseCall.argsStr);
    addBlock({
      type: "logoup_erase",
      fields: { MODE: /true/i.test(args[0]) ? "ENABLE" : "DISABLE" },
    });
    return true;
  }

  // width(w)
  const widthCall = extractLogoUpCall(trimmed, "width");
  if (widthCall) {
    const args = splitTopLevelArgs(widthCall.argsStr);
    addBlock({
      type: "logoup_width",
      fields: { WIDTH: Number(args[0]) || 2 },
    });
    return true;
  }

  // offset_path(a)
  const offCall = extractLogoUpCall(trimmed, "offset_path");
  if (offCall) {
    const args = splitTopLevelArgs(offCall.argsStr);
    addBlock({
      type: "logoup_offset",
      fields: { AMOUNT: Number(args[0]) || 2 },
    });
    return true;
  }

  // goto(x, y)
  const gotoCall = extractLogoUpCall(trimmed, "goto");
  if (gotoCall) {
    const args = splitTopLevelArgs(gotoCall.argsStr);
    addBlock({
      type: "logoup_goto",
      fields: {
        X: Number(args[0]) || 0,
        Y: Number(args[1]) || 0,
      },
    });
    return true;
  }

  // turnto(a)
  const turntoCall = extractLogoUpCall(trimmed, "turnto");
  if (turntoCall) {
    const args = splitTopLevelArgs(turntoCall.argsStr);
    addBlock({
      type: "logoup_turnto",
      fields: { ANGLE: Number(args[0]) || 0 },
    });
    return true;
  }

  // setx(x) / sety(y)
  const setxCall = extractLogoUpCall(trimmed, "setx");
  if (setxCall) {
    const args = splitTopLevelArgs(setxCall.argsStr);
    addBlock({
      type: "logoup_setx",
      fields: { X: Number(args[0]) || 0 },
    });
    return true;
  }
  const setyCall = extractLogoUpCall(trimmed, "sety");
  if (setyCall) {
    const args = splitTopLevelArgs(setyCall.argsStr);
    addBlock({
      type: "logoup_sety",
      fields: { Y: Number(args[0]) || 0 },
    });
    return true;
  }

  // txtstamp(...)
  const txtCall = extractLogoUpCall(trimmed, "txtstamp");
  if (txtCall) {
    const args = splitTopLevelArgs(txtCall.argsStr);
    if (args.length >= 2) {
      const sizeVal = args[1].replace(/^size\s*=\s*/i, "").trim();
      addBlock({
        type: "logoup_txtstampex",
        fields: {
          TEXT: stripQuotes(args[0]) || "LogoUp",
          SIZE: Number(sizeVal) || 10,
        },
      });
    } else {
      addBlock({
        type: "logoup_txtstamp",
        fields: { TEXT: stripQuotes(args[0]) || "LogoUp" },
      });
    }
    return true;
  }

  // 变量赋值 (var = expr)
  const assign = splitTopLevelAssignment(trimmed);
  if (assign) {
    const varName = assign.lhs.trim();
    if (/^[a-zA-Z_]\w*$/.test(varName)) {
      const valDef = parseExprToBlockDef(assign.rhs.trim());
      addBlock({
        type: "logoup_set_var",
        fields: { VAR: varName },
        inputs: valDef ? { VALUE: valDef } : undefined,
      });
      return true;
    }
  }

  // 通用自定义函数调用 (my_func(...))
  const generalFn = trimmed.match(/^([a-zA-Z_]\w*)\s*\((.*)\)$/);
  if (generalFn) {
    const name = generalFn[1];
    const argsStr = generalFn[2].trim();
    const knownIgnore = ["show", "show_object", "print", "exit"];
    if (!knownIgnore.includes(name)) {
      addBlock({
        type: "logoup_call_func_stmt",
        fields: { NAME: name, ARGS: argsStr },
      });
      return true;
    }
  }

  return false;
}

/**
 * 确保积木定义列表顶部始终包含唯一一个「开始」(logoup_start) 积木
 */
function wrapWithSingleStartBlock(blocks: ParsedBlockDef[]): ParsedBlockDef[] {
  const filtered = blocks.filter((b) => b.type !== "logoup_start");
  if (filtered.length === 0) return [];
  return [{ type: "logoup_start", fields: {} }, ...filtered];
}

/**
 * ==================== 模式 1: LogoUp 3D 专属解析器 ====================
 */
export function parseLogoUpModeCode(code: string): ParsedBlockDef[] {
  const rawLines = code.split(/\r?\n/);
  const lines: string[] = [];
  for (const l of rawLines) {
    if (l.includes(";") && !l.includes("#")) {
      const indentMatch = l.match(/^(\s*)/);
      const prefix = indentMatch ? indentMatch[1] : "";
      for (const sub of l.split(";")) {
        if (sub.trim()) lines.push(prefix + sub.trim());
      }
      continue;
    }
    lines.push(l);
  }

  const blocks: ParsedBlockDef[] = [];
  const stack: ContainerStackEntry[] = [];

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const rawLine = lines[lineIndex];
    const trimmed = rawLine.trim();

    if (
      !trimmed ||
      trimmed === "pass" ||
      trimmed.startsWith("from ") ||
      trimmed.startsWith("import ")
    ) {
      continue;
    }

    const indent = rawLine.search(/\S|$/);
    while (stack.length > 0 && stack[stack.length - 1].indent >= indent) {
      stack.pop();
    }

    const topEntry = stack.length > 0 ? stack[stack.length - 1] : null;
    const getCurrentList = (): ParsedBlockDef[] => {
      if (!topEntry) return blocks;
      if (topEntry.isElseBranch) {
        if (!topEntry.block.elseChildren) topEntry.block.elseChildren = [];
        return topEntry.block.elseChildren;
      }
      if (!topEntry.block.children) topEntry.block.children = [];
      return topEntry.block.children;
    };
    const addBlock = (b: ParsedBlockDef) => {
      getCurrentList().push(b);
    };

    if (trimmed.startsWith("#")) {
      if (trimmed.startsWith("# 🏁 开始")) continue;
      if (trimmed.startsWith("# 加载图片参考")) {
        addBlock({ type: "logoup_imgload", fields: {} });
      } else if (trimmed.startsWith("# 缩放图片参考")) {
        addBlock({ type: "logoup_imgscale", fields: {} });
      } else if (trimmed.startsWith("# 图片采样")) {
        addBlock({ type: "logoup_imgstamp", fields: {} });
      } else if (trimmed.startsWith("# 卸载图片")) {
        addBlock({ type: "logoup_imgunload", fields: {} });
      }
      continue;
    }

    parseLogoUpStatement(trimmed, indent, stack, addBlock, getCurrentList);
  }

  return wrapWithSingleStartBlock(blocks);
}

/**
 * 辅助：拆分 CadQuery 链式调用（如 cq.Workplane("XY").rect(20, 20).extrude(10)）为有序方法列表
 */
function splitCadQueryMethodChain(rhs: string): { name: string; argsStr: string }[] {
  let s = rhs.trim();
  // 剥离最外层包裹括号: (cq.Workplane("XY").circle(30)...)
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
    if (canStrip) s = s.slice(1, -1).trim();
    else break;
  }

  // 移除起始的 cq. 或 part. / result. / wp.
  s = s.replace(/^(?:cq|part|result|wp|workplane)\s*\.\s*/, "");

  const calls: { name: string; argsStr: string }[] = [];
  let i = 0;
  while (i < s.length) {
    while (i < s.length && (s[i] === "." || /\s/.test(s[i]))) i++;
    if (i >= s.length) break;

    const nameMatch = s.slice(i).match(/^([a-zA-Z_]\w*)\s*\(/);
    if (!nameMatch) break;

    const fnName = nameMatch[1];
    const openParenIdx = i + nameMatch[0].length - 1;
    let depth = 1;
    let closeParenIdx = -1;
    for (let j = openParenIdx + 1; j < s.length; j++) {
      const ch = s[j];
      if (ch === "(" || ch === "[" || ch === "{") depth++;
      else if (ch === ")" || ch === "]" || ch === "}") {
        depth--;
        if (depth === 0) {
          closeParenIdx = j;
          break;
        }
      }
    }
    if (closeParenIdx === -1) break;

    const argsStr = s.slice(openParenIdx + 1, closeParenIdx).trim();
    calls.push({ name: fnName, argsStr });
    i = closeParenIdx + 1;
  }

  return calls;
}

/**
 * ==================== 模式 2: CadQuery 专属解析器 ====================
 * 严格生成 cq_* 积木与通用控制流积木，绝不转串为 logoup_* 或 b3d_* 几何积木
 */
export function parseCadQueryModeCode(code: string): ParsedBlockDef[] {
  const rawLines = code.split(/\r?\n/);
  // 合并多行括号表达式（如 part = (\n cq.Workplane("XY")\n .circle(30)...\n)）
  const logicalLines: string[] = [];
  let buffer = "";
  let parenDepth = 0;

  for (const raw of rawLines) {
    const trimmed = raw.trim();
    if (!trimmed) continue;
    if (parenDepth === 0 && trimmed.startsWith("#")) {
      logicalLines.push(raw);
      continue;
    }
    const codePart = raw.replace(/#.*$/, "");
    if (parenDepth > 0) {
      buffer += " " + trimmed;
    } else {
      buffer = raw;
    }
    for (const ch of codePart) {
      if (ch === "(" || ch === "[") parenDepth++;
      else if (ch === ")" || ch === "]") parenDepth = Math.max(0, parenDepth - 1);
    }
    if (parenDepth === 0 && buffer.trim()) {
      logicalLines.push(buffer);
      buffer = "";
    }
  }
  if (buffer.trim()) logicalLines.push(buffer);

  const blocks: ParsedBlockDef[] = [];
  const stack: ContainerStackEntry[] = [];

  for (let lineIdx = 0; lineIdx < logicalLines.length; lineIdx++) {
    const rawLine = logicalLines[lineIdx];
    const trimmed = rawLine.trim();

    if (
      !trimmed ||
      trimmed === "pass" ||
      trimmed.startsWith("import ") ||
      trimmed.startsWith("from ")
    ) {
      continue;
    }

    const indent = rawLine.search(/\S|$/);
    while (stack.length > 0 && stack[stack.length - 1].indent >= indent) {
      stack.pop();
    }

    const topEntry = stack.length > 0 ? stack[stack.length - 1] : null;
    const getCurrentList = (): ParsedBlockDef[] => {
      if (!topEntry) return blocks;
      if (topEntry.isElseBranch) {
        if (!topEntry.block.elseChildren) topEntry.block.elseChildren = [];
        return topEntry.block.elseChildren;
      }
      if (!topEntry.block.children) topEntry.block.children = [];
      return topEntry.block.children;
    };
    const addBlock = (b: ParsedBlockDef) => {
      getCurrentList().push(b);
    };

    // 1. 注释 -> cq_comment
    if (trimmed.startsWith("#")) {
      if (trimmed.startsWith("# 🏁 开始")) continue;
      addBlock({
        type: "cq_comment",
        fields: { TEXT: trimmed.replace(/^#+\s*/, "") },
      });
      continue;
    }

    // 2. 识别径向多孔阵列宏 (cq_macro_radial_array): 3 行复合结构
    const radialHeaderMatch = trimmed.match(
      /\.faces\(\s*["']>Z["']\s*\)\.workplane\(\s*offset\s*=\s*-([-\d.]+)\s*\)\.transformed\(\s*rotate\s*=\s*\(\s*90\s*,\s*0\s*,\s*0\s*\)\s*\)/
    );
    if (radialHeaderMatch && lineIdx + 2 < logicalLines.length) {
      const next1 = logicalLines[lineIdx + 1].trim();
      const next2 = logicalLines[lineIdx + 2].trim();
      const forMatch = next1.match(/^for\s+_\s+in\s+range\(\s*(\d+)\s*\)\s*:/);
      const holeMatch = next2.match(
        /\.transformed\(\s*rotate\s*=\s*\(\s*0\s*,\s*360\s*\/\s*\d+\s*,\s*0\s*\)\s*\)\.hole\(\s*diameter\s*=\s*([-\d.]+)\s*,\s*depth\s*=\s*([-\d.]+)\s*\)/
      );
      if (forMatch && holeMatch) {
        addBlock({
          type: "cq_macro_radial_array",
          fields: {
            COUNT: Number(forMatch[1]) || 6,
            DIAMETER: Number(holeMatch[1]) || 4,
            DEPTH: Number(holeMatch[2]) || 10,
            OFFSET: Number(radialHeaderMatch[1]) || 2,
          },
        });
        lineIdx += 2;
        continue;
      }
    }

    // 3. 识别法兰盘宏 (cq_macro_flange): 2 行复合结构
    const flangeLine1 = trimmed.match(
      /^part\s*=\s*cq\.Workplane\(\s*["']XY["']\s*\)\.circle\(\s*([-\d.]+)\s*\)\.extrude\(\s*([-\d.]+)\s*\)$/
    );
    if (flangeLine1 && lineIdx + 1 < logicalLines.length) {
      const next1 = logicalLines[lineIdx + 1].trim();
      const flangeLine2 = next1.match(
        /^part\s*=\s*part\.faces\(\s*["']>Z["']\s*\)\.workplane\(\s*\)\.hole\(\s*diameter\s*=\s*([-\d.]+)\s*,\s*depth\s*=\s*([-\d.]+)\s*\)$/
      );
      if (flangeLine2 && flangeLine1[2] === flangeLine2[2]) {
        addBlock({
          type: "cq_macro_flange",
          fields: {
            OUTER_R: Number(flangeLine1[1]) || 25,
            CENTER_D: Number(flangeLine2[1]) || 10,
            THICKNESS: Number(flangeLine1[2]) || 8,
          },
        });
        lineIdx += 1;
        continue;
      }
    }

    // 4. 识别倒圆台放样 (cq_op_cone)
    const coneLoftMatch = trimmed.match(
      /Workplane\(\s*["']XY["']\s*\)\s*\.circle\(\s*([-\d.]+)\s*\)\s*\.workplane\(\s*offset\s*=\s*([-\d.]+)\s*\)\s*\.circle\(\s*([-\d.]+)\s*\)\s*\.loft/
    );
    if (coneLoftMatch) {
      addBlock({
        type: "cq_op_cone",
        fields: {
          R_BOTTOM: Number(coneLoftMatch[1]) || 30,
          HEIGHT: Number(coneLoftMatch[2]) || 15,
          R_TOP: Number(coneLoftMatch[3]) || 20,
        },
      });
      continue;
    }

    // 5. 识别极坐标孔位阵列 (cq_op_polar_array)
    const polarArrayHoleMatch = trimmed.match(
      /\.polarArray\(\s*radius\s*=\s*([-\d.]+).*?count\s*=\s*(\d+)\s*\)\s*\.circle\(\s*([-\d.]+)\s*\)\s*\.cutThruAll/
    );
    if (polarArrayHoleMatch) {
      addBlock({
        type: "cq_op_polar_array",
        fields: {
          RADIUS: Number(polarArrayHoleMatch[1]) || 28,
          COUNT: Number(polarArrayHoleMatch[2]) || 8,
          DIAMETER: Number((Number(polarArrayHoleMatch[3]) * 2).toFixed(2)) || 3,
        },
      });
      continue;
    }

    // 6. 识别辐射散热格栅槽切削 (cq_op_cooling_slots)
    const coolingSlotsMatch = trimmed.match(
      /\.polarArray\(.*?count\s*=\s*(\d+)\s*\)\s*\.rect\(\s*([-\d.]+)\s*,\s*[-\d.]+\s*\)\s*\.cutBlind\(\s*-?([-\d.]+)\s*\)/
    );
    if (coolingSlotsMatch) {
      addBlock({
        type: "cq_op_cooling_slots",
        fields: {
          COUNT: Number(coolingSlotsMatch[1]) || 12,
          WIDTH: Number(coolingSlotsMatch[2]) || 2,
          DEPTH: Math.abs(Number(coolingSlotsMatch[3])) || 3,
        },
      });
      continue;
    }

    // 7. 控制流语句 (for, if, else, def, return)
    if (parseSharedControlStatement(trimmed, indent, stack, addBlock, getCurrentList)) {
      continue;
    }

    // 8. 解析 CadQuery 链式调用语句 (如 part = cq.Workplane("XY")... 或 part = part.rect(...)...)
    const assign = splitTopLevelAssignment(trimmed);
    const rhsExpr = assign ? assign.rhs.trim() : trimmed;
    const lhsVar = assign ? assign.lhs.trim() : "";

    if (
      /^(?:cq\.Workplane|part\.|result\.|wp\.|workplane\.|\(\s*(?:cq\.Workplane|part\.))/.test(rhsExpr)
    ) {
      const calls = splitCadQueryMethodChain(rhsExpr);
      for (let cIdx = 0; cIdx < calls.length; cIdx++) {
        const call = calls[cIdx];
        const next1 = calls[cIdx + 1];
        const next2 = calls[cIdx + 2];
        const args = splitTopLevelArgs(call.argsStr);

        const getArgVal = (idx: number, kwRegex: RegExp, defVal: string): string => {
          for (const a of args) {
            if (kwRegex.test(a)) return a.replace(kwRegex, "").trim();
          }
          let pos = 0;
          for (const a of args) {
            if (!a.includes("=")) {
              if (pos === idx) return a.trim();
              pos++;
            }
          }
          return defVal;
        };

        if (call.name === "Workplane") {
          addBlock({
            type: "cq_init_workplane",
            fields: { PLANE: extractPlane(call.argsStr) },
          });
          continue;
        }

        // .faces(...).edges("%Circle").fillet(r) / chamfer(l)
        if (call.name === "faces" && next1?.name === "edges" && next2?.name === "fillet") {
          const fArgs = splitTopLevelArgs(next2.argsStr);
          addBlock({
            type: "cq_op_fillet",
            fields: {
              SELECTOR: "faces_Z_circle",
              RADIUS: Number(fArgs[0]) || 2,
            },
          });
          cIdx += 2;
          continue;
        }
        if (call.name === "faces" && next1?.name === "edges" && next2?.name === "chamfer") {
          const cArgs = splitTopLevelArgs(next2.argsStr);
          addBlock({
            type: "cq_op_chamfer",
            fields: {
              SELECTOR: "faces_Z_circle",
              LENGTH: Number(cArgs[0]) || 2,
            },
          });
          cIdx += 2;
          continue;
        }

        // .faces(">Z").shell(-2)
        if (call.name === "faces" && next1?.name === "shell") {
          const sArgs = splitTopLevelArgs(next1.argsStr);
          addBlock({
            type: "cq_op_shell",
            fields: {
              SELECTOR: stripQuotes(args[0]) || ">Z",
              THICKNESS: Math.abs(Number(sArgs[0])) || 2,
            },
          });
          cIdx += 1;
          continue;
        }

        // .faces(">Z").workplane(centerOption=...)
        if (call.name === "faces" && next1?.name === "workplane") {
          const sel = stripQuotes(args[0]) || ">Z";
          let centerOption = "ProjectedOrigin";
          if (/CenterOfMass/i.test(next1.argsStr)) centerOption = "CenterOfMass";
          else if (/CenterOfBoundBox/i.test(next1.argsStr)) centerOption = "CenterOfBoundBox";
          addBlock({
            type: "cq_sel_face",
            fields: { SELECTOR: sel, CENTER_OPTION: centerOption },
          });
          cIdx += 1;
          continue;
        }

        // .edges(...).fillet(r) / .edges(...).chamfer(l)
        if (call.name === "edges" && next1?.name === "fillet") {
          const fArgs = splitTopLevelArgs(next1.argsStr);
          addBlock({
            type: "cq_op_fillet",
            fields: {
              SELECTOR: stripQuotes(args[0] || ""),
              RADIUS: Number(fArgs[0]) || 2,
            },
          });
          cIdx += 1;
          continue;
        }
        if (call.name === "edges" && next1?.name === "chamfer") {
          const cArgs = splitTopLevelArgs(next1.argsStr);
          addBlock({
            type: "cq_op_chamfer",
            fields: {
              SELECTOR: stripQuotes(args[0] || ""),
              LENGTH: Number(cArgs[0]) || 2,
            },
          });
          cIdx += 1;
          continue;
        }

        // .workplane(offset=5)
        if (call.name === "workplane") {
          const offVal = getArgVal(0, /^offset\s*=\s*/i, "5");
          addBlock({
            type: "cq_sel_offset",
            fields: { OFFSET: Number(offVal) || 5 },
          });
          continue;
        }

        // .transformed(rotate=(rx, ry, rz), offset=(ox, oy, oz))
        if (call.name === "transformed") {
          const rotMatch = call.argsStr.match(/rotate\s*=\s*\(\s*([^)]+)\s*\)/i);
          const offMatch = call.argsStr.match(/offset\s*=\s*\(\s*([^)]+)\s*\)/i);
          const rotParts = rotMatch ? splitTopLevelArgs(rotMatch[1]) : ["0", "0", "0"];
          const offParts = offMatch ? splitTopLevelArgs(offMatch[1]) : ["0", "0", "0"];
          addBlock({
            type: "cq_op_transform",
            fields: {
              RX: Number(rotParts[0]) || 0,
              RY: Number(rotParts[1]) || 0,
              RZ: Number(rotParts[2]) || 0,
              OX: Number(offParts[0]) || 0,
              OY: Number(offParts[1]) || 0,
              OZ: Number(offParts[2]) || 0,
            },
          });
          continue;
        }

        // .box(l, w, h)
        if (call.name === "box") {
          const l = getArgVal(0, /^length\s*=\s*/i, "20");
          const w = getArgVal(1, /^width\s*=\s*/i, "20");
          const h = getArgVal(2, /^height\s*=\s*/i, "10");
          addBlock({
            type: "cq_op_box",
            fields: {
              LENGTH: Number(l) || 20,
              WIDTH: Number(w) || 20,
              HEIGHT: Number(h) || 10,
            },
          });
          continue;
        }

        // .cylinder(h, r)
        if (call.name === "cylinder") {
          const h = getArgVal(0, /^height\s*=\s*/i, "30");
          const r = getArgVal(1, /^radius\s*=\s*/i, "15");
          addBlock({
            type: "cq_op_cylinder",
            fields: {
              HEIGHT: Number(h) || 30,
              RADIUS: Number(r) || 15,
            },
          });
          continue;
        }

        // .sphere(r)
        if (call.name === "sphere") {
          const r = getArgVal(0, /^radius\s*=\s*/i, "15");
          addBlock({
            type: "cq_op_sphere",
            fields: { RADIUS: Number(r) || 15 },
          });
          continue;
        }

        // .rect(w, h) -> cq_sketch_rect (ValueInput WIDTH, HEIGHT)
        if (call.name === "rect") {
          const wStr = getArgVal(0, /^(?:xLen|width)\s*=\s*/i, "20");
          const hStr = getArgVal(1, /^(?:yLen|height)\s*=\s*/i, "20");
          const wDef = parseExprToBlockDef(wStr) || { type: "math_number", fields: { NUM: 20 } };
          const hDef = parseExprToBlockDef(hStr) || { type: "math_number", fields: { NUM: 20 } };
          addBlock({
            type: "cq_sketch_rect",
            fields: {},
            inputs: { WIDTH: wDef, HEIGHT: hDef },
          });
          continue;
        }

        // .circle(r) -> cq_sketch_circle (ValueInput RADIUS)
        if (call.name === "circle") {
          const rStr = getArgVal(0, /^radius\s*=\s*/i, "10");
          const rDef = parseExprToBlockDef(rStr) || { type: "math_number", fields: { NUM: 10 } };
          addBlock({
            type: "cq_sketch_circle",
            fields: {},
            inputs: { RADIUS: rDef },
          });
          continue;
        }

        // .polygon(nSides=6, diameter=20)
        if (call.name === "polygon") {
          const n = getArgVal(0, /^nSides\s*=\s*/i, "6");
          const d = getArgVal(1, /^diameter\s*=\s*/i, "20");
          addBlock({
            type: "cq_sketch_polygon",
            fields: {
              SIDES: Number(n) || 6,
              DIAMETER: Number(d) || 20,
            },
          });
          continue;
        }

        // .polyline(pts).close() 或 .polyline(pts)
        if (call.name === "polyline") {
          const hasClose = next1?.name === "close";
          addBlock({
            type: "cq_sketch_polyline",
            fields: {
              POINTS: call.argsStr || "[(0,0), (20,0), (20,15), (0,15)]",
              CLOSE: hasClose ? "TRUE" : "FALSE",
            },
          });
          if (hasClose) cIdx += 1;
          continue;
        }

        // .slot2D(length, diameter, angle)
        if (call.name === "slot2D") {
          const l = getArgVal(0, /^length\s*=\s*/i, "30");
          const d = getArgVal(1, /^diameter\s*=\s*/i, "10");
          const a = getArgVal(2, /^angle\s*=\s*/i, "0");
          addBlock({
            type: "cq_sketch_slot",
            fields: {
              LENGTH: Number(l) || 30,
              DIAMETER: Number(d) || 10,
              ANGLE: Number(a) || 0,
            },
          });
          continue;
        }

        // .ellipse(xr, yr)
        if (call.name === "ellipse") {
          const xr = getArgVal(0, /^x_radius\s*=\s*/i, "20");
          const yr = getArgVal(1, /^y_radius\s*=\s*/i, "10");
          addBlock({
            type: "cq_sketch_ellipse",
            fields: {
              X_RADIUS: Number(xr) || 20,
              Y_RADIUS: Number(yr) || 10,
            },
          });
          continue;
        }

        // .extrude(dist) -> cq_op_extrude (ValueInput DISTANCE)
        if (call.name === "extrude") {
          const distStr = getArgVal(0, /^(?:until|distance)\s*=\s*/i, "10");
          const distDef = parseExprToBlockDef(distStr) || { type: "math_number", fields: { NUM: 10 } };
          addBlock({
            type: "cq_op_extrude",
            fields: {},
            inputs: { DISTANCE: distDef },
          });
          continue;
        }

        // .revolve(angle, (0,0,0), (ax,ay,az)) -> cq_op_revolve (ValueInput ANGLE)
        if (call.name === "revolve") {
          const angleStr = getArgVal(0, /^angleDegrees\s*=\s*/i, "360");
          const angleDef = parseExprToBlockDef(angleStr) || { type: "math_number", fields: { NUM: 360 } };
          let axis = "X";
          if (/\(\s*0\s*,\s*1\s*,\s*0\s*\)/.test(call.argsStr)) axis = "Y";
          else if (/\(\s*0\s*,\s*0\s*,\s*1\s*\)/.test(call.argsStr)) axis = "Z";
          addBlock({
            type: "cq_op_revolve",
            fields: { AXIS: axis },
            inputs: { ANGLE: angleDef },
          });
          continue;
        }

        // .hole(diameter=d, depth=depth)
        if (call.name === "hole") {
          const d = getArgVal(0, /^diameter\s*=\s*/i, "5");
          const depth = getArgVal(1, /^depth\s*=\s*/i, "10");
          addBlock({
            type: "cq_op_hole",
            fields: {
              DIAMETER: Number(d) || 5,
              DEPTH: Number(depth) || 10,
            },
          });
          continue;
        }

        // .cutBlind(-depth)
        if (call.name === "cutBlind") {
          const d = getArgVal(0, /^until\s*=\s*/i, "5");
          addBlock({
            type: "cq_op_cut_blind",
            fields: { DEPTH: Math.abs(Number(d)) || 5 },
          });
          continue;
        }

        // .fillet(r) / .chamfer(l) / .shell(-t)
        if (call.name === "fillet") {
          addBlock({
            type: "cq_op_fillet",
            fields: { SELECTOR: "", RADIUS: Number(args[0]) || 2 },
          });
          continue;
        }
        if (call.name === "chamfer") {
          addBlock({
            type: "cq_op_chamfer",
            fields: { SELECTOR: "", LENGTH: Number(args[0]) || 2 },
          });
          continue;
        }
        if (call.name === "shell") {
          addBlock({
            type: "cq_op_shell",
            fields: { SELECTOR: ">Z", THICKNESS: Math.abs(Number(args[0])) || 2 },
          });
          continue;
        }

        // .text(txt, fontsize=12, distance=2)
        if (call.name === "text") {
          const txt = stripQuotes(getArgVal(0, /^txt\s*=\s*/i, "CAD")) || "CAD";
          const size = getArgVal(1, /^fontsize\s*=\s*/i, "12");
          const dist = getArgVal(2, /^distance\s*=\s*/i, "2");
          addBlock({
            type: "cq_op_text",
            fields: {
              TEXT: txt,
              FONT_SIZE: Number(size) || 12,
              DISTANCE: Number(dist) || 2,
            },
          });
          continue;
        }
      }
      continue;
    }

    // 9. 普通变量赋值 (如 radius = 10)
    if (assign && /^[a-zA-Z_]\w*$/.test(lhsVar) && !["part", "result"].includes(lhsVar)) {
      const valDef = parseExprToBlockDef(rhsExpr);
      addBlock({
        type: "logoup_set_var",
        fields: { VAR: lhsVar },
        inputs: valDef ? { VALUE: valDef } : undefined,
      });
      continue;
    }
  }

  return wrapWithSingleStartBlock(blocks);
}

/**
 * ==================== 模式 3: build123d 专属解析器 ====================
 * 严格生成 b3d_* 积木与通用控制流积木，绝不转串为 logoup_* 或 cq_* 几何积木
 */
export function parseBuild123dModeCode(code: string): ParsedBlockDef[] {
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

  // 当前激活的容器栈
  const stack: ContainerStackEntry[] = [];

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const rawLine = lines[lineIndex];
    const trimmed = rawLine.trim();

    // 跳过空行、pass 或标准导入
    if (
      !trimmed ||
      trimmed === "pass" ||
      trimmed.startsWith("from build123d") ||
      trimmed.startsWith("import build123d") ||
      trimmed.startsWith("from backend.logoup3d") ||
      trimmed.startsWith("import backend.logoup3d") ||
      trimmed.startsWith("from logoup3d") ||
      trimmed.startsWith("import logoup3d") ||
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

    const topEntry = stack.length > 0 ? stack[stack.length - 1] : null;
    const getCurrentList = (): ParsedBlockDef[] => {
      if (!topEntry) return blocks;
      if (topEntry.isElseBranch) {
        if (!topEntry.block.elseChildren) topEntry.block.elseChildren = [];
        return topEntry.block.elseChildren;
      }
      if (!topEntry.block.children) topEntry.block.children = [];
      return topEntry.block.children;
    };

    const addBlock = (b: ParsedBlockDef) => {
      getCurrentList().push(b);
    };

    // 0. 仅解析通用控制流语句 (for, if, else, def, return)，严禁调用 LogoUp 构件解析器以防转串
    if (parseSharedControlStatement(trimmed, indent, stack, addBlock, getCurrentList)) {
      continue;
    }

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

    // 3. with BuildSketch(...) 容器 (支持基准平面与零件各方位表面选择)
    if (/(?:^|\s|\b)with\s+BuildSketch\s*\(/i.test(trimmed)) {
      const call = extractWithBlockCall(trimmed, "BuildSketch");
      let plane = "XY";
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

        // 若参数中显式写有实体变量名，如 part.faces()
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
          plane = "TOP_FACE";
        }
      }

      const varName = call?.alias || "sk";
      const hasAlias = call?.hasAlias ? "TRUE" : "FALSE";

      const block: ParsedBlockDef = {
        type: "b3d_build_sketch",
        fields: {
          PLANE: plane,
          VAR_NAME: varName,
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

    // 19.5 3D 特征: loft (放样成体)
    if (/(?:^|\s|\b)loft\s*\((.*)\)/i.test(trimmed)) {
      addBlock({
        type: "b3d_loft",
        fields: {
          MODE: extractMode(trimmed),
        },
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
      fields: { PLANE: "XY", VAR_NAME: "part" },
      children: [...blocks],
    };
    return wrapWithSingleStartBlock([rootPart]);
  }

  return wrapWithSingleStartBlock(blocks);
}

/**
 * 根据指定的工作模式将 Python 代码严格解析为对应模式的积木树
 * 若未显式指定 mode，则根据代码导入头自动推断模式
 */
export function parseBuild123dCode(code: string, mode?: WorkingMode): ParsedBlockDef[] {
  let effectiveMode: WorkingMode = mode || "build123d";
  if (!mode) {
    if (/import\s+cadquery|cq\.Workplane/.test(code)) {
      effectiveMode = "cadquery";
    } else if (/logoup3d|#\s*🏁\s*开始\s*LogoUp\s*3D/.test(code)) {
      effectiveMode = "logoup";
    }
  }

  if (effectiveMode === "logoup") {
    return parseLogoUpModeCode(code);
  }
  if (effectiveMode === "cadquery") {
    return parseCadQueryModeCode(code);
  }
  return parseBuild123dModeCode(code);
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
    if (block.getField(k)) {
      block.setFieldValue(v as any, k);
    }
  }
  if (valDef.type === "math_number") {
    block.setShadow(true);
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

      // 如果含有子容器槽位 (DO 或 BRANCH statement)
      if (def.children && def.children.length > 0) {
        const doInput = block.getInput("DO") || block.getInput("BRANCH");
        if (doInput && doInput.connection) {
          const subResult = buildBlockTree(workspace, def.children, doInput.connection);
          totalCount += subResult.count;
        }
      }

      // 如果含有否则分支槽位 (ELSE statement)
      if (def.elseChildren && def.elseChildren.length > 0) {
        const elseInput = block.getInput("ELSE");
        if (elseInput && elseInput.connection) {
          const elseResult = buildBlockTree(workspace, def.elseChildren, elseInput.connection);
          totalCount += elseResult.count;
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
 * 将 Python (LogoUp 3D / CadQuery / build123d) 源码严格按当前工作模式逆向解析并注入至 Blockly 工作区
 */
export function convertPythonToBlockly(
  code: string,
  workspace: Blockly.WorkspaceSvg | null,
  mode?: WorkingMode
): { success: boolean; blockCount: number; message: string } {
  if (!workspace) {
    return { success: false, blockCount: 0, message: "积木工作区未初始化或未加载" };
  }

  if (!code || !code.trim()) {
    return { success: false, blockCount: 0, message: "待转换代码为空" };
  }

  const parsed = parseBuild123dCode(code, mode);

  if (parsed.length === 0) {
    const modeLabel =
      mode === "logoup" ? "LogoUp 3D" : mode === "cadquery" ? "CadQuery" : "build123d";
    return {
      success: false,
      blockCount: 0,
      message: `未在代码中识别到可转换的 ${modeLabel} 几何建模语句，请确认当前代码与所选工作模式一致`,
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

    const modeLabel =
      mode === "logoup" ? "LogoUp 3D" : mode === "cadquery" ? "CadQuery" : "build123d";
    return {
      success: true,
      blockCount: count,
      message: `成功按 ${modeLabel} 模式逆向解析并还原 ${count} 个积木！`,
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
export const parseCadQueryCode = (code: string) => parseCadQueryModeCode(code);
