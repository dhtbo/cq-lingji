import * as Blockly from "blockly";
import { CATEGORY_COLORS } from "./types";

/**
 * 注册 3D 空间海龟绘图积木 (LogoUp 3D Turtle)
 */
export function registerTurtle3DBlocks() {
  // 1. 3D 海龟绘图画布容器 (with Turtle3D(radius=...) as t:)
  Blockly.Blocks["b3d_turtle3d_container"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("🐢 3D海龟画布 Turtle3D")
        .appendField("画笔别名:")
        .appendField(new Blockly.FieldTextInput("t"), "VAR_NAME")
        .appendField("初始半径:")
        .appendField(new Blockly.FieldNumber(1.0, 0.05), "RADIUS")
        .appendField("颜色:")
        .appendField(new Blockly.FieldTextInput("#10b981"), "COLOR");
      this.appendStatementInput("DO")
        .appendField("海龟指令序列:");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CATEGORY_COLORS.TURTLE);
      this.setTooltip("三维空间海龟绘图容器 with Turtle3D(...) as t: 沿轨迹自动生成流形管道实体");
    },
  };

  // 2. 前进 / 后退
  Blockly.Blocks["b3d_turtle3d_forward"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("🐢 海龟")
        .appendField(new Blockly.FieldTextInput("t"), "VAR_NAME")
        .appendField(new Blockly.FieldDropdown([
          ["前进", "FORWARD"],
          ["后退", "BACKWARD"]
        ]), "DIR")
        .appendField("距离:")
        .appendField(new Blockly.FieldNumber(20, -1000, 1000), "DISTANCE");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CATEGORY_COLORS.TURTLE);
      this.setTooltip("沿当前前进方向移动指定距离");
    },
  };

  // 3. 偏航左转 / 右转 (Yaw)
  Blockly.Blocks["b3d_turtle3d_turn"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("🐢 海龟")
        .appendField(new Blockly.FieldTextInput("t"), "VAR_NAME")
        .appendField(new Blockly.FieldDropdown([
          ["偏航左转 ↺", "LEFT"],
          ["偏航右转 ↻", "RIGHT"]
        ]), "DIR")
        .appendField("角度:")
        .appendField(new Blockly.FieldNumber(90, -360, 360), "ANGLE")
        .appendField("°");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CATEGORY_COLORS.TURTLE);
      this.setTooltip("绕当前天顶 (up) 轴偏航旋转");
    },
  };

  // 4. 俯仰上仰 / 下俯 (Pitch)
  Blockly.Blocks["b3d_turtle3d_pitch"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("🐢 海龟")
        .appendField(new Blockly.FieldTextInput("t"), "VAR_NAME")
        .appendField(new Blockly.FieldDropdown([
          ["俯仰上仰 ⤉", "UP"],
          ["俯仰下俯 ⤈", "DOWN"]
        ]), "DIR")
        .appendField("角度:")
        .appendField(new Blockly.FieldNumber(45, -360, 360), "ANGLE")
        .appendField("°");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CATEGORY_COLORS.TURTLE);
      this.setTooltip("绕横向 (right) 轴俯仰旋转");
    },
  };

  // 5. 轴向左滚 / 右滚 (Roll)
  Blockly.Blocks["b3d_turtle3d_roll"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("🐢 海龟")
        .appendField(new Blockly.FieldTextInput("t"), "VAR_NAME")
        .appendField(new Blockly.FieldDropdown([
          ["轴向左滚 ⮌", "LEFT"],
          ["轴向右滚 ⮎", "RIGHT"]
        ]), "DIR")
        .appendField("角度:")
        .appendField(new Blockly.FieldNumber(45, -360, 360), "ANGLE")
        .appendField("°");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CATEGORY_COLORS.TURTLE);
      this.setTooltip("绕机身前进轴线翻滚旋转");
    },
  };

  // 6. 空间圆弧与平滑弯管 (Arc)
  Blockly.Blocks["b3d_turtle3d_arc"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("🐢 海龟")
        .appendField(new Blockly.FieldTextInput("t"), "VAR_NAME")
        .appendField("绘制空间圆弧 向")
        .appendField(new Blockly.FieldDropdown([
          ["左弯", "LEFT"],
          ["右弯", "RIGHT"],
          ["上弯", "UP"],
          ["下弯", "DOWN"]
        ]), "DIR")
        .appendField("弯曲半径:")
        .appendField(new Blockly.FieldNumber(15, 0.1), "RADIUS")
        .appendField("扫掠角度:")
        .appendField(new Blockly.FieldNumber(90, -360, 360), "ANGLE")
        .appendField("°");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CATEGORY_COLORS.TURTLE);
      this.setTooltip("在当前局部平面画出平滑过渡的三维圆弧管道");
    },
  };

  // 7. 画笔落笔 / 抬笔
  Blockly.Blocks["b3d_turtle3d_pen"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("🐢 海龟")
        .appendField(new Blockly.FieldTextInput("t"), "VAR_NAME")
        .appendField(new Blockly.FieldDropdown([
          ["落笔 (绘图)", "DOWN"],
          ["抬笔 (移动)", "UP"]
        ]), "STATE");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CATEGORY_COLORS.TURTLE);
      this.setTooltip("控制海龟移动时是否生成实体管道");
    },
  };

  // 8. 调整粗细半径
  Blockly.Blocks["b3d_turtle3d_set_radius"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("🐢 海龟")
        .appendField(new Blockly.FieldTextInput("t"), "VAR_NAME")
        .appendField("设置画笔粗细 半径:")
        .appendField(new Blockly.FieldNumber(1.5, 0.01), "RADIUS");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CATEGORY_COLORS.TURTLE);
      this.setTooltip("调整后续绘制管道的粗细半径");
    },
  };

  // 9. 分形分支包装容器 (push/pop)
  Blockly.Blocks["b3d_turtle3d_branch"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("🌿 海龟分形分支 (Push/Pop)")
        .appendField("海龟:")
        .appendField(new Blockly.FieldTextInput("t"), "VAR_NAME");
      this.appendStatementInput("BRANCH")
        .appendField("子分支动作序列:");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CATEGORY_COLORS.TURTLE);
      this.setTooltip("保存海龟状态，执行分支绘制，并在完成后精准复原位姿（分形树与递归必备）");
    },
  };

  // 10. 复位原点
  Blockly.Blocks["b3d_turtle3d_home"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("🐢 海龟")
        .appendField(new Blockly.FieldTextInput("t"), "VAR_NAME")
        .appendField("复位至原点 home()");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CATEGORY_COLORS.TURTLE);
      this.setTooltip("重置海龟位置到原点 (0, 0, 0) 并恢复初始朝向");
    },
  };
}
