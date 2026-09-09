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
          type: "b3d_build_line",
        },
        {
          kind: "block",
          type: "b3d_comment",
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
        },
        {
          kind: "block",
          type: "b3d_sketch_circle",
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
        },
        {
          kind: "block",
          type: "b3d_revolve",
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
      name: "📦 变量",
      colour: CATEGORY_COLORS.VARIABLE,
      custom: "VARIABLE",
    },
  ],
};

// 保持别名兼容
export const CADQUERY_TOOLBOX = BUILD123D_TOOLBOX;
