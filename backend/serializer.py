"""
CAD 几何数据序列化模块
将 CadQuery Workplane / Shape 转换为 three-cad-viewer 规范的 JSON 数据
包含离散顶点、三角形索引、法线及 B-Rep 拓扑边（Edges/Wires）
"""
import json
import logging
from typing import Any, Dict, Optional
import cadquery as cq
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
    将 CadQuery 对象网格化并序列化为 three-cad-viewer 适用的 JSON 字典
    
    :param obj: CadQuery Workplane, Shape, 或 Assembly 对象
    :param name: 零件名称
    :param tolerance: 离散化线性偏差
    :param angular_tolerance: 离散化角度公差
    :param color: 零件基础渲染颜色
    :param alpha: 透明度 (0.0 ~ 1.0)
    :return: 包含场景层次与网格缓冲区的 JSON 字典
    """
    # 校验 CadQuery 对象有效性
    if isinstance(obj, cq.Workplane):
        if not obj.val():
            raise ValueError("Workplane 当前未包含有效实体")
        target_obj = obj
    elif isinstance(obj, (cq.Shape, cq.Assembly)):
        target_obj = obj
    else:
        raise TypeError(f"不支持的几何体类型: {type(obj)}")

    # 1. 转换为 OCP 组结构
    part_group, instances = to_ocpgroup(
        target_obj,
        names=[name],
        colors=[color] if color else None,
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
