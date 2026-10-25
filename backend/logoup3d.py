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


def _create_hollow_face(face_solid: Any, wall_thickness: float) -> Any:
    """根据笔画宽度 wall_thickness 生成带壁厚的闭合中空环面，保持直角/多边形棱角分明且法向朝向 +Z"""
    t = float(wall_thickness)
    if t <= 0.05:
        return face_solid

    def _normalize_face_result(res_shape: Any) -> Optional[Any]:
        if res_shape is None or getattr(res_shape, "area", 0.0) <= 1e-4:
            return None
        faces = res_shape.faces() if hasattr(res_shape, "faces") else []
        if len(faces) == 1:
            f = faces[0]
            try:
                if f.normal_at(f.center()).Z < 0:
                    f = -f
            except Exception:
                pass
            return f
        return res_shape

    # 优先使用 INTERSECTION 模式内缩，保证矩形、正方形、多边形、星形等内框依然保持锐利直边与直角
    for offset_kind in (b3d.Kind.INTERSECTION, b3d.Kind.ARC):
        try:
            inner = b3d.offset(face_solid, amount=-t, kind=offset_kind)
            res = _normalize_face_result(face_solid - inner)
            if res is not None:
                return res
        except Exception:
            pass

    for offset_kind in (b3d.Kind.INTERSECTION, b3d.Kind.ARC):
        try:
            outer = b3d.offset(face_solid, amount=t, kind=offset_kind)
            res = _normalize_face_result(outer - face_solid)
            if res is not None:
                return res
        except Exception:
            pass

    return face_solid


