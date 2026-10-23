import * as THREE from "three";

/**
 * LogoUp 游标与草图元数据接口
 */
export interface LogoUpCursorMetadata {
  pos: [number, number, number];
  heading: [number, number, number];
  up_dir: [number, number, number];
  right: [number, number, number];
  plane?: {
    origin: [number, number, number];
    x_dir: [number, number, number];
    y_dir: [number, number, number];
    normal: [number, number, number];
  };
  trails?: Array<{
    start: [number, number, number];
    end: [number, number, number];
    dir: [number, number, number];
    length: number;
  }>;
  pending_sketch_wires?: Array<Array<[number, number, number]>>;
  drawing_path?: Array<[number, number, number]>;
  pen_width?: number;
  has_solids?: boolean;
  has_sketch?: boolean;
  is_active?: boolean;
}

const OVERLAY_GROUP_NAME = "__logoup_elements_overlay__";

/**
 * 创建高对比度发光文字 Sprite (X, Y, Z)
 */
function createTextSprite(text: string, color: string): THREE.Sprite {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.clearRect(0, 0, 128, 128);
    ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
    ctx.shadowBlur = 8;
    ctx.font = "bold 84px sans-serif";
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 64, 64);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(2.2, 2.2, 1);
  return sprite;
}

/**
 * 构建高保真三维游标 Group (缩小一倍，小巧精致且支持动态旋转姿态对齐)
 */
