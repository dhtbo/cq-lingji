import { registerInitializerBlocks } from "./initializer";
import { registerSketchBlocks } from "./sketches";
import { registerOperation3DBlocks } from "./operations3d";
import { registerTransformBlocks } from "./transforms";
import { registerMacroBlocks } from "./macros";
import { registerCommentBlocks } from "./comments";
import { registerVariableBlocks } from "./variables";
import { registerTurtle3DBlocks } from "./turtle3d";
import { registerLogoUp3DBlocks } from "./logoup3d";

let initialized = false;

/**
 * 注册所有自定义 build123d / CadQuery / LogoUp 积木
 */
export function registerAllBuild123dBlocks() {
  if (initialized) return;
  registerInitializerBlocks();
  registerSketchBlocks();
  registerOperation3DBlocks();
  registerTransformBlocks();
  registerMacroBlocks();
  registerCommentBlocks();
  registerVariableBlocks();
  registerTurtle3DBlocks();
  registerLogoUp3DBlocks();
  initialized = true;
}

export const registerAllCadQueryBlocks = registerAllBuild123dBlocks;
