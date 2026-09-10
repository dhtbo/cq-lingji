"""
LingJi Backend Package
"""
import sys
import types

if "OCP.IVtkOCC" not in sys.modules:
    _mod_occ = types.ModuleType("OCP.IVtkOCC")
    _mod_occ.IVtkOCC_Shape = type("IVtkOCC_Shape", (), {})
    _mod_occ.IVtkOCC_ShapeMesher = type("IVtkOCC_ShapeMesher", (), {})
    sys.modules["OCP.IVtkOCC"] = _mod_occ

if "OCP.IVtkVTK" not in sys.modules:
    _mod_vtk = types.ModuleType("OCP.IVtkVTK")
    _mod_vtk.IVtkVTK_ShapeData = type("IVtkVTK_ShapeData", (), {})
    sys.modules["OCP.IVtkVTK"] = _mod_vtk
