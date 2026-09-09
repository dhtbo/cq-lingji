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
}
