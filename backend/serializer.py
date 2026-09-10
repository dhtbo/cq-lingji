"""
CAD 几何数据序列化模块
将 CadQuery Workplane / Shape 转换为 three-cad-viewer 规范的 JSON 数据
包含离散顶点、三角形索引、法线及 B-Rep 拓扑边（Edges/Wires）
"""
import json
import logging
import sys
import types
from typing import Any, Dict, Optional

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

from ocp_tessellate.convert import to_ocpgroup, tessellate_group, numpy_to_json

logger = logging.getLogger(__name__)

def _decode_instances(instances: list, shapes: dict) -> None:
    """
    递归解包引用实例，将 shape['ref'] 展开为完整的几何体定义
    使前端 three-cad-viewer 无需额外解析即可直接装载
    """
    def walk(obj: Any):
        if not isinstance(obj, dict):
            return
        typ = obj.get("type")
        if "parts" in obj and isinstance(obj["parts"], list):
            for part in obj["parts"]:
                walk(part)
        elif typ == "shapes" and "shape" in obj:
            ref = obj["shape"].get("ref")
            if ref is not None and 0 <= ref < len(instances):
                obj["shape"] = instances[ref]

    walk(shapes)

def serialize_cad_object(
    obj: Any,
    name: str = "part",
    tolerance: float = 0.01,
    angular_tolerance: float = 0.1,
    color: Optional[str] = "#3b82f6",
    alpha: float = 1.0,
) -> Dict[str, Any]:
    """
    将 build123d / CadQuery 对象网格化并序列化为 three-cad-viewer 适用的 JSON 字典
    
    :param obj: build123d Part/Solid/Sketch 或 CadQuery Workplane/Shape/Assembly 对象
    :param name: 零件名称
    :param tolerance: 离散化线性偏差
    :param angular_tolerance: 离散化角度公差
    :param color: 零件基础渲染颜色
    :param alpha: 透明度 (0.0 ~ 1.0)
    :return: 包含场景层次与网格缓冲区的 JSON 字典
    """
    # 校验并提取目标几何对象（优先直接传入对象本身以保留其 color/材质元数据）
    target_obj = None
    if cq is not None and isinstance(obj, cq.Workplane):
        if not obj.val():
            raise ValueError("Workplane 当前未包含有效实体")
        target_obj = obj
    elif hasattr(obj, "wrapped"):
        # build123d 的 Part, Solid, Compound, Sketch, Wire, Face 等：
        # to_ocpgroup 原生直接支持 build123d 对象本身，直接传递可保留其 .color 属性！
        target_obj = obj
    elif cq is not None and isinstance(obj, (cq.Shape, cq.Assembly)):
        target_obj = obj
    elif hasattr(obj, "val"):
        target_obj = obj.val()
    else:
        target_obj = obj

    # 智能探测对象是否自身或其子构件已显式定义了颜色
    def _has_explicit_color(shape_candidate: Any) -> bool:
        if shape_candidate is None:
            return False
        # 自身是否有 color 属性
        c = getattr(shape_candidate, "color", None)
        if c is not None:
            return True
        # 检查是否为 build123d Compound 或拥有 children
        children = getattr(shape_candidate, "children", None)
        if children and isinstance(children, (list, tuple)):
            for child in children:
                if _has_explicit_color(child):
                    return True
        # 检查是否为 CadQuery Assembly
        if cq is not None and isinstance(shape_candidate, cq.Assembly):
            return True
        return False

    has_custom_color = _has_explicit_color(target_obj)
    colors_param = None if has_custom_color else ([color] if color else None)

    # 1. 转换为 OCP 组结构
    part_group, instances = to_ocpgroup(
        target_obj,
        names=[name],
        colors=colors_param,
        alphas=[alpha],
    )

    # 2. 调用 ocp-tessellate 进行网格离散化
    tess_kwargs = {
        "deviation": tolerance,
        "angular_tolerance": angular_tolerance,
    }
    instances, shapes, _ = tessellate_group(part_group, instances, kwargs=tess_kwargs)

    # 3. 解包引用实例
    _decode_instances(instances, shapes)

    # 4. 转换为可序列化 JSON 字符串并反序列化为 dict
    json_str = numpy_to_json(shapes)
    return json.loads(json_str)
