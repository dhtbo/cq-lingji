"""
LogoUp3D 核心几何建模与三维海龟引擎 (LogoUp 3D Engine for build123d)
为青少年创客与非专业用户提供极其直观、无专业认知负担的 3D 积木造型体验。
基于 OpenCASCADE 7.7 与 build123d 工业级 B-Rep 内核驱动。
"""

from __future__ import annotations
import math
from typing import List, Tuple, Optional, Any, Dict
import build123d as b3d
from build123d import Vector, Plane, Location, Color, Compound, Solid, Face, Wire, Edge


def _rot_vector(v: Vector, axis: Vector, deg: float) -> Vector:
    """罗德里格斯旋转公式 (Rodrigues' rotation formula)"""
    rad = math.radians(deg)
    k = axis.normalized()
    c = math.cos(rad)
    s = math.sin(rad)
    return v * c + k.cross(v) * s + k * (k.dot(v)) * (1.0 - c)


class Pose:
    """游标三维位姿 (位置 + 前进方向 + 天顶方向 + 横向方向)"""
    def __init__(self, pos: Vector, heading: Vector, up: Vector):
        self.pos = Vector(pos)
        self.heading = Vector(heading).normalized()
        self.up_dir = Vector(up).normalized()
        self.right = self.heading.cross(self.up_dir).normalized()

    def clone(self) -> Pose:
        return Pose(self.pos, self.heading, self.up_dir)


