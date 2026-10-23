"""
Mars In-Situ Resource Utilization (ISRU) Plant: Oxygen & Methane Fuel Synthesis
火星原位制氧与燃料合成装置 - 高精度 CadQuery 参数化 3D 工程模型

突出精密工程链路：
1. CO₂ 收集与除尘系统 (CO₂ Collector & Cyclonic Dust Filtration)
2. SOXE 固体氧化物高温电解堆 (Solid Oxide Electrolysis Stacks & Circulation Pump)
3. 萨巴蒂尔微通道催化甲烷化反应系统 (Sabatier Catalytic Methanation Reactor)
4. 多级高压压缩与深冷储罐 (Compression, Cryogenic Storage & Dispensing Ports)
5. 闭环工业流体管网系统 (Color-coded High-Precision Piping Network: O2/CO2/Syngas/CH4)
6. 多层绝热保护底盘 (Base Chassis & Gold MLI Thermal Blanket Skirt)
"""

import sys
import math
from dataclasses import dataclass
from typing import Dict, List, Tuple
import cadquery as cq

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")


# ==============================================================================
# 1. 全局工程参数配置 (Parametric Configuration)
# ==============================================================================

@dataclass
class PlantConfig:
    """火星原位化工合成装置总体参数集"""
    # 基础底座尺寸 (mm)
    base_length: float = 2900.0       # 底盘 X 方向总长
    base_width: float = 1050.0        # 底盘 Y 方向总宽
    base_height: float = 80.0         # 金色 MLI 隔热罩高度
    chassis_beam_h: float = 45.0      # 上部结构型钢高
    
    # CO2 收集器参数
    collector_center_x: float = -850.0
    collector_center_z: float = 620.0
    dish_outer_radius: float = 460.0  # 喇叭口外径 920mm
    dish_throat_radius: float = 260.0 # 喉部外径 520mm
    dish_depth: float = 220.0         # 收集罩轴向深度
    nose_cone_radius: float = 90.0    # 中心导流锥体半径
    nose_cone_length: float = 210.0   # 导流锥轴向长度
    filter_ring_radius: float = 420.0 # 环形除尘过滤器外径
    filter_ring_len: float = 120.0    # 除尘环轴向长度
    filter_tube_radius: float = 22.0  # 旋流除尘管孔径
    filter_tube_count: int = 24       # 环向除尘管数量
    intake_duct_len: float = 250.0    # 进气筒体长度
    
    # SOXE 固体氧化物电解池参数
    soxe_center_x: float = -130.0
    soxe_center_y: float = -50.0
    soxe_width_x: float = 380.0       # 单个电解模块 X 向宽度
    soxe_depth_y: float = 380.0       # 单个电解模块 Y 向深度
    soxe_height_z: float = 115.0      # 单个电解模块 Z 向高度
    soxe_stack_count: int = 3         # 堆叠模块层数
    soxe_pitch_z: float = 150.0       # 层间中心距
    soxe_base_z: float = 260.0        # 底层模块中心起始高度
    
    # 萨巴蒂尔主微通道反应器参数
    sabatier_primary_x: float = 360.0
    sabatier_primary_y: float = -40.0
    sabatier_primary_z: float = 540.0
    sabatier_width_x: float = 480.0
    sabatier_depth_y: float = 380.0
    sabatier_height_z: float = 520.0
    honeycomb_window_w: float = 320.0 # 催化视窗宽度
    honeycomb_window_h: float = 320.0 # 催化视窗高度
    
    # 萨巴蒂尔次级柱式反应器参数
    sabatier_sec_x: float = 720.0
    sabatier_sec_y: float = -40.0
    sabatier_sec_z: float = 540.0
    sabatier_sec_radius: float = 220.0
    sabatier_sec_len: float = 380.0
    
    # 压缩与存储参数
    tank_x: float = 1140.0
    tank_y: float = 50.0
    tank_radius: float = 180.0        # 直径 360mm
    tank_cylinder_h: float = 560.0    # 筒体高
    tank_base_z: float = 220.0        # 支腿底部标高
    
    # 配电与控制机柜
    avionics_x: float = 1360.0
    avionics_y: float = -40.0
    avionics_z: float = 320.0


cfg = PlantConfig()


# ==============================================================================
# 2. 真实工程色彩规范 (Engineering Colors)
# ==============================================================================

COLOR_MLI_GOLD = cq.Color(0.88, 0.72, 0.15, 1.0)        # 金色 MLI 多层隔热反射层
COLOR_STEEL_DARK = cq.Color(0.25, 0.27, 0.30, 1.0)      # 重型承重型钢底盘与框架
COLOR_STEEL_MED = cq.Color(0.48, 0.50, 0.53, 1.0)       # 工业设备外壳与支架
COLOR_ALUMINUM = cq.Color(0.78, 0.80, 0.83, 1.0)        # 铝合金导流罩与进气口
COLOR_SOXE_CERAMIC = cq.Color(0.72, 0.74, 0.76, 1.0)    # SOXE 绝热陶瓷/耐温涂层箱体
COLOR_MOTOR_BLUE = cq.Color(0.12, 0.35, 0.58, 1.0)      # 循环泵/电动执行机构工业蓝
COLOR_PIPE_RED_O2 = cq.Color(0.85, 0.20, 0.15, 1.0)     # 高温氧气工艺管道 (Red)
COLOR_PIPE_BLUE_CO2 = cq.Color(0.15, 0.45, 0.85, 1.0)   # CO2 原料进气管 (Blue)
COLOR_PIPE_YELLOW_SYN = cq.Color(0.92, 0.68, 0.12, 1.0) # 合成气/中间重整气 (Yellow)
COLOR_PIPE_CYAN_CH4 = cq.Color(0.12, 0.65, 0.75, 1.0)   # 甲烷燃料产物管路 (Cyan)
COLOR_CATALYST_GLOW = cq.Color(1.0, 0.75, 0.20, 0.9)    # 萨巴蒂尔催化床发光反应核心
COLOR_WINDOW_GLASS = cq.Color(0.35, 0.75, 0.85, 0.5)    # 高压耐热石英观察视窗
COLOR_VALVE_HANDWHEEL = cq.Color(0.85, 0.15, 0.15, 1.0) # 工业截止阀安全红手轮
COLOR_TANK_WHITE = cq.Color(0.78, 0.80, 0.82, 1.0)      # 高压储罐珠光浅灰外壳


