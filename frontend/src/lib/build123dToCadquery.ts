/**
 * build123d 到 CadQuery 单向代码转换与导出器 (One-way Export Engine)
 * 将 build123d 的 Builder 与 Primitives 语法转换为 CadQuery Fluent API 脚本
 */

export function convertBuild123dToCadQuery(b3dCode: string): string {
  const lines = b3dCode.split(/\r?\n/);
  const cqLines: string[] = [
    "import cadquery as cq",
    "",
    "# ----------------------------------------------------",
    "# 本代码由 build123d 模型自动转译生成 (CadQuery 单向导出)",
    "# ----------------------------------------------------",
    "",
  ];

  let currentPlane = "XY";
  const ops: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("from build123d") || trimmed.startsWith("import build123d")) {
      continue;
    }

    if (trimmed.startsWith("#")) {
      cqLines.push(trimmed);
      continue;
    }

    // BuildPart(Plane.XX)
    if (/with\s+BuildPart\s*\((.*?)\)/i.test(trimmed)) {
      if (/Plane\.XZ/i.test(trimmed)) currentPlane = "XZ";
      else if (/Plane\.YZ/i.test(trimmed)) currentPlane = "YZ";
      else currentPlane = "XY";
      continue;
    }

    // Box
    if (/Box\s*\((.*?)\)/i.test(trimmed)) {
      const nums = trimmed.match(/([-\d.]+)/g) || [];
      const l = nums[0] || "20";
      const w = nums[1] || "20";
      const h = nums[2] || "10";
      ops.push(`.box(${l}, ${w}, ${h})`);
      continue;
    }

    // Cylinder
    if (/Cylinder\s*\((.*?)\)/i.test(trimmed)) {
      const rMatch = trimmed.match(/radius\s*=\s*([-\d.]+)/i) || trimmed.match(/Cylinder\s*\(\s*([-\d.]+)/i);
      const hMatch = trimmed.match(/height\s*=\s*([-\d.]+)/i) || trimmed.match(/,\s*([-\d.]+)/i);
      const r = rMatch ? rMatch[1] : "10";
      const h = hMatch ? hMatch[1] : "20";
      ops.push(`.cylinder(${h}, ${r})`);
      continue;
    }

    // Sphere
    if (/Sphere\s*\((.*?)\)/i.test(trimmed)) {
      const rMatch = trimmed.match(/radius\s*=\s*([-\d.]+)/i) || trimmed.match(/Sphere\s*\(\s*([-\d.]+)/i);
      const r = rMatch ? rMatch[1] : "10";
      ops.push(`.sphere(${r})`);
      continue;
    }

    // Rectangle
    if (/Rectangle\s*\((.*?)\)/i.test(trimmed)) {
      const nums = trimmed.match(/([-\d.]+)/g) || [];
      const w = nums[0] || "20";
      const h = nums[1] || "20";
      ops.push(`.rect(${w}, ${h})`);
      continue;
    }

    // Circle
    if (/Circle\s*\((.*?)\)/i.test(trimmed)) {
      const rMatch = trimmed.match(/radius\s*=\s*([-\d.]+)/i) || trimmed.match(/Circle\s*\(\s*([-\d.]+)/i);
      const r = rMatch ? rMatch[1] : "10";
      ops.push(`.circle(${r})`);
      continue;
    }

    // extrude
    if (/extrude\s*\((.*?)\)/i.test(trimmed)) {
      const aMatch = trimmed.match(/amount\s*=\s*([-\d.]+)/i) || trimmed.match(/extrude\s*\(\s*([-\d.]+)/i);
      const a = aMatch ? aMatch[1] : "10";
      ops.push(`.extrude(${a})`);
      continue;
    }

    // fillet
    if (/fillet\s*\((.*?)\)/i.test(trimmed)) {
      const rMatch = trimmed.match(/radius\s*=\s*([-\d.]+)/i) || trimmed.match(/,\s*([-\d.]+)\s*\)/i);
      const r = rMatch ? rMatch[1] : "2";
      ops.push(`.edges().fillet(${r})`);
      continue;
    }

    // chamfer
    if (/chamfer\s*\((.*?)\)/i.test(trimmed)) {
      const lMatch = trimmed.match(/length\s*=\s*([-\d.]+)/i) || trimmed.match(/,\s*([-\d.]+)\s*\)/i);
      const l = lMatch ? lMatch[1] : "2";
      ops.push(`.edges().chamfer(${l})`);
      continue;
    }

    // Hole
    if (/Hole\s*\((.*?)\)/i.test(trimmed)) {
      const rMatch = trimmed.match(/radius\s*=\s*([-\d.]+)/i) || trimmed.match(/Hole\s*\(\s*([-\d.]+)/i);
      const dMatch = trimmed.match(/depth\s*=\s*([-\d.]+)/i) || trimmed.match(/,\s*([-\d.]+)\s*\)/i);
      const d = rMatch ? parseFloat(rMatch[1]) * 2 : 6;
      const depth = dMatch ? dMatch[1] : "10";
      ops.push(`.hole(${d}, ${depth})`);
      continue;
    }
  }

  if (ops.length === 0) {
    cqLines.push(`part = cq.Workplane("${currentPlane}").box(20, 20, 10)\n`);
  } else {
    cqLines.push(`part = (`);
    cqLines.push(`    cq.Workplane("${currentPlane}")`);
    for (const op of ops) {
      cqLines.push(`    ${op}`);
    }
    cqLines.push(`)\n`);
  }

  cqLines.push("if 'show_object' in globals():");
  cqLines.push("    show_object(part)\n");

  return cqLines.join("\n");
}
