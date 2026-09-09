import { CATEGORY_COLORS } from "./blocks/types";

/**
 * Blockly 工具箱分类与积木定义 (JSON Toolbox Definition)
 */
export const CADQUERY_TOOLBOX = {
  kind: "categoryToolbox",
  contents: [
    {
      kind: "category",
      name: "📐 基准平面与对象",
      colour: CATEGORY_COLORS.INITIALIZER,
      contents: [
        {
          kind: "block",
          type: "cq_init_workplane",
        },
        {
          kind: "block",
          type: "cq_chain_workplane",
        },
        {
          kind: "block",
          type: "cq_chain_part_ref",
        },
        {
          kind: "block",
          type: "cq_chain_assign",
        },
        {
          kind: "block",
          type: "cq_comment",
        },
      ],
    },
    {
      kind: "category",
      name: "✏️ 2D 草图",
      colour: CATEGORY_COLORS.SKETCH,
      contents: [
        {
          kind: "block",
          type: "cq_sketch_circle",
        },
        {
          kind: "block",
          type: "cq_sketch_rect",
        },
        {
          kind: "block",
          type: "cq_sketch_polygon",
        },
        {
          kind: "block",
          type: "cq_sketch_polyline",
        },
        {
          kind: "block",
          type: "cq_sketch_slot",
        },
        {
          kind: "block",
          type: "cq_sketch_ellipse",
        },
        {
          kind: "block",
          type: "cq_chain_circle",
          inputs: {
            TARGET: {
              shadow: {
                type: "cq_chain_workplane",
              },
            },
          },
        },
        {
          kind: "block",
          type: "cq_chain_rect",
          inputs: {
            TARGET: {
              shadow: {
                type: "cq_chain_workplane",
              },
            },
          },
        },
        {
          kind: "block",
          type: "cq_chain_polygon",
          inputs: {
            TARGET: {
              shadow: {
                type: "cq_chain_workplane",
              },
            },
          },
        },
      ],
    },
    {
      kind: "category",
      name: "📦 3D 实体特征",
      colour: CATEGORY_COLORS.OPERATION_3D,
      contents: [
        {
          kind: "block",
          type: "cq_op_extrude",
        },
        {
          kind: "block",
          type: "cq_op_hole",
        },
        {
          kind: "block",
          type: "cq_op_cut_blind",
        },
        {
          kind: "block",
          type: "cq_op_box",
        },
        {
          kind: "block",
          type: "cq_op_cylinder",
        },
        {
          kind: "block",
          type: "cq_op_sphere",
        },
        {
          kind: "block",
          type: "cq_op_fillet",
        },
        {
          kind: "block",
          type: "cq_op_chamfer",
        },
        {
          kind: "block",
          type: "cq_op_shell",
        },
        {
          kind: "block",
          type: "cq_op_text",
        },
        {
          kind: "block",
          type: "cq_chain_extrude",
          inputs: {
            TARGET: {
              shadow: {
                type: "cq_chain_circle",
                inputs: {
                  TARGET: {
                    shadow: {
                      type: "cq_chain_workplane",
                    },
                  },
                },
              },
            },
          },
        },
        {
          kind: "block",
          type: "cq_chain_hole",
          inputs: {
            TARGET: {
              shadow: {
                type: "cq_chain_part_ref",
              },
            },
          },
        },
        {
          kind: "block",
          type: "cq_chain_cut_blind",
          inputs: {
            TARGET: {
              shadow: {
                type: "cq_chain_part_ref",
              },
            },
          },
        },
        {
          kind: "block",
          type: "cq_chain_loft",
        },
        {
          kind: "block",
          type: "cq_op_cone",
        },
        {
          kind: "block",
          type: "cq_op_polar_array",
        },
        {
          kind: "block",
          type: "cq_op_revolve",
        },
        {
          kind: "block",
          type: "cq_op_cooling_slots",
        },
      ],
    },
    {
      kind: "category",
      name: "🎯 选择与变换",
      colour: CATEGORY_COLORS.TRANSFORM,
      contents: [
        {
          kind: "block",
          type: "cq_sel_face",
        },
        {
          kind: "block",
          type: "cq_sel_offset",
        },
        {
          kind: "block",
          type: "cq_op_transform",
        },
        {
          kind: "block",
          type: "cq_chain_face_select",
          inputs: {
            TARGET: {
              shadow: {
                type: "cq_chain_part_ref",
              },
            },
          },
        },
        {
          kind: "block",
          type: "cq_chain_offset",
          inputs: {
            TARGET: {
              shadow: {
                type: "cq_chain_part_ref",
              },
            },
          },
        },
        {
          kind: "block",
          type: "cq_chain_transformed",
          inputs: {
            TARGET: {
              shadow: {
                type: "cq_chain_part_ref",
              },
            },
          },
        },
      ],
    },
    {
      kind: "category",
      name: "⚙️ 教学宏与阵列",
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
      kind: "sep",
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
          type: "logic_negate",
        },
        {
          kind: "block",
          type: "logic_boolean",
        },
        {
          kind: "block",
          type: "logic_null",
        },
        {
          kind: "block",
          type: "logic_ternary",
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
          fields: {
            NUM: 10,
          },
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
        {
          kind: "block",
          type: "math_constant",
        },
        {
          kind: "block",
          type: "math_number_property",
        },
        {
          kind: "block",
          type: "math_round",
        },
        {
          kind: "block",
          type: "math_modulo",
        },
        {
          kind: "block",
          type: "math_random_int",
          inputs: {
            FROM: {
              shadow: {
                type: "math_number",
                fields: { NUM: 1 },
              },
            },
            TO: {
              shadow: {
                type: "math_number",
                fields: { NUM: 100 },
              },
            },
          },
        },
        {
          kind: "block",
          type: "math_random_float",
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
                fields: { NUM: 10 },
              },
            },
          },
        },
        {
          kind: "block",
          type: "controls_whileUntil",
        },
        {
          kind: "block",
          type: "controls_for",
          inputs: {
            FROM: {
              shadow: {
                type: "math_number",
                fields: { NUM: 1 },
              },
            },
            TO: {
              shadow: {
                type: "math_number",
                fields: { NUM: 10 },
              },
            },
            BY: {
              shadow: {
                type: "math_number",
                fields: { NUM: 1 },
              },
            },
          },
        },
        {
          kind: "block",
          type: "controls_flow_statements",
        },
      ],
    },
    {
      kind: "category",
      name: "📦 变量",
      colour: CATEGORY_COLORS.VARIABLE,
      custom: "VARIABLE",
    },
    {
      kind: "category",
      name: "⚡ 函数",
      colour: CATEGORY_COLORS.PROCEDURE,
      custom: "PROCEDURE",
    },
  ],
};
