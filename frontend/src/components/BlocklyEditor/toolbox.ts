import { CATEGORY_COLORS, LOGOUP_COLORS } from "./blocks/types";

export type WorkingMode = "logoup" | "cadquery" | "build123d";

// 1. LogoUp 3D 控制与数学分类
const LOGOUP_CONTROL_CATEGORY = {
  kind: "category",
  name: "🕹️ 控制流程",
  colour: LOGOUP_COLORS.CONTROL,
  contents: [
    { kind: "block", type: "logoup_start" },
    {
      kind: "block",
      type: "logoup_repeat",
      inputs: {
        TIMES: {
          shadow: {
            type: "math_number",
            fields: { NUM: 4 },
          },
        },
      },
    },
    { kind: "block", type: "logoup_if" },
    { kind: "block", type: "logoup_if_else" },
    { kind: "block", type: "logoup_push" },
    { kind: "block", type: "logoup_pop" },
    { kind: "block", type: "logoup_def_func" },
    { kind: "block", type: "logoup_call_func_stmt" },
    { kind: "block", type: "logoup_call_func_expr" },
    {
      kind: "block",
      type: "logoup_def_var",
      inputs: {
        VALUE: {
          shadow: {
            type: "math_number",
            fields: { NUM: 0 },
          },
        },
      },
    },
    {
      kind: "block",
      type: "logoup_set_var",
      inputs: {
        VALUE: {
          shadow: {
            type: "math_number",
            fields: { NUM: 10 },
          },
        },
      },
    },
    {
      kind: "block",
      type: "logoup_return_val",
      inputs: {
        VALUE: {
          shadow: {
            type: "math_number",
            fields: { NUM: 0 },
          },
        },
      },
    },
    { kind: "block", type: "logoup_return" },
    { kind: "block", type: "logoup_bool_var" },
    { kind: "block", type: "logoup_true" },
    { kind: "block", type: "logoup_false" },
  ],
};

const LOGOUP_MATH_CATEGORY = {
  kind: "category",
  name: "🔢 数学逻辑",
  colour: LOGOUP_COLORS.MATH,
  contents: [
    {
      kind: "block",
      type: "math_number",
      fields: { NUM: 10 },
    },
    {
      kind: "block",
      type: "logoup_add",
      inputs: {
        A: { shadow: { type: "math_number", fields: { NUM: 1 } } },
        B: { shadow: { type: "math_number", fields: { NUM: 1 } } },
      },
    },
    {
      kind: "block",
      type: "logoup_sub",
      inputs: {
        A: { shadow: { type: "math_number", fields: { NUM: 10 } } },
        B: { shadow: { type: "math_number", fields: { NUM: 5 } } },
      },
    },
    {
      kind: "block",
      type: "logoup_mul",
      inputs: {
        A: { shadow: { type: "math_number", fields: { NUM: 3 } } },
        B: { shadow: { type: "math_number", fields: { NUM: 4 } } },
      },
    },
    {
      kind: "block",
      type: "logoup_div",
      inputs: {
        A: { shadow: { type: "math_number", fields: { NUM: 10 } } },
        B: { shadow: { type: "math_number", fields: { NUM: 2 } } },
      },
    },
    {
      kind: "block",
      type: "logoup_mod",
      inputs: {
        A: { shadow: { type: "math_number", fields: { NUM: 10 } } },
        B: { shadow: { type: "math_number", fields: { NUM: 3 } } },
      },
    },
    {
      kind: "block",
      type: "logoup_lt",
      inputs: {
        A: { shadow: { type: "math_number", fields: { NUM: 1 } } },
        B: { shadow: { type: "math_number", fields: { NUM: 2 } } },
      },
    },
    {
      kind: "block",
      type: "logoup_lte",
      inputs: {
        A: { shadow: { type: "math_number", fields: { NUM: 1 } } },
        B: { shadow: { type: "math_number", fields: { NUM: 2 } } },
      },
    },
    {
      kind: "block",
      type: "logoup_eq",
      inputs: {
        A: { shadow: { type: "math_number", fields: { NUM: 1 } } },
        B: { shadow: { type: "math_number", fields: { NUM: 1 } } },
      },
    },
    {
      kind: "block",
      type: "logoup_neq",
      inputs: {
        A: { shadow: { type: "math_number", fields: { NUM: 1 } } },
        B: { shadow: { type: "math_number", fields: { NUM: 2 } } },
      },
    },
    {
      kind: "block",
      type: "logoup_gte",
      inputs: {
        A: { shadow: { type: "math_number", fields: { NUM: 2 } } },
        B: { shadow: { type: "math_number", fields: { NUM: 1 } } },
      },
    },
    {
      kind: "block",
      type: "logoup_gt",
      inputs: {
        A: { shadow: { type: "math_number", fields: { NUM: 2 } } },
        B: { shadow: { type: "math_number", fields: { NUM: 1 } } },
      },
    },
    { kind: "block", type: "logoup_and" },
    { kind: "block", type: "logoup_or" },
    { kind: "block", type: "logoup_not" },
  ],
};

