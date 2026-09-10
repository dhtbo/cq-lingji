"""
安全沙箱模块
负责 CadQuery 脚本的 AST 语法安全静态检查、执行超时熔断、错误教学翻译与分步特征提取
"""
import ast
import base64
import concurrent.futures
import contextlib
import io
import logging
import math
import os
import random
import shutil
import sys
import tempfile
import types
import traceback
from typing import Any, Dict, List, Optional, Tuple

# 垫片注入：兼容 novtk 版本的 cadquery-ocp 环境，避免因缺失 VTK 扩展导致 cadquery 导入失败
if "OCP.IVtkOCC" not in sys.modules:
    _mod_occ = types.ModuleType("OCP.IVtkOCC")
    _mod_occ.IVtkOCC_Shape = type("IVtkOCC_Shape", (), {})
    _mod_occ.IVtkOCC_ShapeMesher = type("IVtkOCC_ShapeMesher", (), {})
    sys.modules["OCP.IVtkOCC"] = _mod_occ

if "OCP.IVtkVTK" not in sys.modules:
    _mod_vtk = types.ModuleType("OCP.IVtkVTK")
    _mod_vtk.IVtkVTK_ShapeData = type("IVtkVTK_ShapeData", (), {})
    sys.modules["OCP.IVtkVTK"] = _mod_vtk

try:
    import cadquery as cq
except Exception:
    cq = None

import build123d as b3d

try:
    from backend.turtle3d import Turtle3D
except ImportError:
    from turtle3d import Turtle3D

logger = logging.getLogger(__name__)

# 允许导入的白名单模块（数学计算、几何造型、算法优化与安全工具库）
ALLOWED_MODULES = {
    "cadquery",
    "cq",
    "build123d",
    "b3d",
    "math",
    "random",
    "numpy",
    "np",
    "typing",
    "itertools",
    "functools",
    "collections",
    "dataclasses",
    "ocp_vscode",
    "copy",
    "timeit",
    "re",
    "enum",
    "cmath",
    "decimal",
    "fractions",
    "operator",
    "string",
    "json",
}

def _safe_import(name: str, *args: Any, **kwargs: Any) -> Any:
    """
    运行时受限的 import 函数，作为 AST 静态校验之外的双重安全防线
    """
    base_name = name.split(".")[0]
    if base_name in ALLOWED_MODULES:
        return __import__(name, *args, **kwargs)
    raise ImportError(f"安全沙箱禁止导入模块: '{name}'。仅允许: {', '.join(ALLOWED_MODULES)}")

# 允许访问的合法魔术属性与方法（排除 __class__, __subclasses__, __globals__, __code__, __dict__, __bases__, __mro__ 等内部反射逃逸属性）
ALLOWED_MAGIC_ATTRS = {
    "__init__",
    "__enter__",
    "__exit__",
    "__call__",
    "__str__",
    "__repr__",
    "__len__",
    "__iter__",
    "__next__",
    "__getitem__",
    "__setitem__",
    "__delitem__",
    "__contains__",
    "__eq__",
    "__ne__",
    "__lt__",
    "__le__",
    "__gt__",
    "__ge__",
    "__add__",
    "__sub__",
    "__mul__",
    "__truediv__",
    "__floordiv__",
    "__mod__",
    "__pow__",
    "__radd__",
    "__rsub__",
    "__rmul__",
    "__rtruediv__",
    "__rfloordiv__",
    "__rmod__",
    "__rpow__",
    "__iadd__",
    "__isub__",
    "__imul__",
    "__itruediv__",
    "__ifloordiv__",
    "__imod__",
    "__ipow__",
    "__and__",
    "__or__",
    "__xor__",
    "__invert__",
    "__neg__",
    "__pos__",
    "__abs__",
    "__hash__",
    "__bool__",
    "__name__",
    "__doc__",
    "__module__",
}

