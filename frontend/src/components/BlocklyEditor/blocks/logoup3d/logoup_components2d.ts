import * as Blockly from "blockly";
import { LOGOUP_COLORS } from "../types";

/**
 * LogoUp 3D 平面构件积木 (2D Components)
 * 支持通过 ValueInput 接入变量、数学计算或数值阴影块
 */
export function registerLogoUpComponents2DBlocks() {
  // 1. 正多边形 (边数、外接圆半径)
  Blockly.Blocks["logoup_polygon"] = {
    init: function () {
      this.appendDummyInput().appendField("⬡ 多边形");
      this.appendValueInput("SIDES").setCheck(null).appendField("边数");
      this.appendValueInput("RADIUS").setCheck(null).appendField("外接圆半径");
      this.appendDummyInput().appendField("毫米");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.COMPONENTS_2D);
      this.setTooltip("在当前草平面放置一个正多边形截面 (支持输入变量或数值)");
    },
  };

  // 2. 圆 (半径)
  Blockly.Blocks["logoup_circle"] = {
    init: function () {
      this.appendDummyInput().appendField("◯ 圆");
      this.appendValueInput("RADIUS").setCheck(null).appendField("半径");
      this.appendDummyInput().appendField("毫米");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.COMPONENTS_2D);
      this.setTooltip("在当前草平面放置一个圆形截面 (支持输入变量或数值)");
    },
  };

  // 3. 弧线 (半径、角度)
  Blockly.Blocks["logoup_arc"] = {
    init: function () {
      this.appendDummyInput().appendField("⌒ 弧线");
      this.appendValueInput("RADIUS").setCheck(null).appendField("半径");
      this.appendValueInput("ANGLE").setCheck(null).appendField("毫米 角度");
      this.appendDummyInput().appendField("度");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.COMPONENTS_2D);
      this.setTooltip("绘制一条指定半径与张角的圆弧线 (支持输入变量或数值)");
    },
  };

  // 4. 直线段 (长度)
  Blockly.Blocks["logoup_line_len"] = {
    init: function () {
      this.appendDummyInput().appendField("— 直线段");
      this.appendValueInput("LENGTH").setCheck(null).appendField("长度");
      this.appendDummyInput().appendField("毫米");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.COMPONENTS_2D);
      this.setTooltip("向前绘制一条指定长度的直线段 (支持输入变量或数值)");
    },
  };

  // 5. 弧线到坐标 (X, Y)
  Blockly.Blocks["logoup_arc_to"] = {
    init: function () {
      this.appendDummyInput().appendField("⤹ 弧线到");
      this.appendValueInput("X").setCheck(null).appendField("X");
      this.appendValueInput("Y").setCheck(null).appendField("Y");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.COMPONENTS_2D);
      this.setTooltip("以平滑圆弧连接到目标局部坐标点 (支持输入变量或数值)");
    },
  };

  // 6. 直线到坐标 (X, Y)
  Blockly.Blocks["logoup_line_to"] = {
    init: function () {
      this.appendDummyInput().appendField("➞ 直线到");
      this.appendValueInput("X").setCheck(null).appendField("X");
      this.appendValueInput("Y").setCheck(null).appendField("Y");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.COMPONENTS_2D);
      this.setTooltip("以直线连接到目标局部坐标点 (支持输入变量或数值)");
    },
  };

  // 7. 多角星形 (角数、外接圆半径)
  Blockly.Blocks["logoup_star"] = {
    init: function () {
      this.appendDummyInput().appendField("✦ 星形");
      this.appendValueInput("POINTS").setCheck(null).appendField("角数");
      this.appendValueInput("RADIUS").setCheck(null).appendField("外接圆半径");
      this.appendDummyInput().appendField("毫米");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.COMPONENTS_2D);
      this.setTooltip("放置指定角数的多角星截面 (支持输入变量或数值)");
    },
  };

  // 8. 五角星 (外接圆半径)
  Blockly.Blocks["logoup_five_star"] = {
    init: function () {
      this.appendDummyInput().appendField("★ 五角星");
      this.appendValueInput("RADIUS").setCheck(null).appendField("外接圆半径");
      this.appendDummyInput().appendField("毫米");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.COMPONENTS_2D);
      this.setTooltip("放置标准的正五角星截面 (支持输入变量或数值)");
    },
  };

  // 9. 六角星 (外接圆半径)
  Blockly.Blocks["logoup_six_star"] = {
    init: function () {
      this.appendDummyInput().appendField("✡ 六角星");
      this.appendValueInput("RADIUS").setCheck(null).appendField("外接圆半径");
      this.appendDummyInput().appendField("毫米");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.COMPONENTS_2D);
      this.setTooltip("放置正六角星截面 (支持输入变量或数值)");
    },
  };

  // 10. 椭圆 (半长径 A, 半短径 B)
  Blockly.Blocks["logoup_ellipse"] = {
    init: function () {
      this.appendDummyInput().appendField("椭圆");
      this.appendValueInput("A").setCheck(null).appendField("半长径");
      this.appendValueInput("B").setCheck(null).appendField("毫米 半短径");
      this.appendDummyInput().appendField("毫米");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.COMPONENTS_2D);
      this.setTooltip("放置椭圆形截面 (支持输入变量或数值)");
    },
  };

  // 11. 蛋形 (半横径 RX, 半纵径 RY)
  Blockly.Blocks["logoup_egg"] = {
    init: function () {
      this.appendDummyInput().appendField("⬭ 蛋形");
      this.appendValueInput("RX").setCheck(null).appendField("半横径");
      this.appendValueInput("RY").setCheck(null).appendField("毫米 半纵径");
      this.appendDummyInput().appendField("毫米");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.COMPONENTS_2D);
      this.setTooltip("放置平滑蛋形 (卵形) 截面 (支持输入变量或数值)");
    },
  };

  // 12. 矩形 (长、宽支持变量插槽)
  Blockly.Blocks["logoup_rect"] = {
    init: function () {
      this.appendDummyInput().appendField("▭ 矩形");
      this.appendValueInput("LENGTH").setCheck(null).appendField("长");
      this.appendValueInput("WIDTH").setCheck(null).appendField("毫米 宽");
      this.appendDummyInput().appendField("毫米");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.COMPONENTS_2D);
      this.setTooltip("放置居中长方形截面 (支持输入长宽变量或数值)");
    },
  };

  // 13. 正方形 (边长支持变量插槽)
  Blockly.Blocks["logoup_square"] = {
    init: function () {
      this.appendDummyInput().appendField("▢ 正方形");
      this.appendValueInput("SIZE").setCheck(null).appendField("边长");
      this.appendDummyInput().appendField("毫米");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.COMPONENTS_2D);
      this.setTooltip("放置居中正方形截面 (支持输入边长变量或数值)");
    },
  };

  // 14. 圆角矩形 (长、宽、倒角半径支持变量插槽)
  Blockly.Blocks["logoup_rounded_rect"] = {
    init: function () {
      this.appendDummyInput().appendField("▢ 圆角矩形");
      this.appendValueInput("LENGTH").setCheck(null).appendField("长");
      this.appendValueInput("WIDTH").setCheck(null).appendField("毫米 宽");
      this.appendValueInput("RADIUS").setCheck(null).appendField("毫米 倒角半径");
      this.appendDummyInput().appendField("毫米");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.COMPONENTS_2D);
      this.setTooltip("放置带圆角的长方形截面 (支持输入变量或数值)");
    },
  };

  // 15. 圆角方形 (边长、倒角半径支持变量插槽)
  Blockly.Blocks["logoup_rounded_square"] = {
    init: function () {
      this.appendDummyInput().appendField("▢ 圆角方形");
      this.appendValueInput("SIZE").setCheck(null).appendField("边长");
      this.appendValueInput("RADIUS").setCheck(null).appendField("毫米 倒角半径");
      this.appendDummyInput().appendField("毫米");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.COMPONENTS_2D);
      this.setTooltip("放置带圆角的正方形截面 (支持输入变量或数值)");
    },
  };

  // 16. 四芒星 (外接圆半径支持变量插槽)
  Blockly.Blocks["logoup_four_star"] = {
    init: function () {
      this.appendDummyInput().appendField("✦ 四芒星");
      this.appendValueInput("RADIUS").setCheck(null).appendField("外接圆半径");
      this.appendDummyInput().appendField("毫米");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.COMPONENTS_2D);
      this.setTooltip("放置尖锐四芒星图形 (支持输入变量或数值)");
    },
  };

  // 17. 万花尺线 (外径、内径、偏移、角度支持变量插槽)
  Blockly.Blocks["logoup_spirograph"] = {
    init: function () {
      this.appendDummyInput().appendField("✿ 万花尺线");
      this.appendValueInput("R").setCheck(null).appendField("外径");
      this.appendValueInput("r").setCheck(null).appendField("内径");
      this.appendValueInput("d").setCheck(null).appendField("偏移");
      this.appendValueInput("ANGLE").setCheck(null).appendField("角度");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.COMPONENTS_2D);
      this.setTooltip("生成内摆线/外摆线万花筒几何花纹截面 (支持输入变量或数值)");
    },
  };
}