// 2. LogoUp 3D 专属绘图与构件分类 (进阶类优先于构件类)
const LOGOUP_SPECIFIC_CATEGORIES = [
  {
    kind: "category",
    name: "🎨 平面绘图",
    colour: LOGOUP_COLORS.DRAWING_2D,
    contents: [
      { kind: "block", type: "logoup_go" },
      { kind: "block", type: "logoup_turn" },
      { kind: "block", type: "logoup_turn_left" },
      { kind: "block", type: "logoup_draw" },
      { kind: "block", type: "logoup_done" },
      { kind: "block", type: "logoup_fill" },
      { kind: "block", type: "logoup_width" },
      { kind: "block", type: "logoup_clear" },
      { kind: "block", type: "logoup_home" },
      { kind: "block", type: "logoup_erase" },
    ],
  },
  {
    kind: "category",
    name: "📐 平面进阶",
    colour: LOGOUP_COLORS.ADVANCED_2D,
    contents: [
      { kind: "block", type: "logoup_close" },
      { kind: "block", type: "logoup_offset" },
      { kind: "block", type: "logoup_goto" },
      { kind: "block", type: "logoup_turnto" },
      { kind: "block", type: "logoup_setx" },
      { kind: "block", type: "logoup_sety" },
      { kind: "block", type: "logoup_getx" },
      { kind: "block", type: "logoup_gety" },
      { kind: "block", type: "logoup_geth" },
      { kind: "block", type: "logoup_flood" },
      { kind: "block", type: "logoup_clearsketch" },
      { kind: "block", type: "logoup_txtstamp" },
      { kind: "block", type: "logoup_txtstampex" },
      { kind: "block", type: "logoup_imgload" },
      { kind: "block", type: "logoup_imgscale" },
      { kind: "block", type: "logoup_imgstamp" },
      { kind: "block", type: "logoup_imgunload" },
    ],
  },
  {
    kind: "category",
    name: "🧩 平面构件",
    colour: LOGOUP_COLORS.COMPONENTS_2D,
    contents: [
      { kind: "block", type: "logoup_rect" },
      { kind: "block", type: "logoup_square" },
      { kind: "block", type: "logoup_rounded_rect" },
      { kind: "block", type: "logoup_rounded_square" },
      { kind: "block", type: "logoup_circle" },
      { kind: "block", type: "logoup_ellipse" },
      { kind: "block", type: "logoup_egg" },
      { kind: "block", type: "logoup_polygon" },
      { kind: "block", type: "logoup_star" },
      { kind: "block", type: "logoup_five_star" },
      { kind: "block", type: "logoup_six_star" },
      { kind: "block", type: "logoup_four_star" },
      { kind: "block", type: "logoup_arc" },
      { kind: "block", type: "logoup_line_len" },
      { kind: "block", type: "logoup_arc_to" },
      { kind: "block", type: "logoup_line_to" },
      { kind: "block", type: "logoup_spirograph" },
    ],
  },
  {
    kind: "category",
    name: "🚀 三维绘图",
    colour: LOGOUP_COLORS.DRAWING_3D,
    contents: [
      { kind: "block", type: "logoup_up" },
      { kind: "block", type: "logoup_body" },
      { kind: "block", type: "logoup_done_3d" },
      { kind: "block", type: "logoup_reset" },
      { kind: "block", type: "logoup_color" },
      { kind: "block", type: "logoup_scale" },
      { kind: "block", type: "logoup_yaw" },
      { kind: "block", type: "logoup_pitch" },
      { kind: "block", type: "logoup_roll" },
      { kind: "block", type: "logoup_jump" },
      { kind: "block", type: "logoup_link" },
      { kind: "block", type: "logoup_move" },
      { kind: "block", type: "logoup_shift" },
      { kind: "block", type: "logoup_subtract" },
    ],
  },
  {
    kind: "category",
    name: "🛰️ 三维进阶",
    colour: LOGOUP_COLORS.ADVANCED_3D,
    contents: [
      { kind: "block", type: "logoup_extrude" },
      { kind: "block", type: "logoup_cextrude" },
      { kind: "block", type: "logoup_pyramid" },
      { kind: "block", type: "logoup_cave" },
      { kind: "block", type: "logoup_moveto" },
      { kind: "block", type: "logoup_movexto" },
      { kind: "block", type: "logoup_moveyto" },
      { kind: "block", type: "logoup_movezto" },
      { kind: "block", type: "logoup_yawto" },
      { kind: "block", type: "logoup_pitchto" },
      { kind: "block", type: "logoup_rollto" },
      { kind: "block", type: "logoup_scalex" },
      { kind: "block", type: "logoup_scaley" },
      { kind: "block", type: "logoup_normal" },
      { kind: "block", type: "logoup_normalto" },
      { kind: "block", type: "logoup_rotatex" },
      { kind: "block", type: "logoup_rotatey" },
      { kind: "block", type: "logoup_rotatez" },
      { kind: "block", type: "logoup_warpx" },
      { kind: "block", type: "logoup_warpy" },
    ],
  },
  {
    kind: "category",
    name: "🧱 三维构件",
    colour: LOGOUP_COLORS.COMPONENTS_3D,
    contents: [
      { kind: "block", type: "logoup_box" },
      { kind: "block", type: "logoup_cylinder" },
      { kind: "block", type: "logoup_sphere" },
      { kind: "block", type: "logoup_ellipsoid" },
      { kind: "block", type: "logoup_cone" },
      { kind: "block", type: "logoup_pyramid_solid" },
      {
        kind: "block",
        type: "logoup_torus",
        inputs: {
          MAJOR_RADIUS: { shadow: { type: "math_number", fields: { NUM: 10 } } },
          MINOR_RADIUS: { shadow: { type: "math_number", fields: { NUM: 4 } } },
        },
      },
    ],
  },
];

