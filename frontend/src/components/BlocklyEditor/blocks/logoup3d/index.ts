import { registerLogoUpControlBlocks } from "./logoup_control";
import { registerLogoUpDrawing2DBlocks } from "./logoup_drawing2d";
import { registerLogoUpAdvanced2DBlocks } from "./logoup_advanced2d";
import { registerLogoUpComponents2DBlocks } from "./logoup_components2d";
import { registerLogoUpDrawing3DBlocks } from "./logoup_drawing3d";
import { registerLogoUpAdvanced3DBlocks } from "./logoup_advanced3d";
import { registerLogoUpComponents3DBlocks } from "./logoup_components3d";
import { registerLogoUpMathBlocks } from "./logoup_math";

/**
 * 统一注册所有 LogoUp 3D 图形化积木
 */
export function registerLogoUp3DBlocks() {
  registerLogoUpControlBlocks();
  registerLogoUpMathBlocks();
  registerLogoUpDrawing2DBlocks();
  registerLogoUpAdvanced2DBlocks();
  registerLogoUpComponents2DBlocks();
  registerLogoUpDrawing3DBlocks();
  registerLogoUpAdvanced3DBlocks();
  registerLogoUpComponents3DBlocks();
}
