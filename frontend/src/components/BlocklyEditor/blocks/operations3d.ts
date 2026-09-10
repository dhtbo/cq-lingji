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

  // ==================== build123d 3D 实体与特征积木 ====================

  const B3D_MODE_OPTIONS: [string, string][] = [
    ["加胶并集 Mode.ADD", "ADD"],
    ["减胶差集 Mode.SUBTRACT", "SUBTRACT"],
    ["相交保留 Mode.INTERSECT", "INTERSECT"],
  ];

  // b3d Box
  Blockly.Blocks["b3d_box"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("🧱 实体立方体 Box")
        .appendField("长 X:")
        .appendField(new Blockly.FieldTextInput("20"), "LENGTH")
        .appendField("宽 Y:")
        .appendField(new Blockly.FieldTextInput("20"), "WIDTH")
        .appendField("高 Z:")
        .appendField(new Blockly.FieldTextInput("10"), "HEIGHT")
        .appendField("模式:")
        .appendField(new Blockly.FieldDropdown(B3D_MODE_OPTIONS), "MODE");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CATEGORY_COLORS.PRIMITIVE_3D);
      this.setTooltip("build123d Box 实体，支持并集加胶、差集切削或交集；各尺寸支持数值或变量名");
    },
  };

  // b3d Cylinder
  Blockly.Blocks["b3d_cylinder"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("🥫 实体圆柱体 Cylinder")
        .appendField("半径 R:")
        .appendField(new Blockly.FieldTextInput("10"), "RADIUS")
        .appendField("高度 H:")
        .appendField(new Blockly.FieldTextInput("20"), "HEIGHT")
        .appendField("模式:")
        .appendField(new Blockly.FieldDropdown(B3D_MODE_OPTIONS), "MODE");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CATEGORY_COLORS.PRIMITIVE_3D);
      this.setTooltip("build123d Cylinder 实体，支持数值或变量名");
    },
  };

  // b3d Sphere
  Blockly.Blocks["b3d_sphere"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("⚽ 实体球体 Sphere")
        .appendField("半径 R:")
        .appendField(new Blockly.FieldTextInput("10"), "RADIUS")
        .appendField("模式:")
        .appendField(new Blockly.FieldDropdown(B3D_MODE_OPTIONS), "MODE");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CATEGORY_COLORS.PRIMITIVE_3D);
      this.setTooltip("build123d Sphere 球体实体，支持数值或变量名");
    },
  };

  // b3d Cone
  Blockly.Blocks["b3d_cone"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("📐 实体圆锥体 Cone")
        .appendField("底面半径 R1:")
        .appendField(new Blockly.FieldTextInput("15"), "R1")
        .appendField("顶面半径 R2:")
        .appendField(new Blockly.FieldTextInput("5"), "R2")
        .appendField("高度 H:")
        .appendField(new Blockly.FieldTextInput("20"), "HEIGHT")
        .appendField("模式:")
        .appendField(new Blockly.FieldDropdown(B3D_MODE_OPTIONS), "MODE");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CATEGORY_COLORS.PRIMITIVE_3D);
      this.setTooltip("build123d Cone 圆锥体或平台截锥实体，支持数值或变量名");
    },
  };

  // b3d Torus
  Blockly.Blocks["b3d_torus"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("🍩 实体圆环体 Torus")
        .appendField("主半径 R1:")
        .appendField(new Blockly.FieldTextInput("20"), "R1")
        .appendField("截面半径 R2:")
        .appendField(new Blockly.FieldTextInput("5"), "R2")
        .appendField("模式:")
        .appendField(new Blockly.FieldDropdown(B3D_MODE_OPTIONS), "MODE");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CATEGORY_COLORS.PRIMITIVE_3D);
      this.setTooltip("build123d Torus 甜甜圈圆环实体，支持数值或变量名");
    },
  };

  // b3d Wedge
  Blockly.Blocks["b3d_wedge"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("📐 实体楔形体 Wedge")
        .appendField("dx:")
        .appendField(new Blockly.FieldTextInput("20"), "DX")
        .appendField("dy:")
        .appendField(new Blockly.FieldTextInput("20"), "DY")
        .appendField("dz:")
        .appendField(new Blockly.FieldTextInput("15"), "DZ")
        .appendField("xmin:")
        .appendField(new Blockly.FieldTextInput("5"), "XMIN")
        .appendField("zmin:")
        .appendField(new Blockly.FieldTextInput("0"), "ZMIN")
        .appendField("xmax:")
        .appendField(new Blockly.FieldTextInput("15"), "XMAX")
        .appendField("zmax:")
        .appendField(new Blockly.FieldTextInput("10"), "ZMAX")
        .appendField("模式:")
        .appendField(new Blockly.FieldDropdown(B3D_MODE_OPTIONS), "MODE");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CATEGORY_COLORS.PRIMITIVE_3D);
      this.setTooltip("build123d Wedge 斜角楔形实体，各尺寸支持数值、变量名或运算表达式");
    },
  };

  // b3d extrude
  Blockly.Blocks["b3d_extrude"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("📦 拉伸草图 extrude");
      this.appendValueInput("AMOUNT")
        .setCheck(null)
        .appendField("高度:");
      this.appendDummyInput()
        .appendField("模式:")
        .appendField(new Blockly.FieldDropdown(B3D_MODE_OPTIONS), "MODE");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CATEGORY_COLORS.OPERATION_3D);
      this.setTooltip("build123d extrude：将 BuildSketch 中绘制的草图沿法线拉伸成体，支持接入运算积木、变量或数值");
    },
  };

  // b3d revolve
  Blockly.Blocks["b3d_revolve"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("🔄 旋转草图 revolve");
      this.appendValueInput("ANGLE")
        .setCheck(null)
        .appendField("角度:");
      this.appendDummyInput()
        .appendField("轴线:")
        .appendField(
          new Blockly.FieldDropdown([
            ["Z 轴 Axis.Z", "Axis.Z"],
            ["X 轴 Axis.X", "Axis.X"],
            ["Y 轴 Axis.Y", "Axis.Y"],
          ]),
          "AXIS"
        )
        .appendField("模式:")
        .appendField(new Blockly.FieldDropdown(B3D_MODE_OPTIONS), "MODE");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CATEGORY_COLORS.OPERATION_3D);
      this.setTooltip("build123d revolve：将草图绕轴旋转成体，支持接入运算积木、变量或数值");
    },
  };

  // b3d loft
  Blockly.Blocks["b3d_loft"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("⛵ 放样成体 loft")
        .appendField("模式:")
        .appendField(new Blockly.FieldDropdown(B3D_MODE_OPTIONS), "MODE");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CATEGORY_COLORS.OPERATION_3D);
      this.setTooltip("build123d loft：将多个不同平面的草图截面顺滑连接过渡生成放样实体");
    },
  };

  // b3d fillet
  Blockly.Blocks["b3d_fillet"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("🪚 倒圆角 fillet")
        .appendField("边缘目标:")
        .appendField(new Blockly.FieldTextInput("part.edges()"), "TARGET")
        .appendField("半径 R:")
        .appendField(new Blockly.FieldTextInput("2"), "RADIUS");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CATEGORY_COLORS.OPERATION_3D);
      this.setTooltip("build123d fillet：为实体边缘倒圆角，支持指定边缘集合变量（如 part.edges()、hole_edges）或表达式");
    },
  };

  // b3d chamfer
  Blockly.Blocks["b3d_chamfer"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("📐 倒斜角 chamfer")
        .appendField("边缘目标:")
        .appendField(new Blockly.FieldTextInput("part.edges()"), "TARGET")
        .appendField("斜边长度:")
        .appendField(new Blockly.FieldTextInput("1"), "LENGTH");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CATEGORY_COLORS.OPERATION_3D);
      this.setTooltip("build123d chamfer：为实体边缘倒斜角，支持指定边缘集合变量（如 hole_edges、part.edges()）或表达式");
    },
  };

  // b3d Hole
  Blockly.Blocks["b3d_hole"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("🕳️ 打孔 Hole")
        .appendField("半径 R:")
        .appendField(new Blockly.FieldTextInput("3"), "RADIUS")
        .appendField("深度:")
        .appendField(new Blockly.FieldTextInput(""), "DEPTH");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CATEGORY_COLORS.OPERATION_3D);
      this.setTooltip("build123d Hole：在当前位置钻孔，深度留空表示贯穿全深（through-all）");
    },
  };

  // b3d offset
  Blockly.Blocks["b3d_offset"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("🐚 抽壳/薄壁 offset")
        .appendField("偏置厚度:")
        .appendField(new Blockly.FieldTextInput("2"), "AMOUNT");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CATEGORY_COLORS.OPERATION_3D);
      this.setTooltip("build123d offset：沿表面法向均匀膨胀或向内掏空抽壳，支持数值、变量名或运算表达式");
    },
  };

  // b3d split
  Blockly.Blocks["b3d_split"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("🔪 剖切实体 split")
        .appendField("剖切面:")
        .appendField(
          new Blockly.FieldDropdown([
            ["XZ 平面 (剖切Y)", "Plane.XZ"],
            ["YZ 平面 (剖切X)", "Plane.YZ"],
            ["XY 平面 (剖切Z)", "Plane.XY"],
          ]),
          "PLANE"
        );
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CATEGORY_COLORS.OPERATION_3D);
      this.setTooltip("build123d split：用指定平面剖切实体并保留一半");
    },
  };

  // b3d color
  Blockly.Blocks["b3d_color"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("🎨 设定模型颜色")
        .appendField(
          new Blockly.FieldDropdown([
            ["经典科技蓝 (#3b82f6)", "#3b82f6"],
            ["机械钛金灰 (#64748b)", "#64748b"],
            ["太空香槟金 (#f59e0b)", "#f59e0b"],
            ["能量荧光绿 (#10b981)", "#10b981"],
            ["赤红动力 (#ef4444)", "#ef4444"],
            ["紫晶光芒 (#8b5cf6)", "#8b5cf6"],
          ]),
          "COLOR"
        );
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CATEGORY_COLORS.OPERATION_3D);
      this.setTooltip("设置 build123d 模型的显示颜色");
    },
  };

  // b3d mirror
  Blockly.Blocks["b3d_mirror"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("🪞 镜像 mirror")
        .appendField("目标对象:")
        .appendField(new Blockly.FieldTextInput(""), "TARGET")
        .appendField("基准面:")
        .appendField(
          new Blockly.FieldDropdown([
            ["YZ 平面 Plane.YZ", "Plane.YZ"],
            ["XZ 平面 Plane.XZ", "Plane.XZ"],
            ["XY 平面 Plane.XY", "Plane.XY"],
          ]),
          "ABOUT"
        );
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CATEGORY_COLORS.OPERATION_3D);
      this.setTooltip("build123d mirror：将指定目标（如 ex15_ln.line、part 等，留空表示当前上下文实体）按基准面镜像对称");
    },
  };
}
