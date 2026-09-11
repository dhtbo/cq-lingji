import * as Blockly from "blockly";
import { LOGOUP_COLORS } from "../types";

/**
 * LogoUp 3D 数学运算与逻辑比较积木体系 (完全对标原生 LogoUp3D 鲜明翠绿数学体系)
 */
export function registerLogoUpMathBlocks() {
  // 1. 加法运算 (+)
  Blockly.Blocks["logoup_add"] = {
    init: function () {
      this.appendValueInput("A").setCheck("Number");
      this.appendDummyInput().appendField("+");
      this.appendValueInput("B").setCheck("Number");
      this.setInputsInline(true);
      this.setOutput(true, "Number");
      this.setColour(LOGOUP_COLORS.MATH);
      this.setTooltip("加法计算两个数值的和");
    },
  };

  // 2. 减法运算 (-)
  Blockly.Blocks["logoup_sub"] = {
    init: function () {
      this.appendValueInput("A").setCheck("Number");
      this.appendDummyInput().appendField("-");
      this.appendValueInput("B").setCheck("Number");
      this.setInputsInline(true);
      this.setOutput(true, "Number");
      this.setColour(LOGOUP_COLORS.MATH);
      this.setTooltip("减法计算两个数值的差");
    },
  };

  // 3. 乘法运算 (*)
  Blockly.Blocks["logoup_mul"] = {
    init: function () {
      this.appendValueInput("A").setCheck("Number");
      this.appendDummyInput().appendField("*");
      this.appendValueInput("B").setCheck("Number");
      this.setInputsInline(true);
      this.setOutput(true, "Number");
      this.setColour(LOGOUP_COLORS.MATH);
      this.setTooltip("乘法计算两个数值的乘积");
    },
  };

  // 4. 除法运算 (/)
  Blockly.Blocks["logoup_div"] = {
    init: function () {
      this.appendValueInput("A").setCheck("Number");
      this.appendDummyInput().appendField("/");
      this.appendValueInput("B").setCheck("Number");
      this.setInputsInline(true);
      this.setOutput(true, "Number");
      this.setColour(LOGOUP_COLORS.MATH);
      this.setTooltip("除法计算两个数值的商");
    },
  };

  // 5. 小于比较 (<)
  Blockly.Blocks["logoup_lt"] = {
    init: function () {
      this.appendValueInput("A");
      this.appendDummyInput().appendField("<");
      this.appendValueInput("B");
      this.setInputsInline(true);
      this.setOutput(true, "Boolean");
      this.setColour(LOGOUP_COLORS.MATH);
      this.setTooltip("判断左边数值是否小于右边数值");
    },
  };

  // 6. 小于等于比较 (<=)
  Blockly.Blocks["logoup_lte"] = {
    init: function () {
      this.appendValueInput("A");
      this.appendDummyInput().appendField("<=");
      this.appendValueInput("B");
      this.setInputsInline(true);
      this.setOutput(true, "Boolean");
      this.setColour(LOGOUP_COLORS.MATH);
      this.setTooltip("判断左边数值是否小于等于右边数值");
    },
  };

  // 7. 相等比较 (=)
  Blockly.Blocks["logoup_eq"] = {
    init: function () {
      this.appendValueInput("A");
      this.appendDummyInput().appendField("=");
      this.appendValueInput("B");
      this.setInputsInline(true);
      this.setOutput(true, "Boolean");
      this.setColour(LOGOUP_COLORS.MATH);
      this.setTooltip("判断两个数值或表达式是否相等");
    },
  };

  // 8. 不等于比较 (不等于)
  Blockly.Blocks["logoup_neq"] = {
    init: function () {
      this.appendValueInput("A");
      this.appendDummyInput().appendField("不等于");
      this.appendValueInput("B");
      this.setInputsInline(true);
      this.setOutput(true, "Boolean");
      this.setColour(LOGOUP_COLORS.MATH);
      this.setTooltip("判断两个数值或表达式是否不相等");
    },
  };

  // 9. 大于等于比较 (>=)
  Blockly.Blocks["logoup_gte"] = {
    init: function () {
      this.appendValueInput("A");
      this.appendDummyInput().appendField(">=");
      this.appendValueInput("B");
      this.setInputsInline(true);
      this.setOutput(true, "Boolean");
      this.setColour(LOGOUP_COLORS.MATH);
      this.setTooltip("判断左边数值是否大于等于右边数值");
    },
  };

  // 10. 大于比较 (>)
  Blockly.Blocks["logoup_gt"] = {
    init: function () {
      this.appendValueInput("A");
      this.appendDummyInput().appendField(">");
      this.appendValueInput("B");
      this.setInputsInline(true);
      this.setOutput(true, "Boolean");
      this.setColour(LOGOUP_COLORS.MATH);
      this.setTooltip("判断左边数值是否大于右边数值");
    },
  };

  // 11. 逻辑与 (与)
  Blockly.Blocks["logoup_and"] = {
    init: function () {
      this.appendValueInput("A").setCheck("Boolean");
      this.appendDummyInput().appendField("与");
      this.appendValueInput("B").setCheck("Boolean");
      this.setInputsInline(true);
      this.setOutput(true, "Boolean");
      this.setColour(LOGOUP_COLORS.MATH);
      this.setTooltip("当两边条件同时成立时返回真 (AND)");
    },
  };

  // 12. 逻辑或 (或)
  Blockly.Blocks["logoup_or"] = {
    init: function () {
      this.appendValueInput("A").setCheck("Boolean");
      this.appendDummyInput().appendField("或");
      this.appendValueInput("B").setCheck("Boolean");
      this.setInputsInline(true);
      this.setOutput(true, "Boolean");
      this.setColour(LOGOUP_COLORS.MATH);
      this.setTooltip("当任一条件成立时返回真 (OR)");
    },
  };

  // 13. 逻辑非 (不是)
  Blockly.Blocks["logoup_not"] = {
    init: function () {
      this.appendDummyInput().appendField("不是");
      this.appendValueInput("BOOL").setCheck("Boolean");
      this.setInputsInline(true);
      this.setOutput(true, "Boolean");
      this.setColour(LOGOUP_COLORS.MATH);
      this.setTooltip("取相反布尔值 (NOT)");
    },
  };

  // 14. 取余数 (除以 ... 的余数)
  Blockly.Blocks["logoup_mod"] = {
    init: function () {
      this.appendValueInput("A").setCheck("Number");
      this.appendDummyInput().appendField("除以");
      this.appendValueInput("B").setCheck("Number");
      this.appendDummyInput().appendField("的余数");
      this.setInputsInline(true);
      this.setOutput(true, "Number");
      this.setColour(LOGOUP_COLORS.MATH);
      this.setTooltip("计算两个数整除后的余数 (模运算)");
    },
  };
}
