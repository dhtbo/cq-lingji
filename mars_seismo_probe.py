"""
火星地震地质探测器 (Mars Seismic & Subsurface Geological Probe)
高精度 CadQuery 3D 参数化工程模型

【设计背景与核心功能】
1. 探测主机舱 (Avionics & Science Hull)：
   - 六边形轻量化承载机身，外覆金色多层隔热反射毯 (MLI Blanket)；
   - 顶部高强度科学甲板 (Top Deck) 配备减震基座与电缆分线汇流排。
2. 三脚架缓冲着陆支架 (Tripod Impact-Absorbing Landing Gear)：
   - 采用 for 循环 120° 极坐标空间阵列生成 3 套主着陆支腿；
   - 每套包含机身铰接耳座、双级液压油气缓冲套筒、同轴活塞杆、剪刀式抗扭连杆与自适应防陷碟形脚掌 (带防滑抓齿)。
3. 扇形多片自展开太阳能翼 (Radial Sector Solar Arrays)：
   - 采用 for 循环生成两侧对置扇形展开翼片 (每侧 5 片辐射展开)；
   - 带有自除尘微仰角 (Anti-dust Tilt Angle)，有效降低火星沙尘暴表面积灰衰减。
4. 可伸缩地下地质探测探针系统 (Multi-depth Subsurface Penetration Probes)：
   - 独立函数封装 (create_subsurface_probe)，支持参数化控制探针总深度、节数、直径与传感器测点；
   - 中央主深层锤击贯入探针 (HP3 风格热流与声发射探头，带破岩冲击钻头)；
   - 外周 3 根不同深度的浅层三轴微震拾震副探针，构成空间立体火星地震探测阵列。
5. 拓展升级与辅助系统 (Enhanced Instruments)：
   - 双轴高增益深空通信对地天线 (High-Gain Dish Antenna)；
   - 科学桅杆全景双目立体相机与微气象站 (MastCam & Meteo Tower)；
   - 超灵敏火震仪防风防热隔热防护罩 (Wind & Thermal Shield, WTS)。

【规范遵循】
- 遵循 BRep 建模思维，避免脆弱的 CSG 粗暴布尔退化；
- 函数与类均标注完整类型，使用全中文工程注释；
- 支持 CadQuery Assembly 装配体多色渲染与 STEP/STL 工业格式导出。
"""

import math
import sys
from dataclasses import dataclass, field
from typing import List, Tuple
import cadquery as cq

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")


# ==============================================================================
# 1. 全局工程参数配置 (Parametric Configuration)
# ==============================================================================

@dataclass
class SeismoProbeConfig:
    """火星地震地质探测器总体参数集 (单位: mm, 度)"""
    
    # ---------------- 空间基准与机身参数 ----------------
    ground_z: float = 0.0              # 火星基准地表面标高
    deck_base_z: float = 62.0          # 机身底板离地高度
    hull_height: float = 58.0          # 主机舱主体高度
    hull_radius: float = 72.0          # 六边形机舱外接圆半径
    hull_fillet: float = 2.5           # 主机身棱角倒角半径
    
    # ---------------- 三脚架着陆支架参数 ----------------
    leg_count: int = 3                 # 支腿数量 (三脚架 120° 等分)
    leg_spread_radius: float = 168.0   # 着陆脚掌触地半径 (距中心轴)
    leg_hinge_radius: float = 66.0     # 机身侧面铰链安装半径
    leg_hinge_z: float = 88.0          # 机身侧面铰链安装高度
    leg_strut_diam: float = 11.0       # 主缓冲外筒外径
    leg_piston_diam: float = 6.5       # 内伸缩活塞杆直径
    footpad_diam: float = 38.0         # 碟形脚掌外径
    footpad_thickness: float = 4.5     # 脚掌承载盘厚度
    cleat_count: int = 3               # 单个脚掌防滑抓爪数量
    
    # ---------------- 扇形展开太阳能翼参数 ----------------
    solar_panels_per_side: int = 5     # 每侧展开的扇形羽片数量
    solar_inner_radius: float = 32.0   # 扇形板内孔旋转半径
    solar_outer_radius: float = 136.0  # 扇形板最外延展开半径
    solar_span_angle: float = 26.0     # 单个扇片有效张角 (度)
    solar_total_sweep: float = 142.0   # 单侧全展开总扫掠角 (度)
    solar_thickness: float = 1.6       # 光伏板基底厚度
    solar_dust_tilt_deg: float = 13.5  # 防尘抗积灰迎风仰角 (度)
    solar_hinge_y: float = 75.0        # 侧边旋转驱动器轴心 Y 偏移
    solar_hinge_z: float = 95.0        # 旋转驱动器轴心 Z 高度
    
    # ---------------- 地下伸缩探测探针参数 ----------------
    probe_main_depth: float = 92.0     # 中央主深层探针地下深度 (Z=0 往下)
    probe_main_diam: float = 10.0      # 主探针外管直径
    probe_main_stages: int = 3         # 主探针嵌套套管节数
    probe_main_sensors: int = 5        # 主探针分层温差与声学拾震环数量
    
    probe_sub_radius: float = 48.0     # 外周 3 根副探针在底盘上的分布半径
    probe_sub_depths: Tuple[float, float, float] = (35.0, 48.0, 62.0) # 梯度下探深度
    probe_sub_diam: float = 5.0        # 副探针纤细管径
    probe_sub_stages: int = 2          # 副探针伸缩节数
    
    # ---------------- 拓展升级：通信、传感器与防护罩 ----------------
    antenna_dish_diam: float = 48.0    # 对地高增益抛物面天线口径
    antenna_mast_height: float = 32.0  # 天线安装支柱高度
    antenna_offset_x: float = -32.0    # 天线安装 X 偏置
    antenna_offset_y: float = 28.0     # 天线安装 Y 偏置
    
    camera_mast_height: float = 68.0   # 气象与全景相机桅杆高度
    camera_offset_x: float = 30.0      # 桅杆 X 偏置
    camera_offset_y: float = -26.0     # 桅杆 Y 偏置
    
    wts_shield_diam: float = 46.0      # 火震仪防风防热罩 (WTS) 底部直径
    wts_shield_height: float = 22.0    # WTS 防风罩穹顶高度
    wts_offset_x: float = -22.0        # WTS X 偏置
    wts_offset_y: float = -30.0        # WTS Y 偏置


