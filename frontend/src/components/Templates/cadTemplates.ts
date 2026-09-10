/**
 * build123d 官方入门示例与精选教学案例模板库 (build123d Showcase Templates)
 * 全面涵盖官方经典教程 (Lego积木、轴承、茶壶盖、时钟盘、机械法兰、键帽、星际工程等)
 */

export interface CadTemplate {
  id: string;
  name: string;
  description: string;
  code: string;
}

export const CAD_TEMPLATES: CadTemplate[] = [
  {
    id: "lego_brick",
    name: "🧱 乐高积木 (Lego Brick - 官方经典)",
    description: "build123d 官方教程经典：参数化乐高积木块，包含 2×4 顶部凸台阵列与底部抽壳掏空",
    code: `from build123d import *

# 1. 乐高参数定义 (标准螺距 8mm)
rows = 2
cols = 4
pitch = 8.0
length = cols * pitch - 0.2
width = rows * pitch - 0.2
height = 9.6
stud_radius = 2.4
stud_height = 1.8

# 2. 建造乐高主体与凸台阵列
with BuildPart() as part:
    # 基础矩形砖块
    Box(length, width, height)
    # 顶部凸台 2x4 网格阵列
    with Locations((0, 0, height / 2)):
        with GridLocations(pitch, pitch, cols, rows):
            Cylinder(radius=stud_radius, height=stud_height)
    # 底部掏空抽壳 (保留顶面与外壁)
    offset(amount=-1.5, openings=part.faces().sort_by(Axis.Z)[0])
`,
  },
  {
    id: "bearing_assembly",
    name: "⚙️ 工业球轴承 (Bearing Assembly)",
    description: "机械工程基石：外圈、内圈滚道与 8 颗环形均布滚珠 (PolarLocations)",
    code: `from build123d import *

outer_r = 25.0
inner_r = 12.0
ball_r = 3.5
pitch_r = (outer_r + inner_r) / 2
thickness = 10.0

with BuildPart() as part:
    # 外圈
    Cylinder(radius=outer_r, height=thickness)
    Cylinder(radius=pitch_r + ball_r * 0.8, height=thickness, mode=Mode.SUBTRACT)
    # 内圈
    Cylinder(radius=pitch_r - ball_r * 0.8, height=thickness, mode=Mode.ADD)
    Cylinder(radius=inner_r, height=thickness, mode=Mode.SUBTRACT)
    # 8 颗环形滚珠
    with PolarLocations(radius=pitch_r, count=8):
        Sphere(radius=ball_r, mode=Mode.ADD)
    # 外圈边缘倒圆角
    fillet(part.faces().sort_by(Axis.Z)[-1].edges(), radius=1.0)
`,
  },
  {
    id: "flange_polar_bolts",
    name: "🔩 机械法兰与极坐标螺栓孔 (Flange Plate)",
    description: "build123d 建造者经典：中心定位通孔与 6 孔极坐标周向均布阵列",
    code: `from build123d import *

with BuildPart() as part:
    # 基础法兰盘体
    Cylinder(radius=30.0, height=8.0)
    # 轴心大通孔
    Hole(radius=7.0, depth=8.0)
    # 节圆 22mm 上均布 6 个固定螺栓孔
    with PolarLocations(radius=22.0, count=6):
        Hole(radius=2.5, depth=8.0)
    # 顶面边缘倒斜角
    chamfer(part.faces().sort_by(Axis.Z)[-1].edges(), length=1.2)
`,
  },
  {
    id: "custom_keycap",
    name: "⌨️ 客制化机械键盘键帽 (Keycap)",
    description: "双截面草图放样 (BuildSketch + loft) 与凹面人体工学设计",
    code: `from build123d import *

with BuildPart() as part:
    # 底部基准草图 (18x18mm)
    with BuildSketch(Plane.XY) as s1:
        Rectangle(18.0, 18.0)
    # 顶部接触面草图 (12x12mm，偏置 8mm)
    with BuildSketch(Plane.XY.offset(8.0)) as s2:
        Rectangle(12.0, 12.0)
    # 放样成形
    loft()
    # 4 条侧棱倒圆角
    side_edges = [e for e in part.edges() if 1.0 < e.center().Z < 7.0]
    fillet(side_edges, radius=1.0)
    # 顶面指尖接触凹球切削
    with Locations((0, 0, 8.0 + 15.0)):
        Sphere(radius=16.0, mode=Mode.SUBTRACT)
`,
  },
  {
    id: "hex_nut_standard",
    name: "🔩 工业六角螺母 (Hex Nut)",
    description: "正六边形柱 RegularPolygon、中心通孔 Hole 与外围倒斜角 chamfer",
    code: `from build123d import *

with BuildPart() as part:
    # 绘制正六边形截面并拉伸
    with BuildSketch() as sk:
        RegularPolygon(radius=14.0, side_count=6)
    extrude(amount=10.0)
    # 中心预制螺纹孔
    Hole(radius=5.0, depth=10.0)
    # 上下边缘倒角保护
    chamfer(part.faces().sort_by(Axis.Z)[-1].edges(), length=1.2)
    chamfer(part.faces().sort_by(Axis.Z)[0].edges(), length=1.2)
`,
  },
  {
    id: "l_bracket_gusset",
    name: "📐 L型承重角码支架 (L-Bracket)",
    description: "直角托架结构：厚度拉伸、安装定位沉孔与边缘圆滑过渡",
    code: `from build123d import *

with BuildPart() as part:
    # 基础立方体
    Box(30.0, 30.0, 30.0)
    # 切去右上半部形成 L 截面
    with Locations((7.5, 0, 7.5)):
        Box(20.0, 32.0, 20.0, mode=Mode.SUBTRACT)
    # 棱边倒圆角过渡
    fillet(part.edges().filter_by(Axis.Y), radius=1.5)
    # 安装孔 1 (立壁)
    with Locations((-8.0, 0, 5.0)):
        Hole(radius=2.5, depth=20.0)
    # 安装孔 2 (底板)
    with Locations((5.0, 0, -8.0)):
        Hole(radius=2.5, depth=20.0)
`,
  },
  {
    id: "mars_heat_shield",
    name: "🪐 火星防热大底 (Mars Heat Shield)",
    description: "航天 EDL 系统：多截面圆台放样 (loft) 与环形耐磨法兰裙边",
    code: `from build123d import *

# 1. 基础尺寸参数
r_bottom = 30.0  # 大底底面受热面半径
r_top = 20.0     # 顶面连接平台半径
height = 15.0    # 防热层厚度

with BuildPart() as part:
    # 底部与顶面草图放样
    with BuildSketch(Plane.XY) as s1:
        Circle(radius=r_bottom)
    with BuildSketch(Plane.XY.offset(height)) as s2:
        Circle(radius=r_top)
    loft()
    # 底部耐磨法兰裙边
    Cylinder(radius=r_bottom + 3.0, height=2.0)
    # 顶部中心减重凹槽
    with Locations((0, 0, height)):
        Cylinder(radius=12.0, height=4.0, mode=Mode.SUBTRACT)
`,
  },
  {
    id: "mars_hall_nozzle",
    name: "🔥 霍尔推进喷管 (Hall Thruster Nozzle)",
    description: "星际等离子推进器：回转体 revolve 与周向辐射散热鳍片",
    code: `from build123d import *

with BuildPart() as part:
    # 喷管回转截面草图 (在 XZ 平面上绕 Z 轴回转)
    with BuildSketch(Plane.XZ) as sk:
        with BuildLine() as ln:
            l1 = Line((10, 0), (22, 0))
            l2 = Line((22, 0), (26, 35))
            l3 = Line((26, 35), (23, 35))
            l4 = Line((23, 35), (8, 0))
            Line((8, 0), (10, 0))
        make_face()
    revolve(axis=Axis.Z, revolution_arc=360)
    # 头部固定沉孔
    with Locations((0, 0, 35)):
        with PolarLocations(radius=18.0, count=8):
            Hole(radius=1.8, depth=10.0)
`,
  },
  {
    id: "clock_face",
    name: "⏰ 极坐标时钟盘 (Clock Face)",
    description: "build123d 极坐标经典：12 小时刻度周向均布与指针凸出",
    code: `from build123d import *

with BuildPart() as part:
    # 表盘底座
    Cylinder(radius=35.0, height=4.0)
    # 12 小时刻度柱 (极坐标 12 均布)
    with Locations((0, 0, 2.0)):
        with PolarLocations(radius=28.0, count=12):
            Box(2.5, 5.0, 2.0)
    # 中心表针轴孔
    Hole(radius=3.0, depth=4.0)
`,
  },
  {
    id: "pillow_block",
    name: "🧱 立式轴承座 (Pillow Block - 官方教程3)",
    description: "build123d 官方教程 3：经典机械构件，顶部圆弧拱顶、轴承通孔与两侧地脚螺栓安装孔",
    code: `from build123d import *

height = 50.0
width = 100.0
thickness = 20.0
bore_radius = 15.0

with BuildPart() as part:
    # 基础承重板体
    Box(width, thickness, height)
    # 顶部圆弧拱形倒圆
    fillet(part.edges().filter_by(Axis.Y).sort_by(Axis.Z)[-2:], radius=thickness / 2)
    # 中心轴承贯通孔
    Hole(radius=bore_radius, depth=thickness)
    # 两侧地脚固定螺栓孔 (GridLocations)
    with GridLocations(width - 25.0, 0, 2, 1):
        Hole(radius=4.5, depth=height)
`,
  },
  {
    id: "swept_pipe",
    name: "🚰 空间扫掠管道 (Swept Pipe - 官方案例8)",
    description: "build123d 官方入门案例 8：BuildLine 空间三维导引路径与 BuildSketch 环形截面沿路径扫掠 (sweep)",
    code: `from build123d import *

with BuildPart() as part:
    # 1. 空间导引折线路径
    with BuildLine() as path:
        Line((0, 0, 0), (0, 0, 30))
        Line((0, 0, 30), (0, 30, 60))
    # 2. 中空环形截面并沿路径扫掠
    with BuildSketch(Plane.XY) as sk:
        Circle(radius=6.0)
        Circle(radius=4.5, mode=Mode.SUBTRACT)
    sweep(path=path.line)
`,
  },
  {
    id: "counterbore_plate",
    name: "🔩 沉头螺钉安装板 (Counterbore - 官方案例11)",
    description: "build123d 官方入门案例 11：带外边倒角、凸台与沉头孔 (CounterBoreHole) 的工业安装底板",
    code: `from build123d import *

with BuildPart() as part:
    # 1. 主安装底板与四角圆角
    Box(80.0, 60.0, 10.0)
    fillet(part.edges().filter_by(Axis.Z), radius=6.0)
    # 2. 四角沉头螺栓孔 (GridLocations 阵列)
    with GridLocations(56.0, 38.0, 2, 2):
        CounterBoreHole(radius=2.25, counter_bore_radius=4.5, counter_bore_depth=4.0)
    # 3. 中心凸起定位台与减重孔
    with Locations((0, 0, 5.0)):
        Cylinder(radius=16.0, height=5.0)
        Hole(radius=10.0, depth=15.0)
`,
  },
  {
    id: "mirroring_bracket",
    name: "🪞 镜像对称支架 (Mirroring - 官方案例12)",
    description: "build123d 官方入门案例 12：构建单侧几何实体后通过 mirror(about=Plane.YZ) 实现工业对称拓扑镜像",
    code: `from build123d import *

with BuildPart() as part:
    # 1. 构建单侧特征
    with Locations((15.0, 0, 0)):
        Box(30.0, 20.0, 15.0)
        Hole(radius=5.0, depth=15.0)
    # 2. 沿 YZ 平面镜像生成对称半区
    mirror(about=Plane.YZ)
    # 3. 中心强化连结梁
    Box(10.0, 24.0, 10.0)
`,
  },
];
