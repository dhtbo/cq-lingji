"""
CadQuery Blockly Studio - 后端核心服务
提供 CadQuery 脚本安全沙箱执行、三维网格序列化、STL/STEP 导出及健康检查
"""
import base64
import io
import os
import sys
import tempfile
import time
import types
import logging
from typing import Any, Dict, Optional
from fastapi import FastAPI, HTTPException, Response, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

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
    import OCP.NCollection
    if not hasattr(OCP.NCollection, "NCollection_Utf8String"):
        try:
            from OCP.TCollection import TCollection_AsciiString
            OCP.NCollection.NCollection_Utf8String = TCollection_AsciiString
        except Exception:
            OCP.NCollection.NCollection_Utf8String = str
except Exception:
    pass

try:
    import cadquery as cq
except Exception:
    cq = None
import build123d as b3d

from backend.sandbox import execute_cq_sandboxed
from backend.serializer import serialize_cad_object
try:
    from backend.print_checker import analyze_cad_printability
except ImportError:
    from print_checker import analyze_cad_printability

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("build123d-studio-backend")

app = FastAPI(
    title="build123d Blockly Studio API",
    version="2.0.0",
    description="面向现代 3D 数字编程的 build123d 可视化教学与几何沙箱渲染引擎"
)

# 允许跨域请求
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class RenderRequest(BaseModel):
    code: str = Field(..., description="build123d / CadQuery Python 代码文本")
    step: Optional[int] = Field(None, ge=1, description="特征时间旅行指定回放步骤号")
    tolerance: float = Field(0.01, ge=0.001, le=0.5, description="B-Rep 网格细分线性公差")
    angular_tolerance: float = Field(0.1, ge=0.01, le=1.0, description="B-Rep 网格细分角度公差")
    color: Optional[str] = Field("#3b82f6", description="零件默认基础渲染着色")
    alpha: float = Field(1.0, ge=0.0, le=1.0, description="零件材质不透明度")
    # 文件夹式多文件工程支持
    files: Optional[Dict[str, str]] = Field(None, description="文件夹工程全量文件字典（相对路径 -> 代码文本）")
    entrypoint: Optional[str] = Field(None, description="主入口文件路径（如 main.py）")


class ExportRequest(BaseModel):
    code: str = Field(..., description="build123d / CadQuery Python 代码文本")
    filename: Optional[str] = Field(None, description="导出自定义文件名")
    files: Optional[Dict[str, str]] = Field(None, description="文件夹工程全量文件字典")
    entrypoint: Optional[str] = Field(None, description="主入口文件路径")


class ModelPreviewRequest(BaseModel):
    filename: str = Field(..., description="模型文件名（如 part.step, model.stl, sketch.svg）")
    content: str = Field(..., description="文件内容（UTF-8 文本或 Base64 编码的 Data URL）")
    tolerance: float = Field(0.01, ge=0.001, le=0.5, description="B-Rep 网格细分线性公差")
    angular_tolerance: float = Field(0.1, ge=0.01, le=1.0, description="B-Rep 网格细分角度公差")
    color: Optional[str] = Field("#10B981", description="预览基础着色（默认翠石绿）")


@app.get("/api/v1/health")
async def health_check() -> Dict[str, Any]:
    """
    健康检查接口
    """
    return {
        "status": "healthy",
        "service": "build123d-blockly-backend",
        "build123d_version": b3d.__version__,
        "cadquery_version": cq.__version__ if cq is not None else "unavailable",
    }


