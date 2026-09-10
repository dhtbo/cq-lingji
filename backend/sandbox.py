"""
安全沙箱模块
负责 CadQuery 脚本的 AST 语法安全静态检查、执行超时熔断、错误教学翻译与分步特征提取
"""
import ast
import concurrent.futures
import contextlib
import io
import logging
import math
import random
import traceback
from typing import Any, Dict, List, Optional, Tuple

try:
    import cadquery as cq
except Exception:
    cq = None

import build123d as b3d

logger = logging.getLogger(__name__)

# 允许导入的白名单模块
ALLOWED_MODULES = {"cadquery", "cq", "build123d", "b3d", "math", "random", "numpy", "np"}

def _safe_import(name: str, *args: Any, **kwargs: Any) -> Any:
    """
    运行时受限的 import 函数，作为 AST 静态校验之外的双重安全防线
    """
    base_name = name.split(".")[0]
    if base_name in ALLOWED_MODULES:
        return __import__(name, *args, **kwargs)
    raise ImportError(f"安全沙箱禁止导入模块: '{name}'。仅允许: {', '.join(ALLOWED_MODULES)}")

# 允许的安全内置函数与常量
SAFE_BUILTINS: Dict[str, Any] = {
    "__import__": _safe_import,
    "abs": abs,
    "all": all,
    "any": any,
    "bool": bool,
    "dict": dict,
    "divmod": divmod,
    "enumerate": enumerate,
    "float": float,
    "format": format,
    "int": int,
    "isinstance": isinstance,
    "issubclass": issubclass,
    "len": len,
    "list": list,
    "max": max,
    "min": min,
    "pow": pow,
    "print": print,
    "range": range,
    "reversed": reversed,
    "round": round,
    "set": set,
    "sorted": sorted,
    "str": str,
    "sum": sum,
    "tuple": tuple,
    "zip": zip,
    "True": True,
    "False": False,
    "None": None,
}

# 严格禁止的危险标识符与内建调用
FORBIDDEN_NAMES = {
    "eval",
    "exec",
    "open",
    "compile",
    "globals",
    "locals",
    "vars",
    "input",
    "breakpoint",
    "exit",
    "quit",
    "os",
    "sys",
    "subprocess",
    "shutil",
    "socket",
    "requests",
    "urllib",
    "importlib",
    "builtins",
}


class SecurityValidator(ast.NodeVisitor):
    """
    通过 AST 遍历对输入代码进行深度静态安全审查
    """
    def __init__(self) -> None:
        self.errors: list[str] = []

    def visit_Import(self, node: ast.Import) -> None:
        for alias in node.names:
            base_module = alias.name.split(".")[0]
            if base_module not in ALLOWED_MODULES:
                self.errors.append(
                    f"行 {node.lineno}: 禁止导入模块 '{alias.name}'。仅允许使用: {', '.join(ALLOWED_MODULES)}"
                )
        self.generic_visit(node)

    def visit_ImportFrom(self, node: ast.ImportFrom) -> None:
        if node.module:
            base_module = node.module.split(".")[0]
            if base_module not in ALLOWED_MODULES:
                self.errors.append(
                    f"行 {node.lineno}: 禁止从模块 '{node.module}' 导入。仅允许使用: {', '.join(ALLOWED_MODULES)}"
                )
        self.generic_visit(node)

    def visit_Name(self, node: ast.Name) -> None:
        if node.id in FORBIDDEN_NAMES:
            self.errors.append(f"行 {node.lineno}: 禁止使用受限函数或变量 '{node.id}'")
        self.generic_visit(node)

    def visit_Attribute(self, node: ast.Attribute) -> None:
        # 防范双下划线属性反射穿透（如 __class__, __subclasses__, __globals__）
        if node.attr.startswith("__") and node.attr.endswith("__"):
            self.errors.append(f"行 {node.lineno}: 禁止访问私有内部属性 '{node.attr}'")
        self.generic_visit(node)


