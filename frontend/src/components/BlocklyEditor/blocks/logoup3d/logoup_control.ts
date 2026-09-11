import * as Blockly from "blockly";
import { LOGOUP_COLORS } from "../types";

/**
 * LogoUp 3D 控制流程积木体系 (完全对标原生 LogoUp3D 控制与变量函数架构)
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

  // 2. 重复次数循环 (REPEAT)
  Blockly.Blocks["logoup_repeat"] = {
    init: function () {
      this.appendValueInput("TIMES")
        .setCheck("Number")
        .appendField("重复");
      this.appendDummyInput()
        .appendField("次");
      this.appendStatementInput("DO")
        .appendField("");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.CONTROL);
      this.setTooltip("指定循环执行内部积木若干次");
    },
  };

  // 3. 如果分支 (IF)
  Blockly.Blocks["logoup_if"] = {
    init: function () {
      this.appendValueInput("CONDITION")
        .setCheck("Boolean")
        .appendField("如果");
      this.appendStatementInput("DO")
        .appendField("");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.CONTROL);
      this.setTooltip("当条件满足成立时执行内部积木");
    },
  };

  // 4. 如果...否则分支 (IF ELSE)
  Blockly.Blocks["logoup_if_else"] = {
    init: function () {
      this.appendValueInput("CONDITION")
        .setCheck("Boolean")
        .appendField("如果");
      this.appendStatementInput("DO")
        .appendField("");
      this.appendDummyInput()
        .appendField("否则");
      this.appendStatementInput("ELSE")
        .appendField("");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.CONTROL);
      this.setTooltip("当条件满足时执行第一分支，否则执行否则分支");
    },
  };

  // 5. 存储当前坐标 (PUSH)
  Blockly.Blocks["logoup_push"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("存储当前坐标 (PUSH)");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.CONTROL);
      this.setTooltip("将当前三维游标坐标、姿态朝向与画笔状态压入堆栈");
    },
  };

  // 6. 恢复上次存储的坐标 (POP)
  Blockly.Blocks["logoup_pop"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("恢复上次存储的坐标 (POP)");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.CONTROL);
      this.setTooltip("从堆栈中恢复先前存储的三维游标坐标与姿态");
    },
  };

  // 7. 定义函数
  Blockly.Blocks["logoup_def_func"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("定义")
        .appendField(new Blockly.FieldTextInput("my_func"), "NAME")
        .appendField("(")
        .appendField(new Blockly.FieldTextInput(""), "PARAMS")
        .appendField(")");
      this.appendStatementInput("DO")
        .appendField("");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.CONTROL);
      this.setTooltip("定义一个可重复调用的自定义函数过程");
    },
  };

  // 8. 调用函数 (语句积木)
  Blockly.Blocks["logoup_call_func_stmt"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("调用")
        .appendField(new Blockly.FieldTextInput("my_func"), "NAME")
        .appendField("(")
        .appendField(new Blockly.FieldTextInput(""), "ARGS")
        .appendField(")");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.CONTROL);
      this.setTooltip("调用执行已定义的函数");
    },
  };

  // 9. 函数表达式 (返回值插头积木)
  Blockly.Blocks["logoup_call_func_expr"] = {
    init: function () {
      this.appendDummyInput()
        .appendField(new Blockly.FieldTextInput("my_func"), "NAME")
        .appendField("(")
        .appendField(new Blockly.FieldTextInput(""), "ARGS")
        .appendField(")");
      this.setOutput(true, null);
      this.setColour(LOGOUP_COLORS.CONTROL);
      this.setTooltip("调用函数并获取其返回值表达式");
    },
  };

  // 10. 定义变量 变量 = 表达式
  Blockly.Blocks["logoup_def_var"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("定义变量")
        .appendField(new Blockly.FieldTextInput("x"), "VAR")
        .appendField("=");
      this.appendValueInput("VALUE");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.CONTROL);
      this.setTooltip("声明变量并设置初始计算值");
    },
  };

  // 11. 赋值 变量 = 表达式
  Blockly.Blocks["logoup_set_var"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("赋值")
        .appendField(new Blockly.FieldTextInput("x"), "VAR")
        .appendField("=");
      this.appendValueInput("VALUE");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.CONTROL);
      this.setTooltip("给变量重新赋予新值");
    },
  };

  // 12. 返回 表达式
  Blockly.Blocks["logoup_return_val"] = {
    init: function () {
      this.appendValueInput("VALUE")
        .appendField("返回");
      this.setPreviousStatement(true, null);
      this.setColour(LOGOUP_COLORS.CONTROL);
      this.setTooltip("从当前函数返回指定表达式计算结果");
    },
  };

  // 13. 返回 (无返回值)
  Blockly.Blocks["logoup_return"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("返回");
      this.setPreviousStatement(true, null);
      this.setColour(LOGOUP_COLORS.CONTROL);
      this.setTooltip("提前退出当前函数执行");
    },
  };

  // 14. 布尔变量
  Blockly.Blocks["logoup_bool_var"] = {
    init: function () {
      this.appendDummyInput()
        .appendField(new Blockly.FieldTextInput("flag"), "VAR");
      this.setOutput(true, "Boolean");
      this.setColour(LOGOUP_COLORS.CONTROL);
      this.setTooltip("读取布尔变量状态");
    },
  };

  // 15. 常量 TRUE
  Blockly.Blocks["logoup_true"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("TRUE");
      this.setOutput(true, "Boolean");
      this.setColour(LOGOUP_COLORS.CONTROL);
      this.setTooltip("逻辑真值 (True)");
    },
  };

  // 16. 常量 FALSE
  Blockly.Blocks["logoup_false"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("FALSE");
      this.setOutput(true, "Boolean");
      this.setColour(LOGOUP_COLORS.CONTROL);
      this.setTooltip("逻辑假值 (False)");
    },
  };
}
