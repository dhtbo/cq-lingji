import { pythonGenerator, Order } from "blockly/python";

/**
 * 注册 LogoUp 3D 图形化积木的 Python 代码生成器
 */
export function registerLogoUp3DGenerator() {
  function getVal(block: any, name: string, defaultVal: string = "0"): string {
    const code = pythonGenerator.valueToCode(block, name, Order.NONE);
    if (code && code.trim() !== "") {
      return code;
    }
    const f = block.getFieldValue(name);
    if (f !== null && f !== undefined && f !== "") {
      return String(f);
    }
    return defaultVal;
  }

  // ==========================================
  // 控制流程
  // ==========================================
  pythonGenerator.forBlock["logoup_start"] = function () {
    return "# 🏁 开始 LogoUp 3D 造型\n";
  };

  pythonGenerator.forBlock["logoup_push"] = function () {
    return "push()\n";
  };

  pythonGenerator.forBlock["logoup_pop"] = function () {
    return "pop()\n";
  };

  pythonGenerator.forBlock["logoup_repeat"] = function (block) {
    const times = pythonGenerator.valueToCode(block, "TIMES", Order.NONE) || "4";
    const branch = pythonGenerator.statementToCode(block, "DO") || "    pass\n";
    return `for _ in range(${times}):\n${branch}`;
  };

  pythonGenerator.forBlock["logoup_if"] = function (block) {
    const condition = pythonGenerator.valueToCode(block, "CONDITION", Order.NONE) || "True";
    const branch = pythonGenerator.statementToCode(block, "DO") || "    pass\n";
    return `if ${condition}:\n${branch}`;
  };

  pythonGenerator.forBlock["logoup_if_else"] = function (block) {
    const condition = pythonGenerator.valueToCode(block, "CONDITION", Order.NONE) || "True";
    const branch = pythonGenerator.statementToCode(block, "DO") || "    pass\n";
    const elseBranch = pythonGenerator.statementToCode(block, "ELSE") || "    pass\n";
    return `if ${condition}:\n${branch}else:\n${elseBranch}`;
  };

  pythonGenerator.forBlock["logoup_def_func"] = function (block) {
    const name = block.getFieldValue("NAME") || "my_func";
    const params = block.getFieldValue("PARAMS") || "";
    const branch = pythonGenerator.statementToCode(block, "DO") || "    pass\n";
    return `def ${name}(${params}):\n${branch}\n`;
  };

  pythonGenerator.forBlock["logoup_call_func_stmt"] = function (block) {
    const name = block.getFieldValue("NAME") || "my_func";
    const args = block.getFieldValue("ARGS") || "";
    return `${name}(${args})\n`;
  };

  pythonGenerator.forBlock["logoup_call_func_expr"] = function (block) {
    const name = block.getFieldValue("NAME") || "my_func";
    const args = block.getFieldValue("ARGS") || "";
    return [`${name}(${args})`, Order.FUNCTION_CALL];
  };

  pythonGenerator.forBlock["logoup_def_var"] = function (block) {
    const varName = block.getFieldValue("VAR") || "x";
    const val = pythonGenerator.valueToCode(block, "VALUE", Order.NONE) || "0";
    return `${varName} = ${val}\n`;
  };

  pythonGenerator.forBlock["logoup_set_var"] = function (block) {
    const varName = block.getFieldValue("VAR") || "x";
    const val = pythonGenerator.valueToCode(block, "VALUE", Order.NONE) || "0";
    return `${varName} = ${val}\n`;
  };

  pythonGenerator.forBlock["logoup_call_var"] = function (block) {
    const varName = block.getFieldValue("VAR") || "x";
    return [varName, Order.ATOMIC];
  };

  pythonGenerator.forBlock["logoup_get_var"] = function (block) {
    const varName = block.getFieldValue("VAR") || "x";
    return [varName, Order.ATOMIC];
  };

  pythonGenerator.forBlock["logoup_var"] = function (block) {
    const varName = block.getFieldValue("VAR") || "x";
    return [varName, Order.ATOMIC];
  };

  pythonGenerator.forBlock["logoup_return_val"] = function (block) {
    const val = pythonGenerator.valueToCode(block, "VALUE", Order.NONE) || "None";
    return `return ${val}\n`;
  };

  pythonGenerator.forBlock["logoup_return"] = function () {
    return "return\n";
  };

  pythonGenerator.forBlock["logoup_bool_var"] = function (block) {
    const varName = block.getFieldValue("VAR") || "flag";
    return [varName, Order.ATOMIC];
  };

  pythonGenerator.forBlock["logoup_true"] = function () {
    return ["True", Order.ATOMIC];
  };

  pythonGenerator.forBlock["logoup_false"] = function () {
    return ["False", Order.ATOMIC];
  };

  // ==========================================
  // 数学运算
  // ==========================================
  pythonGenerator.forBlock["logoup_add"] = function (block) {
    const a = pythonGenerator.valueToCode(block, "A", Order.ADDITIVE) || "0";
    const b = pythonGenerator.valueToCode(block, "B", Order.ADDITIVE) || "0";
    return [`${a} + ${b}`, Order.ADDITIVE];
  };

  pythonGenerator.forBlock["logoup_sub"] = function (block) {
    const a = pythonGenerator.valueToCode(block, "A", Order.ADDITIVE) || "0";
    const b = pythonGenerator.valueToCode(block, "B", Order.ADDITIVE) || "0";
    return [`${a} - ${b}`, Order.ADDITIVE];
  };

  pythonGenerator.forBlock["logoup_mul"] = function (block) {
    const a = pythonGenerator.valueToCode(block, "A", Order.MULTIPLICATIVE) || "1";
    const b = pythonGenerator.valueToCode(block, "B", Order.MULTIPLICATIVE) || "1";
    return [`${a} * ${b}`, Order.MULTIPLICATIVE];
  };

  pythonGenerator.forBlock["logoup_div"] = function (block) {
    const a = pythonGenerator.valueToCode(block, "A", Order.MULTIPLICATIVE) || "1";
    const b = pythonGenerator.valueToCode(block, "B", Order.MULTIPLICATIVE) || "1";
    return [`${a} / ${b}`, Order.MULTIPLICATIVE];
  };

  pythonGenerator.forBlock["logoup_mod"] = function (block) {
    const a = pythonGenerator.valueToCode(block, "A", Order.MULTIPLICATIVE) || "0";
    const b = pythonGenerator.valueToCode(block, "B", Order.MULTIPLICATIVE) || "1";
    return [`${a} % ${b}`, Order.MULTIPLICATIVE];
  };

  pythonGenerator.forBlock["logoup_lt"] = function (block) {
    const a = pythonGenerator.valueToCode(block, "A", Order.RELATIONAL) || "0";
    const b = pythonGenerator.valueToCode(block, "B", Order.RELATIONAL) || "0";
    return [`${a} < ${b}`, Order.RELATIONAL];
  };

  pythonGenerator.forBlock["logoup_lte"] = function (block) {
    const a = pythonGenerator.valueToCode(block, "A", Order.RELATIONAL) || "0";
    const b = pythonGenerator.valueToCode(block, "B", Order.RELATIONAL) || "0";
    return [`${a} <= ${b}`, Order.RELATIONAL];
  };

  pythonGenerator.forBlock["logoup_eq"] = function (block) {
    const a = pythonGenerator.valueToCode(block, "A", Order.RELATIONAL) || "0";
    const b = pythonGenerator.valueToCode(block, "B", Order.RELATIONAL) || "0";
    return [`${a} == ${b}`, Order.RELATIONAL];
  };

  pythonGenerator.forBlock["logoup_neq"] = function (block) {
    const a = pythonGenerator.valueToCode(block, "A", Order.RELATIONAL) || "0";
    const b = pythonGenerator.valueToCode(block, "B", Order.RELATIONAL) || "0";
    return [`${a} != ${b}`, Order.RELATIONAL];
  };

  pythonGenerator.forBlock["logoup_gte"] = function (block) {
    const a = pythonGenerator.valueToCode(block, "A", Order.RELATIONAL) || "0";
    const b = pythonGenerator.valueToCode(block, "B", Order.RELATIONAL) || "0";
    return [`${a} >= ${b}`, Order.RELATIONAL];
  };

  pythonGenerator.forBlock["logoup_gt"] = function (block) {
    const a = pythonGenerator.valueToCode(block, "A", Order.RELATIONAL) || "0";
    const b = pythonGenerator.valueToCode(block, "B", Order.RELATIONAL) || "0";
    return [`${a} > ${b}`, Order.RELATIONAL];
  };

  pythonGenerator.forBlock["logoup_and"] = function (block) {
    const a = pythonGenerator.valueToCode(block, "A", Order.LOGICAL_AND) || "True";
    const b = pythonGenerator.valueToCode(block, "B", Order.LOGICAL_AND) || "True";
    return [`${a} and ${b}`, Order.LOGICAL_AND];
  };

  pythonGenerator.forBlock["logoup_or"] = function (block) {
    const a = pythonGenerator.valueToCode(block, "A", Order.LOGICAL_OR) || "False";
    const b = pythonGenerator.valueToCode(block, "B", Order.LOGICAL_OR) || "False";
    return [`${a} or ${b}`, Order.LOGICAL_OR];
  };

  pythonGenerator.forBlock["logoup_not"] = function (block) {
    const bool = pythonGenerator.valueToCode(block, "BOOL", Order.LOGICAL_NOT) || "False";
    return [`not ${bool}`, Order.LOGICAL_NOT];
  };

  // ==========================================
  // 平面绘图
  // ==========================================
  pythonGenerator.forBlock["logoup_go"] = function (block) {
    const dist = getVal(block, "DISTANCE", "10");
    return `go(${dist})\n`;
  };

  pythonGenerator.forBlock["logoup_turn"] = function (block) {
    const angle = getVal(block, "ANGLE", "15");
    return `turn(${angle})\n`;
  };

  pythonGenerator.forBlock["logoup_turn_left"] = function (block) {
    const angle = getVal(block, "ANGLE", "15");
    return `turn_left(${angle})\n`;
  };

  pythonGenerator.forBlock["logoup_draw"] = function () {
    return "draw()\n";
  };

  pythonGenerator.forBlock["logoup_done"] = function () {
    return "done()\n";
  };

  pythonGenerator.forBlock["logoup_fill"] = function () {
    return "fill()\n";
  };

  pythonGenerator.forBlock["logoup_width"] = function (block) {
    const w = getVal(block, "WIDTH", "1");
    return `width(${w})\n`;
  };

  pythonGenerator.forBlock["logoup_clear"] = function () {
    return "clear()\n";
  };

  pythonGenerator.forBlock["logoup_home"] = function () {
    return "home()\n";
  };

  pythonGenerator.forBlock["logoup_erase"] = function (block) {
    const mode = block.getFieldValue("MODE");
    return `erase(${mode === "ENABLE" ? "True" : "False"})\n`;
  };

  // ==========================================
  // 平面进阶
  // ==========================================
  pythonGenerator.forBlock["logoup_close"] = function () {
    return "close()\n";
  };

  pythonGenerator.forBlock["logoup_offset"] = function (block) {
    const amount = block.getFieldValue("AMOUNT");
    return `offset_path(${amount})\n`;
  };

  pythonGenerator.forBlock["logoup_goto"] = function (block) {
    const x = block.getFieldValue("X");
    const y = block.getFieldValue("Y");
    return `goto(${x}, ${y})\n`;
  };

  pythonGenerator.forBlock["logoup_turnto"] = function (block) {
    const angle = block.getFieldValue("ANGLE");
    return `turnto(${angle})\n`;
  };

  pythonGenerator.forBlock["logoup_setx"] = function (block) {
    const x = block.getFieldValue("X");
    return `setx(${x})\n`;
  };

  pythonGenerator.forBlock["logoup_sety"] = function (block) {
    const y = block.getFieldValue("Y");
    return `sety(${y})\n`;
  };

  pythonGenerator.forBlock["logoup_getx"] = function () {
    return ["getx()", Order.ATOMIC];
  };

  pythonGenerator.forBlock["logoup_gety"] = function () {
    return ["gety()", Order.ATOMIC];
  };

  pythonGenerator.forBlock["logoup_geth"] = function () {
    return ["geth()", Order.ATOMIC];
  };

  pythonGenerator.forBlock["logoup_flood"] = function () {
    return "fill()\n";
  };

  pythonGenerator.forBlock["logoup_clearsketch"] = function () {
    return "clear_sketch()\n";
  };

  pythonGenerator.forBlock["logoup_txtstamp"] = function (block) {
    const text = block.getFieldValue("TEXT") || "LogoUp";
    return `txtstamp("${text}")\n`;
  };

  pythonGenerator.forBlock["logoup_txtstampex"] = function (block) {
    const text = block.getFieldValue("TEXT") || "LogoUp";
    const size = block.getFieldValue("SIZE");
    return `txtstamp("${text}", size=${size})\n`;
  };

  pythonGenerator.forBlock["logoup_imgload"] = function () {
    return "# 加载图片参考\n";
  };

  pythonGenerator.forBlock["logoup_imgscale"] = function () {
    return "# 缩放图片参考\n";
  };

  pythonGenerator.forBlock["logoup_imgstamp"] = function () {
    return "# 图片采样\n";
  };

  pythonGenerator.forBlock["logoup_imgunload"] = function () {
    return "# 卸载图片\n";
  };

  // ==========================================
  // 平面构件
  // ==========================================
  pythonGenerator.forBlock["logoup_polygon"] = function (block) {
    const sides = getVal(block, "SIDES", "6");
    const radius = getVal(block, "RADIUS", "10");
    return `polygon(${sides}, ${radius})\n`;
  };

  pythonGenerator.forBlock["logoup_circle"] = function (block) {
    const radius = getVal(block, "RADIUS", "10");
    return `circle(${radius})\n`;
  };

  pythonGenerator.forBlock["logoup_arc"] = function (block) {
    const radius = getVal(block, "RADIUS", "10");
    const angle = getVal(block, "ANGLE", "60");
    return `circle(${radius})  # 弧线 ${angle}°\n`;
  };

  pythonGenerator.forBlock["logoup_line_len"] = function (block) {
    const len = getVal(block, "LENGTH", "10");
    return `go(${len})\n`;
  };

  pythonGenerator.forBlock["logoup_arc_to"] = function (block) {
    const x = getVal(block, "X", "10");
    const y = getVal(block, "Y", "15");
    return `goto(${x}, ${y})\n`;
  };

  pythonGenerator.forBlock["logoup_line_to"] = function (block) {
    const x = getVal(block, "X", "10");
    const y = getVal(block, "Y", "20");
    return `goto(${x}, ${y})\n`;
  };

  pythonGenerator.forBlock["logoup_star"] = function (block) {
    const points = getVal(block, "POINTS", "4");
    const radius = getVal(block, "RADIUS", "10");
    return `star(${points}, ${radius})\n`;
  };

  pythonGenerator.forBlock["logoup_five_star"] = function (block) {
    const radius = getVal(block, "RADIUS", "10");
    return `five_star(${radius})\n`;
  };

  pythonGenerator.forBlock["logoup_six_star"] = function (block) {
    const radius = getVal(block, "RADIUS", "10");
    return `six_star(${radius})\n`;
  };

  pythonGenerator.forBlock["logoup_four_star"] = function (block) {
    const radius = getVal(block, "RADIUS", "10");
    return `four_star(${radius})\n`;
  };

  pythonGenerator.forBlock["logoup_ellipse"] = function (block) {
    const a = getVal(block, "A", "12");
    const b = getVal(block, "B", "9");
    return `ellipse(${a}, ${b})\n`;
  };

  pythonGenerator.forBlock["logoup_egg"] = function (block) {
    const rx = getVal(block, "RX", "12");
    const ry = getVal(block, "RY", "18");
    return `egg(${rx}, ${ry})\n`;
  };

  pythonGenerator.forBlock["logoup_rect"] = function (block) {
    const l = getVal(block, "LENGTH", "15");
    const w = getVal(block, "WIDTH", "10");
    return `rect(${l}, ${w})\n`;
  };

  pythonGenerator.forBlock["logoup_square"] = function (block) {
    const s = getVal(block, "SIZE", "10");
    return `square(${s})\n`;
  };

  pythonGenerator.forBlock["logoup_rounded_rect"] = function (block) {
    const l = getVal(block, "LENGTH", "15");
    const w = getVal(block, "WIDTH", "10");
    const r = getVal(block, "RADIUS", "2");
    return `rounded_rect(${l}, ${w}, ${r})\n`;
  };

  pythonGenerator.forBlock["logoup_rounded_square"] = function (block) {
    const s = getVal(block, "SIZE", "10");
    const r = getVal(block, "RADIUS", "2");
    return `rounded_square(${s}, ${r})\n`;
  };

  pythonGenerator.forBlock["logoup_spirograph"] = function (block) {
    const R = getVal(block, "R", "15");
    const r = getVal(block, "r", "10");
    const d = getVal(block, "d", "10");
    const ang = getVal(block, "ANGLE", "1080");
    return `spirograph(${R}, ${r}, ${d}, ${ang})\n`;
  };

  // ==========================================
  // 三维绘图
  // ==========================================
  pythonGenerator.forBlock["logoup_up"] = function (block) {
    const dist = getVal(block, "DISTANCE", "10");
    return `up(${dist})\n`;
  };

  pythonGenerator.forBlock["logoup_body"] = function () {
    return "body()\n";
  };

  pythonGenerator.forBlock["logoup_done_3d"] = function () {
    return "done()\n";
  };

  pythonGenerator.forBlock["logoup_reset"] = function () {
    return "reset()\n";
  };

  pythonGenerator.forBlock["logoup_color"] = function (block) {
    const c = block.getFieldValue("COLOR");
    return `color("${c}")\n`;
  };

  pythonGenerator.forBlock["logoup_scale"] = function (block) {
    const f = getVal(block, "FACTOR", "1.5");
    return `scale(${f})\n`;
  };

  pythonGenerator.forBlock["logoup_yaw"] = function (block) {
    const angle = getVal(block, "ANGLE", "15");
    return `yaw(${angle})\n`;
  };

  pythonGenerator.forBlock["logoup_pitch"] = function (block) {
    const angle = getVal(block, "ANGLE", "15");
    return `pitch(${angle})\n`;
  };

  pythonGenerator.forBlock["logoup_roll"] = function (block) {
    const angle = getVal(block, "ANGLE", "15");
    return `roll(${angle})\n`;
  };

  pythonGenerator.forBlock["logoup_jump"] = function (block) {
    const dist = getVal(block, "DISTANCE", "10");
    return `jump(${dist})\n`;
  };

  pythonGenerator.forBlock["logoup_link"] = function () {
    return "link()\n";
  };

  pythonGenerator.forBlock["logoup_move"] = function (block) {
    const dx = getVal(block, "DX", "10");
    const dy = getVal(block, "DY", "10");
    const dz = getVal(block, "DZ", "10");
    return `move(${dx}, ${dy}, ${dz})\n`;
  };

  pythonGenerator.forBlock["logoup_shift"] = function (block) {
    const dx = getVal(block, "DX", "10");
    const dy = getVal(block, "DY", "10");
    return `shift(${dx}, ${dy})\n`;
  };

  pythonGenerator.forBlock["logoup_subtract"] = function (block) {
    const mode = block.getFieldValue("MODE");
    return `subtract(${mode === "ENABLE" ? "True" : "False"})\n`;
  };

  // ==========================================
  // 三维进阶
  // ==========================================
  pythonGenerator.forBlock["logoup_moveto"] = function (block) {
    const x = getVal(block, "X", "10");
    const y = getVal(block, "Y", "10");
    const z = getVal(block, "Z", "10");
    return `moveto(${x}, ${y}, ${z})\n`;
  };

  pythonGenerator.forBlock["logoup_movexto"] = function (block) {
    const x = getVal(block, "X", "10");
    return `setx(${x})\n`;
  };

  pythonGenerator.forBlock["logoup_moveyto"] = function (block) {
    const y = getVal(block, "Y", "10");
    return `sety(${y})\n`;
  };

  pythonGenerator.forBlock["logoup_movezto"] = function (block) {
    const z = getVal(block, "Z", "10");
    return `moveto(getx(), gety(), ${z})\n`;
  };

  pythonGenerator.forBlock["logoup_yawto"] = function (block) {
    const angle = getVal(block, "ANGLE", "15");
    return `turnto(${angle})\n`;
  };

  pythonGenerator.forBlock["logoup_pitchto"] = function (block) {
    const angle = getVal(block, "ANGLE", "15");
    return `pitch(${angle})\n`;
  };

  pythonGenerator.forBlock["logoup_rollto"] = function (block) {
    const angle = getVal(block, "ANGLE", "15");
    return `roll(${angle})\n`;
  };

  pythonGenerator.forBlock["logoup_scalex"] = function (block) {
    const f = getVal(block, "FACTOR", "1.5");
    return `scale(${f})\n`;
  };

  pythonGenerator.forBlock["logoup_scaley"] = function (block) {
    const f = getVal(block, "FACTOR", "1.5");
    return `scale(${f})\n`;
  };

  pythonGenerator.forBlock["logoup_normal"] = function (block) {
    const dx = getVal(block, "DX", "15");
    const dy = getVal(block, "DY", "15");
    return `pitch(${dy}); yaw(${dx})\n`;
  };

  pythonGenerator.forBlock["logoup_normalto"] = function (block) {
    const nx = getVal(block, "NX", "15");
    const ny = getVal(block, "NY", "15");
    return `pitch(${ny}); yaw(${nx})\n`;
  };

  pythonGenerator.forBlock["logoup_rotatex"] = function (block) {
    const angle = getVal(block, "ANGLE", "10");
    return `rotatex(${angle})\n`;
  };

  pythonGenerator.forBlock["logoup_rotatey"] = function (block) {
    const angle = getVal(block, "ANGLE", "10");
    return `rotatey(${angle})\n`;
  };

  pythonGenerator.forBlock["logoup_rotatez"] = function (block) {
    const angle = getVal(block, "ANGLE", "10");
    return `rotatez(${angle})\n`;
  };

  pythonGenerator.forBlock["logoup_warpx"] = function (block) {
    const angle = getVal(block, "ANGLE", "50");
    return `shift(${angle}, 0)\n`;
  };

  pythonGenerator.forBlock["logoup_warpy"] = function (block) {
    const angle = getVal(block, "ANGLE", "50");
    return `shift(0, ${angle})\n`;
  };

  pythonGenerator.forBlock["logoup_extrude"] = function (block) {
    const h = getVal(block, "HEIGHT", "10");
    return `extrude(${h})\n`;
  };

  pythonGenerator.forBlock["logoup_cextrude"] = function (block) {
    const h = getVal(block, "HEIGHT", "10");
    return `cextrude(${h})\n`;
  };

  pythonGenerator.forBlock["logoup_pyramid"] = function (block) {
    const h = getVal(block, "HEIGHT", "10");
    return `pyramid(${h})\n`;
  };

  pythonGenerator.forBlock["logoup_cave"] = function (block) {
    const d = getVal(block, "DEPTH", "10");
    return `cave(${d})\n`;
  };

  // ==========================================
  // 三维构件
  // ==========================================
  pythonGenerator.forBlock["logoup_box"] = function (block) {
    const l = getVal(block, "LENGTH", "10");
    const w = getVal(block, "WIDTH", "10");
    const h = getVal(block, "HEIGHT", "10");
    return `box(${l}, ${w}, ${h})\n`;
  };

  pythonGenerator.forBlock["logoup_cylinder"] = function (block) {
    const r = getVal(block, "RADIUS", "10");
    const h = getVal(block, "HEIGHT", "15");
    return `cylinder(${r}, ${h})\n`;
  };

  pythonGenerator.forBlock["logoup_sphere"] = function (block) {
    const r = getVal(block, "RADIUS", "10");
    return `sphere(${r})\n`;
  };

  pythonGenerator.forBlock["logoup_pyramid_solid"] = function (block) {
    const sides = getVal(block, "SIDES", "3");
    const r = getVal(block, "RADIUS", "10");
    const h = getVal(block, "HEIGHT", "15");
    return `pyramid_solid(${sides}, ${r}, ${h})\n`;
  };

  pythonGenerator.forBlock["logoup_torus"] = function (block) {
    const r1 = getVal(block, "MAJOR_RADIUS", "10");
    const r2 = getVal(block, "MINOR_RADIUS", "4");
    return `torus(${r1}, ${r2})\n`;
  };

  pythonGenerator.forBlock["logoup_cone"] = function (block) {
    const r = getVal(block, "RADIUS", "10");
    const h = getVal(block, "HEIGHT", "15");
    return `cone(${r}, ${h})\n`;
  };

  pythonGenerator.forBlock["logoup_ellipsoid"] = function (block) {
    const rx = getVal(block, "RX", "15");
    const ry = getVal(block, "RY", "10");
    const rz = getVal(block, "RZ", "10");
    return `ellipsoid(${rx}, ${ry}, ${rz})\n`;
  };
}
