import * as Blockly from "blockly";
import { pythonGenerator, Order } from "blockly/python";

let generatorRegistered = false;

/**
 * 辅助函数：将模式转换为 build123d 的 mode=Mode.XXX 字符串
 */
function getModeParam(mode: string): string {
  if (mode === "SUBTRACT") return ", mode=Mode.SUBTRACT";
  if (mode === "INTERSECT") return ", mode=Mode.INTERSECT";
  return "";
}

/**
 * 注册 build123d Python 积木代码生成器
 */
export function registerBuild123dGenerator() {
  if (generatorRegistered) return;

  // ==================== 1. 建造者上下文容器 ====================

  pythonGenerator.forBlock["b3d_build_part"] = function (block: Blockly.Block) {
    const plane = block.getFieldValue("PLANE") || "XY";
    const planeParam = plane === "XY" ? "" : `Plane.${plane}`;
    const branch = pythonGenerator.statementToCode(block, "DO") || "    pass\n";
    return `with BuildPart(${planeParam}) as part:\n${branch}\n`;
  };

  pythonGenerator.forBlock["b3d_build_sketch"] = function (block: Blockly.Block) {
    const plane = block.getFieldValue("PLANE") || "XY";
    let planeArg = "";
    if (plane === "TOP_FACE") {
      planeArg = "part.faces().sort_by(Axis.Z)[-1]";
    } else if (plane === "BOTTOM_FACE") {
      planeArg = "part.faces().sort_by(Axis.Z)[0]";
    } else if (plane !== "XY") {
      planeArg = `Plane.${plane}`;
    }
    const branch = pythonGenerator.statementToCode(block, "DO") || "    pass\n";
    return `with BuildSketch(${planeArg}) as sk:\n${branch}\n`;
  };

  pythonGenerator.forBlock["b3d_build_line"] = function (block: Blockly.Block) {
    const branch = pythonGenerator.statementToCode(block, "DO") || "    pass\n";
    return `with BuildLine() as ln:\n${branch}\n`;
  };

  // ==================== 2. 空间定位与阵列 ====================

  pythonGenerator.forBlock["b3d_locations"] = function (block: Blockly.Block) {
    const x = block.getFieldValue("X") ?? 0;
    const y = block.getFieldValue("Y") ?? 0;
    const z = block.getFieldValue("Z") ?? 0;
    const branch = pythonGenerator.statementToCode(block, "DO") || "    pass\n";
    return `with Locations((${x}, ${y}, ${z})):\n${branch}\n`;
  };

  pythonGenerator.forBlock["b3d_grid_locations"] = function (block: Blockly.Block) {
    const xs = block.getFieldValue("X_SPACING") ?? 15;
    const ys = block.getFieldValue("Y_SPACING") ?? 15;
    const xc = block.getFieldValue("X_COUNT") ?? 3;
    const yc = block.getFieldValue("Y_COUNT") ?? 3;
    const branch = pythonGenerator.statementToCode(block, "DO") || "    pass\n";
    return `with GridLocations(${xs}, ${ys}, ${xc}, ${yc}):\n${branch}\n`;
  };

  pythonGenerator.forBlock["b3d_polar_locations"] = function (block: Blockly.Block) {
    const r = block.getFieldValue("RADIUS") ?? 20;
    const c = block.getFieldValue("COUNT") ?? 6;
    const branch = pythonGenerator.statementToCode(block, "DO") || "    pass\n";
    return `with PolarLocations(radius=${r}, count=${c}):\n${branch}\n`;
  };

  pythonGenerator.forBlock["b3d_hex_locations"] = function (block: Blockly.Block) {
    const apothem = block.getFieldValue("APOTHEM") ?? 10;
    const xc = block.getFieldValue("X_COUNT") ?? 3;
    const yc = block.getFieldValue("Y_COUNT") ?? 3;
    const branch = pythonGenerator.statementToCode(block, "DO") || "    pass\n";
    return `with HexLocations(apothem=${apothem}, x_count=${xc}, y_count=${yc}):\n${branch}\n`;
  };

  // ==================== 3. 3D 原生实体 Primitives ====================

  pythonGenerator.forBlock["b3d_box"] = function (block: Blockly.Block) {
    const l = block.getFieldValue("LENGTH") ?? 20;
    const w = block.getFieldValue("WIDTH") ?? 20;
    const h = block.getFieldValue("HEIGHT") ?? 10;
    const mode = getModeParam(block.getFieldValue("MODE"));
    return `Box(${l}, ${w}, ${h}${mode})\n`;
  };

  pythonGenerator.forBlock["b3d_cylinder"] = function (block: Blockly.Block) {
    const r = block.getFieldValue("RADIUS") ?? 10;
    const h = block.getFieldValue("HEIGHT") ?? 20;
    const mode = getModeParam(block.getFieldValue("MODE"));
    return `Cylinder(radius=${r}, height=${h}${mode})\n`;
  };

  pythonGenerator.forBlock["b3d_sphere"] = function (block: Blockly.Block) {
    const r = block.getFieldValue("RADIUS") ?? 10;
    const mode = getModeParam(block.getFieldValue("MODE"));
    return `Sphere(radius=${r}${mode})\n`;
  };

  pythonGenerator.forBlock["b3d_cone"] = function (block: Blockly.Block) {
    const r1 = block.getFieldValue("R1") ?? 15;
    const r2 = block.getFieldValue("R2") ?? 5;
    const h = block.getFieldValue("HEIGHT") ?? 20;
    const mode = getModeParam(block.getFieldValue("MODE"));
    return `Cone(bottom_radius=${r1}, top_radius=${r2}, height=${h}${mode})\n`;
  };

  pythonGenerator.forBlock["b3d_torus"] = function (block: Blockly.Block) {
    const r1 = block.getFieldValue("R1") ?? 20;
    const r2 = block.getFieldValue("R2") ?? 5;
    const mode = getModeParam(block.getFieldValue("MODE"));
    return `Torus(major_radius=${r1}, minor_radius=${r2}${mode})\n`;
  };

  pythonGenerator.forBlock["b3d_wedge"] = function (block: Blockly.Block) {
    const dx = block.getFieldValue("DX") ?? 20;
    const dy = block.getFieldValue("DY") ?? 20;
    const dz = block.getFieldValue("DZ") ?? 15;
    const xmin = block.getFieldValue("XMIN") ?? 5;
    const zmin = block.getFieldValue("ZMIN") ?? 0;
    const xmax = block.getFieldValue("XMAX") ?? 15;
    const zmax = block.getFieldValue("ZMAX") ?? 10;
    const mode = getModeParam(block.getFieldValue("MODE"));
    return `Wedge(dx=${dx}, dy=${dy}, dz=${dz}, xmin=${xmin}, zmin=${zmin}, xmax=${xmax}, zmax=${zmax}${mode})\n`;
  };

  // ==================== 4. 2D 草图图元 Sketches ====================

  pythonGenerator.forBlock["b3d_sketch_rect"] = function (block: Blockly.Block) {
    const w = block.getFieldValue("WIDTH") ?? 20;
    const h = block.getFieldValue("HEIGHT") ?? 20;
    const mode = getModeParam(block.getFieldValue("MODE"));
    return `Rectangle(${w}, ${h}${mode})\n`;
  };

  pythonGenerator.forBlock["b3d_sketch_circle"] = function (block: Blockly.Block) {
    const r = block.getFieldValue("RADIUS") ?? 10;
    const mode = getModeParam(block.getFieldValue("MODE"));
    return `Circle(radius=${r}${mode})\n`;
  };

  pythonGenerator.forBlock["b3d_sketch_regular_polygon"] = function (block: Blockly.Block) {
    const r = block.getFieldValue("RADIUS") ?? 10;
    const sides = block.getFieldValue("SIDES") ?? 6;
    const mode = getModeParam(block.getFieldValue("MODE"));
    return `RegularPolygon(radius=${r}, side_count=${sides}${mode})\n`;
  };

  pythonGenerator.forBlock["b3d_sketch_polygon"] = function (block: Blockly.Block) {
    const pts = block.getFieldValue("POINTS") || "[(0,0), (20,0), (20,15), (0,15)]";
    const mode = getModeParam(block.getFieldValue("MODE"));
    return `Polygon(${pts}${mode})\n`;
  };

  pythonGenerator.forBlock["b3d_sketch_polyline"] = function (block: Blockly.Block) {
    const pts = block.getFieldValue("POINTS") || "[(0,0), (10,5), (20,0)]";
    const close = block.getFieldValue("CLOSE") === "TRUE" || block.getFieldValue("CLOSE") === true;
    return `Polyline(${pts}, close=${close ? "True" : "False"})\n`;
  };

  pythonGenerator.forBlock["b3d_sketch_slot"] = function (block: Blockly.Block) {
    const l = block.getFieldValue("LENGTH") ?? 30;
    const w = block.getFieldValue("WIDTH") ?? 10;
    const rot = block.getFieldValue("ROTATION") ?? 0;
    const mode = getModeParam(block.getFieldValue("MODE"));
    return `Slot2D(length=${l}, width=${w}, rotation=${rot}${mode})\n`;
  };

  pythonGenerator.forBlock["b3d_sketch_ellipse"] = function (block: Blockly.Block) {
    const xr = block.getFieldValue("X_RADIUS") ?? 20;
    const yr = block.getFieldValue("Y_RADIUS") ?? 10;
    const mode = getModeParam(block.getFieldValue("MODE"));
    return `Ellipse(x_radius=${xr}, y_radius=${yr}${mode})\n`;
  };

  pythonGenerator.forBlock["b3d_sketch_text"] = function (block: Blockly.Block) {
    const text = block.getFieldValue("TEXT") || "BUILD123D";
    const size = block.getFieldValue("FONT_SIZE") ?? 12;
    const mode = getModeParam(block.getFieldValue("MODE"));
    return `Text("${text}", font_size=${size}${mode})\n`;
  };

  // ==================== 5. 3D 特征操作 3D Operations ====================

  pythonGenerator.forBlock["b3d_extrude"] = function (block: Blockly.Block) {
    const amount = block.getFieldValue("AMOUNT") ?? 10;
    const mode = getModeParam(block.getFieldValue("MODE"));
    return `extrude(amount=${amount}${mode})\n`;
  };

  pythonGenerator.forBlock["b3d_revolve"] = function (block: Blockly.Block) {
    const angle = block.getFieldValue("ANGLE") ?? 360;
    const axis = block.getFieldValue("AXIS") || "Axis.Z";
    const mode = getModeParam(block.getFieldValue("MODE"));
    return `revolve(axis=${axis}, revolution_arc=${angle}${mode})\n`;
  };

  pythonGenerator.forBlock["b3d_loft"] = function (block: Blockly.Block) {
    const mode = getModeParam(block.getFieldValue("MODE"));
    return `loft(${mode ? mode.slice(2) : ""})\n`;
  };

  pythonGenerator.forBlock["b3d_fillet"] = function (block: Blockly.Block) {
    const r = block.getFieldValue("RADIUS") ?? 2;
    const target = block.getFieldValue("TARGET") || "ALL";
    let edgeSel = "part.edges()";
    if (target === "PARALLEL_Z") {
      edgeSel = "part.edges().filter_by(Axis.Z)";
    } else if (target === "TOP") {
      edgeSel = "part.faces().sort_by(Axis.Z)[-1].edges()";
    }
    return `fillet(${edgeSel}, radius=${r})\n`;
  };

  pythonGenerator.forBlock["b3d_chamfer"] = function (block: Blockly.Block) {
    const l = block.getFieldValue("LENGTH") ?? 2;
    const target = block.getFieldValue("TARGET") || "ALL";
    let edgeSel = "part.edges()";
    if (target === "PARALLEL_Z") {
      edgeSel = "part.edges().filter_by(Axis.Z)";
    } else if (target === "TOP") {
      edgeSel = "part.faces().sort_by(Axis.Z)[-1].edges()";
    }
    return `chamfer(${edgeSel}, length=${l})\n`;
  };

  pythonGenerator.forBlock["b3d_hole"] = function (block: Blockly.Block) {
    const r = block.getFieldValue("RADIUS") ?? 3;
    const depth = block.getFieldValue("DEPTH") ?? 10;
    return `Hole(radius=${r}, depth=${depth})\n`;
  };

  pythonGenerator.forBlock["b3d_offset"] = function (block: Blockly.Block) {
    const amount = block.getFieldValue("AMOUNT") ?? 2;
    return `offset(amount=${amount})\n`;
  };

  pythonGenerator.forBlock["b3d_split"] = function (block: Blockly.Block) {
    const plane = block.getFieldValue("PLANE") || "Plane.XZ";
    return `split(bisect_by=${plane})\n`;
  };

  pythonGenerator.forBlock["b3d_color"] = function (block: Blockly.Block) {
    const color = block.getFieldValue("COLOR") || "#3b82f6";
    return `part.color = Color("${color}")\n`;
  };

  // ==================== 6. 注释与辅助 ====================

  pythonGenerator.forBlock["b3d_comment"] = function (block: Blockly.Block) {
    const text = block.getFieldValue("TEXT") || "";
    return `# ${text}\n`;
  };

  // ==================== 7. 向下兼容原有 cq_* 积木 ====================

  pythonGenerator.forBlock["cq_comment"] = function (block: Blockly.Block) {
    const text = block.getFieldValue("TEXT") || "";
    return `# ${text}\n`;
  };

  pythonGenerator.forBlock["cq_init_workplane"] = function (block: Blockly.Block) {
    const plane = block.getFieldValue("PLANE") || "XY";
    const planeArg = plane === "XY" ? "" : `Plane.${plane}`;
    return `with BuildPart(${planeArg}) as part:\n`;
  };

  pythonGenerator.forBlock["cq_op_box"] = function (block: Blockly.Block) {
    const l = block.getFieldValue("LENGTH") ?? 20;
    const w = block.getFieldValue("WIDTH") ?? 20;
    const h = block.getFieldValue("HEIGHT") ?? 10;
    return `    Box(${l}, ${w}, ${h})\n`;
  };

  pythonGenerator.forBlock["cq_op_cylinder"] = function (block: Blockly.Block) {
    const h = block.getFieldValue("HEIGHT") ?? 30;
    const r = block.getFieldValue("RADIUS") ?? 15;
    return `    Cylinder(radius=${r}, height=${h})\n`;
  };

  pythonGenerator.forBlock["cq_op_sphere"] = function (block: Blockly.Block) {
    const r = block.getFieldValue("RADIUS") ?? 15;
    return `    Sphere(radius=${r})\n`;
  };

  pythonGenerator.forBlock["cq_op_extrude"] = function (block: Blockly.Block) {
    const dist = block.getFieldValue("DISTANCE") ?? 10;
    return `    extrude(amount=${dist})\n`;
  };

  pythonGenerator.forBlock["cq_op_fillet"] = function (block: Blockly.Block) {
    const r = block.getFieldValue("RADIUS") ?? 2;
    return `    fillet(part.edges(), radius=${r})\n`;
  };

  pythonGenerator.forBlock["cq_op_chamfer"] = function (block: Blockly.Block) {
    const l = block.getFieldValue("LENGTH") ?? 2;
    return `    chamfer(part.edges(), length=${l})\n`;
  };

  pythonGenerator.forBlock["cq_op_hole"] = function (block: Blockly.Block) {
    const d = block.getFieldValue("DIAMETER") ?? 5;
    const depth = block.getFieldValue("DEPTH") ?? 10;
    return `    Hole(radius=${d / 2}, depth=${depth})\n`;
  };

  pythonGenerator.forBlock["cq_sketch_rect"] = function (block: Blockly.Block) {
    const w = block.getFieldValue("WIDTH") ?? 20;
    const h = block.getFieldValue("HEIGHT") ?? 20;
    return `    with BuildSketch() as sk:\n        Rectangle(${w}, ${h})\n`;
  };

  pythonGenerator.forBlock["cq_sketch_circle"] = function (block: Blockly.Block) {
    const r = block.getFieldValue("RADIUS") ?? 10;
    return `    with BuildSketch() as sk:\n        Circle(radius=${r})\n`;
  };

  pythonGenerator.forBlock["cq_sketch_polygon"] = function (block: Blockly.Block) {
    const n = block.getFieldValue("SIDES") ?? 6;
    const d = block.getFieldValue("DIAMETER") ?? 20;
    return `    with BuildSketch() as sk:\n        RegularPolygon(radius=${d / 2}, side_count=${n})\n`;
  };

  pythonGenerator.forBlock["cq_sketch_polyline"] = function (block: Blockly.Block) {
    const pts = block.getFieldValue("POINTS") || "[(0,0), (20,0), (20,15), (0,15)]";
    const close = block.getFieldValue("CLOSE") === "TRUE" || block.getFieldValue("CLOSE") === true;
    return `    with BuildSketch() as sk:\n        Polyline(${pts}, close=${close ? "True" : "False"})\n`;
  };

  pythonGenerator.forBlock["cq_sketch_slot"] = function (block: Blockly.Block) {
    const length = block.getFieldValue("LENGTH") ?? 30;
    const diameter = block.getFieldValue("DIAMETER") ?? 10;
    const angle = block.getFieldValue("ANGLE") ?? 0;
    return `    with BuildSketch() as sk:\n        Slot2D(length=${length}, width=${diameter}, rotation=${angle})\n`;
  };

  generatorRegistered = true;
}

/**
 * 将 Blockly 工作区转换为规范的 build123d 脚本代码
 */
export function workspaceToBuild123d(workspace: Blockly.Workspace): string {
  registerBuild123dGenerator();
  const rawCode = pythonGenerator.workspaceToCode(workspace);

  // 清洗空行并补全标准头部
  const cleanCode = rawCode.trim();
  if (!cleanCode) {
    return `from build123d import *\n\nwith BuildPart() as part:\n    Box(20, 20, 10)\n`;
  }

  let fullCode = "";
  if (!cleanCode.includes("from build123d import *") && !cleanCode.includes("import build123d")) {
    fullCode += "from build123d import *\n\n";
  }
  fullCode += cleanCode;
  if (!fullCode.endsWith("\n")) {
    fullCode += "\n";
  }
  return fullCode;
}