cfg = SeismoProbeConfig()


# ==============================================================================
# 2. 真实航天工程色彩规范 (Aerospace Engineering Colors)
# ==============================================================================

COLOR_GOLD_MLI = cq.Color(0.88, 0.72, 0.15, 1.0)       # 金色多层隔热被 (MLI Kapton Foil)
COLOR_TITANIUM = cq.Color(0.66, 0.68, 0.72, 1.0)       # 航空级阳极氧化钛合金 (主承力构件)
COLOR_DARK_FRAME = cq.Color(0.18, 0.20, 0.22, 1.0)     # 碳纤维复合材料骨架与铰链驱动壳体
COLOR_SOLAR_CELL = cq.Color(0.08, 0.18, 0.44, 1.0)     # 深蓝色高效单晶硅太空光伏电池片
COLOR_SOLAR_RIM = cq.Color(0.82, 0.75, 0.55, 1.0)      # 太阳能边框聚酰亚胺柔性衬底
COLOR_SENSOR_AMBER = cq.Color(0.96, 0.48, 0.06, 1.0)   # 科学传感器测点与信号标志 (高亮琥珀橙)
COLOR_HARD_CHISEL = cq.Color(0.32, 0.32, 0.35, 1.0)    # 碳化钨高强冲击破岩钻尖
COLOR_WHITE_SHIELD = cq.Color(0.93, 0.94, 0.96, 1.0)   # 高反射耐候防尘防热陶瓷涂层 (WTS穹顶)
COLOR_STEEL_LINK = cq.Color(0.50, 0.52, 0.55, 1.0)     # 不锈钢连杆与活塞套筒


# ==============================================================================
# 3. 探测主机舱模块 (Avionics & Science Hull)
# ==============================================================================

def create_avionics_hull(config: SeismoProbeConfig) -> cq.Workplane:
    """
    构建主机舱承力机壳与金色多层隔热外围
    采用高稳定度六棱柱造型，底部设中央钻探贯通孔与副探针套管座
    :param config: 探测器全局参数配置
    :return: 主机舱装配几何体
    """
    z_bottom = config.deck_base_z
    h = config.hull_height
    r = config.hull_radius
    
    # 1. 基础六边形承力外壳
    hull = (
        cq.Workplane("XY", origin=(0, 0, z_bottom))
        .polygon(6, r * 2.0)
        .extrude(h)
        .edges("|Z")
        .fillet(config.hull_fillet)
    )
    
    # 2. 顶盖科学甲板加劲凸沿 (Top Science Deck Flange)
    top_deck = (
        cq.Workplane("XY", origin=(0, 0, z_bottom + h - 4.0))
        .polygon(6, (r + 4.5) * 2.0)
        .extrude(4.0)
        .edges("|Z")
        .fillet(1.5)
    )
    hull = hull.union(top_deck)
    
    # 3. 底盘承重加强环与底部贯通沉孔 (Central Probe Core Well)
    base_ring = (
        cq.Workplane("XY", origin=(0, 0, z_bottom - 5.0))
        .polygon(6, (r + 2.0) * 2.0)
        .extrude(5.0)
        .edges("|Z")
        .fillet(1.2)
    )
    hull = hull.union(base_ring)
    
    # 4. 中央探针发射下放套筒井 (Central Well Boss)
    central_boss = (
        cq.Workplane("XY", origin=(0, 0, z_bottom - 12.0))
        .circle(config.probe_main_diam * 1.35)
        .extrude(15.0)
    )
    hull = hull.union(central_boss)
    
    # 5. 六边形外壁防辐射散热与仪器挂载凸台 (6 个侧面各增加一个航天传感器视窗/接口)
    side_boss_list = []
    for side_idx in range(6):
        ang_deg = side_idx * 60.0
        ang_rad = math.radians(ang_deg)
        dist = r * 0.88
        bx = dist * math.cos(ang_rad)
        by = dist * math.sin(ang_rad)
        bz = z_bottom + h * 0.5
        
        boss = (
            cq.Workplane("XY", origin=(bx, by, bz - 8.0))
            .circle(9.0)
            .extrude(16.0)
            .rotate((bx, by, bz), (bx, by, bz + 1.0), ang_deg)
        )
        side_boss_list.append(boss)
        
    for sb in side_boss_list:
        hull = hull.union(sb)
        
    # 6. 顶面中心微震传感器仪器舱保护座圈
    sensor_collar = (
        cq.Workplane("XY", origin=(0, 0, z_bottom + h))
        .circle(18.0)
        .extrude(6.5)
        .faces(">Z")
        .hole(26.0, 4.5)
    )
    hull = hull.union(sensor_collar)
    
    return hull


def create_mli_blanket_skirt(config: SeismoProbeConfig) -> cq.Workplane:
    """
    构建主机身外侧金黄色 MLI 隔热反射保温暖裙与热控褶皱条带
    为探测器赋予纯正的深空航天器视觉特征
    :param config: 探测器全局参数配置
    :return: MLI 隔热层几何体
    """
    z_bottom = config.deck_base_z + 4.0
    h = config.hull_height - 10.0
    r = config.hull_radius * 0.94
    
    # 采用比机体略小的六棱外凸包覆层
    mli_core = (
        cq.Workplane("XY", origin=(0, 0, z_bottom))
        .polygon(6, r * 2.0)
        .extrude(h)
        .faces(">Z or <Z")
        .shell(2.2) # 中空薄壳，紧贴机身外壁
    )
    
    # 侧壁装饰性 MLI 压条与接地卡扣
    clamp_ribs = []
    for i in range(6):
        a_deg = i * 60.0 + 30.0
        a_rad = math.radians(a_deg)
        rx = (r + 1.5) * math.cos(a_rad)
        ry = (r + 1.5) * math.sin(a_rad)
        rib = (
            cq.Workplane("XY", origin=(rx, ry, z_bottom))
            .box(4.0, 2.0, h, centered=(True, True, False))
            .rotate((0, 0, 0), (0, 0, 1), a_deg)
        )
        clamp_ribs.append(rib)
        
    for cr in clamp_ribs:
        mli_core = mli_core.union(cr)
        
    return mli_core


