"use client";

import React, { useEffect, useRef } from "react";
import * as Blockly from "blockly";
import * as zhHans from "blockly/msg/zh-hans";
import { registerAllBuild123dBlocks } from "./blocks";
import { registerAllGenerators, generateCodeForMode } from "./generator";
import { getToolboxForMode, WorkingMode } from "./toolbox";
import { createCadQueryZelosTheme } from "./theme";

interface BlocklyWorkspaceProps {
  onCodeChange: (code: string) => void;
  workspaceRefOut?: React.MutableRefObject<Blockly.WorkspaceSvg | null>;
  colorMode?: "light" | "dark";
  workingMode?: WorkingMode;
  onWorkspaceReady?: (ws: Blockly.WorkspaceSvg) => void;
}

/**
 * 确保工作区中始终最多只保留一个「开始」(logoup_start) 积木
 * 若存在多个「开始」积木，优先保留挂载了后续积木链的那个，并将其他「开始」积木的子链合并后销毁多余的「开始」积木
 */
export function ensureSingleStartBlock(workspace: Blockly.WorkspaceSvg) {
  const startBlocks = workspace.getAllBlocks(false).filter((b) => b.type === "logoup_start");
  if (startBlocks.length <= 1) return;

  const wasEnabled = Blockly.Events.isEnabled();
  if (wasEnabled) Blockly.Events.disable();
  try {
    const primary = startBlocks.find((b) => b.getNextBlock() !== null) || startBlocks[0];
    for (const b of startBlocks) {
      if (b.id === primary.id) continue;
      const child = b.getNextBlock();
      if (child && child.previousConnection) {
        child.previousConnection.disconnect();
        let tail: Blockly.Block = primary;
        while (tail.getNextBlock()) {
          tail = tail.getNextBlock()!;
        }
        if (tail.nextConnection && !tail.nextConnection.isConnected()) {
          tail.nextConnection.connect(child.previousConnection);
        }
      }
      b.dispose(false);
    }
  } finally {
    if (wasEnabled) Blockly.Events.enable();
  }
}

/**
 * 重置积木工作区为仅包含单个「开始」积木（用于新建文件或清空初始化）
 */
export function resetWorkspaceToStartBlockOnly(
  workspace: Blockly.WorkspaceSvg,
  _mode: WorkingMode = "logoup"
) {
  Blockly.Events.disable();
  try {
    workspace.clear();
    const startBlock = workspace.newBlock("logoup_start");
    startBlock.initSvg();
    startBlock.render();
    startBlock.moveTo(new Blockly.utils.Coordinate(40, 40));
  } finally {
    Blockly.Events.enable();
  }
}

/**
 * 根据工作模式生成初始默认「开始」积木（仅当画布为空时插入，避免产生重复「开始」积木）
 */
function insertDefaultBlocksForMode(workspace: Blockly.WorkspaceSvg, _mode: WorkingMode) {
  const existingBlocks = workspace.getAllBlocks(false);
  if (existingBlocks.length > 0) {
    ensureSingleStartBlock(workspace);
    return;
  }
  Blockly.Events.disable();
  try {
    const startBlock = workspace.newBlock("logoup_start");
    startBlock.initSvg();
    startBlock.render();
    startBlock.moveTo(new Blockly.utils.Coordinate(40, 40));
  } finally {
    Blockly.Events.enable();
  }
}

