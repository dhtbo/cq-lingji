import * as Blockly from "blockly";
import { LOGOUP_COLORS } from "../types";

/**
 * LogoUp 3D 三维构件积木 (3D Components / Primitives)
 * 支持通过 ValueInput 接入变量、数学计算或数值阴影块
 */
export function registerLogoUpComponents3DBlocks() {
  // 1. 长方体 (长、宽、高均支持变量插槽)
  Blockly.Blocks["logoup_box"] = {
    init: function () {
      this.appendDummyInput().appendField("⚅ 长方体");
      this.appendValueInput("LENGTH").setCheck(null).appendField("长");
      this.appendValueInput("WIDTH").setCheck(null).appendField("宽");
      this.appendValueInput("HEIGHT").setCheck(null).appendField("高");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.COMPONENTS_3D);
      this.setTooltip("在当前游标位置生成一个长方体 (支持输入长宽高变量或数值)");
    },
  };

  // 2. 圆柱 (半径、高支持变量插槽)
  Blockly.Blocks["logoup_cylinder"] = {
    init: function () {
      this.appendDummyInput().appendField("⬭ 圆柱");
      this.appendValueInput("RADIUS").setCheck(null).appendField("半径");
      this.appendValueInput("HEIGHT").setCheck(null).appendField("高");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.COMPONENTS_3D);
      this.setTooltip("在当前游标位置生成一个圆柱体 (支持输入半径与高变量或数值)");
    },
  };

  // 3. 球体 (半径支持变量插槽)
  Blockly.Blocks["logoup_sphere"] = {
    init: function () {
      this.appendDummyInput().appendField("⬤ 球体");
      this.appendValueInput("RADIUS").setCheck(null).appendField("半径");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.COMPONENTS_3D);
      this.setTooltip("在当前游标位置生成一个球体 (支持输入半径变量或数值)");
    },
  };

  // 4. 棱锥 (边数、半径、高支持变量插槽)
  Blockly.Blocks["logoup_pyramid_solid"] = {
    init: function () {
      this.appendDummyInput().appendField("⏶ 棱锥");
      this.appendValueInput("SIDES").setCheck(null).appendField("边数");
      this.appendValueInput("RADIUS").setCheck(null).appendField("半径");
      this.appendValueInput("HEIGHT").setCheck(null).appendField("高");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.COMPONENTS_3D);
      this.setTooltip("在当前游标位置生成一个正多棱锥体 (支持输入变量或数值)");
    },
  };

  // 5. 圆环 (大圆半径、小圆半径支持变量插槽)
  Blockly.Blocks["logoup_torus"] = {
    init: function () {
      this.appendDummyInput().appendField("○ 圆环");
      this.appendValueInput("MAJOR_RADIUS").setCheck(null).appendField("大圆半径");
      this.appendValueInput("MINOR_RADIUS").setCheck(null).appendField("小圆半径");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.COMPONENTS_3D);
      this.setTooltip("在当前游标位置生成一个圆环体 (支持输入半径变量或数值)");
    },
  };

  // 6. 圆锥 (半径、高支持变量插槽)
  Blockly.Blocks["logoup_cone"] = {
    init: function () {
      this.appendDummyInput().appendField("△ 圆锥");
      this.appendValueInput("RADIUS").setCheck(null).appendField("半径");
      this.appendValueInput("HEIGHT").setCheck(null).appendField("高");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.COMPONENTS_3D);
      this.setTooltip("在当前游标位置生成一个尖顶正圆锥体 (支持输入变量或数值)");
    },
  };

  // 7. 椭球 (半轴 X、Y、Z 支持变量插槽)
  Blockly.Blocks["logoup_ellipsoid"] = {
    init: function () {
      this.appendDummyInput().appendField("◓ 椭球");
      this.appendValueInput("RX").setCheck(null).appendField("半轴 X");
      this.appendValueInput("RY").setCheck(null).appendField("Y");
      this.appendValueInput("RZ").setCheck(null).appendField("Z");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.COMPONENTS_3D);
      this.setTooltip("在当前游标位置生成一个椭球体 (支持输入半轴变量或数值)");
    },
  };
}
