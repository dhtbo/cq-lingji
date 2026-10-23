# CadQuery Blockly Studio (几何工坊)

面向青少年与 Python 初学者的现代化双界面 CAD 视觉化学习与参数化建模平台。
集成了 **Google Blockly (Zelos Scratch 主题)**、**Monaco 智能代码编辑器** 与 **three-cad-viewer 工业级 B-Rep 视口**，实现积木拖拽即出 Python 规范代码、400ms 防抖实时三维渲染与 STL/STEP 一键导出。

---

## 🌟 核心特性

1. **三栏联动流 (3-Panel Split View)**：
   - **左栏**：Google Blockly，定制 Zelos Scratch 风格圆角积木，支持 CadQuery 链式与语句式拼接。
   - **中栏**：Monaco Editor，带 CadQuery 智能代码补全（IntelliSense）、只读同步与自由代码解锁双模式。
   - **右栏**：`three-cad-viewer` 原生工业 CAD 视口，显示 B-Rep 黑色拓扑边、面法线、正交/透视投影切换、Top/Front/Iso 视角及剖切。
2. **安全沙箱 (AST Sandbox Execution)**：
   - 静态语法树（AST）审查白名单（仅允许 `cadquery`, `math`, `random`），彻底阻断 `os`, `sys`, `eval`, `exec`, `open`, `__import__`。
   - 进程/线程池 4 秒硬超时保护，防止死循环导致系统假死。
3. **高精度几何网格化 (B-Rep Tessellation Pipeline)**：
   - 后端集成 `ocp-tessellate`，自动将 OpenCASCADE / CadQuery B-Rep 拓扑离散化为包含精确顶点、三角形、拓扑边线（Edges/Wires）的树形结构。
4. **一键制造导出**：
   - **STL 格式**：一键导出 3D 打印三角网格，无缝对接 Bambu Studio、Cura 等切片软件。
   - **STEP 格式**：一键导出无损工业级标准实体，可在 SolidWorks、Fusion 360、FreeCAD 中直接继续二次工程设计。
5. **经典初学者案例库**：
   - 法兰盘与环形多孔阵列（宏积木实践）
   - 六角螺母（多边形草图与倒角）
   - L 型加固角码支架（盲切掏空与双向打孔）
   - 阶梯回转传动轴
   - 电子器件箱体外壳

---

## 🏗️ 架构概览

```
[Blockly Blocks]
       │ (blocklyWorkspace.addChangeListener)
       ▼
[Blockly Python Generator]
       │
       ├─────────────────────────┐
       ▼                         ▼
[Monaco Editor]          [Debounce Timer 400ms]
(Displays clean Python)           │
       ▼
[POST /api/v1/render/cq]
       │
[FastAPI Execution Sandbox]
       │
[ocp_tessellate -> three-cad-viewer JSON]
       │
       ▼
[three-cad-viewer renders Mesh + B-Rep Edges]
```

---

## 🚀 快速启动指南

### 方式一：一键启动脚本（推荐）

在 Windows 环境下，可直接双击运行根目录下的批处理脚本，或在终端中执行 PowerShell 脚本，自动完成环境校验、端口清理、前后端服务拉起与浏览器打开：

```powershell
# 一键启动前后端服务并自动打开浏览器 (或直接双击 start.bat)
.\start.ps1

# 常用可选参数：
# .\start.ps1 -NoBrowser                  # 启动服务但不自动弹窗打开浏览器
# .\start.ps1 -Prod                       # 前端以生产模式 (next start) 启动
# .\start.ps1 -BackendPort 8000 -FrontendPort 3000

# 一键停止所有前后端服务 (或直接双击 stop.bat)
.\stop.ps1
```

---

### 方式二：手动分别启动

#### 1. 启动后端服务 (FastAPI)

```bash
# 进入根目录
cd d:/cq-lingji

# 安装 Python 依赖 (需 Python ≥ 3.10)
pip install -r backend/requirements.txt

# 启动 FastAPI 服务 (运行在 http://localhost:8000)
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

后端主要接口：
- `GET  /api/v1/health`：健康检查与 CadQuery 版本检测
- `POST /api/v1/render/cq`：输入 Python 代码，返回三维网格 JSON
- `POST /api/v1/export/stl`：导出 STL 二进制文件流
- `POST /api/v1/export/step`：导出 STEP 实体文件流

### 2. 启动前端工作台 (Next.js)

```bash
# 进入前端目录
cd d:/cq-lingji/frontend

# 安装前端依赖
npm install

# 启动开发服务器 (运行在 http://localhost:3000)
npm run dev
# 或以已构建的高性能生产模式启动:
npm run start
```

打开浏览器访问 `http://localhost:3000` 即可开始体验！

---

## 🧩 CadQuery 积木设计规范

| 积木类型 | 积木名称 | 对应 CadQuery Fluent API | 作用说明 |
|---|---|---|---|
| **基准面** | `cq_init_workplane` | `part = cq.Workplane("XY")` | 创建建模初始参考面 (XY, XZ, YZ) |
| **草图绘制** | `cq_sketch_circle` | `.circle(radius=R)` | 绘制圆形草图 |
| **草图绘制** | `cq_sketch_rect` | `.rect(xLen=W, yLen=H)` | 绘制居中矩形草图 |
| **草图绘制** | `cq_sketch_polygon` | `.polygon(nSides=N, diameter=D)` | 绘制正多边形草图 |
| **3D 特征** | `cq_op_extrude` | `.extrude(distance=H)` | 沿面法向拉伸为实体 |
| **3D 特征** | `cq_op_hole` | `.hole(diameter=D, depth=DEPTH)` | 在当前工作面原点打通孔/盲孔 |
| **3D 特征** | `cq_op_cut_blind` | `.cutBlind(-depth)` | 反向盲切减胶 |
| **3D 特征** | `cq_op_fillet` | `.edges().fillet(radius)` | 为模型边缘倒圆角 |
| **3D 特征** | `cq_op_chamfer` | `.edges().chamfer(length)` | 为模型边缘倒斜角 |
| **选择变换** | `cq_sel_face` | `.faces(">Z").workplane()` | 选择特征表面建立新草图平面 |
| **选择变换** | `cq_sel_offset` | `.workplane(offset=OFFSET)` | 平行偏移工作平面 |
| **选择变换** | `cq_op_transform` | `.transformed(rotate=..., offset=...)` | 局部坐标系旋转与平移 |
| **教学宏** | `cq_macro_radial_array` | 循环旋转+打孔 | 在零件顶面自动围绕 Z 轴均布打孔 |

---

## 🧪 自动化测试验证

平台包含全套自动化测试套件：

```bash
# 测试沙箱安全性、超时熔断与几何序列化
python -m backend.test_sandbox

# 测试 API 接口 (渲染、健康检查、STL/STEP 文件导出)
python -m backend.test_api
```