def translate_cad_error(raw_error: str) -> str:
    """
    将 OpenCASCADE / build123d / CadQuery 底层几何与语法报错翻译为直观、可操作的人类教学诊断
    """
    lower = raw_error.lower()
    if "brep_api" in lower or "command not done" in lower:
        return (
            "💡 OpenCASCADE 几何内核计算未完成。常见原因：\n"
            "1. 倒圆角(fillet)或倒斜角(chamfer)尺寸过大，超过了实体邻近边缘厚度；\n"
            "2. 草图截面自相重叠或孔与实体边缘发生薄壁相切碰撞。\n"
            "建议：尝试调小 fillet/chamfer 尺寸（例如改为 1.0~2.0），或微调孔的位置。"
        )
    if "wire is not closed" in lower or "not closed" in lower:
        return "💡 草图线框未闭合，无法拉伸为实体。请确保草图通过 .close() 闭合或使用了矩形/圆形等闭合图元。"
    if "standard_constructionerror" in lower or "constructionerror" in lower:
        return "💡 几何构造参数非法。请检查是否有非法的 0 或负数尺寸（如半径、直径或拉伸厚度）。"
    if "no cadquery" in lower or "未发现" in lower or "no object" in lower:
        return "💡 未检测到有效的 3D 实体对象。请确保在代码中创建了模型（例如使用 with BuildPart() as part: ... 或 part = ...），或使用 show_object(part) 显式展示。"
    if "is not defined" in lower:
        name = raw_error.split("'")[1] if "'" in raw_error else "变量"
        return f"💡 未定义的名称 '{name}'。请检查拼写，或确认该变量在当前代码或所选时间旅行步骤中是否已初始化。"
    return f"代码执行异常: {raw_error}"


def validate_code_ast(code: str) -> None:
    """
    静态解析并校验代码安全性，如果不安全抛出 ValueError
    """
    try:
        tree = ast.parse(code)
    except SyntaxError as e:
        raise ValueError(f"语法错误 (第 {e.lineno} 行): {e.msg}") from e

    validator = SecurityValidator()
    validator.visit(tree)
    if validator.errors:
        raise ValueError("安全校验未通过:\n" + "\n".join(validator.errors))


def get_code_steps(code: str) -> List[Dict[str, Any]]:
    """
    基于 AST 解析顶层有效建模语句，用于特征生长时间旅行回放
    """
    try:
        tree = ast.parse(code)
    except Exception:
        return []

    lines = code.splitlines()
    steps: List[Dict[str, Any]] = []
    step_num = 1
    for node in tree.body:
        # 跳过纯 import 语句
        if isinstance(node, (ast.Import, ast.ImportFrom)):
            continue
        stmt_lines = lines[node.lineno - 1 : node.end_lineno]
        stmt_code = "\n".join(stmt_lines).strip()
        if stmt_code:
            steps.append({
                "step": step_num,
                "code": stmt_code,
                "end_line": node.end_lineno,
            })
            step_num += 1
    return steps


