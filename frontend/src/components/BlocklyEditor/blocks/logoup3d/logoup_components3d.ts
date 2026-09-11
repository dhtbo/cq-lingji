import * as Blockly from "blockly";
import { LOGOUP_COLORS } from "../types";

/**
 * LogoUp 3D 三维构件积木 (3D Components / Primitives)
 */
export function registerLogoUpComponents3DBlocks() {
  // 1. 长方体
  Blockly.Blocks["logoup_box"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("⚅ 长方体 长")
        .appendField(new Blockly.FieldNumber(10, 0.1), "LENGTH")
        .appendField("宽")
        .appendField(new Blockly.FieldNumber(10, 0.1), "WIDTH")
        .appendField("高")
        .appendField(new Blockly.FieldNumber(10, 0.1), "HEIGHT");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.COMPONENTS_3D);
      this.setTooltip("在当前游标位置生成一个长方体");
    },
  };

  // 2. 圆柱
  Blockly.Blocks["logoup_cylinder"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("⬭ 圆柱 半径")
        .appendField(new Blockly.FieldNumber(10, 0.1), "RADIUS")
        .appendField("高")
        .appendField(new Blockly.FieldNumber(15, 0.1), "HEIGHT");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.COMPONENTS_3D);
      this.setTooltip("在当前游标位置生成一个圆柱体");
    },
  };

  // 3. 球体
  Blockly.Blocks["logoup_sphere"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("⬤ 球体 半径")
        .appendField(new Blockly.FieldNumber(10, 0.1), "RADIUS");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.COMPONENTS_3D);
      this.setTooltip("在当前游标位置生成一个球体");
    },
  };

  // 4. 棱锥
  Blockly.Blocks["logoup_pyramid_solid"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("⏶ 棱锥 边数")
        .appendField(new Blockly.FieldNumber(3, 3, 36), "SIDES")
        .appendField("半径")
        .appendField(new Blockly.FieldNumber(10, 0.1), "RADIUS")
        .appendField("高")
        .appendField(new Blockly.FieldNumber(15, 0.1), "HEIGHT");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.COMPONENTS_3D);
      this.setTooltip("在当前游标位置生成一个正多棱锥体");
    },
  };

  // 5. 圆环 (严格对标图 1: ○ 圆环 大圆半径 (10) 小圆半径 (4))
  Blockly.Blocks["logoup_torus"] = {
    init: function () {
      this.appendValueInput("MAJOR_RADIUS")
        .setCheck("Number")
        .appendField("○ 圆环 大圆半径");
      this.appendValueInput("MINOR_RADIUS")
        .setCheck("Number")
        .appendField("小圆半径");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.COMPONENTS_3D);
      this.setTooltip("在当前游标位置生成一个圆环体 (○ 圆环 大圆半径 10 小圆半径 4)");
    },
  };

  // 6. 圆锥 (严格对标图: △ 圆锥 半径 [10] 高 [15])
  Blockly.Blocks["logoup_cone"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("△ 圆锥 半径")
        .appendField(new Blockly.FieldNumber(10, 0.1), "RADIUS")
        .appendField("高")
        .appendField(new Blockly.FieldNumber(15, 0.1), "HEIGHT");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.COMPONENTS_3D);
      this.setTooltip("在当前游标位置生成一个尖顶正圆锥体");
    },
  };
}
