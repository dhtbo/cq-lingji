import * as Blockly from "blockly";
import { LOGOUP_COLORS } from "../types";

/**
 * LogoUp 3D 三维进阶积木 (3D Advanced Features & Transformations)
 * 支持通过 ValueInput 接入变量、数学计算或数值阴影块
 */
export function registerLogoUpAdvanced3DBlocks() {
  // 1. 三维游标移动到 (MOVETO) (X, Y, Z)
  Blockly.Blocks["logoup_moveto"] = {
    init: function () {
      this.appendDummyInput().appendField("三维游标移动到 (MOVETO)");
      this.appendValueInput("X").setCheck(null).appendField("X");
      this.appendValueInput("Y").setCheck(null).appendField("Y");
      this.appendValueInput("Z").setCheck(null).appendField("Z");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.ADVANCED_3D);
      this.setTooltip("将三维空间游标移动到绝对坐标点 (X, Y, Z) (支持变量或数值)");
    },
  };

  // 2. 三维游标 X 方向移动到 (MOVEXTO)
  Blockly.Blocks["logoup_movexto"] = {
    init: function () {
      this.appendDummyInput().appendField("三维游标 X 方向移动到 (MOVEXTO)");
      this.appendValueInput("X").setCheck(null).appendField("X");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.ADVANCED_3D);
      this.setTooltip("单独设置游标在世界坐标系下的绝对 X 坐标 (支持变量或数值)");
    },
  };

  // 3. 三维游标 Y 方向移动到 (MOVEYTO)
  Blockly.Blocks["logoup_moveyto"] = {
    init: function () {
      this.appendDummyInput().appendField("三维游标 Y 方向移动到 (MOVEYTO)");
      this.appendValueInput("Y").setCheck(null).appendField("Y");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.ADVANCED_3D);
      this.setTooltip("单独设置游标在世界坐标系下的绝对 Y 坐标 (支持变量或数值)");
    },
  };

  // 4. 三维游标 Z 方向移动到 (MOVEZTO)
  Blockly.Blocks["logoup_movezto"] = {
    init: function () {
      this.appendDummyInput().appendField("三维游标 Z 方向移动到 (MOVEZTO)");
      this.appendValueInput("Z").setCheck(null).appendField("Z");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.ADVANCED_3D);
      this.setTooltip("单独设置游标在世界坐标系下的绝对 Z 坐标 (支持变量或数值)");
    },
  };

  // 5. 水平方向设为 (YAWTO)
  Blockly.Blocks["logoup_yawto"] = {
    init: function () {
      this.appendDummyInput().appendField("水平方向设为 (YAWTO)");
      this.appendValueInput("ANGLE").setCheck(null).appendField("方位角");
      this.appendDummyInput().appendField("度");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.ADVANCED_3D);
      this.setTooltip("将游标水平朝向锁定为绝对度数 (支持变量或数值)");
    },
  };

  // 6. 俯仰角度设为 (PITCHTO)
  Blockly.Blocks["logoup_pitchto"] = {
    init: function () {
      this.appendDummyInput().appendField("俯仰角度设为 (PITCHTO)");
      this.appendValueInput("ANGLE").setCheck(null).appendField("方位角");
      this.appendDummyInput().appendField("度");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.ADVANCED_3D);
      this.setTooltip("将游标俯仰朝向锁定为绝对度数 (支持变量或数值)");
    },
  };

  // 7. 自身旋转设为 (ROLLTO)
  Blockly.Blocks["logoup_rollto"] = {
    init: function () {
      this.appendDummyInput().appendField("自身旋转设为 (ROLLTO)");
      this.appendValueInput("ANGLE").setCheck(null).appendField("方位角");
      this.appendDummyInput().appendField("度");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.ADVANCED_3D);
      this.setTooltip("将游标横滚轴向锁定为绝对度数 (支持变量或数值)");
    },
  };

  // 8. 草图 X 方向放缩至 (SCALEX)
  Blockly.Blocks["logoup_scalex"] = {
    init: function () {
      this.appendDummyInput().appendField("草图 X 方向放缩至 (SCALEX)");
      this.appendValueInput("FACTOR").setCheck(null).appendField("比例");
      this.appendDummyInput().appendField("倍");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.ADVANCED_3D);
      this.setTooltip("沿草图局部 X 轴单向放缩草图截面 (支持变量或数值)");
    },
  };

  // 9. 草图 Y 方向放缩至 (SCALEY)
  Blockly.Blocks["logoup_scaley"] = {
    init: function () {
      this.appendDummyInput().appendField("草图 Y 方向放缩至 (SCALEY)");
      this.appendValueInput("FACTOR").setCheck(null).appendField("比例");
      this.appendDummyInput().appendField("倍");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.ADVANCED_3D);
      this.setTooltip("沿草图局部 Y 轴单向放缩草图截面 (支持变量或数值)");
    },
  };

  // 10. 草图法向变化 (NORMAL)
  Blockly.Blocks["logoup_normal"] = {
    init: function () {
      this.appendDummyInput().appendField("草图法向变化 (NORMAL)");
      this.appendValueInput("DX").setCheck(null).appendField("DX");
      this.appendValueInput("DY").setCheck(null).appendField("DY");
      this.appendDummyInput().appendField("度");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.ADVANCED_3D);
      this.setTooltip("倾斜当前草平面的法线朝向 (支持变量或数值)");
    },
  };

  // 11. 草图法向变化到 (NORMALTO)
  Blockly.Blocks["logoup_normalto"] = {
    init: function () {
      this.appendDummyInput().appendField("草图法向变化到 (NORMALTO)");
      this.appendValueInput("NX").setCheck(null).appendField("NX");
      this.appendValueInput("NY").setCheck(null).appendField("NY");
      this.appendDummyInput().appendField("度");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.ADVANCED_3D);
      this.setTooltip("将当前草平面的法向设定为绝对倾角 (支持变量或数值)");
    },
  };

  // 12. 按草图 x 轴旋转 (ROTATEX)
  Blockly.Blocks["logoup_rotatex"] = {
    init: function () {
      this.appendDummyInput().appendField("按草图 x 轴旋转 (ROTATEX)");
      this.appendValueInput("ANGLE").setCheck(null).appendField("偏转");
      this.appendDummyInput().appendField("度");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.ADVANCED_3D);
      this.setTooltip("绕草图局部 X 轴旋转基准面 (支持变量或数值)");
    },
  };

  // 13. 按草图 y 轴旋转 (ROTATEY)
  Blockly.Blocks["logoup_rotatey"] = {
    init: function () {
      this.appendDummyInput().appendField("按草图 y 轴旋转 (ROTATEY)");
      this.appendValueInput("ANGLE").setCheck(null).appendField("偏转");
      this.appendDummyInput().appendField("度");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.ADVANCED_3D);
      this.setTooltip("绕草图局部 Y 轴旋转基准面 (支持变量或数值)");
    },
  };

  // 14. 按草图 z 轴旋转 (ROTATEZ)
  Blockly.Blocks["logoup_rotatez"] = {
    init: function () {
      this.appendDummyInput().appendField("按草图 z 轴旋转 (ROTATEZ)");
      this.appendValueInput("ANGLE").setCheck(null).appendField("偏转");
      this.appendDummyInput().appendField("度");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.ADVANCED_3D);
      this.setTooltip("绕草图局部 Z 轴旋转基准面 (支持变量或数值)");
    },
  };

  // 15. 草图面 x 轴歪曲 (WARPX)
  Blockly.Blocks["logoup_warpx"] = {
    init: function () {
      this.appendDummyInput().appendField("草图面 x 轴歪曲 (WARPX)");
      this.appendValueInput("ANGLE").setCheck(null).appendField("角度");
      this.appendDummyInput().appendField("度");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.ADVANCED_3D);
      this.setTooltip("沿 X 轴方向对草图面进行剪切扭曲 (支持变量或数值)");
    },
  };

  // 16. 草图面 y 轴歪曲 (WARPY)
  Blockly.Blocks["logoup_warpy"] = {
    init: function () {
      this.appendDummyInput().appendField("草图面 y 轴歪曲 (WARPY)");
      this.appendValueInput("ANGLE").setCheck(null).appendField("角度");
      this.appendDummyInput().appendField("度");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.ADVANCED_3D);
      this.setTooltip("沿 Y 轴方向对草图面进行剪切扭曲 (支持变量或数值)");
    },
  };

  // 17. 拉伸 (EXTRUDE)
  Blockly.Blocks["logoup_extrude"] = {
    init: function () {
      this.appendDummyInput().appendField("🚀 拉伸 (EXTRUDE)");
      this.appendValueInput("HEIGHT").setCheck(null).appendField("高度");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.ADVANCED_3D);
      this.setTooltip("将当前草图沿法向向上拉伸生成 3D 实体 (支持变量或数值)");
    },
  };

  // 18. 双向拉伸 (CEXTRUDE)
  Blockly.Blocks["logoup_cextrude"] = {
    init: function () {
      this.appendDummyInput().appendField("双向拉伸 (CEXTRUDE)");
      this.appendValueInput("HEIGHT").setCheck(null).appendField("高度");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.ADVANCED_3D);
      this.setTooltip("沿法向正反双向对称拉伸草图 (支持变量或数值)");
    },
  };

  // 19. 锥拉伸 (PYRAMID)
  Blockly.Blocks["logoup_pyramid"] = {
    init: function () {
      this.appendDummyInput().appendField("锥拉伸 (PYRAMID)");
      this.appendValueInput("HEIGHT").setCheck(null).appendField("高度");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.ADVANCED_3D);
      this.setTooltip("按锥角渐缩拉伸草图形成棱锥体 (支持变量或数值)");
    },
  };

  // 20. 挖槽 (CAVE)
  Blockly.Blocks["logoup_cave"] = {
    init: function () {
      this.appendDummyInput().appendField("挖槽 (CAVE)");
      this.appendValueInput("DEPTH").setCheck(null).appendField("深度");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.ADVANCED_3D);
      this.setTooltip("沿法向反向向内切削挖孔 (支持变量或数值)");
    },
  };
}
