import * as Blockly from "blockly";
import { CATEGORY_COLORS } from "./types";

/**
 * 注册变量赋值与复合解构赋值积木 (Variables & Compound Assignments)
 */
export function registerVariableBlocks() {
  // 1. 单变量赋值: b3d_var_assign
  Blockly.Blocks["b3d_var_assign"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("📦 设定变量")
        .appendField(new Blockly.FieldTextInput("hole_dia"), "VAR")
        .appendField("=")
        .appendField(new Blockly.FieldTextInput("6.0"), "VALUE");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CATEGORY_COLORS.VARIABLE);
      this.setTooltip("单变量赋值语句，例如 hole_dia = 6.0 或 top_face = plate.faces().sort_by(Axis.Z)[-1]");
    },
  };

  // 2. 复合/解构赋值: b3d_multi_var_assign
  Blockly.Blocks["b3d_multi_var_assign"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("📦 复合赋值")
        .appendField(new Blockly.FieldTextInput("length, width, thickness"), "VARS")
        .appendField("=")
        .appendField(new Blockly.FieldTextInput("80.0, 60.0, 10.0"), "VALUES");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CATEGORY_COLORS.VARIABLE);
      this.setTooltip("多变量解构赋值，例如 length, width, thickness = 80.0, 60.0, 10.0 或 a, b, c = 80, 40, 20");
    },
  };

  // 3. 变量取值/引用: b3d_var_get (表达式中引用变量)
  Blockly.Blocks["b3d_var_get"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("🏷️")
        .appendField(new Blockly.FieldTextInput("thickness"), "VAR");
      this.setOutput(true, null);
      this.setColour(CATEGORY_COLORS.VARIABLE);
      this.setTooltip("引用一个变量的值，例如 thickness、length、radius");
    },
  };
}
