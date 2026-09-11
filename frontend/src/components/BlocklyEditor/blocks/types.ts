/**
 * Blockly build123d 积木常量与颜色体系
 */

export const CATEGORY_COLORS = {
  BUILDER: "#0284c7",     // 浅蓝/深天蓝 - 建造者容器 (BuildPart, BuildSketch)
  INITIALIZER: "#0891b2", // 青色 - 基准面与定位
  SKETCH: "#2563eb",      // 蓝色 - 2D 草图图元
  OPERATION_3D: "#7c3aed",// 紫色 - 3D 特征操作 (extrude, fillet, chamfer)
  PRIMITIVE_3D: "#6366f1",// 靛蓝 - 3D 基础体 (Box, Cylinder, Sphere)
  TRANSFORM: "#059669",   // 绿色 - 定位与阵列 (Locations, GridLocations)
  MACRO: "#d97706",       // 琥珀色 - 教学宏与高级装配
  COMMENT: "#64748b",     // 石板灰 - 代码便签与注释
  LOGIC: "#3b82f6",       // 蓝色 - 逻辑判断
  MATH: "#8b5cf6",        // 紫色 - 数学运算
  LOOP: "#10b981",        // 绿色 - 循环控制
  VARIABLE: "#f59e0b",    // 琥珀 - 变量
  TURTLE: "#10b981",      // 翡翠绿 - 3D 空间海龟绘图
  PROCEDURE: "#ec4899",   // 洋红粉 - 自定义函数
};

export const LOGOUP_COLORS = {
  DRAWING_2D: "#00b894",    // 翠绿 - 平面绘图 (GO, TURN, DRAW, DONE, FILL)
  ADVANCED_2D: "#3b82f6",   // 天蓝 - 平面进阶 (CLOSE, OFFSET, GOTO, SETX, TXTSTAMP)
  COMPONENTS_2D: "#c026d3", // 品红洋紫 - 平面构件 (多边形, 圆, 星形, 矩形, 蛋形)
  DRAWING_3D: "#f43f5e",    // 珊瑚红 - 三维绘图 (UP, BODY, COLOR, YAW, PITCH, ROLL, SUBTRACT)
  ADVANCED_3D: "#8b5cf6",   // 梦幻紫 - 三维进阶 (MOVETO, EXTRUDE, CEXTRUDE, PYRAMID, CAVE)
  COMPONENTS_3D: "#7c3aed", // 深紫 - 三维构件 (长方体, 棱锥, 圆环, 圆柱)
  CONTROL: "#f59e0b",       // 暖橙 - 控制流程 (START, PUSH, POP)
};

export const CQ_TYPES = {
  CQ_OBJ: "CQ_OBJ",
  B3D_OBJ: "B3D_OBJ",
  NUMBER: "Number",
  STRING: "String",
  PLANE: "PLANE",
};