function buildCursorGroup(metadata: LogoUpCursorMetadata, cursorScale: number = 1.0): THREE.Group {
  const group = new THREE.Group();
  group.name = "logoup_cursor";

  // 1. 白色立方体底座与基底边框 (缩小 50%：1.2mm)
  const baseSize = 1.2;
  const baseGeo = new THREE.BoxGeometry(baseSize, baseSize, baseSize);
  const baseMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.3,
    metalness: 0.1,
  });
  const baseMesh = new THREE.Mesh(baseGeo, baseMat);
  baseMesh.position.set(0, 0, baseSize / 2);
  group.add(baseMesh);

  // 底座黄色脚标线框
  const frameGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(baseSize * 1.35, baseSize * 1.35, 0.2));
  const frameMat = new THREE.LineBasicMaterial({ color: 0xf59e0b });
  const frameLine = new THREE.LineSegments(frameGeo, frameMat);
  frameLine.position.set(0, 0, 0.1);
  group.add(frameLine);

  // 2. 红褐色双棱锥晶体 (缩小 50%：半径 1.8mm)
  const crystalRadius = 1.8;
  const crystalGeo = new THREE.OctahedronGeometry(crystalRadius, 0);
  crystalGeo.scale(1.0, 1.0, 1.45); // 沿局部 Z 轴拉伸形成双尖棱形
  const crystalMat = new THREE.MeshStandardMaterial({
    color: 0xb4431d, // 对标图 2 红褐色 / 赭红晶体色
    roughness: 0.25,
    metalness: 0.2,
    flatShading: true,
  });
  const crystalMesh = new THREE.Mesh(crystalGeo, crystalMat);
  crystalMesh.rotation.z = Math.PI / 4; // 旋转 45 度使得四棱面对齐坐标轴
  crystalMesh.position.set(0, 0, baseSize + crystalRadius * 1.45);
  group.add(crystalMesh);

  // 3. 局部 Z 轴 (从晶体顶部垂直向上 +Z 伸展，蓝色轴柱 + 蓝色圆锥箭头 + 蓝色 "Z" 标签)
  const zAxisLen = 6.0;
  const zStemGeo = new THREE.CylinderGeometry(0.22, 0.22, zAxisLen, 12);
  const zMat = new THREE.MeshBasicMaterial({ color: 0x2563eb });
  const zStem = new THREE.Mesh(zStemGeo, zMat);
  zStem.rotation.x = Math.PI / 2; // +Y 旋至 +Z
  const zStart = crystalMesh.position.z + crystalRadius * 1.45;
  zStem.position.set(0, 0, zStart + zAxisLen / 2);
  zStem.renderOrder = 200;
  group.add(zStem);

  const zConeGeo = new THREE.ConeGeometry(0.6, 1.4, 12);
  const zCone = new THREE.Mesh(zConeGeo, zMat);
  zCone.rotation.x = Math.PI / 2; // +Y 旋至 +Z
  zCone.position.set(0, 0, zStart + zAxisLen + 0.7);
  zCone.renderOrder = 200;
  group.add(zCone);

  const zLabel = createTextSprite("Z", "#2563eb");
  zLabel.position.set(0, 0, zStart + zAxisLen + 2.4);
  zLabel.renderOrder = 201;
  group.add(zLabel);

  // 4. 局部 X 轴 (红色轴柱 + 红色圆锥箭头 + 红色 "X" 标签，从原点向局部 +X 延伸)
  const xMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
  const xStemGeo = new THREE.CylinderGeometry(0.22, 0.22, 9, 12);
  const xStem = new THREE.Mesh(xStemGeo, xMat);
  xStem.rotation.z = -Math.PI / 2; // +Y 旋至 +X
  xStem.position.set(4.5, 0, baseSize / 2);
  xStem.renderOrder = 200;
  group.add(xStem);

  const xConeGeo = new THREE.ConeGeometry(0.6, 1.4, 12);
  const xCone = new THREE.Mesh(xConeGeo, xMat);
  xCone.rotation.z = -Math.PI / 2; // +Y 旋至 +X
  xCone.position.set(9 + 0.7, 0, baseSize / 2);
  xCone.renderOrder = 200;
  group.add(xCone);

  const xLabel = createTextSprite("X", "#ef4444");
  xLabel.position.set(9 + 2.4, 0, baseSize / 2);
  xLabel.renderOrder = 201;
  group.add(xLabel);

  // 5. 局部 Y 轴 (绿色轴柱 + 绿色圆锥箭头 + 绿色 "Y" 标签，从原点沿前进方向 +Y 延伸)
  const yMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
  const yStemGeo = new THREE.CylinderGeometry(0.22, 0.22, 9, 12);
  const yStem = new THREE.Mesh(yStemGeo, yMat);
  // Cylinder 默认沿 +Y 轴，无需旋转
  yStem.position.set(0, 4.5, baseSize / 2);
  yStem.renderOrder = 200;
  group.add(yStem);

  const yConeGeo = new THREE.ConeGeometry(0.6, 1.4, 12);
  const yCone = new THREE.Mesh(yConeGeo, yMat);
  yCone.position.set(0, 9 + 0.7, baseSize / 2);
  yCone.renderOrder = 200;
  group.add(yCone);

  const yLabel = createTextSprite("Y", "#10b981");
  yLabel.position.set(0, 9 + 2.4, baseSize / 2);
  yLabel.renderOrder = 201;
  group.add(yLabel);

  // 6. 根据局部坐标系姿态动态旋转与定位游标 Group
  const rightVec = new THREE.Vector3(...metadata.right).normalize();
  const headVec = new THREE.Vector3(...metadata.heading).normalize();
  const upVec = new THREE.Vector3(...metadata.up_dir).normalize();
  const basisMat = new THREE.Matrix4().makeBasis(rightVec, headVec, upVec);

  group.setRotationFromMatrix(basisMat);
  group.position.set(...metadata.pos);

  // 7. 屏幕空间恒定尺寸算法：相机缩放时，游标保持恒定屏幕大小，且可自定义尺寸
  const userScale = Math.max(0.2, cursorScale || 1.0);
  baseMesh.onBeforeRender = (_renderer, _scene, camera) => {
    if (camera) {
      updateCursorAdaptiveScale(group, camera, userScale);
    }
  };

  return group;
}

/**
 * 计算并在相机缩放/漫游时实时更新游标屏幕空间尺寸 (保持恒定显示大小，不随 3D 视图缩放而变大变小)
 */
export function updateCursorAdaptiveScale(
  cursorGroup: THREE.Group,
  camera: THREE.Camera,
  userScale: number = 1.0
) {
  if (!cursorGroup || !camera) return;
  const tempPos = new THREE.Vector3();
  cursorGroup.getWorldPosition(tempPos);
  let factor = 1.0;
  if ((camera as any).isPerspectiveCamera) {
    const pCam = camera as THREE.PerspectiveCamera;
    const dist = pCam.position.distanceTo(tempPos);
    // 恒定屏幕占比：约占视口高度的 4%
    factor = dist * Math.tan(THREE.MathUtils.degToRad(pCam.fov / 2)) * 0.04;
  } else if ((camera as any).isOrthographicCamera) {
    const oCam = camera as THREE.OrthographicCamera;
    factor = ((oCam.top - oCam.bottom) / (oCam.zoom || 1)) * 0.04;
  }
  const finalScale = Math.max(0.005, factor * userScale);
  // 仅在 scale 发生实际微小变化时更新，避免无谓重绘
  if (Math.abs(cursorGroup.scale.x - finalScale) > 1e-4) {
    cursorGroup.scale.set(finalScale, finalScale, finalScale);
    cursorGroup.updateMatrixWorld(true);
  }
}

