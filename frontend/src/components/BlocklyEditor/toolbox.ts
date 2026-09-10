import { CATEGORY_COLORS } from "./blocks/types";

/**
 * Blockly 工具箱分类与积木定义 (build123d Toolbox Definition)
 */
export const BUILD123D_TOOLBOX = {
  kind: "categoryToolbox",
  contents: [
    {
      kind: "category",
      name: "🏗️ 建造者容器",
      colour: CATEGORY_COLORS.BUILDER,
      contents: [
        {
          kind: "block",
          type: "b3d_build_part",
        },
        {
          kind: "block",
          type: "b3d_build_sketch",
        },
        {
          kind: "block",
          type: "b3d_select_face",
        },
        {
          kind: "block",
          type: "b3d_build_line",
        },
        {
          kind: "block",
          type: "b3d_line",
        },
        {
          kind: "block",
          type: "b3d_three_point_arc",
        },
        {
          kind: "block",
          type: "b3d_make_face",
        },
        {
          kind: "block",
          type: "b3d_var_assign",
        },
        {
          kind: "block",
          type: "b3d_multi_var_assign",
        },
        {
          kind: "block",
          type: "b3d_var_get",
        },
        {
          kind: "block",
          type: "math_arithmetic",
        },
        {
          kind: "block",
          type: "b3d_custom_code",
        },
        {
          kind: "block",
          type: "b3d_comment",
        },
      ],
    },
    {
      kind: "category",
      name: "🐢 3D 海龟绘图",
      colour: CATEGORY_COLORS.TURTLE,
      contents: [
        {
          kind: "block",
          type: "b3d_turtle3d_container",
        },
        {
          kind: "block",
          type: "b3d_turtle3d_forward",
        },
        {
          kind: "block",
          type: "b3d_turtle3d_turn",
        },
        {
          kind: "block",
          type: "b3d_turtle3d_pitch",
        },
        {
          kind: "block",
          type: "b3d_turtle3d_roll",
        },
        {
          kind: "block",
          type: "b3d_turtle3d_arc",
        },
        {
          kind: "block",
          type: "b3d_turtle3d_branch",
        },
        {
          kind: "block",
          type: "b3d_turtle3d_set_radius",
        },
        {
          kind: "block",
          type: "b3d_turtle3d_pen",
        },
        {
          kind: "block",
          type: "b3d_turtle3d_home",
        },
      ],
    },
    {
      kind: "category",
      name: "🧱 3D 基础实体",
      colour: CATEGORY_COLORS.PRIMITIVE_3D,
      contents: [
        {
          kind: "block",
          type: "b3d_box",
        },
        {
          kind: "block",
          type: "b3d_cylinder",
        },
        {
          kind: "block",
          type: "b3d_sphere",
        },
        {
          kind: "block",
          type: "b3d_cone",
        },
        {
          kind: "block",
          type: "b3d_torus",
        },
        {
          kind: "block",
          type: "b3d_wedge",
        },
      ],
    },
    {
      kind: "category",
      name: "✏️ 2D 草图图元",
      colour: CATEGORY_COLORS.SKETCH,
      contents: [
        {
          kind: "block",
          type: "b3d_sketch_rect",
          inputs: {
            WIDTH: {
              shadow: {
                type: "math_number",
                fields: { NUM: 20 },
              },
            },
            HEIGHT: {
              shadow: {
                type: "math_number",
                fields: { NUM: 20 },
              },
            },
          },
        },
        {
          kind: "block",
          type: "b3d_sketch_circle",
          inputs: {
            RADIUS: {
              shadow: {
                type: "math_number",
                fields: { NUM: 10 },
              },
            },
          },
        },
        {
          kind: "block",
          type: "b3d_sketch_regular_polygon",
        },
        {
          kind: "block",
          type: "b3d_sketch_polygon",
        },
        {
          kind: "block",
          type: "b3d_sketch_polyline",
        },
        {
          kind: "block",
          type: "b3d_line",
        },
        {
          kind: "block",
          type: "b3d_three_point_arc",
        },
        {
          kind: "block",
          type: "b3d_make_face",
        },
        {
          kind: "block",
          type: "b3d_sketch_slot",
        },
        {
          kind: "block",
          type: "b3d_sketch_ellipse",
        },
        {
          kind: "block",
          type: "b3d_sketch_text",
        },
        {
          kind: "block",
          type: "b3d_mirror",
        },
      ],
    },
    {
      kind: "category",
      name: "📦 3D 特征操作",
      colour: CATEGORY_COLORS.OPERATION_3D,
      contents: [
        {
          kind: "block",
          type: "b3d_extrude",
          inputs: {
            AMOUNT: {
              shadow: {
                type: "math_number",
                fields: { NUM: 10 },
              },
            },
          },
        },
        {
          kind: "block",
          type: "b3d_revolve",
          inputs: {
            ANGLE: {
              shadow: {
                type: "math_number",
                fields: { NUM: 360 },
              },
            },
          },
        },
        {
          kind: "block",
          type: "b3d_loft",
        },
        {
          kind: "block",
          type: "b3d_fillet",
        },
        {
          kind: "block",
          type: "b3d_chamfer",
        },
        {
          kind: "block",
          type: "b3d_hole",
        },
        {
          kind: "block",
          type: "b3d_offset",
        },
        {
          kind: "block",
          type: "b3d_split",
        },
        {
          kind: "block",
          type: "b3d_mirror",
        },
        {
          kind: "block",
          type: "b3d_color",
        },
      ],
    },
    {
      kind: "category",
      name: "📍 定位与阵列",
      colour: CATEGORY_COLORS.TRANSFORM,
      contents: [
        {
          kind: "block",
          type: "b3d_locations",
        },
        {
          kind: "block",
          type: "b3d_grid_locations",
        },
        {
          kind: "block",
          type: "b3d_polar_locations",
        },
        {
          kind: "block",
          type: "b3d_hex_locations",
        },
      ],
    },
    {
      kind: "category",
      name: "⚙️ 教学宏与高级",
      colour: CATEGORY_COLORS.MACRO,
      contents: [
        {
          kind: "block",
          type: "cq_macro_radial_array",
        },
        {
          kind: "block",
          type: "cq_macro_flange",
        },
      ],
    },
    {
      kind: "category",
      name: "🔢 数学运算",
      colour: CATEGORY_COLORS.MATH,
      contents: [
        {
          kind: "block",
          type: "math_number",
        },
        {
          kind: "block",
          type: "math_arithmetic",
        },
        {
          kind: "block",
          type: "math_single",
        },
        {
          kind: "block",
          type: "math_trig",
        },
      ],
    },
    {
      kind: "category",
      name: "🔁 循环控制",
      colour: CATEGORY_COLORS.LOOP,
      contents: [
        {
          kind: "block",
          type: "controls_repeat_ext",
          inputs: {
            TIMES: {
              shadow: {
                type: "math_number",
                fields: {
                  NUM: 4,
                },
              },
            },
          },
        },
        {
          kind: "block",
          type: "controls_for",
          inputs: {
            FROM: {
              shadow: {
                type: "math_number",
                fields: {
                  NUM: 1,
                },
              },
            },
            TO: {
              shadow: {
                type: "math_number",
                fields: {
                  NUM: 10,
                },
              },
            },
            BY: {
              shadow: {
                type: "math_number",
                fields: {
                  NUM: 1,
                },
              },
            },
          },
        },
      ],
    },
    {
      kind: "category",
      name: "🔀 逻辑判断",
      colour: CATEGORY_COLORS.LOGIC,
      contents: [
        {
          kind: "block",
          type: "controls_if",
        },
        {
          kind: "block",
          type: "logic_compare",
        },
        {
          kind: "block",
          type: "logic_operation",
        },
        {
          kind: "block",
          type: "logic_boolean",
        },
      ],
    },
    {
      kind: "category",
      name: "🔢 数学运算",
      colour: CATEGORY_COLORS.MATH,
      contents: [
        {
          kind: "block",
          type: "math_number",
        },
        {
          kind: "block",
          type: "math_arithmetic",
        },
        {
          kind: "block",
          type: "math_single",
        },
      ],
    },
    {
      kind: "category",
      name: "📦 变量与赋值",
      colour: CATEGORY_COLORS.VARIABLE,
      contents: [
        {
          kind: "block",
          type: "b3d_var_get",
        },
        {
          kind: "block",
          type: "b3d_var_assign",
        },
        {
          kind: "block",
          type: "b3d_multi_var_assign",
        },
        {
          kind: "block",
          type: "b3d_custom_code",
        },
      ],
    },
    {
      kind: "category",
      name: "⚙️ 自定义函数",
      custom: "PROCEDURE",
      colour: CATEGORY_COLORS.PROCEDURE,
    },
  ],
};

// 保持别名兼容
export const CADQUERY_TOOLBOX = BUILD123D_TOOLBOX;
