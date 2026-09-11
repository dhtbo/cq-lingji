import * as Blockly from "blockly";
import { LOGOUP_COLORS } from "../types";

/**
 * LogoUp 3D 控制流程积木
 */
export function registerLogoUpControlBlocks() {
  // 1. 开始 (START 帽子积木)
  Blockly.Blocks["logoup_start"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("🏁 开始");
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.CONTROL);
      this.setTooltip("程序执行起点");
    },
  };

  // 2. 存储当前坐标 (PUSH)
  Blockly.Blocks["logoup_push"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("📦 存储当前坐标 (PUSH)");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.CONTROL);
      this.setTooltip("将当前三维游标坐标、姿态朝向与画笔状态压入堆栈");
    },
  };

  // 3. 恢复上次存储的坐标 (POP)
  Blockly.Blocks["logoup_pop"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("↩️ 恢复上次存储的坐标 (POP)");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.CONTROL);
      this.setTooltip("从堆栈中恢复先前存储的三维游标坐标与姿态");
    },
  };
}
