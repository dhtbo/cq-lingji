import * as Blockly from "blockly";
import { LOGOUP_COLORS } from "../types";

/**
 * LogoUp 3D 平面进阶积木 (Plane Advanced)
 */
export function registerLogoUpAdvanced2DBlocks() {
  // 1. 回到笔划起点 (CLOSE)
  Blockly.Blocks["logoup_close"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("回到笔划起点 (CLOSE)");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.ADVANCED_2D);
      this.setTooltip("画一条线回到落笔时的初始起点，使轮廓封闭");
    },
  };

  // 2. 笔画偏移 (OFFSET)
  Blockly.Blocks["logoup_offset"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("笔画偏移 (OFFSET)")
        .appendField(new Blockly.FieldNumber(1), "AMOUNT")
        .appendField("毫米");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.ADVANCED_2D);
      this.setTooltip("对当前绘制的草图轮廓进行等距偏置放大或缩小");
    },
  };

  // 3. 移动到坐标 (GOTO)
  Blockly.Blocks["logoup_goto"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("移动到坐标 (GOTO) (")
        .appendField(new Blockly.FieldNumber(15), "X")
        .appendField(",")
        .appendField(new Blockly.FieldNumber(15), "Y")
        .appendField(")");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.ADVANCED_2D);
      this.setTooltip("移动当前游标到草平面的指定局部坐标 (X, Y)");
    },
  };

  // 4. 旋转到 (TURNTO)
  Blockly.Blocks["logoup_turnto"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("旋转到 (TURNTO)")
        .appendField(new Blockly.FieldNumber(60, 0, 360), "ANGLE")
        .appendField("度");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.ADVANCED_2D);
      this.setTooltip("将当前游标旋转到绝对方位角");
    },
  };

  // 5. 设置 X 坐标 (SETX)
  Blockly.Blocks["logoup_setx"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("设置 X 坐标 (SETX) 为")
        .appendField(new Blockly.FieldNumber(10), "X")
        .appendField("毫米");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.ADVANCED_2D);
      this.setTooltip("单独设置游标在草图上的 X 轴位置");
    },
  };

  // 6. 设置 Y 坐标 (SETY)
  Blockly.Blocks["logoup_sety"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("设置 Y 坐标 (SETY) 为")
        .appendField(new Blockly.FieldNumber(10), "Y")
        .appendField("毫米");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.ADVANCED_2D);
      this.setTooltip("单独设置游标在草图上的 Y 轴位置");
    },
  };

  // 7. X 坐标值 (GETX) (数值汇报积木)
  Blockly.Blocks["logoup_getx"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("X 坐标值 (GETX)");
      this.setOutput(true, "Number");
      this.setColour(LOGOUP_COLORS.ADVANCED_2D);
      this.setTooltip("获取当前游标的 X 轴坐标数值");
    },
  };

  // 8. Y 坐标值 (GETY) (数值汇报积木)
  Blockly.Blocks["logoup_gety"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("Y 坐标值 (GETY)");
      this.setOutput(true, "Number");
      this.setColour(LOGOUP_COLORS.ADVANCED_2D);
      this.setTooltip("获取当前游标的 Y 轴坐标数值");
    },
  };

  // 9. 当前朝向 (GETH) (数值汇报积木)
  Blockly.Blocks["logoup_geth"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("当前朝向 (GETH)");
      this.setOutput(true, "Number");
      this.setColour(LOGOUP_COLORS.ADVANCED_2D);
      this.setTooltip("获取当前游标在平面上的绝对朝向角 (度)");
    },
  };

  // 10. 当前点填充 (FLOOD)
  Blockly.Blocks["logoup_flood"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("当前点填充 (FLOOD)");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.ADVANCED_2D);
      this.setTooltip("从当前坐标点向外泛洪填充当前轮廓");
    },
  };

  // 11. 仅清空草图 (CLEARSKETCH)
  Blockly.Blocks["logoup_clearsketch"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("仅清空草图 (CLEARSKETCH)");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.ADVANCED_2D);
      this.setTooltip("仅清除当前未完成的草图轮廓，保留已生成的实体");
    },
  };

  // 12. 文字印章 (TXTSTAMP)
  Blockly.Blocks["logoup_txtstamp"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("文字印章 (TXTSTAMP) 文字")
        .appendField(new Blockly.FieldTextInput("LogoUp"), "TEXT");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.ADVANCED_2D);
      this.setTooltip("在当前草图位置盖上指定文字");
    },
  };

  // 13. 文字印章加强版 (TXTSTAMPEX)
  Blockly.Blocks["logoup_txtstampex"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("文字印章 (TXTSTAMPEX) 文字")
        .appendField(new Blockly.FieldTextInput("LogoUp"), "TEXT")
        .appendField("大小")
        .appendField(new Blockly.FieldNumber(10, 1), "SIZE");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.ADVANCED_2D);
      this.setTooltip("盖上指定文字与字号");
    },
  };

  // 14. 加载图片 (IMGLOAD)
  Blockly.Blocks["logoup_imgload"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("加载图片 (IMGLOAD) 图片路径")
        .appendField(new Blockly.FieldTextInput("apple"), "PATH");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.ADVANCED_2D);
      this.setTooltip("加载一张参考图片用于草图采样");
    },
  };

  // 15. 图片比例放缩到 (IMGSCALE)
  Blockly.Blocks["logoup_imgscale"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("图片比例放缩到 (IMGSCALE)")
        .appendField(new Blockly.FieldNumber(1, 0.01), "SCALE");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.ADVANCED_2D);
      this.setTooltip("按比例放缩参考图片");
    },
  };

  // 16. 图片区间采样 (IMGSTAMP)
  Blockly.Blocks["logoup_imgstamp"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("图片区间采样 (IMGSTAMP) [")
        .appendField(new Blockly.FieldNumber(0), "MIN_VAL")
        .appendField(",")
        .appendField(new Blockly.FieldNumber(250), "MAX_VAL")
        .appendField("]");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.ADVANCED_2D);
      this.setTooltip("按灰度范围对图片进行轮廓采样");
    },
  };

  // 17. 卸载图片 (IMGUNLOAD)
  Blockly.Blocks["logoup_imgunload"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("卸载图片 (IMGUNLOAD)");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.ADVANCED_2D);
      this.setTooltip("清理当前加载的参考图片");
    },
  };
}