# ==============================================================================
# 3. 基础底座与多层绝热系统 (Base Skid & Gold MLI Thermal Skirt)
# ==============================================================================

def create_base_skid(cfg: PlantConfig) -> cq.Compound:
    """
    构建底部多层隔热反射罩 (MLI)、结构型钢底梁、地盘调平承压脚垫与检修走道
    """
    parts = []
    
    # 1. 金色 MLI 隔热梯形斜面裙边
    skirt_bottom = cq.Workplane("XY").rect(cfg.base_length + 80, cfg.base_width + 80)
    skirt_top = skirt_bottom.workplane(offset=cfg.base_height).rect(cfg.base_length, cfg.base_width)
    mli_skirt = skirt_top.loft().translate((cfg.collector_center_x + cfg.base_length * 0.42, 0, 0))
    parts.append(mli_skirt.val())
    
    # 2. 上层重载承重型钢梁底座 (I-Beam / Box Structural Chassis)
    chassis_frame = (
        cq.Workplane("XY")
        .box(cfg.base_length - 40, cfg.base_width - 40, cfg.chassis_beam_h)
        .translate((cfg.collector_center_x + cfg.base_length * 0.42, 0, cfg.base_height + cfg.chassis_beam_h / 2))
    )
    # 掏空中部形成刚性双工字梁纵向槽
    chassis_frame = (
        chassis_frame.faces(">Z").workplane()
        .rarray(xSpacing=cfg.base_length * 0.28, ySpacing=cfg.base_width * 0.45, xCount=3, yCount=2)
        .rect(cfg.base_length * 0.24, cfg.base_width * 0.38)
        .cutBlind(-cfg.chassis_beam_h + 10)
    )
    parts.append(chassis_frame.val())
    
    # 3. 阵列式可调防沉降着陆垫脚 (8 组带球铰底座与调节螺栓)
    x_positions = [-1150, -450, 450, 1350]
    y_positions = [-cfg.base_width / 2 - 20, cfg.base_width / 2 + 20]
    for xp in x_positions:
        for yp in y_positions:
            # 承压圆盘底座
            pad = cq.Workplane("XY").circle(75).extrude(15).translate((xp, yp, -15))
            # 垂直承重支柱与调节螺母
            stem = cq.Workplane("XY").circle(25).extrude(cfg.base_height + 20).translate((xp, yp, 0))
            nut = cq.Workplane("XY").polygon(6, 60).extrude(20).translate((xp, yp, cfg.base_height * 0.4))
            parts.append(pad.val())
            parts.append(stem.val())
            parts.append(nut.val())
            
    # 4. 前端维修引桥通道 (Catwalk & Cable Trunking)
    walkway = (
        cq.Workplane("XY")
        .box(500, 360, 35)
        .translate((cfg.collector_center_x + 100, -cfg.base_width / 2 - 180, cfg.base_height * 0.3))
    )
    # 踏步格栅防滑槽
    walkway = (
        walkway.faces(">Z").workplane()
        .rarray(xSpacing=50, ySpacing=300, xCount=8, yCount=1)
        .rect(20, 280)
        .cutBlind(-15)
    )
    parts.append(walkway.val())
    
    return cq.Compound.makeCompound(parts)


# ==============================================================================
# 4. CO₂ 收集与除尘系统 (CO₂ Collector Subsystem)
# ==============================================================================