@app.post("/api/v1/render")
@app.post("/api/v1/render/b3d")
@app.post("/api/v1/render/cq")
async def render_cad(req: RenderRequest):
    """
    执行 CadQuery 代码并转换为 three-cad-viewer 规范的 JSON 网格数据，支持分步特征时间旅行与多文件工程
    """
    code_text = req.code.strip()
    if not code_text and not req.files:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="输入代码不能为空"
        )

    start_time = time.perf_counter()
    captured_stdout = ""
    try:
        # 1. 沙箱受限执行并获取 CadQuery 目标实体与步骤清单
        part, steps, current_step, captured_stdout = execute_cq_sandboxed(
            code_text, step=req.step, timeout=4.0, files=req.files, entrypoint=req.entrypoint
        )
    except (ValueError, TimeoutError, RuntimeError) as e:
        duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
        error_stdout = getattr(e, "captured_stdout", "") or captured_stdout
        logger.warning(f"代码执行异常 ({type(e).__name__}): {e}")
        return {
            "status": "error",
            "execution_time_ms": duration_ms,
            "detail": str(e),
            "stdout": error_stdout,
            "mesh": None,
            "steps": [],
            "current_step": 0,
            "total_steps": 0,
        }
    except Exception as e:
        logger.error(f"意外错误: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"服务端未知错误: {e}")

    # 提取 LogoUp3D 引擎的游标与草图元数据 (三维游标、方向指示箭头、草图平面、未填充线框)
    cursor_metadata = None
    try:
        from backend.logoup3d import get_default_logoup
        def_logoup = get_default_logoup()
        if def_logoup.has_activity():
            cursor_metadata = def_logoup.get_viewer_metadata()
    except Exception as e:
        logger.debug(f"提取游标元数据失败: {e}")

    # 2. 如果分步时间旅行当前语句为前置参数变量声明，尚未生成几何实体
    if part is None:
        duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
        if cursor_metadata is not None:
            # 用户执行了 LogoUp 游标移动等操作，虽未生成三维实体但需在视口呈现游标与轨迹
            return {
                "status": "success",
                "execution_time_ms": duration_ms,
                "mesh": {"cursor_metadata": cursor_metadata},
                "cursor_metadata": cursor_metadata,
                "steps": steps,
                "current_step": current_step,
                "total_steps": len(steps),
                "stdout": captured_stdout,
            }
        return {
            "status": "pending_geometry",
            "execution_time_ms": duration_ms,
            "mesh": None,
            "cursor_metadata": None,
            "steps": steps,
            "current_step": current_step,
            "total_steps": len(steps),
            "stdout": captured_stdout,
            "detail": "当前步骤正在初始化尺寸参数，请步进至 Workplane/拉伸等几何建模语句查看 3D 模型生长。",
        }

    try:
        # 3. 序列化为 three-cad-viewer JSON 格式
        mesh_data = serialize_cad_object(
            part,
            name="part",
            tolerance=req.tolerance,
            angular_tolerance=req.angular_tolerance,
            color=req.color,
            alpha=req.alpha
        )
        if cursor_metadata is not None:
            mesh_data["cursor_metadata"] = cursor_metadata
    except Exception as e:
        logger.error(f"几何网格化序列化失败: {e}", exc_info=True)
        return {
            "status": "error",
            "execution_time_ms": round((time.perf_counter() - start_time) * 1000, 2),
            "detail": f"几何体网格化生成失败: {e}",
            "stdout": captured_stdout,
            "mesh": None,
            "cursor_metadata": cursor_metadata,
            "steps": steps,
            "current_step": current_step,
            "total_steps": len(steps),
        }

    duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
    logger.info(f"渲染成功，耗时 {duration_ms}ms (步骤 {current_step}/{len(steps)})")

    return {
        "status": "success",
        "execution_time_ms": duration_ms,
        "mesh": mesh_data,
        "cursor_metadata": cursor_metadata,
        "steps": steps,
        "current_step": current_step,
        "total_steps": len(steps),
        "stdout": captured_stdout,
    }


@app.post("/api/v1/preview-model")
async def preview_model(req: ModelPreviewRequest):
    """
    解析项目中的 3D 几何资产（STEP, STL, SVG, BREP 等）并转换为 three-cad-viewer 规范的 JSON 网格数据
    """
    filename = req.filename.strip()
    ext = os.path.splitext(filename)[1].lower()
    if not ext:
        raise HTTPException(status_code=400, detail="未指定有效的文件扩展名")

    raw_content = req.content.strip()
    if not raw_content:
        raise HTTPException(status_code=400, detail="文件内容为空")

    # 1. 还原二进制或文本数据
    file_bytes: bytes
    if raw_content.startswith("data:") and ";base64," in raw_content:
        base64_str = raw_content.split(";base64,")[1]
        try:
            file_bytes = base64.b64decode(base64_str)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Base64 解码失败: {e}")
    else:
        file_bytes = raw_content.encode("utf-8")

    # 2. 写入临时文件以供 OpenCASCADE / build123d 加载
    with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tf:
        temp_path = tf.name
        tf.write(file_bytes)

    start_time = time.perf_counter()
    try:
        cad_obj = None
        if ext in [".step", ".stp"]:
            cad_obj = b3d.import_step(temp_path)
        elif ext == ".stl":
            cad_obj = b3d.import_stl(temp_path)
        elif ext == ".svg":
            cad_obj = b3d.import_svg(temp_path)
        elif ext == ".brep":
            cad_obj = b3d.import_brep(temp_path)
        else:
            raise ValueError(f"暂不支持预览格式: '{ext}'。支持: .step, .stp, .stl, .svg, .brep")

        if cad_obj is None:
            raise ValueError(f"无法从文件 '{filename}' 中载入几何实体")

        # 3. 序列化为网格数据
        mesh_data = serialize_cad_object(
            cad_obj,
            name=filename,
            tolerance=req.tolerance,
            angular_tolerance=req.angular_tolerance,
            color=req.color or "#10B981",
        )
        duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
        return {
            "status": "success",
            "execution_time_ms": duration_ms,
            "filename": filename,
            "format": ext[1:].upper(),
            "mesh": mesh_data,
        }
    except Exception as e:
        logger.error(f"模型资产预览失败 ({filename}): {e}", exc_info=True)
        return {
            "status": "error",
            "filename": filename,
            "detail": f"解析模型失败: {e}",
            "mesh": None,
        }
    finally:
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                pass


@app.post("/api/v1/export/stl")
async def export_stl(req: ExportRequest):
    """
    一键导出 STL 3D 打印三角网格文件
    """
    code_text = req.code.strip()
    if not code_text:
        raise HTTPException(status_code=400, detail="代码不能为空")

    try:
        part, *_ = execute_cq_sandboxed(code_text, timeout=5.0)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"生成导出模型失败: {e}")

    out_name = req.filename or "model.stl"
    if not out_name.endswith(".stl"):
        out_name += ".stl"

    with tempfile.NamedTemporaryFile(suffix=".stl", delete=False) as tf:
        temp_path = tf.name

    try:
        if cq is not None and isinstance(part, (cq.Workplane, cq.Assembly)):
            cq.exporters.export(part, temp_path, cq.exporters.ExportTypes.STL)
        else:
            try:
                b3d.export_stl(part, temp_path)
            except Exception:
                if cq is not None:
                    cq.exporters.export(part, temp_path, cq.exporters.ExportTypes.STL)
                else:
                    raise
        with open(temp_path, "rb") as f:
            content = f.read()
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

    return Response(
        content=content,
        media_type="model/stl",
        headers={
            "Content-Disposition": f'attachment; filename="{out_name}"',
            "Access-Control-Expose-Headers": "Content-Disposition"
        }
    )


