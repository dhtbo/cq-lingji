"""
3D 打印体检与流形检测模块
提供面向 3D 打印制造的模型封闭性 (Watertight / Manifold) 检测、
尺寸边界合规性核验、体积/表面积及耗材重量估算
"""

from __future__ import annotations
import math
from typing import Any, Dict, List, Optional
import build123d as b3d


def analyze_cad_printability(
    obj: Any,
    bed_size: tuple[float, float, float] = (220.0, 220.0, 250.0),
    material_density: float = 1.24,  # 标准 PLA 密度: 1.24 g/cm³
) -> Dict[str, Any]:
    """
    对给定的 CAD 几何实体进行 3D 打印适应性全面体检
    :param obj: build123d / CadQuery 几何对象
    :param bed_size: 打印热床最大成型尺寸 (长 X, 宽 Y, 高 Z) 单位 mm
    :param material_density: 耗材密度 (g/cm³)
    :return: 结构化体检报告字典
    """
    if obj is None:
        return {
            "status": "error",
            "message": "未检测到有效的 3D 实体对象，无法进行打印分析",
        }

    # 1. 尝试提取包围盒
    try:
        if hasattr(obj, "bounding_box"):
            bb = obj.bounding_box()
            xmin, xmax = float(bb.min.X), float(bb.max.X)
            ymin, ymax = float(bb.min.Y), float(bb.max.Y)
            zmin, zmax = float(bb.min.Z), float(bb.max.Z)
        else:
            xmin, xmax, ymin, ymax, zmin, zmax = 0.0, 0.0, 0.0, 0.0, 0.0, 0.0
    except Exception:
        xmin, xmax, ymin, ymax, zmin, zmax = 0.0, 0.0, 0.0, 0.0, 0.0, 0.0

    size_x = round(max(0.0, xmax - xmin), 2)
    size_y = round(max(0.0, ymax - ymin), 2)
    size_z = round(max(0.0, zmax - zmin), 2)

    # 2. 检查成型空间是否超限
    bed_x, bed_y, bed_z = bed_size
    fits_bed = (size_x <= bed_x) and (size_y <= bed_y) and (size_z <= bed_z)

    # 3. 体积与表面积计算
    volume_mm3 = 0.0
    area_mm2 = 0.0
    try:
        if hasattr(obj, "volume"):
            volume_mm3 = float(obj.volume)
    except Exception:
        pass

    try:
        if hasattr(obj, "area"):
            area_mm2 = float(obj.area)
    except Exception:
        pass

    volume_cm3 = round(volume_mm3 / 1000.0, 3)
    area_cm2 = round(area_mm2 / 100.0, 2)

    # 4. 封闭流形检测 (Watertight / Manifold Check)
    is_solid = False
    is_watertight = False
    solids_count = 0
    shells_closed = True

    try:
        if hasattr(obj, "solids") and callable(obj.solids):
            solids = obj.solids()
            solids_count = len(solids)
            if solids_count > 0:
                is_solid = True
                for s in solids:
                    if hasattr(s, "shells") and callable(s.shells):
                        for sh in s.shells():
                            if hasattr(sh, "wrapped") and hasattr(sh.wrapped, "Closed"):
                                if not sh.wrapped.Closed():
                                    shells_closed = False
                                    break
                is_watertight = is_solid and shells_closed and (volume_mm3 > 1e-4)
    except Exception:
        is_watertight = False

    # 5. 耗材重量与打印耗时粗估
    # 实心重量 (g)
    solid_weight_g = round(volume_cm3 * material_density, 1)
    # 典型 20% 填充率下的预估耗材用量 (g)
    estimated_filament_g = round(solid_weight_g * 0.35, 1)
    # 预估打印耗时 (按 50mm/s, 0.2mm 层高典型速度估算小时数)
    estimated_hours = round(max(0.1, estimated_filament_g / 15.0), 1)

    # 6. 综合健康诊断与建议
    issues: List[str] = []
    suggestions: List[str] = []

    if not is_solid or volume_mm3 <= 0:
        issues.append("模型当前为非实体（可能仅包含 2D 草图表面或 1D 线框），3D 打印切片机需要实体（Solid）。")
        suggestions.append("请使用 extrude()、revolve() 等特征将草图拉伸为实体，或使用 Turtle3D 画笔生成三维管道。")
    elif not is_watertight:
        issues.append("模型未完全封闭（Non-manifold），切片时可能出现漏光或空洞。")
        suggestions.append("建议检查是否有未贴合的面或自相交壳体，确保所有边缘均属于封闭壳体。")

    if not fits_bed:
        issues.append(f"模型尺寸 ({size_x}×{size_y}×{size_z} mm) 超出默认打印机成型热床 ({bed_x}×{bed_y}×{bed_z} mm)。")
        suggestions.append("可使用 scale() 按比例缩小尺寸，或在切片软件中旋转对角线摆放。")

    if is_watertight and fits_bed:
        suggestions.append("✅ 模型几何拓扑完美封闭（Watertight Manifold），可直接导出 STL 发送至切片软件打印！")

    health_score = 100
    if not is_solid:
        health_score -= 60
    elif not is_watertight:
        health_score -= 30
    if not fits_bed:
        health_score -= 20
    health_score = max(0, health_score)

    return {
        "status": "success",
        "health_score": health_score,
        "is_watertight": is_watertight,
        "is_solid": is_solid,
        "solids_count": solids_count,
        "fits_bed": fits_bed,
        "dimensions": {
            "x": size_x,
            "y": size_y,
            "z": size_z,
            "bed_x": bed_x,
            "bed_y": bed_y,
            "bed_z": bed_z,
        },
        "metrics": {
            "volume_cm3": volume_cm3,
            "area_cm2": area_cm2,
            "filament_weight_g": estimated_filament_g,
            "estimated_hours": estimated_hours,
        },
        "issues": issues,
        "suggestions": suggestions,
    }