def _run_script_worker(code: str) -> Tuple[Dict[str, Any], str, Dict[str, Any]]:
    """
    在受限环境中执行代码并返回 (局部变量字典, 捕获的控制台 stdout 输出, 注册的 CQ 实体字典)
    全面兼容 CQ-Editor 内置的 show_object, show, debug, log, rand_color, reset_show 等函数
    """
    stdout_buf = io.StringIO()
    cq_objects: Dict[str, Any] = {}

    def _show_object(
        obj: Any,
        name: Optional[str] = None,
        options: Optional[Dict[str, Any]] = None,
        **kwargs: Any,
    ) -> None:
        """
        兼容 CQ-Editor 的 show_object 函数，登记待视口渲染的 CadQuery 实体
        """
        opts = dict(options or {})
        opts.update(kwargs)
        target_name = name or f"part_{len(cq_objects) + 1}"
        cq_objects[target_name] = {
            "shape": obj,
            "name": target_name,
            "options": opts,
        }

    def _show(
        obj: Any,
        name: Optional[str] = None,
        options: Optional[Dict[str, Any]] = None,
        **kwargs: Any,
    ) -> None:
        """
        兼容 CQ-Editor 的 show 简写函数
        """
        _show_object(obj, name=name, options=options, **kwargs)

    def _debug(
        obj: Any,
        name: Optional[str] = None,
        options: Optional[Dict[str, Any]] = None,
        **kwargs: Any,
    ) -> None:
        """
        兼容 CQ-Editor 的 debug 调试显示函数 (默认半透明红光)
        """
        opts = dict(options or {})
        opts.setdefault("color", "red")
        opts.setdefault("alpha", 0.3)
        _show_object(obj, name=name or f"debug_{len(cq_objects) + 1}", options=opts, **kwargs)

    def _log(msg: Any) -> None:
        """
        兼容 CQ-Editor 的 log 调试输出函数
        """
        print(f"[LOG] {msg}")

    def _rand_color(alpha: float = 0.0, cfloat: bool = False) -> Any:
        """
        兼容 CQ-Editor 的 rand_color 颜色辅助函数
        """
        r = random.randint(30, 220)
        g = random.randint(30, 220)
        b = random.randint(30, 220)
        if cfloat:
            return (r / 255.0, g / 255.0, b / 255.0, alpha)
        return {"alpha": alpha, "color": (r, g, b)}

    def _reset_show() -> None:
        """
        清空已注册的视口对象
        """
        cq_objects.clear()

    custom_cq_funcs = {
        "show_object": _show_object,
        "show": _show,
        "debug": _debug,
        "log": _log,
        "rand_color": _rand_color,
        "reset_show": _reset_show,
    }

    builtins_env = dict(SAFE_BUILTINS)
    builtins_env.update(custom_cq_funcs)

    # 导出 build123d 常用类与函数，使其如同 from build123d import * 一样开箱即用
    b3d_symbols = {
        name: getattr(b3d, name)
        for name in dir(b3d)
        if not name.startswith("_") and name not in FORBIDDEN_NAMES
    }

    global_env = {
        "__builtins__": builtins_env,
        "cq": cq,
        "cadquery": cq,
        "b3d": b3d,
        "build123d": b3d,
        "math": math,
        "random": random,
        **b3d_symbols,
        **custom_cq_funcs,
    }
    local_env: Dict[str, Any] = {}

    try:
        with contextlib.redirect_stdout(stdout_buf):
            exec(code, global_env, local_env)
    except Exception as e:
        # 将已捕获的控制台输出附加到异常对象上
        setattr(e, "captured_stdout", stdout_buf.getvalue())
        raise e

    return local_env, stdout_buf.getvalue(), cq_objects


def _compose_multi_layer_cad_object(obj: Any) -> Any:
    """
    智能合成多图层 CAD 对象（模型 + 草图同时显示）:
    当 Workplane 既包含底层 3D 实体模型 (Solid/Compound)，
    又正在表面绘制 2D 草图线框 (Wires) 时，
    将两者组装为 Assembly 装配体，确保 3D 视口中同时呈现实体与草图。
    """
    if cq is None or not isinstance(obj, cq.Workplane):
        return obj

    try:
        solid = obj.findSolid()
    except Exception:
        solid = None

    try:
        wires = obj.wires().vals()
    except Exception:
        wires = []

    # 如果既有底层 3D 实体，又有当前正在绘制/未拉伸的 2D 草图线框
    if solid and wires:
        try:
            val = obj.val()
            if isinstance(val, cq.Wire) or (isinstance(val, cq.Compound) and not isinstance(val, cq.Solid)):
                assy = cq.Assembly()
                # 3D 实体模型：基准经典蓝
                assy.add(solid, name="model", color=cq.Color("#3b82f6"))
                # 2D 草图轮廓：亮金黄色高亮
                for i, w in enumerate(wires):
                    assy.add(w, name=f"sketch_{i + 1}", color=cq.Color("#f59e0b"))
                return assy
        except Exception as e:
            logger.warning(f"合成草图与模型图层失败，降级返回原对象: {e}")

    return obj