def _discretize_wire(w: Any) -> List[List[float]]:
    """按拓扑边首尾连接顺序提取线框点列，彻底消除 w.vertices() 乱序导致的对角交叉线"""
    pts: List[List[float]] = []
    try:
        edges = w.order_edges() if hasattr(w, "order_edges") else w.edges()
        for e in edges:
            if hasattr(e, "geom_type") and e.geom_type == b3d.GeomType.LINE:
                raw_pts = [e.position_at(0.0), e.position_at(1.0)]
            else:
                raw_pts = e.positions([i / 24.0 for i in range(25)])
            if not raw_pts:
                continue
            # 检查当前边与前一条边终点的衔接方向，若反向则翻转采样点
            if pts:
                last_x, last_y, last_z = pts[-1]
                p0 = raw_pts[0]
                p1 = raw_pts[-1]
                d0 = (p0.X - last_x) ** 2 + (p0.Y - last_y) ** 2 + (p0.Z - last_z) ** 2
                d1 = (p1.X - last_x) ** 2 + (p1.Y - last_y) ** 2 + (p1.Z - last_z) ** 2
                if d1 < d0 and d0 > 1e-4:
                    raw_pts = list(reversed(raw_pts))
            for p in raw_pts:
                pt = [round(p.X, 3), round(p.Y, 3), round(p.Z, 3)]
                if not pts or (
                    abs(pts[-1][0] - pt[0]) > 1e-3
                    or abs(pts[-1][1] - pt[1]) > 1e-3
                    or abs(pts[-1][2] - pt[2]) > 1e-3
                ):
                    pts.append(pt)
        if len(pts) > 2 and (
            abs(pts[0][0] - pts[-1][0]) < 1e-3
            and abs(pts[0][1] - pts[-1][1]) < 1e-3
            and abs(pts[0][2] - pts[-1][2]) < 1e-3
        ):
            pts.pop()
    except Exception:
        try:
            samples = w.positions([i / 64.0 for i in range(64)])
            pts = [[round(p.X, 3), round(p.Y, 3), round(p.Z, 3)] for p in samples]
        except Exception:
            pass
    return pts


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
        self.last_solid_face: Optional[Any] = None
        self.last_hollow_face: Optional[Any] = None
        self.is_filled: bool = False

        # 轨迹与草图线框状态 (对标图 2 游标指示与未填充草图线框)
        self.trail_segments: List[Dict[str, Any]] = []
        self.pending_sketch_wires: List[Any] = []
        self.last_sketch_wire: Optional[Any] = None
        self.is_active: bool = False

        # 3D 实体构建状态与放样截面追踪
        self.current_color: str = "#3b82f6"
        self.subtract_mode: bool = False
        self.solids: List[Any] = []
        self._body_sections: List[Any] = []
        self._prev_sketch_face: Optional[Any] = None

        # 位姿堆栈 (PUSH / POP)
        self.state_stack: List[Dict[str, Any]] = []

        return self

    def _record_step(self, old_pos: Vector, new_pos: Vector, dir_vec: Vector):
        """记录游标空间位移轨迹段，供视口渲染前进方向指示箭头序列"""
        self.is_active = True
        delta = new_pos - old_pos
        if delta.length > 1e-4:
            self.trail_segments.append({
                "start": [round(old_pos.X, 3), round(old_pos.Y, 3), round(old_pos.Z, 3)],
                "end": [round(new_pos.X, 3), round(new_pos.Y, 3), round(new_pos.Z, 3)],
                "dir": [round(dir_vec.X, 4), round(dir_vec.Y, 4), round(dir_vec.Z, 4)],
                "length": round(delta.length, 3),
            })

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
        """存储当前坐标、姿态与画笔状态 (PUSH)"""
        state = {
            "pos": Vector(self.pos),
            "heading": Vector(self.heading),
            "up_dir": Vector(self.up_dir),
            "right": Vector(self.right),
            "pen_width": float(self.pen_width),
            "is_drawing": self.is_drawing,
            "subtract_mode": self.subtract_mode,
            "current_color": self.current_color,
        }
        self.state_stack.append(state)
        return self

    def pop(self) -> LogoUp3D:
        """恢复上次存储的坐标、姿态与画笔状态 (POP)"""
        if not self.state_stack:
            return self
        state = self.state_stack.pop()
        self.pos = state["pos"]
        self.heading = state["heading"]
        self.up_dir = state["up_dir"]
        self.right = state["right"]
        if "pen_width" in state:
            self.pen_width = state["pen_width"]
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
        self.current_path_points = [Vector(self.pos)]
        self.current_sketch_faces = []
        self.last_sketch_face = None
        self.last_solid_face = None
        self.last_hollow_face = None
        self.pending_sketch_wires = []
        self.last_sketch_wire = None
        self.is_active = True
        return self

    def go(self, distance: float) -> LogoUp3D:
        """向前移动 (GO) 指定距离 (毫米)"""
        d = float(distance)
        old_p = Vector(self.pos)
        delta = self.heading * d
        self.pos = self.pos + delta
        self._record_step(old_p, self.pos, self.heading)
        if self.is_drawing:
            self.current_path_points.append(Vector(self.pos))
        else:
            self._translate_sketch(delta)
        return self

    def turn(self, deg: float) -> LogoUp3D:
        """顺时针旋转 (TURN) ↷ 指定角度 (度)"""
        angle = float(deg)
        rot_axis = b3d.Axis(self.pos, self.up_dir)
        self.heading = _rot_vector(self.heading, self.up_dir, -angle).normalized()
        self.right = self.heading.cross(self.up_dir).normalized()
        self._rotate_sketch(rot_axis, -angle)
        self.is_active = True
        return self

    def turn_left(self, deg: float) -> LogoUp3D:
        """逆时针左转 (TURNLEFT) ↺ 指定角度 (度)"""
        return self.turn(-deg)

    def fd(self, distance: float) -> LogoUp3D:
        """向前移动 (FD) [distance] 毫米 (go 别名)"""
        return self.go(distance)

    def forward(self, distance: float) -> LogoUp3D:
        """向前移动 (FORWARD) [distance] 毫米 (go 别名)"""
        return self.go(distance)

    def bk(self, distance: float) -> LogoUp3D:
        """向后移动 (BK) [distance] 毫米"""
        return self.go(-float(distance))

    def back(self, distance: float) -> LogoUp3D:
        """向后移动 (BACK) [distance] 毫米"""
        return self.go(-float(distance))

    def backward(self, distance: float) -> LogoUp3D:
        """向后移动 (BACKWARD) [distance] 毫米"""
        return self.go(-float(distance))

    def rt(self, deg: float) -> LogoUp3D:
        """顺时针右转 (RT) [deg] 度 (turn 别名)"""
        return self.turn(deg)

    def lt(self, deg: float) -> LogoUp3D:
        """逆时针左转 (LT) [deg] 度 (turn_left 别名)"""
        return self.turn_left(deg)

    def goto(self, x: float, y: float) -> LogoUp3D:
        """移动到当前草平面的局部坐标 (GOTO)"""
        lx, ly = float(x), float(y)
        old_p = Vector(self.pos)
        self.pos = self.current_plane.to_world_coords(Vector(lx, ly, 0.0))
        delta = self.pos - old_p
        step_dir = delta.normalized() if delta.length > 1e-5 else self.heading
        self._record_step(old_p, self.pos, step_dir)
        if self.is_drawing:
            self.current_path_points.append(Vector(self.pos))
        return self

    def close(self) -> LogoUp3D:
        """回到笔划起点 (CLOSE)"""
        if self.is_drawing and len(self.current_path_points) > 1:
            start_p = Vector(self.current_path_points[0])
            old_p = Vector(self.pos)
            self.pos = start_p
            delta = self.pos - old_p
            step_dir = delta.normalized() if delta.length > 1e-5 else self.heading
            self._record_step(old_p, self.pos, step_dir)
            self.current_path_points.append(start_p)
        return self

    def _finish_drawing_path(self) -> None:
        """结算当前画笔积累的折线点，生成封闭截面或带线宽的条带面并加入 current_sketch_faces"""
        if len(self.current_path_points) < 2:
            return

        sketch_color = Color(234 / 255.0, 88 / 255.0, 12 / 255.0)
        pts = [Vector(p) for p in self.current_path_points]
        w = max(0.1, float(self.pen_width))

        # 检查是否为闭合图形（至少 4 点且首尾重合）
        is_closed_loop = len(pts) >= 4 and (pts[0] - pts[-1]).length < 1e-4

        if is_closed_loop:
            edges = []
            for i in range(len(pts) - 1):
                if (pts[i+1] - pts[i]).length > 1e-4:
                    e = Edge.make_line(pts[i], pts[i+1])
                    e.color = sketch_color
                    edges.append(e)
            if len(edges) >= 3:
                try:
                    world_wire = Wire(edges)
                    world_wire.color = sketch_color
                    self.pending_sketch_wires.append(world_wire)
                    self.last_sketch_wire = world_wire

                    solid_face = b3d.make_face(world_wire)
                    hollow_face = _create_hollow_face(solid_face, w)
                    solid_face.color = sketch_color
                    hollow_face.color = sketch_color

                    face_to_use = solid_face if self.is_filled else hollow_face
                    self.last_solid_face = solid_face
                    self.last_hollow_face = hollow_face
                    self.last_sketch_face = face_to_use
                    self.current_sketch_faces.append(face_to_use)
                except Exception:
                    pass
        else:
            # 开放折线：生成带笔宽的矩形条带，并在折角顶点平滑融合圆盘
            try:
                up_norm = Vector(self.up_dir).normalized()
                seg_faces = []
                corner_faces = []
                for i in range(len(pts) - 1):
                    p_start = Vector(pts[i])
                    p_end = Vector(pts[i+1])
                    delta = p_end - p_start
                    if delta.length < 1e-4:
                        continue
                    dir_vec = delta.normalized()
                    perp_vec = dir_vec.cross(up_norm).normalized()
                    half_w = w / 2.0
                    c1 = p_start - perp_vec * half_w
                    c2 = p_end - perp_vec * half_w
                    c3 = p_end + perp_vec * half_w
                    c4 = p_start + perp_vec * half_w
                    # 使用 [c1, c4, c3, c2, c1] 保证生成的面法向量与 up_norm 一致
                    rect_wire = Wire.make_polygon([c1, c4, c3, c2, c1])
                    seg_f = Face(rect_wire)
                    if hasattr(seg_f, "normal_at"):
                        try:
                            norm = seg_f.normal_at(seg_f.center())
                            if norm.dot(up_norm) < -0.1:
                                seg_f = Face(rect_wire.inverted())
                        except Exception:
                            pass
                    seg_f.color = sketch_color
                    seg_faces.append(seg_f)
                    if i > 0:
                        disc_plane = Plane(origin=p_start, z_dir=up_norm)
                        disc = disc_plane * b3d.Circle(half_w).face()
                        disc.color = sketch_color
                        corner_faces.append(disc)

                all_f = seg_faces + corner_faces
                if all_f:
                    stroke_face = all_f[0]
                    for f in all_f[1:]:
                        try:
                            stroke_face = stroke_face + f
                        except Exception:
                            try:
                                stroke_face = Compound(children=[stroke_face, f])
                            except Exception:
                                pass
                    stroke_face.color = sketch_color
                    self.last_solid_face = stroke_face
                    self.last_hollow_face = stroke_face
                    self.last_sketch_face = stroke_face
                    self.current_sketch_faces.append(stroke_face)
            except Exception:
                pass

    def _combine_sketch_faces(self) -> LogoUp3D:
        """
        组合平面：将当前工作平面上的所有草图面（手绘画笔面、平面构件面）融合为统一的复合截面
        若未调用 fill()，保护构件内孔不被实心线条填塞，保证圆圈中空透光
        """
        sketch_color = Color(234 / 255.0, 88 / 255.0, 12 / 255.0)

        # 嵌套同心线框成孔优化（如连续绘制外圆+内圆，构成空心圆环磁圈）
        if len(self.pending_sketch_wires) >= 2:
            try:
                wires = list(self.pending_sketch_wires)
                wires.sort(key=lambda w: (w.bounding_box().max - w.bounding_box().min).length, reverse=True)
                outer_w = wires[0]
                inner_ws = []
                for inner_cand in wires[1:]:
                    c_inner = inner_cand.center()
                    c_outer = outer_w.center()
                    max_dim = (outer_w.bounding_box().max - outer_w.bounding_box().min).length
                    if (c_inner - c_outer).length < max_dim * 0.5:
                        inner_ws.append(inner_cand)
                if inner_ws:
                    annulus_face = b3d.Face(outer_w, inner_ws)
                    annulus_face.color = sketch_color
                    self.last_sketch_face = annulus_face
                    self.current_sketch_faces = [annulus_face]
                    self.last_solid_face = annulus_face
                    self.pending_sketch_wires.clear()
                    return self
            except Exception as e:
                logger.debug(f"嵌套线框成孔失败，回退默认布尔逻辑: {e}")

        if not self.current_sketch_faces:
            return self

        if len(self.current_sketch_faces) == 1:
            self.last_sketch_face = self.current_sketch_faces[0]
            return self

        combined = self.current_sketch_faces[0]
        for f in self.current_sketch_faces[1:]:
            try:
                combined = combined + f
            except Exception:
                try:
                    combined = Compound(children=[combined, f])
                except Exception:
                    pass

        # 若未执行 fill()，切除构件内孔，确保圆圈保持中空环状
        if not self.is_filled and hasattr(self, "last_inner_hole") and self.last_inner_hole is not None:
            try:
                carved = combined - self.last_inner_hole
                if carved.area > 1e-4:
                    combined = carved
            except Exception:
                pass

        try:
            combined.color = sketch_color
        except Exception:
            pass

        self.last_sketch_face = combined
        self.current_sketch_faces = [combined]
        return self

    def done(self) -> LogoUp3D:
        """完成当前图形 (DONE) 并生成闭合二维截面与草图线框"""
        # 1. 结算当前画笔中的路径
        if self.is_drawing:
            self._finish_drawing_path()
            self.is_drawing = False
            self.current_path_points = []

        # 2. 组合平面：将当前平面所有草图面（画笔面、构件面）融合为单一草图截面
        self._combine_sketch_faces()
        return self

    def fill(self) -> LogoUp3D:
        """填充上笔的环 (FILL)：将前置未填充的平面线框 (Wire) 或空心环面填充为实心面 (Face)，随后可进行实心拉伸 (对标图 2)"""
        if self.is_drawing:
            self._finish_drawing_path()
            self.is_drawing = False
            self.current_path_points = []

        self.is_filled = True
        sketch_color = Color(234 / 255.0, 88 / 255.0, 12 / 255.0)

        # 优先将刚生成的空心面替换为实心面
        if self.last_solid_face is not None and self.last_hollow_face is not None:
            new_faces = []
            for f in self.current_sketch_faces:
                if f is self.last_hollow_face or f is self.last_sketch_face:
                    new_faces.append(self.last_solid_face)
                else:
                    new_faces.append(f)
            self.last_solid_face.color = sketch_color
            self.current_sketch_faces = new_faces
            self.last_sketch_face = self.last_solid_face

        # 兜底填充 pending_sketch_wires 中最后一个未填充线框
        if self.pending_sketch_wires:
            try:
                wire = self.pending_sketch_wires.pop()
                face = b3d.make_face(wire)
                face.color = sketch_color
                self.current_sketch_faces.append(face)
                self.last_sketch_face = face
                self.last_solid_face = face
            except Exception:
                pass

        self._combine_sketch_faces()
        return self

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
        target_h = _rot_vector(base_h, self.up_dir, -float(deg)).normalized()
        c = max(-1.0, min(1.0, self.heading.dot(target_h)))
        ang_rad = math.acos(c)
        cross_z = self.heading.cross(target_h).dot(self.up_dir)
        signed_deg = math.degrees(ang_rad) if cross_z >= 0 else -math.degrees(ang_rad)
        rot_axis = b3d.Axis(self.pos, self.up_dir)
        self.heading = target_h
        self.right = self.heading.cross(self.up_dir).normalized()
        self._rotate_sketch(rot_axis, signed_deg)
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

    def _add_2d_wire(self, shape_or_wire: Any) -> LogoUp3D:
        """
        将 2D 轮廓依附于当前工作平面，构建截面与轮廓线框。
        当在 draw() 绘制过程中被调用时，自动结算前面的折线段并将构件纳入组合平面。
        严格保护调用前的画笔位姿与方向，确保构件放置对画笔后续移动方向零影响。
        """
        saved_pos = Vector(self.pos)
        saved_heading = Vector(self.heading)
        saved_up = Vector(self.up_dir)
        saved_right = Vector(self.right)
        saved_pen_width = float(self.pen_width)

        # 若正在画笔落笔中，先结算前面的笔划
        if self.is_drawing and len(self.current_path_points) >= 2:
            self._finish_drawing_path()
            self.current_path_points = [Vector(saved_pos)]
        elif self.is_drawing and not self.current_path_points:
            self.current_path_points = [Vector(saved_pos)]

        target_wire = shape_or_wire
        if hasattr(shape_or_wire, "wire") and callable(shape_or_wire.wire):
            target_wire = shape_or_wire.wire()
        elif hasattr(shape_or_wire, "wires") and callable(shape_or_wire.wires):
            ws = shape_or_wire.wires()
            if ws:
                target_wire = ws[0]

        world_wire = self.current_plane * target_wire
        self.pending_sketch_wires.append(world_wire)
        self.last_sketch_wire = world_wire

        try:
            local_solid_face = b3d.make_face(target_wire)
            local_hollow_face = _create_hollow_face(local_solid_face, saved_pen_width)
            world_solid = self.current_plane * local_solid_face
            world_hollow = self.current_plane * local_hollow_face

            sketch_color = Color(234 / 255.0, 88 / 255.0, 12 / 255.0)
            try:
                world_solid.color = sketch_color
                world_hollow.color = sketch_color
            except Exception:
                pass

            # 记录内孔，以便组合平面时保留镂空，不被线条穿塞
            inner_hole = None
            try:
                if local_hollow_face is not local_solid_face:
                    if local_hollow_face.area < local_solid_face.area:
                        inner_hole = self.current_plane * (local_solid_face - local_hollow_face)
                    else:
                        inner_hole = world_solid
            except Exception:
                pass
            self.last_inner_hole = inner_hole

            target_face = world_solid if self.is_filled else world_hollow
            self.last_solid_face = world_solid
            self.last_hollow_face = world_hollow
            self.last_sketch_face = target_face
            self.current_sketch_faces.append(target_face)
        except Exception:
            pass

        # 严格恢复姿态与画笔粗细属性，确保构件放置后画笔方向、位置与原有线宽完全不变
        self.pos = saved_pos
        self.heading = saved_heading
        self.up_dir = saved_up
        self.right = saved_right
        self.pen_width = saved_pen_width
        if self.is_drawing and not self.current_path_points:
            self.current_path_points = [Vector(self.pos)]

        self.is_active = True
        return self

    def polygon(self, sides: int, radius: float) -> LogoUp3D:
        """多边形 边数 [sides] 外接圆半径 [radius] (未填充线框)"""
        n = max(3, int(sides))
        r = max(0.1, float(radius))
        return self._add_2d_wire(b3d.RegularPolygon(radius=r, side_count=n))

    def circle(self, radius: float) -> LogoUp3D:
        """圆 半径 [radius] (未填充线框)"""
        return self._add_2d_wire(b3d.Circle(radius=max(0.1, float(radius))))

    def rect(self, length: float, width: float) -> LogoUp3D:
        """矩形 长 [length] 宽 [width] (未填充线框)"""
        return self._add_2d_wire(b3d.Rectangle(width=float(length), height=float(width)))

    def square(self, size: float) -> LogoUp3D:
        """正方形 边长 [size] (未填充线框)"""
        return self.rect(size, size)

    def rounded_rect(self, length: float, width: float, radius: float) -> LogoUp3D:
        """圆角矩形 长 [length] 宽 [width] 倒角半径 [radius] (未填充线框)"""
        l = max(0.2, float(length))
        w = max(0.2, float(width))
        max_r = min(l, w) * 0.49
        safe_r = max(0.01, min(float(radius), max_r))
        return self._add_2d_wire(b3d.RectangleRounded(width=l, height=w, radius=safe_r))

    def rounded_square(self, size: float, radius: float) -> LogoUp3D:
        """圆角方形 边长 [size] 倒角半径 [radius] (未填充线框)"""
        return self.rounded_rect(size, size, radius)

    def ellipse(self, a: float, b: float) -> LogoUp3D:
        """椭圆 半长径 [a] 半短径 [b] (未填充线框)"""
        return self._add_2d_wire(b3d.Ellipse(x_radius=float(a), y_radius=float(b)))

    def star(self, num_points: int, outer_radius: float, inner_radius: Optional[float] = None) -> LogoUp3D:
        """星形 角数 [num_points] 外接圆半径 [outer_radius] (未填充线框)"""
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
        return self._add_2d_wire(star_poly)

    def five_star(self, outer_radius: float) -> LogoUp3D:
        """五角星 外接圆半径 [outer_radius] (未填充线框)"""
        return self.star(5, outer_radius)

    def six_star(self, outer_radius: float) -> LogoUp3D:
        """六角星 外接圆半径 [outer_radius] (未填充线框)"""
        return self.star(6, outer_radius)

    def four_star(self, outer_radius: float) -> LogoUp3D:
        """四芒星 外接圆半径 [outer_radius] (未填充线框)"""
        return self.star(4, outer_radius, inner_radius=float(outer_radius) * 0.25)

    def egg(self, rx: float, ry: float) -> LogoUp3D:
        """蛋形 (卵形线) 半横径 [rx] 半纵径 [ry] (未填充线框)"""
        rx_val, ry_val = float(rx), float(ry)
        pts = []
        steps = 60
        for i in range(steps + 1):
            theta = 2.0 * math.pi * i / steps
            k = 1.0 + 0.25 * math.sin(theta)
            px = rx_val * math.cos(theta) * k
            py = ry_val * math.sin(theta)
            pts.append((px, py))
        pts.append(pts[0])
        poly = b3d.Polyline(pts)
        return self._add_2d_wire(poly)

    def spirograph(self, R: float, r: float, d: float, angle_deg: float = 1080) -> LogoUp3D:
        """万花尺线 (Spirograph) 外径 [R] 内径 [r] 偏移 [d] 角度 [angle_deg] (未填充线框)"""
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
        return self._add_2d_wire(poly)

    # =========================================================================
    # 5. 三维绘图与游标空间控制 (3D Drawing & Cursor)
    # =========================================================================

    def _translate_sketch(self, delta: Vector) -> None:
        """若当前存在已完成的草图面，随游标空间位移进行同步平移，保证后续移动后拉伸依然生效"""
        if delta.length < 1e-6:
            return
        if self.last_sketch_face is not None and not getattr(self, "_body_sections", None):
            self._prev_sketch_face = self.last_sketch_face
        loc_delta = Location(delta)
        if self.current_sketch_faces:
            new_faces = []
            for f in self.current_sketch_faces:
                try:
                    new_faces.append(loc_delta * f)
                except Exception:
                    new_faces.append(f)
            self.current_sketch_faces = new_faces
            if self.last_sketch_face is not None:
                try:
                    self.last_sketch_face = loc_delta * self.last_sketch_face
                except Exception:
                    pass
            if self.last_solid_face is not None:
                try:
                    self.last_solid_face = loc_delta * self.last_solid_face
                except Exception:
                    pass
            if self.last_hollow_face is not None:
                try:
                    self.last_hollow_face = loc_delta * self.last_hollow_face
                except Exception:
                    pass
            if hasattr(self, "last_inner_hole") and self.last_inner_hole is not None:
                try:
                    self.last_inner_hole = loc_delta * self.last_inner_hole
                except Exception:
                    pass
        if self.pending_sketch_wires:
            new_wires = []
            for w in self.pending_sketch_wires:
                try:
                    new_wires.append(loc_delta * w)
                except Exception:
                    new_wires.append(w)
            self.pending_sketch_wires = new_wires
            if self.last_sketch_wire is not None:
                try:
                    self.last_sketch_wire = loc_delta * self.last_sketch_wire
                except Exception:
                    pass

    def _rotate_sketch(self, rot_axis: b3d.Axis, deg: float) -> None:
        """随游标旋转同步旋转当前草图几何（面、实心面、空心面、线框等）"""
        if abs(deg) < 1e-6:
            return
        if self.current_sketch_faces:
            new_faces = []
            for f in self.current_sketch_faces:
                try:
                    new_faces.append(f.rotate(rot_axis, deg))
                except Exception:
                    new_faces.append(f)
            self.current_sketch_faces = new_faces

        if self.last_sketch_face is not None:
            try:
                self.last_sketch_face = self.last_sketch_face.rotate(rot_axis, deg)
            except Exception:
                pass

        if self.last_solid_face is not None:
            try:
                self.last_solid_face = self.last_solid_face.rotate(rot_axis, deg)
            except Exception:
                pass

        if self.last_hollow_face is not None:
            try:
                self.last_hollow_face = self.last_hollow_face.rotate(rot_axis, deg)
            except Exception:
                pass

        if hasattr(self, "last_inner_hole") and self.last_inner_hole is not None:
            try:
                self.last_inner_hole = self.last_inner_hole.rotate(rot_axis, deg)
            except Exception:
                pass

        if self.pending_sketch_wires:
            new_wires = []
            for w in self.pending_sketch_wires:
                try:
                    new_wires.append(w.rotate(rot_axis, deg))
                except Exception:
                    new_wires.append(w)
            self.pending_sketch_wires = new_wires

        if self.last_sketch_wire is not None:
            try:
                self.last_sketch_wire = self.last_sketch_wire.rotate(rot_axis, deg)
            except Exception:
                pass

    def up(self, distance: float) -> LogoUp3D:
        """向上移动 (UP) [distance] 毫米 (沿当前天顶法向移动)"""
        d = float(distance)
        old_p = Vector(self.pos)
        delta = self.up_dir * d
        self.pos = self.pos + delta
        self._record_step(old_p, self.pos, self.up_dir)
        if not self.is_drawing:
            self._translate_sketch(delta)
        return self

    def jump(self, distance: float) -> LogoUp3D:
        """向上跳跃 (JUMP) [distance] 毫米 (别名)"""
        return self.up(distance)

    def step_up(self, distance: float) -> LogoUp3D:
        """向上移动 (STEP_UP) [distance] 毫米 (up 别名)"""
        return self.up(distance)

    def step_down(self, distance: float) -> LogoUp3D:
        """向下移动 (STEP_DOWN) [distance] 毫米 (反向 up)"""
        return self.up(-float(distance))

    def down(self, distance: float) -> LogoUp3D:
        """向下移动 (DOWN) [distance] 毫米 (反向 up)"""
        return self.up(-float(distance))

    def body(self) -> LogoUp3D:
        """开始三维实体 (BODY)：将当前已有草图锚定为三维放样实体的起始底面截面"""
        self._body_sections = []
        base_face = self.last_solid_face if self.last_solid_face is not None else self.last_sketch_face
        if base_face is None and self.current_sketch_faces:
            base_face = self.current_sketch_faces[-1]
        if base_face is not None:
            self._body_sections.append(base_face)
            self._prev_sketch_face = base_face
        self.is_active = True
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
        rot_axis = b3d.Axis(self.pos, self.right)
        self.heading = _rot_vector(self.heading, self.right, angle).normalized()
        self.up_dir = self.right.cross(self.heading).normalized()
        self._rotate_sketch(rot_axis, angle)
        self.is_active = True
        return self

    def roll(self, deg: float) -> LogoUp3D:
        """绕自身旋转 (ROLL) [deg] 度 (绕 heading 轴滚转)"""
        angle = float(deg)
        rot_axis = b3d.Axis(self.pos, self.heading)
        self.up_dir = _rot_vector(self.up_dir, self.heading, angle).normalized()
        self.right = self.heading.cross(self.up_dir).normalized()
        self._rotate_sketch(rot_axis, angle)
        self.is_active = True
        return self

    def rotatex(self, deg: float) -> LogoUp3D:
        """按草图 x 轴旋转 (ROTATEX) [deg] 度 (绕草图局部 X 轴旋转)"""
        return self.pitch(deg)

    def rotatey(self, deg: float) -> LogoUp3D:
        """按草图 y 轴旋转 (ROTATEY) [deg] 度 (绕草图局部 Y 轴旋转)"""
        return self.roll(deg)

    def rotatez(self, deg: float) -> LogoUp3D:
        """按草图 z 轴旋转 (ROTATEZ) [deg] 度 (绕草图局部 Z 轴旋转，逆时针为正)"""
        angle = float(deg)
        rot_axis = b3d.Axis(self.pos, self.up_dir)
        self.heading = _rot_vector(self.heading, self.up_dir, angle).normalized()
        self.right = self.heading.cross(self.up_dir).normalized()
        self._rotate_sketch(rot_axis, angle)
        self.is_active = True
        return self

    def move(self, dx: float, dy: float, dz: float) -> LogoUp3D:
        """三维游标坐标增加 (MOVE) [dx, dy, dz] 毫米"""
        old_p = Vector(self.pos)
        delta = Vector(float(dx), float(dy), float(dz))
        self.pos = self.pos + delta
        step_dir = delta.normalized() if delta.length > 1e-5 else self.heading
        self._record_step(old_p, self.pos, step_dir)
        if not self.is_drawing:
            self._translate_sketch(delta)
        return self

    def moveto(self, x: float, y: float, z: float) -> LogoUp3D:
        """三维游标移动到 (MOVETO) 指定绝对坐标"""
        old_p = Vector(self.pos)
        target_pos = Vector(float(x), float(y), float(z))
        delta = target_pos - old_p
        self.pos = target_pos
        step_dir = delta.normalized() if delta.length > 1e-5 else self.heading
        self._record_step(old_p, self.pos, step_dir)
        if not self.is_drawing:
            self._translate_sketch(delta)
        return self

    def shift(self, dx: float, dy: float) -> LogoUp3D:
        """草平面平移 (SHIFT) [dx, dy] 毫米"""
        old_p = Vector(self.pos)
        delta = self.right * float(dx) + self.heading * float(dy)
        self.pos = self.pos + delta
        step_dir = delta.normalized() if delta.length > 1e-5 else self.heading
        self._record_step(old_p, self.pos, step_dir)
        if not self.is_drawing:
            self._translate_sketch(delta)
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
        self.is_active = True
        return self

    def extrude(self, height: float) -> LogoUp3D:
        """拉伸 (EXTRUDE) 高 [height] 毫米 (直接支持组合平面、中空套筒或实心体拉伸)"""
        h = float(height)
        if abs(h) < 1e-4:
            return self

        if self.is_drawing:
            self.done()

        if len(self.current_sketch_faces) > 1:
            self._combine_sketch_faces()

        target_face = self.last_sketch_face
        if target_face is None and self.current_sketch_faces:
            target_face = self.current_sketch_faces[0]

        if target_face is not None:
            try:
                solid = b3d.extrude(target_face, amount=h, dir=self.up_dir)
                self._integrate_solid(solid)
                # NOTE: 拉伸后保留当前草图截面，支持后续向上移动 (up/jump) 或原地继续拉伸形成复合造型
            except Exception as e:
                logger.warning(f"extrude 失败: {e}")
        return self

    def cextrude(self, height: float) -> LogoUp3D:
        """双向拉伸 (CEXTRUDE) 高 [height] 毫米 (中心对称拉伸，支持组合平面)"""
        h = float(height)
        if abs(h) < 1e-4:
            return self

        if self.is_drawing:
            self.done()

        if len(self.current_sketch_faces) > 1:
            self._combine_sketch_faces()

        target_face = self.last_sketch_face
        if target_face is None and self.current_sketch_faces:
            target_face = self.current_sketch_faces[0]

        if target_face is not None:
            try:
                solid = b3d.extrude(target_face, amount=h / 2.0, both=True, dir=self.up_dir)
                self._integrate_solid(solid)
                # NOTE: 双向拉伸后同样保留当前草图截面
            except Exception as e:
                logger.warning(f"cextrude 失败: {e}")
        return self

    def pyramid(self, height: float) -> LogoUp3D:
        """锥拉伸 (PYRAMID) 高 [height] 毫米：生成数学严格尖顶棱锥、圆锥或空心圆锥"""
        h = float(height)
        if abs(h) < 1e-4:
            return self

        if self.is_drawing:
            self.done()

        if len(self.current_sketch_faces) > 1:
            self._combine_sketch_faces()

        target_face = self.last_sketch_face
        if target_face is None and self.current_sketch_faces:
            target_face = self.current_sketch_faces[0]

        if target_face is not None:
            try:
                base_face = target_face
                edges = base_face.edges()
                normal = self.up_dir.normalized()
                h_mag = abs(h)
                eff_norm = normal if h >= 0 else -normal

                circle_edges = [e for e in edges if e.geom_type.name in ["CIRCLE", "ELLIPSE"]]
                if len(circle_edges) >= 2:
                    # 包含内孔的圆环草图（未填充圆形） -> 生成数学严格空心圆锥！
                    radii = [e.radius for e in circle_edges if hasattr(e, "radius")]
                    if len(radii) >= 2:
                        R = max(radii)
                        r = min(radii)
                    else:
                        R = max(e.length / (2 * math.pi) for e in circle_edges)
                        r = min(e.length / (2 * math.pi) for e in circle_edges)
                    c = base_face.center()
                    c_out = b3d.Cone(bottom_radius=R, top_radius=0.0, height=h_mag, align=(b3d.Align.CENTER, b3d.Align.CENTER, b3d.Align.MIN))
                    c_in = b3d.Cone(bottom_radius=r, top_radius=0.0, height=h_mag, align=(b3d.Align.CENTER, b3d.Align.CENTER, b3d.Align.MIN))
                    plane = Plane(origin=c, z_dir=eff_norm)
                    solid = plane * (c_out - c_in)
                elif len(circle_edges) == 1:
                    # 单实心圆 -> 生成实心圆锥
                    e = circle_edges[0]
                    r = e.radius if hasattr(e, "radius") else (base_face.area / math.pi) ** 0.5
                    c = base_face.center()
                    cone = b3d.Cone(bottom_radius=r, top_radius=0.0, height=h_mag, align=(b3d.Align.CENTER, b3d.Align.CENTER, b3d.Align.MIN))
                    plane = Plane(origin=c, z_dir=eff_norm)
                    solid = plane * cone
                else:
                    # 多边形或带内孔的多边形
                    wires = base_face.wires()
                    c = base_face.center()
                    if len(wires) >= 2:
                        outer_w = base_face.outer_wire() if hasattr(base_face, "outer_wire") else wires[0]
                        inner_w = [w for w in wires if w != outer_w][0]
                        center = c
                        apex = center + normal * h
                        out_sides = [Face(Wire.make_polygon([e.start_point(), e.end_point(), apex, e.start_point()])) for e in outer_w.edges()]
                        out_pyr = Solid(b3d.Shell([Face(outer_w)] + out_sides))
                        in_sides = [Face(Wire.make_polygon([e.start_point(), e.end_point(), apex, e.start_point()])) for e in inner_w.edges()]
                        in_pyr = Solid(b3d.Shell([Face(inner_w)] + in_sides))
                        solid = out_pyr - in_pyr
                    else:
                        center = c
                        apex = center + normal * h
                        wire = base_face.outer_wire() if hasattr(base_face, "outer_wire") else wires[0]
                        side_faces = []
                        for edge in wire.edges():
                            p1 = edge.start_point()
                            p2 = edge.end_point()
                            tri_wire = Wire.make_polygon([p1, p2, apex, p1])
                            side_faces.append(Face(tri_wire))
                        shell = b3d.Shell([base_face] + side_faces)
                        solid = Solid(shell)

                self._integrate_solid(solid)
                # 锥拉伸完成后，游标定位在原草图中心 c，并保留草图截面
                self.pos = c
            except Exception as e:
                logger.warning(f"pyramid 失败: {e}")
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
                if self.last_sketch_face in self.current_sketch_faces:
                    self.current_sketch_faces.remove(self.last_sketch_face)
                self.last_sketch_face = None
                self.last_solid_face = None
                self.last_hollow_face = None
                self.pending_sketch_wires.clear()
            except Exception:
                pass
        return self

    def scale(self, factor: float) -> LogoUp3D:
        """草图缩放至 (SCALE) 指定倍数 (以当前草图中心/游标为中心局部等比缩放)"""
        f = float(factor)
        if abs(f) < 1e-4:
            return self

        # 确定局部缩放中心点
        center = Vector(self.pos)
        if self.last_sketch_face is not None:
            try:
                center = self.last_sketch_face.center()
            except Exception:
                center = Vector(self.pos)

        def _scale_face_local(face: Face, s: float, c: Vector) -> Face:
            t1 = Location(-c)
            t2 = Location(c)
            f_centered = t1 * face
            f_scaled = b3d.scale(f_centered, by=s)
            res = t2 * f_scaled
            if hasattr(face, "color") and face.color is not None:
                res.color = face.color
            return res

        def _scale_wire_local(wire: Wire, s: float, c: Vector) -> Wire:
            t1 = Location(-c)
            t2 = Location(c)
            w_centered = t1 * wire
            w_scaled = b3d.scale(w_centered, by=s)
            res = t2 * w_scaled
            if hasattr(wire, "color") and wire.color is not None:
                res.color = wire.color
            return res

        try:
            if self.last_sketch_face is not None:
                old_last = self.last_sketch_face
                new_last = _scale_face_local(old_last, f, center)
                self.last_sketch_face = new_last
                self.current_sketch_faces = [
                    new_last if f_item is old_last else _scale_face_local(f_item, f, center)
                    for f_item in self.current_sketch_faces
                ]
            elif self.current_sketch_faces:
                self.current_sketch_faces = [_scale_face_local(f_item, f, center) for f_item in self.current_sketch_faces]
                self.last_sketch_face = self.current_sketch_faces[-1]

            if self.last_solid_face is not None:
                self.last_solid_face = _scale_face_local(self.last_solid_face, f, center)
            if self.last_hollow_face is not None:
                self.last_hollow_face = _scale_face_local(self.last_hollow_face, f, center)

            if self.pending_sketch_wires:
                self.pending_sketch_wires = [_scale_wire_local(w, f, center) for w in self.pending_sketch_wires]
            if self.last_sketch_wire is not None:
                self.last_sketch_wire = _scale_wire_local(self.last_sketch_wire, f, center)
        except Exception as e:
            logger.warning(f"scale 缩放失败: {e}")

        return self

    def link(self) -> LogoUp3D:
        """连接形状到当前草图 (LINK)：平滑放样连接上一草图截面与当前草图截面成三维实体"""
        curr_face = self.last_solid_face if self.last_solid_face is not None else self.last_sketch_face
        if curr_face is None and self.current_sketch_faces:
            curr_face = self.current_sketch_faces[-1]

        prev_face = None
        if self._body_sections:
            prev_face = self._body_sections[-1]
        elif self._prev_sketch_face is not None:
            prev_face = self._prev_sketch_face

        if prev_face is not None and curr_face is not None and prev_face is not curr_face:
            loft_solid = None
            try:
                loft_solid = b3d.loft([prev_face, curr_face])
            except Exception as e1:
                try:
                    loft_solid = b3d.loft([prev_face, curr_face], ruled=True)
                except Exception as e2:
                    logger.warning(f"link 放样失败: {e1}, {e2}")

            if loft_solid is not None:
                self._integrate_solid(loft_solid)
                self._body_sections.append(curr_face)
                self._prev_sketch_face = curr_face
        elif prev_face is None and curr_face is not None:
            self._body_sections.append(curr_face)
            self._prev_sketch_face = curr_face

        return self

    # =========================================================================
    # 7. 三维构件 (3D Components / Primitives)
    # =========================================================================

    def box(self, length: float, width: float, height: float) -> LogoUp3D:
        """长方体 长 [length] 宽 [width] 高 [height] (底部中心位于当前游标)"""
        l, w, h = float(length), float(width), float(height)
        b = b3d.Box(l, w, h, align=(b3d.Align.CENTER, b3d.Align.CENTER, b3d.Align.MIN))
        world_box = self.current_plane * b
        return self._integrate_solid(world_box)

    def cylinder(self, radius: float, height: float) -> LogoUp3D:
        """圆柱 半径 [radius] 高 [height] (底部中心位于当前游标)"""
        r, h = max(0.1, float(radius)), float(height)
        cyl = b3d.Cylinder(radius=r, height=h, align=(b3d.Align.CENTER, b3d.Align.CENTER, b3d.Align.MIN))
        world_cyl = self.current_plane * cyl
        return self._integrate_solid(world_cyl)

    def sphere(self, radius: float) -> LogoUp3D:
        """球体 半径 [radius] (球心位于当前游标)"""
        r = max(0.1, float(radius))
        sph = b3d.Sphere(radius=r).locate(Location(self.pos))
        return self._integrate_solid(sph)

    def ellipsoid(self, rx: float, ry: float, rz: float) -> LogoUp3D:
        """椭球 半轴 [rx] [ry] [rz] (中心位于当前游标，对标 media_1789106051952.png)"""
        a, b, c = max(0.1, float(rx)), max(0.1, float(ry)), max(0.1, float(rz))
        s = b3d.Sphere(radius=1.0)
        ell = b3d.scale(s, by=(a, b, c)).locate(Location(self.pos))
        return self._integrate_solid(ell)

    def pyramid_solid(self, sides: int, radius: float, height: float) -> LogoUp3D:
        """棱锥 边数 [sides] 半径 [radius] 高 [height] (严格尖顶正多棱锥，底部中心位于当前游标)"""
        n = max(3, int(sides))
        r, h = max(0.1, float(radius)), float(height)
        base_poly = b3d.RegularPolygon(radius=r, side_count=n)
        base_face = self.current_plane * base_poly.faces()[0]
        center = base_face.center()
        apex = center + self.up_dir.normalized() * h
        wire = base_face.outer_wire()
        side_faces = []
        for edge in wire.edges():
            p1 = edge.start_point()
            p2 = edge.end_point()
            tri_wire = Wire.make_polygon([p1, p2, apex, p1])
            side_faces.append(Face(tri_wire))
        shell = b3d.Shell([base_face] + side_faces)
        solid = Solid(shell)
        return self._integrate_solid(solid)

    def torus(self, major_radius: float, minor_radius: float) -> LogoUp3D:
        """圆环 大圆半径 [major_radius] 小圆半径 [minor_radius] (圆环中心位于当前游标)"""
        r1, r2 = max(0.2, float(major_radius)), max(0.1, float(minor_radius))
        t = b3d.Torus(major_radius=r1, minor_radius=r2)
        world_torus = self.current_plane * t
        return self._integrate_solid(world_torus)

    def cone(self, bottom_radius: float, height: float, top_radius: float = 0.0) -> LogoUp3D:
        """圆锥/圆台 底面半径 [bottom_radius] 高 [height] 顶面半径 [top_radius] (底部中心位于当前游标)"""
        r1, h = max(0.01, float(bottom_radius)), float(height)
        r2 = max(0.0, float(top_radius))
        h_mag = abs(h)
        eff_norm = self.up_dir.normalized() if h >= 0 else -self.up_dir.normalized()
        c = b3d.Cone(bottom_radius=r1, top_radius=r2, height=h_mag, align=(b3d.Align.CENTER, b3d.Align.CENTER, b3d.Align.MIN))
        plane = Plane(origin=self.pos, z_dir=eff_norm)
        world_cone = plane * c
        return self._integrate_solid(world_cone)

    # =========================================================================
    # 8. 导出最终 3D 几何实体与视口元数据 (给沙箱与 Three.js 视口)
    # =========================================================================

    def has_activity(self) -> bool:
        """检查 LogoUp 引擎是否有绘制、位移或实体构建活动"""
        return (
            bool(self.solids)
            or bool(self.current_sketch_faces)
            or bool(self.pending_sketch_wires)
            or bool(self.trail_segments)
            or self.is_active
            or self.pos.length > 1e-4
        )

    def get_viewer_metadata(self) -> Dict[str, Any]:
        """
        输出提供给 Three.js 视口渲染的游标、方向指示箭头、草图工作基准面与草图线框元数据
        """
        wire_polygons = []
        for w in self.pending_sketch_wires:
            pts = _discretize_wire(w)
            if len(pts) >= 2:
                wire_polygons.append(pts)

        drawing_pts = []
        if self.is_drawing and self.current_path_points:
            drawing_pts = [[round(p.X, 3), round(p.Y, 3), round(p.Z, 3)] for p in self.current_path_points]

        return {
            "pos": [round(self.pos.X, 3), round(self.pos.Y, 3), round(self.pos.Z, 3)],
            "heading": [round(self.heading.X, 4), round(self.heading.Y, 4), round(self.heading.Z, 4)],
            "up_dir": [round(self.up_dir.X, 4), round(self.up_dir.Y, 4), round(self.up_dir.Z, 4)],
            "right": [round(self.right.X, 4), round(self.right.Y, 4), round(self.right.Z, 4)],
            "plane": {
                "origin": [round(self.pos.X, 3), round(self.pos.Y, 3), round(self.pos.Z, 3)],
                "x_dir": [round(self.right.X, 4), round(self.right.Y, 4), round(self.right.Z, 4)],
                "y_dir": [round(self.heading.X, 4), round(self.heading.Y, 4), round(self.heading.Z, 4)],
                "normal": [round(self.up_dir.X, 4), round(self.up_dir.Y, 4), round(self.up_dir.Z, 4)],
            },
            "trails": self.trail_segments,
            "pending_sketch_wires": wire_polygons,
            "drawing_path": drawing_pts,
            "pen_width": round(self.pen_width, 2),
            "has_solids": len(self.solids) > 0,
            "has_sketch": self.last_sketch_face is not None or len(self.pending_sketch_wires) > 0,
            "is_active": self.has_activity(),
        }

    def to_part(self) -> Any:
        """输出最终装配成的 3D Solid / Compound / Wire / 轨迹线"""
        sketch_color = Color(234 / 255.0, 88 / 255.0, 12 / 255.0)

        if self.solids:
            if len(self.solids) == 1:
                return self.solids[0]
            return Compound(children=self.solids)
        if self.current_sketch_faces:
            for f in self.current_sketch_faces:
                try:
                    f.color = sketch_color
                except Exception:
                    pass
            if len(self.current_sketch_faces) == 1:
                return self.current_sketch_faces[0]
            return Compound(children=self.current_sketch_faces)
        if self.pending_sketch_wires:
            for w in self.pending_sketch_wires:
                try:
                    w.color = sketch_color
                except Exception:
                    pass
            if len(self.pending_sketch_wires) == 1:
                return self.pending_sketch_wires[0]
            return Compound(children=self.pending_sketch_wires)
        if self.trail_segments:
            try:
                edges = []
                for t in self.trail_segments:
                    p1 = Vector(*t["start"])
                    p2 = Vector(*t["end"])
                    if (p2 - p1).length > 1e-4:
                        e = Edge.make_line(p1, p2)
                        e.color = sketch_color
                        edges.append(e)
                if edges:
                    comp = Compound(children=edges)
                    comp.color = sketch_color
                    return comp
            except Exception:
                pass
        if self.is_active or self.pos.length > 1e-4:
            return b3d.Sphere(radius=0.01).locate(Location(self.pos))
        return None

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

