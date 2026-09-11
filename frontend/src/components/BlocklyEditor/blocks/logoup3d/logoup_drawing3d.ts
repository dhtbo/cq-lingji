import * as Blockly from "blockly";
import { LOGOUP_COLORS } from "../types";

/**
 * LogoUp 3D 三维绘图积木 (3D Drawing & Cursor Control)
 */
export function registerLogoUpDrawing3DBlocks() {
  // 1. 向上移动 (UP)
  Blockly.Blocks["logoup_up"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("向上移动 (UP)")
        .appendField(new Blockly.FieldNumber(10), "DISTANCE")
        .appendField("毫米");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.DRAWING_3D);
      this.setTooltip("沿当前草图平面的垂直法向 (Z轴) 向上移动游标");
    },
  };

  // 2. 开始三维实体 (BODY)
  Blockly.Blocks["logoup_body"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("🧱 开始三维实体 (BODY)");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.DRAWING_3D);
      this.setTooltip("开始构建一个新的三维实体构件");
    },
  };

  // 3. 完成当前图形 (DONE - 3D别名)
  Blockly.Blocks["logoup_done_3d"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("✅ 完成当前图形 (DONE)");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.DRAWING_3D);
      this.setTooltip("结束当前草图绘制或实体构建");
    },
  };

  // 4. 三维游标回到原点 (RESET)
  Blockly.Blocks["logoup_reset"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("🎯 三维游标回到原点 (RESET)");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.DRAWING_3D);
      this.setTooltip("复位三维游标位置与姿态到世界原点");
    },
  };

  // 5. 实体颜色 (COLOR)
  Blockly.Blocks["logoup_color"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("🎨 实体颜色 (COLOR)")
        .appendField(new Blockly.FieldDropdown([
          ["品红色", "品红色"],
          ["蓝色", "蓝色"],
          ["翠绿", "翠绿"],
          ["红色", "红色"],
          ["黄色", "黄色"],
          ["紫色", "紫色"],
          ["橙色", "橙色"],
          ["青色", "青色"],
          ["黑色", "黑色"],
          ["白色", "白色"],
        ]), "COLOR");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.DRAWING_3D);
      this.setTooltip("设置当前实体的着色渲染颜色");
    },
  };

  // 6. 草图缩放至 (SCALE)
  Blockly.Blocks["logoup_scale"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("草图缩放至 (SCALE)")
        .appendField(new Blockly.FieldNumber(1.5, 0.01), "FACTOR")
        .appendField("倍");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.DRAWING_3D);
      this.setTooltip("按指定比例缩放当前工作平面的草图截面");
    },
  };

  // 7. 水平方向摆动 (YAW)
  Blockly.Blocks["logoup_yaw"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("水平方向摆动 (YAW)")
        .appendField(new Blockly.FieldNumber(15, -360, 360), "ANGLE")
        .appendField("度");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.DRAWING_3D);
      this.setTooltip("绕当前天顶轴进行偏航旋转 (水平摆动)");
    },
  };

  // 8. 俯仰角度摆动 (PITCH)
  Blockly.Blocks["logoup_pitch"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("俯仰角度摆动 (PITCH)")
        .appendField(new Blockly.FieldNumber(15, -360, 360), "ANGLE")
        .appendField("度");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.DRAWING_3D);
      this.setTooltip("绕当前横轴进行俯仰旋转 (上下仰俯)");
    },
  };

  // 9. 绕自身旋转 (ROLL)
  Blockly.Blocks["logoup_roll"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("绕自身旋转 (ROLL)")
        .appendField(new Blockly.FieldNumber(15, -360, 360), "ANGLE")
        .appendField("度");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.DRAWING_3D);
      this.setTooltip("绕自身前进主轴进行滚转旋转");
    },
  };

  // 10. 向上跳跃 (JUMP)
  Blockly.Blocks["logoup_jump"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("向上跳跃 (JUMP)")
        .appendField(new Blockly.FieldNumber(10), "DISTANCE")
        .appendField("毫米");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.DRAWING_3D);
      this.setTooltip("沿法向向上瞬移距离 (不产生拉伸实体)");
    },
  };

  // 11. 连接形状到当前草图 (LINK)
  Blockly.Blocks["logoup_link"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("🔗 连接形状到当前草图 (LINK)");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.DRAWING_3D);
      this.setTooltip("平滑放样连接上一草图截面与当前草图截面");
    },
  };

  // 12. 三维游标坐标增加 (MOVE)
  Blockly.Blocks["logoup_move"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("三维游标坐标增加 (MOVE)")
        .appendField(new Blockly.FieldNumber(10), "DX")
        .appendField(",")
        .appendField(new Blockly.FieldNumber(10), "DY")
        .appendField(",")
        .appendField(new Blockly.FieldNumber(10), "DZ")
        .appendField("毫米");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.DRAWING_3D);
      this.setTooltip("在世界坐标系下对游标进行增量平移 (DX, DY, DZ)");
    },
  };

  // 13. 草平面平移 (SHIFT)
  Blockly.Blocks["logoup_shift"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("草平面平移 (SHIFT)")
        .appendField(new Blockly.FieldNumber(10), "DX")
        .appendField(",")
        .appendField(new Blockly.FieldNumber(10), "DY")
        .appendField("毫米");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.DRAWING_3D);
      this.setTooltip("在草图局部平面内平移工作基准面");
    },
  };

  // 14. 抠除模式 (SUBTRACT)
  Blockly.Blocks["logoup_subtract"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("✂️ 抠除模式 (SUBTRACT)")
        .appendField(new Blockly.FieldDropdown([
          ["启用", "ENABLE"],
          ["停用", "DISABLE"],
        ]), "MODE");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.DRAWING_3D);
      this.setTooltip("开启布尔差集扣除模式：后续生成的实体将从主模型中挖空扣除");
    },
  };
}