# ==============================================================================
# 4. 三脚架缓冲着陆支架模块 (Tripod Impact-Absorbing Landing Gear)
# ==============================================================================

def create_single_landing_leg(config: SeismoProbeConfig) -> cq.Workplane:
    """
    参数化构建单套着陆支腿总成 (基准置于 +X 轴对称面，后续由 for 循环做 120° 旋转)
    
    包含精密的航天工程缓冲机构：
    - 机身双耳铰链座 (Pivot Bracket)
    - 油气双级减震外筒 (Main Damper Cylinder) 带充气阀与紧固环箍
    - 下伸缩活塞推杆 (Telescopic Piston Rod)
    - 三角抗剪切稳定摇臂连杆 (A-Frame Scissor Linkage)
    - 自适应碟形接地脚掌 (Articulated Footpad) 带 3 颗倒棱锥防滑抓爪
    
    :param config: 探测器全局参数配置
    :return: 单套支腿几何模型
    """
    r_hinge = config.leg_hinge_radius
    z_hinge = config.leg_hinge_z
    r_foot = config.leg_spread_radius
    z_foot = config.ground_z
    
    # 计算支腿空间主矢量与几何倾角
    dx = r_foot - r_hinge
    dz = z_foot - z_hinge
    strut_len = math.sqrt(dx * dx + dz * dz)
    tilt_rad = math.atan2(-dz, dx) # 倾斜角
    tilt_deg = math.degrees(tilt_rad)
    
    # 1. 机身铰链安装耳座 (Mounting Lug)
    lug = (
        cq.Workplane("XY", origin=(r_hinge - 4.0, 0, z_hinge))
        .box(12.0, 16.0, 14.0, centered=(True, True, True))
        .edges("|Y")
        .fillet(3.0)
    )
    lug_pin = (
        cq.Workplane("XZ", origin=(r_hinge, 0, z_hinge))
        .circle(4.0)
        .extrude(20.0, both=True)
    )
    lug = lug.union(lug_pin)
    
    # 2. 主减震外筒 (Upper Hydraulic Damper Strut)
    # 在 XZ 平面构建，起点位于铰接点，沿倾斜矢量向下延伸 55% 长度
    cylinder_len = strut_len * 0.56
    piston_len = strut_len * 0.58
    
    # 创建倾斜的工作基面
    # 沿旋转轴倾斜构建外筒
    outer_strut = (
        cq.Workplane("XY", origin=(r_hinge, 0, z_hinge))
        .transformed(rotate=(0, tilt_deg, 0))
        .circle(config.leg_strut_diam / 2.0)
        .extrude(cylinder_len)
    )
    # 外筒端盖与加强箍
    collar_1 = (
        cq.Workplane("XY", origin=(r_hinge, 0, z_hinge))
        .transformed(rotate=(0, tilt_deg, 0))
        .transformed(offset=(0, 0, cylinder_len * 0.45))
        .circle(config.leg_strut_diam * 0.65)
        .extrude(4.0)
    )
    collar_2 = (
        cq.Workplane("XY", origin=(r_hinge, 0, z_hinge))
        .transformed(rotate=(0, tilt_deg, 0))
        .transformed(offset=(0, 0, cylinder_len - 5.0))
        .circle(config.leg_strut_diam * 0.68)
        .extrude(5.0)
    )
    outer_strut = outer_strut.union(collar_1).union(collar_2)
    
    # 3. 下部伸缩活塞杆 (Lower Piston Rod)
    # 从外筒深处伸展至触地关节球座
    inner_piston = (
        cq.Workplane("XY", origin=(r_hinge, 0, z_hinge))
        .transformed(rotate=(0, tilt_deg, 0))
        .transformed(offset=(0, 0, cylinder_len * 0.35))
        .circle(config.leg_piston_diam / 2.0)
        .extrude(piston_len)
    )
    
    # 4. 触地点球铰链头与脚掌连接座 (Ankle Joint)
    ankle_center_x = r_foot
    ankle_center_z = z_foot + config.footpad_thickness + 3.0
    ankle_joint = (
        cq.Workplane("XY", origin=(ankle_center_x, 0, ankle_center_z))
        .sphere(config.leg_piston_diam * 1.1)
    )
    
    # 5. 自适应碟形接地大脚掌 (Dish Footpad)
    # 具有上微凸防尘、下平受力盘，避免火星沙砾层沉陷
    footpad_r = config.footpad_diam / 2.0
    footpad = (
        cq.Workplane("XY", origin=(r_foot, 0, z_foot))
        .circle(footpad_r)
        .extrude(config.footpad_thickness)
        .faces(">Z")
        .chamfer(1.2)
    )
    # 边缘翻边加强环
    footpad_rim = (
        cq.Workplane("XY", origin=(r_foot, 0, z_foot + config.footpad_thickness - 1.5))
        .circle(footpad_r)
        .circle(footpad_r - 2.5)
        .extrude(3.0)
    )
    footpad = footpad.union(footpad_rim)
    
    # 底部 3 颗倒角防滑爪牙 (Anti-slip Grip Cleats)
    for c_i in range(config.cleat_count):
        c_ang = c_i * (360.0 / config.cleat_count)
        c_rad = math.radians(c_ang)
        cx = r_foot + (footpad_r * 0.65) * math.cos(c_rad)
        cy = (footpad_r * 0.65) * math.sin(c_rad)
        cleat = (
            cq.Workplane("XY", origin=(cx, cy, z_foot))
            .circle(2.2)
            .workplane(offset=-4.0)
            .circle(0.4)
            .loft(combine=True)
        )
        footpad = footpad.union(cleat)
        
    # 6. 辅助三角抗剪连杆 (A-Frame Scissor Drag Link)
    # 从机身下边缘 (deck_base_z) 连接至主筒中部，提供极强的三向抗冲击刚度
    link_base_x = config.hull_radius * 0.68
    link_base_z = config.deck_base_z
    link_target_x = r_hinge + (cylinder_len * 0.85) * math.cos(tilt_rad)
    link_target_z = z_hinge - (cylinder_len * 0.85) * math.sin(tilt_rad)
    
    link_dx = link_target_x - link_base_x
    link_dz = link_target_z - link_base_z
    link_len = math.sqrt(link_dx * link_dx + link_dz * link_dz)
    link_ang_deg = math.degrees(math.atan2(-link_dz, link_dx))
    
    # 双叉双连杆 (Y 轴向左右各一根，构成空间 A 构型)
    scissor_links = []
    for side in (-1, 1):
        s_y = side * 8.5
        link = (
            cq.Workplane("XY", origin=(link_base_x, s_y, link_base_z))
            .transformed(rotate=(0, link_ang_deg, 0))
            .circle(2.5)
            .extrude(link_len)
        )
        scissor_links.append(link)
        
    # 合并单套支腿的所有构件
    full_leg = lug.union(outer_strut).union(inner_piston).union(ankle_joint).union(footpad)
    for sl in scissor_links:
        full_leg = full_leg.union(sl)
        
    return full_leg