// 3. build123d 专业建模分类
const BUILD123D_SPECIFIC_CATEGORIES = [
  {
    kind: "category",
    name: "🏗️ 建造者容器",
    colour: CATEGORY_COLORS.BUILDER,
    contents: [
      { kind: "block", type: "b3d_build_part" },
      { kind: "block", type: "b3d_build_sketch" },
      { kind: "block", type: "b3d_select_face" },
      { kind: "block", type: "b3d_build_line" },
      { kind: "block", type: "b3d_line" },
      { kind: "block", type: "b3d_three_point_arc" },
      { kind: "block", type: "b3d_make_face" },
      { kind: "block", type: "b3d_comment" },
    ],
  },
  {
    kind: "category",
    name: "🧱 3D 基础实体",
    colour: CATEGORY_COLORS.PRIMITIVE_3D,
    contents: [
      { kind: "block", type: "b3d_box" },
      { kind: "block", type: "b3d_cylinder" },
      { kind: "block", type: "b3d_sphere" },
      { kind: "block", type: "b3d_cone" },
      { kind: "block", type: "b3d_torus" },
      { kind: "block", type: "b3d_wedge" },
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
          WIDTH: { shadow: { type: "math_number", fields: { NUM: 20 } } },
          HEIGHT: { shadow: { type: "math_number", fields: { NUM: 20 } } },
        },
      },
      {
        kind: "block",
        type: "b3d_sketch_circle",
        inputs: {
          RADIUS: { shadow: { type: "math_number", fields: { NUM: 10 } } },
        },
      },
      { kind: "block", type: "b3d_sketch_regular_polygon" },
      { kind: "block", type: "b3d_sketch_polygon" },
      { kind: "block", type: "b3d_sketch_polyline" },
      { kind: "block", type: "b3d_sketch_slot" },
      { kind: "block", type: "b3d_sketch_ellipse" },
      { kind: "block", type: "b3d_sketch_text" },
      { kind: "block", type: "b3d_mirror" },
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
          AMOUNT: { shadow: { type: "math_number", fields: { NUM: 10 } } },
        },
      },
      {
        kind: "block",
        type: "b3d_revolve",
        inputs: {
          ANGLE: { shadow: { type: "math_number", fields: { NUM: 360 } } },
        },
      },
      { kind: "block", type: "b3d_loft" },
      { kind: "block", type: "b3d_fillet" },
      { kind: "block", type: "b3d_chamfer" },
      { kind: "block", type: "b3d_hole" },
      { kind: "block", type: "b3d_offset" },
      { kind: "block", type: "b3d_split" },
      { kind: "block", type: "b3d_color" },
    ],
  },
  {
    kind: "category",
    name: "📍 定位与阵列",
    colour: CATEGORY_COLORS.TRANSFORM,
    contents: [
      { kind: "block", type: "b3d_locations" },
      { kind: "block", type: "b3d_grid_locations" },
      { kind: "block", type: "b3d_polar_locations" },
      { kind: "block", type: "b3d_hex_locations" },
    ],
  },
  {
    kind: "category",
    name: "🐢 3D 海龟绘图",
    colour: CATEGORY_COLORS.TURTLE,
    contents: [
      { kind: "block", type: "b3d_turtle3d_container" },
      { kind: "block", type: "b3d_turtle3d_forward" },
      { kind: "block", type: "b3d_turtle3d_turn" },
      { kind: "block", type: "b3d_turtle3d_pitch" },
      { kind: "block", type: "b3d_turtle3d_roll" },
      { kind: "block", type: "b3d_turtle3d_arc" },
      { kind: "block", type: "b3d_turtle3d_branch" },
      { kind: "block", type: "b3d_turtle3d_set_radius" },
      { kind: "block", type: "b3d_turtle3d_pen" },
      { kind: "block", type: "b3d_turtle3d_home" },
    ],
  },
  {
    kind: "category",
    name: "⚙️ 教学宏与高级",
    colour: CATEGORY_COLORS.MACRO,
    contents: [
      { kind: "block", type: "cq_macro_radial_array" },
      { kind: "block", type: "cq_macro_flange" },
    ],
  },
];