class LogoUp3D:
    """
    LogoUp 3D 造型主控器
    统一管理空间游标、草图绘制流、实体构建流、布尔差集扣除与姿态栈。
    """
    def __init__(self):
        self.reset()

    def reset(self) -> LogoUp3D:
        """重置游标与构建状态到世界原点与初始坐标系"""
        # 初始世界姿态：位于原点，朝向 +Y 轴，天顶 +Z 轴，右向 +X 轴
        self.pos = Vector(0.0, 0.0, 0.0)
        self.heading = Vector(0.0, 1.0, 0.0)
        self.up_dir = Vector(0.0, 0.0, 1.0)
        self.right = Vector(1.0, 0.0, 0.0)

        # 2D 绘图平面状态
        self.is_drawing: bool = False
        self.pen_width: float = 1.0
        self.is_erase_mode: bool = False
        self.current_path_points: List[Vector] = []
        self.current_sketch_faces: List[Any] = []
        self.last_sketch_face: Optional[Any] = None

        # 3D 实体构建状态
        self.current_color: str = "#3b82f6"
        self.subtract_mode: bool = False
        self.solids: List[Any] = []

        # 位姿堆栈 (PUSH / POP)
        self.state_stack: List[Dict[str, Any]] = []

        return self

    def __enter__(self) -> LogoUp3D:
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        pass

    @property
    def current_plane(self) -> Plane:
        """获取当前游标所在的草图切向工作平面 (XY 对应 right / heading, Z 对应 up_dir)"""
        return Plane(origin=self.pos, x_dir=self.right, z_dir=self.up_dir)

    # =========================================================================
    # 1. 控制流程与状态栈 (PUSH / POP)
    # =========================================================================

    def push(self) -> LogoUp3D:
        """存储当前坐标与姿态 (PUSH)"""
        state = {
            "pos": Vector(self.pos),
            "heading": Vector(self.heading),
            "up_dir": Vector(self.up_dir),
            "right": Vector(self.right),
            "is_drawing": self.is_drawing,
            "subtract_mode": self.subtract_mode,
            "current_color": self.current_color,
        }
        self.state_stack.append(state)
        return self

    def pop(self) -> LogoUp3D:
        """恢复上次存储的坐标与姿态 (POP)"""
        if not self.state_stack:
            return self
        state = self.state_stack.pop()
        self.pos = state["pos"]
        self.heading = state["heading"]
        self.up_dir = state["up_dir"]
        self.right = state["right"]
        self.is_drawing = state["is_drawing"]
        self.subtract_mode = state["subtract_mode"]
        self.current_color = state["current_color"]
        return self

    # =========================================================================
    # 2. 平面绘图 (Plane Drawing)
    # =========================================================================

    def draw(self) -> LogoUp3D:
        """开始落笔绘图 (DRAW)"""
        self.is_drawing = True
        self.current_path_points = [Vector(0.0, 0.0, 0.0)]
        return self

    def go(self, distance: float) -> LogoUp3D:
        """向前移动 (GO) 指定距离 (毫米)"""
        d = float(distance)
        # 在当前草图平面内沿 heading 方向移动
        self.pos = self.pos + self.heading * d
        if self.is_drawing:
            # 记录相对于当前草图原点的投影坐标
            local_p = self.current_plane.to_local_coords(self.pos)
            self.current_path_points.append(local_p)
        return self

    def turn(self, deg: float) -> LogoUp3D:
        """顺时针旋转 (TURN) ↷ 指定角度 (度)"""
        # 顺时针旋转：绕当前 up 轴负向旋转
        angle = float(deg)
        self.heading = _rot_vector(self.heading, self.up_dir, -angle).normalized()
        self.right = self.heading.cross(self.up_dir).normalized()
        return self

    def turn_left(self, deg: float) -> LogoUp3D:
        """逆时针左转 (TURNLEFT) ↺ 指定角度 (度)"""
        return self.turn(-deg)

    def goto(self, x: float, y: float) -> LogoUp3D:
        """移动到当前草平面的局部坐标 (GOTO)"""
        lx, ly = float(x), float(y)
        self.pos = self.current_plane.to_world_coords(Vector(lx, ly, 0.0))
        if self.is_drawing:
            self.current_path_points.append(Vector(lx, ly, 0.0))
        return self

    def close(self) -> LogoUp3D:
        """回到笔划起点 (CLOSE)"""
        if self.is_drawing and len(self.current_path_points) > 2:
            start_p = self.current_path_points[0]
            self.current_path_points.append(start_p)
            self.pos = self.current_plane.to_world_coords(start_p)
        return self

    def done(self) -> LogoUp3D:
        """完成当前图形 (DONE) 并生成闭合二维截面"""
        if self.is_drawing and len(self.current_path_points) >= 3:
            try:
                # 在局部平面构建 Polyline 线框并填充面
                pts = [(p.X, p.Y) for p in self.current_path_points]
                if pts[0] != pts[-1]:
                    pts.append(pts[0])
                poly = b3d.Polyline(pts)
                f = b3d.make_face(poly)
                # 定位到世界平面
                world_face = self.current_plane * f
                self.current_sketch_faces.append(world_face)
                self.last_sketch_face = world_face
            except Exception:
                pass
        self.is_drawing = False
        self.current_path_points = []
        return self

    def fill(self) -> LogoUp3D:
        """填充上笔的环 (FILL)"""
        return self.done()

    def width(self, w: float) -> LogoUp3D:
        """笔画宽度 (WIDTH)"""
        self.pen_width = max(0.1, float(w))
        return self

    def clear(self) -> LogoUp3D:
        """清空重置草图 (CLEAR)"""
        self.current_path_points = []
        self.current_sketch_faces = []
        self.last_sketch_face = None
        self.is_drawing = False
        return self

    def home(self) -> LogoUp3D:
        """回到原点 (HOME)"""
        self.pos = Vector(0.0, 0.0, 0.0)
        self.heading = Vector(0.0, 1.0, 0.0)
        self.up_dir = Vector(0.0, 0.0, 1.0)
        self.right = Vector(1.0, 0.0, 0.0)
        return self

    def erase(self, enable: bool = True) -> LogoUp3D:
        """笔擦模式 (ERASE)"""
        self.is_erase_mode = bool(enable)
        return self

    # =========================================================================
    # 3. 平面进阶 (Plane Advanced)
    # =========================================================================

    def turnto(self, deg: float) -> LogoUp3D:
        """旋转到指定方位角 (TURNTO)"""
        base_h = Vector(0.0, 1.0, 0.0)
        self.heading = _rot_vector(base_h, self.up_dir, -float(deg)).normalized()
        self.right = self.heading.cross(self.up_dir).normalized()
        return self

    def setx(self, x: float) -> LogoUp3D:
        """设置 X 坐标 (SETX) 为指定数值"""
        self.pos = Vector(float(x), self.pos.Y, self.pos.Z)
        return self

    def sety(self, y: float) -> LogoUp3D:
        """设置 Y 坐标 (SETY) 为指定数值"""
        self.pos = Vector(self.pos.X, float(y), self.pos.Z)
        return self

    def getx(self) -> float:
        """X 坐标值 (GETX)"""
        return round(self.pos.X, 3)

    def gety(self) -> float:
        """Y 坐标值 (GETY)"""
        return round(self.pos.Y, 3)

    def geth(self) -> float:
        """当前朝向方位角 (GETH)"""
        rad = math.atan2(self.heading.X, self.heading.Y)
        return round(math.degrees(rad) % 360.0, 2)

    def offset_path(self, amount: float) -> LogoUp3D:
        """笔画偏移 (OFFSET)"""
        if self.last_sketch_face is not None:
            try:
                self.last_sketch_face = b3d.offset(self.last_sketch_face, amount=float(amount))
            except Exception:
                pass
        return self

    def clear_sketch(self) -> LogoUp3D:
        """仅清空草图 (CLEARSKETCH)"""
        return self.clear()

    def txtstamp(self, text: str, size: float = 10.0, font: str = "Arial") -> LogoUp3D:
        """文字印章 (TXTSTAMP)"""
        try:
            txt_face = b3d.Text(text=text, font_size=float(size), font=font)
            world_face = self.current_plane * txt_face
            self.current_sketch_faces.append(world_face)
            self.last_sketch_face = world_face
        except Exception:
            pass
        return self

    # =========================================================================
    # 4. 平面构件 (2D Components)
    # =========================================================================

    def _add_2d_shape(self, shape_2d: Any) -> LogoUp3D:
        """将 2D 形状依附于当前工作平面并设为待拉伸几何体"""
        world_shape = self.current_plane * shape_2d
        self.current_sketch_faces.append(world_shape)
        self.last_sketch_face = world_shape
        return self

    def polygon(self, sides: int, radius: float) -> LogoUp3D:
        """多边形 边数 [sides] 外接圆半径 [radius]"""
        n = max(3, int(sides))
        r = max(0.1, float(radius))
        return self._add_2d_shape(b3d.RegularPolygon(radius=r, side_count=n))

    def circle(self, radius: float) -> LogoUp3D:
        """圆 半径 [radius]"""
        return self._add_2d_shape(b3d.Circle(radius=max(0.1, float(radius))))

    def rect(self, length: float, width: float) -> LogoUp3D:
        """矩形 长 [length] 宽 [width]"""
        return self._add_2d_shape(b3d.Rectangle(width=float(length), height=float(width)))

    def square(self, size: float) -> LogoUp3D:
        """正方形 边长 [size]"""
        return self.rect(size, size)

    def rounded_rect(self, length: float, width: float, radius: float) -> LogoUp3D:
        """圆角矩形 长 [length] 宽 [width] 倒角半径 [radius]"""
        l = max(0.2, float(length))
        w = max(0.2, float(width))
        max_r = min(l, w) * 0.49
        safe_r = max(0.01, min(float(radius), max_r))
        return self._add_2d_shape(b3d.RectangleRounded(width=l, height=w, radius=safe_r))

    def rounded_square(self, size: float, radius: float) -> LogoUp3D:
        """圆角方形 边长 [size] 倒角半径 [radius]"""
        return self.rounded_rect(size, size, radius)

    def ellipse(self, a: float, b: float) -> LogoUp3D:
        """椭圆 半长径 [a] 半短径 [b]"""
        return self._add_2d_shape(b3d.Ellipse(x_radius=float(a), y_radius=float(b)))

    def star(self, num_points: int, outer_radius: float, inner_radius: Optional[float] = None) -> LogoUp3D:
        """星形 角数 [num_points] 外接圆半径 [outer_radius]"""
        n = max(3, int(num_points))
        ro = max(0.2, float(outer_radius))
        ri = float(inner_radius) if inner_radius is not None else ro * 0.45
        pts = []
        for i in range(2 * n):
            ang = i * (math.pi / n) - math.pi / 2.0
            r_cur = ro if i % 2 == 0 else ri
            pts.append((r_cur * math.cos(ang), r_cur * math.sin(ang)))
        pts.append(pts[0])
        star_poly = b3d.Polyline(pts)
        return self._add_2d_shape(b3d.make_face(star_poly))

    def five_star(self, outer_radius: float) -> LogoUp3D:
        """五角星 外接圆半径 [outer_radius]"""
        return self.star(5, outer_radius)

    def six_star(self, outer_radius: float) -> LogoUp3D:
        """六角星 外接圆半径 [outer_radius]"""
        return self.star(6, outer_radius)

    def four_star(self, outer_radius: float) -> LogoUp3D:
        """四芒星 外接圆半径 [outer_radius]"""
        return self.star(4, outer_radius, inner_radius=float(outer_radius) * 0.25)

    def egg(self, rx: float, ry: float) -> LogoUp3D:
        """蛋形 (卵形线) 半横径 [rx] 半纵径 [ry]"""
        # 卵形几何：上圆小、下圆大的平滑复合椭圆
        rx_val, ry_val = float(rx), float(ry)
        pts = []
        steps = 60
        for i in range(steps + 1):
            theta = 2.0 * math.pi * i / steps
            k = 1.0 + 0.25 * math.sin(theta)
            px = rx_val * math.cos(theta) * k
            py = ry_val * math.sin(theta)
            pts.append((px, py))
        poly = b3d.Polyline(pts)
        return self._add_2d_shape(b3d.make_face(poly))

    def spirograph(self, R: float, r: float, d: float, angle_deg: float = 1080) -> LogoUp3D:
        """万花尺线 (Spirograph) 外径 [R] 内径 [r] 偏移 [d] 角度 [angle_deg]"""
        R_val = float(R)
        r_val = max(0.1, float(r))
        d_val = float(d)
        max_ang = math.radians(float(angle_deg))
        pts = []
        steps = int(angle_deg / 5.0) + 1
        for i in range(steps + 1):
            t = max_ang * i / steps
            x = (R_val - r_val) * math.cos(t) + d_val * math.cos((R_val - r_val) * t / r_val)
            y = (R_val - r_val) * math.sin(t) - d_val * math.sin((R_val - r_val) * t / r_val)
            pts.append((x, y))
        pts.append(pts[0])
        poly = b3d.Polyline(pts)
        return self._add_2d_shape(b3d.make_face(poly))

    # =========================================================================
    # 5. 三维绘图与游标空间控制 (3D Drawing & Cursor)
    # =========================================================================

    def up(self, distance: float) -> LogoUp3D:
        """向上移动 (UP) [distance] 毫米 (沿当前天顶法向移动)"""
        d = float(distance)
        self.pos = self.pos + self.up_dir * d
        return self

    def jump(self, distance: float) -> LogoUp3D:
        """向上跳跃 (JUMP) [distance] 毫米 (别名)"""
        return self.up(distance)

    def body(self) -> LogoUp3D:
        """开始三维实体 (BODY)"""
        self.current_sketch_faces = []
        self.last_sketch_face = None
        return self

    def color(self, color_name: str) -> LogoUp3D:
        """实体颜色 (COLOR) 设置"""
        color_map = {
            "品红": "#ec4899",
            "品红色": "#ec4899",
            "红色": "#ef4444",
            "蓝色": "#3b82f6",
            "绿色": "#10b981",
            "黄色": "#eab308",
            "紫色": "#8b5cf6",
            "橙色": "#f97316",
            "青色": "#06b6d4",
            "黑色": "#334155",
            "白色": "#f8fafc",
            "翠绿": "#10b981",
            "翡翠绿": "#10b981",
        }
        self.current_color = color_map.get(color_name, color_name)
        return self

    def yaw(self, deg: float) -> LogoUp3D:
        """水平方向摆动 (YAW) [deg] 度 (绕当前 up 轴偏航旋转)"""
        return self.turn(deg)

    def pitch(self, deg: float) -> LogoUp3D:
        """俯仰角度摆动 (PITCH) [deg] 度 (绕横轴 right 俯仰)"""
        angle = float(deg)
        self.heading = _rot_vector(self.heading, self.right, angle).normalized()
        self.up_dir = self.right.cross(self.heading).normalized()
        return self

    def roll(self, deg: float) -> LogoUp3D:
        """绕自身旋转 (ROLL) [deg] 度 (绕 heading 轴滚转)"""
        angle = float(deg)
        self.up_dir = _rot_vector(self.up_dir, self.heading, angle).normalized()
        self.right = self.heading.cross(self.up_dir).normalized()
        return self

    def move(self, dx: float, dy: float, dz: float) -> LogoUp3D:
        """三维游标坐标增加 (MOVE) [dx, dy, dz] 毫米"""
        self.pos = self.pos + Vector(float(dx), float(dy), float(dz))
        return self

    def moveto(self, x: float, y: float, z: float) -> LogoUp3D:
        """三维游标移动到 (MOVETO) 指定绝对坐标"""
        self.pos = Vector(float(x), float(y), float(z))
        return self

    def shift(self, dx: float, dy: float) -> LogoUp3D:
        """草平面平移 (SHIFT) [dx, dy] 毫米"""
        self.pos = self.pos + self.right * float(dx) + self.heading * float(dy)
        return self

    def subtract(self, enable: bool = True) -> LogoUp3D:
        """抠除模式 (SUBTRACT) [启用 ▾ / 停用 ▾]"""
        self.subtract_mode = bool(enable)
        return self

    # =========================================================================
    # 6. 三维进阶：拉伸、布尔与高级成型 (3D Advanced)
    # =========================================================================

    def _integrate_solid(self, solid_obj: Any) -> LogoUp3D:
        """将新生成的 Solid 融入当前实体库（处理布尔差集或并集）"""
        if solid_obj is None:
            return self
        try:
            solid_obj.color = Color(self.current_color)
        except Exception:
            pass

        if self.subtract_mode:
            # 抠除模式：从前置所有实体中切除该实体
            if not self.solids:
                return self
            combined = self.solids[0] if len(self.solids) == 1 else Compound(children=self.solids)
            try:
                cut_res = combined - solid_obj
                self.solids = [cut_res]
            except Exception:
                pass
        else:
            self.solids.append(solid_obj)
        return self

    def extrude(self, height: float) -> LogoUp3D:
        """拉伸 (EXTRUDE) 高 [height] 毫米"""
        h = float(height)
        if self.last_sketch_face is not None and abs(h) > 1e-4:
            try:
                solid = b3d.extrude(self.last_sketch_face, amount=h)
                self._integrate_solid(solid)
            except Exception:
                pass
        return self

    def cextrude(self, height: float) -> LogoUp3D:
        """双向拉伸 (CEXTRUDE) 高 [height] 毫米 (中心对称拉伸)"""
        h = float(height)
        if self.last_sketch_face is not None and abs(h) > 1e-4:
            try:
                solid = b3d.extrude(self.last_sketch_face, amount=h / 2.0, both=True)
                self._integrate_solid(solid)
            except Exception:
                pass
        return self

    def pyramid(self, height: float) -> LogoUp3D:
        """锥拉伸 (PYRAMID) 高 [height] 毫米"""
        h = float(height)
        if self.last_sketch_face is not None and abs(h) > 1e-4:
            try:
                solid = b3d.extrude(self.last_sketch_face, amount=h, taper=15)
                self._integrate_solid(solid)
            except Exception:
                pass
        return self

    def cave(self, depth: float) -> LogoUp3D:
        """挖槽 (CAVE) 深 [depth] 毫米 (向内反向切除)"""
        d = float(depth)
        if self.last_sketch_face is not None and abs(d) > 1e-4:
            try:
                tool_solid = b3d.extrude(self.last_sketch_face, amount=-d)
                if self.solids:
                    combined = self.solids[0] if len(self.solids) == 1 else Compound(children=self.solids)
                    self.solids = [combined - tool_solid]
            except Exception:
                pass
        return self

    def scale(self, factor: float) -> LogoUp3D:
        """草图缩放至 (SCALE) 指定倍数"""
        f = float(factor)
        if self.last_sketch_face is not None and abs(f) > 1e-4:
            try:
                self.last_sketch_face = b3d.scale(self.last_sketch_face, by=f)
            except Exception:
                pass
        return self

    # =========================================================================
    # 7. 三维构件 (3D Components / Primitives)
    # =========================================================================

    def box(self, length: float, width: float, height: float) -> LogoUp3D:
        """长方体 长 [length] 宽 [width] 高 [height]"""
        l, w, h = float(length), float(width), float(height)
        b = b3d.Box(l, w, h)
        world_box = self.current_plane * b
        return self._integrate_solid(world_box)

    def cylinder(self, radius: float, height: float) -> LogoUp3D:
        """圆柱 半径 [radius] 高 [height]"""
        r, h = max(0.1, float(radius)), float(height)
        cyl = b3d.Cylinder(radius=r, height=h)
        world_cyl = self.current_plane * cyl
        return self._integrate_solid(world_cyl)

    def sphere(self, radius: float) -> LogoUp3D:
        """球体 半径 [radius]"""
        r = max(0.1, float(radius))
        sph = b3d.Sphere(radius=r).locate(Location(self.pos))
        return self._integrate_solid(sph)

    def pyramid_solid(self, sides: int, radius: float, height: float) -> LogoUp3D:
        """棱锥 边数 [sides] 半径 [radius] 高 [height]"""
        n = max(3, int(sides))
        r, h = max(0.1, float(radius)), float(height)
        base_poly = b3d.RegularPolygon(radius=r, side_count=n)
        pyr = b3d.extrude(base_poly, amount=h, taper=30)
        world_pyr = self.current_plane * pyr
        return self._integrate_solid(world_pyr)

    def torus(self, major_radius: float, minor_radius: float) -> LogoUp3D:
        """圆环 大圆半径 [major_radius] 小圆半径 [minor_radius]"""
        r1, r2 = max(0.2, float(major_radius)), max(0.1, float(minor_radius))
        t = b3d.Torus(major_radius=r1, minor_radius=r2)
        world_torus = self.current_plane * t
        return self._integrate_solid(world_torus)

    # =========================================================================
    # 8. 导出最终 3D 几何实体 (给沙箱与 Three.js 视口)
    # =========================================================================

    def to_part(self) -> Any:
        """输出最终装配成的 3D Solid / Compound"""
        if not self.solids:
            if self.current_sketch_faces:
                return self.current_sketch_faces[-1]
            return b3d.Sphere(radius=1.0).locate(Location(self.pos))
        if len(self.solids) == 1:
            return self.solids[0]
        return Compound(children=self.solids)

    @property
    def part(self) -> Any:
        return self.to_part()