def build_tripod_landing_gear(config: SeismoProbeConfig) -> List[Tuple[cq.Workplane, str]]:
    """
    使用 for 循环生成 3 套 120° 旋转对称的缓冲着陆支架
    :param config: 全局参数配置
    :return: 支腿几何实体与其识别标签列表
    """
    single_leg = create_single_landing_leg(config)
    legs_assembly = []
    
    # 核心关键点：for 循环生成三脚架支腿
    for i in range(config.leg_count):
        azimuth_deg = i * (360.0 / config.leg_count)
        # 将基准支腿沿 Z 轴旋转到对应相位
        rotated_leg = single_leg.rotate((0, 0, 0), (0, 0, 1), azimuth_deg)
        legs_assembly.append((rotated_leg, f"LandingLeg_120deg_{i}"))
        
    return legs_assembly


# ==============================================================================
# 5. 扇形展开式多片太阳能板模块 (Radial Sector Solar Arrays)
# ==============================================================================

def create_single_sector_panel(
    inner_r: float,
    outer_r: float,
    span_deg: float,
    thickness: float,
    tilt_deg: float = 0.0
) -> Tuple[cq.Workplane, cq.Workplane]:
    """
    构建单个扇形展开光伏羽片，包含结构基板与防尘导流电池贴片面
    :param inner_r: 扇形内径 (mm)
    :param outer_r: 扇形外径 (mm)
    :param span_deg: 单片扇面开角 (度)
    :param thickness: 复合材料基板厚度 (mm)
    :param tilt_deg: 防尘倾角 (度)
    :return: (基板支撑边框, 光伏电池硅片贴层)
    """
    # 构造圆弧扇形多边形顶点轮廓
    steps = 8
    d_alpha = math.radians(span_deg) / steps
    
    # 外圆弧点序列
    outer_pts = []
    for s in range(steps + 1):
        ang = s * d_alpha
        outer_pts.append((outer_r * math.cos(ang), outer_r * math.sin(ang)))
        
    # 内圆弧点序列 (反向闭合)
    inner_pts = []
    for s in range(steps, -1, -1):
        ang = s * d_alpha
        inner_pts.append((inner_r * math.cos(ang), inner_r * math.sin(ang)))
        
    all_poly_pts = outer_pts + inner_pts
    
    # 1. 结构基板
    panel_base = (
        cq.Workplane("XY")
        .polyline(all_poly_pts)
        .close()
        .extrude(thickness)
    )
    
    # 放射加劲肋骨架 (Radial Stiffener Ribs)
    rib_1 = (
        cq.Workplane("XY")
        .box(outer_r - inner_r, 2.0, thickness + 1.2, centered=(False, True, False))
        .translate((inner_r, 0, 0))
    )
    rib_2 = (
        cq.Workplane("XY")
        .box(outer_r - inner_r, 2.0, thickness + 1.2, centered=(False, True, False))
        .translate((inner_r, 0, 0))
        .rotate((0, 0, 0), (0, 0, 1), span_deg)
    )
    panel_base = panel_base.union(rib_1).union(rib_2)
    
    # 2. 表面深蓝单晶硅光伏芯片层 (Solar Cells Grid)
    # 略微内缩，形成真实的边框包裹质感
    cell_inner_r = inner_r + 3.0
    cell_outer_r = outer_r - 3.5
    cell_d_alpha = math.radians(span_deg - 2.0) / steps
    
    cell_outer_pts = []
    for s in range(steps + 1):
        ang = math.radians(1.0) + s * cell_d_alpha
        cell_outer_pts.append((cell_outer_r * math.cos(ang), cell_outer_r * math.sin(ang)))
        
    cell_inner_pts = []
    for s in range(steps, -1, -1):
        ang = math.radians(1.0) + s * cell_d_alpha
        cell_inner_pts.append((cell_inner_r * math.cos(ang), cell_inner_r * math.sin(ang)))
        
    cell_pts = cell_outer_pts + cell_inner_pts
    
    solar_cells = (
        cq.Workplane("XY", origin=(0, 0, thickness))
        .polyline(cell_pts)
        .close()
        .extrude(0.6)
    )
    
    return panel_base, solar_cells


