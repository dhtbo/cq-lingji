/**
 * 初学者经典 CadQuery 案例模板库
 */

export interface CadTemplate {
  id: string;
  name: string;
  description: string;
  code: string;
}

export const CAD_TEMPLATES: CadTemplate[] = [
  {
    id: "mars_heat_shield",
    name: "🪐 火星防热大底 (Lesson 01)",
    description: "火星 EDL 着陆系统：双截面圆台放样与耐磨法兰裙边 (启蒙组/进阶组)",
    code: `import cadquery as cq

# 1. 基础尺寸参数
r_bottom = 30.0  # 大底底面受热面半径
r_top = 20.0     # 顶面连接平台半径
height = 15.0    # 防热层厚度

# 2. 倒圆台平滑放样
shield = (
    cq.Workplane("XY")
    .circle(r_bottom)
    .workplane(offset=height)
    .circle(r_top)
    .loft(combine=True)
)

# 3. 底部耐磨法兰裙边与布尔并集
flange = cq.Workplane("XY").circle(r_bottom + 3.0).extrude(2.0)
part = shield.union(flange)
`,
  },
  {
    id: "mars_polar_flange",
    name: "🚀 极坐标耐磨法兰 (Lesson 02)",
    description: "火星着陆腿基座：8 孔极坐标均布穿孔阵列与节圆投影 (进阶组)",
    code: `import cadquery as cq

# 1. 基础高强耐磨法兰体
flange = cq.Workplane("XY").circle(33.0).extrude(3.0)

# 2. 在 28mm 节圆上执行 8 孔极坐标贯穿切削
part = (
    flange.faces(">Z")
    .workplane()
    .polarArray(radius=28.0, startAngle=0, angle=360, count=8)
    .circle(1.5)
    .cutThruAll()
)
`,
  },
  {
    id: "mars_laval_nozzle",
    name: "🔥 霍尔推进喷管 (Lesson 03)",
    description: "星际霍尔推进器：样条曲线双曲型线与 360° 旋转拉伸曲面成型 (进阶组)",
    code: `import cadquery as cq

# 1. 推进器气动型线参数
r_inlet = 20.0       # 入口流道半径
r_throat = 10.0      # 喉部临界截面半径
r_exit = 25.0        # 出口扩张截面半径
length = 40.0        # 喷管总长
wall_thickness = 2.5 # 航天合金壁厚

# 2. 闭合多边形与收敛-扩张双曲样条
outer_pts = [(0, r_inlet + wall_thickness), (15, r_throat + wall_thickness), (length, r_exit + wall_thickness)]
inner_pts = [(length, r_exit), (15, r_throat), (0, r_inlet)]

part = (
    cq.Workplane("XZ")
    .moveTo(0, r_inlet)
    .lineTo(0, r_inlet + wall_thickness)
    .spline(outer_pts)
    .lineTo(length, r_exit)
    .spline(inner_pts)
    .close()
    .revolve(360, (0, 0, 0), (1, 0, 0))
)
`,
  },
  {
    id: "mars_cooling_slots",
    name: "❄️ 辐射散热格栅 (Lesson 04)",
    description: "火星动力核心：16 槽全向极坐标辐射散热格栅盲切阵列 (进阶组)",
    code: `import cadquery as cq

# 1. 动力堆高导热金属基体
part = cq.Workplane("XY").circle(30.0).extrude(15.0)

# 2. 顶端面周向 16 槽辐射盲切阵列
part = (
    part.faces(">Z")
    .workplane()
    .polarArray(radius=22.0, startAngle=0, angle=360, count=16)
    .rect(2.0, 8.0)
    .cutBlind(-4.0)
)
`,
  },
  {
    id: "flange_radial_holes",
    name: "🔩 法兰盘与环形多孔",
    description: "经典机械法兰盘：中心大通孔与 6 个均布螺栓孔",
    code: `import cadquery as cq

# 1. 基础圆盘
part = cq.Workplane("XY").circle(30).extrude(8)

# 2. 中心大通孔
part = part.faces(">Z").workplane().hole(diameter=14, depth=8)

# 3. 径向均布 6 个螺栓孔
part = part.faces(">Z").workplane(offset=0).transformed(rotate=(90, 0, 0))
for _ in range(6):
    part = part.transformed(rotate=(0, 360 / 6, 0)).hole(diameter=4.5, depth=8)
`,
  },
  {
    id: "hex_nut",
    name: "🔩 六角螺母",
    description: "正六边形柱体拉伸与中心螺纹预制孔及外侧倒角",
    code: `import cadquery as cq

# 1. 正六边形柱
part = cq.Workplane("XY").polygon(nSides=6, diameter=28).extrude(12)

# 2. 中心内通孔
part = part.faces(">Z").workplane().hole(diameter=10, depth=12)

# 3. 顶边缘倒斜角
part = part.faces(">Z").edges().chamfer(1.2)
`,
  },
  {
    id: "l_bracket",
    name: "📐 L 型加固角码支架",
    description: "工业钣金与固定角码：双面安装固定沉孔",
    code: `import cadquery as cq

# 1. 创建基础立方体
part = cq.Workplane("XY").box(30, 30, 30)

# 2. 盲切掏空形成 L 截面
part = part.faces(">Z").workplane().transformed(offset=(5, 5, 0)).rect(25, 25).cutBlind(-25)

# 3. 在立壁与底板各打一个安装孔
part = part.faces(">Y").workplane().hole(diameter=5, depth=5)
part = part.faces("<Z").workplane().hole(diameter=5, depth=5)
`,
  },
  {
    id: "stepped_shaft",
    name: "⚙️ 阶梯回转传动轴",
    description: "通过逐级草图拉伸创建机械多阶轴",
    code: `import cadquery as cq

# 1. 底轴段
part = cq.Workplane("XY").circle(18).extrude(20)

# 2. 中间承载轴段
part = part.faces(">Z").workplane().circle(12).extrude(25)

# 3. 顶部小轴段与导向倒角
part = part.faces(">Z").workplane().circle(8).extrude(15)
part = part.faces(">Z").edges().chamfer(1.0)
`,
  },
  {
    id: "hollow_box",
    name: "📦 电子器件外壳箱体",
    description: "外框立方体盲切减胶掏空，四周带圆润过渡倒角",
    code: `import cadquery as cq

# 1. 外形基体
part = cq.Workplane("XY").box(40, 30, 20)

# 2. 外缘倒圆角提升触感
part = part.edges("|Z").fillet(3.0)

# 3. 顶面内部掏空腔体
part = part.faces(">Z").workplane().rect(34, 24).cutBlind(-17)
`,
  },
];
