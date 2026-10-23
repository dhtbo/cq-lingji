import * as Blockly from "blockly";
import { CATEGORY_COLORS, CQ_TYPES } from "./types";

/**
 * 注册 2D 草图绘制积木 (Sketch)
 */
export function registerSketchBlocks() {
  // --- 语句式 (Scratch 风格垂直堆叠) ---

  // 1. 画矩形 (支持 ValueInput 接入数值阴影块、变量或运算表达式)
  Blockly.Blocks["cq_sketch_rect"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("✏️ 绘制矩形");
      this.appendValueInput("WIDTH")
        .setCheck(null)
        .appendField("宽 X:");
      this.appendValueInput("HEIGHT")
        .setCheck(null)
        .appendField("高 Y:");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CATEGORY_COLORS.SKETCH);
      this.setTooltip("在当前工作平面绘制居中矩形草图 .rect(xLen, yLen)");
    },
  };

  // 2. 画圆形 (支持 ValueInput 接入数值阴影块、变量或运算表达式)
  Blockly.Blocks["cq_sketch_circle"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("✏️ 绘制圆形");
      this.appendValueInput("RADIUS")
        .setCheck(null)
        .appendField("半径 R:");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CATEGORY_COLORS.SKETCH);
      this.setTooltip("在当前工作平面绘制圆形草图 .circle(radius)");
    },
  };

  // 3. 画正多边形
  Blockly.Blocks["cq_sketch_polygon"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("✏️ 绘制正多边形")
        .appendField("边数:")
        .appendField(new Blockly.FieldNumber(6, 3, 32, 1), "SIDES")
        .appendField("外接圆直径:")
        .appendField(new Blockly.FieldNumber(20, 0.1), "DIAMETER");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CATEGORY_COLORS.SKETCH);
      this.setTooltip("在当前工作平面绘制正多边形草图 .polygon(nSides, diameter)");
    },
  };

  // 3.1 画自定义多边形折线闭合区域 (Polyline / Polygon Area)
  Blockly.Blocks["cq_sketch_polyline"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("✏️ 绘制多边形区域")
        .appendField("顶点列表:")
        .appendField(new Blockly.FieldTextInput("[(0,0), (20,0), (20,15), (0,15)]"), "POINTS")
        .appendField("自动闭合:")
        .appendField(new Blockly.FieldCheckbox("TRUE"), "CLOSE");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CATEGORY_COLORS.SKETCH);
      this.setTooltip("按二维点序列依次绘制折线并自动闭合生成多边形草图区域 .polyline(pts).close()");
    },
  };

  // 3.2 画机械腰形槽 (Slot2D)
  Blockly.Blocks["cq_sketch_slot"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("✏️ 绘制腰形槽 slot2D")
        .appendField("槽长:")
        .appendField(new Blockly.FieldNumber(30, 0.1), "LENGTH")
        .appendField("圆孔径:")
        .appendField(new Blockly.FieldNumber(10, 0.1), "DIAMETER")
        .appendField("倾角:")
        .appendField(new Blockly.FieldNumber(0, -360, 360), "ANGLE");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CATEGORY_COLORS.SKETCH);
      this.setTooltip("在当前工作平面绘制机械传动常见的腰形长圆槽草图 .slot2D(length, diameter, angle)");
    },
  };

  // 3.3 画椭圆截面 (Ellipse)
  Blockly.Blocks["cq_sketch_ellipse"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("✏️ 绘制椭圆 ellipse")
        .appendField("半长轴 X:")
        .appendField(new Blockly.FieldNumber(20, 0.1), "X_RADIUS")
        .appendField("半短轴 Y:")
        .appendField(new Blockly.FieldNumber(10, 0.1), "Y_RADIUS");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CATEGORY_COLORS.SKETCH);
      this.setTooltip("在当前工作平面绘制椭圆形草图截面 .ellipse(x_radius, y_radius)");
    },
  };

  // --- 链式 Fluent API (输入 CQ_OBJ, 输出 CQ_OBJ) ---

  // 4. 链式圆形 .circle()
  Blockly.Blocks["cq_chain_circle"] = {
    init: function () {
      this.appendValueInput("TARGET")
        .setCheck(CQ_TYPES.CQ_OBJ)
        .appendField("对象");
      this.appendDummyInput()
        .appendField(".circle(radius=")
        .appendField(new Blockly.FieldNumber(10, 0.1), "RADIUS")
        .appendField(")");
      this.setOutput(true, CQ_TYPES.CQ_OBJ);
      this.setColour(CATEGORY_COLORS.SKETCH);
      this.setTooltip("向传入的 CadQuery 目标追加 .circle(radius)");
    },
  };

  // 5. 链式矩形 .rect()
  Blockly.Blocks["cq_chain_rect"] = {
    init: function () {
      this.appendValueInput("TARGET")
        .setCheck(CQ_TYPES.CQ_OBJ)
        .appendField("对象");
      this.appendDummyInput()
        .appendField(".rect(xLen=")
        .appendField(new Blockly.FieldNumber(20, 0.1), "WIDTH")
        .appendField(", yLen=")
        .appendField(new Blockly.FieldNumber(20, 0.1), "HEIGHT")
        .appendField(")");
      this.setOutput(true, CQ_TYPES.CQ_OBJ);
      this.setColour(CATEGORY_COLORS.SKETCH);
      this.setTooltip("向传入的 CadQuery 目标追加 .rect(xLen, yLen)");
    },
  };

  // 6. 链式正多边形 .polygon()
  Blockly.Blocks["cq_chain_polygon"] = {
    init: function () {
      this.appendValueInput("TARGET")
        .setCheck(CQ_TYPES.CQ_OBJ)
        .appendField("对象");
      this.appendDummyInput()
        .appendField(".polygon(nSides=")
        .appendField(new Blockly.FieldNumber(6, 3, 32, 1), "SIDES")
        .appendField(", diameter=")
        .appendField(new Blockly.FieldNumber(20, 0.1), "DIAMETER")
        .appendField(")");
      this.setOutput(true, CQ_TYPES.CQ_OBJ);
      this.setColour(CATEGORY_COLORS.SKETCH);
      this.setTooltip("向传入的 CadQuery 目标追加 .polygon(nSides, diameter)");
    },
  };

  // ==================== build123d 2D 草图图元积木 ====================

  const B3D_SKETCH_MODE_OPTIONS: [string, string][] = [
    ["加胶并集 Mode.ADD", "ADD"],
    ["减胶挖孔 Mode.SUBTRACT", "SUBTRACT"],
    ["相交保留 Mode.INTERSECT", "INTERSECT"],
  ];

  // b3d Rectangle
  Blockly.Blocks["b3d_sketch_rect"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("✏️ 草图矩形 Rectangle");
      this.appendValueInput("WIDTH")
        .setCheck(null)
        .appendField("宽 X:");
      this.appendValueInput("HEIGHT")
        .setCheck(null)
        .appendField("高 Y:");
      this.appendDummyInput()
        .appendField("模式:")
        .appendField(new Blockly.FieldDropdown(B3D_SKETCH_MODE_OPTIONS), "MODE");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CATEGORY_COLORS.SKETCH);
      this.setTooltip("build123d Rectangle 草图图元，支持接入运算积木、变量或数值");
    },
  };

  // b3d Circle
  Blockly.Blocks["b3d_sketch_circle"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("✏️ 草图圆形 Circle");
      this.appendValueInput("RADIUS")
        .setCheck(null)
        .appendField("半径 R:");
      this.appendDummyInput()
        .appendField("模式:")
        .appendField(new Blockly.FieldDropdown(B3D_SKETCH_MODE_OPTIONS), "MODE");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CATEGORY_COLORS.SKETCH);
      this.setTooltip("build123d Circle 草图图元，支持 ADD 或 SUBTRACT (挖孔)，支持接入运算积木、变量或数值");
    },
  };

  // b3d RegularPolygon
  Blockly.Blocks["b3d_sketch_regular_polygon"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("✏️ 正多边形 RegularPolygon")
        .appendField("半径 R:")
        .appendField(new Blockly.FieldTextInput("10"), "RADIUS")
        .appendField("边数:")
        .appendField(new Blockly.FieldTextInput("6"), "SIDES")
        .appendField("模式:")
        .appendField(new Blockly.FieldDropdown(B3D_SKETCH_MODE_OPTIONS), "MODE");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CATEGORY_COLORS.SKETCH);
      this.setTooltip("build123d RegularPolygon 正多边形草图，支持数值或变量名");
    },
  };

  // b3d Polygon
  Blockly.Blocks["b3d_sketch_polygon"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("✏️ 自由多边形 Polygon")
        .appendField("顶点列表:")
        .appendField(new Blockly.FieldTextInput("[(0,0), (20,0), (20,15), (0,15)]"), "POINTS")
        .appendField("模式:")
        .appendField(new Blockly.FieldDropdown(B3D_SKETCH_MODE_OPTIONS), "MODE");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CATEGORY_COLORS.SKETCH);
      this.setTooltip("build123d Polygon：由顶点列表构成的任意多边形闭合草图面");
    },
  };

  // b3d Polyline
  Blockly.Blocks["b3d_sketch_polyline"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("✏️ 连续折线 Polyline")
        .appendField("点序列:")
        .appendField(new Blockly.FieldTextInput("[(0,0), (10,5), (20,0)]"), "POINTS")
        .appendField("闭合:")
        .appendField(new Blockly.FieldCheckbox("TRUE"), "CLOSE");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CATEGORY_COLORS.SKETCH);
      this.setTooltip("build123d Polyline：连续折线段草图");
    },
  };

  // b3d Slot2D
  Blockly.Blocks["b3d_sketch_slot"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("✏️ 机械腰形槽 Slot2D")
        .appendField("槽长:")
        .appendField(new Blockly.FieldTextInput("30"), "LENGTH")
        .appendField("槽宽:")
        .appendField(new Blockly.FieldTextInput("10"), "WIDTH")
        .appendField("旋转角:")
        .appendField(new Blockly.FieldTextInput("0"), "ROTATION")
        .appendField("模式:")
        .appendField(new Blockly.FieldDropdown(B3D_SKETCH_MODE_OPTIONS), "MODE");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CATEGORY_COLORS.SKETCH);
      this.setTooltip("build123d Slot2D：机械常用长圆腰形槽，支持数值或变量名");
    },
  };

  // b3d Ellipse
  Blockly.Blocks["b3d_sketch_ellipse"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("✏️ 椭圆草图 Ellipse")
        .appendField("半长轴 X:")
        .appendField(new Blockly.FieldTextInput("20"), "X_RADIUS")
        .appendField("半短轴 Y:")
        .appendField(new Blockly.FieldTextInput("10"), "Y_RADIUS")
        .appendField("模式:")
        .appendField(new Blockly.FieldDropdown(B3D_SKETCH_MODE_OPTIONS), "MODE");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CATEGORY_COLORS.SKETCH);
      this.setTooltip("build123d Ellipse 椭圆草图，支持数值或变量名");
    },
  };

  // b3d Text
  Blockly.Blocks["b3d_sketch_text"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("✏️ 刻字文本 Text")
        .appendField("文本:")
        .appendField(new Blockly.FieldTextInput("BUILD123D"), "TEXT")
        .appendField("字号:")
        .appendField(new Blockly.FieldTextInput("12"), "FONT_SIZE")
        .appendField("模式:")
        .appendField(new Blockly.FieldDropdown(B3D_SKETCH_MODE_OPTIONS), "MODE");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CATEGORY_COLORS.SKETCH);
      this.setTooltip("build123d Text：在草图上生成矢量文字轮廓，可拉伸出立体凸字或凹字，字号支持数值、变量名或表达式");
    },
  };

  // b3d Line
  Blockly.Blocks["b3d_line"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("📏 线段 Line")
        .appendField("变量:")
        .appendField(new Blockly.FieldTextInput(""), "VAR_NAME")
        .appendField("起点:")
        .appendField(new Blockly.FieldTextInput("(0, 0)"), "START_PT")
        .appendField("终点:")
        .appendField(new Blockly.FieldTextInput("(10, 0)"), "END_PT");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CATEGORY_COLORS.SKETCH);
      this.setTooltip("build123d Line：两点之间的直线段，放置于 BuildLine 中；可指定变量名以便后续使用 @ 端点运算符");
    },
  };

  // b3d ThreePointArc
  Blockly.Blocks["b3d_three_point_arc"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("🏹 三点圆弧 ThreePointArc")
        .appendField("变量:")
        .appendField(new Blockly.FieldTextInput(""), "VAR_NAME")
        .appendField("起点:")
        .appendField(new Blockly.FieldTextInput("(0, 0)"), "PT1")
        .appendField("途径点:")
        .appendField(new Blockly.FieldTextInput("(5, 5)"), "PT2")
        .appendField("终点:")
        .appendField(new Blockly.FieldTextInput("(10, 0)"), "PT3");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CATEGORY_COLORS.SKETCH);
      this.setTooltip("build123d ThreePointArc：由起点、途径点与终点定义的三点圆弧，支持数值元组、变量或 @ 端点表达式");
    },
  };

  // b3d make_face
  Blockly.Blocks["b3d_make_face"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("✨ 生成截面 make_face()");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CATEGORY_COLORS.SKETCH);
      this.setTooltip("build123d make_face()：将 BuildLine 中构建的闭合线框转化为 BuildSketch 2D 截面");
    },
  };
}