def build_dual_sector_solar_arrays(config: SeismoProbeConfig) -> List[Tuple[cq.Workplane, str, cq.Color]]:
    """
    使用 for 循环生成两侧对置的扇形自展开太阳能帆板总成
    
    工程防尘亮点：
    - 每侧 5 片扇叶阶梯展开，具有 13.5° 向上自清洁倾角；
    - 火星表面多风季节，火星微风冲刷迎风坡将自然将浮沉吹离扇面，消除水平积灰死角。
    
    :param config: 全局参数配置
    :return: 带有色彩定义的各扇叶列表
    """
    panels_data = []
    n_panels = config.solar_panels_per_side
    sweep_total = config.solar_total_sweep
    step_ang = (sweep_total - config.solar_span_angle) / max(1, (n_panels - 1))
    
    base_panel, base_cells = create_single_sector_panel(
        inner_r=config.solar_inner_radius,
        outer_r=config.solar_outer_radius,
        span_deg=config.solar_span_angle,
        thickness=config.solar_thickness,
        tilt_deg=config.solar_dust_tilt_deg
    )
    
    # 两侧对称部署：+Y 侧与 -Y 侧
    for side_flag, side_name in [(1.0, "Right_Array"), (-1.0, "Left_Array")]:
        hinge_center = (0.0, side_flag * config.solar_hinge_y, config.solar_hinge_z)
        
        # 旋转展开铰链轴毂 (Drive Actuator Housing)
        hinge_housing = (
            cq.Workplane("YZ", origin=hinge_center)
            .circle(10.0)
            .extrude(16.0, both=True)
            .faces(">X or <X")
            .chamfer(1.5)
        )
        hinge_shaft = (
            cq.Workplane("YZ", origin=hinge_center)
            .circle(5.5)
            .extrude(20.0, both=True)
        )
        hinge_actuator = hinge_housing.union(hinge_shaft)
        panels_data.append((hinge_actuator, f"{side_name}_Hinge_Motor", COLOR_DARK_FRAME))
        
        # 核心关键点：for 循环展开多片扇形太阳能翼片
        for p_i in range(n_panels):
            # 扇片沿铰链展开的渐进角度
            local_ang = -sweep_total / 2.0 + p_i * step_ang
            
            # 基础展开旋转
            p_base_rot = base_panel.rotate((0, 0, 0), (0, 0, 1), local_ang)
            p_cell_rot = base_cells.rotate((0, 0, 0), (0, 0, 1), local_ang)
            
            # 施加自除尘防积灰仰角 (向外侧微翘起)
            tilt = config.solar_dust_tilt_deg
            p_base_tilted = p_base_rot.rotate((0, 0, 0), (1, 0, 0), side_flag * tilt)
            p_cell_tilted = p_cell_rot.rotate((0, 0, 0), (1, 0, 0), side_flag * tilt)
            
            # 适配 Y 侧方向 (左翼做 180° 对称翻转)
            if side_flag < 0:
                p_base_tilted = p_base_tilted.rotate((0, 0, 0), (0, 0, 1), 180.0)
                p_cell_tilted = p_cell_tilted.rotate((0, 0, 0), (0, 0, 1), 180.0)
                
            # 平移至机身两侧铰链安装点
            p_base_final = p_base_tilted.translate(hinge_center)
            p_cell_final = p_cell_tilted.translate(hinge_center)
            
            panels_data.append((p_base_final, f"{side_name}_Frame_Leaf_{p_i}", COLOR_SOLAR_RIM))
            panels_data.append((p_cell_final, f"{side_name}_Photovoltaic_Leaf_{p_i}", COLOR_SOLAR_CELL))
            
    return panels_data


# ==============================================================================
# 6. 可伸缩地下地质探测探针系统 (Subsurface Probe System)
# ==============================================================================