/**
 * 沿当前游标前进方向构建前向指示箭头虚线 (严格对标图 1：多枚紧凑橙色 Chevron 组成的准星虚线)
 * 仅用于指示当前游标绘图方向，随游标旋转而旋转，绝不在历史轨迹上留下残留
 */
function buildDirectionArrowsGroup(metadata: LogoUpCursorMetadata): THREE.Group {
  const group = new THREE.Group();
  group.name = "logoup_direction_arrows";

  const pos = new THREE.Vector3(...metadata.pos);
  const head = new THREE.Vector3(...metadata.heading).normalize();
  const up = new THREE.Vector3(...metadata.up_dir).normalize();
  const right = new THREE.Vector3(...metadata.right).normalize();

  // 构造精巧实心立体 Chevron 箭头 (对标图 1：小巧精巧、高饱和鲜橙色)
  const arrowShape = new THREE.Shape();
  const w = 1.4; // 宽度
  const h = 1.8; // 长度
  const d = 0.9; // 凹角深度
  arrowShape.moveTo(0, h);
  arrowShape.lineTo(w, 0);
  arrowShape.lineTo(w * 0.6, 0);
  arrowShape.lineTo(0, h - d);
  arrowShape.lineTo(-w * 0.6, 0);
  arrowShape.lineTo(-w, 0);
  arrowShape.closePath();

  // 0.25mm 薄立体厚度
  const arrowGeo = new THREE.ExtrudeGeometry(arrowShape, {
    depth: 0.25,
    bevelEnabled: false,
  });

  const arrowMat = new THREE.MeshStandardMaterial({
    color: 0xf97316, // 对标图 1 活力鲜橙色
    roughness: 0.25,
    metalness: 0.1,
    side: THREE.DoubleSide,
  });

  // 箭头姿态：局部 Y 轴对齐 head，Z 轴对齐 up，X 轴对齐 right
  const alignMat = new THREE.Matrix4().makeBasis(right, head, up);

  // 从游标绿色 Y 轴尖端前方 (约 11mm 处) 开始向前等间距排布 9 个箭头
  const startOffset = 11.2;
  const arrowSpacing = 2.2;
  const numArrows = 9;

  for (let i = 0; i < numArrows; i++) {
    const arrowMesh = new THREE.Mesh(arrowGeo, arrowMat);
    arrowMesh.setRotationFromMatrix(alignMat);
    // 沿前进方向定位
    const arrowPos = pos.clone().add(head.clone().multiplyScalar(startOffset + i * arrowSpacing));
    // 略微抬高 0.05mm 避免重合 Z 冲突
    arrowPos.add(up.clone().multiplyScalar(0.05));
    arrowMesh.position.copy(arrowPos);
    arrowMesh.renderOrder = 150;
    group.add(arrowMesh);
  }

  return group;
}

/**
 * 构建当前草图工作基准面 (透明网格工作平面)
 */
function buildSketchPlaneGroup(metadata: LogoUpCursorMetadata): THREE.Group {
  const group = new THREE.Group();
  group.name = "logoup_sketch_plane";

  if (!metadata.plane) return group;

  const size = 60;
  const planeGeo = new THREE.PlaneGeometry(size, size);
  const planeMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.12,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const planeMesh = new THREE.Mesh(planeGeo, planeMat);

  const borderGeo = new THREE.EdgesGeometry(planeGeo);
  const borderMat = new THREE.LineBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.45,
  });
  const borderLine = new THREE.LineSegments(borderGeo, borderMat);
  planeMesh.add(borderLine);

  const pOrigin = new THREE.Vector3(...metadata.plane.origin);
  const pX = new THREE.Vector3(...metadata.plane.x_dir).normalize();
  const pY = new THREE.Vector3(...metadata.plane.y_dir).normalize();
  const pNorm = new THREE.Vector3(...metadata.plane.normal).normalize();

  const planeMat4 = new THREE.Matrix4().makeBasis(pX, pY, pNorm);
  group.setRotationFromMatrix(planeMat4);
  group.position.copy(pOrigin);
  group.add(planeMesh);

  return group;
}

/**
 * 构建未填充草图闭合线框与正在绘制的草图轨迹 (默认鲜橙色高饱和线框，对标图 1 & 图 3)
 */
