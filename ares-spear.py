"""
艾瑞斯之矛 (Ares Spear) 几何逆向重构模型
基于原 STL 几何拓扑逆向提取，生成精确的参数化 CadQuery 模型。
"""

import cadquery as cq


def createAresSpear(
    length: float = 40.0,
    width: float = 30.0,
    height: float = 20.0,
    cornerFilletRadius: float = 3.0,
    wallThickness: float = 3.0,
    bottomThickness: float = 3.0,
) -> cq.Workplane:
    """
    创建艾瑞斯之矛壳体/槽体几何模型

    :param length: 外部总长 (X 轴跨度, 默认 40.0 mm)
    :param width: 外部总宽 (Y 轴跨度, 默认 30.0 mm)
    :param height: 外部总高 (Z 轴跨度, 默认 20.0 mm)
    :param cornerFilletRadius: 外侧 4 条竖直角边的导圆角半径 (默认 3.0 mm)
    :param wallThickness: 四周侧壁厚度 (默认 3.0 mm)
    :param bottomThickness: 底部底板厚度 (默认 3.0 mm)
    :return: 构建完成的 CadQuery Workplane 实体对象
    """
    # 计算内部开槽尺寸：由外轮廓与壁厚确定
    pocketLength = length - 2.0 * wallThickness
    pocketWidth = width - 2.0 * wallThickness
    pocketDepth = height - bottomThickness

    # 1. 以 XY 平面为基准建立原点对称的长方体毛坯
    # 2. 选取 4 条平行于 Z 轴的竖直外边，施加 3.0mm 的圆角过渡
    # 3. 选取顶面 (>Z) 建立局部工作平面，绘制内腔矩形轮廓，向下盲切至预留底厚
    model = (
        cq.Workplane("XY")
        .box(length, width, height)
        .edges("|Z")
        .fillet(cornerFilletRadius)
        .faces(">Z")
        .workplane()
        .rect(pocketLength, pocketWidth)
        .cutBlind(-pocketDepth)
    )

    return model


if __name__ == "__main__":
    # 生成默认标准尺寸模型
    result = createAresSpear()

    # 验证模型拓扑合法性
    assert result.val().isValid(), "模型拓扑校验失败！"

    # 导出 STEP 与 STL 格式模型
    stepOutputPath = "ares_spear.step"
    stlOutputPath = "ares_spear.stl"

    cq.exporters.export(result, stepOutputPath)
    cq.exporters.export(result, stlOutputPath)

    print(f"模型生成成功！")
    print(f"STEP 文件已导出至: {stepOutputPath}")
    print(f"STL 文件已导出至: {stlOutputPath}")