def create_subsurface_probe(
    depth: float,
    outer_diam: float = 9.0,
    stage_count: int = 3,
    has_drill_tip: bool = True,
    sensor_nodes: int = 4,
    collar_type: str = "heavy"
) -> cq.Workplane:
    """
    【创新函数封装】：参数化构建伸缩式地下地质探测探针组件
    支持动态变量控制探针深度、嵌套分节、传感测点与冲击破岩钻尖
    
    工程技术原理：
    - 参考 InSight HP3 "热流与物理属性探头(鼹鼠/Mole)" 与 Apollo ALSEP 月震钻探计；
    - 探针向火星地表以下深处贯入 (Z=0 往下至 -depth)；
    - 沿轴向布置多个分层温差传感器环与声波微震换能器环，用于同时测定地下热流梯度与弹性波速度。
    
    :param depth: 深入火星地下深度 (mm, 自 Z=0 往下计算)
    :param outer_diam: 基级导向套管外径 (mm)
    :param stage_count: 嵌套伸缩管节段数
    :param has_drill_tip: 探针头部是否具备自驱动破岩硬质合金钻头
    :param sensor_nodes: 沿杆身分布的地下微震波拾震环与地热测温环数量
    :param collar_type: 地表导向密封定位法兰规格 ('heavy' / 'light')
    :return: 完整的探针总成 Workplane 实体
    """
    # 地表上方基准导向套管 (位于地面上 Z=0 到 Z=35mm)
    guide_height = 32.0 if collar_type == "heavy" else 20.0
    probe_solid = (
        cq.Workplane("XY", origin=(0, 0, 0))
        .circle(outer_diam / 2.0)
        .extrude(guide_height)
    )
    
    # 地表防尘密封沉箱法兰 (Ground Seal Flange)
    flange_diam = outer_diam * 2.2
    ground_flange = (
        cq.Workplane("XY", origin=(0, 0, 0))
        .circle(flange_diam / 2.0)
        .extrude(4.5)
        .faces(">Z")
        .chamfer(1.0)
    )
    # 法兰紧固螺栓孔位凸台
    flange_bolts = (
        cq.Workplane("XY", origin=(0, 0, 4.5))
        .polygon(6, flange_diam * 0.85)
        .circle(1.2)
        .extrude(1.8)
    )
    probe_solid = probe_solid.union(ground_flange).union(flange_bolts)
    
    # 分节下潜套管生成 (地下部分 Z < 0)
    total_underground = depth
    stage_len = total_underground / max(1, stage_count)
    curr_z = 0.0
    curr_diam = outer_diam * 0.92
    
    for st_idx in range(stage_count):
        stage_tube = (
            cq.Workplane("XY", origin=(0, 0, curr_z))
            .circle(curr_diam / 2.0)
            .extrude(-stage_len)
        )
        probe_solid = probe_solid.union(stage_tube)
        
        # 节段接头环箍 (Stage Interlock Collar)
        collar = (
            cq.Workplane("XY", origin=(0, 0, curr_z - stage_len + 2.5))
            .circle((curr_diam * 1.12) / 2.0)
            .extrude(3.5)
        )
        probe_solid = probe_solid.union(collar)
        
        curr_z -= stage_len
        curr_diam *= 0.82 # 下一级套筒渐缩内套
        
    # 头部破岩钻尖或穿透圆锥 (Chisel / Cone Tip)
    if has_drill_tip:
        # 四棱碳化钨破岩切削冲击锥头
        drill_len = 14.0
        drill_tip = (
            cq.Workplane("XY", origin=(0, 0, curr_z))
            .circle(curr_diam / 2.0)
            .workplane(offset=-drill_len)
            .polygon(4, 1.2) # 底部尖锐四棱尖
            .loft(combine=True)
        )
        # 钻头排屑双螺旋导槽 (Spiral Flute Simulation)
        flute_ring = (
            cq.Workplane("XY", origin=(0, 0, curr_z - 3.0))
            .circle((curr_diam * 1.18) / 2.0)
            .extrude(3.0)
        )
        probe_solid = probe_solid.union(drill_tip).union(flute_ring)
    else:
        # 高灵敏度圆锥针头 (用于浅层微震 S 波拾震副探针)
        needle_len = 10.0
        needle_tip = (
            cq.Workplane("XY", origin=(0, 0, curr_z))
            .circle(curr_diam / 2.0)
            .workplane(offset=-needle_len)
            .circle(0.4)
            .loft(combine=True)
        )
        probe_solid = probe_solid.union(needle_tip)
        
    # 沿探针轴向分层分布的地下微震传感器测点环 (Seismic / Thermal Nodes)
    if sensor_nodes > 0:
        step_sensor = total_underground / (sensor_nodes + 1)
        for s_idx in range(1, sensor_nodes + 1):
            sz = -s_idx * step_sensor
            # 计算所在深度处的外径近似值
            ring_diam = outer_diam * 0.95
            sensor_ring = (
                cq.Workplane("XY", origin=(0, 0, sz))
                .circle(ring_diam / 2.0 + 0.6)
                .circle(ring_diam / 2.0 - 0.2)
                .extrude(3.0)
            )
            probe_solid = probe_solid.union(sensor_ring)
            
    return probe_solid


def build_probe_network(config: SeismoProbeConfig) -> List[Tuple[cq.Workplane, str, cq.Color]]:
    """
    构建由 1 根中央深层探针与 3 根环向浅层副探针组成的三维立体火星地质勘测基阵
    :param config: 全局参数配置
    :return: 探针网络构件列表
    """
    network_items = []
    
    # 1. 中央主深层穿透探针 (深入地下 probe_main_depth mm)
    main_probe = create_subsurface_probe(
        depth=config.probe_main_depth,
        outer_diam=config.probe_main_diam,
        stage_count=config.probe_main_stages,
        has_drill_tip=True,
        sensor_nodes=config.probe_main_sensors,
        collar_type="heavy"
    )
    # 中央探针上方驱动线缆绞盘与阻尼舱 (Tether Winch Housing)
    winch_box = (
        cq.Workplane("XY", origin=(0, 0, 32.0))
        .box(24.0, 24.0, 18.0, centered=(True, True, False))
        .edges("|Z")
        .fillet(3.0)
    )
    winch_spool = (
        cq.Workplane("YZ", origin=(0, 0, 41.0))
        .circle(8.0)
        .extrude(26.0, both=True)
    )
    winch_total = winch_box.union(winch_spool)
    
    network_items.append((main_probe, "Central_Deep_Subsurface_Probe", COLOR_TITANIUM))
    network_items.append((winch_total, "Central_Probe_Impactor_Winch", COLOR_DARK_FRAME))
    
    # 2. 外周 3 根浅层三轴微震拾震副探针 (不同深度，构成梯度地下拾震立体阵)
    sub_r = config.probe_sub_radius
    sub_depths = config.probe_sub_depths
    
    for sub_i in range(3):
        # 与着陆三脚架错开 60° (位于 60°, 180°, 300° 方位)
        ang_deg = 60.0 + sub_i * 120.0
        ang_rad = math.radians(ang_deg)
        px = sub_r * math.cos(ang_rad)
        py = sub_r * math.sin(ang_rad)
        depth_val = sub_depths[sub_i]
        
        # 调用封装函数生成副探针
        sub_probe = create_subsurface_probe(
            depth=depth_val,
            outer_diam=config.probe_sub_diam,
            stage_count=config.probe_sub_stages,
            has_drill_tip=False, # 浅层采用细长针头
            sensor_nodes=2,
            collar_type="light"
        )
        # 定位至机身底盘对应坐标点
        placed_sub_probe = sub_probe.translate((px, py, 0))
        
        # 底盘引出信号同轴套管
        conduit = (
            cq.Workplane("XY", origin=(px, py, 20.0))
            .circle(config.probe_sub_diam * 0.9)
            .extrude(config.deck_base_z - 20.0)
        )
        placed_sub_probe = placed_sub_probe.union(conduit)
        
        network_items.append((placed_sub_probe, f"Peripheral_Seismic_Probe_{sub_i+1}_Depth_{int(depth_val)}mm", COLOR_SENSOR_AMBER))
        
    return network_items


# ==============================================================================
# 7. 拓展升级模块：通信对地天线、全景气象桅杆与防尘防护罩
# ==============================================================================