# =============================================================================
# 全局默认单例与过程式快捷函数 (供极简代码与积木生成器使用)
# =============================================================================

_DEFAULT_LOGOUP = LogoUp3D()

def get_default_logoup() -> LogoUp3D:
    return _DEFAULT_LOGOUP

def reset() -> LogoUp3D:
    return _DEFAULT_LOGOUP.reset()

def push() -> LogoUp3D:
    return _DEFAULT_LOGOUP.push()

def pop() -> LogoUp3D:
    return _DEFAULT_LOGOUP.pop()

def draw() -> LogoUp3D:
    return _DEFAULT_LOGOUP.draw()

def go(distance: float) -> LogoUp3D:
    return _DEFAULT_LOGOUP.go(distance)

def turn(deg: float) -> LogoUp3D:
    return _DEFAULT_LOGOUP.turn(deg)

def turn_left(deg: float) -> LogoUp3D:
    return _DEFAULT_LOGOUP.turn_left(deg)

def goto(x: float, y: float) -> LogoUp3D:
    return _DEFAULT_LOGOUP.goto(x, y)

def close() -> LogoUp3D:
    return _DEFAULT_LOGOUP.close()

def done() -> LogoUp3D:
    return _DEFAULT_LOGOUP.done()

def fill() -> LogoUp3D:
    return _DEFAULT_LOGOUP.fill()

