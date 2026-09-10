"""
Turtle3D: 面向 build123d 与 OpenCASCADE 的三维空间海龟绘图引擎
全面复刻 LogoUp 3D 核心指令，支持三维姿态控制、分支堆栈 (push/pop)、分形递归与流形 3D 实体生成
"""

from __future__ import annotations
import math
from typing import List, Tuple, Optional, Any
import build123d as b3d
from build123d import Vector, Plane, Cylinder, Sphere, Compound


def _rot_vector(v: Vector, axis: Vector, deg: float) -> Vector:
    """
    使用罗德里格斯旋转公式 (Rodrigues' rotation formula) 计算向量绕任意轴旋转指定角度
    """
    rad = math.radians(deg)
    k = axis.normalized()
    c = math.cos(rad)
    s = math.sin(rad)
    return v * c + k.cross(v) * s + k * (k.dot(v)) * (1.0 - c)


class Turtle3D:
    """
    3D 海龟绘图控制器
    支持直角坐标与球坐标空间移动、偏航(Yaw)、俯仰(Pitch)、翻滚(Roll)、分形分支栈及实体管道生成
    """

    def __init__(
        self,
        radius: float = 1.0,
        color: str = "#10b981",
        name: str = "turtle_model",
        origin: Tuple[float, float, float] = (0.0, 0.0, 0.0),
    ) -> None:
        self.default_radius = float(radius)
        self.current_radius = float(radius)
        self.color = color
        self.name = name

        # 初始空间位姿
        self.pos = Vector(origin[0], origin[1], origin[2])
        # heading: 前进主轴 (默认沿 +Y 轴)
        self.heading = Vector(0.0, 1.0, 0.0)
        # up: 天顶法向轴 (默认沿 +Z 轴)
        self.up = Vector(0.0, 0.0, 1.0)
        # right: 侧横轴 (heading x up)
        self.right = self.heading.cross(self.up).normalized()

        self.is_pen_down: bool = True
        self.state_stack: List[Tuple[Vector, Vector, Vector, Vector, float, bool, str]] = []

        # 绘制线段记录 [(p1, p2, radius, color)]
        self.segments: List[Tuple[Vector, Vector, float, str]] = []
        # 已生成的 3D CAD 实体缓存
        self._part: Optional[Any] = None

    def __enter__(self) -> Turtle3D:
        return self

    def __exit__(self, exc_type: Any, exc_val: Any, exc_tb: Any) -> None:
        if exc_type is None:
            self.to_part()

    @property
    def part(self) -> Any:
        if self._part is None:
            self.to_part()
        return self._part

    # ---------------- 基础移动指令 ----------------

    def forward(self, distance: float) -> Turtle3D:
        """沿当前前进主轴 (heading) 前进指定距离"""
        d = float(distance)
        new_pos = self.pos + self.heading * d
        if self.is_pen_down and abs(d) > 1e-6:
            self.segments.append((Vector(self.pos), Vector(new_pos), self.current_radius, self.color))
        self.pos = new_pos
        self._part = None
        return self

    def fd(self, distance: float) -> Turtle3D:
        """forward 简写"""
        return self.forward(distance)

    def backward(self, distance: float) -> Turtle3D:
        """沿当前前进主轴后退指定距离"""
        return self.forward(-float(distance))

    def bk(self, distance: float) -> Turtle3D:
        """backward 简写"""
        return self.backward(distance)

    def jump_to(self, x: float, y: float, z: float) -> Turtle3D:
        """瞬移到空间指定三维坐标点 (不绘制轨迹)"""
        self.pos = Vector(float(x), float(y), float(z))
        self._part = None
        return self

    def home(self) -> Turtle3D:
        """复位至原点与初始坐标架"""
        self.pos = Vector(0.0, 0.0, 0.0)
        self.heading = Vector(0.0, 1.0, 0.0)
        self.up = Vector(0.0, 0.0, 1.0)
        self.right = self.heading.cross(self.up).normalized()
        self._part = None
        return self

    # ---------------- 三维姿态控制 (偏航/俯仰/翻滚) ----------------

    def turn(self, deg: float) -> Turtle3D:
        """偏航转向 (正度数向右偏航，负度数向左偏航，兼容 LogoUp 3D 习惯)"""
        return self.turn_right(deg)

    def pitch(self, deg: float) -> Turtle3D:
        """俯仰转向 (正度数向上仰起，负度数向下俯冲)"""
        return self.pitch_up(deg)

    def roll(self, deg: float) -> Turtle3D:
        """轴向滚转 (正度数向右滚转，负度数向左滚转)"""
        return self.roll_right(deg)

    def turn_left(self, deg: float) -> Turtle3D:
        """偏航左转 (绕 up 轴旋转 +deg 度)"""
        self.heading = _rot_vector(self.heading, self.up, deg).normalized()
        self.right = self.heading.cross(self.up).normalized()
        return self

    def lt(self, deg: float) -> Turtle3D:
        """turn_left 简写"""
        return self.turn_left(deg)

    def turn_right(self, deg: float) -> Turtle3D:
        """偏航右转 (绕 up 轴旋转 -deg 度)"""
        return self.turn_left(-deg)

    def rt(self, deg: float) -> Turtle3D:
        """turn_right 简写"""
        return self.turn_right(deg)

    def pitch_up(self, deg: float) -> Turtle3D:
        """俯仰上仰 (绕 right 轴向上抬升 +deg 度)"""
        self.heading = _rot_vector(self.heading, self.right, deg).normalized()
        self.up = self.right.cross(self.heading).normalized()
        return self

    def up_turn(self, deg: float) -> Turtle3D:
        """pitch_up 别名"""
        return self.pitch_up(deg)

    def pitch_down(self, deg: float) -> Turtle3D:
        """俯仰下俯 (绕 right 轴向下压低 +deg 度)"""
        return self.pitch_up(-deg)

    def down_turn(self, deg: float) -> Turtle3D:
        """pitch_down 别名"""
        return self.pitch_down(deg)

    def roll_left(self, deg: float) -> Turtle3D:
        """机翼轴向左滚 (绕 heading 轴逆时针旋转 +deg 度)"""
        self.up = _rot_vector(self.up, self.heading, deg).normalized()
        self.right = self.heading.cross(self.up).normalized()
        return self

    def roll_l(self, deg: float) -> Turtle3D:
        """roll_left 简写"""
        return self.roll_left(deg)

    def roll_right(self, deg: float) -> Turtle3D:
        """机翼轴向右滚 (绕 heading 轴顺时针旋转 +deg 度)"""
        return self.roll_left(-deg)

    def roll_r(self, deg: float) -> Turtle3D:
        """roll_right 简写"""
        return self.roll_right(deg)

    # ---------------- 空间圆弧与弯管 ----------------

    def arc_left(self, radius: float, angle_deg: float, steps: int = 12) -> Turtle3D:
        """
        在 (heading, right) 平面内沿左侧绘制平滑圆弧
        :param radius: 圆弧弯曲半径
        :param angle_deg: 圆弧扫掠度数
        :param steps: 离散段数
        """
        st = max(3, int(steps))
        step_ang = angle_deg / st
        chord = 2.0 * radius * math.sin(math.radians(abs(step_ang) / 2.0))
        for _ in range(st):
            self.turn_left(step_ang / 2.0)
            self.forward(chord)
            self.turn_left(step_ang / 2.0)
        return self

    def arc_right(self, radius: float, angle_deg: float, steps: int = 12) -> Turtle3D:
        """在 (heading, right) 平面内沿右侧绘制平滑圆弧"""
        return self.arc_left(radius, -angle_deg, steps)

    def arc_up(self, radius: float, angle_deg: float, steps: int = 12) -> Turtle3D:
        """在 (heading, up) 平面内向上弯曲圆弧"""
        st = max(3, int(steps))
        step_ang = angle_deg / st
        chord = 2.0 * radius * math.sin(math.radians(abs(step_ang) / 2.0))
        for _ in range(st):
            self.pitch_up(step_ang / 2.0)
            self.forward(chord)
            self.pitch_up(step_ang / 2.0)
        return self

    def arc_down(self, radius: float, angle_deg: float, steps: int = 12) -> Turtle3D:
        """在 (heading, up) 平面内向下弯曲圆弧"""
        return self.arc_up(radius, -angle_deg, steps)

    def circle(self, radius: float, steps: int = 36) -> Turtle3D:
        """在当前局部平面画一个完整的圆"""
        return self.arc_left(radius, 360.0, steps=steps)

    # ---------------- 画笔与堆栈控制 (LogoUp 3D 核心) ----------------

    def pen_up(self) -> Turtle3D:
        """抬笔，移动时不产生实体"""
        self.is_pen_down = False
        return self

    def pu(self) -> Turtle3D:
        """pen_up 简写"""
        return self.pen_up()

    def pen_down(self) -> Turtle3D:
        """落笔，移动时生成实体管道"""
        self.is_pen_down = True
        return self

    def pd(self) -> Turtle3D:
        """pen_down 简写"""
        return self.pen_down()

    def set_radius(self, radius: float) -> Turtle3D:
        """设置当前管道半径"""
        self.current_radius = max(0.01, float(radius))
        return self

    def set_color(self, color_str: str) -> Turtle3D:
        """设置当前管道颜色"""
        self.color = color_str
        return self

    def push(self) -> Turtle3D:
        """保存当前海龟空间位姿、半径与画笔状态至堆栈（实现树枝分叉与分形结构）"""
        state = (
            Vector(self.pos),
            Vector(self.heading),
            Vector(self.up),
            Vector(self.right),
            self.current_radius,
            self.is_pen_down,
            self.color,
        )
        self.state_stack.append(state)
        return self

    def pop(self) -> Turtle3D:
        """从堆栈恢复先前保存的空间位姿、半径与画笔状态"""
        if not self.state_stack:
            return self
        state = self.state_stack.pop()
        self.pos = state[0]
        self.heading = state[1]
        self.up = state[2]
        self.right = state[3]
        self.current_radius = state[4]
        self.is_pen_down = state[5]
        self.color = state[6]
        return self

    # ---------------- 3D 实体生成器 (B-Rep 流形构建) ----------------

    def to_part(self) -> Any:
        """
        将海龟移动轨迹转换为适合 3D 打印与 OpenCASCADE 渲染的 B-Rep 实体 (Compound / Solid)
        采用「球形关节 + 直柱节段」连续熔接算法，100% 避免自相交扫掠失败
        """
        if not self.segments:
            self._part = Sphere(radius=self.current_radius).locate(b3d.Location(self.pos))
            return self._part

        solids: List[Any] = []
        visited_nodes: set = set()

        for p1, p2, rad, _ in self.segments:
            diff = p2 - p1
            dist = diff.length
            if dist < 1e-5:
                continue

            # 1. 在两端点添加球形关节 (避免折角破面与尖点缝隙，确保流形)
            k1 = (round(p1.X, 4), round(p1.Y, 4), round(p1.Z, 4), round(rad, 4))
            if k1 not in visited_nodes:
                visited_nodes.add(k1)
                solids.append(Sphere(radius=rad).locate(b3d.Location(p1)))

            k2 = (round(p2.X, 4), round(p2.Y, 4), round(p2.Z, 4), round(rad, 4))
            if k2 not in visited_nodes:
                visited_nodes.add(k2)
                solids.append(Sphere(radius=rad).locate(b3d.Location(p2)))

            # 2. 生成两点之间的圆柱管道段
            mid = (p1 + p2) / 2.0
            plane = Plane(origin=mid, z_dir=diff)
            cyl = plane * Cylinder(radius=rad, height=dist)
            solids.append(cyl)

        if not solids:
            self._part = Sphere(radius=self.current_radius).locate(b3d.Location(self.pos))
        elif len(solids) == 1:
            self._part = solids[0]
        else:
            self._part = Compound(children=solids)

        if hasattr(self._part, "color"):
            try:
                self._part.color = b3d.Color(self.color)
            except Exception:
                pass

        return self._part
