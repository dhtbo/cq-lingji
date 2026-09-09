import * as Blockly from "blockly";
import { CATEGORY_COLORS } from "./types";

/**
 * 注册代码便签与工程注释积木 (Comments)
 */
export function registerCommentBlocks() {
  // 单行注释积木 (可放置在任何步骤前后)
  Blockly.Blocks["cq_comment"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("💬 注释")
        .appendField(new Blockly.FieldTextInput("在此处记录建模设计说明..."), "TEXT");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CATEGORY_COLORS.COMMENT);
      this.setTooltip("在 Python 代码中生成单行注释 (# ...)，用于解释建模意图与尺寸说明");
      this.setHelpUrl("");
    },
  };
}
