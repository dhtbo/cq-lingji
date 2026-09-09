"use client";

import React, { useEffect, useRef } from "react";
import * as Blockly from "blockly";
import * as zhHans from "blockly/msg/zh-hans";
import { registerAllBuild123dBlocks } from "./blocks";
import { registerBuild123dGenerator, workspaceToBuild123d } from "./generator/build123d";
import { BUILD123D_TOOLBOX } from "./toolbox";
import { createCadQueryZelosTheme } from "./theme";

interface BlocklyWorkspaceProps {
  onCodeChange: (code: string) => void;
  workspaceRefOut?: React.MutableRefObject<Blockly.WorkspaceSvg | null>;
  colorMode?: "light" | "dark";
}

export const BlocklyWorkspace: React.FC<BlocklyWorkspaceProps> = ({
  onCodeChange,
  workspaceRefOut,
  colorMode = "dark",
}) => {
  const blocklyDiv = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null);

  useEffect(() => {
    if (!blocklyDiv.current) return;

    // 1. 设置简体中文语言包
    Blockly.setLocale(zhHans as any);

    // 2. 注册自定义积木与生成器
    registerAllBuild123dBlocks();
    registerBuild123dGenerator();

    // 3. 创建 Zelos Scratch 风格主题 (根据 colorMode)
    const zelosTheme = createCadQueryZelosTheme(colorMode);

    // 4. 挂载注入 Blockly 工作区
    const workspace = Blockly.inject(blocklyDiv.current, {
      toolbox: BUILD123D_TOOLBOX,
      theme: zelosTheme,
      renderer: "zelos", // Scratch 3.0 风格圆角曲率渲染器
      sounds: false, // 禁用默认云端音效，避免无外网时连接超时
      grid: {
        spacing: 24,
        length: 3,
        colour: colorMode === "light" ? "#e2e8f0" : "#21262d",
        snap: true,
      },
      zoom: {
        controls: true,
        wheel: true,
        startScale: 0.85,
        maxScale: 2.0,
        minScale: 0.4,
        scaleSpeed: 1.1,
        pinch: true,
      },
      trashcan: true,
      move: {
        scrollbars: {
          horizontal: true,
          vertical: true,
        },
        drag: true,
        wheel: false,
      },
    });

    workspaceRef.current = workspace;
    if (workspaceRefOut) {
      workspaceRefOut.current = workspace;
    }

    // 5. 插入默认新手 build123d 经典建模积木组合
    const buildPart = workspace.newBlock("b3d_build_part");
    buildPart.setFieldValue("XY", "PLANE");
    buildPart.initSvg();
    buildPart.render();
    buildPart.moveTo(new Blockly.utils.Coordinate(40, 40));

    const boxOp = workspace.newBlock("b3d_box");
    boxOp.setFieldValue(20, "LENGTH");
    boxOp.setFieldValue(20, "WIDTH");
    boxOp.setFieldValue(10, "HEIGHT");
    boxOp.setFieldValue("ADD", "MODE");
    boxOp.initSvg();
    boxOp.render();

    const cylOp = workspace.newBlock("b3d_cylinder");
    cylOp.setFieldValue(6, "RADIUS");
    cylOp.setFieldValue(18, "HEIGHT");
    cylOp.setFieldValue("ADD", "MODE");
    cylOp.initSvg();
    cylOp.render();

    const filletOp = workspace.newBlock("b3d_fillet");
    filletOp.setFieldValue(1.5, "RADIUS");
    filletOp.setFieldValue("ALL", "TARGET");
    filletOp.initSvg();
    filletOp.render();

    // 连接积木堆到 BuildPart 的内部槽位
    const doConnection = buildPart.getInput("DO")?.connection;
    if (doConnection) {
      doConnection.connect(boxOp.previousConnection);
      boxOp.nextConnection?.connect(cylOp.previousConnection);
      cylOp.nextConnection?.connect(filletOp.previousConnection);
    }

    // 初始生成代码
    const initialCode = workspaceToBuild123d(workspace);
    onCodeChange(initialCode);

    // 6. 监听积木变更事件 (忽略非内容性纯UI滚动缩放事件)
    const changeListener = (e: Blockly.Events.Abstract) => {
      if (e.isUiEvent || e.type === Blockly.Events.VIEWPORT_CHANGE) return;
      const code = workspaceToBuild123d(workspace);
      onCodeChange(code);
    };

    workspace.addChangeListener(changeListener);

    // 7. 响应尺寸自适应变化
    const resizeObserver = new ResizeObserver(() => {
      Blockly.svgResize(workspace);
    });
    resizeObserver.observe(blocklyDiv.current);

    // 8. 彻底解决积木盒子 (Flyout) 关闭后右侧垂直滚动条/边框残留问题
    const flyout = workspace.getFlyout();
    if (flyout) {
      const origHide = flyout.hide.bind(flyout);
      flyout.hide = () => {
        origHide();
        const scrollbars = blocklyDiv.current?.querySelectorAll<SVGElement>(".blocklyFlyoutScrollbar");
        scrollbars?.forEach((sb) => {
          sb.style.display = "none";
          sb.style.visibility = "hidden";
          sb.style.opacity = "0";
        });
      };

      const origShow = flyout.show.bind(flyout);
      flyout.show = (xmlList: any) => {
        origShow(xmlList);
        const scrollbars = blocklyDiv.current?.querySelectorAll<SVGElement>(".blocklyFlyoutScrollbar");
        scrollbars?.forEach((sb) => {
          sb.style.display = "";
          sb.style.visibility = "";
          sb.style.opacity = "";
        });
      };
    }

    // 9. DOM 变更观察器双重兜底
    const flyoutObserver = new MutationObserver(() => {
      const flyouts = blocklyDiv.current?.querySelectorAll<SVGElement>(".blocklyFlyout");
      flyouts?.forEach((flyoutEl) => {
        const styleStr = flyoutEl.getAttribute("style") || "";
        const isHidden = flyoutEl.style.display === "none" || styleStr.includes("display: none");
        if (isHidden) {
          const scrollbars = blocklyDiv.current?.querySelectorAll<SVGElement>(".blocklyFlyoutScrollbar");
          scrollbars?.forEach((sb) => {
            if (sb.style.display !== "none") {
              sb.style.display = "none";
              sb.style.visibility = "hidden";
              sb.style.opacity = "0";
            }
          });
        }
      });
    });

    flyoutObserver.observe(blocklyDiv.current, {
      attributes: true,
      subtree: true,
      attributeFilter: ["style", "class"],
    });

    return () => {
      flyoutObserver.disconnect();
      resizeObserver.disconnect();
      workspace.removeChangeListener(changeListener);
      workspace.dispose();
      workspaceRef.current = null;
      if (workspaceRefOut) {
        workspaceRefOut.current = null;
      }
    };
  }, []);

  // 监听外部明暗模式变化，动态换肤并调整工作区
  useEffect(() => {
    if (!workspaceRef.current) return;
    try {
      const newTheme = createCadQueryZelosTheme(colorMode);
      workspaceRef.current.setTheme(newTheme);

      // 动态更新网格点线颜色
      const gridPatternLines = blocklyDiv.current?.querySelectorAll(".blocklyGridPattern line");
      if (gridPatternLines) {
        const gridStroke = colorMode === "light" ? "#e2e8f0" : "#21262d";
        gridPatternLines.forEach((line) => line.setAttribute("stroke", gridStroke));
      }
    } catch (e) {
      console.error("更新 Blockly 主题失败:", e);
    }
  }, [colorMode]);

  const isLight = colorMode === "light";

  return (
    <div className={`relative w-full h-full flex flex-col ${isLight ? "bg-[#f8fafc]" : "bg-[#0d1117]"} overflow-hidden`}>
      {/* 面板标题栏 */}
      <div
        className={`h-9 px-3 flex items-center justify-between ${
          isLight
            ? "bg-[#f3f4f6] border-b border-[#e5e7eb] text-gray-800"
            : "bg-[#161b22] border-b border-[#30363d] text-gray-300"
        } text-xs font-semibold`}
      >
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
          <span>图形积木 (Blockly Zelos)</span>
        </div>
        <span className={`text-[11px] ${isLight ? "text-gray-500" : "text-gray-400"} font-normal`}>
          拖拽积木实时生成代码
        </span>
      </div>

      {/* Blockly 挂载 DOM 容器 */}
      <div ref={blocklyDiv} className="flex-1 w-full h-full relative" />
    </div>
  );
};