export const BlocklyWorkspace: React.FC<BlocklyWorkspaceProps> = ({
  onCodeChange,
  workspaceRefOut,
  colorMode = "dark",
  workingMode = "build123d",
  onWorkspaceReady,
}) => {
  const blocklyDiv = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null);
  const workingModeRef = useRef<WorkingMode>(workingMode);
  workingModeRef.current = workingMode;
  const onCodeChangeRef = useRef(onCodeChange);
  onCodeChangeRef.current = onCodeChange;
  const lastGeneratedCodeRef = useRef<string>("");

  // 监听工作模式动态变更，实时更新积木分类工具箱与当前代码
  useEffect(() => {
    if (workspaceRef.current) {
      try {
        const newToolbox = getToolboxForMode(workingMode);
        workspaceRef.current.updateToolbox(newToolbox);
        // 切模式时若不是 logoup，将所有积木重新启用 (避免历史置灰残留)
        if (workingMode !== "logoup") {
          const allBlocks = workspaceRef.current.getAllBlocks(false);
          for (const b of allBlocks) {
            if (!b.isEnabled()) b.setEnabled(true);
          }
        }

        // 确保工作区始终只有一个「开始」积木
        ensureSingleStartBlock(workspaceRef.current);

        // 智能模式切换：如果工作区积木仅包含旧模式的孤立初始模板积木（如单独一个 cq_init_workplane），自动重置为单个「开始」积木
        const nonShadowBlocks = workspaceRef.current
          .getAllBlocks(false)
          .filter((b) => !b.isShadow() && b.type !== "logoup_start");
        const isOnlyEmptyInitWorkplane =
          nonShadowBlocks.length === 1 &&
          nonShadowBlocks[0].type === "cq_init_workplane" &&
          !nonShadowBlocks[0].getNextBlock();

        if (isOnlyEmptyInitWorkplane || workspaceRef.current.getAllBlocks(false).length === 0) {
          resetWorkspaceToStartBlockOnly(workspaceRef.current, workingMode);
        }

        // 重新按当前工作模式生成并同步代码 (带值比对防死循环)
        const code = generateCodeForMode(workspaceRef.current, workingMode);
        if (code !== lastGeneratedCodeRef.current) {
          lastGeneratedCodeRef.current = code;
          onCodeChangeRef.current?.(code);
        }
      } catch (err) {
        console.warn("[BlocklyWorkspace] 动态更新工具箱失败:", err);
      }
    }
  }, [workingMode]);

  useEffect(() => {
    if (!blocklyDiv.current) return;

    // 1. 设置简体中文语言包
    Blockly.setLocale(zhHans as any);

    // 2. 注册所有框架自定义积木与生成器
    registerAllBuild123dBlocks();
    registerAllGenerators();

    // 3. 创建 Zelos Scratch 风格主题 (根据 colorMode)
    const zelosTheme = createCadQueryZelosTheme(colorMode);

    // 4. 挂载注入 Blockly 工作区
    const workspace = Blockly.inject(blocklyDiv.current, {
      media: "/blockly-media/", // 使用本地静态资源，彻底解决内网/国内环境图标与垃圾桶破图问题
      toolbox: getToolboxForMode(workingMode),
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
        startScale: 0.72,
        maxScale: 1.8,
        minScale: 0.3,
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
    if (onWorkspaceReady) {
      onWorkspaceReady(workspace);
    }

    // 4.1 定制右键复制功能：默认复制当前积木及其所有后续连接的整串子积木 (对标用户需求)
    const duplicateRegistryItem = Blockly.ContextMenuRegistry.registry.getItem("blockDuplicate");
    if (duplicateRegistryItem) {
      duplicateRegistryItem.callback = function (scope: any) {
        let block = scope.block;
        if (!block) return;
        // 禁止复制第二个「开始」帽子积木；若在「开始」积木上点复制，仅复制其下方挂载的子积木链
        if (block.type === "logoup_start") {
          block = block.getNextBlock();
          if (!block) return;
        }
        const ws = block.workspace as Blockly.WorkspaceSvg;
        // 强制包含所有下游积木 (addNextBlocks: true)
        const blockJson = Blockly.serialization.blocks.save(block, {
          addCoordinates: true,
          addNextBlocks: true,
        });
        if (blockJson) {
          const newBlock = Blockly.serialization.blocks.append(blockJson, ws);
          if (newBlock) {
            newBlock.moveBy(24, 24);
            (newBlock as any).select?.();
          }
        }
      };
    }

    // 4.2 孤立积木置灰禁用机制：仅在 logoup 模式下，未挂载于 logoup_start 的孤立积木自动设为 disabled
    let isUpdatingOrphan = false;
    const updateOrphanStates = (ws: Blockly.WorkspaceSvg) => {
      if (workingModeRef.current !== "logoup") return;
      if (isUpdatingOrphan) return;
      isUpdatingOrphan = true;
      try {
        Blockly.Events.disable();
        const topBlocks = ws.getTopBlocks(false);
        for (const topBlock of topBlocks) {
          const isStartBlock = topBlock.type === "logoup_start" || topBlock.type === "logoup_def_func";
          const setTreeEnabled = (b: Blockly.Block, enabled: boolean) => {
            if (b.isEnabled() !== enabled) {
              b.setEnabled(enabled);
            }
            const children = b.getChildren(false);
            for (const child of children) {
              setTreeEnabled(child, enabled);
            }
          };
          setTreeEnabled(topBlock, isStartBlock);
        }
      } finally {
        Blockly.Events.enable();
        isUpdatingOrphan = false;
      }
    };

    // 5. 根据当前工作模式插入初始默认积木组合
    insertDefaultBlocksForMode(workspace, workingModeRef.current);

    // 初始应用状态与生成代码
    ensureSingleStartBlock(workspace);
    updateOrphanStates(workspace);
    const initialCode = generateCodeForMode(workspace, workingModeRef.current);
    lastGeneratedCodeRef.current = initialCode;
    onCodeChangeRef.current?.(initialCode);

    // 6. 监听积木变更事件 (忽略非内容性纯UI滚动缩放事件)
    const changeListener = (e: Blockly.Events.Abstract) => {
      if (e.isUiEvent || e.type === Blockly.Events.VIEWPORT_CHANGE) return;
      ensureSingleStartBlock(workspace);
      updateOrphanStates(workspace);
      const code = generateCodeForMode(workspace, workingModeRef.current);
      if (code !== lastGeneratedCodeRef.current) {
        lastGeneratedCodeRef.current = code;
        onCodeChangeRef.current?.(code);
      }
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