def create_co2_collector(cfg: PlantConfig) -> cq.Compound:
    """
    构建大口径抛物面/喇叭吸气罩、流线型中心锥、环形蜂窝旋风除尘滤筒与刚性进气总成
    """
    parts = []
    cx = cfg.collector_center_x
    cz = cfg.collector_center_z
    
    # 1. 喇叭形集气罩 (Revolved Bellmouth Cowl)
    cowl_profile = (
        cq.Workplane("XZ", origin=(cx, 0, cz))
        .moveTo(-cfg.dish_depth, cfg.dish_outer_radius)
        .lineTo(-cfg.dish_depth + 18, cfg.dish_outer_radius)
        .spline([
            (-cfg.dish_depth * 0.45, cfg.dish_outer_radius * 0.75),
            (0, cfg.dish_throat_radius)
        ], includeCurrent=True)
        .lineTo(0, cfg.dish_throat_radius - 14)
        .spline([
            (-cfg.dish_depth * 0.45, cfg.dish_outer_radius * 0.75 - 14),
            (-cfg.dish_depth, cfg.dish_outer_radius - 14)
        ], includeCurrent=True)
        .close()
    )
    cowl = cowl_profile.revolve(360, (0, 0, 0), (1, 0, 0))
    parts.append(cowl.val())
    
    # 喇叭口外缘加固翻边卷唇
    rim_flange = (
        cq.Workplane("YZ", origin=(cx - cfg.dish_depth, 0, cz))
        .circle(cfg.dish_outer_radius + 8)
        .circle(cfg.dish_outer_radius - 16)
        .extrude(20)
    )
    parts.append(rim_flange.val())

    # 2. 中心流线型导流锥体 (Aerodynamic Center Nose Cone)
    cone_profile = (
        cq.Workplane("XZ", origin=(cx, 0, cz))
        .moveTo(-cfg.nose_cone_length, 0)
        .spline([
            (-cfg.nose_cone_length * 0.45, cfg.nose_cone_radius * 0.55),
            (0, cfg.nose_cone_radius)
        ], includeCurrent=True)
        .lineTo(0, 0)
        .close()
    )
    nose_cone = cone_profile.revolve(360, (0, 0, 0), (1, 0, 0))
    parts.append(nose_cone.val())
    
    # 中心前端传感器探头环
    probe_collar = (
        cq.Workplane("YZ", origin=(cx - cfg.nose_cone_length - 25, 0, cz))
        .circle(28)
        .extrude(35)
    )
    parts.append(probe_collar.val())

    # 3. 16 组径向整流定子叶片 (Radial Aerodynamic Stator Vanes)
    vane_count = 16
    for i in range(vane_count):
        angle = 2.0 * math.pi * i / vane_count
        cos_a = math.cos(angle)
        sin_a = math.sin(angle)
        
        r_inner = cfg.nose_cone_radius * 0.85
        r_outer = cfg.dish_outer_radius * 0.90
        vane = (
            cq.Workplane("YZ", origin=(cx - cfg.dish_depth * 0.5, 0, cz))
            .transformed(rotate=(0, 0, math.degrees(angle)))
            .rect(r_outer - r_inner, 8)
            .extrude(cfg.dish_depth * 0.55)
            .translate((0, (r_inner + r_outer) / 2 * cos_a, (r_inner + r_outer) / 2 * sin_a))
        )
        parts.append(vane.val())

    # 4. 环形除尘过滤器筒体与 24 联旋风微孔阵列 (Annular Dust Filtration Ring)
    filter_body = (
        cq.Workplane("YZ", origin=(cx, 0, cz))
        .circle(cfg.filter_ring_radius)
        .circle(cfg.dish_throat_radius)
        .extrude(cfg.filter_ring_len)
    )
    filter_body = (
        filter_body.faces("<X").workplane()
        .polarArray(radius=(cfg.filter_ring_radius + cfg.dish_throat_radius) / 2, startAngle=0, angle=360, count=cfg.filter_tube_count)
        .circle(cfg.filter_tube_radius)
        .cutBlind(-cfg.filter_ring_len * 0.8)
    )
    parts.append(filter_body.val())

    # 5. 进气加压风道圆柱筒身 (Intake Compressor Duct Body)
    duct_start_x = cx + cfg.filter_ring_len
    duct = (
        cq.Workplane("YZ", origin=(duct_start_x, 0, cz))
        .circle(cfg.dish_throat_radius)
        .circle(cfg.dish_throat_radius - 20)
        .extrude(cfg.intake_duct_len)
    )
    ring1 = cq.Workplane("YZ", origin=(duct_start_x + 70, 0, cz)).circle(cfg.dish_throat_radius + 15).extrude(18)
    ring2 = cq.Workplane("YZ", origin=(duct_start_x + 180, 0, cz)).circle(cfg.dish_throat_radius + 15).extrude(18)
    parts.append(duct.val())
    parts.append(ring1.val())
    parts.append(ring2.val())

    # 6. 底座刚性鞍式支撑架 (Saddle Support Legs)
    saddle_h = cz - (cfg.base_height + cfg.chassis_beam_h)
    saddle = (
        cq.Workplane("XY", origin=(duct_start_x + 100, 0, cfg.base_height + cfg.chassis_beam_h))
        .box(180, cfg.dish_throat_radius * 1.8, saddle_h)
        .translate((0, 0, saddle_h / 2))
    )
    saddle = saddle.faces(">Z").workplane().circle(cfg.dish_throat_radius).cutBlind(-saddle_h * 0.5)
    parts.append(saddle.val())

    return cq.Compound.makeCompound(parts)


# ==============================================================================
# 5. SOXE 固体氧化物高温电解系统 (SOXE Subsystem)
# ==============================================================================