// 4. CadQuery 专业模式分类体系 (Workplane 链式造型)
const CADQUERY_SPECIFIC_CATEGORIES = [
  {
    kind: "category",
    name: "📐 工作平面与基准",
    colour: "#9333ea",
    contents: [
      { kind: "block", type: "cq_init_workplane" },
      { kind: "block", type: "cq_chain_workplane" },
      { kind: "block", type: "cq_chain_assign" },
      { kind: "block", type: "cq_chain_part_ref" },
      { kind: "block", type: "cq_sel_face" },
      { kind: "block", type: "cq_sel_offset" },
      { kind: "block", type: "cq_op_transform" },
    ],
  },
  {
    kind: "category",
    name: "🧱 基础实体",
    colour: "#8b5cf6",
    contents: [
      { kind: "block", type: "cq_op_box" },
      { kind: "block", type: "cq_op_cylinder" },
      { kind: "block", type: "cq_op_sphere" },
      { kind: "block", type: "cq_op_cone" },
    ],
  },
  {
    kind: "category",
    name: "✏️ 截面与草图",
    colour: "#7c3aed",
    contents: [
      {
        kind: "block",
        type: "cq_sketch_rect",
        inputs: {
          WIDTH: { shadow: { type: "math_number", fields: { NUM: 20 } } },
          HEIGHT: { shadow: { type: "math_number", fields: { NUM: 20 } } },
        },
      },
      {
        kind: "block",
        type: "cq_sketch_circle",
        inputs: {
          RADIUS: { shadow: { type: "math_number", fields: { NUM: 10 } } },
        },
      },
      { kind: "block", type: "cq_sketch_polygon" },
      { kind: "block", type: "cq_sketch_polyline" },
      { kind: "block", type: "cq_sketch_slot" },
      { kind: "block", type: "cq_sketch_ellipse" },
      { kind: "block", type: "cq_chain_rect" },
      { kind: "block", type: "cq_chain_circle" },
      { kind: "block", type: "cq_chain_polygon" },
    ],
  },
  {
    kind: "category",
    name: "📦 实体特征与切削",
    colour: "#6366f1",
    contents: [
      {
        kind: "block",
        type: "cq_op_extrude",
        inputs: {
          DISTANCE: { shadow: { type: "math_number", fields: { NUM: 10 } } },
        },
      },
      {
        kind: "block",
        type: "cq_op_revolve",
        inputs: {
          ANGLE: { shadow: { type: "math_number", fields: { NUM: 360 } } },
        },
      },
      { kind: "block", type: "cq_op_hole" },
      { kind: "block", type: "cq_op_cut_blind" },
      { kind: "block", type: "cq_op_fillet" },
      { kind: "block", type: "cq_op_chamfer" },
      { kind: "block", type: "cq_op_shell" },
      { kind: "block", type: "cq_op_text" },
      { kind: "block", type: "cq_chain_extrude" },
      { kind: "block", type: "cq_chain_hole" },
      { kind: "block", type: "cq_chain_loft" },
      { kind: "block", type: "cq_chain_cut_blind" },
    ],
  },
  {
    kind: "category",
    name: "⚙️ 工业宏与阵列",
    colour: "#4f46e5",
    contents: [
      { kind: "block", type: "cq_op_polar_array" },
      { kind: "block", type: "cq_op_cooling_slots" },
      { kind: "block", type: "cq_macro_radial_array" },
      { kind: "block", type: "cq_macro_flange" },
      { kind: "block", type: "cq_comment" },
    ],
  },
];

