"""
LingJi Backend Package
"""
import sys
import types
from importlib.machinery import ModuleSpec

class _AutoMock(types.ModuleType):
    def __getattr__(self, name):
        obj = type(name, (), {})
        setattr(self, name, obj)
        return obj

class _MockFinder:
    def find_spec(self, fullname, path, target=None):
        if fullname == "vtkmodules" or fullname.startswith("vtkmodules."):
            spec = ModuleSpec(fullname, _MockLoader())
            spec.submodule_search_locations = []
            return spec
        return None

class _MockLoader:
    def create_module(self, spec):
        mod = _AutoMock(spec.name)
        mod.__path__ = []
        return mod
    def exec_module(self, mod):
        pass

if not any(isinstance(f, _MockFinder) for f in sys.meta_path):
    sys.meta_path.insert(0, _MockFinder())

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
