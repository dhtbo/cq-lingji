import * as Blockly from "blockly";
import { LOGOUP_COLORS } from "../types";

/**
 * LogoUp 3D 平面绘图积木 (Plane Drawing)
 * 支持通过 ValueInput 接入变量、数学计算或数值阴影块
 */
export function registerLogoUpDrawing2DBlocks() {
  // 1. 向前移动 (GO)
  Blockly.Blocks["logoup_go"] = {
    init: function () {
      this.appendDummyInput().appendField("向前移动 (GO)");
      this.appendValueInput("DISTANCE").setCheck(null).appendField("距离");
      this.appendDummyInput().appendField("毫米");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.DRAWING_2D);
      this.setTooltip("在当前草平面内沿前进方向移动指定距离 (支持变量或数值)");
    },
  };

  // 2. 顺时针旋转 (TURN)
  Blockly.Blocks["logoup_turn"] = {
    init: function () {
      this.appendDummyInput().appendField("顺时针旋转 (TURN) ↷");
      this.appendValueInput("ANGLE").setCheck(null).appendField("偏转");
      this.appendDummyInput().appendField("度");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.DRAWING_2D);
      this.setTooltip("在当前草平面内顺时针偏转指定角度 (支持变量或数值)");
    },
  };

  // 3. 逆时针旋转 (TURNLEFT)
  Blockly.Blocks["logoup_turn_left"] = {
    init: function () {
      this.appendDummyInput().appendField("逆时针旋转 (TURNLEFT) ↺");
      this.appendValueInput("ANGLE").setCheck(null).appendField("偏转");
      this.appendDummyInput().appendField("度");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.DRAWING_2D);
      this.setTooltip("在当前草平面内逆时针偏转指定角度 (支持变量或数值)");
    },
  };

  // 4. 开始落笔绘图 (DRAW)
  Blockly.Blocks["logoup_draw"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("✏️ 开始落笔绘图 (DRAW)");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.DRAWING_2D);
      this.setTooltip("开启画笔绘制记录，移动将形成封闭或开放路径");
    },
  };

  // 5. 完成当前图形 (DONE)
  Blockly.Blocks["logoup_done"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("✅ 完成当前图形 (DONE)");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.DRAWING_2D);
      this.setTooltip("结束当前绘制，形成封闭平面用于拉伸为三维实体");
    },
  };

  // 6. 填充上笔的环 (FILL)
  Blockly.Blocks["logoup_fill"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("🎨 填充上笔的环 (FILL)");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.DRAWING_2D);
      this.setTooltip("将封闭线条区域填充为二维平面");
    },
  };

  // 7. 笔画宽度 (WIDTH)
  Blockly.Blocks["logoup_width"] = {
    init: function () {
      this.appendDummyInput().appendField("笔画宽度 (WIDTH)");
      this.appendValueInput("WIDTH").setCheck(null).appendField("线宽");
      this.appendDummyInput().appendField("毫米");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.DRAWING_2D);
      this.setTooltip("设置绘图笔画线宽 (支持变量或数值)");
    },
  };

  // 8. 清空重置草图 (CLEAR)
  Blockly.Blocks["logoup_clear"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("🧹 清空重置草图 (CLEAR)");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.DRAWING_2D);
      this.setTooltip("清空当前工作平面上的草图与路径");
    },
  };

  // 9. 回到原点 (HOME)
  Blockly.Blocks["logoup_home"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("🏠 回到原点 (HOME)");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.DRAWING_2D);
      this.setTooltip("将游标位置与朝向复位到世界原点");
    },
  };

  // 10. 笔擦模式 (ERASE)
  Blockly.Blocks["logoup_erase"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("🧽 笔擦模式 (ERASE)")
        .appendField(new Blockly.FieldDropdown([
          ["启用", "ENABLE"],
          ["停用", "DISABLE"],
        ]), "MODE");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.DRAWING_2D);
      this.setTooltip("开启后移动将擦除轨迹");
    },
  };
}