def _safe_getattr(obj: Any, name: str, *default: Any) -> Any:
    """受限安全 getattr，防止通过 getattr(obj, '__class__') 绕过 AST 检查"""
    if name.startswith("__") and name.endswith("__") and name not in ALLOWED_MAGIC_ATTRS:
        raise AttributeError(f"安全沙箱禁止访问受限属性: '{name}'")
    if default:
        return getattr(obj, name, default[0])
    return getattr(obj, name)

def _safe_hasattr(obj: Any, name: str) -> bool:
    """受限安全 hasattr"""
    if name.startswith("__") and name.endswith("__") and name not in ALLOWED_MAGIC_ATTRS:
        return False
    return hasattr(obj, name)

def _safe_setattr(obj: Any, name: str, value: Any) -> None:
    """受限安全 setattr，禁止篡改内部属性"""
    if name.startswith("__") and name.endswith("__") and name not in ALLOWED_MAGIC_ATTRS:
        raise AttributeError(f"安全沙箱禁止修改受限属性: '{name}'")
    setattr(obj, name, value)

# 允许的安全内置函数与常量（全面支持函数式与面向对象 class/super）
SAFE_BUILTINS: Dict[str, Any] = {
    "__import__": _safe_import,
    "__build_class__": __build_class__,
    "__name__": "__main__",
    "__doc__": None,
    "abs": abs,
    "all": all,
    "any": any,
    "bool": bool,
    "callable": callable,
    "classmethod": classmethod,
    "dict": dict,
    "divmod": divmod,
    "enumerate": enumerate,
    "float": float,
    "format": format,
    "getattr": _safe_getattr,
    "hasattr": _safe_hasattr,
    "id": id,
    "int": int,
    "isinstance": isinstance,
    "issubclass": issubclass,
    "iter": iter,
    "len": len,
    "list": list,
    "max": max,
    "min": min,
    "next": next,
    "pow": pow,
    "print": print,
    "property": property,
    "range": range,
    "repr": repr,
    "reversed": reversed,
    "round": round,
    "set": set,
    "setattr": _safe_setattr,
    "slice": slice,
    "sorted": sorted,
    "staticmethod": staticmethod,
    "str": str,
    "sum": sum,
    "super": super,
    "tuple": tuple,
    "zip": zip,
    "True": True,
    "False": False,
    "None": None,
    # 常用标准异常类型
    "Exception": Exception,
    "ValueError": ValueError,
    "TypeError": TypeError,
    "KeyError": KeyError,
    "IndexError": IndexError,
    "RuntimeError": RuntimeError,
    "AttributeError": AttributeError,
    "ZeroDivisionError": ZeroDivisionError,
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
    def __init__(self, project_modules: Optional[set[str]] = None) -> None:
        self.errors: list[str] = []
        self.project_modules: set[str] = project_modules or set()

    def _is_allowed(self, mod_name: str) -> bool:
        base = mod_name.split(".")[0]
        return (base in ALLOWED_MODULES) or (base in self.project_modules) or (mod_name in self.project_modules)

    def visit_Import(self, node: ast.Import) -> None:
        for alias in node.names:
            if not self._is_allowed(alias.name):
                self.errors.append(
                    f"行 {node.lineno}: 禁止导入模块 '{alias.name}'。仅允许使用: {', '.join(sorted(ALLOWED_MODULES))}"
                )
        self.generic_visit(node)

    def visit_ImportFrom(self, node: ast.ImportFrom) -> None:
        if node.module:
            if not self._is_allowed(node.module):
                self.errors.append(
                    f"行 {node.lineno}: 禁止从模块 '{node.module}' 导入。仅允许使用: {', '.join(sorted(ALLOWED_MODULES))}"
                )
        self.generic_visit(node)

    def visit_Name(self, node: ast.Name) -> None:
        if node.id in FORBIDDEN_NAMES:
            self.errors.append(f"行 {node.lineno}: 禁止使用受限函数或变量 '{node.id}'")
        self.generic_visit(node)

    def visit_Attribute(self, node: ast.Attribute) -> None:
        # 防范双下划线属性反射穿透（如 __class__, __subclasses__, __globals__）
        if node.attr.startswith("__") and node.attr.endswith("__"):
            if node.attr not in ALLOWED_MAGIC_ATTRS:
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


def validate_code_ast(code: str, project_modules: Optional[set[str]] = None) -> None:
    """
    静态解析并校验代码安全性，如果不安全抛出 ValueError
    """
    try:
        tree = ast.parse(code)
    except SyntaxError as e:
        raise ValueError(f"语法错误 (第 {e.lineno} 行): {e.msg}") from e

    validator = SecurityValidator(project_modules=project_modules)
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


def _create_ocp_vscode_adapter(show_func: Any, show_object_func: Any, reset_func: Any) -> Any:
    """
    创建高性能轻量级 ocp_vscode 兼容模块，直接无缝对接 Studio 3D 视口渲染
    全面兼容: show, show_object, show_clear, reset_show, Camera, Color, Collapse, set_port, set_viewer_config
    """
    import types
    mod = types.ModuleType("ocp_vscode")
    mod.show = show_func
    mod.show_object = show_object_func
    mod.show_clear = reset_func
    mod.reset_show = reset_func
    mod.set_port = lambda *a, **k: None
    mod.set_viewer_config = lambda *a, **k: None

    if b3d is not None:
        mod.Color = getattr(b3d, "Color", None)
    else:
        mod.Color = getattr(cq, "Color", None) if cq is not None else None

    class _CameraEnum:
        RESET = 0
        CENTER = 1
        KEEP = 2

    class _CollapseEnum:
        NONE = 0
        LEAVES = 1
        ALL = 2
        ROOT = 3

    mod.Camera = _CameraEnum
    mod.Collapse = _CollapseEnum
    mod.__file__ = "ocp_vscode_adapter.py"
    return mod


def _create_cq_vis_adapter(studio_show: Any, show_object: Any, reset_show: Any) -> types.ModuleType:
    """
    创建并返回 cadquery.vis 兼容模块
    支持用户编写 from cadquery.vis import show / show_object 并直接路由到工作台视口渲染
    避免在无 VTK 扩展环境下抛出 ModuleNotFoundError: No module named 'OCP.IVtkOCC'
    """
    mod = types.ModuleType("cadquery.vis")
    mod.show = studio_show
    mod.show_object = show_object
    mod.reset_show = reset_show
    mod.__all__ = ["show", "show_object", "reset_show"]
    mod.__file__ = "cadquery_vis_adapter.py"
    return mod



def _run_script_worker(
    code: str,
    files: Optional[Dict[str, str]] = None,
) -> Tuple[Dict[str, Any], str, Dict[str, Any]]:
    """
    在受限环境中执行代码并返回 (局部变量字典, 捕获的控制台 stdout 输出, 注册的 CQ 实体字典)
    全面兼容 CQ-Editor 及 ocp_vscode 的 show_object, show, debug, log 等函数，支持多文件工程虚拟导入
    """
    import types
    stdout_buf = io.StringIO()
    cq_objects: Dict[str, Any] = {}

    def _show_object(
        obj: Any,
        name: Optional[str] = None,
        options: Optional[Dict[str, Any]] = None,
        **kwargs: Any,
    ) -> None:
        """
        兼容 CQ-Editor 及 ocp_vscode 的 show_object 函数，登记待视口渲染的实体
        """
        opts = dict(options or {})
        opts.update(kwargs)
        target_name = name or f"part_{len(cq_objects) + 1}"
        cq_objects[target_name] = {
            "shape": obj,
            "name": target_name,
            "options": opts,
        }

    def _studio_show(*cad_objs: Any, **kwargs: Any) -> None:
        """
        全能兼容 CQ-Editor 及 ocp_vscode 的 show 函数
        支持:
          - show(obj)
          - show(obj, names=["part"])
          - show(obj, name="part")
          - show(obj1, obj2, names=["p1", "p2"], colors=[...], alphas=[...])
        """
        if not cad_objs:
            return

        names = kwargs.get("names")
        single_name = kwargs.get("name")
        colors = kwargs.get("colors")
        single_color = kwargs.get("color")
        alphas = kwargs.get("alphas")
        single_alpha = kwargs.get("alpha")

        for idx, obj in enumerate(cad_objs):
            if names and isinstance(names, (list, tuple)) and idx < len(names):
                obj_name = str(names[idx])
            elif single_name and idx == 0:
                obj_name = str(single_name)
            else:
                obj_name = f"part_{len(cq_objects) + 1}"

            opts: Dict[str, Any] = {}
            if colors and isinstance(colors, (list, tuple)) and idx < len(colors):
                opts["color"] = colors[idx]
            elif single_color:
                opts["color"] = single_color

            if alphas and isinstance(alphas, (list, tuple)) and idx < len(alphas):
                opts["alpha"] = alphas[idx]
            elif single_alpha is not None:
                opts["alpha"] = single_alpha

            _show_object(obj, name=obj_name, options=opts)

    def _debug(
        obj: Any,
        name: Optional[str] = None,
        options: Optional[Dict[str, Any]] = None,
        **kwargs: Any,
    ) -> None:
        opts = dict(options or {})
        opts.setdefault("color", "red")
        opts.setdefault("alpha", 0.3)
        _show_object(obj, name=name or f"debug_{len(cq_objects) + 1}", options=opts, **kwargs)

    def _log(msg: Any) -> None:
        print(f"[LOG] {msg}")

    def _rand_color(alpha: float = 0.0, cfloat: bool = False) -> Any:
        r = random.randint(30, 220)
        g = random.randint(30, 220)
        b = random.randint(30, 220)
        if cfloat:
            return (r / 255.0, g / 255.0, b / 255.0, alpha)
        return {"alpha": alpha, "color": (r, g, b)}

    def _reset_show() -> None:
        cq_objects.clear()

    custom_cq_funcs = {
        "show_object": _show_object,
        "show": _studio_show,
        "debug": _debug,
        "log": _log,
        "rand_color": _rand_color,
        "reset_show": _reset_show,
    }

    # 创建 ocp_vscode 与 cadquery.vis 兼容模块对象
    ocp_adapter = _create_ocp_vscode_adapter(_studio_show, _show_object, _reset_show)
    cq_vis_adapter = _create_cq_vis_adapter(_studio_show, _show_object, _reset_show)
    sys.modules["cadquery.vis"] = cq_vis_adapter
    if cq is not None:
        try:
            cq.vis = cq_vis_adapter
        except Exception:
            pass

    # 构建多文件虚拟工程模块映射
    virtual_modules_map: Dict[str, str] = {}
    virtual_packages: set[str] = set()
    if files:
        for f_path, f_code in files.items():
            norm_path = f_path.replace("\\", "/").lstrip("/")
            if norm_path.endswith(".py"):
                mod_key = norm_path[:-3].replace("/", ".")
                virtual_modules_map[mod_key] = f_code
                parts = mod_key.split(".")
                for i in range(1, len(parts)):
                    virtual_packages.add(".".join(parts[:i]))

    loaded_virtual_modules: Dict[str, Any] = {}

    def _load_virtual_module(mod_name: str) -> Any:
        if mod_name in loaded_virtual_modules:
            return loaded_virtual_modules[mod_name]

        if mod_name in virtual_packages:
            pkg = types.ModuleType(mod_name)
            pkg.__path__ = [mod_name]
            pkg.__name__ = mod_name
            loaded_virtual_modules[mod_name] = pkg
            return pkg

        if mod_name in virtual_modules_map:
            sub_code = virtual_modules_map[mod_name]
            all_proj_mods = set(virtual_modules_map.keys()) | virtual_packages
            validate_code_ast(sub_code, project_modules=all_proj_mods)

            sub_mod = types.ModuleType(mod_name)
            sub_mod.__file__ = mod_name.replace(".", "/") + ".py"
            sub_mod.__name__ = mod_name
            loaded_virtual_modules[mod_name] = sub_mod

            if "." in mod_name:
                parent_name, child_name = mod_name.rsplit(".", 1)
                parent_mod = _load_virtual_module(parent_name)
                setattr(parent_mod, child_name, sub_mod)

            sub_mod.__dict__.update(global_env)
            sub_mod.__dict__["__name__"] = mod_name
            sub_mod.__dict__["__file__"] = sub_mod.__file__
            sub_mod.__dict__["__builtins__"] = builtins_env

            exec(sub_code, sub_mod.__dict__)
            return sub_mod

        return None

    def _safe_import_runtime(name: str, globals: Any = None, locals: Any = None, fromlist: Any = (), level: int = 0) -> Any:
        base_name = name.split(".")[0]
        # 1. 优先捕获 ocp_vscode
        if base_name == "ocp_vscode":
            return ocp_adapter

        # 2. 优先捕获 cadquery.vis
        if name == "cadquery.vis" or (base_name == "cadquery" and len(name.split(".")) > 1 and name.split(".")[1] == "vis"):
            return cq_vis_adapter

        # 3. 如果是工程虚拟文件模块
        if name in virtual_modules_map or name in virtual_packages or base_name in virtual_modules_map or base_name in virtual_packages:
            target_mod = _load_virtual_module(name)
            if fromlist:
                return target_mod
            return _load_virtual_module(base_name)

        # 4. 校验白名单标准/第三方库
        if base_name in ALLOWED_MODULES:
            return __import__(name, globals, locals, fromlist, level)

        raise ImportError(f"安全沙箱禁止导入模块: '{name}'。仅允许: {', '.join(sorted(ALLOWED_MODULES))}")

    builtins_env = dict(SAFE_BUILTINS)
    builtins_env["__import__"] = _safe_import_runtime
    builtins_env.update(custom_cq_funcs)

    # 导出 build123d 常用类与函数，使其如同 from build123d import * 一样开箱即用
    b3d_symbols = {
        name: getattr(b3d, name)
        for name in dir(b3d)
        if not name.startswith("_") and name not in FORBIDDEN_NAMES
    }

    global_env = {
        "__name__": "__main__",
        "__doc__": None,
        "__builtins__": builtins_env,
        "cq": cq,
        "cadquery": cq,
        "b3d": b3d,
        "build123d": b3d,
        "math": math,
        "random": random,
        "Turtle3D": Turtle3D,
        "insert": getattr(b3d, "insert", getattr(b3d, "add", None)),
        "ocp_vscode": ocp_adapter,
        "vis": cq_vis_adapter,
        **b3d_symbols,
        **custom_cq_funcs,
    }
    local_env: Dict[str, Any] = {}

    temp_dir = None
    old_cwd = None
    if files:
        try:
            temp_dir = tempfile.mkdtemp(prefix="lingji_proj_")
            old_cwd = os.getcwd()
            for f_path, f_content in files.items():
                if not f_content:
                    continue
                clean_path = f_path.replace("\\", "/").lstrip("/")
                full_target = os.path.join(temp_dir, clean_path)
                os.makedirs(os.path.dirname(full_target), exist_ok=True)
                if f_content.startswith("data:") and ";base64," in f_content:
                    b64_str = f_content.split(";base64,")[1]
                    try:
                        f_bytes = base64.b64decode(b64_str)
                        with open(full_target, "wb") as f_out:
                            f_out.write(f_bytes)
                    except Exception:
                        pass
                else:
                    with open(full_target, "w", encoding="utf-8") as f_out:
                        f_out.write(f_content)
            os.chdir(temp_dir)
            if temp_dir not in sys.path:
                sys.path.insert(0, temp_dir)
        except Exception as err:
            logger.warning(f"为工程文件建立临时工作目录失败: {err}")

    try:
        with contextlib.redirect_stdout(stdout_buf):
            exec(code, global_env, local_env)
    except Exception as e:
        setattr(e, "captured_stdout", stdout_buf.getvalue())
        raise e
    finally:
        if old_cwd:
            try:
                os.chdir(old_cwd)
            except Exception:
                pass
        if temp_dir:
            if temp_dir in sys.path:
                try:
                    sys.path.remove(temp_dir)
                except Exception:
                    pass
            try:
                shutil.rmtree(temp_dir, ignore_errors=True)
            except Exception:
                pass

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
    timeout: float = 4.0,
    files: Optional[Dict[str, str]] = None,
    entrypoint: Optional[str] = None,
) -> Tuple[Any, List[Dict[str, Any]], int, str]:
    """
    安全沙箱执行 CadQuery / build123d 代码，支持多文件工程结构、单步时间旅行、教学错误诊断与控制台 stdout 捕获
    兼容原生 CadQuery 脚本、build123d 脚本、ocp_vscode/CQ-Editor 脚本 (show/show_object) 及 Blockly 自动生成代码
    
    :param code: 用户输入的 Python/CadQuery 代码
    :param step: 指定回放到第几个建模语句（1-indexed，None 为完整运行）
    :param timeout: 超时时间（秒）
    :param files: 多文件工程字典（相对文件路径 -> 代码内容）
    :param entrypoint: 多文件工程的主入口文件（默认 main.py）
    :return: (part实体, 步骤列表, 当前执行步骤号, 捕获的控制台输出)
    """
    # 提取多文件工程模块集合
    project_modules: set[str] = set()
    exec_code = code
    if files:
        if entrypoint and entrypoint in files:
            exec_code = files[entrypoint]
        elif "main.py" in files and not code.strip():
            exec_code = files["main.py"]

        for f_path in files.keys():
            norm = f_path.replace("\\", "/").lstrip("/")
            if norm.endswith(".py"):
                mod_name = norm[:-3].replace("/", ".")
                project_modules.add(mod_name)
                parts = mod_name.split(".")
                for i in range(1, len(parts)):
                    project_modules.add(".".join(parts[:i]))

    # 1. 静态 AST 审查
    validate_code_ast(exec_code, project_modules=project_modules)

    # 2. 解析分步节点
    steps = get_code_steps(exec_code)
    actual_step = len(steps)

    if step is not None and 1 <= step <= len(steps):
        target_end_line = steps[step - 1]["end_line"]
        lines = exec_code.splitlines()
        exec_code = "\n".join(lines[:target_end_line])
        actual_step = step
        # 确保包含 import
        if "import cadquery as cq" not in exec_code and "from build123d import *" not in exec_code:
            exec_code = "from build123d import *\n" + exec_code

    captured_stdout = ""
    # 3. 超时执行保护
    with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
        future = executor.submit(_run_script_worker, exec_code, files)
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

        if isinstance(val, Turtle3D):
            try:
                return val.part
            except Exception:
                return None

        return val

    def _is_geo_obj(val: Any) -> bool:
        if isinstance(val, Turtle3D):
            return True
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

    def _is_b3d_shape(obj: Any) -> bool:
        if obj is None:
            return False
        if b3d is not None and isinstance(obj, (b3d.Shape, b3d.Compound, b3d.Part, b3d.Solid, b3d.Face, b3d.Wire, b3d.Edge, b3d.Sketch)):
            return True
        if hasattr(obj, "wrapped") and type(obj).__module__.startswith("build123d"):
            return True
        return False

    def _parse_b3d_color(color_val: Any) -> Any:
        if not color_val:
            return None
        try:
            if isinstance(color_val, b3d.Color):
                return color_val
            if isinstance(color_val, str):
                return b3d.Color(color_val)
            if isinstance(color_val, (tuple, list)):
                c_vals = [c / 255.0 if any(v > 1.0 for v in color_val) else c for c in color_val]
                return b3d.Color(*c_vals)
        except Exception:
            return None
        return None

    def _parse_cq_color(color_val: Any) -> Any:
        if not color_val or cq is None:
            return None
        try:
            if isinstance(color_val, cq.Color):
                return color_val
            if isinstance(color_val, str):
                return cq.Color(color_val)
            if isinstance(color_val, (tuple, list)):
                c_vals = [c / 255.0 if any(v > 1.0 for v in color_val) else c for c in color_val]
                return cq.Color(*c_vals)
        except Exception:
            return None
        return None

    # 优先级 1: 用户显式通过 show_object() / show() / debug() 注册的对象
    if cq_objects:
        if len(cq_objects) == 1:
            item = list(cq_objects.values())[0]
            part = _unwrap_geo(item["shape"])
            opts = item.get("options") or {}
            color_val = opts.get("color")
            if _is_b3d_shape(part):
                if color_val:
                    b3d_c = _parse_b3d_color(color_val)
                    if b3d_c is not None:
                        try:
                            part.color = b3d_c
                        except Exception:
                            pass
                if item.get("name") and hasattr(part, "label"):
                    try:
                        part.label = item["name"]
                    except Exception:
                        pass
                return part, steps, actual_step, captured_stdout
            else:
                color_obj = _parse_cq_color(color_val)
                if color_obj and cq is not None:
                    assy = cq.Assembly()
                    assy.add(part, name=item["name"], color=color_obj)
                    return assy, steps, actual_step, captured_stdout
                return part, steps, actual_step, captured_stdout
        else:
            # 注册了多个对象时，自动组合为 Assembly 或 Compound
            items_unwrapped = []
            for item in cq_objects.values():
                shape_obj = _unwrap_geo(item["shape"])
                if shape_obj is not None:
                    items_unwrapped.append((item["name"], shape_obj, item.get("options") or {}))

            if not items_unwrapped:
                return None, steps, actual_step, captured_stdout

            # 判断是否所有对象都是 build123d 对象（或者没有 CadQuery Workplane/Shape）
            has_cq = any(cq is not None and isinstance(s, (cq.Workplane, cq.Shape, cq.Assembly)) for _, s, _ in items_unwrapped)
            all_b3d = not has_cq and all(_is_b3d_shape(s) for _, s, _ in items_unwrapped)

            if all_b3d or (b3d is not None and not has_cq):
                # 纯 build123d 体系：构建包含独立着色与命名 child 的 b3d.Compound
                b3d_children = []
                for name, shape_obj, opts in items_unwrapped:
                    color_val = opts.get("color")
                    if color_val:
                        b3d_c = _parse_b3d_color(color_val)
                        if b3d_c is not None:
                            try:
                                shape_obj.color = b3d_c
                            except Exception:
                                pass
                    if name and hasattr(shape_obj, "label"):
                        try:
                            shape_obj.label = name
                        except Exception:
                            pass
                    b3d_children.append(shape_obj)
                compound = b3d.Compound(children=b3d_children)
                return compound, steps, actual_step, captured_stdout
            else:
                # 包含 CadQuery 对象或混合体系：使用 CadQuery Assembly
                if cq is not None:
                    assy = cq.Assembly()
                    for name, shape_obj, opts in items_unwrapped:
                        color_obj = _parse_cq_color(opts.get("color"))
                        if _is_b3d_shape(shape_obj):
                            # 将 build123d Shape 转换为 cq.Shape，确保 Assembly 兼容
                            shape_to_add = cq.Shape.cast(shape_obj.wrapped)
                        else:
                            shape_to_add = shape_obj
                        assy.add(shape_to_add, name=name, color=color_obj)
                    return assy, steps, actual_step, captured_stdout
                else:
                    valid_children = [s for _, s, _ in items_unwrapped]
                    return b3d.Compound(children=valid_children), steps, actual_step, captured_stdout

    # 优先级 2: 变量名明确为 part, result, 或 model (含 t, turtle)
    target_names = ["part", "result", "model", "p", "s", "t", "turtle", "turtle_model"]
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
            all_shapes = [p for _, p, _ in found_parts if p is not None] + [s for _, s, _ in found_sketches if s is not None]
            has_cq = any(cq is not None and isinstance(s, (cq.Workplane, cq.Shape, cq.Assembly)) for s in all_shapes)
            if not has_cq and b3d is not None:
                # 纯 build123d 体系
                for _, p, _ in found_parts:
                    if p is not None and not getattr(p, "color", None):
                        try:
                            p.color = b3d.Color("#3b82f6")
                        except Exception:
                            pass
                for _, s, _ in found_sketches:
                    if s is not None and not getattr(s, "color", None):
                        try:
                            s.color = b3d.Color("#f59e0b")
                        except Exception:
                            pass
                return b3d.Compound(children=all_shapes), steps, actual_step, captured_stdout
            elif cq is not None:
                assy = cq.Assembly()
                for name, p_item, _ in found_parts:
                    if p_item is not None:
                        s_add = cq.Shape.cast(p_item.wrapped) if _is_b3d_shape(p_item) else p_item
                        assy.add(s_add, name=name, color=cq.Color("#3b82f6"))
                for name, s_item, _ in found_sketches:
                    if s_item is not None:
                        s_add = cq.Shape.cast(s_item.wrapped) if _is_b3d_shape(s_item) else s_item
                        assy.add(s_add, name=f"sketch_{name}", color=cq.Color("#f59e0b"))
                return assy, steps, actual_step, captured_stdout
            else:
                return b3d.Compound(children=all_shapes), steps, actual_step, captured_stdout

        if len(found_parts) > 1:
            all_parts = [p for _, p, _ in found_parts if p is not None]
            has_cq = any(cq is not None and isinstance(p, (cq.Workplane, cq.Shape, cq.Assembly)) for p in all_parts)
            if not has_cq and b3d is not None:
                return b3d.Compound(children=all_parts), steps, actual_step, captured_stdout
            elif cq is not None:
                assy = cq.Assembly()
                for name, p_item, _ in found_parts:
                    if p_item is not None:
                        s_add = cq.Shape.cast(p_item.wrapped) if _is_b3d_shape(p_item) else p_item
                        assy.add(s_add, name=name)
                return assy, steps, actual_step, captured_stdout
            else:
                return b3d.Compound(children=all_parts), steps, actual_step, captured_stdout

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

    # 优先级 4: 用户定义了自定义几何类（继承自 Compound / Part / Solid / Shape 等）但尚未实例化
    geo_classes = [
        name for name, val in local_vars.items()
        if isinstance(val, type) and (
            issubclass(val, (b3d.Shape, b3d.Compound, b3d.Part, b3d.Solid, b3d.Sketch)) or
            (cq is not None and issubclass(val, (cq.Shape, cq.Workplane)))
        )
    ]
    if geo_classes:
        class_name = geo_classes[-1]
        raise ValueError(
            f"💡 已成功定义 3D 组件类 '{class_name}'，但尚未对其进行实例化。\n"
            f"请在代码末尾添加实例化语句以在 3D 视口中呈现，例如：\n"
            f"part = {class_name}(...)"
        )

    raise ValueError(translate_cad_error("未检测到可渲染的 3D 实体或草图对象。请确保通过 'with BuildPart() as part:' 创建实体，或赋值给变量 (如 part = ...)。"))