def width(w: float) -> LogoUp3D:
    return _DEFAULT_LOGOUP.width(w)

def clear() -> LogoUp3D:
    return _DEFAULT_LOGOUP.clear()

def home() -> LogoUp3D:
    return _DEFAULT_LOGOUP.home()

def erase(enable: bool = True) -> LogoUp3D:
    return _DEFAULT_LOGOUP.erase(enable)

def turnto(deg: float) -> LogoUp3D:
    return _DEFAULT_LOGOUP.turnto(deg)

def setx(x: float) -> LogoUp3D:
    return _DEFAULT_LOGOUP.setx(x)

def sety(y: float) -> LogoUp3D:
    return _DEFAULT_LOGOUP.sety(y)

def getx() -> float:
    return _DEFAULT_LOGOUP.getx()

def gety() -> float:
    return _DEFAULT_LOGOUP.gety()

def geth() -> float:
    return _DEFAULT_LOGOUP.geth()

def txtstamp(text: str, size: float = 10.0) -> LogoUp3D:
    return _DEFAULT_LOGOUP.txtstamp(text, size)

def polygon(sides: int, radius: float) -> LogoUp3D:
    return _DEFAULT_LOGOUP.polygon(sides, radius)

def circle(radius: float) -> LogoUp3D:
    return _DEFAULT_LOGOUP.circle(radius)

