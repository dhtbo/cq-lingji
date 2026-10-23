import * as Blockly from "blockly";
import { pythonGenerator, Order } from "blockly/python";
import { registerBuild123dGenerator } from "./build123d";
import { registerLogoUp3DGenerator } from "./logoup3d";

/**
 * 辅助：优先从 ValueInput 插槽提取表达式代码，兼容回退读取 Field 值
 */
function getValOrField(
  block: Blockly.Block,
  name: string,
  defaultVal: string | number
): string | number {
  const valCode = pythonGenerator.valueToCode(block, name, Order.NONE);
  if (valCode && valCode.trim() !== "") {
    return valCode.trim();
  }
  const fieldVal = block.getFieldValue(name);
  if (fieldVal !== null && fieldVal !== undefined && String(fieldVal).trim() !== "") {
    return fieldVal;
  }
  return defaultVal;
}

/**
 * 注册 CadQuery Python 积木代码生成器
 */
export function registerCadQueryGenerator() {
  // --- 初始化积木 ---

  pythonGenerator.forBlock["cq_init_workplane"] = function (block: Blockly.Block) {
    const plane = block.getFieldValue("PLANE") || "XY";
    return `part = cq.Workplane("${plane}")\n`;
  };

  pythonGenerator.forBlock["cq_chain_workplane"] = function (block: Blockly.Block) {
    const plane = block.getFieldValue("PLANE") || "XY";
    return [`cq.Workplane("${plane}")`, Order.FUNCTION_CALL];
  };

  pythonGenerator.forBlock["cq_chain_assign"] = function (block: Blockly.Block) {
    const expr = pythonGenerator.valueToCode(block, "EXPR", Order.NONE) || 'cq.Workplane("XY")';
    return `part = ${expr}\n`;
  };

  pythonGenerator.forBlock["cq_chain_part_ref"] = function (block: Blockly.Block) {
    const varName = block.getFieldValue("VAR_NAME") || "part";
    return [varName, Order.ATOMIC];
  };

  // --- 2D 草图绘制 ---

  pythonGenerator.forBlock["cq_sketch_rect"] = function (block: Blockly.Block) {
    const w = getValOrField(block, "WIDTH", 20);
    const h = getValOrField(block, "HEIGHT", 20);
    return `part = part.rect(${w}, ${h})\n`;
  };

  pythonGenerator.forBlock["cq_sketch_circle"] = function (block: Blockly.Block) {
    const r = getValOrField(block, "RADIUS", 10);
    return `part = part.circle(${r})\n`;
  };

  pythonGenerator.forBlock["cq_sketch_polygon"] = function (block: Blockly.Block) {
    const n = block.getFieldValue("SIDES") ?? 6;
    const d = block.getFieldValue("DIAMETER") ?? 20;
    return `part = part.polygon(nSides=${n}, diameter=${d})\n`;
  };

  pythonGenerator.forBlock["cq_sketch_polyline"] = function (block: Blockly.Block) {
    const pts = block.getFieldValue("POINTS") || "[(0,0), (20,0), (20,15), (0,15)]";
    const close = block.getFieldValue("CLOSE") === "TRUE" || block.getFieldValue("CLOSE") === true;
    return close ? `part = part.polyline(${pts}).close()\n` : `part = part.polyline(${pts})\n`;
  };

  pythonGenerator.forBlock["cq_sketch_slot"] = function (block: Blockly.Block) {
    const length = block.getFieldValue("LENGTH") ?? 30;
    const diameter = block.getFieldValue("DIAMETER") ?? 10;
    const angle = block.getFieldValue("ANGLE") ?? 0;
    return `part = part.slot2D(${length}, ${diameter}, ${angle})\n`;
  };

  pythonGenerator.forBlock["cq_sketch_ellipse"] = function (block: Blockly.Block) {
    const xr = block.getFieldValue("X_RADIUS") ?? 20;
    const yr = block.getFieldValue("Y_RADIUS") ?? 10;
    return `part = part.ellipse(${xr}, ${yr})\n`;
  };

  pythonGenerator.forBlock["cq_comment"] = function (block: Blockly.Block) {
    const text = block.getFieldValue("TEXT") || "";
    return `# ${text}\n`;
  };

  pythonGenerator.forBlock["cq_chain_rect"] = function (block: Blockly.Block) {
    const target = pythonGenerator.valueToCode(block, "TARGET", Order.MEMBER) || 'cq.Workplane("XY")';
    const w = block.getFieldValue("WIDTH") ?? 20;
    const h = block.getFieldValue("HEIGHT") ?? 20;
    return [`${target}.rect(xLen=${w}, yLen=${h})`, Order.FUNCTION_CALL];
  };

  pythonGenerator.forBlock["cq_chain_circle"] = function (block: Blockly.Block) {
    const target = pythonGenerator.valueToCode(block, "TARGET", Order.MEMBER) || 'cq.Workplane("XY")';
    const r = block.getFieldValue("RADIUS") ?? 10;
    return [`${target}.circle(radius=${r})`, Order.FUNCTION_CALL];
  };

  pythonGenerator.forBlock["cq_chain_polygon"] = function (block: Blockly.Block) {
    const target = pythonGenerator.valueToCode(block, "TARGET", Order.MEMBER) || 'cq.Workplane("XY")';
    const n = block.getFieldValue("SIDES") ?? 6;
    const d = block.getFieldValue("DIAMETER") ?? 20;
    return [`${target}.polygon(nSides=${n}, diameter=${d})`, Order.FUNCTION_CALL];
  };

  // --- 3D 实体特征操作 ---

  pythonGenerator.forBlock["cq_op_extrude"] = function (block: Blockly.Block) {
    const dist = getValOrField(block, "DISTANCE", 10);
    return `part = part.extrude(${dist})\n`;
  };

  pythonGenerator.forBlock["cq_op_hole"] = function (block: Blockly.Block) {
    const d = block.getFieldValue("DIAMETER") ?? 5;
    const depth = block.getFieldValue("DEPTH") ?? 10;
    return `part = part.hole(diameter=${d}, depth=${depth})\n`;
  };

  pythonGenerator.forBlock["cq_op_cut_blind"] = function (block: Blockly.Block) {
    const depth = block.getFieldValue("DEPTH") ?? 5;
    return `part = part.cutBlind(-${depth})\n`;
  };

  pythonGenerator.forBlock["cq_op_box"] = function (block: Blockly.Block) {
    const l = block.getFieldValue("LENGTH") ?? 20;
    const w = block.getFieldValue("WIDTH") ?? 20;
    const h = block.getFieldValue("HEIGHT") ?? 10;
    return `part = part.box(${l}, ${w}, ${h})\n`;
  };

  pythonGenerator.forBlock["cq_op_cylinder"] = function (block: Blockly.Block) {
    const h = block.getFieldValue("HEIGHT") ?? 30;
    const r = block.getFieldValue("RADIUS") ?? 15;
    return `part = part.cylinder(${h}, ${r})\n`;
  };

  pythonGenerator.forBlock["cq_op_sphere"] = function (block: Blockly.Block) {
    const r = block.getFieldValue("RADIUS") ?? 15;
    return `part = part.sphere(${r})\n`;
  };

  pythonGenerator.forBlock["cq_op_fillet"] = function (block: Blockly.Block) {
    const r = block.getFieldValue("RADIUS") ?? 2;
    const sel = block.getFieldValue("SELECTOR") || "";
    if (sel === "faces_Z_circle") {
      return `part = part.faces(">Z").edges("%Circle").fillet(${r})\n`;
    } else if (sel) {
      return `part = part.edges("${sel}").fillet(${r})\n`;
    }
    return `part = part.edges().fillet(${r})\n`;
  };

  pythonGenerator.forBlock["cq_op_chamfer"] = function (block: Blockly.Block) {
    const l = block.getFieldValue("LENGTH") ?? 2;
    const sel = block.getFieldValue("SELECTOR") || "";
    if (sel === "faces_Z_circle") {
      return `part = part.faces(">Z").edges("%Circle").chamfer(${l})\n`;
    } else if (sel) {
      return `part = part.edges("${sel}").chamfer(${l})\n`;
    }
    return `part = part.edges().chamfer(${l})\n`;
  };

  pythonGenerator.forBlock["cq_op_shell"] = function (block: Blockly.Block) {
    const sel = block.getFieldValue("SELECTOR") || ">Z";
    const thickness = block.getFieldValue("THICKNESS") ?? 2;
    return `part = part.faces("${sel}").shell(-${thickness})\n`;
  };

  pythonGenerator.forBlock["cq_op_text"] = function (block: Blockly.Block) {
    const text = block.getFieldValue("TEXT") || "CAD";
    const size = block.getFieldValue("FONT_SIZE") ?? 12;
    const dist = block.getFieldValue("DISTANCE") ?? 2;
    return `part = part.text("${text}", fontsize=${size}, distance=${dist})\n`;
  };

  // 11. 倒圆台放样 (火星防热大底)
  pythonGenerator.forBlock["cq_op_cone"] = function (block: Blockly.Block) {
    const rBottom = block.getFieldValue("R_BOTTOM") ?? 30;
    const rTop = block.getFieldValue("R_TOP") ?? 20;
    const h = block.getFieldValue("HEIGHT") ?? 15;
    return (
      `part = (\n` +
      `    cq.Workplane("XY")\n` +
      `    .circle(${rBottom})\n` +
      `    .workplane(offset=${h})\n` +
      `    .circle(${rTop})\n` +
      `    .loft(combine=True)\n` +
      `)\n`
    );
  };

  // 12. 极坐标孔位阵列 (耐磨穿孔法兰)
  pythonGenerator.forBlock["cq_op_polar_array"] = function (block: Blockly.Block) {
    const radius = block.getFieldValue("RADIUS") ?? 28;
    const count = block.getFieldValue("COUNT") ?? 8;
    const d = block.getFieldValue("DIAMETER") ?? 3;
    const holeR = (Number(d) / 2).toFixed(2);
    return (
      `part = (\n` +
      `    part.faces(">Z")\n` +
      `    .workplane()\n` +
      `    .polarArray(radius=${radius}, startAngle=0, angle=360, count=${count})\n` +
      `    .circle(${holeR})\n` +
      `    .cutThruAll()\n` +
      `)\n`
    );
  };

  // 13. 旋转成型 (霍尔推进喷管)
  pythonGenerator.forBlock["cq_op_revolve"] = function (block: Blockly.Block) {
    const angle = getValOrField(block, "ANGLE", 360);
    const axis = block.getFieldValue("AXIS") || "X";
    let axisVec = "(1, 0, 0)";
    if (axis === "Y") axisVec = "(0, 1, 0)";
    if (axis === "Z") axisVec = "(0, 0, 1)";
    return `part = part.revolve(${angle}, (0, 0, 0), ${axisVec})\n`;
  };

  // 14. 辐射散热格栅槽切削
  pythonGenerator.forBlock["cq_op_cooling_slots"] = function (block: Blockly.Block) {
    const count = block.getFieldValue("COUNT") ?? 12;
    const width = block.getFieldValue("WIDTH") ?? 2;
    const depth = block.getFieldValue("DEPTH") ?? 3;
    return (
      `part = (\n` +
      `    part.faces(">Z")\n` +
      `    .workplane()\n` +
      `    .polarArray(radius=25, startAngle=0, angle=360, count=${count})\n` +
      `    .rect(${width}, 6)\n` +
      `    .cutBlind(-${depth})\n` +
      `)\n`
    );
  };

  pythonGenerator.forBlock["cq_chain_extrude"] = function (block: Blockly.Block) {
    const target = pythonGenerator.valueToCode(block, "TARGET", Order.MEMBER) || 'cq.Workplane("XY")';
    const dist = block.getFieldValue("DISTANCE") ?? 10;
    return [`${target}.extrude(distance=${dist})`, Order.FUNCTION_CALL];
  };

  pythonGenerator.forBlock["cq_chain_hole"] = function (block: Blockly.Block) {
    const target = pythonGenerator.valueToCode(block, "TARGET", Order.MEMBER) || "part";
    const d = block.getFieldValue("DIAMETER") ?? 5;
    const depth = block.getFieldValue("DEPTH") ?? 10;
    return [`${target}.hole(diameter=${d}, depth=${depth})`, Order.FUNCTION_CALL];
  };

  pythonGenerator.forBlock["cq_chain_loft"] = function (block: Blockly.Block) {
    const target = pythonGenerator.valueToCode(block, "TARGET", Order.MEMBER) || "part";
    return [`${target}.loft(combine=True)`, Order.FUNCTION_CALL];
  };

  pythonGenerator.forBlock["cq_chain_cut_blind"] = function (block: Blockly.Block) {
    const target = pythonGenerator.valueToCode(block, "TARGET", Order.MEMBER) || "part";
    const depth = block.getFieldValue("DEPTH") ?? 5;
    return [`${target}.cutBlind(-${depth})`, Order.FUNCTION_CALL];
  };

  // --- 面选择与变换 ---

  pythonGenerator.forBlock["cq_sel_face"] = function (block: Blockly.Block) {
    const sel = block.getFieldValue("SELECTOR") || ">Z";
    const centerOption = block.getFieldValue("CENTER_OPTION") || "CenterOfMass";
    if (centerOption && centerOption !== "ProjectedOrigin") {
      return `part = part.faces("${sel}").workplane(centerOption="${centerOption}")\n`;
    }
    return `part = part.faces("${sel}").workplane()\n`;
  };

  pythonGenerator.forBlock["cq_sel_offset"] = function (block: Blockly.Block) {
    const offset = block.getFieldValue("OFFSET") ?? 5;
    return `part = part.workplane(offset=${offset})\n`;
  };

  pythonGenerator.forBlock["cq_op_transform"] = function (block: Blockly.Block) {
    const rx = block.getFieldValue("RX") ?? 0;
    const ry = block.getFieldValue("RY") ?? 0;
    const rz = block.getFieldValue("RZ") ?? 0;
    const ox = block.getFieldValue("OX") ?? 0;
    const oy = block.getFieldValue("OY") ?? 0;
    const oz = block.getFieldValue("OZ") ?? 0;
    return `part = part.transformed(rotate=(${rx}, ${ry}, ${rz}), offset=(${ox}, ${oy}, ${oz}))\n`;
  };

  pythonGenerator.forBlock["cq_chain_face_select"] = function (block: Blockly.Block) {
    const target = pythonGenerator.valueToCode(block, "TARGET", Order.MEMBER) || "part";
    const sel = block.getFieldValue("SELECTOR") || ">Z";
    const centerOption = block.getFieldValue("CENTER_OPTION") || "CenterOfMass";
    if (centerOption && centerOption !== "ProjectedOrigin") {
      return [
        `${target}.faces("${sel}").workplane(centerOption="${centerOption}")`,
        Order.FUNCTION_CALL,
      ];
    }
    return [`${target}.faces("${sel}").workplane()`, Order.FUNCTION_CALL];
  };

  pythonGenerator.forBlock["cq_chain_offset"] = function (block: Blockly.Block) {
    const target = pythonGenerator.valueToCode(block, "TARGET", Order.MEMBER) || "part";
    const offset = block.getFieldValue("OFFSET") ?? 5;
    return [`${target}.workplane(offset=${offset})`, Order.FUNCTION_CALL];
  };

  pythonGenerator.forBlock["cq_chain_transformed"] = function (block: Blockly.Block) {
    const target = pythonGenerator.valueToCode(block, "TARGET", Order.MEMBER) || "part";
    const rx = block.getFieldValue("RX") ?? 0;
    const ry = block.getFieldValue("RY") ?? 0;
    const rz = block.getFieldValue("RZ") ?? 0;
    const ox = block.getFieldValue("OX") ?? 0;
    const oy = block.getFieldValue("OY") ?? 0;
    const oz = block.getFieldValue("OZ") ?? 0;
    return [
      `${target}.transformed(rotate=(${rx}, ${ry}, ${rz}), offset=(${ox}, ${oy}, ${oz}))`,
      Order.FUNCTION_CALL,
    ];
  };

  // --- 宏积木 ---

  pythonGenerator.forBlock["cq_macro_radial_array"] = function (block: Blockly.Block) {
    const count = block.getFieldValue("COUNT") ?? 6;
    const d = block.getFieldValue("DIAMETER") ?? 4;
    const depth = block.getFieldValue("DEPTH") ?? 10;
    const offset = block.getFieldValue("OFFSET") ?? 2;
    return (
      `part = part.faces(">Z").workplane(offset=-${offset}).transformed(rotate=(90, 0, 0))\n` +
      `for _ in range(${count}):\n` +
      `    part = part.transformed(rotate=(0, 360 / ${count}, 0)).hole(diameter=${d}, depth=${depth})\n`
    );
  };

  pythonGenerator.forBlock["cq_macro_flange"] = function (block: Blockly.Block) {
    const r = block.getFieldValue("OUTER_R") ?? 25;
    const d = block.getFieldValue("CENTER_D") ?? 10;
    const t = block.getFieldValue("THICKNESS") ?? 8;
    let code = `part = cq.Workplane("XY").circle(${r}).extrude(${t})\n`;
    if (parseFloat(d) > 0) {
      code += `part = part.faces(">Z").workplane().hole(diameter=${d}, depth=${t})\n`;
    }
    return code;
  };

}