def create_soxe_electrolyzer(cfg: PlantConfig) -> cq.Compound:
    """
    构建 3 层叠式高温固体氧化物电解堆、散热肋片、进出气分配歧管与底部循环泵组
    """
    parts = []
    sx = cfg.soxe_center_x
    sy = cfg.soxe_center_y
    
    # 1. 3 层模块化电解电堆箱体 (Stacked SOXE Cell Modules)
    for i in range(cfg.soxe_stack_count):
        cz = cfg.soxe_base_z + i * cfg.soxe_pitch_z
        box_module = (
            cq.Workplane("XY", origin=(sx, sy, cz))
            .box(cfg.soxe_width_x, cfg.soxe_depth_y, cfg.soxe_height_z)
            .edges("|Z").chamfer(15)
        )
        box_module = (
            box_module.faces("<Y").workplane()
            .rect(cfg.soxe_width_x * 0.78, cfg.soxe_height_z * 0.65)
            .cutBlind(-12)
        )
        box_module = (
            box_module.faces(">Z").workplane()
            .rarray(xSpacing=40, ySpacing=cfg.soxe_depth_y * 0.6, xCount=7, yCount=1)
            .rect(14, cfg.soxe_depth_y * 0.65)
            .extrude(15)
        )
        parts.append(box_module.val())
        
        terminal_l = (
            cq.Workplane("YZ", origin=(sx - cfg.soxe_width_x / 2 - 15, sy, cz))
            .rect(cfg.soxe_depth_y * 0.5, 40)
            .extrude(15)
        )
        parts.append(terminal_l.val())

    # 2. 侧向气体分配集管总成 (Manifold Blocks)
    manifold_pipe_x = sx - cfg.soxe_width_x / 2 - 40
    vert_header = (
        cq.Workplane("XY", origin=(manifold_pipe_x, sy - 80, cfg.soxe_base_z - 40))
        .circle(24)
        .extrude(cfg.soxe_stack_count * cfg.soxe_pitch_z + 40)
    )
    parts.append(vert_header.val())
    
    for i in range(cfg.soxe_stack_count):
        cz = cfg.soxe_base_z + i * cfg.soxe_pitch_z
        branch_pipe = (
            cq.Workplane("YZ", origin=(manifold_pipe_x, sy - 80, cz))
            .circle(15)
            .extrude(40)
        )
        parts.append(branch_pipe.val())

    # 3. 底部气体循环机与电动泵机组 (Recirculation Pump & Motor)
    pump_z = cfg.base_height + cfg.chassis_beam_h + 80
    pump_y = sy - cfg.soxe_depth_y / 2 - 80
    
    motor = (
        cq.Workplane("YZ", origin=(sx - 60, pump_y, pump_z))
        .circle(65)
        .extrude(160)
    )
    motor_box = (
        cq.Workplane("XY", origin=(sx + 20, pump_y, pump_z + 65))
        .box(80, 70, 35)
    )
    pump_head = (
        cq.Workplane("YZ", origin=(sx - 110, pump_y, pump_z))
        .circle(85)
        .extrude(50)
    )
    pump_inlet = (
        cq.Workplane("XY", origin=(sx - 85, pump_y, pump_z + 85))
        .circle(25)
        .extrude(40)
    )
    parts.append(motor.val())
    parts.append(motor_box.val())
    parts.append(pump_head.val())
    parts.append(pump_inlet.val())

    # 4. 顶部工业机械压力表 (Dial Pressure Gauges)
    gauge_z = cfg.soxe_base_z + cfg.soxe_stack_count * cfg.soxe_pitch_z + 30
    for gx in [manifold_pipe_x, sx + 50]:
        stem = cq.Workplane("XY", origin=(gx, sy - 80, gauge_z)).circle(10).extrude(45)
        dial_casing = (
            cq.Workplane("XZ", origin=(gx, sy - 80, gauge_z + 80))
            .circle(38)
            .extrude(20)
        )
        dial_bezel = (
            cq.Workplane("XZ", origin=(gx, sy - 90, gauge_z + 80))
            .circle(42)
            .circle(35)
            .extrude(8)
        )
        parts.append(stem.val())
        parts.append(dial_casing.val())
        parts.append(dial_bezel.val())

    return cq.Compound.makeCompound(parts)


# ==============================================================================
# 6. 萨巴蒂尔微通道催化甲烷化反应系统 (Sabatier Reactor Subsystem)
# ==============================================================================

