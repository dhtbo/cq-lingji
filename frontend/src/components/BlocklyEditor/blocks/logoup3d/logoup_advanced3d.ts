import * as Blockly from "blockly";
import { LOGOUP_COLORS } from "../types";

/**
 * LogoUp 3D 三维进阶积木 (3D Advanced Features & Transformations)
 */
export function registerLogoUpAdvanced3DBlocks() {
  // 1. 三维游标移动到 (MOVETO)
  Blockly.Blocks["logoup_moveto"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("三维游标移动到 (MOVETO) (")
        .appendField(new Blockly.FieldNumber(10), "X")
        .appendField(",")
        .appendField(new Blockly.FieldNumber(10), "Y")
        .appendField(",")
        .appendField(new Blockly.FieldNumber(10), "Z")
        .appendField(")");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.ADVANCED_3D);
      this.setTooltip("将三维空间游标移动到绝对坐标点 (X, Y, Z)");
    },
  };

  // 2. 三维游标 X 方向移动到 (MOVEXTO)
  Blockly.Blocks["logoup_movexto"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("三维游标 X 方向移动到 (MOVEXTO)")
        .appendField(new Blockly.FieldNumber(10), "X");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.ADVANCED_3D);
      this.setTooltip("单独设置游标在世界坐标系下的绝对 X 坐标");
    },
  };

  // 3. 三维游标 Y 方向移动到 (MOVEYTO)
  Blockly.Blocks["logoup_moveyto"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("三维游标 Y 方向移动到 (MOVEYTO)")
        .appendField(new Blockly.FieldNumber(10), "Y");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.ADVANCED_3D);
      this.setTooltip("单独设置游标在世界坐标系下的绝对 Y 坐标");
    },
  };

  // 4. 三维游标 Z 方向移动到 (MOVEZTO)
  Blockly.Blocks["logoup_movezto"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("三维游标 Z 方向移动到 (MOVEZTO)")
        .appendField(new Blockly.FieldNumber(10), "Z");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.ADVANCED_3D);
      this.setTooltip("单独设置游标在世界坐标系下的绝对 Z 坐标");
    },
  };

  // 5. 水平方向设为 (YAWTO)
  Blockly.Blocks["logoup_yawto"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("水平方向设为 (YAWTO)")
        .appendField(new Blockly.FieldNumber(15, 0, 360), "ANGLE")
        .appendField("度方位");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.ADVANCED_3D);
      this.setTooltip("将游标水平朝向锁定为绝对度数");
    },
  };

  // 6. 俯仰角度设为 (PITCHTO)
  Blockly.Blocks["logoup_pitchto"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("俯仰角度设为 (PITCHTO)")
        .appendField(new Blockly.FieldNumber(15, -90, 90), "ANGLE")
        .appendField("度方位");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.ADVANCED_3D);
      this.setTooltip("将游标俯仰朝向锁定为绝对度数");
    },
  };

  // 7. 自身旋转设为 (ROLLTO)
  Blockly.Blocks["logoup_rollto"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("自身旋转设为 (ROLLTO)")
        .appendField(new Blockly.FieldNumber(15, 0, 360), "ANGLE")
        .appendField("度方位");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.ADVANCED_3D);
      this.setTooltip("将游标横滚轴向锁定为绝对度数");
    },
  };

  // 8. 草图 X 方向放缩至 (SCALEX)
  Blockly.Blocks["logoup_scalex"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("草图 X 方向放缩至 (SCALEX)")
        .appendField(new Blockly.FieldNumber(1.5, 0.01), "FACTOR")
        .appendField("倍");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.ADVANCED_3D);
      this.setTooltip("沿草图局部 X 轴单向放缩草图截面");
    },
  };

  // 9. 草图 Y 方向放缩至 (SCALEY)
  Blockly.Blocks["logoup_scaley"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("草图 Y 方向放缩至 (SCALEY)")
        .appendField(new Blockly.FieldNumber(1.5, 0.01), "FACTOR")
        .appendField("倍");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.ADVANCED_3D);
      this.setTooltip("沿草图局部 Y 轴单向放缩草图截面");
    },
  };

  // 10. 草图法向变化 (NORMAL)
  Blockly.Blocks["logoup_normal"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("草图法向变化 (NORMAL)")
        .appendField(new Blockly.FieldNumber(15), "DX")
        .appendField(",")
        .appendField(new Blockly.FieldNumber(15), "DY")
        .appendField("度");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.ADVANCED_3D);
      this.setTooltip("倾斜当前草平面的法线朝向");
    },
  };

  // 11. 草图法向变化到 (NORMALTO)
  Blockly.Blocks["logoup_normalto"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("草图法向变化到 (NORMALTO)")
        .appendField(new Blockly.FieldNumber(15), "NX")
        .appendField(",")
        .appendField(new Blockly.FieldNumber(15), "NY")
        .appendField("度");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.ADVANCED_3D);
      this.setTooltip("将当前草平面的法向设定为绝对倾角");
    },
  };

  // 12. 按草图 x 轴旋转 (ROTATEX)
  Blockly.Blocks["logoup_rotatex"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("按草图 x 轴旋转 (ROTATEX)")
        .appendField(new Blockly.FieldNumber(10, -360, 360), "ANGLE")
        .appendField("度");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.ADVANCED_3D);
      this.setTooltip("绕草图局部 X 轴旋转基准面");
    },
  };

  // 13. 按草图 y 轴旋转 (ROTATEY)
  Blockly.Blocks["logoup_rotatey"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("按草图 y 轴旋转 (ROTATEY)")
        .appendField(new Blockly.FieldNumber(10, -360, 360), "ANGLE")
        .appendField("度");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.ADVANCED_3D);
      this.setTooltip("绕草图局部 Y 轴旋转基准面");
    },
  };

  // 14. 按草图 z 轴旋转 (ROTATEZ)
  Blockly.Blocks["logoup_rotatez"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("按草图 z 轴旋转 (ROTATEZ)")
        .appendField(new Blockly.FieldNumber(10, -360, 360), "ANGLE")
        .appendField("度");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.ADVANCED_3D);
      this.setTooltip("绕草图局部 Z 轴旋转基准面");
    },
  };

  // 15. 草图面 x 轴歪曲 (WARPX)
  Blockly.Blocks["logoup_warpx"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("草图面 x 轴歪曲 (WARPX)")
        .appendField(new Blockly.FieldNumber(50, -89, 89), "ANGLE")
        .appendField("度");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.ADVANCED_3D);
      this.setTooltip("沿 X 轴方向对草图面进行剪切扭曲");
    },
  };

  // 16. 草图面 y 轴歪曲 (WARPY)
  Blockly.Blocks["logoup_warpy"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("草图面 y 轴歪曲 (WARPY)")
        .appendField(new Blockly.FieldNumber(50, -89, 89), "ANGLE")
        .appendField("度");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.ADVANCED_3D);
      this.setTooltip("沿 Y 轴方向对草图面进行剪切扭曲");
    },
  };

  // 17. 拉伸 (EXTRUDE)
  Blockly.Blocks["logoup_extrude"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("🚀 拉伸 (EXTRUDE) 高")
        .appendField(new Blockly.FieldNumber(10), "HEIGHT");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.ADVANCED_3D);
      this.setTooltip("将当前草图沿法向向上拉伸生成 3D 实体");
    },
  };

  // 18. 双向拉伸 (CEXTRUDE)
  Blockly.Blocks["logoup_cextrude"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("双向拉伸 (CEXTRUDE) 高")
        .appendField(new Blockly.FieldNumber(10), "HEIGHT");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.ADVANCED_3D);
      this.setTooltip("沿法向正反双向对称拉伸草图");
    },
  };

  // 19. 锥拉伸 (PYRAMID)
  Blockly.Blocks["logoup_pyramid"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("锥拉伸 (PYRAMID) 高")
        .appendField(new Blockly.FieldNumber(10), "HEIGHT");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.ADVANCED_3D);
      this.setTooltip("按锥角渐缩拉伸草图形成棱锥体");
    },
  };

  // 20. 挖槽 (CAVE)
  Blockly.Blocks["logoup_cave"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("挖槽 (CAVE) 深")
        .appendField(new Blockly.FieldNumber(10), "DEPTH");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(LOGOUP_COLORS.ADVANCED_3D);
      this.setTooltip("沿法向反向向内切削挖孔");
    },
  };
}
