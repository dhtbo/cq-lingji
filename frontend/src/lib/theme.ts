/**
 * 工作台主题设计令牌与色彩/对比度计算体系
 * 支持全工作台联动换色，严格遵循 WCAG 2.2 无障碍高对比度规范
 */

export interface ThemeToken {
  id: string;
  name: string;
  hex: string;
  isDarkText: boolean; // 是否使用深色文字 (如经典黄使用 #0f172a，其余使用 #ffffff)
  textClass: string; // 主题色背景上的文字 Tailwind 类
  bgClass: string; // 主题色背景类
  borderClass: string;
  ringClass: string;
  activeTabClass: string;
  runGradient: string; // 运行按钮渐变
  subtleBg: string; // 柔和半透明背景
  subtleBorder: string;
  glowShadow: string;
}

export const THEME_TOKENS: Record<string, ThemeToken> = {
  "classic-yellow": {
    id: "classic-yellow",
    name: "经典黄",
    hex: "#FFDB29",
    isDarkText: false,
    textClass: "text-white font-bold",
    bgClass: "bg-[#FFDB29]",
    borderClass: "border-[#FFDB29]",
    ringClass: "focus:ring-[#FFDB29]",
    activeTabClass: "bg-[#FFDB29] text-white font-bold shadow-md shadow-[#FFDB29]/20",
    runGradient: "from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-500 hover:to-yellow-500",
    subtleBg: "rgba(255, 219, 41, 0.14)",
    subtleBorder: "rgba(255, 219, 41, 0.4)",
    glowShadow: "0 4px 20px rgba(255, 219, 41, 0.3)",
  },
  "ocean-blue": {
    id: "ocean-blue",
    name: "清爽蓝",
    hex: "#1677FF",
    isDarkText: false,
    textClass: "text-white font-bold",
    bgClass: "bg-[#1677FF]",
    borderClass: "border-[#1677FF]",
    ringClass: "focus:ring-[#1677FF]",
    activeTabClass: "bg-[#1677FF] text-white font-bold shadow-md shadow-[#1677FF]/20",
    runGradient: "from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-700 hover:to-indigo-700",
    subtleBg: "rgba(22, 119, 255, 0.14)",
    subtleBorder: "rgba(22, 119, 255, 0.4)",
    glowShadow: "0 4px 20px rgba(22, 119, 255, 0.3)",
  },
  "forest-green": {
    id: "forest-green",
    name: "翠石绿",
    hex: "#10B981",
    isDarkText: false,
    textClass: "text-white font-bold",
    bgClass: "bg-[#10B981]",
    borderClass: "border-[#10B981]",
    ringClass: "focus:ring-[#10B981]",
    activeTabClass: "bg-[#10B981] text-white font-bold shadow-md shadow-[#10B981]/20",
    runGradient: "from-emerald-600 via-green-500 to-teal-600 hover:from-emerald-700 hover:to-teal-700",
    subtleBg: "rgba(16, 185, 129, 0.14)",
    subtleBorder: "rgba(16, 185, 129, 0.4)",
    glowShadow: "0 4px 20px rgba(16, 185, 129, 0.3)",
  },
  "sunset-orange": {
    id: "sunset-orange",
    name: "元气橙",
    hex: "#FA541C",
    isDarkText: false,
    textClass: "text-white font-bold",
    bgClass: "bg-[#FA541C]",
    borderClass: "border-[#FA541C]",
    ringClass: "focus:ring-[#FA541C]",
    activeTabClass: "bg-[#FA541C] text-white font-bold shadow-md shadow-[#FA541C]/20",
    runGradient: "from-orange-600 via-orange-500 to-amber-600 hover:from-orange-700 hover:to-amber-700",
    subtleBg: "rgba(250, 84, 28, 0.14)",
    subtleBorder: "rgba(250, 84, 28, 0.4)",
    glowShadow: "0 4px 20px rgba(250, 84, 28, 0.3)",
  },
  "galaxy-purple": {
    id: "galaxy-purple",
    name: "星辰紫",
    hex: "#722ED1",
    isDarkText: false,
    textClass: "text-white font-bold",
    bgClass: "bg-[#722ED1]",
    borderClass: "border-[#722ED1]",
    ringClass: "focus:ring-[#722ED1]",
    activeTabClass: "bg-[#722ED1] text-white font-bold shadow-md shadow-[#722ED1]/20",
    runGradient: "from-purple-700 via-purple-600 to-indigo-700 hover:from-purple-800 hover:to-indigo-800",
    subtleBg: "rgba(114, 46, 209, 0.14)",
    subtleBorder: "rgba(114, 46, 209, 0.4)",
    glowShadow: "0 4px 20px rgba(114, 46, 209, 0.3)",
  },
  "sakura-pink": {
    id: "sakura-pink",
    name: "桃花红",
    hex: "#EB2F96",
    isDarkText: false,
    textClass: "text-white font-bold",
    bgClass: "bg-[#EB2F96]",
    borderClass: "border-[#EB2F96]",
    ringClass: "focus:ring-[#EB2F96]",
    activeTabClass: "bg-[#EB2F96] text-white font-bold shadow-md shadow-[#EB2F96]/20",
    runGradient: "from-pink-600 via-rose-500 to-pink-700 hover:from-pink-700 hover:to-rose-700",
    subtleBg: "rgba(235, 47, 150, 0.14)",
    subtleBorder: "rgba(235, 47, 150, 0.4)",
    glowShadow: "0 4px 20px rgba(235, 47, 150, 0.3)",
  },
};

/**
 * 根据主题颜色 ID、Hex 十六进制或名称获取对应的设计令牌，默认返回翠石绿
 */
export function getThemeToken(colorOrId?: string): ThemeToken {
  if (!colorOrId) return THEME_TOKENS["forest-green"];
  if (THEME_TOKENS[colorOrId]) return THEME_TOKENS[colorOrId];

  const lower = colorOrId.toLowerCase().trim();
  for (const key of Object.keys(THEME_TOKENS)) {
    const t = THEME_TOKENS[key];
    if (
      t.hex.toLowerCase() === lower ||
      t.id.toLowerCase() === lower ||
      t.name === colorOrId
    ) {
      return t;
    }
  }
  return THEME_TOKENS["forest-green"];
}