def create_sabatier_reactor(cfg: PlantConfig) -> cq.Compound:
    """
    构建一级微通道蜂窝催化反应室、前置发光视窗、二级柱式加氢反应腔与顶部气液分离冷凝器
    """
    parts = []
    
    # 1. 一级微通道催化反应室
    px = cfg.sabatier_primary_x
    py = cfg.sabatier_primary_y
    pz = cfg.sabatier_primary_z
    
    primary_box = (
        cq.Workplane("XY", origin=(px, py, pz))
        .box(cfg.sabatier_width_x, cfg.sabatier_depth_y, cfg.sabatier_height_z)
        .edges("|Z").fillet(25)
    )
    primary_box = (
        primary_box.faces("<Y").workplane()
        .rect(cfg.honeycomb_window_w, cfg.honeycomb_window_h)
        .cutBlind(-60)
    )
    parts.append(primary_box.val())
    
    window_bezel = (
        cq.Workplane("XZ", origin=(px, py - cfg.sabatier_depth_y / 2 - 12, pz))
        .rect(cfg.honeycomb_window_w + 50, cfg.honeycomb_window_h + 50)
        .rect(cfg.honeycomb_window_w - 20, cfg.honeycomb_window_h - 20)
        .extrude(24)
        .edges("|Y").fillet(10)
    )
    parts.append(window_bezel.val())

    honeycomb_grid = (
        cq.Workplane("XZ", origin=(px, py - cfg.sabatier_depth_y / 2 + 25, pz))
        .rarray(xSpacing=38, ySpacing=34, xCount=7, yCount=7)
        .polygon(6, 32)
        .extrude(20)
    )
    parts.append(honeycomb_grid.val())

    # 2. 顶部冷凝与气液换热分离机组
    top_condenser_z = pz + cfg.sabatier_height_z / 2 + 100
    condenser_box = (
        cq.Workplane("XY", origin=(px, py, top_condenser_z))
        .box(cfg.sabatier_width_x * 0.88, cfg.sabatier_depth_y * 0.82, 190)
        .edges("|Z").chamfer(15)
    )
    vent1 = (
        cq.Workplane("XY", origin=(px - 90, py, top_condenser_z + 95))
        .circle(25).extrude(80)
        .faces(">Z").workplane().circle(38).extrude(18)
    )
    vent2 = (
        cq.Workplane("XY", origin=(px + 90, py, top_condenser_z + 95))
        .circle(25).extrude(80)
        .faces(">Z").workplane().circle(38).extrude(18)
    )
    parts.append(condenser_box.val())
    parts.append(vent1.val())
    parts.append(vent2.val())

    # 3. 二级卧式高温加氢反应腔
    sx = cfg.sabatier_sec_x
    sy = cfg.sabatier_sec_y
    sz = cfg.sabatier_sec_z
    
    sec_cylinder = (
        cq.Workplane("XZ", origin=(sx, sy, sz))
        .circle(cfg.sabatier_sec_radius)
        .extrude(cfg.sabatier_sec_len)
        .translate((0, -cfg.sabatier_sec_len / 2, 0))
    )
    parts.append(sec_cylinder.val())
    
    flange_front = (
        cq.Workplane("XZ", origin=(sx, sy - cfg.sabatier_sec_len / 2 - 10, sz))
        .polygon(8, (cfg.sabatier_sec_radius + 40) * 2)
        .circle(cfg.sabatier_sec_radius * 0.72)
        .extrude(28)
    )
    parts.append(flange_front.val())

    inner_sight = (
        cq.Workplane("XZ", origin=(sx, sy - cfg.sabatier_sec_len / 2 + 10, sz))
        .circle(cfg.sabatier_sec_radius * 0.70)
        .extrude(15)
    )
    parts.append(inner_sight.val())

    # 外围支撑框架立柱
    cage_h = cfg.sabatier_height_z + 60
    cage_w = (cfg.sabatier_sec_x - cfg.sabatier_primary_x) + cfg.sabatier_width_x / 2 + cfg.sabatier_sec_radius + 60
    cage_cx = (cfg.sabatier_primary_x + cfg.sabatier_sec_x) / 2
    
    col_x_offsets = [-cage_w / 2 + 30, cage_w / 2 - 30]
    col_y_offsets = [-cfg.sabatier_depth_y / 2 - 25, cfg.sabatier_depth_y / 2 + 25]
    for cx in col_x_offsets:
        for cy in col_y_offsets:
            col = (
                cq.Workplane("XY", origin=(cage_cx + cx, py + cy, pz - cage_h / 2))
                .box(35, 35, cage_h)
                .translate((0, 0, cage_h / 2))
            )
            parts.append(col.val())

    return cq.Compound.makeCompound(parts)


# ==============================================================================
# 7. 压缩存储与分配总成 (Compression, Storage & Dispensing Subsystem)
# ==============================================================================

