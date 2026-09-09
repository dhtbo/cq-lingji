import { registerInitializerBlocks } from "./initializer";
import { registerSketchBlocks } from "./sketches";
import { registerOperation3DBlocks } from "./operations3d";
import { registerTransformBlocks } from "./transforms";
import { registerMacroBlocks } from "./macros";
import { registerCommentBlocks } from "./comments";

let initialized = false;

/**
 * 注册所有自定义 CadQuery 积木
 */
export function registerAllCadQueryBlocks() {
  if (initialized) return;
  registerInitializerBlocks();
  registerSketchBlocks();
  registerOperation3DBlocks();
  registerTransformBlocks();
  registerMacroBlocks();
  registerCommentBlocks();
  initialized = true;
}
