/**
 * 学习挑战关卡定义 (Missions)
 * 涵盖火星拓荒者计划 · 启蒙组 (Lesson 01 - 16) 全量工程案例
 * 全面迁移至 build123d 现代建造者 (Context Builder) 语法体系
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
      "以 3D 坐标原点为基准，使用 build123d 的 BuildPart 与 BuildSketch 在 XZ 平面构建闭合多段线截面，利用回转操作 (revolve) 构建钝头防热大底，并在顶部熔合抗冲刷阶梯法兰圈。",
    learningPoints: [
      "理解 3D 空间基准坐标系与 XZ 平面回转体成型 (revolve)",
      "使用 BuildSketch 与 Polyline 构建闭合截面草图",
      "使用 Locations 空间定位并在顶部构建法兰圈",
    ],
    checkpoints: [
      { text: "选择 XZ 投影基准面 (Plane.XZ)", regex: /Plane\.XZ/ },
      { text: "构建截面轮廓 (BuildSketch / Polyline)", regex: /(BuildSketch|Polyline)/ },
      { text: "旋转 360 度成型 (revolve)", regex: /revolve/ },
      { text: "顶部加固法兰圈 (Cylinder / Hole)", regex: /(Cylinder|Hole)/ },
    ],
    starterCode: `from build123d import *

# Task 1: 在 XZ 平面绘制钝头大底截面轮廓并旋转 360 度
with BuildPart() as part:
    with BuildSketch(Plane.XZ) as sk:
        with BuildLine() as ln:
            Polyline([(0, 0), (30, 0), (28, 5), (20, 15), (0, 15), (0, 0)])
        make_face()
    revolve(axis=Axis.Z, revolution_arc=360)

    # Task 2: 挑战：在顶部添加加固阶梯法兰 (外径23，内径19，高3)
    # 提示: with Locations((0, 0, 16.5)):
    #           Cylinder(radius=23, height=3)
    #           Hole(radius=19, depth=3)
`,
    solutionCode: `from build123d import *

# 1. 建立基础防热大底（倒圆锥台：底大顶小）
with BuildPart() as part:
    with BuildSketch(Plane.XZ) as sk:
        with BuildLine() as ln:
            Polyline([(0, 0), (30, 0), (28, 5), (20, 15), (0, 15), (0, 0)])
        make_face()
    revolve(axis=Axis.Z, revolution_arc=360)

    # 2. 顶部法兰圈加固外环与中心孔
    with Locations((0, 0, 16.5)):
        Cylinder(radius=23, height=3)
        Hole(radius=19, depth=3)
`,
    hint: "在 XZ 平面上构造草图闭合多段线并 make_face()，绕 Axis.Z 旋转 360 度即成型大底；再在 Z=15 处放置加固圆柱法兰与通孔。",
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
      "在大底上方装配乘员生活舱实心圆柱外柱，使用布尔差集 (Mode.SUBTRACT) 掏出壁厚 3mm 的安全加压内腔，并在侧壁切削打通观察火星地表的观景舷窗。",
    learningPoints: [
      "布尔差集 (Mode.SUBTRACT) 的物理本质：材料去除与内腔生成",
      "精确壁厚控制（外径 20mm，内径 17mm，留出 3mm 辐射防护壁）",
      "跨坐标系几何切削（在 YZ 侧平面切削舷窗）",
    ],
    checkpoints: [
      { text: "构建实心加压主舱 (Cylinder)", regex: /Cylinder\s*\(/ },
      { text: "布尔差集掏空内腔 (Mode.SUBTRACT)", regex: /Mode\.SUBTRACT/ },
      { text: "侧向观景舷窗打通 (Plane.YZ / Circle)", regex: /(Plane\.YZ|Circle)/ },
    ],
    starterCode: `from build123d import *

with BuildPart() as part:
    # 1. 乘员舱实心外壳 (半径20，高度40)
    Cylinder(radius=20, height=40)

    # 2. 挑战：使用内切圆柱差集掏空内腔 (壁厚3mm: 半径17，抬升3mm)
    # with Locations((0, 0, 3)):
    #     Cylinder(radius=17, height=38, mode=Mode.SUBTRACT)

    # 3. 挑战：在 YZ 侧面切削一个半径 6mm 的舷窗
    # with BuildSketch(Plane.YZ) as sk:
    #     with Locations((0, 5)):
    #         Circle(radius=6)
    # extrude(amount=50, both=True, mode=Mode.SUBTRACT)
`,
    solutionCode: `from build123d import *

with BuildPart() as part:
    # 1. 乘员舱外壳
    Cylinder(radius=20, height=40)

    # 2. 内腔掏空（壁厚 3mm，底部保留 3mm 防冲击大底）
    with Locations((0, 0, 3)):
        Cylinder(radius=17, height=38, mode=Mode.SUBTRACT)

    # 3. 侧向观景舷窗切削
    with BuildSketch(Plane.YZ) as sk:
        with Locations((0, 5)):
            Circle(radius=6)
    extrude(amount=50, both=True, mode=Mode.SUBTRACT)
`,
    hint: "掏空时内腔圆柱的底部通过 Locations((0, 0, 3)) 抬高 3mm，可保留结实防冲撞的大底厚度；侧向在 Plane.YZ 投影拉伸即可切穿舷窗。",
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
      "在舱体外壁通过循环阵列 (for 循环结合 Locations) 批量生成 5 层等距百叶窗式辐射散热肋片，与主舱体外壳牢固熔合，形成全向热循环架构。",
    learningPoints: [
      "算法化参数化建模思维：用循环代替手动重复复制",
      "Z 轴坐标动态偏移计算：with Locations((0, 0, z))",
      "环形薄片与主体布尔并集自动熔合",
    ],
    checkpoints: [
      { text: "建立主加压舱外壁 (Cylinder)", regex: /Cylinder/ },
      { text: "使用循环阵列 (for ... range)", regex: /for\s+\w+\s+in\s+range/ },
      { text: "循环生成多层肋片并定位 (Locations)", regex: /Locations/ },
    ],
    starterCode: `from build123d import *

with BuildPart() as part:
    # 1. 基础主舱体
    Cylinder(radius=20, height=40)

    # 2. 挑战：使用 for 循环生成 5 层环形散热肋片 (半径23，厚度2) 与主舱熔合
    # 提示:
    # for i in range(5):
    #     z = -12 + i * 6
    #     with Locations((0, 0, z)):
    #         Cylinder(radius=23, height=2)
`,
    solutionCode: `from build123d import *

with BuildPart() as part:
    # 1. 基础舱体
    Cylinder(radius=20, height=40)

    # 2. 循环生成 5 层环形散热肋片
    for i in range(5):
        z = -12 + i * 6
        with Locations((0, 0, z)):
            Cylinder(radius=23, height=2)
`,
    hint: "主舱外径 20，肋片外径 23 突出 3mm 作为散热翅片，通过 8 + i * 6 沿高度等间距分布，在 BuildPart 上下文中将自动熔合。",
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
      "构建底部反推推进盘，使用放样 (BuildSketch + loft) 构建单个脉冲姿控喷嘴，并通过 build123d 极坐标定位器 (PolarLocations) 将 8 个喷嘴均布在 360° 圆周上，完成阶段一全要素总装！",
    learningPoints: [
      "空间放样 (loft)：通过两组不同截面圆生成收敛喷管",
      "极坐标阵列 (PolarLocations)：优雅实现周向等分",
      "多体特征批量总装与着陆姿控动力学理解",
    ],
    checkpoints: [
      { text: "推进器安装底座 (Cylinder)", regex: /Cylinder/ },
      { text: "8 个等分喷嘴极坐标阵列 (PolarLocations)", regex: /PolarLocations/ },
      { text: "双截面草图放样喷嘴 (BuildSketch / loft)", regex: /(BuildSketch|loft)/ },
    ],
    starterCode: `from build123d import *

with BuildPart() as part:
    # 1. 推进器安装底座
    Cylinder(radius=22, height=10)

    # 2. 挑战：使用 PolarLocations 在半径 16mm 的圆周上生成 8 个姿控反推喷嘴
    # 提示:
    # with Locations((0, 0, -5)):
    #     with PolarLocations(radius=16, count=8):
    #         with BuildSketch(Plane.XY) as s1:
    #             Circle(radius=3.5)
    #         with BuildSketch(Plane.XY.offset(-6)) as s2:
    #             Circle(radius=1.8)
    #         loft()
`,
    solutionCode: `from build123d import *

with BuildPart() as part:
    # 1. 舱体底座
    Cylinder(radius=22, height=10)

    # 2. 8 喷嘴环形极坐标阵列
    with Locations((0, 0, -5)):
        with PolarLocations(radius=16, count=8):
            with BuildSketch(Plane.XY) as s1:
                Circle(radius=3.5)
            with BuildSketch(Plane.XY.offset(-6)) as s2:
                Circle(radius=1.8)
            loft()
`,
    hint: "PolarLocations(radius=16, count=8) 会自动在 360 度周向上均布 8 个局部坐标系，在其子作用域下执行 loft() 即一键生成 8 颗喷管。",
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
      "构建火星车 50×36×18mm 主密封仪器舱，对外立边执行倒圆角 (fillet) 消除应力集中，并在两侧装配展开式太阳能电池翼板与前部双目测候相机桅杆。",
    learningPoints: [
      "箱体造型与 B-Rep 选择器 part.edges().filter_by(Axis.Z) 倒角",
      "两侧空间对称翼板装配",
      "全景感知立柱桅杆的多构件装配",
    ],
    checkpoints: [
      { text: "建立主仪器箱体 (Box)", regex: /Box/ },
      { text: "立棱倒圆角 (fillet)", regex: /fillet/ },
      { text: "两侧太阳能翼板与立柱 (Locations)", regex: /Locations/ },
    ],
    starterCode: `from build123d import *

with BuildPart() as part:
    # 1. 主仪器舱箱体并执行竖直边倒圆角
    Box(50, 36, 18)
    fillet(part.edges().filter_by(Axis.Z), radius=3.0)

    # 2. 挑战：在两侧添加展开式太阳能翼板 (46x12x2) 以及前部双目相机桅杆
    # with Locations((0, 24, 6)):
    #     Box(46, 12, 2)
    # with Locations((0, -24, 6)):
    #     Box(46, 12, 2)
    # with Locations((18, 0, 19)):
    #     Cylinder(radius=2.5, height=20)
    # with Locations((18, 0, 32)):
    #     Box(8, 16, 6)
`,
    solutionCode: `from build123d import *

with BuildPart() as part:
    # 1. 主仪器舱 (倒角抗冲击箱体)
    Box(50, 36, 18)
    fillet(part.edges().filter_by(Axis.Z), radius=3.0)

    # 2. 左右两侧太阳能电池翼板
    with Locations((0, 24, 6)):
        Box(46, 12, 2)
    with Locations((0, -24, 6)):
        Box(46, 12, 2)

    # 3. 前方双目相机桅杆与探头
    with Locations((18, 0, 19)):
        Cylinder(radius=2.5, height=20)
    with Locations((18, 0, 32)):
        Box(8, 16, 6)
`,
    hint: "使用 part.edges().filter_by(Axis.Z) 可以精准捕获平行于 Z 轴的 4 条立棱，fillet(3.0) 会把直角变成平滑抗撞的弧面。",
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
      "针对火星极细沙尘暴地形，参数化构建直径 36mm、带中心传动轴孔的轮毂，并用极坐标 (PolarLocations) 在轮缘均布 12 颗防滑抓地齿爪。",
    learningPoints: [
      "横置车轮基准面选择 (Plane.YZ 横向拉伸)",
      "轮毂中心轴孔同心圆切削 (Mode.SUBTRACT)",
      "利用 PolarLocations 极坐标阵列生成防滑抓地齿",
    ],
    checkpoints: [
      { text: "YZ 平面生成轮体 (Plane.YZ)", regex: /Plane\.YZ/ },
      { text: "同心圆轴孔拉伸 (Circle / SUBTRACT / Hole)", regex: /(Circle|Hole|SUBTRACT)/ },
      { text: "12 齿极坐标阵列 (PolarLocations(..., count=12))", regex: /PolarLocations/ },
    ],
    starterCode: `from build123d import *

with BuildPart() as part:
    # 1. 建立轮毂基体与中心轴孔 (外径18，轴孔4，宽度14)
    Cylinder(radius=18, height=14)
    Hole(radius=4, depth=14)

    # 2. 挑战：使用 PolarLocations 均布 12 颗越野防滑爪齿 (2.5x3.5x14)
    # with PolarLocations(radius=17.5, count=12):
    #     Box(2.5, 3.5, 14)
`,
    solutionCode: `from build123d import *

with BuildPart() as part:
    # 1. 轮毂基体与中心轴孔
    Cylinder(radius=18, height=14)
    Hole(radius=4, depth=14)

    # 2. 12 齿外轮廓越野防滑爪
    with PolarLocations(radius=17.5, count=12):
        Box(2.5, 3.5, 14)
`,
    hint: "轮子截面在 Plane.YZ 平面上沿 X 轴拉伸 14mm，齿爪在中心 X=7 处通过 PolarLocations 绕轮心均匀环绕分布。",
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
      "利用 Polyline 构建三角传动骨架",
      "利用 GridLocations / Locations 实现多轮位空间对称装配",
    ],
    checkpoints: [
      { text: "建立中心差速横梁 (Box)", regex: /Box/ },
      { text: "摇臂骨架连杆折线 (Polyline)", regex: /Polyline/ },
      { text: "对称摇臂与轮轴枢纽座 (Locations / GridLocations)", regex: /(Locations|GridLocations)/ },
    ],
    starterCode: `from build123d import *

with BuildPart() as part:
    # 1. 中心差速主横梁
    Box(12, 48, 6)

    # 2. 挑战：构建左右摇臂骨架与 6 轮安装枢纽柱
    # for y_pos in [24, -28]:
    #     with BuildSketch(Plane.XZ.offset(y_pos)):
    #         with BuildLine():
    #             Polyline([(-24, -8), (-24, -4), (0, 4), (24, -4), (24, -8), (0, 0), (-24, -8)])
    #         make_face()
    #     extrude(amount=4)
    # for x_pos in [-24, 0, 24]:
    #     for y_pos in [-26, 26]:
    #         with Locations((x_pos, y_pos, -6)):
    #             Cylinder(radius=4.5, height=8)
`,
    solutionCode: `from build123d import *

with BuildPart() as part:
    # 1. 中心差速主横梁
    Box(12, 48, 6)

    # 2. 左右两侧主副摇臂 (Rocker-Bogie)
    for y_pos in [24, -28]:
        with BuildSketch(Plane.XZ.offset(y_pos)):
            with BuildLine():
                Polyline([(-24, -8), (-24, -4), (0, 4), (24, -4), (24, -8), (0, 0), (-24, -8)])
            make_face()
        extrude(amount=4)

    # 3. 6 轮安装枢纽座
    for x_pos in [-24, 0, 24]:
        for y_pos in [-26, 26]:
            with Locations((x_pos, y_pos, -6)):
                Cylinder(radius=4.5, height=8)
`,
    hint: "使用 GridLocations(48, 54, 2, 2) 可以一键在 48x54mm 的 4 个对称角点上批量生成轮轴枢纽柱。",
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
      "为火星车打造地质取样前锋：构建回转底座、两段不同俯仰角伸缩悬臂，并在末端安装薄壁抽壳 (offset) 的采样铲斗，完成漫游车系统大总装！",
    learningPoints: [
      "机械臂的正运动学空间几何姿态表达 (Locations 级联平移与旋转)",
      "薄壁抽壳操作 (offset(amount=-1.5, ...)) 打造铲斗内腔",
      "多自由度机器人的层级装配结构",
    ],
    checkpoints: [
      { text: "回转云台底座 (Cylinder)", regex: /Cylinder/ },
      { text: "悬臂姿态变换 (Locations)", regex: /Locations/ },
      { text: "末端铲斗内腔薄壁抽壳 (offset)", regex: /offset/ },
    ],
    starterCode: `from build123d import *

with BuildPart() as part:
    # 1. 机械臂回转基座
    Cylinder(radius=8, height=6)

    # 2. 挑战：添加大臂、肘关节、前伸小臂与末端取样铲斗
    # with Locations((0, 0, 16)):
    #     Box(6, 6, 26)
    # with Locations((0, 0, 29)):
    #     Cylinder(radius=4.5, height=8)
    # with Locations((11, 0, 29)):
    #     Box(22, 5, 5)
    # with Locations((22, 0, 27)):
    #     Cylinder(radius=3.5, height=7)
    # with Locations((28, 0, 25)):
    #     Box(12, 14, 8)
    # with Locations((28, 0, 26)):
    #     Box(9, 11, 8, mode=Mode.SUBTRACT)
`,
    solutionCode: `from build123d import *

with BuildPart() as part:
    # 1. 回转云台底座
    Cylinder(radius=8, height=6)

    # 2. 垂直大臂
    with Locations((0, 0, 16)):
        Box(6, 6, 26)

    # 3. 肘关节枢纽
    with Locations((0, 0, 29)):
        Cylinder(radius=4.5, height=8)

    # 4. 前伸小臂
    with Locations((11, 0, 29)):
        Box(22, 5, 5)

    # 5. 腕部关节
    with Locations((22, 0, 27)):
        Cylinder(radius=3.5, height=7)

    # 6. 末端土壤采样铲斗 (与小臂末端连接并掏空内腔)
    with Locations((28, 0, 25)):
        Box(12, 14, 8)
    with Locations((28, 0, 26)):
        Box(9, 11, 8, mode=Mode.SUBTRACT)
`,
    hint: "通过 offset(amount=-1.5, openings=part.faces().sort_by(Axis.Z)[-1]) 可以自动把实心长方体顶部开口并向内掏空 1.5mm，瞬间形成结实的铲斗结构！",
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
      "空间半球生成 (Sphere 结合 split(keep=Keep.TOP))",
      "同心半球布尔差集打造双层保护穹壳",
      "环形地基圈梁与天窗综合采光工程",
    ],
    checkpoints: [
      { text: "半球形主穹顶成型 (Sphere / split)", regex: /(Sphere.*split|split.*Sphere)/ },
      { text: "布尔差集掏空中空层 (Mode.SUBTRACT)", regex: /Mode\.SUBTRACT/ },
      { text: "地基加固与顶部采光天窗 (Cylinder)", regex: /Cylinder/ },
    ],
    starterCode: `from build123d import *

with BuildPart() as part:
    # 1. 外层防尘主穹顶 (半径36的半球)
    Sphere(radius=36)
    split(bisect_by=Plane.XY, keep=Keep.TOP)

    # 2. 挑战：使用半径 32 的内半球差集掏出中空夹层，并添加地基圈梁和顶部采光天窗
    # Sphere(radius=32, mode=Mode.SUBTRACT)
    # with Locations((0, 0, 2)):
    #     Cylinder(radius=37, height=4)
    #     Hole(radius=31, depth=4)
    # with Locations((0, 0, 35)):
    #     Cylinder(radius=10, height=3)
    #     Hole(radius=6, depth=3)
`,
    solutionCode: `from build123d import *

with BuildPart() as part:
    # 1. 外层防尘主穹顶 (半球)
    Sphere(radius=36)
    split(bisect_by=Plane.XY, keep=Keep.TOP)

    # 2. 内层生活加压空间 (差集掏空，形成厚度 4mm 防护壁)
    Sphere(radius=32, mode=Mode.SUBTRACT)

    # 3. 环形地基圈梁加固
    with Locations((0, 0, 2)):
        Cylinder(radius=37, height=4)
        Hole(radius=31, depth=4)

    # 4. 顶部高通量采光天窗
    with Locations((0, 0, 35)):
        Cylinder(radius=10, height=3)
        Hole(radius=6, depth=3)
`,
    hint: "split(bisect_by=Plane.XY, keep=Keep.TOP) 会以 XY 平面对球体一刀切削，只保留上半球，非常适合快速构造大型建筑穹顶。",
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
      "横向贯通生命走廊中空截面拉伸 (BuildSketch + extrude)",
      "多舱室平移对接 (Locations)",
      "双向互锁密封法兰装配",
    ],
    checkpoints: [
      { text: "生命廊桥通道截面 (BuildSketch / extrude)", regex: /(BuildSketch|extrude)/ },
      { text: "均压过渡圆筒舱 (Locations / Cylinder)", regex: /(Locations|Cylinder)/ },
      { text: "气动密封法兰总成 (Hole / Cylinder)", regex: /(Hole|Cylinder)/ },
    ],
    starterCode: `from build123d import *

with BuildPart() as part:
    # 1. 贯通生命廊桥 (连接主穹顶的中空走廊)
    with BuildSketch(Plane.YZ) as sk:
        Rectangle(16, 18)
        Circle(radius=6, mode=Mode.SUBTRACT)
    extrude(amount=36)

    # 2. 挑战：在廊桥外侧对接均压过渡圆筒舱与密封门
    # with Locations((36, 0, 0)):
    #     Cylinder(radius=14, height=24)
    # with Locations((36, 0, 13)):
    #     Cylinder(radius=16, height=2)
    #     Hole(radius=10, depth=2)
`,
    solutionCode: `from build123d import *

with BuildPart() as part:
    # 1. 贯通生命廊桥 (连接主穹顶的通道)
    with BuildSketch(Plane.YZ) as sk:
        Rectangle(16, 18)
        Circle(radius=6, mode=Mode.SUBTRACT)
    extrude(amount=36)

    # 2. 均压过渡气闸舱体
    with Locations((36, 0, 0)):
        Cylinder(radius=14, height=24)

    # 3. 双向外舱门气动密封法兰环
    with Locations((36, 0, 13)):
        Cylinder(radius=16, height=2)
        Hole(radius=10, depth=2)
`,
    hint: "注意各个构件的坐标平移 Locations((0, 36, ...))，确保气闸室精准贴在廊桥的末端开口处，形成无缝对接。",
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
      "空间姿态变换与平移复合",
      "多联式压力容器安全阵列",
    ],
    checkpoints: [
      { text: "中央立柱主干 (Cylinder)", regex: /Cylinder/ },
      { text: "5 层 60° 螺旋托盘循环 (for ... 60)", regex: /(for|60)/ },
      { text: "三联高压储气罐组装 (Locations)", regex: /Locations/ },
    ],
    starterCode: `from build123d import *

with BuildPart() as part:
    # 1. 中央生态循环水柱
    Cylinder(radius=5, height=50)

    # 2. 挑战：使用 for 循环按 60° 步进生成 5 层错位展开水培托盘，并添加储氧罐
    # for i in range(5):
    #     angle = i * 60
    #     z = -18 + i * 9
    #     with Locations(Location((0, 0, z), (0, 0, angle))):
    #         with Locations((12, 0, 0)):
    #             Box(16, 12, 3)
    # with Locations((-12, 0, -18)):
    #     Box(16, 16, 4)
    # with Locations((-16, 0, -5)):
    #     Cylinder(radius=4, height=30)
    # with Locations((-20, 6, -7)):
    #     Cylinder(radius=3.5, height=26)
    # with Locations((-20, -6, -7)):
    #     Cylinder(radius=3.5, height=26)
`,
    solutionCode: `from build123d import *

with BuildPart() as part:
    # 1. 中央生态循环水柱
    Cylinder(radius=5, height=50)

    # 2. 5 层 60 度交错空间螺旋水培托盘
    for i in range(5):
        angle = i * 60
        z = -18 + i * 9
        with Locations(Location((0, 0, z), (0, 0, angle))):
            with Locations((12, 0, 0)):
                Box(16, 12, 3)

    # 3. 储罐固定安装基板与三联高压储罐
    with Locations((-12, 0, -18)):
        Box(16, 16, 4)
    with Locations((-16, 0, -5)):
        Cylinder(radius=4, height=30)
    with Locations((-20, 6, -7)):
        Cylinder(radius=3.5, height=26)
    with Locations((-20, -6, -7)):
        Cylinder(radius=3.5, height=26)
`,
    hint: "螺旋托盘通过在循环中更新高度 z 与悬臂偏移，非常优雅高效地构建出向外辐射的光伏采光托盘。",
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
      "多边形特征造型 (RegularPolygon(radius, side_count=6))",
      "复杂系统跨尺度大部件总装思维",
      "航天基地原位利用 (ISRU) 工程概念落地",
    ],
    checkpoints: [
      { text: "生活主穹顶 (Sphere / split)", regex: /(Sphere|split)/ },
      { text: "正六边形功能舱 (RegularPolygon)", regex: /RegularPolygon/ },
      { text: "能源微电网顶盖与廊桥 (extrude / Cylinder)", regex: /(extrude|Cylinder)/ },
    ],
    starterCode: `from build123d import *

with BuildPart() as part:
    # 1. 核心生活主舱半球
    Sphere(radius=25)
    split(bisect_by=Plane.XY, keep=Keep.TOP)

    # 2. 挑战：添加连接走廊、正六边形科研能源舱 (RegularPolygon 6) 与微电网顶盖
    # with BuildSketch(Plane.YZ) as sk:
    #     with Locations((0, 5)):
    #         Circle(radius=5)
    # extrude(amount=40)
    # with BuildSketch() as sk2:
    #     with Locations((40, 0)):
    #         RegularPolygon(radius=18, side_count=6)
    # extrude(amount=16)
    # with Locations((40, 0, 17)):
    #     Cylinder(radius=14, height=2)
`,
    solutionCode: `from build123d import *

with BuildPart() as part:
    # 1. 核心生活主舱
    Sphere(radius=25)
    split(bisect_by=Plane.XY, keep=Keep.TOP)

    # 2. 联络通道廊桥
    with BuildSketch(Plane.YZ) as sk:
        with Locations((0, 5)):
            Circle(radius=5)
    extrude(amount=40)

    # 3. 创新能源科研舱 (正六边形棱柱)
    with BuildSketch() as sk2:
        with Locations((40, 0)):
            RegularPolygon(radius=18, side_count=6)
    extrude(amount=16)

    # 4. 太阳能微电网塔顶
    with Locations((40, 0, 17)):
        Cylinder(radius=14, height=2)
`,
    hint: "RegularPolygon(radius=18, side_count=6) 会生成外接圆半径为 18mm 的标准正六边形，相比圆柱更具蜂巢扩展和模块化拼接优势。",
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
      { text: "火星地表地台构建 (Box)", regex: /Box/ },
      { text: "基地主穹顶空间定位 (Locations)", regex: /Locations/ },
      { text: "漫游车与着陆舱全景 (Sphere / Cylinder)", regex: /(Sphere|Cylinder)/ },
    ],
    starterCode: `from build123d import *

with BuildPart() as part:
    # 1. 模拟火星地表地台 (100x80x4)
    Box(100, 80, 4)

    # 2. 挑战：在指定坐标装配基地主穹顶、着陆舱与探路火星车
    # with Locations((-20, 0, 2)):
    #     Sphere(radius=18)
    #     split(bisect_by=Plane.XY, keep=Keep.TOP)
    # with Locations((25, 20, 10)):
    #     Cylinder(radius=12, height=16)
    #     Hole(radius=8, depth=16)
    # with Locations((15, -20, 6)):
    #     Box(22, 16, 8)
`,
    solutionCode: `from build123d import *

with BuildPart() as part:
    # 1. 模拟火星地表地台
    Box(100, 80, 4)

    # 2. 基地主穹顶建筑群
    with Locations((-20, 0, 2)):
        Sphere(radius=18)
        split(bisect_by=Plane.XY, keep=Keep.TOP)

    # 3. 着陆先锋舱
    with Locations((25, 20, 10)):
        Cylinder(radius=12, height=16)
        Hole(radius=8, depth=16)

    # 4. 探路火星车底盘轮廓
    with Locations((15, -20, 6)):
        Box(22, 16, 8)
`,
    hint: "所有建筑和车辆的 Z 轴起始位置设为 Locations((..., ..., 2))，正好精准坐落在厚度为 4mm (Z范围 -2~+2) 的地表之上。",
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
      "贯彻 Karpathy 'March of Nines' (向 99.999% 可靠性进军) 精神：严格规范尺寸链，加工 40×40mm 水密基座，倒圆角消除应力集中，并在四角精密切削沉头安装孔。",
    learningPoints: [
      "水密实体 (Watertight Solid) 概念与 3D 打印无缝切片要求",
      "利用 GridLocations 与 Hole 进行四角沉头孔阵列加工",
      "高可靠性工程代码审查规范",
    ],
    checkpoints: [
      { text: "基座边角倒圆角 (fillet)", regex: /fillet/ },
      { text: "顶面中心孔切削 (Hole)", regex: /Hole/ },
      { text: "四角安装孔批量阵列 (GridLocations)", regex: /GridLocations/ },
    ],
    starterCode: `from build123d import *

with BuildPart() as part:
    # 1. 规范水密基座并执行竖直边倒角
    Box(40, 40, 10)
    fillet(part.edges().filter_by(Axis.Z), radius=5.0)

    # 2. 挑战：在顶面添加立柱，并加工中心通孔与四角安装孔
    # with Locations((0, 0, 12.5)):
    #     Cylinder(radius=12, height=15)
    # Hole(radius=8, depth=25)
    # with GridLocations(30, 30, 2, 2):
    #     Hole(radius=1.75, depth=10)
`,
    solutionCode: `from build123d import *

with BuildPart() as part:
    # 1. 规范工业级水密气闸基座实体 (Watertight Solid)
    Box(40, 40, 10)
    fillet(part.edges().filter_by(Axis.Z), radius=5.0)

    # 2. 顶面立柱
    with Locations((0, 0, 12.5)):
        Cylinder(radius=12, height=15)

    # 3. 内部中心通孔与 4 角安装孔
    Hole(radius=8, depth=25)
    with GridLocations(30, 30, 2, 2):
        Hole(radius=1.75, depth=10)
`,
    hint: "GridLocations(30, 30, 2, 2) 结合 Hole(radius=1.75, depth=10) 是 build123d 最精髓的阵列开孔语法，一行代码精准在矩形四顶点打孔。",
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
      "基于局部坐标级联堆叠多级阶梯轴 (Locations + Cylinder)",
      "机械传动标准平键槽的几何铣削与配合公差 (Mode.SUBTRACT)",
      "满足工业 CAD 规范的工程实体建模",
    ],
    checkpoints: [
      { text: "多级阶梯轴段级联构建 (Cylinder)", regex: /Cylinder/ },
      { text: "标准键槽长方体切削 (Mode.SUBTRACT)", regex: /Mode\.SUBTRACT/ },
      { text: "规范轴肩与轴段 (Locations)", regex: /Locations/ },
    ],
    starterCode: `from build123d import *

with BuildPart() as part:
    # 1. 建立三级阶梯传动主轴
    with Locations((0, 0, 7.5)):
        Cylinder(radius=12, height=15)
    with Locations((0, 0, 27.5)):
        Cylinder(radius=8, height=25)
    with Locations((0, 0, 47.5)):
        Cylinder(radius=5, height=15)

    # 2. 挑战：在第二级轴段侧面切削一个动力平键槽 (box 4x3x18)
    # with Locations((0, 8, 27.5)):
    #     Box(4, 3, 18, mode=Mode.SUBTRACT)
`,
    solutionCode: `from build123d import *

with BuildPart() as part:
    # 1. 阶梯传动主轴与多级轴承位
    with Locations((0, 0, 7.5)):
        Cylinder(radius=12, height=15)
    with Locations((0, 0, 27.5)):
        Cylinder(radius=8, height=25)
    with Locations((0, 0, 47.5)):
        Cylinder(radius=5, height=15)

    # 2. 键槽铣削
    with Locations((0, 8, 27.5)):
        Box(4, 3, 18, mode=Mode.SUBTRACT)
`,
    hint: "在连续调用 with Locations((0, 0, z)): Cylinder() 时，每次都会自动在轴肩表面堆叠下一级轴段；侧边放置 Box 并设为 Mode.SUBTRACT 即可完成键槽铣削。",
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
      "多边形徽章与多重几何特征艺术美学表达 (RegularPolygon)",
      "全格式交付（STEP 实体几何 + STL 三角网格）",
      "从构想、草图、切削到工程成果闭环交付",
    ],
    checkpoints: [
      { text: "八边形勋章基座 (RegularPolygon(..., side_count=8))", regex: /RegularPolygon/ },
      { text: "荣誉外环与核心星 (Cylinder / extrude)", regex: /(Cylinder|extrude)/ },
      { text: "中央矢量通道切削贯通 (Hole)", regex: /Hole/ },
    ],
    starterCode: `from build123d import *

with BuildPart() as part:
    # 1. 八角先锋荣誉勋章基座
    with BuildSketch() as sk1:
        RegularPolygon(radius=28, side_count=8)
    extrude(amount=5)

    # 2. 挑战：装配荣誉外环、核心三角星并切出中央喷管通道
    # with Locations((0, 0, 6.5)):
    #     Cylinder(radius=24, height=3)
    #     Hole(radius=20, depth=3)
    # with Locations((0, 0, 5)):
    #     with BuildSketch() as sk2:
    #         RegularPolygon(radius=14, side_count=3)
    #     extrude(amount=4)
    # Hole(radius=6, depth=12)
`,
    solutionCode: `from build123d import *

# 火星拓荒者计划 · 先锋荣誉总装勋章与火箭矢量喷口
with BuildPart() as part:
    # 1. 八角先锋荣誉勋章基座
    with BuildSketch() as sk1:
        RegularPolygon(radius=28, side_count=8)
    extrude(amount=5)

    # 2. 荣誉外环
    with Locations((0, 0, 6.5)):
        Cylinder(radius=24, height=3)
        Hole(radius=20, depth=3)

    # 3. 核心三角星
    with Locations((0, 0, 5)):
        with BuildSketch() as sk2:
            RegularPolygon(radius=14, side_count=3)
        extrude(amount=4)

    # 4. 矢量喷管孔
    Hole(radius=6, depth=12)
`,
    hint: "RegularPolygon(radius=14, side_count=3) 生成正三角形核心星，配合 side_count=8 的八角底座与同心环，呈现极具未来科技感的航天勋章总成。",
    karpathyNote: "恭喜你完成了火星拓荒者核心挑战！从第一行代码到全套物理实体，你已经掌握了用代码创造三维物理世界的全部钥匙。",
  },
  // ================= 阶段五：LogoUp 3D 空间海龟航行 (L17 - L19) =================
  {
    id: "logoup-l17",
    stage: "阶段五：LogoUp 3D 空间海龟航行",
    title: "L17: 初识 3D 空间小海龟",
    subtitle: "从平面 Logo 到 3D 标架旋转与立体管道成型",
    level: "L17",
    tagColor: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
    goalDescription:
      "引入 LogoUp 3D 经典海龟绘图范式！使用 with Turtle3D(radius=2.0) as t 启动 3D 空间海龟，控制它向前漫游 30mm，随后偏航转弯 90 度并向上俯仰抬升 45 度再前进 25mm，生成平滑流动的实体管道。",
    learningPoints: [
      "理解 3D 空间海龟标架（局部正交基：前进、航向偏转、俯仰倾斜）",
      "使用 Turtle3D 连续熔接实体管道，保证 100% 封闭流形",
      "对比传统平面 Logo 与空间 3D 实体海龟的范式升级",
    ],
    checkpoints: [
      { text: "初始化 3D 海龟 (Turtle3D)", regex: /Turtle3D\s*\(/ },
      { text: "向前爬行 (forward)", regex: /t\.forward\s*\(/ },
      { text: "空间偏航航向转弯 (turn)", regex: /t\.turn\s*\(/ },
      { text: "俯仰爬升角度控制 (pitch)", regex: /t\.pitch\s*\(/ },
    ],
    starterCode: `from build123d import *

# Task: 使用 3D 空间海龟，沿着立体路径游走并生成实体管道
with Turtle3D(radius=2.0) as t:
    t.forward(30)
    # 提示:
    # t.turn(90)   # 航向向右转 90 度
    # t.pitch(45)  # 向上仰头 45 度
    # t.forward(25)
`,
    solutionCode: `from build123d import *

# 3D 空间小海龟：航向转向与俯仰爬升
with Turtle3D(radius=2.0) as t:
    t.forward(30)
    t.turn(90)
    t.pitch(45)
    t.forward(25)
`,
    hint: "t.turn(90) 改变偏航角（Yaw），t.pitch(45) 改变俯仰角（Pitch）。最后再调用 t.forward(25) 即可沿着仰角立体爬升。",
    karpathyNote: "在 LogoUp 3D 体系中，海龟不再局限于二维画布，它携带一个自由旋转的 3D 局部坐标系，直接在虚空之中拉伸出实体几何。",
  },
  {
    id: "logoup-l18",
    stage: "阶段五：LogoUp 3D 空间海龟航行",
    title: "L18: 3D 空间螺旋升腾管道",
    subtitle: "程序循环与空间连续多轴耦合运动",
    level: "L18",
    tagColor: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
    goalDescription:
      "利用 Python 循环控制海龟连续漫游：在每一次迭代中前进一小步，同时按固定步长偏航与抬升，让小海龟在空中舞出一段优雅的 3D 螺旋线立体管道。",
    learningPoints: [
      "循环结构 (for / range) 与几何形态生成的结合",
      "离散步长逼近连续空间三维螺旋曲线 (Helix)",
      "自相交防护：通过关节球自动熔接避免 OpenCASCADE 扫掠崩溃",
    ],
    checkpoints: [
      { text: "初始化 3D 海龟 (Turtle3D)", regex: /Turtle3D\s*\(/ },
      { text: "使用循环结构 (for ... in range)", regex: /for\s+\w+\s+in\s+range/ },
      { text: "连续前进与转向组合 (forward & turn & pitch)", regex: /t\.forward[\s\S]*t\.turn[\s\S]*t\.pitch/ },
    ],
    starterCode: `from build123d import *

# Task: 编写 30 次循环，让海龟每次 forward(6), turn(18), pitch(8)
with Turtle3D(radius=2.5) as t:
    # 在此补全 for 循环
    pass
`,
    solutionCode: `from build123d import *

# 空间三维连续螺旋升腾管道
with Turtle3D(radius=2.5) as t:
    for i in range(30):
        t.forward(6)
        t.turn(18)
        t.pitch(8)
`,
    hint: "每次转动 18 度，20 次正好旋转一周 360 度，持续 30 次并配合 pitch(8) 抬头即可生成 1.5 圈的三维升腾螺旋管。",
    karpathyNote: "简单的局部规则 + 大量迭代 = 复杂的宏观秩序。这是自然界分形和生命的数学密码，也是代码造物的最高美感。",
  },
  {
    id: "logoup-l19",
    stage: "阶段五：LogoUp 3D 空间海龟航行",
    title: "L19: 空间分形与状态分支栈",
    subtitle: "push / pop 状态记忆栈与树状分叉结构",
    level: "L19",
    tagColor: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
    goalDescription:
      "掌握 Logo 经典的分支栈 (push/pop) 机制！海龟向前生成主干后，用 t.push() 存下当前空间位姿，拐向一侧绘制左支；再用 t.pop() 瞬间瞬移回分叉点，拐向另一侧绘制右支，构建 3D 空间分叉树。",
    learningPoints: [
      "海龟状态栈原理：先进后出 (LIFO) 存储位置与 3D 姿态朝向",
      "在 CAD 中使用分支栈构建分形树状网络",
      "可转为图形积木中的「空间分支容器」",
    ],
    checkpoints: [
      { text: "主干生成 (forward)", regex: /t\.forward\s*\(/ },
      { text: "位姿压栈 (t.push)", regex: /t\.push\s*\(\s*\)/ },
      { text: "位姿出栈恢复 (t.pop)", regex: /t\.pop\s*\(\s*\)/ },
    ],
    starterCode: `from build123d import *

# Task: 使用 t.push() 与 t.pop() 完成二叉分支结构
with Turtle3D(radius=2.0) as t:
    t.forward(25)  # 主干
    
    # 左侧分叉
    t.push()
    t.turn(-40)
    t.pitch(20)
    t.forward(18)
    t.pop()  # 恢复到分叉处

    # 请补全右侧分叉 (向右 turn(40), pitch(20), forward(18))
`,
    solutionCode: `from build123d import *

# 空间海龟分支栈：二叉树枝结构
with Turtle3D(radius=2.0) as t:
    t.forward(25)  # 树干
    
    # 左分支
    t.push()
    t.turn(-40)
    t.pitch(20)
    t.forward(18)
    t.pop()

    # 右分支
    t.push()
    t.turn(40)
    t.pitch(20)
    t.forward(18)
    t.pop()
`,
    hint: "每遇到一个分叉点，先 t.push() 保存现场，分支绘制完毕后 t.pop() 恢复现场，就可以在同一个节点伸展出多条枝丫。",
    karpathyNote: "状态栈是计算机科学最优雅的发明之一。有了栈，线性的时间就能在三维空间中绽放出无限层级的树状结构。",
  },
];