def rect(length: float, width: float) -> LogoUp3D:
    return _DEFAULT_LOGOUP.rect(length, width)

def square(size: float) -> LogoUp3D:
    return _DEFAULT_LOGOUP.square(size)

def rounded_rect(length: float, width: float, radius: float) -> LogoUp3D:
    return _DEFAULT_LOGOUP.rounded_rect(length, width, radius)

def rounded_square(size: float, radius: float) -> LogoUp3D:
    return _DEFAULT_LOGOUP.rounded_square(size, radius)

def ellipse(a: float, b: float) -> LogoUp3D:
    return _DEFAULT_LOGOUP.ellipse(a, b)

def star(num_points: int, outer_radius: float, inner_radius: Optional[float] = None) -> LogoUp3D:
    return _DEFAULT_LOGOUP.star(num_points, outer_radius, inner_radius)

def five_star(outer_radius: float) -> LogoUp3D:
    return _DEFAULT_LOGOUP.five_star(outer_radius)

def six_star(outer_radius: float) -> LogoUp3D:
    return _DEFAULT_LOGOUP.six_star(outer_radius)

def four_star(outer_radius: float) -> LogoUp3D:
    return _DEFAULT_LOGOUP.four_star(outer_radius)

def egg(rx: float, ry: float) -> LogoUp3D:
    return _DEFAULT_LOGOUP.egg(rx, ry)