function buildPendingWiresGroup(metadata: LogoUpCursorMetadata): THREE.Group {
  const group = new THREE.Group();
  group.name = "logoup_pending_wires";

  const sketchOrange = 0xea580c; // 对标图 1 与图 3 高明度鲜橙色
  const penWidth = metadata.pen_width || 1.0;

  // 辅助函数：生成折线轮廓（不使用 CatmullRomCurve3 样条平滑，避免矩形/正方形等直边与直角变形）
  const addStrokePolyline = (pts: THREE.Vector3[], isClosed: boolean) => {
    if (pts.length < 2) return;

    const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
    const lineMat = new THREE.LineBasicMaterial({
      color: sketchOrange,
      linewidth: Math.max(1, Math.round(penWidth)),
      depthTest: false,
    });
    const line = isClosed ? new THREE.LineLoop(lineGeo, lineMat) : new THREE.Line(lineGeo, lineMat);
    line.renderOrder = 180;
    group.add(line);
  };

  // 1. 仅当后端尚未生成 B-Rep 草图面或三维实体时，才兜底渲染待填充闭合线框 (pending_sketch_wires)
  if (!metadata.has_sketch && !metadata.has_solids && metadata.pending_sketch_wires && metadata.pending_sketch_wires.length > 0) {
    for (const wirePts of metadata.pending_sketch_wires) {
      if (wirePts.length < 2) continue;
      const points = wirePts.map((p) => new THREE.Vector3(p[0], p[1], p[2]));
      addStrokePolyline(points, true);
    }
  }

  // 2. 渲染当前正在落笔绘制但尚未 done() 结算的折线 (drawing_path)
  if (metadata.drawing_path && metadata.drawing_path.length >= 2) {
    const points = metadata.drawing_path.map((p) => new THREE.Vector3(p[0], p[1], p[2]));
    addStrokePolyline(points, false);
  }

  // 3. 兜底渲染：仅当既没有实体也没有草图面，且没有待填充线框时，才使用位移轨迹段 trails 呈现橙色草图线
  if (
    !metadata.has_solids &&
    !metadata.has_sketch &&
    (!metadata.pending_sketch_wires || metadata.pending_sketch_wires.length === 0) &&
    metadata.trails &&
    metadata.trails.length > 0
  ) {
    const trailPoints: THREE.Vector3[] = [];
    for (const t of metadata.trails) {
      if (trailPoints.length === 0) {
        trailPoints.push(new THREE.Vector3(...t.start));
      }
      trailPoints.push(new THREE.Vector3(...t.end));
    }
    if (trailPoints.length >= 2) {
      addStrokePolyline(trailPoints, false);
    }
  }

  return group;
}

/**
 * 视口覆盖层图层显隐控制选项
 */
export interface LogoUpOverlayOptions {
  showCursor?: boolean;
  showPlane?: boolean;
  showSketch?: boolean;
  cursorScale?: number;
}

/**
 * 刷新或挂载 LogoUp 3D 视口覆盖层到 Three.js 场景 (支持游标、草图、基准面独立显隐)
 */
export function updateLogoUpOverlay(
  scene: THREE.Scene,
  metadata: LogoUpCursorMetadata | null,
  options?: LogoUpOverlayOptions,
  camera?: THREE.Camera
): void {
  if (!scene) return;

  const oldOverlay = scene.getObjectByName(OVERLAY_GROUP_NAME);
  if (oldOverlay) {
    scene.remove(oldOverlay);
  }

  if (!metadata) return;

  const showCursor = options?.showCursor ?? true;
  const showPlane = options?.showPlane ?? true;
  const showSketch = options?.showSketch ?? true;
  const cursorScale = options?.cursorScale ?? 1.0;

  const overlayGroup = new THREE.Group();
  overlayGroup.name = OVERLAY_GROUP_NAME;

  if (showPlane) {
    overlayGroup.add(buildSketchPlaneGroup(metadata));
  }
  if (showSketch) {
    overlayGroup.add(buildPendingWiresGroup(metadata));
  }
  if (showCursor) {
    overlayGroup.add(buildDirectionArrowsGroup(metadata));
    const cursorGroup = buildCursorGroup(metadata, cursorScale);
    overlayGroup.add(cursorGroup);
    if (camera) {
      updateCursorAdaptiveScale(cursorGroup, camera, cursorScale);
    }
  }

  scene.add(overlayGroup);
}
