import * as Blockly from "blockly";
import { pythonGenerator, Order } from "blockly/python";

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
  // 设置 Python 标准 4 空格缩进
  pythonGenerator.INDENT = "    ";

  // ==================== 1. 建造者上下文容器 ====================

  pythonGenerator.forBlock["b3d_build_part"] = function (block: Blockly.Block) {
    const varName = (block.getFieldValue("VAR_NAME") || "part").trim();
    const plane = block.getFieldValue("PLANE") || "XY";
    const planeParam = plane === "XY" ? "" : `Plane.${plane}`;
    const branch = pythonGenerator.statementToCode(block, "DO") || "    pass\n";
    return `with BuildPart(${planeParam}) as ${varName}:\n${branch}`;
  };

  pythonGenerator.forBlock["b3d_build_sketch"] = function (block: Blockly.Block) {
    const varName = (block.getFieldValue("VAR_NAME") || "").trim();
    const plane = block.getFieldValue("PLANE") || "XY";

    // 智能获取上层 BuildPart 的实体变量名 (例如 part)
    let parentVar = (block.getFieldValue("PARENT_VAR") || "").trim() || "part";
    let cur = block.getParent();
    while (cur) {
      if (cur.type === "b3d_build_part") {
        const v = cur.getFieldValue("VAR_NAME");
        if (v && v.trim()) {
          parentVar = v.trim();
          break;
        }
      }
      cur = cur.getParent();
    }

    let planeArg = "";
    if (plane === "TOP_FACE") {
      planeArg = `${parentVar}.faces().sort_by(Axis.Z)[-1]`;
    } else if (plane === "BOTTOM_FACE") {
      planeArg = `${parentVar}.faces().sort_by(Axis.Z)[0]`;
    } else if (plane === "RIGHT_FACE") {
      planeArg = `${parentVar}.faces().sort_by(Axis.X)[-1]`;
    } else if (plane === "LEFT_FACE") {
      planeArg = `${parentVar}.faces().sort_by(Axis.X)[0]`;
    } else if (plane === "FRONT_FACE") {
      planeArg = `${parentVar}.faces().sort_by(Axis.Y)[-1]`;
    } else if (plane === "BACK_FACE") {
      planeArg = `${parentVar}.faces().sort_by(Axis.Y)[0]`;
    } else if (plane === "XZ") {
      planeArg = "Plane.XZ";
    } else if (plane === "YZ") {
      planeArg = "Plane.YZ";
    } else {
      // 默认基础 XY 平面
      planeArg = "";
    }

    const branch = pythonGenerator.statementToCode(block, "DO") || "    pass\n";
    const hasAlias = (block.getFieldValue("HAS_ALIAS") ?? "TRUE") !== "FALSE" && varName !== "";
    const aliasSuffix = hasAlias ? ` as ${varName}` : "";
    return `with BuildSketch(${planeArg})${aliasSuffix}:\n${branch}`;
  };

  pythonGenerator.forBlock["b3d_select_face"] = function (block: Blockly.Block) {
    const part = (block.getFieldValue("PART_VAR") || "part").trim();
    const sel = block.getFieldValue("SELECTOR") || "TOP";
    let expr = `${part}.faces().sort_by(Axis.Z)[-1]`;
    if (sel === "BOTTOM") expr = `${part}.faces().sort_by(Axis.Z)[0]`;
    else if (sel === "RIGHT") expr = `${part}.faces().sort_by(Axis.X)[-1]`;
    else if (sel === "LEFT") expr = `${part}.faces().sort_by(Axis.X)[0]`;
    else if (sel === "BACK") expr = `${part}.faces().sort_by(Axis.Y)[-1]`;
    else if (sel === "FRONT") expr = `${part}.faces().sort_by(Axis.Y)[0]`;
    else if (sel === "CYLINDER") expr = `${part}.faces().filter_by(GeomType.CYLINDER)`;
    else if (sel === "PLANE") expr = `${part}.faces().filter_by(GeomType.PLANE)`;
    return [expr, Order.ATOMIC];
  };

  pythonGenerator.forBlock["b3d_build_line"] = function (block: Blockly.Block) {
    const varName = (block.getFieldValue("VAR_NAME") || "ln").trim();
    const branch = pythonGenerator.statementToCode(block, "DO") || "    pass\n";
    return `with BuildLine() as ${varName}:\n${branch}`;
  };

  pythonGenerator.forBlock["b3d_line"] = function (block: Blockly.Block) {
    const varName = (block.getFieldValue("VAR_NAME") || "").trim();
    const start = block.getFieldValue("START_PT") || "(0, 0)";
    const end = block.getFieldValue("END_PT") || "(10, 0)";
    if (varName) {
      return `${varName} = Line(${start}, ${end})\n`;
    }
    return `Line(${start}, ${end})\n`;
  };

  pythonGenerator.forBlock["b3d_three_point_arc"] = function (block: Blockly.Block) {
    const varName = (block.getFieldValue("VAR_NAME") || "").trim();
    const pt1 = block.getFieldValue("PT1") || "(0, 0)";
    const pt2 = block.getFieldValue("PT2") || "(5, 5)";
    const pt3 = block.getFieldValue("PT3") || "(10, 0)";
    if (varName) {
      return `${varName} = ThreePointArc(${pt1}, ${pt2}, ${pt3})\n`;
    }
    return `ThreePointArc(${pt1}, ${pt2}, ${pt3})\n`;
  };

  pythonGenerator.forBlock["b3d_make_face"] = function () {
    return `make_face()\n`;
  };

  pythonGenerator.forBlock["b3d_custom_code"] = function (block: Blockly.Block) {
    const code = (block.getFieldValue("CODE") || "").trim();
    return code ? `${code}\n` : "";
  };

  pythonGenerator.forBlock["b3d_var_assign"] = function (block: Blockly.Block) {
    const v = (block.getFieldValue("VAR") || "x").toString().trim();
    const val = (block.getFieldValue("VALUE") || "0").toString().trim();
    return `${v} = ${val}\n`;
  };

  pythonGenerator.forBlock["b3d_multi_var_assign"] = function (block: Blockly.Block) {
    const vars = (block.getFieldValue("VARS") || "a, b, c").toString().trim();
    const vals = (block.getFieldValue("VALUES") || "10, 20, 30").toString().trim();
    return `${vars} = ${vals}\n`;
  };

  pythonGenerator.forBlock["b3d_var_get"] = function (block: Blockly.Block) {
    const v = (block.getFieldValue("VAR") || "x").toString().trim();
    return [v, Order.ATOMIC];
  };

  pythonGenerator.forBlock["math_number"] = function (block: Blockly.Block) {
    const code = Number(block.getFieldValue("NUM"));
    return [String(isNaN(code) ? "0" : code), Order.ATOMIC];
  };

  pythonGenerator.forBlock["math_arithmetic"] = function (block: Blockly.Block) {
    const OPERATORS: Record<string, [string, number]> = {
      ADD: [" + ", Order.ADDITIVE],
      MINUS: [" - ", Order.ADDITIVE],
      MULTIPLY: [" * ", Order.MULTIPLICATIVE],
      DIVIDE: [" / ", Order.MULTIPLICATIVE],
      POWER: [" ** ", Order.EXPONENTIATION],
    };
    const tuple = OPERATORS[block.getFieldValue("OP")] || [" + ", Order.ADDITIVE];
    const operator = tuple[0];
    const order = tuple[1];
    const argument0 = pythonGenerator.valueToCode(block, "A", order) || "0";
    const argument1 = pythonGenerator.valueToCode(block, "B", order) || "0";
    const code = argument0 + operator + argument1;
    return [code, order];
  };

  // ==================== 2. 空间定位与阵列 ====================

  pythonGenerator.forBlock["b3d_locations"] = function (block: Blockly.Block) {
    const x = (block.getFieldValue("X") ?? "0").toString().trim();
    const y = (block.getFieldValue("Y") ?? "0").toString().trim();
    const z = (block.getFieldValue("Z") ?? "0").toString().trim();
    const branch = pythonGenerator.statementToCode(block, "DO") || "    pass\n";
    return `with Locations((${x}, ${y}, ${z})):\n${branch}`;
  };

  pythonGenerator.forBlock["b3d_grid_locations"] = function (block: Blockly.Block) {
    const xs = (block.getFieldValue("X_SPACING") ?? "15").toString().trim();
    const ys = (block.getFieldValue("Y_SPACING") ?? "15").toString().trim();
    const xc = (block.getFieldValue("X_COUNT") ?? "3").toString().trim();
    const yc = (block.getFieldValue("Y_COUNT") ?? "3").toString().trim();
    const branch = pythonGenerator.statementToCode(block, "DO") || "    pass\n";
    return `with GridLocations(${xs}, ${ys}, ${xc}, ${yc}):\n${branch}`;
  };

  pythonGenerator.forBlock["b3d_polar_locations"] = function (block: Blockly.Block) {
    const r = (block.getFieldValue("RADIUS") ?? "20").toString().trim();
    const c = (block.getFieldValue("COUNT") ?? "6").toString().trim();
    const branch = pythonGenerator.statementToCode(block, "DO") || "    pass\n";
    return `with PolarLocations(radius=${r}, count=${c}):\n${branch}`;
  };

  pythonGenerator.forBlock["b3d_hex_locations"] = function (block: Blockly.Block) {
    const apothem = (block.getFieldValue("APOTHEM") ?? "10").toString().trim();
    const xc = (block.getFieldValue("X_COUNT") ?? "3").toString().trim();
    const yc = (block.getFieldValue("Y_COUNT") ?? "3").toString().trim();
    const branch = pythonGenerator.statementToCode(block, "DO") || "    pass\n";
    return `with HexLocations(apothem=${apothem}, x_count=${xc}, y_count=${yc}):\n${branch}`;
  };

  // ==================== 3. 3D 原生实体 Primitives ====================

  pythonGenerator.forBlock["b3d_box"] = function (block: Blockly.Block) {
    const l = (block.getFieldValue("LENGTH") ?? "20").toString().trim();
    const w = (block.getFieldValue("WIDTH") ?? "20").toString().trim();
    const h = (block.getFieldValue("HEIGHT") ?? "10").toString().trim();
    const mode = getModeParam(block.getFieldValue("MODE"));
    return `Box(${l}, ${w}, ${h}${mode})\n`;
  };

  pythonGenerator.forBlock["b3d_cylinder"] = function (block: Blockly.Block) {
    const r = (block.getFieldValue("RADIUS") ?? "10").toString().trim();
    const h = (block.getFieldValue("HEIGHT") ?? "20").toString().trim();
    const mode = getModeParam(block.getFieldValue("MODE"));
    return `Cylinder(radius=${r}, height=${h}${mode})\n`;
  };

  pythonGenerator.forBlock["b3d_sphere"] = function (block: Blockly.Block) {
    const r = (block.getFieldValue("RADIUS") ?? "10").toString().trim();
    const mode = getModeParam(block.getFieldValue("MODE"));
    return `Sphere(radius=${r}${mode})\n`;
  };

  pythonGenerator.forBlock["b3d_cone"] = function (block: Blockly.Block) {
    const r1 = (block.getFieldValue("R1") ?? "15").toString().trim();
    const r2 = (block.getFieldValue("R2") ?? "5").toString().trim();
    const h = (block.getFieldValue("HEIGHT") ?? "20").toString().trim();
    const mode = getModeParam(block.getFieldValue("MODE"));
    return `Cone(bottom_radius=${r1}, top_radius=${r2}, height=${h}${mode})\n`;
  };

  pythonGenerator.forBlock["b3d_torus"] = function (block: Blockly.Block) {
    const r1 = (block.getFieldValue("R1") ?? "20").toString().trim();
    const r2 = (block.getFieldValue("R2") ?? "5").toString().trim();
    const mode = getModeParam(block.getFieldValue("MODE"));
    return `Torus(major_radius=${r1}, minor_radius=${r2}${mode})\n`;
  };

  pythonGenerator.forBlock["b3d_wedge"] = function (block: Blockly.Block) {
    const dx = (block.getFieldValue("DX") ?? "20").toString().trim();
    const dy = (block.getFieldValue("DY") ?? "20").toString().trim();
    const dz = (block.getFieldValue("DZ") ?? "15").toString().trim();
    const xmin = (block.getFieldValue("XMIN") ?? "5").toString().trim();
    const zmin = (block.getFieldValue("ZMIN") ?? "0").toString().trim();
    const xmax = (block.getFieldValue("XMAX") ?? "15").toString().trim();
    const zmax = (block.getFieldValue("ZMAX") ?? "10").toString().trim();
    const mode = getModeParam(block.getFieldValue("MODE"));
    return `Wedge(dx=${dx}, dy=${dy}, dz=${dz}, xmin=${xmin}, zmin=${zmin}, xmax=${xmax}, zmax=${zmax}${mode})\n`;
  };

  // ==================== 4. 2D 草图图元 Sketches ====================

  pythonGenerator.forBlock["b3d_sketch_rect"] = function (block: Blockly.Block) {
    const wVal = pythonGenerator.valueToCode(block, "WIDTH", Order.NONE);
    const w = wVal || (block.getFieldValue("WIDTH") ?? "20").toString().trim();
    const hVal = pythonGenerator.valueToCode(block, "HEIGHT", Order.NONE);
    const h = hVal || (block.getFieldValue("HEIGHT") ?? "20").toString().trim();
    const mode = getModeParam(block.getFieldValue("MODE"));
    return `Rectangle(${w}, ${h}${mode})\n`;
  };

  pythonGenerator.forBlock["b3d_sketch_circle"] = function (block: Blockly.Block) {
    const rVal = pythonGenerator.valueToCode(block, "RADIUS", Order.NONE);
    const r = rVal || (block.getFieldValue("RADIUS") ?? "10").toString().trim();
    const mode = getModeParam(block.getFieldValue("MODE"));
    return `Circle(radius=${r}${mode})\n`;
  };

  pythonGenerator.forBlock["b3d_sketch_regular_polygon"] = function (block: Blockly.Block) {
    const r = (block.getFieldValue("RADIUS") ?? "10").toString().trim();
    const sides = (block.getFieldValue("SIDES") ?? "6").toString().trim();
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
    if (close) {
      return `Polyline(${pts}, close=True)\n`;
    }
    return `Polyline(${pts})\n`;
  };

  pythonGenerator.forBlock["b3d_sketch_slot"] = function (block: Blockly.Block) {
    const l = (block.getFieldValue("LENGTH") ?? "30").toString().trim();
    const w = (block.getFieldValue("WIDTH") ?? "10").toString().trim();
    const rot = (block.getFieldValue("ROTATION") ?? "0").toString().trim();
    const mode = getModeParam(block.getFieldValue("MODE"));
    return `Slot2D(length=${l}, width=${w}, rotation=${rot}${mode})\n`;
  };

  pythonGenerator.forBlock["b3d_sketch_ellipse"] = function (block: Blockly.Block) {
    const xr = (block.getFieldValue("X_RADIUS") ?? "20").toString().trim();
    const yr = (block.getFieldValue("Y_RADIUS") ?? "10").toString().trim();
    const mode = getModeParam(block.getFieldValue("MODE"));
    return `Ellipse(x_radius=${xr}, y_radius=${yr}${mode})\n`;
  };

  pythonGenerator.forBlock["b3d_sketch_text"] = function (block: Blockly.Block) {
    const text = block.getFieldValue("TEXT") || "BUILD123D";
    const size = (block.getFieldValue("FONT_SIZE") ?? "12").toString().trim();
    const mode = getModeParam(block.getFieldValue("MODE"));
    return `Text("${text}", font_size=${size}${mode})\n`;
  };

  // ==================== 5. 3D 特征操作 3D Operations ====================

  pythonGenerator.forBlock["b3d_extrude"] = function (block: Blockly.Block) {
    const amountVal = pythonGenerator.valueToCode(block, "AMOUNT", Order.NONE);
    const amount = amountVal || (block.getFieldValue("AMOUNT") ?? "10").toString().trim();
    const mode = getModeParam(block.getFieldValue("MODE"));
    return `extrude(amount=${amount}${mode})\n`;
  };

  pythonGenerator.forBlock["b3d_revolve"] = function (block: Blockly.Block) {
    const angleVal = pythonGenerator.valueToCode(block, "ANGLE", Order.NONE);
    const angle = angleVal || (block.getFieldValue("ANGLE") ?? "360").toString().trim();
    const axis = block.getFieldValue("AXIS") || "Axis.Z";
    const mode = getModeParam(block.getFieldValue("MODE"));
    return `revolve(axis=${axis}, revolution_arc=${angle}${mode})\n`;
  };

  pythonGenerator.forBlock["b3d_loft"] = function (block: Blockly.Block) {
    const mode = getModeParam(block.getFieldValue("MODE"));
    return `loft(${mode ? mode.slice(2) : ""})\n`;
  };

  pythonGenerator.forBlock["b3d_fillet"] = function (block: Blockly.Block) {
    const r = (block.getFieldValue("RADIUS") ?? "2").toString().trim();
    let target = (block.getFieldValue("TARGET") ?? "part.edges()").toString().trim();
    if (target === "ALL") target = "part.edges()";
    else if (target === "PARALLEL_Z") target = "part.edges().filter_by(Axis.Z)";
    else if (target === "TOP") target = "part.faces().sort_by(Axis.Z)[-1].edges()";
    if (target) {
      return `fillet(${target}, radius=${r})\n`;
    }
    return `fillet(radius=${r})\n`;
  };

  pythonGenerator.forBlock["b3d_chamfer"] = function (block: Blockly.Block) {
    const l = (block.getFieldValue("LENGTH") ?? "1").toString().trim();
    let target = (block.getFieldValue("TARGET") ?? "part.edges()").toString().trim();
    if (target === "ALL") target = "part.edges()";
    else if (target === "PARALLEL_Z") target = "part.edges().filter_by(Axis.Z)";
    else if (target === "TOP") target = "part.faces().sort_by(Axis.Z)[-1].edges()";
    if (target) {
      return `chamfer(${target}, length=${l})\n`;
    }
    return `chamfer(length=${l})\n`;
  };

  pythonGenerator.forBlock["b3d_hole"] = function (block: Blockly.Block) {
    const r = (block.getFieldValue("RADIUS") ?? "3").toString().trim();
    const depth = (block.getFieldValue("DEPTH") ?? "").toString().trim();
    if (depth && depth !== "None" && depth !== "null") {
      return `Hole(radius=${r}, depth=${depth})\n`;
    }
    return `Hole(radius=${r})\n`;
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

  pythonGenerator.forBlock["b3d_mirror"] = function (block: Blockly.Block) {
    const target = (block.getFieldValue("TARGET") || "").trim();
    const about = block.getFieldValue("ABOUT") || "Plane.YZ";
    if (target) {
      return `mirror(${target}, about=${about})\n`;
    }
    return `mirror(about=${about})\n`;
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
    const dist = pythonGenerator.valueToCode(block, "DISTANCE", Order.NONE) || block.getFieldValue("DISTANCE") || 10;
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
    const w = pythonGenerator.valueToCode(block, "WIDTH", Order.NONE) || block.getFieldValue("WIDTH") || 20;
    const h = pythonGenerator.valueToCode(block, "HEIGHT", Order.NONE) || block.getFieldValue("HEIGHT") || 20;
    return `    with BuildSketch() as sk:\n        Rectangle(${w}, ${h})\n`;
  };

  pythonGenerator.forBlock["cq_sketch_circle"] = function (block: Blockly.Block) {
    const r = pythonGenerator.valueToCode(block, "RADIUS", Order.NONE) || block.getFieldValue("RADIUS") || 10;
    return `    with BuildSketch() as sk:\n        Circle(radius=${r})\n`;
  };

  pythonGenerator.forBlock["cq_sketch_polygon"] = function (block: Blockly.Block) {
    const n = block.getFieldValue("SIDES") ?? 6;
    const d = block.getFieldValue("DIAMETER") ?? 20;
    return `    with BuildSketch() as sk:\n        RegularPolygon(radius=${d / 2}, side_count=${n})\n`;
  };

  pythonGenerator.forBlock["cq_sketch_polyline"] = function (block: Blockly.Block) {
    const pts = block.getFieldValue("POINTS") || "[(0,0), (20,0), (20,15), (0,15)]";
    return `    with BuildSketch() as sk:\n        Polygon(${pts})\n`;
  };

  pythonGenerator.forBlock["cq_sketch_slot"] = function (block: Blockly.Block) {
    const length = block.getFieldValue("LENGTH") ?? 30;
    const diameter = block.getFieldValue("DIAMETER") ?? 10;
    const angle = block.getFieldValue("ANGLE") ?? 0;
    return `    with BuildSketch() as sk:\n        Slot2D(length=${length}, width=${diameter}, rotation=${angle})\n`;
  };

  // ================= 3D 空间海龟绘图 (LogoUp 3D Turtle) =================

  pythonGenerator.forBlock["b3d_turtle3d_container"] = function (block: Blockly.Block) {
    const varName = block.getFieldValue("VAR_NAME") || "t";
    const radius = block.getFieldValue("RADIUS") ?? 1.0;
    const color = block.getFieldValue("COLOR") || "#10b981";
    const branchCode = pythonGenerator.statementToCode(block, "DO") || "    pass\n";
    return `with Turtle3D(radius=${radius}, color="${color}") as ${varName}:\n${branchCode}\n`;
  };

  pythonGenerator.forBlock["b3d_turtle3d_forward"] = function (block: Blockly.Block) {
    const varName = block.getFieldValue("VAR_NAME") || "t";
    const dir = block.getFieldValue("DIR") || "FORWARD";
    const dist = block.getFieldValue("DISTANCE") ?? 20;
    if (dir === "BACKWARD") {
      return `${varName}.backward(${dist})\n`;
    }
    return `${varName}.forward(${dist})\n`;
  };

  pythonGenerator.forBlock["b3d_turtle3d_turn"] = function (block: Blockly.Block) {
    const varName = block.getFieldValue("VAR_NAME") || "t";
    const dir = block.getFieldValue("DIR") || "LEFT";
    const ang = block.getFieldValue("ANGLE") ?? 90;
    if (dir === "RIGHT") {
      return `${varName}.turn_right(${ang})\n`;
    }
    return `${varName}.turn_left(${ang})\n`;
  };

  pythonGenerator.forBlock["b3d_turtle3d_pitch"] = function (block: Blockly.Block) {
    const varName = block.getFieldValue("VAR_NAME") || "t";
    const dir = block.getFieldValue("DIR") || "UP";
    const ang = block.getFieldValue("ANGLE") ?? 45;
    if (dir === "DOWN") {
      return `${varName}.pitch_down(${ang})\n`;
    }
    return `${varName}.pitch_up(${ang})\n`;
  };

  pythonGenerator.forBlock["b3d_turtle3d_roll"] = function (block: Blockly.Block) {
    const varName = block.getFieldValue("VAR_NAME") || "t";
    const dir = block.getFieldValue("DIR") || "LEFT";
    const ang = block.getFieldValue("ANGLE") ?? 45;
    if (dir === "RIGHT") {
      return `${varName}.roll_right(${ang})\n`;
    }
    return `${varName}.roll_left(${ang})\n`;
  };

  pythonGenerator.forBlock["b3d_turtle3d_arc"] = function (block: Blockly.Block) {
    const varName = block.getFieldValue("VAR_NAME") || "t";
    const dir = block.getFieldValue("DIR") || "LEFT";
    const rad = block.getFieldValue("RADIUS") ?? 15;
    const ang = block.getFieldValue("ANGLE") ?? 90;
    const fnMap: Record<string, string> = {
      LEFT: "arc_left",
      RIGHT: "arc_right",
      UP: "arc_up",
      DOWN: "arc_down",
    };
    const fn = fnMap[dir] || "arc_left";
    return `${varName}.${fn}(${rad}, ${ang})\n`;
  };

  pythonGenerator.forBlock["b3d_turtle3d_pen"] = function (block: Blockly.Block) {
    const varName = block.getFieldValue("VAR_NAME") || "t";
    const state = block.getFieldValue("STATE") || "DOWN";
    return state === "UP" ? `${varName}.pen_up()\n` : `${varName}.pen_down()\n`;
  };

  pythonGenerator.forBlock["b3d_turtle3d_set_radius"] = function (block: Blockly.Block) {
    const varName = block.getFieldValue("VAR_NAME") || "t";
    const rad = block.getFieldValue("RADIUS") ?? 1.5;
    return `${varName}.set_radius(${rad})\n`;
  };

  pythonGenerator.forBlock["b3d_turtle3d_branch"] = function (block: Blockly.Block) {
    const varName = block.getFieldValue("VAR_NAME") || "t";
    const branchCode = pythonGenerator.statementToCode(block, "BRANCH") || "";
    return `${varName}.push()\n${branchCode}${varName}.pop()\n`;
  };

  pythonGenerator.forBlock["b3d_turtle3d_home"] = function (block: Blockly.Block) {
    const varName = block.getFieldValue("VAR_NAME") || "t";
    return `${varName}.home()\n`;
  };
}

