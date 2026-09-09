import * as Blockly from "blockly";
import { CATEGORY_COLORS } from "./blocks/types";

/**
 * 定义融合 Zelos (Scratch风格圆角) 与 CAD 明暗美学的 Blockly 主题
 * @param colorMode "light" | "dark"
 */
export function createCadQueryZelosTheme(colorMode: "light" | "dark" = "dark"): Blockly.Theme {
  const baseTheme = (Blockly.Themes as any).Zelos || Blockly.Themes.Classic;
  const isLight = colorMode === "light";
  const themeName = isLight ? "cadquery_zelos_light" : "cadquery_zelos_dark";

  return Blockly.Theme.defineTheme(themeName, {
    name: themeName,
    base: baseTheme,
    componentStyles: {
      workspaceBackgroundColour: isLight ? "#f8fafc" : "#0d1117",
      toolboxBackgroundColour: isLight ? "#ffffff" : "#161b22",
      toolboxForegroundColour: isLight ? "#1f2937" : "#e6edf3",
      flyoutBackgroundColour: isLight ? "#ffffff" : "#1c2128",
      flyoutForegroundColour: isLight ? "#1f2937" : "#c9d1d9",
      flyoutOpacity: isLight ? 0.98 : 0.96,
      scrollbarColour: isLight ? "#cbd5e1" : "#30363d",
      scrollbarOpacity: 0.7,
      insertionMarkerColour: isLight ? "#2563eb" : "#388bfd",
      insertionMarkerOpacity: 0.4,
      markerColour: isLight ? "#2563eb" : "#58a6ff",
      cursorColour: isLight ? "#2563eb" : "#58a6ff",
    },
    categoryStyles: {
      initializer_category: {
        colour: CATEGORY_COLORS.INITIALIZER,
      },
      sketch_category: {
        colour: CATEGORY_COLORS.SKETCH,
      },
      operation_category: {
        colour: CATEGORY_COLORS.OPERATION_3D,
      },
      transform_category: {
        colour: CATEGORY_COLORS.TRANSFORM,
      },
      macro_category: {
        colour: CATEGORY_COLORS.MACRO,
      },
      logic_category: {
        colour: CATEGORY_COLORS.LOGIC,
      },
      math_category: {
        colour: CATEGORY_COLORS.MATH,
      },
      loop_category: {
        colour: CATEGORY_COLORS.LOOP,
      },
      variable_category: {
        colour: CATEGORY_COLORS.VARIABLE,
      },
      procedure_category: {
        colour: CATEGORY_COLORS.PROCEDURE,
      },
    },
    blockStyles: {
      logic_blocks: {
        colourPrimary: CATEGORY_COLORS.LOGIC,
        colourSecondary: "#2563eb",
        colourTertiary: "#1d4ed8",
      },
      math_blocks: {
        colourPrimary: CATEGORY_COLORS.MATH,
        colourSecondary: "#7c3aed",
        colourTertiary: "#6d28d9",
      },
      loop_blocks: {
        colourPrimary: CATEGORY_COLORS.LOOP,
        colourSecondary: "#059669",
        colourTertiary: "#047857",
      },
      variable_blocks: {
        colourPrimary: CATEGORY_COLORS.VARIABLE,
        colourSecondary: "#d97706",
        colourTertiary: "#b45309",
      },
      procedure_blocks: {
        colourPrimary: CATEGORY_COLORS.PROCEDURE,
        colourSecondary: "#db2777",
        colourTertiary: "#be185d",
      },
    },
  });
}
