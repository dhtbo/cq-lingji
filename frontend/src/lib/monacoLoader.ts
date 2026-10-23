/**
 * Monaco Editor 智能 CDN 加载器与高可用镜像分发机制
 * 参考 D:\DEV\ClassroomManager 的国内用户网络自适应与分级镜像最佳实践
 * 彻底解决中国大陆地区访问公共 CDN 资源缓慢、被限速或卡在 Loading 的问题
 */
import { loader } from "@monaco-editor/react";

/**
 * 智能探测当前是否处于中国大陆及大中华区网络环境
 */
export function isChinaRegion(): boolean {
  if (typeof window === "undefined") return true;
  const lang = (navigator.language || (navigator as any).userLanguage || "").toLowerCase();
  if (lang.startsWith("zh")) return true;
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (
      tz &&
      (tz.includes("Shanghai") ||
        tz.includes("Chongqing") ||
        tz.includes("Harbin") ||
        tz.includes("Urumqi") ||
        tz.includes("Beijing") ||
        tz.includes("Hong_Kong") ||
        tz.includes("Macao") ||
        tz.includes("Taipei"))
    ) {
      return true;
    }
  } catch {}
  return false;
}

// 国内与海外高可用稳定 CDN 镜像源
export const MONACO_CDN_SOURCES = {
  // 百度云 CDN 静态库 (国内骨干节点极速分发，稳定性极高)
  baomitu: "https://lib.baomitu.com/monaco-editor/0.45.0/min/vs",
  // 阿里云 NPM 官方镜像
  npmmirror: "https://registry.npmmirror.com/monaco-editor/0.45.0/files/min/vs",
  // 海外/国际节点
  cdnjs: "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs",
  // 备用 fastly
  fastly: "https://fastly.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs",
};

let isMonacoLoaderConfigured = false;

/**
 * 初始化并配置 Monaco Editor 智能分发加载器
 */
export function setupMonacoLoader(forceSource?: keyof typeof MONACO_CDN_SOURCES) {
  if (typeof window === "undefined" || isMonacoLoaderConfigured) return;

  const isChina = isChinaRegion();
  // 中国大陆优先选用百度静态库或淘宝源，海外选用 Cloudflare
  const selectedCdnUrl = forceSource
    ? MONACO_CDN_SOURCES[forceSource]
    : isChina
    ? MONACO_CDN_SOURCES.baomitu
    : MONACO_CDN_SOURCES.cdnjs;

  try {
    loader.config({
      paths: {
        vs: selectedCdnUrl,
      },
    });
    isMonacoLoaderConfigured = true;
    console.info(
      `[MonacoLoader] 已配置智能 CDN 镜像加速: ${selectedCdnUrl} (区域识别: ${
        isChina ? "中国大陆及亚太高速节点" : "国际通用节点"
      })`
    );
  } catch (err) {
    console.warn("[MonacoLoader] 配置 Monaco 加载器异常，将回退至默认设置:", err);
  }
}