def fd(distance: float) -> LogoUp3D:
    return _DEFAULT_LOGOUP.fd(distance)

def forward(distance: float) -> LogoUp3D:
    return _DEFAULT_LOGOUP.forward(distance)

def bk(distance: float) -> LogoUp3D:
    return _DEFAULT_LOGOUP.bk(distance)

def back(distance: float) -> LogoUp3D:
    return _DEFAULT_LOGOUP.back(distance)

def backward(distance: float) -> LogoUp3D:
    return _DEFAULT_LOGOUP.backward(distance)

def rt(deg: float) -> LogoUp3D:
    return _DEFAULT_LOGOUP.rt(deg)

def lt(deg: float) -> LogoUp3D:
    return _DEFAULT_LOGOUP.lt(deg)

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

def step_up(distance: float) -> LogoUp3D:
    return _DEFAULT_LOGOUP.step_up(distance)

def step_down(distance: float) -> LogoUp3D:
    return _DEFAULT_LOGOUP.step_down(distance)

def down(distance: float) -> LogoUp3D:
    return _DEFAULT_LOGOUP.down(distance)

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

def rotatex(deg: float) -> LogoUp3D:
    return _DEFAULT_LOGOUP.rotatex(deg)

def rotatey(deg: float) -> LogoUp3D:
    return _DEFAULT_LOGOUP.rotatey(deg)

def rotatez(deg: float) -> LogoUp3D:
    return _DEFAULT_LOGOUP.rotatez(deg)

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

def link() -> LogoUp3D:
    return _DEFAULT_LOGOUP.link()

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

def cone(bottom_radius: float, height: float, top_radius: float = 0.0) -> LogoUp3D:
    return _DEFAULT_LOGOUP.cone(bottom_radius, height, top_radius)

def ellipsoid(rx: float, ry: float, rz: float) -> LogoUp3D:
    return _DEFAULT_LOGOUP.ellipsoid(rx, ry, rz)

def get_model() -> Any:
    return _DEFAULT_LOGOUP.to_part()

def get_viewer_metadata() -> Dict[str, Any]:
    return _DEFAULT_LOGOUP.get_viewer_metadata()

def has_activity() -> bool:
    return _DEFAULT_LOGOUP.has_activity()