import { registerLogoUp3DGenerator } from "./logoup3d";
import type { WorkingMode } from "../toolbox";

/**
 * 将 Blockly 工作区完整转换为 build123d 或 LogoUp 3D Python 源码
 * 严格根据 mode ('build123d' | 'logoup') 隔离导入头与注释，防止模式串扰
 */
export function workspaceToBuild123d(
  workspace: Blockly.Workspace,
  mode: WorkingMode = "build123d"
): string {
  registerBuild123dGenerator();
  registerLogoUp3DGenerator();

  const allBlocks = workspace.getAllBlocks(false).filter((b) => !b.isShadow());
  if (allBlocks.length === 0) {
    return "";
  }

  pythonGenerator.init(workspace);

  if (mode === "logoup") {
    const topBlocks = workspace.getTopBlocks(true);
    const codeSegments: string[] = [];

    // 1. 提取顶层自定义函数定义积木 (logoup_def_func)
    for (const topBlock of topBlocks) {
      if (!topBlock.isEnabled()) continue;
      if (topBlock.type === "logoup_def_func") {
        const blockCode = pythonGenerator.blockToCode(topBlock);
        const codeStr = Array.isArray(blockCode) ? blockCode[0] : (blockCode as string);
        if (codeStr && codeStr.trim()) {
          codeSegments.push(codeStr.trim());
        }
      }
    }

    // 2. 提取「开始」(logoup_start) 积木下挂载的主程序积木链
    const startBlocks = topBlocks.filter((b) => b.type === "logoup_start");
    for (const startBlock of startBlocks) {
      if (!startBlock.isEnabled()) continue;
      const nextBlock = startBlock.getNextBlock();
      if (!nextBlock || !nextBlock.isEnabled()) continue;

      const blockCode = pythonGenerator.blockToCode(startBlock);
      const codeStr = Array.isArray(blockCode) ? blockCode[0] : (blockCode as string);
      if (codeStr && codeStr.trim()) {
        codeSegments.push(codeStr.trim());
      }
    }

    const cleanCode = codeSegments.join("\n\n").trim();
    if (!cleanCode || cleanCode === "# 🏁 开始 LogoUp 3D 造型") {
      return "";
    }

    let fullCode = "";
    if (!cleanCode.includes("from build123d import *") && !cleanCode.includes("import build123d")) {
      fullCode += "from build123d import *\n";
    }
    if (!cleanCode.includes("from backend.logoup3d import *") && !cleanCode.includes("import logoup3d")) {
      fullCode += "from backend.logoup3d import *\n\n";
    }
    fullCode += cleanCode;
    return fullCode.trim() + "\n";
  }

  // ==================== build123d 模式 ====================
  // 排除纯空的 logoup_start 积木
  const meaningfulBlocks = allBlocks.filter(
    (b) => b.isEnabled() && b.type !== "logoup_start"
  );
  if (meaningfulBlocks.length === 0) {
    return "";
  }

  let rawCode = pythonGenerator.workspaceToCode(workspace);
  // 严格移除 LogoUp 3D 专属开始标记注释与头部，杜绝 build123d 模式混入 LogoUp 注释
  rawCode = rawCode
    .replace(/^#\s*🏁\s*开始\s*LogoUp\s*3D\s*造型\s*\n?/gm, "")
    .replace(/^from\s+backend\.logoup3d\s+import\s+\*\s*\n?/gm, "")
    .trim();

  if (!rawCode) {
    return "";
  }

  let fullCode = "";
  if (!rawCode.includes("from build123d import *") && !rawCode.includes("import build123d")) {
    fullCode += "from build123d import *\n\n";
  }
  fullCode += rawCode;
  return fullCode.trim() + "\n";
}
