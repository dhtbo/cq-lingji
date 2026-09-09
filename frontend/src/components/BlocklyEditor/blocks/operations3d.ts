import * as Blockly from "blockly";
import { CATEGORY_COLORS, CQ_TYPES } from "./types";

/**
 * 注册 3D 实体与特征操作积木 (3D Operations)
 */
export function registerOperation3DBlocks() {
  // --- 语句式 (Scratch 风格垂直堆叠) ---

  // 1. 实体拉伸
  Blockly.Blocks["cq_op_extrude"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("📦 拉伸成体 extrude")
        .appendField("高度:")
        .appendField(new Blockly.FieldNumber(10, 0.1), "DISTANCE");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CATEGORY_COLORS.OPERATION_3D);
      this.setTooltip("将当前 2D 草图沿法线方向拉伸为 3D 实体");
    },
  };

  // 2. 实体打孔
  Blockly.Blocks["cq_op_hole"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("🕳️ 打孔 hole")
        .appendField("孔径:")
        .appendField(new Blockly.FieldNumber(5, 0.1), "DIAMETER")
        .appendField("深度:")
        .appendField(new Blockly.FieldNumber(10, 0.1), "DEPTH");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CATEGORY_COLORS.OPERATION_3D);
      this.setTooltip("在当前工作平面原点打圆孔 .hole(diameter, depth)");
    },
  };

  // 3. 盲切 cutBlind
  Blockly.Blocks["cq_op_cut_blind"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("🔪 盲切减胶 cutBlind")
        .appendField("切深:")
        .appendField(new Blockly.FieldNumber(5, 0.1), "DEPTH");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CATEGORY_COLORS.OPERATION_3D);
      this.setTooltip("使用当前草图沿实体法向反向切割减胶");
    },
  };

  // 4. 原生立方体快速生成
  Blockly.Blocks["cq_op_box"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("🧱 快速立方体 box")
        .appendField("长:")
        .appendField(new Blockly.FieldNumber(20, 0.1), "LENGTH")
        .appendField("宽:")
        .appendField(new Blockly.FieldNumber(20, 0.1), "WIDTH")
        .appendField("高:")
        .appendField(new Blockly.FieldNumber(10, 0.1), "HEIGHT");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CATEGORY_COLORS.OPERATION_3D);
      this.setTooltip("直接生成一个居中的立方体实体 .box(length, width, height)");
    },
  };

  // 4.1 原生圆柱体快速生成
  Blockly.Blocks["cq_op_cylinder"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("🥫 快速圆柱体 cylinder")
        .appendField("高:")
        .appendField(new Blockly.FieldNumber(30, 0.1), "HEIGHT")
        .appendField("半径 R:")
        .appendField(new Blockly.FieldNumber(15, 0.1), "RADIUS");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CATEGORY_COLORS.OPERATION_3D);
      this.setTooltip("直接生成一个圆柱体实体 .cylinder(height, radius)");
    },
  };

  // 4.2 原生球体快速生成
  Blockly.Blocks["cq_op_sphere"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("⚽ 快速球体 sphere")
        .appendField("半径 R:")
        .appendField(new Blockly.FieldNumber(15, 0.1), "RADIUS");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CATEGORY_COLORS.OPERATION_3D);
      this.setTooltip("直接生成一个球体实体 .sphere(radius)");
    },
  };

  // 5. 倒圆角 fillet
  Blockly.Blocks["cq_op_fillet"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("🔘 倒圆角 fillet")
        .appendField("目标边:")
        .appendField(
          new Blockly.FieldDropdown([
            ["顶面圆孔/内孔口 faces('>Z').edges('%Circle')", "faces_Z_circle"],
            ["所有圆周边缘 (%Circle)", "%Circle"],
            ["所有边缘 (all)", ""],
            ["顶周边缘 (>Z)", ">Z"],
            ["底周边缘 (<Z)", "<Z"],
            ["竖直棱边 (|Z)", "|Z"],
          ]),
          "SELECTOR"
        )
        .appendField("半径 R:")
        .appendField(new Blockly.FieldNumber(2, 0.1), "RADIUS");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CATEGORY_COLORS.OPERATION_3D);
      this.setTooltip("为选中或所有的边缘倒圆角");
    },
  };

  // 6. 倒斜角 chamfer
  Blockly.Blocks["cq_op_chamfer"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("📐 倒斜角 chamfer")
        .appendField("目标边:")
        .appendField(
          new Blockly.FieldDropdown([
            ["顶面圆孔/内孔口 faces('>Z').edges('%Circle')", "faces_Z_circle"],
            ["所有圆周边缘 (%Circle)", "%Circle"],
            ["所有边缘 (all)", ""],
            ["顶周边缘 (>Z)", ">Z"],
            ["底周边缘 (<Z)", "<Z"],
            ["竖直棱边 (|Z)", "|Z"],
          ]),
          "SELECTOR"
        )
        .appendField("切除尺寸:")
        .appendField(new Blockly.FieldNumber(2, 0.1), "LENGTH");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CATEGORY_COLORS.OPERATION_3D);
      this.setTooltip("为选中或所有的边缘倒角切角");
    },
  };

  // 6.1 表面抽壳 shell
  Blockly.Blocks["cq_op_shell"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("🐚 表面抽壳 shell")
        .appendField("开口面:")
        .appendField(
          new Blockly.FieldDropdown([
            ["顶面 (>Z)", ">Z"],
            ["底面 (<Z)", "<Z"],
            ["前面 (>Y)", ">Y"],
            ["右侧面 (>X)", ">X"],
          ]),
          "SELECTOR"
        )
        .appendField("壁厚:")
        .appendField(new Blockly.FieldNumber(2, 0.1), "THICKNESS");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CATEGORY_COLORS.OPERATION_3D);
      this.setTooltip("移除指定面并将实体掏空为指定壁厚的薄壁零件 .faces(sel).shell(-thickness)");
    },
  };

  // 6.2 3D 雕刻文字 text
  Blockly.Blocks["cq_op_text"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("🔤 3D 浮雕文字 text")
        .appendField("内容:")
        .appendField(new Blockly.FieldTextInput("CAD"), "TEXT")
        .appendField("字号:")
        .appendField(new Blockly.FieldNumber(12, 1, 100), "FONT_SIZE")
        .appendField("厚度:")
        .appendField(new Blockly.FieldNumber(2, 0.1), "DISTANCE");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CATEGORY_COLORS.OPERATION_3D);
      this.setTooltip("在当前工作平面创建三维凸起或雕刻文字 .text(text, fontsize, distance)");
    },
  };

  // --- 链式 Fluent API (输入 CQ_OBJ, 输出 CQ_OBJ) ---

  // 7. 链式拉伸 .extrude()
  Blockly.Blocks["cq_chain_extrude"] = {
    init: function () {
      this.appendValueInput("TARGET")
        .setCheck(CQ_TYPES.CQ_OBJ)
        .appendField("对象");
      this.appendDummyInput()
        .appendField(".extrude(")
        .appendField(new Blockly.FieldNumber(10, 0.1), "DISTANCE")
        .appendField(")");
      this.setOutput(true, CQ_TYPES.CQ_OBJ);
      this.setColour(CATEGORY_COLORS.OPERATION_3D);
      this.setTooltip("向传入的 CadQuery 目标追加 .extrude(distance)");
    },
  };

  // 8. 链式打孔 .hole()
  Blockly.Blocks["cq_chain_hole"] = {
    init: function () {
      this.appendValueInput("TARGET")
        .setCheck(CQ_TYPES.CQ_OBJ)
        .appendField("对象");
      this.appendDummyInput()
        .appendField(".hole(diameter=")
        .appendField(new Blockly.FieldNumber(5, 0.1), "DIAMETER")
        .appendField(", depth=")
        .appendField(new Blockly.FieldNumber(10, 0.1), "DEPTH")
        .appendField(")");
      this.setOutput(true, CQ_TYPES.CQ_OBJ);
      this.setColour(CATEGORY_COLORS.OPERATION_3D);
      this.setTooltip("向传入的 CadQuery 目标追加 .hole(diameter, depth)");
    },
  };

  // 9. 链式放样 .loft()
  Blockly.Blocks["cq_chain_loft"] = {
    init: function () {
      this.appendValueInput("TARGET")
        .setCheck(CQ_TYPES.CQ_OBJ)
        .appendField("对象");
      this.appendDummyInput()
        .appendField(".loft(combine=True)");
      this.setOutput(true, CQ_TYPES.CQ_OBJ);
      this.setColour(CATEGORY_COLORS.OPERATION_3D);
      this.setTooltip("将多个截面线框平滑放样为实体");
    },
  };

  // 10. 链式盲切 .cutBlind()
  Blockly.Blocks["cq_chain_cut_blind"] = {
    init: function () {
      this.appendValueInput("TARGET")
        .setCheck(CQ_TYPES.CQ_OBJ)
        .appendField("对象");
      this.appendDummyInput()
        .appendField(".cutBlind(-")
        .appendField(new Blockly.FieldNumber(5, 0.1), "DEPTH")
        .appendField(")");
      this.setOutput(true, CQ_TYPES.CQ_OBJ);
      this.setColour(CATEGORY_COLORS.OPERATION_3D);
      this.setTooltip("向传入的 CadQuery 目标追加 .cutBlind(-depth)");
    },
  };

  // --- 火星拓荒者航天课程特色几何积木 (启蒙组 & 进阶组) ---

  // 11. 倒圆台放样 (火星防热大底)
  Blockly.Blocks["cq_op_cone"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("🪐 倒圆台放样 (防热大底)")
        .appendField("底半径:")
        .appendField(new Blockly.FieldNumber(30, 0.1), "R_BOTTOM")
        .appendField("顶半径:")
        .appendField(new Blockly.FieldNumber(20, 0.1), "R_TOP")
        .appendField("高度:")
        .appendField(new Blockly.FieldNumber(15, 0.1), "HEIGHT");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CATEGORY_COLORS.OPERATION_3D);
      this.setTooltip("火星防热大底：上下截面平滑变径放样成型 .loft(combine=True)");
    },
  };

  // 12. 极坐标孔位阵列 (耐磨穿孔法兰)
  Blockly.Blocks["cq_op_polar_array"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("🌀 极坐标孔位阵列 polarArray")
        .appendField("节圆R:")
        .appendField(new Blockly.FieldNumber(28, 0.1), "RADIUS")
        .appendField("孔数:")
        .appendField(new Blockly.FieldNumber(8, 1, 64, 1), "COUNT")
        .appendField("孔径D:")
        .appendField(new Blockly.FieldNumber(3, 0.1), "DIAMETER");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CATEGORY_COLORS.OPERATION_3D);
      this.setTooltip("在顶面按圆周极坐标均布打穿孔 .polarArray(...).circle(...).cutThruAll()");
    },
  };

  // 13. 360° 旋转拉伸成型 (霍尔推进喷管)
  Blockly.Blocks["cq_op_revolve"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("🔄 旋转成型体 revolve")
        .appendField("旋转角度:")
        .appendField(new Blockly.FieldNumber(360, 1, 360), "ANGLE")
        .appendField("旋转轴:")
        .appendField(
          new Blockly.FieldDropdown([
            ["X 轴 (1,0,0)", "X"],
            ["Y 轴 (0,1,0)", "Y"],
            ["Z 轴 (0,0,1)", "Z"],
          ]),
          "AXIS"
        );
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CATEGORY_COLORS.OPERATION_3D);
      this.setTooltip("将 2D 截面绕指定空间轴线旋转成型回转体 .revolve(...)");
    },
  };

  // 14. 辐射散热格栅槽切削
  Blockly.Blocks["cq_op_cooling_slots"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("❄️ 辐射散热槽阵列 slots")
        .appendField("槽数:")
        .appendField(new Blockly.FieldNumber(12, 1, 48, 1), "COUNT")
        .appendField("槽宽:")
        .appendField(new Blockly.FieldNumber(2, 0.1), "WIDTH")
        .appendField("深度:")
        .appendField(new Blockly.FieldNumber(3, 0.1), "DEPTH");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CATEGORY_COLORS.OPERATION_3D);
      this.setTooltip("在实体端面周向阵列切削辐射散热槽");
    },
  };
}
