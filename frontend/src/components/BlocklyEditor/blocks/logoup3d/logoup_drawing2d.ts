import * as Blockly from "blockly";
import { LOGOUP_COLORS } from "../types";

/**
 * LogoUp 3D 平面绘图积木 (Plane Drawing)
 */
export function registerLogoUpDrawing2DBlocks() {
  // 1. 向前移动 (GO)
  Blockly.Blocks["logoup_go"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("向前移动 (GO)")
        .appendField(new Blockly.FieldNumber(10), "DISTANCE")
        .appendField("毫米");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.DRAWING_2D);
      this.setTooltip("在当前草平面内沿前进方向移动指定距离");
    },
  };

  // 2. 顺时针旋转 (TURN)
  Blockly.Blocks["logoup_turn"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("顺时针旋转 (TURN) ↷")
        .appendField(new Blockly.FieldNumber(15, -360, 360), "ANGLE")
        .appendField("度");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.DRAWING_2D);
      this.setTooltip("在当前草平面内顺时针偏转指定角度");
    },
  };

  // 3. 逆时针旋转 (TURNLEFT)
  Blockly.Blocks["logoup_turn_left"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("逆时针旋转 (TURNLEFT) ↺")
        .appendField(new Blockly.FieldNumber(15, -360, 360), "ANGLE")
        .appendField("度");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.DRAWING_2D);
      this.setTooltip("在当前草平面内逆时针偏转指定角度");
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
      this.appendDummyInput()
        .appendField("笔画宽度 (WIDTH)")
        .appendField(new Blockly.FieldNumber(1, 0.1, 100), "WIDTH")
        .appendField("毫米");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.DRAWING_2D);
      this.setTooltip("设置绘图笔画线宽");
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