/**
 * 根据当前工作模式动态生成专属积木工具箱配置
 * 彻底隐藏无关模式的积木分类，降低认知负荷并大幅减少 DOM 渲染节点数
 */
export function getToolboxForMode(mode: WorkingMode = "build123d") {
  if (mode === "logoup") {
    return {
      kind: "categoryToolbox",
      contents: [
        LOGOUP_CONTROL_CATEGORY,
        LOGOUP_MATH_CATEGORY,
        ...LOGOUP_SPECIFIC_CATEGORIES,
      ],
    };
  }

  if (mode === "cadquery") {
    return {
      kind: "categoryToolbox",
      contents: [
        LOGOUP_CONTROL_CATEGORY,
        LOGOUP_MATH_CATEGORY,
        ...CADQUERY_SPECIFIC_CATEGORIES,
      ],
    };
  }

  // 默认 build123d 专业模式
  return {
    kind: "categoryToolbox",
    contents: [
      LOGOUP_CONTROL_CATEGORY,
      LOGOUP_MATH_CATEGORY,
      ...BUILD123D_SPECIFIC_CATEGORIES,
    ],
  };
}

// 导出向后兼容的全量工具箱
export const BUILD123D_TOOLBOX = getToolboxForMode("build123d");
export const CADQUERY_TOOLBOX = getToolboxForMode("cadquery");
export const LOGOUP_TOOLBOX = getToolboxForMode("logoup");
