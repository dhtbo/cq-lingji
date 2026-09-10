import * as Blockly from "blockly";
import { CATEGORY_COLORS, CQ_TYPES } from "./types";

/**
 * 注册几何变换、面选择与坐标系工作面积木 (Transforms & Selectors)
 */
export function registerTransformBlocks() {
  const FACE_OPTIONS: [string, string][] = [
    ["顶面 Top (+Z 轴最高面)", ">Z"],
    ["底面 Bottom (-Z 轴最低面)", "<Z"],
    ["前面 Front (+Y 轴面)", ">Y"],
    ["后面 Back (-Y 轴面)", "<Y"],
    ["右侧面 Right (+X 轴面)", ">X"],
    ["左侧面 Left (-X 轴面)", "<X"],
  ];

  const CENTER_OPTIONS: [string, string][] = [
    ["质心居中 CenterOfMass (推荐)", "CenterOfMass"],
    ["投影原点 ProjectedOrigin (默认)", "ProjectedOrigin"],
    ["包围盒中心 CenterOfBoundBox", "CenterOfBoundBox"],
  ];

  // --- 语句式 ---

  // 1. 选择表面并建立新工作平面 (支持 centerOption="CenterOfMass")
  Blockly.Blocks["cq_sel_face"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("🎯 选择表面")
        .appendField(new Blockly.FieldDropdown(FACE_OPTIONS), "SELECTOR")
        .appendField("原点对齐:")
        .appendField(new Blockly.FieldDropdown(CENTER_OPTIONS), "CENTER_OPTION")
        .appendField("建工作面");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CATEGORY_COLORS.TRANSFORM);
      this.setTooltip("在选定表面建立工作面，CenterOfMass 将原点精准对齐到表面质心");
    },
  };

  // 2. 偏移工作平面
  Blockly.Blocks["cq_sel_offset"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("📏 偏移当前工作面")
        .appendField("偏置量:")
        .appendField(new Blockly.FieldNumber(5, -1000, 1000, 0.1), "OFFSET");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CATEGORY_COLORS.TRANSFORM);
      this.setTooltip("将当前工作平面沿法线方向平行移动 offset 距离");
    },
  };

  // 3. 相对旋转与平移变换
  Blockly.Blocks["cq_op_transform"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("🔄 局部坐标系变换")
        .appendField("旋转[X,Y,Z]:")
        .appendField(new Blockly.FieldNumber(0), "RX")
        .appendField(new Blockly.FieldNumber(0), "RY")
        .appendField(new Blockly.FieldNumber(45), "RZ")
        .appendField("位移[X,Y,Z]:")
        .appendField(new Blockly.FieldNumber(0), "OX")
        .appendField(new Blockly.FieldNumber(0), "OY")
        .appendField(new Blockly.FieldNumber(0), "OZ");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CATEGORY_COLORS.TRANSFORM);
      this.setTooltip("对当前工作平面应用旋转与平移 .transformed()");
    },
  };

  // --- 链式 Fluent API ---

  // 4. 链式面选择 .faces(sel).workplane(centerOption=...)
  Blockly.Blocks["cq_chain_face_select"] = {
    init: function () {
      this.appendValueInput("TARGET")
        .setCheck(CQ_TYPES.CQ_OBJ)
        .appendField("对象");
      this.appendDummyInput()
        .appendField(".faces(\"")
        .appendField(new Blockly.FieldDropdown(FACE_OPTIONS), "SELECTOR")
        .appendField("\").workplane(centerOption=\"")
        .appendField(new Blockly.FieldDropdown(CENTER_OPTIONS), "CENTER_OPTION")
        .appendField("\")");
      this.setOutput(true, CQ_TYPES.CQ_OBJ);
      this.setColour(CATEGORY_COLORS.TRANSFORM);
      this.setTooltip("在所选对象的指定表面建立工作面，可选择质心对齐 CenterOfMass 或投影原点");
    },
  };

  // 5. 链式偏移 .workplane(offset=...)
  Blockly.Blocks["cq_chain_offset"] = {
    init: function () {
      this.appendValueInput("TARGET")
        .setCheck(CQ_TYPES.CQ_OBJ)
        .appendField("对象");
      this.appendDummyInput()
        .appendField(".workplane(offset=")
        .appendField(new Blockly.FieldNumber(5, -1000, 1000, 0.1), "OFFSET")
        .appendField(")");
      this.setOutput(true, CQ_TYPES.CQ_OBJ);
      this.setColour(CATEGORY_COLORS.TRANSFORM);
      this.setTooltip("向传入的 CadQuery 目标追加 .workplane(offset=...)");
    },
  };

  // 6. 链式变换 .transformed()
  Blockly.Blocks["cq_chain_transformed"] = {
    init: function () {
      this.appendValueInput("TARGET")
        .setCheck(CQ_TYPES.CQ_OBJ)
        .appendField("对象");
      this.appendDummyInput()
        .appendField(".transformed(rotate=(")
        .appendField(new Blockly.FieldNumber(0), "RX")
        .appendField(",")
        .appendField(new Blockly.FieldNumber(0), "RY")
        .appendField(",")
        .appendField(new Blockly.FieldNumber(45), "RZ")
        .appendField("), offset=(")
        .appendField(new Blockly.FieldNumber(0), "OX")
        .appendField(",")
        .appendField(new Blockly.FieldNumber(0), "OY")
        .appendField(",")
        .appendField(new Blockly.FieldNumber(0), "OZ")
        .appendField("))");
      this.setOutput(true, CQ_TYPES.CQ_OBJ);
      this.setColour(CATEGORY_COLORS.TRANSFORM);
      this.setTooltip("向传入的 CadQuery 目标应用旋转与位移变换");
    },
  };

  // ==================== build123d 定位与阵列容器积木 ====================

  // b3d Locations: with Locations((x, y, z)):
  Blockly.Blocks["b3d_locations"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("📍 空间定位 Locations")
        .appendField("X:")
        .appendField(new Blockly.FieldTextInput("0"), "X")
        .appendField("Y:")
        .appendField(new Blockly.FieldTextInput("0"), "Y")
        .appendField("Z:")
        .appendField(new Blockly.FieldTextInput("0"), "Z");
      this.appendStatementInput("DO")
        .appendField("在此位置放置:");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CATEGORY_COLORS.TRANSFORM);
      this.setTooltip("build123d Locations：指定内部图元或实体的放置空间坐标，支持数值或变量名");
    },
  };

  // b3d GridLocations: with GridLocations(x_spacing, y_spacing, x_count, y_count):
  Blockly.Blocks["b3d_grid_locations"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("▦ 矩形网格阵列 GridLocations")
        .appendField("X间距:")
        .appendField(new Blockly.FieldTextInput("15"), "X_SPACING")
        .appendField("Y间距:")
        .appendField(new Blockly.FieldTextInput("15"), "Y_SPACING")
        .appendField("X数量:")
        .appendField(new Blockly.FieldTextInput("3"), "X_COUNT")
        .appendField("Y数量:")
        .appendField(new Blockly.FieldTextInput("3"), "Y_COUNT");
      this.appendStatementInput("DO")
        .appendField("阵列实体/孔:");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CATEGORY_COLORS.TRANSFORM);
      this.setTooltip("build123d GridLocations：在矩形网格点上批量阵列生成内部特征，支持数值、变量名或表达式");
    },
  };

  // b3d PolarLocations: with PolarLocations(radius, count):
  Blockly.Blocks["b3d_polar_locations"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("⭕ 环形极坐标阵列 PolarLocations")
        .appendField("分布半径 R:")
        .appendField(new Blockly.FieldTextInput("20"), "RADIUS")
        .appendField("数量:")
        .appendField(new Blockly.FieldTextInput("6"), "COUNT");
      this.appendStatementInput("DO")
        .appendField("周向阵列:");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CATEGORY_COLORS.TRANSFORM);
      this.setTooltip("build123d PolarLocations：围绕圆心周向均布阵列内部特征（如环形螺栓孔），支持数值或变量名");
    },
  };

  // b3d HexLocations: with HexLocations(apothem, x_count, y_count):
  Blockly.Blocks["b3d_hex_locations"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("🐝 蜂窝六边形阵列 HexLocations")
        .appendField("边心距:")
        .appendField(new Blockly.FieldTextInput("10"), "APOTHEM")
        .appendField("X数量:")
        .appendField(new Blockly.FieldTextInput("3"), "X_COUNT")
        .appendField("Y数量:")
        .appendField(new Blockly.FieldTextInput("3"), "Y_COUNT");
      this.appendStatementInput("DO")
        .appendField("蜂窝阵列:");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CATEGORY_COLORS.TRANSFORM);
      this.setTooltip("build123d HexLocations：蜂窝六边形紧密排列阵列，支持数值或变量名");
    },
  };
}
