import * as Blockly from "blockly";
import { CATEGORY_COLORS, CQ_TYPES } from "./types";

/**
 * 注册初始化基准面积木
 */
export function registerInitializerBlocks() {
  // 1. 语句式初始化: 建立基准面 (顶部积木)
  Blockly.Blocks["cq_init_workplane"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("📐 新建基准面 Workplane")
        .appendField(
          new Blockly.FieldDropdown([
            ["XY 平面 (俯视/地面)", "XY"],
            ["XZ 平面 (正视/立面)", "XZ"],
            ["YZ 平面 (侧视/侧立)", "YZ"],
          ]),
          "PLANE"
        );
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CATEGORY_COLORS.INITIALIZER);
      this.setTooltip("创建一个新的 CadQuery 工作平面作为建模起点");
      this.setHelpUrl("");
    },
  };

  // 2. 表达式初始化: Workplane on [XY | XZ | YZ] -> 输出 CQ_OBJ
  Blockly.Blocks["cq_chain_workplane"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("Workplane on")
        .appendField(
          new Blockly.FieldDropdown([
            ["XY", "XY"],
            ["XZ", "XZ"],
            ["YZ", "YZ"],
          ]),
          "PLANE"
        );
      this.setOutput(true, CQ_TYPES.CQ_OBJ);
      this.setColour(CATEGORY_COLORS.INITIALIZER);
      this.setTooltip("生成一个基础 CadQuery Workplane 对象");
    },
  };

  // 3. 表达式接收赋值: part = [CQ_OBJ]
  Blockly.Blocks["cq_chain_assign"] = {
    init: function () {
      this.appendValueInput("EXPR")
        .setCheck(CQ_TYPES.CQ_OBJ)
        .appendField("part = ");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CATEGORY_COLORS.INITIALIZER);
      this.setTooltip("将链式 CadQuery 对象赋值给模型实体 part");
    },
  };

  // 4. 引用已有实体: 📦 对象 part (输出 CQ_OBJ)
  Blockly.Blocks["cq_chain_part_ref"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("📦 对象")
        .appendField(
          new Blockly.FieldDropdown([
            ["part (当前实体)", "part"],
            ["workplane (当前基准面)", "workplane"],
          ]),
          "VAR_NAME"
        );
      this.setOutput(true, CQ_TYPES.CQ_OBJ);
      this.setColour(CATEGORY_COLORS.INITIALIZER);
      this.setTooltip("引用已有的模型实体变量 part，作为后续链式操作的目标对象");
    },
  };
}
