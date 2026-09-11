import { pythonGenerator, Order } from "blockly/python";

let generatorRegistered = false;

/**
 * 注册 LogoUp 3D 图形化积木的 Python 代码生成器
 */
export function registerLogoUp3DGenerator() {
  if (generatorRegistered) return;

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
    const dist = block.getFieldValue("DISTANCE");
    return `go(${dist})\n`;
  };

  pythonGenerator.forBlock["logoup_turn"] = function (block) {
    const angle = block.getFieldValue("ANGLE");
    return `turn(${angle})\n`;
  };

  pythonGenerator.forBlock["logoup_turn_left"] = function (block) {
    const angle = block.getFieldValue("ANGLE");
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
    const w = block.getFieldValue("WIDTH");
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
    const sides = block.getFieldValue("SIDES");
    const radius = block.getFieldValue("RADIUS");
    return `polygon(${sides}, ${radius})\n`;
  };

  pythonGenerator.forBlock["logoup_circle"] = function (block) {
    const radius = block.getFieldValue("RADIUS");
    return `circle(${radius})\n`;
  };

  pythonGenerator.forBlock["logoup_arc"] = function (block) {
    const radius = block.getFieldValue("RADIUS");
    const angle = block.getFieldValue("ANGLE");
    return `circle(${radius})  # 弧线 ${angle}°\n`;
  };

  pythonGenerator.forBlock["logoup_line_len"] = function (block) {
    const len = block.getFieldValue("LENGTH");
    return `go(${len})\n`;
  };

  pythonGenerator.forBlock["logoup_arc_to"] = function (block) {
    const x = block.getFieldValue("X");
    const y = block.getFieldValue("Y");
    return `goto(${x}, ${y})\n`;
  };

  pythonGenerator.forBlock["logoup_line_to"] = function (block) {
    const x = block.getFieldValue("X");
    const y = block.getFieldValue("Y");
    return `goto(${x}, ${y})\n`;
  };

  pythonGenerator.forBlock["logoup_star"] = function (block) {
    const points = block.getFieldValue("POINTS");
    const radius = block.getFieldValue("RADIUS");
    return `star(${points}, ${radius})\n`;
  };

  pythonGenerator.forBlock["logoup_five_star"] = function (block) {
    const radius = block.getFieldValue("RADIUS");
    return `five_star(${radius})\n`;
  };

  pythonGenerator.forBlock["logoup_six_star"] = function (block) {
    const radius = block.getFieldValue("RADIUS");
    return `six_star(${radius})\n`;
  };

  pythonGenerator.forBlock["logoup_four_star"] = function (block) {
    const radius = block.getFieldValue("RADIUS");
    return `four_star(${radius})\n`;
  };

  pythonGenerator.forBlock["logoup_ellipse"] = function (block) {
    const a = block.getFieldValue("A");
    const b = block.getFieldValue("B");
    return `ellipse(${a}, ${b})\n`;
  };

  pythonGenerator.forBlock["logoup_egg"] = function (block) {
    const rx = block.getFieldValue("RX");
    const ry = block.getFieldValue("RY");
    return `egg(${rx}, ${ry})\n`;
  };

  pythonGenerator.forBlock["logoup_rect"] = function (block) {
    const l = block.getFieldValue("LENGTH");
    const w = block.getFieldValue("WIDTH");
    return `rect(${l}, ${w})\n`;
  };

  pythonGenerator.forBlock["logoup_square"] = function (block) {
    const s = block.getFieldValue("SIZE");
    return `square(${s})\n`;
  };

  pythonGenerator.forBlock["logoup_rounded_rect"] = function (block) {
    const l = block.getFieldValue("LENGTH");
    const w = block.getFieldValue("WIDTH");
    const r = block.getFieldValue("RADIUS");
    return `rounded_rect(${l}, ${w}, ${r})\n`;
  };

  pythonGenerator.forBlock["logoup_rounded_square"] = function (block) {
    const s = block.getFieldValue("SIZE");
    const r = block.getFieldValue("RADIUS");
    return `rounded_square(${s}, ${r})\n`;
  };

  pythonGenerator.forBlock["logoup_spirograph"] = function (block) {
    const R = block.getFieldValue("R");
    const r = block.getFieldValue("r");
    const d = block.getFieldValue("d");
    const ang = block.getFieldValue("ANGLE");
    return `spirograph(${R}, ${r}, ${d}, ${ang})\n`;
  };

  // ==========================================
  // 三维绘图
  // ==========================================
  pythonGenerator.forBlock["logoup_up"] = function (block) {
    const dist = block.getFieldValue("DISTANCE");
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
    const f = block.getFieldValue("FACTOR");
    return `scale(${f})\n`;
  };

  pythonGenerator.forBlock["logoup_yaw"] = function (block) {
    const angle = block.getFieldValue("ANGLE");
    return `yaw(${angle})\n`;
  };

  pythonGenerator.forBlock["logoup_pitch"] = function (block) {
    const angle = block.getFieldValue("ANGLE");
    return `pitch(${angle})\n`;
  };

  pythonGenerator.forBlock["logoup_roll"] = function (block) {
    const angle = block.getFieldValue("ANGLE");
    return `roll(${angle})\n`;
  };

  pythonGenerator.forBlock["logoup_jump"] = function (block) {
    const dist = block.getFieldValue("DISTANCE");
    return `jump(${dist})\n`;
  };

  pythonGenerator.forBlock["logoup_link"] = function () {
    return "# 连接形状到当前草图 (LINK)\n";
  };

  pythonGenerator.forBlock["logoup_move"] = function (block) {
    const dx = block.getFieldValue("DX");
    const dy = block.getFieldValue("DY");
    const dz = block.getFieldValue("DZ");
    return `move(${dx}, ${dy}, ${dz})\n`;
  };

  pythonGenerator.forBlock["logoup_shift"] = function (block) {
    const dx = block.getFieldValue("DX");
    const dy = block.getFieldValue("DY");
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
    const x = block.getFieldValue("X");
    const y = block.getFieldValue("Y");
    const z = block.getFieldValue("Z");
    return `moveto(${x}, ${y}, ${z})\n`;
  };

  pythonGenerator.forBlock["logoup_movexto"] = function (block) {
    const x = block.getFieldValue("X");
    return `setx(${x})\n`;
  };

  pythonGenerator.forBlock["logoup_moveyto"] = function (block) {
    const y = block.getFieldValue("Y");
    return `sety(${y})\n`;
  };

  pythonGenerator.forBlock["logoup_movezto"] = function (block) {
    const z = block.getFieldValue("Z");
    return `moveto(getx(), gety(), ${z})\n`;
  };

  pythonGenerator.forBlock["logoup_yawto"] = function (block) {
    const angle = block.getFieldValue("ANGLE");
    return `turnto(${angle})\n`;
  };

  pythonGenerator.forBlock["logoup_pitchto"] = function (block) {
    const angle = block.getFieldValue("ANGLE");
    return `pitch(${angle})\n`;
  };

  pythonGenerator.forBlock["logoup_rollto"] = function (block) {
    const angle = block.getFieldValue("ANGLE");
    return `roll(${angle})\n`;
  };

  pythonGenerator.forBlock["logoup_scalex"] = function (block) {
    const f = block.getFieldValue("FACTOR");
    return `scale(${f})\n`;
  };

  pythonGenerator.forBlock["logoup_scaley"] = function (block) {
    const f = block.getFieldValue("FACTOR");
    return `scale(${f})\n`;
  };

  pythonGenerator.forBlock["logoup_normal"] = function (block) {
    const dx = block.getFieldValue("DX");
    const dy = block.getFieldValue("DY");
    return `pitch(${dy}); yaw(${dx})\n`;
  };

  pythonGenerator.forBlock["logoup_normalto"] = function (block) {
    const nx = block.getFieldValue("NX");
    const ny = block.getFieldValue("NY");
    return `pitch(${ny}); yaw(${nx})\n`;
  };

  pythonGenerator.forBlock["logoup_rotatex"] = function (block) {
    const angle = block.getFieldValue("ANGLE");
    return `pitch(${angle})\n`;
  };

  pythonGenerator.forBlock["logoup_rotatey"] = function (block) {
    const angle = block.getFieldValue("ANGLE");
    return `roll(${angle})\n`;
  };

  pythonGenerator.forBlock["logoup_rotatez"] = function (block) {
    const angle = block.getFieldValue("ANGLE");
    return `yaw(${angle})\n`;
  };

  pythonGenerator.forBlock["logoup_warpx"] = function (block) {
    const angle = block.getFieldValue("ANGLE");
    return `shift(${angle}, 0)\n`;
  };

  pythonGenerator.forBlock["logoup_warpy"] = function (block) {
    const angle = block.getFieldValue("ANGLE");
    return `shift(0, ${angle})\n`;
  };

  pythonGenerator.forBlock["logoup_extrude"] = function (block) {
    const h = block.getFieldValue("HEIGHT");
    return `extrude(${h})\n`;
  };

  pythonGenerator.forBlock["logoup_cextrude"] = function (block) {
    const h = block.getFieldValue("HEIGHT");
    return `cextrude(${h})\n`;
  };

  pythonGenerator.forBlock["logoup_pyramid"] = function (block) {
    const h = block.getFieldValue("HEIGHT");
    return `pyramid(${h})\n`;
  };

  pythonGenerator.forBlock["logoup_cave"] = function (block) {
    const d = block.getFieldValue("DEPTH");
    return `cave(${d})\n`;
  };

  // ==========================================
  // 三维构件
  // ==========================================
  pythonGenerator.forBlock["logoup_box"] = function (block) {
    const l = block.getFieldValue("LENGTH");
    const w = block.getFieldValue("WIDTH");
    const h = block.getFieldValue("HEIGHT");
    return `box(${l}, ${w}, ${h})\n`;
  };

  pythonGenerator.forBlock["logoup_cylinder"] = function (block) {
    const r = block.getFieldValue("RADIUS");
    const h = block.getFieldValue("HEIGHT");
    return `cylinder(${r}, ${h})\n`;
  };

  pythonGenerator.forBlock["logoup_sphere"] = function (block) {
    const r = block.getFieldValue("RADIUS");
    return `sphere(${r})\n`;
  };

  pythonGenerator.forBlock["logoup_pyramid_solid"] = function (block) {
    const sides = block.getFieldValue("SIDES");
    const r = block.getFieldValue("RADIUS");
    const h = block.getFieldValue("HEIGHT");
    return `pyramid_solid(${sides}, ${r}, ${h})\n`;
  };

  pythonGenerator.forBlock["logoup_torus"] = function (block) {
    const r1 = block.getFieldValue("MAJOR_RADIUS");
    const r2 = block.getFieldValue("MINOR_RADIUS");
    return `torus(${r1}, ${r2})\n`;
  };

  generatorRegistered = true;
}