def execute_cq_sandboxed(
    code: str,
    step: Optional[int] = None,
    timeout: float = 4.0
) -> Tuple[Any, List[Dict[str, Any]], int, str]:
    """
    安全沙箱执行 CadQuery 代码，支持单步时间旅行、教学错误诊断与控制台 stdout 捕获
    兼容原生 CadQuery 脚本、CQ-Editor 脚本 (show_object/debug) 及 Blockly 自动生成代码
    
    :param code: 用户输入的 Python/CadQuery 代码
    :param step: 指定回放到第几个建模语句（1-indexed，None 为完整运行）
    :param timeout: 超时时间（秒）
    :return: (part实体, 步骤列表, 当前执行步骤号, 捕获的控制台输出)
    """
    # 1. 静态 AST 审查
    validate_code_ast(code)

    # 2. 解析分步节点
    steps = get_code_steps(code)
    actual_step = len(steps)

    exec_code = code
    if step is not None and 1 <= step <= len(steps):
        target_end_line = steps[step - 1]["end_line"]
        lines = code.splitlines()
        exec_code = "\n".join(lines[:target_end_line])
        actual_step = step
        # 确保包含 import
        if "import cadquery as cq" not in exec_code:
            exec_code = "import cadquery as cq\n" + exec_code

    captured_stdout = ""
    # 3. 超时执行保护
    with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
        future = executor.submit(_run_script_worker, exec_code)
        try:
            local_vars, captured_stdout, cq_objects = future.result(timeout=timeout)
        except concurrent.futures.TimeoutError as e:
            raise TimeoutError(f"代码执行超时（超过 {timeout} 秒），请检查是否存在过大循环或过于繁重的几何布尔运算") from e
        except Exception as e:
            clean_msg = str(e)
            if not clean_msg:
                clean_msg = type(e).__name__
            translated = translate_cad_error(clean_msg)
            err = RuntimeError(translated)
            setattr(err, "captured_stdout", getattr(e, "captured_stdout", ""))
            raise err from e

    # 4. 智能查找并提取目标几何对象（优先 build123d，兼容 CadQuery）
    # 辅助：将 build123d / CadQuery 各种包装类型统一提取为几何实体
    def _unwrap_geo(val: Any) -> Any:
        if isinstance(val, b3d.BuildPart):
            try:
                res = val.part
            except Exception:
                res = None
            if res is None:
                # 兼容未执行 3D 特征操作（如 extrude）仅含草图/路径的 BuildPart
                try:
                    if hasattr(val, "pending_faces") and val.pending_faces:
                        res = val.pending_faces[0] if len(val.pending_faces) == 1 else b3d.Compound(children=val.pending_faces)
                    elif hasattr(val, "pending_edges") and val.pending_edges:
                        res = val.pending_edges[0] if len(val.pending_edges) == 1 else b3d.Compound(children=val.pending_edges)
                except Exception:
                    pass
            if hasattr(val, "color") and val.color is not None and res is not None:
                try:
                    res.color = val.color
                except Exception:
                    pass
            return res

        if isinstance(val, b3d.BuildSketch):
            try:
                res = val.sketch
            except Exception:
                res = None
            if res is None:
                try:
                    if hasattr(val, "faces") and callable(val.faces):
                        faces = val.faces()
                        if faces:
                            res = faces[0] if len(faces) == 1 else b3d.Compound(children=faces)
                except Exception:
                    pass
                if res is None and hasattr(val, "pending_edges") and val.pending_edges:
                    try:
                        res = val.pending_edges[0] if len(val.pending_edges) == 1 else b3d.Compound(children=val.pending_edges)
                    except Exception:
                        pass
            if hasattr(val, "color") and val.color is not None and res is not None:
                try:
                    res.color = val.color
                except Exception:
                    pass
            return res

        if isinstance(val, b3d.BuildLine):
            try:
                res = val.line
            except Exception:
                res = None
            if hasattr(val, "color") and val.color is not None and res is not None:
                try:
                    res.color = val.color
                except Exception:
                    pass
            return res

        return val

    def _is_geo_obj(val: Any) -> bool:
        if isinstance(val, b3d.BuildPart):
            try:
                if val.part is not None:
                    return True
            except Exception:
                pass
            return bool(getattr(val, "pending_faces", None)) or bool(getattr(val, "pending_edges", None))
        if isinstance(val, b3d.BuildSketch):
            try:
                if val.sketch is not None:
                    return True
            except Exception:
                pass
            return bool(getattr(val, "pending_edges", None)) or (hasattr(val, "faces") and bool(val.faces()))
        if isinstance(val, b3d.BuildLine):
            try:
                return val.line is not None
            except Exception:
                return False
        if isinstance(val, (b3d.Part, b3d.Solid, b3d.Compound, b3d.Sketch, b3d.Curve, b3d.Wire, b3d.Face, b3d.Edge, b3d.Shape)):
            return True
        if hasattr(val, "wrapped") and "TopoDS" in type(getattr(val, "wrapped")).__name__:
            return True
        if cq is not None and isinstance(val, (cq.Workplane, cq.Shape, cq.Assembly)):
            return True
        return False

    # 优先级 1: 用户显式通过 show_object() / show() / debug() 注册的对象
    if cq_objects:
        def _parse_color(color_val):
            if not color_val:
                return None
            try:
                if cq is not None:
                    if isinstance(color_val, str):
                        return cq.Color(color_val)
                    elif isinstance(color_val, (tuple, list)):
                        c_vals = [c / 255.0 if any(v > 1.0 for v in color_val) else c for c in color_val]
                        return cq.Color(*c_vals)
                else:
                    if isinstance(color_val, str):
                        return b3d.Color(color_val)
                    elif isinstance(color_val, (tuple, list)):
                        c_vals = [c / 255.0 if any(v > 1.0 for v in color_val) else c for c in color_val]
                        return b3d.Color(*c_vals)
            except Exception:
                return None
            return None

        if len(cq_objects) == 1:
            item = list(cq_objects.values())[0]
            part = _unwrap_geo(item["shape"])
            opts = item.get("options") or {}
            color_obj = _parse_color(opts.get("color"))
            if color_obj and cq is not None:
                assy = cq.Assembly()
                assy.add(part, name=item["name"], color=color_obj)
                return assy, steps, actual_step, captured_stdout
            return part, steps, actual_step, captured_stdout
        else:
            # 注册了多个对象时，自动组合为 Assembly 或 Compound
            if cq is not None:
                assy = cq.Assembly()
                for item in cq_objects.values():
                    shape_obj = _unwrap_geo(item["shape"])
                    shape_name = item["name"]
                    opts = item.get("options") or {}
                    color_obj = _parse_color(opts.get("color"))
                    assy.add(shape_obj, name=shape_name, color=color_obj)
                return assy, steps, actual_step, captured_stdout
            else:
                children = [_unwrap_geo(item["shape"]) for item in cq_objects.values()]
                valid_children = [c for c in children if c is not None]
                if len(valid_children) == 1:
                    return valid_children[0], steps, actual_step, captured_stdout
                compound = b3d.Compound(children=valid_children)
                return compound, steps, actual_step, captured_stdout

    # 优先级 2: 变量名明确为 part, result, 或 model
    target_names = ["part", "result", "model", "p", "s"]
    for name in target_names:
        if name in local_vars:
            val = local_vars[name]
            if _is_geo_obj(val):
                geo = _unwrap_geo(val)
                if geo is not None:
                    # 检查是否为 CadQuery Workplane 多图层合成
                    if cq is not None and isinstance(geo, cq.Workplane):
                        geo = _compose_multi_layer_cad_object(geo)
                    return geo, steps, actual_step, captured_stdout

    # 优先级 3: 扫描局部变量字典中的几何实体
    found_parts = []
    found_sketches = []
    for var_name, val in local_vars.items():
        if _is_geo_obj(val):
            unwrapped = _unwrap_geo(val)
            if unwrapped is None:
                continue

            # 判断是否为真正具有 3D 实体的 Part / Solid
            is_3d = False
            if isinstance(unwrapped, (b3d.Part, b3d.Solid)):
                is_3d = True
            elif isinstance(unwrapped, b3d.Compound):
                children = getattr(unwrapped, "children", [])
                if any(isinstance(c, (b3d.Solid, b3d.Part)) for c in children):
                    is_3d = True
            elif cq is not None and isinstance(unwrapped, (cq.Solid, cq.Workplane)):
                is_3d = True

            if is_3d:
                found_parts.append((var_name, unwrapped, val))
            else:
                found_sketches.append((var_name, unwrapped, val))

    if found_parts:
        # 如果同时存在 3D 实体与正在绘制的草图，组合在装配体/复合体中一起展示
        if found_sketches:
            if cq is not None:
                assy = cq.Assembly()
                for name, p_item, _ in found_parts:
                    if p_item is not None:
                        assy.add(p_item, name=name, color=cq.Color("#3b82f6"))
                for name, s_item, _ in found_sketches:
                    if s_item is not None:
                        assy.add(s_item, name=f"sketch_{name}", color=cq.Color("#f59e0b"))
                return assy, steps, actual_step, captured_stdout
            else:
                valid_children = [p for _, p, _ in found_parts if p is not None] + [s for _, s, _ in found_sketches if s is not None]
                if len(valid_children) == 1:
                    return valid_children[0], steps, actual_step, captured_stdout
                return b3d.Compound(children=valid_children), steps, actual_step, captured_stdout

        if len(found_parts) > 1:
            if cq is not None:
                assy = cq.Assembly()
                for name, p_item, _ in found_parts:
                    if p_item is not None:
                        assy.add(p_item, name=name)
                return assy, steps, actual_step, captured_stdout
            else:
                valid_parts = [p for _, p, _ in found_parts if p is not None]
                if len(valid_parts) == 1:
                    return valid_parts[0], steps, actual_step, captured_stdout
                return b3d.Compound(children=valid_parts), steps, actual_step, captured_stdout

        target_name, target_geo, _ = found_parts[-1]
        logger.info(f"在局部变量 '{target_name}' 中找到 3D 几何实体")
        if cq is not None and isinstance(target_geo, cq.Workplane):
            target_geo = _compose_multi_layer_cad_object(target_geo)
        return target_geo, steps, actual_step, captured_stdout

    if found_sketches:
        # 仅有草图/曲线时：
        # 1. 优先提取 2D 草图表面 (Sketch 或 Face)
        sketch_candidates = [
            (name, unwrapped, orig) for name, unwrapped, orig in found_sketches
            if isinstance(unwrapped, (b3d.Sketch, b3d.Face))
        ]
        if sketch_candidates:
            # 优先选择专门的 BuildSketch，避免包含来自父容器 BuildPart 继承的重复 pending_faces
            dedicated_sketches = [
                (name, unwrapped) for name, unwrapped, orig in sketch_candidates
                if isinstance(orig, b3d.BuildSketch) or not isinstance(orig, b3d.BuildPart)
            ]
            if dedicated_sketches:
                if len(dedicated_sketches) == 1:
                    target_name, target_sketch = dedicated_sketches[0]
                    logger.info(f"在局部变量 '{target_name}' 中找到 2D 草图实体")
                    return target_sketch, steps, actual_step, captured_stdout
                else:
                    children = [s for _, s in dedicated_sketches if s is not None]
                    if len(children) == 1:
                        return children[0], steps, actual_step, captured_stdout
                    return b3d.Compound(children=children), steps, actual_step, captured_stdout

            # 如果只有 BuildPart 的 pending_faces (例如未给 BuildSketch 命名的上下文)
            target_name, target_sketch, _ = sketch_candidates[-1]
            logger.info(f"在局部变量 '{target_name}' 中找到草图面")
            return target_sketch, steps, actual_step, captured_stdout

        # 2. 若无 2D 面，提取 1D 曲线/线框 (BuildLine, Curve, Wire, Edge)
        curve_candidates = [
            (name, unwrapped) for name, unwrapped, orig in found_sketches
            if isinstance(unwrapped, (b3d.Curve, b3d.Wire, b3d.Edge))
        ]
        if curve_candidates:
            if len(curve_candidates) == 1:
                target_name, target_curve = curve_candidates[0]
                logger.info(f"在局部变量 '{target_name}' 中找到 1D 曲线实体")
                return target_curve, steps, actual_step, captured_stdout
            else:
                children = [c for _, c in curve_candidates if c is not None]
                if len(children) == 1:
                    return children[0], steps, actual_step, captured_stdout
                return b3d.Compound(children=children), steps, actual_step, captured_stdout

        # 3. 兜底返回最后一个有效草图
        target_name, target_sketch, _ = found_sketches[-1]
        logger.info(f"在局部变量 '{target_name}' 中找到草图实体")
        return target_sketch, steps, actual_step, captured_stdout

    # 如果是分步时间旅行回放模式，且当前语句仅为前置参数定义（尚未构建几何对象）
    if step is not None:
        return None, steps, actual_step, captured_stdout

    raise ValueError(translate_cad_error("未检测到可渲染的 3D 实体或草图对象。请确保通过 'with BuildPart() as part:' 创建实体，或赋值给变量 (如 part = ...)。"))