def spirograph(R: float, r: float, d: float, angle_deg: float = 1080) -> LogoUp3D:
    return _DEFAULT_LOGOUP.spirograph(R, r, d, angle_deg)

def up(distance: float) -> LogoUp3D:
    return _DEFAULT_LOGOUP.up(distance)

def jump(distance: float) -> LogoUp3D:
    return _DEFAULT_LOGOUP.jump(distance)

def body() -> LogoUp3D:
    return _DEFAULT_LOGOUP.body()

def color(color_name: str) -> LogoUp3D:
    return _DEFAULT_LOGOUP.color(color_name)

def yaw(deg: float) -> LogoUp3D:
    return _DEFAULT_LOGOUP.yaw(deg)

def pitch(deg: float) -> LogoUp3D:
    return _DEFAULT_LOGOUP.pitch(deg)

def roll(deg: float) -> LogoUp3D:
    return _DEFAULT_LOGOUP.roll(deg)

def move(dx: float, dy: float, dz: float) -> LogoUp3D:
    return _DEFAULT_LOGOUP.move(dx, dy, dz)

def moveto(x: float, y: float, z: float) -> LogoUp3D:
    return _DEFAULT_LOGOUP.moveto(x, y, z)

def shift(dx: float, dy: float) -> LogoUp3D:
    return _DEFAULT_LOGOUP.shift(dx, dy)

