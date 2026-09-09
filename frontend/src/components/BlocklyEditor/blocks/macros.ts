import * as Blockly from "blockly";
import { CATEGORY_COLORS } from "./types";

/**
 * 注册教学复合高级宏积木 (Educational Macros)
 */
export function registerMacroBlocks() {
  // 1. 径向多孔阵列 (Radial Array of Holes)
  Blockly.Blocks["cq_macro_radial_array"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("⚙️ 径向多孔环形阵列 (Radial Array)");
      this.appendDummyInput()
        .appendField("孔数量:")
        .appendField(new Blockly.FieldNumber(6, 2, 36, 1), "COUNT")
        .appendField("孔径 D:")
        .appendField(new Blockly.FieldNumber(4, 0.1), "DIAMETER")
        .appendField("孔深:")
        .appendField(new Blockly.FieldNumber(10, 0.1), "DEPTH")
        .appendField("距顶面沉入:")
        .appendField(new Blockly.FieldNumber(2, 0), "OFFSET");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CATEGORY_COLORS.MACRO);
      this.setTooltip("在零件 >Z 顶面自动围绕 Z 轴均布打孔");
    },
  };

  // 2. 机械法兰盘生成宏 (Flange Plate Macro)
  Blockly.Blocks["cq_macro_flange"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("⚙️ 机械法兰盘 (Flange)");
      this.appendDummyInput()
        .appendField("外圆半径:")
        .appendField(new Blockly.FieldNumber(25, 1), "OUTER_R")
        .appendField("中心孔径:")
        .appendField(new Blockly.FieldNumber(10, 0), "CENTER_D")
        .appendField("盘体厚度:")
        .appendField(new Blockly.FieldNumber(8, 0.5), "THICKNESS");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CATEGORY_COLORS.MACRO);
      this.setTooltip("快速生成带中心通孔的圆法兰盘基座");
    },
  };
}