/**
 * 将 Blockly Workspace 转化为整洁的 CadQuery Python 源码
 */
export function generateCadQueryPython(workspace: Blockly.WorkspaceSvg): string {
  registerBuild123dGenerator();
  registerLogoUp3DGenerator();
  registerCadQueryGenerator();

  const allBlocks = workspace.getAllBlocks(false).filter((b) => b.isEnabled() && !b.isShadow());
  if (allBlocks.length === 0) {
    return "";
  }

  // 如果画布上仅有孤立的「开始」或「新建基准面」积木，尚未拼接任何几何建模步骤，返回空字符串以避免触发空 Workplane 报错
  const meaningfulBlocks = allBlocks.filter(
    (b) => b.type !== "logoup_start" && b.type !== "cq_init_workplane"
  );
  if (meaningfulBlocks.length === 0) {
    return "";
  }

  let rawCode = pythonGenerator.workspaceToCode(workspace);
  // 剔除「开始」帽子积木生成的 LogoUp 标记注释及非 CadQuery 导入语句
  rawCode = rawCode
    .replace(/^#\s*🏁\s*开始\s*LogoUp\s*3D\s*造型\s*\n?/gm, "")
    .replace(/^from\s+backend\.logoup3d\s+import\s+\*\s*\n?/gm, "")
    .replace(/^from\s+build123d\s+import\s+\*\s*\n?/gm, "")
    .trim();
  if (!rawCode) {
    return "";
  }

  // 若用户直接从「开始」积木下拼接了 part = part.xxx(...) 而未显式放置 cq_init_workplane，自动补齐默认 XY 工作平面初始化
  if (!/part\s*=\s*cq\.Workplane\s*\(/.test(rawCode) && /\bpart\s*\./.test(rawCode)) {
    rawCode = `part = cq.Workplane("XY")\n` + rawCode;
  }

  // 保证代码自包含 import 语句
  let fullCode = rawCode;
  if (!fullCode.includes("import cadquery as cq")) {
    fullCode = "import cadquery as cq\n\n" + fullCode;
  }

  return fullCode.trim() + "\n";
}