def subtract(enable: bool = True) -> LogoUp3D:
    return _DEFAULT_LOGOUP.subtract(enable)

def extrude(height: float) -> LogoUp3D:
    return _DEFAULT_LOGOUP.extrude(height)

def cextrude(height: float) -> LogoUp3D:
    return _DEFAULT_LOGOUP.cextrude(height)

def pyramid(height: float) -> LogoUp3D:
    return _DEFAULT_LOGOUP.pyramid(height)

def cave(depth: float) -> LogoUp3D:
    return _DEFAULT_LOGOUP.cave(depth)

def scale(factor: float) -> LogoUp3D:
    return _DEFAULT_LOGOUP.scale(factor)

def box(length: float, width: float, height: float) -> LogoUp3D:
    return _DEFAULT_LOGOUP.box(length, width, height)

def cylinder(radius: float, height: float) -> LogoUp3D:
    return _DEFAULT_LOGOUP.cylinder(radius, height)

def sphere(radius: float) -> LogoUp3D:
    return _DEFAULT_LOGOUP.sphere(radius)

def pyramid_solid(sides: int, radius: float, height: float) -> LogoUp3D:
    return _DEFAULT_LOGOUP.pyramid_solid(sides, radius, height)

def torus(major_radius: float, minor_radius: float) -> LogoUp3D:
    return _DEFAULT_LOGOUP.torus(major_radius, minor_radius)

def get_model() -> Any:
    return _DEFAULT_LOGOUP.to_part()
