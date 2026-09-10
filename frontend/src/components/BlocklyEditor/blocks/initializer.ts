import * as Blockly from "blockly";
import { CATEGORY_COLORS, CQ_TYPES } from "./types";

/**
 * 注册初始化基准面积木
 */
export function registerInitializerBlocks() {
  // 1. 语句式初始化: 建立基准面 (顶部积木)
  Blockly.Blocks["cq_init_workplane"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("📐 新建基准面 Workplane")
        .appendField(
          new Blockly.FieldDropdown([
            ["XY 平面 (俯视/地面)", "XY"],
            ["XZ 平面 (正视/立面)", "XZ"],
            ["YZ 平面 (侧视/侧立)", "YZ"],
          ]),
          "PLANE"
        );
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CATEGORY_COLORS.INITIALIZER);
      this.setTooltip("创建一个新的 CadQuery 工作平面作为建模起点");
      this.setHelpUrl("");
    },
  };

  // 2. 表达式初始化: Workplane on [XY | XZ | YZ] -> 输出 CQ_OBJ
  Blockly.Blocks["cq_chain_workplane"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("Workplane on")
        .appendField(
          new Blockly.FieldDropdown([
            ["XY", "XY"],
            ["XZ", "XZ"],
            ["YZ", "YZ"],
          ]),
          "PLANE"
        );
      this.setOutput(true, CQ_TYPES.CQ_OBJ);
      this.setColour(CATEGORY_COLORS.INITIALIZER);
      this.setTooltip("生成一个基础 CadQuery Workplane 对象");
    },
  };

  // 3. 表达式接收赋值: part = [CQ_OBJ]
  Blockly.Blocks["cq_chain_assign"] = {
    init: function () {
      this.appendValueInput("EXPR")
        .setCheck(CQ_TYPES.CQ_OBJ)
        .appendField("part = ");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CATEGORY_COLORS.INITIALIZER);
      this.setTooltip("将链式 CadQuery 对象赋值给模型实体 part");
    },
  };

  // 4. 引用已有实体: 📦 对象 part (输出 CQ_OBJ)
  Blockly.Blocks["cq_chain_part_ref"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("📦 对象")
        .appendField(
          new Blockly.FieldDropdown([
            ["part (当前实体)", "part"],
            ["workplane (当前基准面)", "workplane"],
          ]),
          "VAR_NAME"
        );
      this.setOutput(true, CQ_TYPES.CQ_OBJ);
      this.setColour(CATEGORY_COLORS.INITIALIZER);
      this.setTooltip("引用已有的模型实体变量 part，作为后续链式操作的目标对象");
    },
  };

  // ==================== build123d 建造者容器积木 ====================

  // 5. 零件建造容器: with BuildPart() as part:
  Blockly.Blocks["b3d_build_part"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("🏗️ 零件建造者 BuildPart")
        .appendField("别名:")
        .appendField(new Blockly.FieldTextInput("part"), "VAR_NAME")
        .appendField("基准面:")
        .appendField(
          new Blockly.FieldDropdown([
            ["XY 平面 (俯视)", "XY"],
            ["XZ 平面 (正视)", "XZ"],
            ["YZ 平面 (侧视)", "YZ"],
          ]),
          "PLANE"
        );
      this.appendStatementInput("DO")
        .appendField("特征序列:");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CATEGORY_COLORS.BUILDER);
      this.setTooltip("build123d 核心建造者容器：用于构建 3D 实体模型，所有内部特征将自动组合");
    },
  };

  // 6. 草图建造容器: with BuildSketch(face) as sk:
  Blockly.Blocks["b3d_build_sketch"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("✏️ 草图建造者 BuildSketch")
        .appendField("附着于:")
        .appendField(
          new Blockly.FieldDropdown([
            ["XY 平面 (基准俯视)", "XY"],
            ["XZ 平面 (正视立面)", "XZ"],
            ["YZ 平面 (侧视侧立)", "YZ"],
            ["零件最高顶面 (Faces >Z)", "TOP_FACE"],
            ["零件最低底面 (Faces <Z)", "BOTTOM_FACE"],
            ["零件最右侧面 (Faces >X)", "RIGHT_FACE"],
            ["零件最左侧面 (Faces <X)", "LEFT_FACE"],
            ["零件最前侧面 (Faces >Y)", "FRONT_FACE"],
            ["零件最后侧面 (Faces <Y)", "BACK_FACE"],
            ["自定义附着面表达式...", "CUSTOM"],
          ]),
          "PLANE"
        )
        .appendField("实体:")
        .appendField(new Blockly.FieldTextInput("example"), "PARENT_VAR")
        .appendField("别名:")
        .appendField(
          new Blockly.FieldDropdown([
            ["(无别名)", "FALSE"],
            ["as sk", "TRUE"],
          ]),
          "HAS_ALIAS"
        )
        .appendField(new Blockly.FieldTextInput("sk"), "VAR_NAME");

      this.appendDummyInput("CUSTOM_INPUT")
        .appendField("面表达式:")
        .appendField(
          new Blockly.FieldTextInput("example.faces().sort_by(Axis.Z)[-1]"),
          "FACE_EXPR"
        );

      this.appendStatementInput("DO")
        .appendField("草图图元:");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CATEGORY_COLORS.BUILDER);
      this.setTooltip(
        "build123d 2D 草图容器：附着在指定基准平面或实体拓扑面（如顶面、侧面或自定义面）上绘制草图，供后续拉伸/挖槽成型"
      );
    },
  };

  // 6.5 实体表面选择器: target.faces().sort_by(...)
  Blockly.Blocks["b3d_select_face"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("🔍 实体面选择器")
        .appendField("实体:")
        .appendField(new Blockly.FieldTextInput("example"), "PART_VAR")
        .appendField("表面方位:")
        .appendField(
          new Blockly.FieldDropdown([
            ["最高顶面 (>Z)", "TOP"],
            ["最低底面 (<Z)", "BOTTOM"],
            ["最右侧面 (>X)", "RIGHT"],
            ["最左侧面 (<X)", "LEFT"],
            ["最后侧面 (>Y)", "BACK"],
            ["最前侧面 (<Y)", "FRONT"],
            ["回转侧面 (GeomType.CYLINDER)", "CYLINDER"],
            ["所有平面 (GeomType.PLANE)", "PLANE"],
          ]),
          "SELECTOR"
        );
      this.setOutput(true, null);
      this.setColour(CATEGORY_COLORS.INITIALIZER);
      this.setTooltip("选择 3D 实体的指定拓扑表面 (Face)，供 BuildSketch 或 Locations 作为附着基准面使用");
    },
  };

  // 7. 路径建造容器: with BuildLine() as ln:
  Blockly.Blocks["b3d_build_line"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("📏 路径构造者 BuildLine")
        .appendField("别名:")
        .appendField(new Blockly.FieldTextInput("ln"), "VAR_NAME");
      this.appendStatementInput("DO")
        .appendField("路径图元:");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CATEGORY_COLORS.BUILDER);
      this.setTooltip("build123d 1D 路径容器：用于构建扫掠路径或放样导轨");
    },
  };

  // 8. 自定义 Python 语句与变量赋值: b3d_custom_code
  Blockly.Blocks["b3d_custom_code"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("🐍 Python 语句")
        .appendField(new Blockly.FieldTextInput("a, b, c = 80, 40, 20"), "CODE");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CATEGORY_COLORS.MACRO);
      this.setTooltip("编写任意自定义 build123d / Python 变量声明、计算公式或控制语句");
    },
  };
}