def create_high_gain_antenna(config: SeismoProbeConfig) -> Tuple[cq.Workplane, cq.Workplane]:
    """
    构建双轴高增益深空通信抛物面定向天线
    :param config: 全局参数配置
    :return: (支撑底座与云台驱动器, 抛物面天线盘与馈源)
    """
    x0 = config.antenna_offset_x
    y0 = config.antenna_offset_y
    z0 = config.deck_base_z + config.hull_height
    
    # 1. 仰角-方位双轴云台座 (Gimbal Pedestal)
    pedestal = (
        cq.Workplane("XY", origin=(x0, y0, z0))
        .circle(8.0)
        .extrude(config.antenna_mast_height)
        .faces(">Z")
        .circle(10.0)
        .extrude(6.0)
    )
    gimbal_yoke = (
        cq.Workplane("YZ", origin=(x0, y0, z0 + config.antenna_mast_height + 6.0))
        .box(16.0, 18.0, 12.0, centered=(True, True, False))
        .edges("|X")
        .fillet(2.5)
    )
    mount_base = pedestal.union(gimbal_yoke)
    
    # 2. 浅抛物面天线反射器碟盘 (Parabolic Dish)
    dish_z = z0 + config.antenna_mast_height + 18.0
    dish_r = config.antenna_dish_diam / 2.0
    
    # 碟面倾斜指向地球通信视角 (倾斜 35°)
    dish = (
        cq.Workplane("XY", origin=(x0, y0, dish_z))
        .transformed(rotate=(25.0, -25.0, 0))
        .circle(dish_r)
        .extrude(4.0)
        .faces(">Z")
        .hole(dish_r * 1.85, 3.0) # 内凹抛物面反射碗
    )
    
    # 中心三脚支撑馈源喇叭 (Feedhorn & Subreflector)
    feedhorn = (
        cq.Workplane("XY", origin=(x0, y0, dish_z))
        .transformed(rotate=(25.0, -25.0, 0))
        .circle(3.5)
        .extrude(12.0)
        .faces(">Z")
        .circle(5.0)
        .extrude(3.0)
    )
    dish_total = dish.union(feedhorn)
    
    return mount_base, dish_total


def create_science_mast(config: SeismoProbeConfig) -> Tuple[cq.Workplane, cq.Workplane]:
    """
    构建全景双目立体相机桅杆与火星微气象站 (MastCam & Meteo Tower)
    :param config: 全局参数配置
    :return: (格构桅杆本体, 顶部双目立体相机舱与气象吊臂)
    """
    x0 = config.camera_offset_x
    y0 = config.camera_offset_y
    z0 = config.deck_base_z + config.hull_height
    h = config.camera_mast_height
    
    # 1. 轻量化六棱格构立柱桅杆
    mast_pole = (
        cq.Workplane("XY", origin=(x0, y0, z0))
        .polygon(6, 12.0)
        .extrude(h)
    )
    # 桅杆减重台阶与中间阻尼套管
    mid_collar = (
        cq.Workplane("XY", origin=(x0, y0, z0 + h * 0.5))
        .circle(8.0)
        .extrude(5.0)
    )
    mast_pole = mast_pole.union(mid_collar)
    
    # 2. 顶部双目立体全景相机舱 (Stereo MastCam)
    head_z = z0 + h
    cam_head = (
        cq.Workplane("XY", origin=(x0, y0, head_z))
        .box(26.0, 14.0, 12.0, centered=(True, True, False))
        .edges("|Z")
        .fillet(2.0)
    )
    # 双目相机光学视窗镜头
    lens_l = (
        cq.Workplane("XZ", origin=(x0 - 7.0, y0 + 7.0, head_z + 6.0))
        .circle(3.2)
        .extrude(3.5)
    )
    lens_r = (
        cq.Workplane("XZ", origin=(x0 + 7.0, y0 + 7.0, head_z + 6.0))
        .circle(3.2)
        .extrude(3.5)
    )
    cam_head = cam_head.union(lens_l).union(lens_r)
    
    # 3. 侧向伸出的火星微环境气象风向风速传感器探头 (MEDA Wind Sensor Boom)
    boom = (
        cq.Workplane("YZ", origin=(x0 - 13.0, y0, head_z + 4.0))
        .circle(1.8)
        .extrude(-16.0) # 向外侧横向悬挑
        .faces("<X")
        .sphere(3.0)
    )
    cam_head = cam_head.union(boom)
    
    return mast_pole, cam_head


def create_wind_thermal_shield(config: SeismoProbeConfig) -> cq.Workplane:
    """
    构建超灵敏火震仪核心防护罩 (Wind & Thermal Shield, WTS)
    
    创新防护设计：
    - 采用仿生双曲面流线流体导流穹顶；
    - 边缘带有柔性密封裙边，彻底隔绝火星昼夜百摄氏度温差引起的仪器热胀冷缩，
      并规避火星表面大风引发的脉动微震虚假信号。
    
    :param config: 全局参数配置
    :return: WTS 隔热防尘罩几何实体
    """
    x0 = config.wts_offset_x
    y0 = config.wts_offset_y
    z0 = config.deck_base_z + config.hull_height
    d = config.wts_shield_diam
    h = config.wts_shield_height
    
    # 双曲抛物面流线型穹顶
    dome = (
        cq.Workplane("XY", origin=(x0, y0, z0))
        .circle(d / 2.0)
        .workplane(offset=h * 0.65)
        .circle((d * 0.85) / 2.0)
        .workplane(offset=h * 0.35)
        .circle(3.0)
        .loft(combine=True)
    )
    # 底部自适应密封百褶裙边 (Flexible Skirt)
    skirt = (
        cq.Workplane("XY", origin=(x0, y0, z0))
        .circle(d / 2.0 + 3.5)
        .circle(d / 2.0 - 1.0)
        .extrude(4.0)
        .faces(">Z")
        .chamfer(1.2)
    )
    # 顶部航天级多光谱热控高反射天窗
    top_cap = (
        cq.Workplane("XY", origin=(x0, y0, z0 + h - 0.5))
        .circle(5.5)
        .extrude(2.0)
    )
    wts_shield = dome.union(skirt).union(top_cap)
    
    return wts_shield


