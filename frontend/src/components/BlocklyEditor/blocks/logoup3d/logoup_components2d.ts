import * as Blockly from "blockly";
import { LOGOUP_COLORS } from "../types";

/**
 * LogoUp 3D 平面构件积木 (2D Components)
 */
export function registerLogoUpComponents2DBlocks() {
  // 1. 正多边形
  Blockly.Blocks["logoup_polygon"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("⬡ 多边形 边数")
        .appendField(new Blockly.FieldNumber(6, 3, 36), "SIDES")
        .appendField("外接圆半径")
        .appendField(new Blockly.FieldNumber(10, 0.1), "RADIUS")
        .appendField("毫米");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.COMPONENTS_2D);
      this.setTooltip("在当前草平面放置一个正多边形截面");
    },
  };

  // 2. 圆
  Blockly.Blocks["logoup_circle"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("◯ 圆 半径")
        .appendField(new Blockly.FieldNumber(10, 0.1), "RADIUS")
        .appendField("毫米");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.COMPONENTS_2D);
      this.setTooltip("在当前草平面放置一个圆形截面");
    },
  };

  // 3. 弧线
  Blockly.Blocks["logoup_arc"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("⌒ 弧线 半径")
        .appendField(new Blockly.FieldNumber(10, 0.1), "RADIUS")
        .appendField("毫米 角度")
        .appendField(new Blockly.FieldNumber(60, -360, 360), "ANGLE")
        .appendField("度");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.COMPONENTS_2D);
      this.setTooltip("绘制一条指定半径与张角的圆弧线");
    },
  };

  // 4. 直线段
  Blockly.Blocks["logoup_line_len"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("— 直线段 长度")
        .appendField(new Blockly.FieldNumber(10), "LENGTH")
        .appendField("毫米");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.COMPONENTS_2D);
      this.setTooltip("向前绘制一条指定长度的直线段");
    },
  };

  // 5. 弧线到坐标
  Blockly.Blocks["logoup_arc_to"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("⤹ 弧线到 (")
        .appendField(new Blockly.FieldNumber(10), "X")
        .appendField(",")
        .appendField(new Blockly.FieldNumber(15), "Y")
        .appendField(")");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.COMPONENTS_2D);
      this.setTooltip("以平滑圆弧连接到目标局部坐标点");
    },
  };

  // 6. 直线到坐标
  Blockly.Blocks["logoup_line_to"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("➞ 直线到 (")
        .appendField(new Blockly.FieldNumber(10), "X")
        .appendField(",")
        .appendField(new Blockly.FieldNumber(20), "Y")
        .appendField(")");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.COMPONENTS_2D);
      this.setTooltip("以直线连接到目标局部坐标点");
    },
  };

  // 7. 多角星形
  Blockly.Blocks["logoup_star"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("✦ 星形 角数")
        .appendField(new Blockly.FieldNumber(4, 3, 20), "POINTS")
        .appendField("外接圆半径")
        .appendField(new Blockly.FieldNumber(10, 0.1), "RADIUS")
        .appendField("毫米");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.COMPONENTS_2D);
      this.setTooltip("放置指定角数的多角星截面");
    },
  };

  // 8. 五角星
  Blockly.Blocks["logoup_five_star"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("★ 五角星 外接圆半径")
        .appendField(new Blockly.FieldNumber(10, 0.1), "RADIUS")
        .appendField("毫米");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.COMPONENTS_2D);
      this.setTooltip("放置标准的正五角星截面");
    },
  };

  // 9. 六角星
  Blockly.Blocks["logoup_six_star"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("✡ 六角星 外接圆半径")
        .appendField(new Blockly.FieldNumber(10, 0.1), "RADIUS")
        .appendField("毫米");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.COMPONENTS_2D);
      this.setTooltip("放置正六角星截面");
    },
  };

  // 10. 椭圆
  Blockly.Blocks["logoup_ellipse"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("椭圆 半长径")
        .appendField(new Blockly.FieldNumber(12, 0.1), "A")
        .appendField("毫米 半短径")
        .appendField(new Blockly.FieldNumber(9, 0.1), "B")
        .appendField("毫米");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.COMPONENTS_2D);
      this.setTooltip("放置椭圆形截面");
    },
  };

  // 11. 蛋形
  Blockly.Blocks["logoup_egg"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("⬭ 蛋形 半横径")
        .appendField(new Blockly.FieldNumber(12, 0.1), "RX")
        .appendField("毫米 半纵径")
        .appendField(new Blockly.FieldNumber(18, 0.1), "RY")
        .appendField("毫米");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.COMPONENTS_2D);
      this.setTooltip("放置平滑蛋形 (卵形) 截面");
    },
  };

  // 12. 矩形
  Blockly.Blocks["logoup_rect"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("▭ 矩形 长")
        .appendField(new Blockly.FieldNumber(15, 0.1), "LENGTH")
        .appendField("毫米 宽")
        .appendField(new Blockly.FieldNumber(10, 0.1), "WIDTH")
        .appendField("毫米");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.COMPONENTS_2D);
      this.setTooltip("放置居中长方形截面");
    },
  };

  // 13. 正方形
  Blockly.Blocks["logoup_square"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("▢ 正方形 边长")
        .appendField(new Blockly.FieldNumber(10, 0.1), "SIZE")
        .appendField("毫米");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.COMPONENTS_2D);
      this.setTooltip("放置居中正方形截面");
    },
  };

  // 14. 圆角矩形
  Blockly.Blocks["logoup_rounded_rect"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("▢ 圆角矩形 长")
        .appendField(new Blockly.FieldNumber(15, 0.1), "LENGTH")
        .appendField("毫米 宽")
        .appendField(new Blockly.FieldNumber(10, 0.1), "WIDTH")
        .appendField("毫米 倒角半径")
        .appendField(new Blockly.FieldNumber(2, 0.01), "RADIUS")
        .appendField("毫米");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.COMPONENTS_2D);
      this.setTooltip("放置带圆角的长方形截面");
    },
  };

  // 15. 圆角方形
  Blockly.Blocks["logoup_rounded_square"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("▢ 圆角方形 边长")
        .appendField(new Blockly.FieldNumber(10, 0.1), "SIZE")
        .appendField("毫米 倒角半径")
        .appendField(new Blockly.FieldNumber(2, 0.01), "RADIUS")
        .appendField("毫米");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.COMPONENTS_2D);
      this.setTooltip("放置带圆角的正方形截面");
    },
  };

  // 16. 四芒星
  Blockly.Blocks["logoup_four_star"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("✦ 四芒星 外接圆半径")
        .appendField(new Blockly.FieldNumber(10, 0.1), "RADIUS")
        .appendField("毫米");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.COMPONENTS_2D);
      this.setTooltip("放置尖锐四芒星图形");
    },
  };

  // 17. 万花尺线
  Blockly.Blocks["logoup_spirograph"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("✿ 万花尺线 外径")
        .appendField(new Blockly.FieldNumber(15), "R")
        .appendField("内径")
        .appendField(new Blockly.FieldNumber(10), "r")
        .appendField("偏移")
        .appendField(new Blockly.FieldNumber(10), "d")
        .appendField("角度")
        .appendField(new Blockly.FieldNumber(1080), "ANGLE");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.COMPONENTS_2D);
      this.setTooltip("生成内摆线/外摆线万花筒几何花纹截面");
    },
  };
}