def create_compression_and_storage(cfg: PlantConfig) -> cq.Compound:
    """
    构建立式高压储罐、多级冷却压缩机、产物分发阀门站 (氧气/甲烷) 与配电控制柜
    """
    parts = []
    
    # 1. 立式高压储罐
    tx = cfg.tank_x
    ty = cfg.tank_y
    tz_bottom = cfg.tank_base_z
    
    tank_cyl = (
        cq.Workplane("XY", origin=(tx, ty, tz_bottom + 80))
        .circle(cfg.tank_radius)
        .extrude(cfg.tank_cylinder_h)
    )
    parts.append(tank_cyl.val())
    
    dome_center_z = tz_bottom + 80 + cfg.tank_cylinder_h
    tank_dome = (
        cq.Workplane("XZ", origin=(tx, ty, dome_center_z))
        .moveTo(0, 0)
        .lineTo(cfg.tank_radius, 0)
        .radiusArc((0, cfg.tank_radius), cfg.tank_radius)
        .close()
        .revolve(360, (0, 0, 0), (0, 0, 1))
    )
    parts.append(tank_dome.val())

    top_nozzle = (
        cq.Workplane("XY", origin=(tx, ty, dome_center_z + cfg.tank_radius))
        .circle(28).extrude(60)
        .faces(">Z").workplane().circle(48).extrude(15)
        .faces(">Z").workplane().circle(20).extrude(45)
    )
    parts.append(top_nozzle.val())

    skirt = (
        cq.Workplane("XY", origin=(tx, ty, tz_bottom))
        .circle(cfg.tank_radius)
        .circle(cfg.tank_radius - 14)
        .extrude(80)
    )
    parts.append(skirt.val())
    for angle in [45, 135, 225, 315]:
        rad = math.radians(angle)
        gx = tx + (cfg.tank_radius + 20) * math.cos(rad)
        gy = ty + (cfg.tank_radius + 20) * math.sin(rad)
        leg = (
            cq.Workplane("XY", origin=(gx, gy, tz_bottom))
            .box(30, 30, 80)
            .translate((0, 0, 40))
        )
        parts.append(leg.val())

    gauge_tube = (
        cq.Workplane("XY", origin=(tx - cfg.tank_radius - 20, ty - 60, tz_bottom + 160))
        .circle(12)
        .extrude(cfg.tank_cylinder_h * 0.6)
    )
    parts.append(gauge_tube.val())

    # 2. 多级增压机组
    comp_x = tx - 160
    comp_y = ty + 120
    comp_z = tz_bottom + 120
    comp_block = (
        cq.Workplane("XY", origin=(comp_x, comp_y, comp_z))
        .box(240, 220, 200)
        .edges("|Z").fillet(15)
    )
    comp_block = (
        comp_block.faces(">Z").workplane()
        .rarray(xSpacing=70, ySpacing=60, xCount=2, yCount=2)
        .circle(35)
        .extrude(45)
    )
    parts.append(comp_block.val())

    # 3. 产物分发与输出控制站
    # 氧气输出站
    o2_station_x = tx + 180
    o2_station_y = ty - 180
    o2_station_z = tz_bottom + 90
    o2_valve_body = (
        cq.Workplane("XY", origin=(o2_station_x, o2_station_y, o2_station_z))
        .box(60, 60, 60)
    )
    o2_handwheel = (
        cq.Workplane("XZ", origin=(o2_station_x, o2_station_y - 45, o2_station_z))
        .circle(38).circle(26).extrude(12)
    )
    o2_dispense_pipe = (
        cq.Workplane("YZ", origin=(o2_station_x, o2_station_y, o2_station_z))
        .circle(18).extrude(80)
    )
    parts.append(o2_valve_body.val())
    parts.append(o2_handwheel.val())
    parts.append(o2_dispense_pipe.val())

    # 甲烷燃料输出站
    ch4_station_x = cfg.sabatier_sec_x + 160
    ch4_station_y = ty - 220
    ch4_station_z = cfg.base_height + cfg.chassis_beam_h + 30
    ch4_coupler = (
        cq.Workplane("XY", origin=(ch4_station_x, ch4_station_y, ch4_station_z))
        .circle(30).extrude(45)
        .faces(">Z").workplane().circle(45).extrude(18)
    )
    parts.append(ch4_coupler.val())

    # 4. 电气与控制机柜
    ax = cfg.avionics_x
    ay = cfg.avionics_y
    az = cfg.avionics_z
    avionics_box = (
        cq.Workplane("XY", origin=(ax, ay, az))
        .box(260, 280, 340)
        .edges("|Z").fillet(10)
    )
    avionics_box = (
        avionics_box.faces("<Y").workplane()
        .rect(200, 280).cutBlind(-8)
        .faces("<Y").workplane()
        .rarray(xSpacing=160, ySpacing=30, xCount=1, yCount=5)
        .rect(140, 12).cutBlind(-10)
    )
    parts.append(avionics_box.val())

    return cq.Compound.makeCompound(parts)


# ==============================================================================
# 8. 精密工业流体与工艺管网系统 (Precision Piping Network)
# ==============================================================================

