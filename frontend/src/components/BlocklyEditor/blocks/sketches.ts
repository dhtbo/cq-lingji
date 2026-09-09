import * as Blockly from "blockly";
import { CATEGORY_COLORS, CQ_TYPES } from "./types";

/**
 * 注册 2D 草图绘制积木 (Sketch)
 */
export function registerSketchBlocks() {
  // --- 语句式 (Scratch 风格垂直堆叠) ---

  // 1. 画矩形
  Blockly.Blocks["cq_sketch_rect"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("✏️ 绘制矩形")
        .appendField("宽 X:")
        .appendField(new Blockly.FieldNumber(20, 0.1), "WIDTH")
        .appendField("高 Y:")
        .appendField(new Blockly.FieldNumber(20, 0.1), "HEIGHT");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CATEGORY_COLORS.SKETCH);
      this.setTooltip("在当前工作平面绘制居中矩形草图 .rect(xLen, yLen)");
    },
  };

  // 2. 画圆形
  Blockly.Blocks["cq_sketch_circle"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("✏️ 绘制圆形")
        .appendField("半径 R:")
        .appendField(new Blockly.FieldNumber(10, 0.1), "RADIUS");
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
}