@app.post("/api/v1/export/step")
async def export_step(req: ExportRequest):
    """
    一键导出 STEP 工业级标准 B-Rep 实体文件
    """
    code_text = req.code.strip()
    if not code_text:
        raise HTTPException(status_code=400, detail="代码不能为空")

    try:
        part, *_ = execute_cq_sandboxed(code_text, timeout=5.0)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"生成导出模型失败: {e}")

    out_name = req.filename or "model.step"
    if not (out_name.endswith(".step") or out_name.endswith(".stp")):
        out_name += ".step"

    with tempfile.NamedTemporaryFile(suffix=".step", delete=False) as tf:
        temp_path = tf.name

    try:
        if cq is not None and isinstance(part, (cq.Workplane, cq.Assembly)):
            cq.exporters.export(part, temp_path, cq.exporters.ExportTypes.STEP)
        else:
            try:
                b3d.export_step(part, temp_path)
            except Exception:
                if cq is not None:
                    cq.exporters.export(part, temp_path, cq.exporters.ExportTypes.STEP)
                else:
                    raise
                cq.exporters.export(part, temp_path, cq.exporters.ExportTypes.STEP)
        with open(temp_path, "rb") as f:
            content = f.read()
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

    return Response(
        content=content,
        media_type="application/step",
        headers={
            "Content-Disposition": f'attachment; filename="{out_name}"',
            "Access-Control-Expose-Headers": "Content-Disposition"
        }
    )


class PrintabilityRequest(BaseModel):
    code: str = Field(..., description="待体检的 CAD 建模 Python 脚本")
    bed_x: Optional[float] = Field(220.0, description="热床最大成型尺寸 X (mm)")
    bed_y: Optional[float] = Field(220.0, description="热床最大成型尺寸 Y (mm)")
    bed_z: Optional[float] = Field(250.0, description="热床最大成型尺寸 Z (mm)")
    files: Optional[Dict[str, str]] = Field(None, description="多文件工程目录文件字典")
    entrypoint: Optional[str] = Field(None, description="执行主入口脚本文件名")


@app.post("/api/v1/analyze/printability")
async def analyze_printability(req: PrintabilityRequest):
    """
    3D 打印前置体检与流形/成型尺寸检测接口
    """
    code_text = req.code.strip()
    if not code_text and not req.files:
        raise HTTPException(status_code=400, detail="代码不能为空")

    try:
        part, *_ = execute_cq_sandboxed(
            code_text,
            timeout=5.0,
            files=req.files,
            entrypoint=req.entrypoint,
        )
    except Exception as e:
        return {
            "status": "error",
            "message": f"代码执行或生成实体失败: {e}",
        }

    res = analyze_cad_printability(
        part,
        bed_size=(req.bed_x or 220.0, req.bed_y or 220.0, req.bed_z or 250.0)
    )
    return res

