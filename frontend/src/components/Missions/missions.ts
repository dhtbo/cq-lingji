/**
 * 学习挑战关卡定义 (Missions)
 * 涵盖火星拓荒者计划 · 启蒙组 (Lesson 01 - 16) 全量工程案例
 * 贯彻 Karpathy "构建即理解" (Construction is Understanding) 理念：
 * 从最朴素的 2D 草图与基准坐标系出发，亲手构建航天级构件与火星基地。
 */

export interface Mission {
  id: string;
  stage: string;
  title: string;
  subtitle: string;
  level: string;
  tagColor: string;
  goalDescription: string;
  learningPoints: string[];
  checkpoints: {
    text: string;
    regex: RegExp;
  }[];
  starterCode: string;
  solutionCode: string;
  hint: string;
  karpathyNote: string;
}

export const CAD_MISSIONS: Mission[] = [
  // ================= 阶段一：先锋火星着陆舱 (L01 - L04) =================
  {
    id: "mars-l01",
    stage: "阶段一：先锋着陆舱",
    title: "L01: 碳陶钝头防热大底构型",
    subtitle: "空间坐标感知与 3D 回转体几何建模",
    level: "L01",
    tagColor: "text-amber-400 border-amber-500/30 bg-amber-500/10",
    goalDescription:
      "以 3D 坐标原点为基准，利用闭合多段线和回转操作 (revolve) 构建能够抵御 2000℃ 气动灼烧的钝头倒圆台大底，并在顶部熔合抗冲刷阶梯法兰圈。",
    learningPoints: [
      "理解 3D 空间基准坐标系与 XZ 平面回转体成型",
      "使用 polyline 构建闭合截面草图并 revolve 360 度",
      "在局部工作面构建法兰圈并使用 union 执行布尔并集",
    ],
    checkpoints: [
      { text: "选择 XZ 投影基准面", regex: /Workplane\s*\(\s*['"]XZ['"]\s*\)/ },
      { text: "构建闭合截面 (polyline / close)", regex: /\.polyline\s*\(.*\.close\s*\(/ },
      { text: "旋转 360 度成型 (revolve)", regex: /\.revolve\s*\(/ },
      { text: "外环法兰熔合 (union)", regex: /\.union\s*\(/ },
    ],
    starterCode: `import cadquery as cq

# Task 1: 在 XZ 平面绘制钝头大底轮廓并旋转 360 度
heat_shield = (
    cq.Workplane("XZ")
    .polyline([(0, 0), (30, 0), (28, 5), (20, 15), (0, 15)])
    .close()
    .revolve(360, (0, 0, 0), (0, 1, 0))
)

# Task 2: 挑战：在顶部添加加固阶梯法兰 (外径23，内径19，高3) 并执行并集
# 提示: flange = cq.Workplane("XY").transformed(offset=(0, 0, 13)).circle(23).circle(19).extrude(3)
# part = heat_shield.union(flange)
part = heat_shield
`,
    solutionCode: `import cadquery as cq

# 1. 建立基础防热大底（倒圆锥台：底大顶小）
heat_shield = (
    cq.Workplane("XZ")
    .polyline([(0, 0), (30, 0), (28, 5), (20, 15), (0, 15)])
    .close()
    .revolve(360, (0, 0, 0), (0, 1, 0))
)

# 2. 顶部法兰圈加固外环并执行布尔并集
flange = cq.Workplane("XY").transformed(offset=(0, 0, 13)).circle(23).circle(19).extrude(3)
part = heat_shield.union(flange)
`,
    hint: "利用 XZ 平面构造截面，绕 Z 轴旋转 (0,1,0) 即可获得圆台；再在 XY 平面做两个同心圆拉伸即得到中空法兰环。",
    karpathyNote: "不要一上来就尝试拼装复杂系统。先让最底层的物理大底在原点牢牢立住，一切复杂工程皆源于基准。",
  },
  {
    id: "mars-l02",
    stage: "阶段一：先锋着陆舱",
    title: "L02: 乘员生活加压舱与观景舷窗",
    subtitle: "布尔差集切削内腔与空间贯通",
    level: "L02",
    tagColor: "text-amber-400 border-amber-500/30 bg-amber-500/10",
    goalDescription:
      "在大底上方装配乘员生活舱实心圆柱外柱，使用布尔差集 (cut) 掏出壁厚 3mm 的安全加压内腔，并在侧壁切削打通观察火星地表的观景舷窗。",
    learningPoints: [
      "布尔差集 (cut) 的物理本质：材料去除与内腔生成",
      "精确壁厚控制（外径 20mm，内径 17mm，留出 3mm 辐射防护壁）",
      "跨坐标系几何切削（在 YZ 侧平面切削舷窗）",
    ],
    checkpoints: [
      { text: "构建实心加压主舱 (circle / extrude)", regex: /\.circle\s*\(.*\.extrude\s*\(/ },
      { text: "布尔差集掏空内腔 (cut)", regex: /\.cut\s*\(/ },
      { text: "侧向观景舷窗打通 (YZ / cut)", regex: /Workplane\s*\(\s*['"]YZ['"]\s*\)/ },
    ],
    starterCode: `import cadquery as cq

# 1. 乘员舱实心外壳 (半径20，高度40)
hull = cq.Workplane("XY").circle(20).extrude(40)

# 2. 挑战：使用内切圆柱差集掏空内腔 (壁厚3mm: 半径17，抬升3mm)
# inner = cq.Workplane("XY").transformed(offset=(0, 0, 3)).circle(17).extrude(38)
# cabin = hull.cut(inner)

# 3. 挑战：在 YZ 侧面切削一个半径 6mm 的舷窗
# window = cq.Workplane("YZ").transformed(offset=(0, 25, 0)).circle(6).extrude(50)
part = hull
`,
    solutionCode: `import cadquery as cq

# 1. 乘员舱外壳
hull = cq.Workplane("XY").circle(20).extrude(40)

# 2. 内腔掏空（壁厚 3mm）
inner = cq.Workplane("XY").transformed(offset=(0, 0, 3)).circle(17).extrude(38)
cabin = hull.cut(inner)

# 3. 侧向观景舷窗切削
window = cq.Workplane("YZ").transformed(offset=(0, 25, 0)).circle(6).extrude(50)
part = cabin.cut(window)
`,
    hint: "掏空时内腔圆柱的底部抬高 3mm，可以保留结实防冲撞的大底厚度；侧向拉伸只要长度足够贯穿即可完成舷窗打孔。",
    karpathyNote: "减法和加法同等重要。在 3D CAD 里，掏出内部空间和留下防护壁厚是安全工程的第一信条。",
  },
  {
    id: "mars-l03",
    stage: "阶段一：先锋着陆舱",
    title: "L03: 外壁全向辐射散热格栅肋条",
    subtitle: "线性循环阵列与热学特征熔合",
    level: "L03",
    tagColor: "text-amber-400 border-amber-500/30 bg-amber-500/10",
    goalDescription:
      "在舱体外壁通过循环阵列 (for 循环) 批量生成 5 层等距百叶窗式辐射散热肋片，与主舱体外壳牢固熔合，形成全向热循环架构。",
    learningPoints: [
      "算法化参数化建模思维：用循环代替手动重复复制",
      "Z 轴坐标动态偏移计算：offset=(0, 0, z)",
      "同心圆拉伸环形薄片并与主体布尔并集",
    ],
    checkpoints: [
      { text: "建立主加压舱外壁", regex: /Workplane/ },
      { text: "使用循环阵列 (for ... range)", regex: /for\s+\w+\s+in\s+range/ },
      { text: "循环生成多层肋片并并集 (union)", regex: /\.union\s*\(/ },
    ],
    starterCode: `import cadquery as cq

# 1. 基础主舱体
cabin = cq.Workplane("XY").circle(20).extrude(40)

# 2. 挑战：使用 for 循环生成 5 层环形散热肋片 (外径23，内径20，厚度2) 并与 cabin 熔合
# 提示: for i in range(5):
#     z = 8 + i * 6
#     fin = cq.Workplane("XY").transformed(offset=(0, 0, z)).circle(23).circle(20).extrude(2)
#     cabin = cabin.union(fin)

part = cabin
`,
    solutionCode: `import cadquery as cq

# 1. 基础舱体
cabin = cq.Workplane("XY").circle(20).extrude(40)

# 2. 循环生成多层环形散热肋片并求并集
for i in range(5):
    z = 8 + i * 6
    fin = cq.Workplane("XY").transformed(offset=(0, 0, z)).circle(23).circle(20).extrude(2)
    cabin = cabin.union(fin)

part = cabin
`,
    hint: "内径设为 20 贴合舱壁，外径 23 突出 3mm 作为散热翅片，通过 8 + i * 6 沿高度等间距分布。",
    karpathyNote: "参数化是程序员的核心超能力。不要手工画五次圆环，让循环和算术定义物理特征。",
  },
  {
    id: "mars-l04",
    stage: "阶段一：先锋着陆舱",
    title: "L04: 8喷嘴脉冲推进器圆周阵列",
    subtitle: "放样成型与极坐标 360° 等分阵列",
    level: "L04",
    tagColor: "text-amber-400 border-amber-500/30 bg-amber-500/10",
    goalDescription:
      "构建底部反推推进盘，使用放样 (loft) 或阶梯圆锥构建单个脉冲姿控喷嘴，并通过三角函数与极坐标将 8 个喷嘴均布在 360° 圆周上，完成阶段一全要素总装！",
    learningPoints: [
      "空间放样 (loft)：通过两组不同截面圆生成收敛喷管",
      "极坐标数学转化：x = R * cos(θ), y = R * sin(θ)",
      "多体特征批量总装与着陆姿控动力学理解",
    ],
    checkpoints: [
      { text: "导入数学库 (math)", regex: /import\s+math/ },
      { text: "放样或圆锥喷嘴构建 (loft / circle)", regex: /(loft|circle)/ },
      { text: "8 个等分喷嘴极坐标计算 (range.*8|360)", regex: /(range\s*\(\s*8\s*\)|360)/ },
      { text: "喷嘴与基座全舱熔合 (union)", regex: /\.union\s*\(/ },
    ],
    starterCode: `import cadquery as cq
import math

# 1. 推进器安装底座
base = cq.Workplane("XY").circle(22).extrude(10)

# 2. 挑战：通过 8 等分角度循环，在半径 16mm 的圆周上生成 8 个姿控反推喷嘴
# 提示: for i in range(8):
#     angle = i * (360.0 / 8)
#     rad = math.radians(angle)
#     x, y = 16 * math.cos(rad), 16 * math.sin(rad)
#     nozzle = cq.Workplane("XY").transformed(offset=(x, y, -6)).circle(3.5).workplane(offset=6).circle(1.8).loft()
#     base = base.union(nozzle)

part = base
`,
    solutionCode: `import cadquery as cq
import math

# 1. 舱体底座
base = cq.Workplane("XY").circle(22).extrude(10)

# 2. 8 喷嘴环形阵列
for i in range(8):
    angle = i * (360.0 / 8)
    rad = math.radians(angle)
    x = 16 * math.cos(rad)
    y = 16 * math.sin(rad)
    # 放样生成拉伐尔扩张单喷嘴
    nozzle = (
        cq.Workplane("XY")
        .transformed(offset=(x, y, -6))
        .circle(3.5)
        .workplane(offset=6)
        .circle(1.8)
        .loft()
    )
    base = base.union(nozzle)

part = base
`,
    hint: "math.radians 将角度转为弧度，loft() 可以平滑连接两个高度不同的截面圆，形成完美的火箭扩张喷嘴。",
    karpathyNote: "极坐标是航天与机器人结构的核心语言。将数学角度转化为空间物理坐标，就是代码的魔法。",
  },

  // ================= 阶段二：智能六轮巡视漫游车 (L05 - L08) =================
  {
    id: "mars-l05",
    stage: "阶段二：六轮火星车",
    title: "L05: 火星车主仪器舱与太阳能翼板",
    subtitle: "倒角抗冲击车体与双侧展开翼板",
    level: "L05",
    tagColor: "text-blue-400 border-blue-500/30 bg-blue-500/10",
    goalDescription:
      "构建火星车 50×36×18mm 主密封仪器舱，对外立边执行倒圆角消除应力集中，并在两侧装配展开式太阳能电池翼板与前部双目测候相机桅杆。",
    learningPoints: [
      "箱体造型与 B-Rep 选择器 edges('|Z').fillet() 倒角",
      "两侧空间对称翼板装配",
      "全景感知立柱桅杆的多构件装配",
    ],
    checkpoints: [
      { text: "建立主仪器箱体 (box)", regex: /\.box\s*\(/ },
      { text: "竖直边倒角 (edges / fillet)", regex: /\.edges\s*\(.*\.fillet\s*\(/ },
      { text: "两侧太阳能翼板与立柱", regex: /transformed/ },
      { text: "全要素组合熔合 (union)", regex: /\.union\s*\(/ },
    ],
    starterCode: `import cadquery as cq

# 1. 主仪器舱箱体并执行竖直边倒圆角
chassis = cq.Workplane("XY").box(50, 36, 18).edges("|Z").fillet(3)

# 2. 挑战：在两侧添加展开式太阳能翼板 (46x12x2) 以及前部双目相机桅杆
# wing_left = cq.Workplane("XY").transformed(offset=(0, 24, 6)).box(46, 12, 2)
# wing_right = cq.Workplane("XY").transformed(offset=(0, -24, 6)).box(46, 12, 2)
# mast = cq.Workplane("XY").transformed(offset=(18, 0, 9)).circle(2.5).extrude(20)
# cam_head = cq.Workplane("XY").transformed(offset=(18, 0, 29)).box(8, 16, 6)

part = chassis
`,
    solutionCode: `import cadquery as cq

# 1. 主仪器舱 (倒角抗冲击箱体)
chassis = cq.Workplane("XY").box(50, 36, 18).edges("|Z").fillet(3)

# 2. 左右两侧太阳能电池翼板
wing_left = cq.Workplane("XY").transformed(offset=(0, 24, 6)).box(46, 12, 2)
wing_right = cq.Workplane("XY").transformed(offset=(0, -24, 6)).box(46, 12, 2)

# 3. 前方双目相机桅杆与探头
mast = cq.Workplane("XY").transformed(offset=(18, 0, 9)).circle(2.5).extrude(20)
cam_head = cq.Workplane("XY").transformed(offset=(18, 0, 29)).box(8, 16, 6)

part = chassis.union(wing_left).union(wing_right).union(mast).union(cam_head)
`,
    hint: "使用 .edges('|Z') 可以准确捕获平行于 Z 轴的 4 条立棱，fillet(3) 会把直角变成平滑抗撞的弧面。",
    karpathyNote: "没有一件航天器是纯矩形的尖角结构，尖角在恶劣受力下会开裂。倒角既是美学，更是工程物理定律。",
  },
  {
    id: "mars-l06",
    stage: "阶段二：六轮火星车",
    title: "L06: 自定义参数化 12 齿越野人字轮",
    subtitle: "轮毂轴孔与人字形越野齿极坐标阵列",
    level: "L06",
    tagColor: "text-blue-400 border-blue-500/30 bg-blue-500/10",
    goalDescription:
      "针对火星极细沙尘暴地形，参数化构建直径 36mm、带中心传动轴孔的轮毂，并用极坐标在轮缘均布 12 颗人字形防滑抓地齿爪。",
    learningPoints: [
      "横置车轮基准面选择 (YZ 平面横向拉伸)",
      "轮毂中心轴孔同心圆切削",
      "带空间旋转角 (rotate) 的防滑齿阵列生成",
    ],
    checkpoints: [
      { text: "YZ 平面生成轮体 (Workplane('YZ'))", regex: /Workplane\s*\(\s*['"]YZ['"]\s*\)/ },
      { text: "同心圆轴孔拉伸 (circle.*circle)", regex: /\.circle\s*\(.*\.circle\s*\(/ },
      { text: "12 齿循环计算 (12|range)", regex: /(12|range)/ },
      { text: "人字防滑齿与轮体熔合 (union)", regex: /\.union\s*\(/ },
    ],
    starterCode: `import cadquery as cq
import math

# 1. 建立轮毂基体与中心轴孔 (外径18，轴孔4，宽度14)
wheel = cq.Workplane("YZ").circle(18).circle(4).extrude(14)

# 2. 挑战：使用极坐标均布 12 颗越野防滑爪齿 (box 14x2.5x3.5)
# 提示: for i in range(12):
#     angle = i * (360.0 / 12)
#     rad = math.radians(angle)
#     y, z = 17.5 * math.cos(rad), 17.5 * math.sin(rad)
#     lug = cq.Workplane("YZ").transformed(offset=(0, y, z), rotate=(angle, 0, 0)).box(14, 2.5, 3.5)
#     wheel = wheel.union(lug)

part = wheel
`,
    solutionCode: `import cadquery as cq
import math

# 1. 轮毂基体与轴孔
wheel = cq.Workplane("YZ").circle(18).circle(4).extrude(14)

# 2. 12 齿外轮廓越野人字形防滑爪
for i in range(12):
    angle = i * (360.0 / 12)
    rad = math.radians(angle)
    y = 17.5 * math.cos(rad)
    z = 17.5 * math.sin(rad)
    lug = (
        cq.Workplane("YZ")
        .transformed(offset=(0, y, z), rotate=(angle, 0, 0))
        .box(14, 2.5, 3.5)
    )
    wheel = wheel.union(lug)

part = wheel
`,
    hint: "注意轮子是横卧的（沿 X 轴拉伸），所以截面在 YZ 平面，旋转也是围绕 X 轴 rotate=(angle, 0, 0)。",
    karpathyNote: "参数化封装意味着只要改变齿数一个变量，整个车轮就会自动重新自适应生成，这就是算法建模的力量。",
  },
  {
    id: "mars-l07",
    stage: "阶段二：六轮火星车",
    title: "L07: 六轮摇臂悬挂 (Rocker-Bogie) 底盘",
    subtitle: "主副摇臂骨架与 6 轮空间定点装配",
    level: "L07",
    tagColor: "text-blue-400 border-blue-500/30 bg-blue-500/10",
    goalDescription:
      "还原 NASA 毅力号火星车的摇臂转向架 (Rocker-Bogie) 悬挂系统：建立差速主梁、折线主副摇臂连杆，并在六个轮轴枢纽点预留自平衡安装座。",
    learningPoints: [
      "机械机构学 Rocker-Bogie 连杆的几何折线表达",
      "利用 polyline 构建三角传动骨架",
      "多轮位矩阵阵列与空间对称性",
    ],
    checkpoints: [
      { text: "建立中心差速横梁", regex: /Workplane/ },
      { text: "摇臂骨架连杆折线 (polyline)", regex: /\.polyline\s*\(/ },
      { text: "左右对称主副摇臂布局", regex: /transformed/ },
      { text: "悬挂底盘总成熔合 (union)", regex: /\.union\s*\(/ },
    ],
    starterCode: `import cadquery as cq

# 1. 中心差速主横梁
cross_beam = cq.Workplane("XY").box(12, 48, 6)

# 2. 挑战：构建左右摇臂骨架 (polyline 三角折线) 与 6 处轮轴枢纽座
# bogie_l = cq.Workplane("XZ").transformed(offset=(0, 24, -4)).polyline([(-24, -8), (0, 4), (24, -8)]).close().extrude(4)
# bogie_r = cq.Workplane("XZ").transformed(offset=(0, -28, -4)).polyline([(-24, -8), (0, 4), (24, -8)]).close().extrude(4)
# pivots = cq.Workplane("XY").transformed(offset=(0, 0, -8)).rect(48, 54, forConstruction=True).vertices().circle(4).extrude(6)

part = cross_beam
`,
    solutionCode: `import cadquery as cq

# 1. 中心差速主梁与转向架轴
cross_beam = cq.Workplane("XY").box(12, 48, 6)

# 2. 左右两侧主摇臂 (Rocker-Bogie)
bogie_l = cq.Workplane("XZ").transformed(offset=(0, 24, -4)).polyline([(-24, -8), (0, 4), (24, -8)]).close().extrude(4)
bogie_r = cq.Workplane("XZ").transformed(offset=(0, -28, -4)).polyline([(-24, -8), (0, 4), (24, -8)]).close().extrude(4)

# 3. 六轮枢纽安装基准座
pivots = cq.Workplane("XY").transformed(offset=(0, 0, -8)).rect(48, 54, forConstruction=True).vertices().circle(4).extrude(6)

part = cross_beam.union(bogie_l).union(bogie_r).union(pivots)
`,
    hint: "利用辅助矩形 rect(..., forConstruction=True).vertices() 可以一键在 4 个角或 6 个对称点同时生成轮轴基座！",
    karpathyNote: "自平衡悬挂不需要弹簧，而是依靠纯几何杠杆传递力矩。在 CAD 中清晰表达杠杆连杆，你就能理解它的被动适应性。",
  },
  {
    id: "mars-l08",
    stage: "阶段二：六轮火星车",
    title: "L08: 多自由度土壤采样机械臂与大总装",
    subtitle: "旋转云台、俯仰悬臂与薄壁采样铲斗",
    level: "L08",
    tagColor: "text-blue-400 border-blue-500/30 bg-blue-500/10",
    goalDescription:
      "为火星车打造地质取样前锋：构建回转底座、两段不同俯仰角伸缩悬臂，并在末端安装薄壁抽壳 (shell) 的采样铲斗，完成漫游车系统大总装！",
    learningPoints: [
      "机械臂的正运动学空间几何姿态表达 (rotate 与 offset 级联)",
      "薄壁抽壳操作 (.faces('>Z').shell(-1.5)) 打造铲斗内腔",
      "多自由度机器人的层级装配结构",
    ],
    checkpoints: [
      { text: "回转云台底座 (circle / extrude)", regex: /\.circle\s*\(.*\.extrude\s*\(/ },
      { text: "大臂小臂两段姿态变换 (rotate)", regex: /rotate\s*=/ },
      { text: "末端铲斗内腔薄壁抽壳 (shell / cut)", regex: /(shell|cut)/ },
      { text: "阶段二整车大总装熔合 (union)", regex: /\.union\s*\(/ },
    ],
    starterCode: `import cadquery as cq

# 1. 机械臂回转基座
base = cq.Workplane("XY").circle(8).extrude(6)

# 2. 挑战：添加大臂 (rotate 30°)、小臂 (rotate -45°) 和末端带内腔的铲斗 (shell -1.5)
# arm1 = cq.Workplane("XY").transformed(offset=(0, 0, 6), rotate=(0, 30, 0)).box(6, 6, 32)
# arm2 = cq.Workplane("XY").transformed(offset=(14, 0, 30), rotate=(0, -45, 0)).box(5, 5, 26)
# scoop = cq.Workplane("XY").transformed(offset=(28, 0, 16)).box(12, 14, 8).faces(">Z").shell(-1.5)

part = base
`,
    solutionCode: `import cadquery as cq

# 1. 回转云台底座
base = cq.Workplane("XY").circle(8).extrude(6)

# 2. 大臂 (伸展 32mm，俯仰角 30°)
arm1 = cq.Workplane("XY").transformed(offset=(0, 0, 6), rotate=(0, 30, 0)).box(6, 6, 32)

# 3. 肘部连结与小臂 (伸展 26mm，俯仰角 -45°)
arm2 = cq.Workplane("XY").transformed(offset=(14, 0, 30), rotate=(0, -45, 0)).box(5, 5, 26)

# 4. 末端土壤采样铲斗 (顶面开口薄壁掏空)
scoop = cq.Workplane("XY").transformed(offset=(28, 0, 16)).box(12, 14, 8).faces(">Z").shell(-1.5)

part = base.union(arm1).union(arm2).union(scoop)
`,
    hint: "通过 .faces('>Z').shell(-1.5) 可以自动把实心长方体顶部开口并向内掏空 1.5mm，瞬间形成结实的铲斗结构！",
    karpathyNote: "机械臂是一棵空间变换树。理解每一个关节的局部坐标变换，你就掌握了机器人学最核心的齐次变换矩阵。",
  },

  // ================= 阶段三：原位资源建造主基地 (L09 - L12) =================
  {
    id: "mars-l09",
    stage: "阶段三：原位主基地",
    title: "L09: 双层中空防沙防辐射主穹顶",
    subtitle: "半球分割、中空夹层切削与采光天窗",
    level: "L09",
    tagColor: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
    goalDescription:
      "为火星首批拓荒者打造安全家园：利用半球分割 (split) 打造外层防弹风挡穹顶，通过布尔差集掏出 4mm 双层中空保温防辐射夹层，并切削顶部采光天窗。",
    learningPoints: [
      "空间半球生成 (sphere.split(keepTop=True))",
      "同心半球布尔差集打造双层保护穹壳",
      "环形地基圈梁与天窗综合采光工程",
    ],
    checkpoints: [
      { text: "半球形主穹顶成型 (sphere / split)", regex: /\.sphere\s*\(.*\.split\s*\(/ },
      { text: "布尔差集掏空中空层 (cut)", regex: /\.cut\s*\(/ },
      { text: "地基加固与顶部采光天窗", regex: /(circle|union)/ },
    ],
    starterCode: `import cadquery as cq

# 1. 外层防尘主穹顶 (半径36的半球)
dome_outer = cq.Workplane("XY").sphere(36).split(keepTop=True)

# 2. 挑战：使用半径 32 的内半球差集掏出中空夹层，并添加地基圈梁和顶部采光天窗
# dome_inner = cq.Workplane("XY").sphere(32).split(keepTop=True)
# dome_shell = dome_outer.cut(dome_inner)
# base_ring = cq.Workplane("XY").circle(37).circle(31).extrude(4)
# skylight = cq.Workplane("XY").transformed(offset=(0, 0, 34)).circle(10).extrude(3)

part = dome_outer
`,
    solutionCode: `import cadquery as cq

# 1. 外层防尘主穹顶 (半球)
dome_outer = cq.Workplane("XY").sphere(36).split(keepTop=True)

# 2. 内层生活加压空间 (差集掏空，形成厚度 4mm 防护壁)
dome_inner = cq.Workplane("XY").sphere(32).split(keepTop=True)
dome_shell = dome_outer.cut(dome_inner)

# 3. 环形地基圈梁加固
base_ring = cq.Workplane("XY").circle(37).circle(31).extrude(4)

# 4. 顶部高通量采光天窗
skylight = cq.Workplane("XY").transformed(offset=(0, 0, 34)).circle(10).extrude(3)

part = dome_shell.union(base_ring).union(skylight)
`,
    hint: "split(keepTop=True) 会以当前平面对实体进行一刀切削，只保留上半球，非常适合快速构造大型建筑穹顶。",
    karpathyNote: "大自然中最稳定的受压结构就是穹顶。用双层薄壳代替笨重的实心砖石，这是人类进入太空时代的工程自觉。",
  },
  {
    id: "mars-l10",
    stage: "阶段三：原位主基地",
    title: "L10: 双向密封安全气闸室与生命廊桥",
    subtitle: "均压隔离舱、生命通道与快拆气动法兰",
    level: "L10",
    tagColor: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
    goalDescription:
      "构建火星舱外活动 (EVA) 关键咽喉：建模连接主穹顶的中空生命廊桥通道、中段圆柱均压气闸室，并装配快拆双向气动密封法兰门。",
    learningPoints: [
      "横向贯通生命走廊中空截面拉伸",
      "多舱室平移对接 (transformed offset)",
      "双向互锁密封法兰装配",
    ],
    checkpoints: [
      { text: "生命廊桥通道截面 (rect / circle)", regex: /(rect|circle)/ },
      { text: "均压过渡圆筒舱 (extrude)", regex: /\.extrude\s*\(/ },
      { text: "气动快拆密封法兰总成 (union)", regex: /\.union\s*\(/ },
    ],
    starterCode: `import cadquery as cq

# 1. 贯通生命廊桥 (连接主穹顶的中空走廊)
corridor = cq.Workplane("YZ").rect(16, 18).circle(6).extrude(36)

# 2. 挑战：在廊桥外侧对接均压过渡圆筒舱 (offset=(0, 36, 0)) 与密封门
# airlock = cq.Workplane("XY").transformed(offset=(0, 36, 0)).circle(14).extrude(24)
# flange = cq.Workplane("XY").transformed(offset=(0, 36, 22)).circle(16).circle(11).extrude(3)
# door = cq.Workplane("XY").transformed(offset=(0, 36, 23)).circle(10).extrude(2)

part = corridor
`,
    solutionCode: `import cadquery as cq

# 1. 贯通生命廊桥 (连接主穹顶的通道)
corridor = cq.Workplane("YZ").rect(16, 18).circle(6).extrude(36)

# 2. 均压过渡气闸舱体
airlock = cq.Workplane("XY").transformed(offset=(0, 36, 0)).circle(14).extrude(24)

# 3. 双向外舱门气动密封法兰环与门体
flange = cq.Workplane("XY").transformed(offset=(0, 36, 22)).circle(16).circle(11).extrude(3)
door = cq.Workplane("XY").transformed(offset=(0, 36, 23)).circle(10).extrude(2)

part = corridor.union(airlock).union(flange).union(door)
`,
    hint: "注意各个构件的坐标平移 offset=(0, 36, ...)，确保气闸室精准贴在廊桥的末端开口处，形成无缝对接。",
    karpathyNote: "在极端真空与沙尘暴面前，每一个连接处都是生死防线。模块化对接必须保证零间隙与尺寸闭环。",
  },
  {
    id: "mars-l11",
    stage: "阶段三：原位主基地",
    title: "L11: 螺旋水培农业种植塔与三联高压储罐",
    subtitle: "立式微藻循环水柱与交错采光托盘",
    level: "L11",
    tagColor: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
    goalDescription:
      "为火星长期驻留提供食物与氧气生命循环：建立中央立式水循环管道，按 60° 螺旋交错展开 5 层水培种植托盘，并在侧后方布置三联高压氧气储存胶囊罐群。",
    learningPoints: [
      "螺旋旋转阵列算法：角度 angle = i * 60 与高度 z = 8 + i * 8 联动",
      "空间两级变换 (rotate 与 offset 复合)",
      "多联式压力容器安全阵列",
    ],
    checkpoints: [
      { text: "中央立柱主干 (circle / extrude)", regex: /\.circle\s*\(.*\.extrude\s*\(/ },
      { text: "5 层 60° 螺旋托盘循环 (for ... 60)", regex: /(for|60)/ },
      { text: "三联高压储气罐组装 (union)", regex: /\.union\s*\(/ },
    ],
    starterCode: `import cadquery as cq

# 1. 中央生态循环水柱
core = cq.Workplane("XY").circle(5).extrude(50)

# 2. 挑战：使用 for 循环按 60° 步进生成 5 层错位展开水培托盘，并添加储氧罐
# for i in range(5):
#     angle = i * 60
#     z = 8 + i * 8
#     tray = cq.Workplane("XY").transformed(offset=(0, 0, z), rotate=(0, 0, angle)).transformed(offset=(12, 0, 0)).box(16, 12, 3)
#     core = core.union(tray)

part = core
`,
    solutionCode: `import cadquery as cq

# 1. 中央生态循环水柱
core = cq.Workplane("XY").circle(5).extrude(50)

# 2. 5 层 60 度交错螺旋水培托盘
for i in range(5):
    angle = i * 60
    z = 8 + i * 8
    tray = (
        cq.Workplane("XY")
        .transformed(offset=(0, 0, z), rotate=(0, 0, angle))
        .transformed(offset=(12, 0, 0))
        .box(16, 12, 3)
    )
    core = core.union(tray)

# 3. 三联高压氧气胶囊储罐
tank1 = cq.Workplane("XY").transformed(offset=(-16, 0, 0)).circle(4).extrude(30)
tank2 = cq.Workplane("XY").transformed(offset=(-22, 6, 0)).circle(3.5).extrude(26)
tank3 = cq.Workplane("XY").transformed(offset=(-22, -6, 0)).circle(3.5).extrude(26)

part = core.union(tank1).union(tank2).union(tank3)
`,
    hint: "螺旋托盘通过连续两次 transformed：第一次绕 Z 轴旋转方向，第二次沿 X 轴平移出悬臂半径，非常优雅高效。",
    karpathyNote: "螺旋是空间利用率最高的自然几何（正如 DNA 和向日葵）。算法赋能下的农业塔，是火星自给自足的关键钥匙。",
  },
  {
    id: "mars-l12",
    stage: "阶段三：原位主基地",
    title: "L12: AI创新功能舱拓展与生态基地总装",
    subtitle: "六边形原位冶炼舱与基地系统级集成",
    level: "L12",
    tagColor: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
    goalDescription:
      "运用 AI 启发式思考拓展基地专属功能：建模正六边形科研能源冶炼功能舱，装配微电网能量顶盖，并与主穹顶、气闸室、走廊连通，完成阶段三系统总装！",
    learningPoints: [
      "多边形特征造型 (polygon(6, ...))",
      "复杂系统跨尺度大部件总装思维",
      "航天基地原位利用 (ISRU) 工程概念落地",
    ],
    checkpoints: [
      { text: "生活主穹顶 (sphere)", regex: /\.sphere\s*\(/ },
      { text: "正六边形功能舱 (polygon(6))", regex: /\.polygon\s*\(\s*6/ },
      { text: "能源微电网顶盖与廊桥熔合 (union)", regex: /\.union\s*\(/ },
    ],
    starterCode: `import cadquery as cq

# 1. 核心生活主舱半球
main_dome = cq.Workplane("XY").sphere(25).split(keepTop=True)

# 2. 挑战：添加连接管道、正六边形科研能源舱 (polygon 6) 与能源顶盖并总装
# tube = cq.Workplane("YZ").circle(5).extrude(40)
# science_hub = cq.Workplane("XY").transformed(offset=(0, 40, 0)).polygon(6, 18).extrude(16)
# energy_cap = cq.Workplane("XY").transformed(offset=(0, 40, 16)).circle(14).extrude(2)

part = main_dome
`,
    solutionCode: `import cadquery as cq

# 1. 核心生活主舱
main_dome = cq.Workplane("XY").sphere(25).split(keepTop=True)

# 2. 联络通道廊桥
tube = cq.Workplane("YZ").circle(5).extrude(40)

# 3. 创新能源科研舱 (正六边形棱柱)
science_hub = (
    cq.Workplane("XY")
    .transformed(offset=(0, 40, 0))
    .polygon(6, 18)
    .extrude(16)
)

# 4. 太阳能微电网塔顶
energy_cap = cq.Workplane("XY").transformed(offset=(0, 40, 16)).circle(14).extrude(2)

part = main_dome.union(tube).union(science_hub).union(energy_cap)
`,
    hint: "polygon(6, 18) 会生成外接圆半径为 18mm 的标准正六边形，相比圆柱更具蜂巢扩展和模块化拼接优势。",
    karpathyNote: "真正的工程系统永远不是孤立的单一零件，而是多个子系统的有机集成。自底向上构建，终成宏大基地。",
  },

  // ================= 阶段四：星际工程全场景大总装与参赛成果 (L13 - L16) =================
  {
    id: "mars-l13",
    stage: "阶段四：场景大总装",
    title: "L13: 火星拓荒全要素全场景星际大片大总装",
    subtitle: "火星沙丘地表、着陆器、火星车与基地宏大总装",
    level: "L13",
    tagColor: "text-purple-400 border-purple-500/30 bg-purple-500/10",
    goalDescription:
      "将前三阶段成果聚合为史诗级大场景：构建 100×80mm 火星地貌沙丘底台，在合理透视位置定位主基地 (中景核心)、先锋着陆舱 (远景锚点) 与巡视漫游车 (前景主角)。",
    learningPoints: [
      "宏观场景布景与空间坐标层次规划 (前景/中景/远景)",
      "多比例尺度实体空间协同定位",
      "全场景几何数据一站式加载与性能平衡",
    ],
    checkpoints: [
      { text: "火星地表地台构建 (box)", regex: /\.box\s*\(/ },
      { text: "基地主穹顶空间定位 (offset)", regex: /transformed.*offset/ },
      { text: "漫游车与着陆舱全景熔合 (union)", regex: /\.union\s*\(/ },
    ],
    starterCode: `import cadquery as cq

# 1. 模拟火星地表地台 (100x80x4)
terrain = cq.Workplane("XY").box(100, 80, 4)

# 2. 挑战：在指定坐标装配基地主穹顶、着陆舱与探路火星车
# base_station = cq.Workplane("XY").transformed(offset=(-20, 0, 2)).sphere(18).split(keepTop=True)
# lander = cq.Workplane("XY").transformed(offset=(25, 20, 2)).circle(12).circle(8).extrude(16)
# rover = cq.Workplane("XY").transformed(offset=(15, -20, 2)).box(22, 16, 8)

part = terrain
`,
    solutionCode: `import cadquery as cq

# 1. 模拟火星地表地台
terrain = cq.Workplane("XY").box(100, 80, 4)

# 2. 基地主穹顶建筑群
base_station = cq.Workplane("XY").transformed(offset=(-20, 0, 2)).sphere(18).split(keepTop=True)

# 3. 着陆先锋舱
lander = cq.Workplane("XY").transformed(offset=(25, 20, 2)).circle(12).circle(8).extrude(16)

# 4. 探路火星车底盘轮廓
rover = cq.Workplane("XY").transformed(offset=(15, -20, 2)).box(22, 16, 8)

part = terrain.union(base_station).union(lander).union(rover)
`,
    hint: "所有建筑和车辆的 Z 轴起始位置设为 offset=(..., ..., 2)，正好精准坐落在厚度为 4mm (Z范围 -2~+2) 的地表上。",
    karpathyNote: "从单个零件到全要素场景大合影，构建的过程就是认知的飞跃。每一行代码都在讲述你的火星拓荒故事。",
  },
  {
    id: "mars-l14",
    stage: "阶段四：场景大总装",
    title: "L14: 纯净代码 100% 审计与水密实体封包",
    subtitle: "March of Nines 极客精神与精密水密法兰",
    level: "L14",
    tagColor: "text-purple-400 border-purple-500/30 bg-purple-500/10",
    goalDescription:
      "贯彻 Karpathy 'March of Nines' (向 99.999% 可靠性进军) 精神：消除孤儿积木，严格规范尺寸链，加工 40×40mm 水密基座，倒圆角消除应力集中，并在四角精密切削沉头安装孔。",
    learningPoints: [
      "水密实体 (Watertight Solid) 概念与 3D 打印无缝切片要求",
      "顶点选择器辅助孔加工：.vertices().hole()",
      "高可靠性工程代码审查规范",
    ],
    checkpoints: [
      { text: "基座边角倒圆角 (fillet)", regex: /\.fillet\s*\(/ },
      { text: "顶面中心孔切削 (hole)", regex: /\.hole\s*\(/ },
      { text: "四角安装孔批量阵列 (vertices().hole())", regex: /\.vertices\s*\(.*\.hole\s*\(/ },
    ],
    starterCode: `import cadquery as cq

# 1. 规范水密基座并执行竖直边倒角
base = (
    cq.Workplane("XY")
    .box(40, 40, 10)
    .edges("|Z")
    .fillet(5)
    .faces(">Z")
    .circle(12)
    .extrude(15)
)

# 2. 挑战：在顶面加工深 20mm 直径 16mm 孔，并在底面加工 4 颗直径 3.5mm 的螺栓孔
# base = base.faces(">Z").hole(16, depth=20)
# base = base.faces("<Z").workplane().rect(30, 30, forConstruction=True).vertices().hole(3.5)

part = base
`,
    solutionCode: `import cadquery as cq

# 规范工业级水密气闸基座实体 (Watertight Solid)
base = (
    cq.Workplane("XY")
    .box(40, 40, 10)
    .edges("|Z")
    .fillet(5)
    .faces(">Z")
    .circle(12)
    .extrude(15)
)

# 内部精细通孔切削与 4 角安装孔
base = base.faces(">Z").hole(16, depth=20)
base = (
    base.faces("<Z")
    .workplane()
    .rect(30, 30, forConstruction=True)
    .vertices()
    .hole(3.5)
)

part = base
`,
    hint: "rect(30, 30, forConstruction=True).vertices().hole(3.5) 是 CadQuery 的精髓语法，一行代码精准在矩形四顶点开孔。",
    karpathyNote: "从 90% 的原型走到 99.999% 的工程落地，关键就在于消灭伪通过、消除应力集中、确保每一个尺寸水密无瑕疵。",
  },
  {
    id: "mars-l15",
    stage: "阶段四：场景大总装",
    title: "L15: 航天创客白皮书与 3D 几何工程图纸",
    subtitle: "阶梯精密传动轴与标准动力键槽切削",
    level: "L15",
    tagColor: "text-purple-400 border-purple-500/30 bg-purple-500/10",
    goalDescription:
      "为省级竞赛官方工程白皮书提供规范图纸：构建三级阶梯精密传动主轴与轴承定位轴肩，并使用布尔切削精密加工标准动力传递键槽。",
    learningPoints: [
      "基于局部特征面级联拉伸多级阶梯轴 (.faces('>Z').circle(...).extrude(...))",
      "机械传动标准平键槽的几何铣削与配合公差",
      "满足工业 CAD 规范的工程实体建模",
    ],
    checkpoints: [
      { text: "多级阶梯轴级联拉伸 (faces('>Z'))", regex: /\.faces\s*\(\s*['"]>Z['"]\s*\)/ },
      { text: "标准键槽长方体切削 (cut)", regex: /\.cut\s*\(/ },
      { text: "规范轴肩与轴段", regex: /extrude/ },
    ],
    starterCode: `import cadquery as cq

# 1. 建立三级阶梯传动主轴
shaft = (
    cq.Workplane("XY")
    .circle(12).extrude(15)
    .faces(">Z").circle(8).extrude(25)
    .faces(">Z").circle(5).extrude(15)
)

# 2. 挑战：在第二级轴段侧面切削一个动力平键槽 (box 4x18x2.5)
# keyway = cq.Workplane("YZ").transformed(offset=(0, 25, 0)).box(4, 18, 2.5)
# shaft = shaft.cut(keyway)

part = shaft
`,
    solutionCode: `import cadquery as cq

# 阶梯传动主轴与多级轴承位
shaft = (
    cq.Workplane("XY")
    .circle(12).extrude(15)
    .faces(">Z").circle(8).extrude(25)
    .faces(">Z").circle(5).extrude(15)
)

# 键槽铣削
keyway = cq.Workplane("YZ").transformed(offset=(0, 25, 0)).box(4, 18, 2.5)
shaft = shaft.cut(keyway)

part = shaft
`,
    hint: "在连续调用 .faces('>Z').circle().extrude() 时，每次拉伸都会自动在最新的最高表面建立工作面，非常直观。",
    karpathyNote: "真正的发明家不仅能写出代码，还能输出规范的工程白皮书和图纸。严谨的阶梯轴承位是机械工程的通用名片。",
  },
  {
    id: "mars-l16",
    stage: "阶段四：场景大总装",
    title: "L16: 模拟答辩与 STL/STEP 全格式参赛封包",
    subtitle: "火星拓荒者荣誉勋章与矢量喷口终极交付",
    level: "L16",
    tagColor: "text-purple-400 border-purple-500/30 bg-purple-500/10",
    goalDescription:
      "学期收官荣誉之战：雕刻火星拓荒者八角荣誉勋章底座，装配同心圆环与中央核心星，贯通矢量反推孔，完成参赛源包、STL 打印与 STEP 工业实体的全格式封包！",
    learningPoints: [
      "多边形徽章与多重几何特征艺术美学表达",
      "全格式交付（STEP 实体几何 + STL 三角网格）",
      "从构想、草图、切削到工程成果闭环交付",
    ],
    checkpoints: [
      { text: "八边形勋章基座 (polygon(8))", regex: /\.polygon\s*\(\s*8/ },
      { text: "荣誉外环与核心星熔合 (union)", regex: /\.union\s*\(/ },
      { text: "中央矢量通道切削贯通 (cut)", regex: /\.cut\s*\(/ },
    ],
    starterCode: `import cadquery as cq

# 1. 八角先锋荣誉勋章基座
medal_base = cq.Workplane("XY").polygon(8, 28).extrude(5)

# 2. 挑战：装配荣誉外环、核心三角星并切出中央喷管通道
# ring = cq.Workplane("XY").transformed(offset=(0, 0, 5)).circle(24).circle(20).extrude(3)
# core_star = cq.Workplane("XY").transformed(offset=(0, 0, 5)).polygon(3, 14).extrude(4)
# nozzle_cut = cq.Workplane("XY").circle(6).extrude(12)
# part = medal_base.union(ring).union(core_star).cut(nozzle_cut)

part = medal_base
`,
    solutionCode: `import cadquery as cq

# 火星拓荒者计划 · 先锋荣誉总装勋章与火箭矢量喷口
medal_base = cq.Workplane("XY").polygon(8, 28).extrude(5)
ring = cq.Workplane("XY").transformed(offset=(0, 0, 5)).circle(24).circle(20).extrude(3)
core_star = cq.Workplane("XY").transformed(offset=(0, 0, 5)).polygon(3, 14).extrude(4)
nozzle_cut = cq.Workplane("XY").circle(6).extrude(12)

part = medal_base.union(ring).union(core_star).cut(nozzle_cut)
`,
    hint: "polygon(3, 14) 生成正三角形，配合 polygon(8, 28) 的八角底座与同心环，呈现极具未来科技感的航天勋章总成。",
    karpathyNote: "恭喜你完成了全部 16 关火星拓荒者挑战！从第一行代码到全套物理实体，你已经掌握了用代码创造三维物理世界的全部钥匙。",
  },
];