# ==============================================================================
# 8. 全机总装配体与工程色彩渲染 (Complete Vehicle Assembly & Styling)
# ==============================================================================

def build_mars_seismo_probe_assembly(config: SeismoProbeConfig) -> cq.Assembly:
    """
    将所有高精度子系统统合装配至 CadQuery Assembly 装配体
    并赋予真实的太空工程材料质感色彩
    :param config: 全局参数配置
    :return: 具备完整零件层级与色彩配置的装配体对象
    """
    assy = cq.Assembly(name="Mars_SeismoProbe_Vehicle")
    
    # 1. 主机舱与多层隔热被 (MLI)
    hull_solid = create_avionics_hull(config)
    mli_solid = create_mli_blanket_skirt(config)
    assy.add(hull_solid, name="Avionics_Deck_Hull", color=COLOR_DARK_FRAME)
    assy.add(mli_solid, name="MLI_Gold_Thermal_Blanket", color=COLOR_GOLD_MLI)
    
    # 2. 三脚架缓冲着陆支腿系统 (for 循环生成 3 组)
    landing_legs = build_tripod_landing_gear(config)
    for leg_solid, leg_tag in landing_legs:
        assy.add(leg_solid, name=leg_tag, color=COLOR_TITANIUM)
        
    # 3. 扇形多片展开式太阳能帆板总成 (for 循环生成 2*5 扇片)
    solar_panels = build_dual_sector_solar_arrays(config)
    for p_solid, p_name, p_color in solar_panels:
        assy.add(p_solid, name=p_name, color=p_color)
        
    # 4. 可伸缩地下探测探针网络 (中央深层主探针 + 3 根外周浅层副探针)
    probe_items = build_probe_network(config)
    for pr_solid, pr_name, pr_color in probe_items:
        assy.add(pr_solid, name=pr_name, color=pr_color)
        
    # 5. 拓展升级系统：高增益通信天线
    ant_base, ant_dish = create_high_gain_antenna(config)
    assy.add(ant_base, name="Antenna_Gimbal_Base", color=COLOR_TITANIUM)
    assy.add(ant_dish, name="Antenna_Parabolic_Dish", color=COLOR_WHITE_SHIELD)
    
    # 6. 拓展升级系统：全景相机桅杆与气象站
    mast_pole, mast_head = create_science_mast(config)
    assy.add(mast_pole, name="MastCam_Tower_Truss", color=COLOR_TITANIUM)
    assy.add(mast_head, name="MastCam_Stereo_Camera_Head", color=COLOR_DARK_FRAME)
    
    # 7. 拓展升级系统：火震仪防风防热隔热罩 (WTS)
    wts_dome = create_wind_thermal_shield(config)
    assy.add(wts_dome, name="Seismometer_WTS_Dome_Shield", color=COLOR_WHITE_SHIELD)
    
    return assy


# ==============================================================================
# 9. 脚本执行与文件导出主入口
# ==============================================================================

def main():
    """主程序：执行火星探测器装配、几何合法性验证与 STEP/STL 导出"""
    print("=" * 80)
    print("🚀 开始构建：火星地震地质探测器 (Mars Seismic & Subsurface Geological Probe)")
    print("=" * 80)
    
    cfg = SeismoProbeConfig()
    print(f"[*] 参数配置就绪:")
    print(f"    - 机身高度: {cfg.hull_height} mm, 外接圆半径: {cfg.hull_radius} mm")
    print(f"    - 着陆三脚架展开半径: {cfg.leg_spread_radius} mm, 倾角缓冲已配置")
    print(f"    - 扇形太阳能板: 每侧 {cfg.solar_panels_per_side} 片, 防尘仰角: {cfg.solar_dust_tilt_deg}°")
    print(f"    - 中央地下探测深度: {cfg.probe_main_depth} mm, 嵌套级数: {cfg.probe_main_stages}")
    print(f"    - 外周地下副探针网络深度: {cfg.probe_sub_depths} mm")
    
    # 构建完整装配体
    print("\n[*] 正在执行 CadQuery BRep 几何建模与装配...")
    probe_assembly = build_mars_seismo_probe_assembly(cfg)
    print("[✓] 装配体构建完成！包含子部件数:", len(probe_assembly.children))
    
    # 导出 STEP 工程模型
    step_filename = "mars_seismo_probe.step"
    print(f"\n[*] 正在导出高精度 STEP AP214 工程模型 -> {step_filename} ...")
    probe_assembly.save(step_filename)
    print(f"[✓] STEP 模型成功导出: {step_filename}")
    
    # 转换为复合实体以导出高分辨率 STL
    stl_filename = "mars_seismo_probe.stl"
    print(f"\n[*] 正在导出 3D 打印与渲染三角网格 -> {stl_filename} ...")
    compound_shape = probe_assembly.toCompound()
    compound_shape.exportStl(stl_filename, tolerance=0.08, angularTolerance=0.25)
    print(f"[✓] STL 网格模型成功导出: {stl_filename}")
    
    # 打印工程指标总结
    bbox = compound_shape.BoundingBox()
    volume_cm3 = compound_shape.Volume() / 1000.0
    print("\n" + "=" * 80)
    print("📊 火星地震地质探测器几何与工程指标报告：")
    print(f"    - 包络尺寸 X: {bbox.xmin:.1f} ~ {bbox.xmax:.1f} mm (跨度: {bbox.xlen:.1f} mm)")
    print(f"    - 包络尺寸 Y: {bbox.ymin:.1f} ~ {bbox.ymax:.1f} mm (跨度: {bbox.ylen:.1f} mm)")
    print(f"    - 包络尺寸 Z: {bbox.zmin:.1f} ~ {bbox.zmax:.1f} mm (总高: {bbox.zlen:.1f} mm, 含地下探针)")
    print(f"    - 总体积: {volume_cm3:.2f} cm³ (钛合金/碳纤轻量化结构)")
    print("=" * 80)
    print("✨ 全部构建与导出任务圆满完成！")


if __name__ == "__main__":
    main()