def create_piping_network(cfg: PlantConfig) -> Tuple[cq.Compound, cq.Compound, cq.Compound, cq.Compound]:
    """
    构建符合化工色标规范的四重工艺管网链路：
    - red_o2_pipes: 高温纯氧输送与汇流主管路 (High-Temp O2)
    - blue_co2_pipes: 火星二氧化碳增压与进气循环管路 (CO2 Feed & Recycle)
    - yellow_syn_pipes: 合成气重整及热交换循环管路 (Syngas & Intermediate)
    - cyan_ch4_pipes: 产物甲烷冷凝加压输送管路 (Cryo Methane Fuel)
    """
    red_parts = []
    blue_parts = []
    yellow_parts = []
    cyan_parts = []
    
    def make_straight_pipe(p1: Tuple[float, float, float], p2: Tuple[float, float, float], radius: float = 16.0) -> cq.Shape:
        vec = cq.Vector(p2[0] - p1[0], p2[1] - p1[1], p2[2] - p1[2])
        length = vec.Length
        if length < 1e-3:
            return cq.Workplane("XY").box(1,1,1).val()
        axis = vec.normalized()
        cyl = cq.Workplane("XY").circle(radius).extrude(length)
        if abs(axis.z - 1.0) < 1e-4:
            return cyl.translate(cq.Vector(p1[0], p1[1], p1[2])).val()
        elif abs(axis.z + 1.0) < 1e-4:
            return cyl.rotate((0,0,0), (1,0,0), 180).translate(cq.Vector(p1[0], p1[1], p1[2])).val()
        else:
            rot_axis = cq.Vector(0, 0, 1).cross(axis).normalized()
            rot_angle = math.degrees(math.acos(axis.z))
            return cyl.rotate((0,0,0), (rot_axis.x, rot_axis.y, rot_axis.z), rot_angle).translate(cq.Vector(p1[0], p1[1], p1[2])).val()

    def make_flange(pos: Tuple[float, float, float], normal_dir: str = "X", r_pipe: float = 16.0) -> cq.Shape:
        plane_map = {"X": "YZ", "Y": "XZ", "Z": "XY"}
        plane = plane_map.get(normal_dir, "YZ")
        flg = (
            cq.Workplane(plane, origin=pos)
            .circle(r_pipe * 1.75)
            .circle(r_pipe)
            .extrude(14)
        )
        return flg.val()

    def make_inline_valve(pos: Tuple[float, float, float], r_pipe: float = 16.0) -> cq.Shape:
        body = cq.Workplane("XY", origin=pos).box(r_pipe * 2.5, r_pipe * 2.5, r_pipe * 2.8)
        bonnet = cq.Workplane("XY", origin=(pos[0], pos[1], pos[2] + r_pipe * 1.4)).circle(r_pipe * 0.75).extrude(35)
        handwheel = (
            cq.Workplane("XY", origin=(pos[0], pos[1], pos[2] + r_pipe * 1.4 + 35))
            .circle(r_pipe * 1.8).circle(r_pipe * 1.2).extrude(10)
        )
        return cq.Compound.makeCompound([body.val(), bonnet.val(), handwheel.val()])

    # 1. 🔴 红色管网：SOXE 高温氧气输出链路
    p_o2_start = (cfg.soxe_center_x + cfg.soxe_width_x / 2 + 30, cfg.soxe_center_y - 80, cfg.soxe_base_z + 2 * cfg.soxe_pitch_z)
    p_o2_up = (p_o2_start[0], p_o2_start[1], 830.0)
    p_o2_mid1 = (cfg.sabatier_primary_x - 120, p_o2_start[1], 830.0)
    p_o2_mid2 = (cfg.sabatier_sec_x + 80, p_o2_start[1], 830.0)
    p_o2_tank = (cfg.tank_x - 80, cfg.tank_y - 80, 830.0)
    p_o2_tank_in = (cfg.tank_x - 80, cfg.tank_y - 80, 680.0)
    
    red_parts.append(make_straight_pipe(p_o2_start, p_o2_up, radius=18))
    red_parts.append(make_straight_pipe(p_o2_up, p_o2_mid1, radius=18))
    red_parts.append(make_straight_pipe(p_o2_mid1, p_o2_mid2, radius=18))
    red_parts.append(make_straight_pipe(p_o2_mid2, p_o2_tank, radius=18))
    red_parts.append(make_straight_pipe(p_o2_tank, p_o2_tank_in, radius=18))
    red_parts.append(make_flange(p_o2_mid1, normal_dir="X", r_pipe=18))
    red_parts.append(make_flange(p_o2_mid2, normal_dir="X", r_pipe=18))
    red_parts.append(make_inline_valve((p_o2_mid1[0] + 120, p_o2_mid1[1], p_o2_mid1[2]), r_pipe=18))

    # 2. 🔵 蓝色管网：CO₂ 原料进气与循环管路
    p_co2_in = (cfg.collector_center_x + cfg.filter_ring_len + 80, -cfg.dish_throat_radius + 40, cfg.collector_center_z - 150)
    p_co2_down = (p_co2_in[0], p_co2_in[1], 220.0)
    p_co2_pump = (cfg.soxe_center_x - 110, cfg.soxe_center_y - 180, 220.0)
    p_co2_feed1 = (cfg.soxe_center_x + 60, cfg.soxe_center_y - 180, 220.0)
    p_co2_feed2 = (cfg.sabatier_primary_x - 60, cfg.sabatier_primary_y - 180, 220.0)
    p_co2_feed3 = (cfg.sabatier_sec_x, cfg.sabatier_sec_y - 180, 220.0)
    
    blue_parts.append(make_straight_pipe(p_co2_in, p_co2_down, radius=22))
    blue_parts.append(make_straight_pipe(p_co2_down, p_co2_pump, radius=22))
    blue_parts.append(make_straight_pipe(p_co2_pump, p_co2_feed1, radius=20))
    blue_parts.append(make_straight_pipe(p_co2_feed1, p_co2_feed2, radius=20))
    blue_parts.append(make_straight_pipe(p_co2_feed2, p_co2_feed3, radius=20))
    
    p_soxe_branch_top = (p_co2_feed1[0], p_co2_feed1[1], cfg.soxe_base_z + cfg.soxe_pitch_z)
    blue_parts.append(make_straight_pipe(p_co2_feed1, p_soxe_branch_top, radius=16))
    blue_parts.append(make_flange(p_co2_pump, normal_dir="X", r_pipe=22))
    blue_parts.append(make_flange(p_co2_feed2, normal_dir="X", r_pipe=20))
    blue_parts.append(make_inline_valve((p_co2_feed2[0] - 80, p_co2_feed2[1], p_co2_feed2[2]), r_pipe=20))

    # 3. 🟡 黄色管网：合成气与中间循环重整管路
    p_syn_start = (cfg.soxe_center_x + cfg.soxe_width_x / 2 + 10, cfg.soxe_center_y + 40, cfg.soxe_base_z + 100)
    p_syn_top = (p_syn_start[0], p_syn_start[1], 780.0)
    p_syn_cross = (cfg.sabatier_primary_x - 100, p_syn_start[1], 780.0)
    p_syn_drop = (cfg.sabatier_primary_x - 100, cfg.sabatier_primary_y + 80, 620.0)
    
    yellow_parts.append(make_straight_pipe(p_syn_start, p_syn_top, radius=15))
    yellow_parts.append(make_straight_pipe(p_syn_top, p_syn_cross, radius=15))
    yellow_parts.append(make_straight_pipe(p_syn_cross, p_syn_drop, radius=15))
    yellow_parts.append(make_flange(p_syn_top, normal_dir="Z", r_pipe=15))
    yellow_parts.append(make_inline_valve(p_syn_cross, r_pipe=15))

    # 4. 🟢/🔷 青蓝管网：低温甲烷燃料输出管路
    p_ch4_top = (cfg.sabatier_sec_x + 80, cfg.sabatier_sec_y - 120, 620.0)
    p_ch4_down = (p_ch4_top[0], p_ch4_top[1], 180.0)
    p_ch4_out = (cfg.sabatier_sec_x + 160, cfg.tank_y - 220, 180.0)
    
    cyan_parts.append(make_straight_pipe(p_ch4_top, p_ch4_down, radius=16))
    cyan_parts.append(make_straight_pipe(p_ch4_down, p_ch4_out, radius=16))
    cyan_parts.append(make_flange(p_ch4_top, normal_dir="Y", r_pipe=16))
    cyan_parts.append(make_inline_valve((p_ch4_down[0], p_ch4_down[1] - 40, p_ch4_down[2]), r_pipe=16))

    return (
        cq.Compound.makeCompound(red_parts),
        cq.Compound.makeCompound(blue_parts),
        cq.Compound.makeCompound(yellow_parts),
        cq.Compound.makeCompound(cyan_parts)
    )


# ==============================================================================
# 9. 顶级装配体组织与色彩装配 (Top-Level Assembly & Hierarchical Organization)
# ==============================================================================

def build_mars_isru_plant(cfg: PlantConfig = cfg) -> cq.Assembly:
    """
    构建完整的火星原位制氧与燃料合成装置装配体，并赋予工程级着色
    """
    plant_assy = cq.Assembly(name="Mars_ISRU_Plant")
    
    print("[1/6] 正在构建多层绝热保护底盘 (Base Skid & Gold MLI)...")
    skid_geo = create_base_skid(cfg)
    plant_assy.add(skid_geo, name="Base_Skid_MLI", color=COLOR_MLI_GOLD)
    
    print("[2/6] 正在构建 CO2 收集与除尘系统 (CO2 Collector Subsystem)...")
    collector_geo = create_co2_collector(cfg)
    plant_assy.add(collector_geo, name="CO2_Collector", color=COLOR_ALUMINUM)
    
    print("[3/6] 正在构建 SOXE 固体氧化物高温电解堆 (SOXE Subsystem)...")
    soxe_geo = create_soxe_electrolyzer(cfg)
    plant_assy.add(soxe_geo, name="SOXE_Electrolyzer", color=COLOR_SOXE_CERAMIC)
    
    print("[4/6] 正在构建萨巴蒂尔催化甲烷化反应系统 (Sabatier Reactor Subsystem)...")
    sabatier_geo = create_sabatier_reactor(cfg)
    plant_assy.add(sabatier_geo, name="Sabatier_Reactor", color=COLOR_STEEL_MED)
    
    print("[5/6] 正在构建压缩存储与分配总成 (Compression & Storage Subsystem)...")
    storage_geo = create_compression_and_storage(cfg)
    plant_assy.add(storage_geo, name="Compression_Storage", color=COLOR_TANK_WHITE)
    
    print("[6/6] 正在构建精密工业彩色工艺管网 (Color-Coded Piping Network)...")
    pipe_red, pipe_blue, pipe_yellow, pipe_cyan = create_piping_network(cfg)
    plant_assy.add(pipe_red, name="Piping_O2_Red", color=COLOR_PIPE_RED_O2)
    plant_assy.add(pipe_blue, name="Piping_CO2_Blue", color=COLOR_PIPE_BLUE_CO2)
    plant_assy.add(pipe_yellow, name="Piping_Syngas_Yellow", color=COLOR_PIPE_YELLOW_SYN)
    plant_assy.add(pipe_cyan, name="Piping_CH4_Cyan", color=COLOR_PIPE_CYAN_CH4)
    
    return plant_assy


# ==============================================================================
# 10. 主入口与导出逻辑 (Execution Entrypoint & Export)
# ==============================================================================

# 构建顶级装配体
plant_assembly = build_mars_isru_plant(cfg)

# 兼容导出与 CadQuery 工作流变量
model = plant_assembly
result = plant_assembly

if __name__ == "__main__":
    import os
    print("装配体构建完成，正在检查复合实体...")
    compound_shape = plant_assembly.toCompound()
    bbox = compound_shape.BoundingBox()
    volume_liters = compound_shape.Volume() / 1e6
    print(f"B-Rep 实体几何校验成功:")
    print(f" - 包围盒尺寸: X={bbox.xlen:.1f}mm, Y={bbox.ylen:.1f}mm, Z={bbox.zlen:.1f}mm")
    print(f" - 实体总体积: {volume_liters:.2f} L")
    
    step_filename = "mars_isru_plant.step"
    stl_filename = "mars_isru_plant.stl"
    
    print(f"正在导出高保真无损 STEP 实体装配体: {step_filename} ...")
    try:
        plant_assembly.save(step_filename)
        print(f" -> STEP 装配体已保存: {os.path.abspath(step_filename)}")
    except Exception as e:
        print(f"保存 STEP 异常: {e}, 尝试以 Compound 格式备用导出...")
        cq.exporters.export(compound_shape, step_filename)
        print(f" -> STEP Compound 已保存: {os.path.abspath(step_filename)}")

    print(f"正在导出 3D 打印与视口渲染 STL 网格文件: {stl_filename} ...")
    try:
        cq.exporters.export(compound_shape, stl_filename, tolerance=0.1, angularTolerance=0.2)
        print(f" -> STL 网格已保存: {os.path.abspath(stl_filename)}")
    except Exception as e:
        print(f"保存 STL 异常: {e}")
        
    print("全部工程链路构建与导出流程顺利完成！")
