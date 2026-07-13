import {
  Users, HeartPulse, ShieldAlert, Home, TrendingUp, Clapperboard, FolderKanban,
  MessageSquareText,
} from 'lucide-react';

// Per-project visual identity — icon + accent color, so each ML case study
// looks and feels distinct instead of every page reusing the same olive
// theme. Tailwind's build only generates CSS for class names it can find
// literally in the source, so every class string below must be written out
// in full — no `bg-${color}-600` interpolation, or the color silently
// won't render in production.

export const PROJECT_ICONS = {
  users: Users,
  heartPulse: HeartPulse,
  shieldAlert: ShieldAlert,
  home: Home,
  trendingUp: TrendingUp,
  clapperboard: Clapperboard,
  messageSquareText: MessageSquareText,
};

// Fallback icon for any case study that doesn't set one.
export const DEFAULT_ICON = FolderKanban;

const THEMES = {
  blue: {
    iconBg: 'bg-gradient-to-br from-blue-500 to-blue-700',
    iconShadow: 'shadow-blue-700/30',
    badge: 'bg-blue-100 text-blue-800 border-blue-300',
    hoverBorder: 'hover:border-blue-500/50',
    hoverShadow: 'hover:shadow-blue-500/20',
    glowFrom: 'group-hover:from-blue-400/40',
    glowVia: 'group-hover:via-blue-500/30',
    glowTo: 'group-hover:to-blue-700/40',
    text: 'text-blue-700',
    button: 'bg-gradient-to-br from-blue-500 to-blue-700 shadow-blue-500/25',
    chartChosen: '#1d4ed8',
    chartOther: '#bfdbfe',
    onDark: 'text-blue-300',
  },
  rose: {
    iconBg: 'bg-gradient-to-br from-rose-500 to-rose-700',
    iconShadow: 'shadow-rose-700/30',
    badge: 'bg-rose-100 text-rose-800 border-rose-300',
    hoverBorder: 'hover:border-rose-500/50',
    hoverShadow: 'hover:shadow-rose-500/20',
    glowFrom: 'group-hover:from-rose-400/40',
    glowVia: 'group-hover:via-rose-500/30',
    glowTo: 'group-hover:to-rose-700/40',
    text: 'text-rose-700',
    button: 'bg-gradient-to-br from-rose-500 to-rose-700 shadow-rose-500/25',
    chartChosen: '#be123c',
    chartOther: '#fecdd3',
    onDark: 'text-rose-300',
  },
  amber: {
    iconBg: 'bg-gradient-to-br from-amber-500 to-amber-700',
    iconShadow: 'shadow-amber-700/30',
    badge: 'bg-amber-100 text-amber-800 border-amber-300',
    hoverBorder: 'hover:border-amber-500/50',
    hoverShadow: 'hover:shadow-amber-500/20',
    glowFrom: 'group-hover:from-amber-400/40',
    glowVia: 'group-hover:via-amber-500/30',
    glowTo: 'group-hover:to-amber-700/40',
    text: 'text-amber-700',
    button: 'bg-gradient-to-br from-amber-500 to-amber-700 shadow-amber-500/25',
    chartChosen: '#b45309',
    chartOther: '#fde68a',
    onDark: 'text-amber-300',
  },
  emerald: {
    iconBg: 'bg-gradient-to-br from-emerald-500 to-emerald-700',
    iconShadow: 'shadow-emerald-700/30',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    hoverBorder: 'hover:border-emerald-500/50',
    hoverShadow: 'hover:shadow-emerald-500/20',
    glowFrom: 'group-hover:from-emerald-400/40',
    glowVia: 'group-hover:via-emerald-500/30',
    glowTo: 'group-hover:to-emerald-700/40',
    text: 'text-emerald-700',
    button: 'bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-emerald-500/25',
    chartChosen: '#047857',
    chartOther: '#a7f3d0',
    onDark: 'text-emerald-300',
  },
  violet: {
    iconBg: 'bg-gradient-to-br from-violet-500 to-violet-700',
    iconShadow: 'shadow-violet-700/30',
    badge: 'bg-violet-100 text-violet-800 border-violet-300',
    hoverBorder: 'hover:border-violet-500/50',
    hoverShadow: 'hover:shadow-violet-500/20',
    glowFrom: 'group-hover:from-violet-400/40',
    glowVia: 'group-hover:via-violet-500/30',
    glowTo: 'group-hover:to-violet-700/40',
    text: 'text-violet-700',
    button: 'bg-gradient-to-br from-violet-500 to-violet-700 shadow-violet-500/25',
    chartChosen: '#6d28d9',
    chartOther: '#ddd6fe',
    onDark: 'text-violet-300',
  },
  fuchsia: {
    iconBg: 'bg-gradient-to-br from-fuchsia-500 to-fuchsia-700',
    iconShadow: 'shadow-fuchsia-700/30',
    badge: 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-300',
    hoverBorder: 'hover:border-fuchsia-500/50',
    hoverShadow: 'hover:shadow-fuchsia-500/20',
    glowFrom: 'group-hover:from-fuchsia-400/40',
    glowVia: 'group-hover:via-fuchsia-500/30',
    glowTo: 'group-hover:to-fuchsia-700/40',
    text: 'text-fuchsia-700',
    button: 'bg-gradient-to-br from-fuchsia-500 to-fuchsia-700 shadow-fuchsia-500/25',
    chartChosen: '#a21caf',
    chartOther: '#f5d0fe',
    onDark: 'text-fuchsia-300',
  },
  indigo: {
    iconBg: 'bg-gradient-to-br from-indigo-500 to-indigo-700',
    iconShadow: 'shadow-indigo-700/30',
    badge: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    hoverBorder: 'hover:border-indigo-500/50',
    hoverShadow: 'hover:shadow-indigo-500/20',
    glowFrom: 'group-hover:from-indigo-400/40',
    glowVia: 'group-hover:via-indigo-500/30',
    glowTo: 'group-hover:to-indigo-700/40',
    text: 'text-indigo-700',
    button: 'bg-gradient-to-br from-indigo-500 to-indigo-700 shadow-indigo-500/25',
    chartChosen: '#4338ca',
    chartOther: '#c7d2fe',
    onDark: 'text-indigo-300',
  },
};

// Falls back to the site's default olive theme if a study doesn't set one.
const DEFAULT_THEME = {
  iconBg: 'bg-gradient-to-br from-primary-500 to-primary-700',
  iconShadow: 'shadow-primary-700/30',
  badge: 'bg-primary-100 text-primary-800 border-primary-300',
  hoverBorder: 'hover:border-primary-600/40',
  hoverShadow: 'hover:shadow-primary-500/20',
  glowFrom: 'group-hover:from-primary-400/40',
  glowVia: 'group-hover:via-primary-500/30',
  glowTo: 'group-hover:to-primary-700/40',
  text: 'text-primary-700',
  button: 'bg-gradient-to-br from-primary-500 to-primary-700 shadow-primary-500/25',
  chartChosen: '#41432d',
  chartOther: '#dfe2bb',
  onDark: 'text-primary-300',
};

export function getTheme(colorKey) {
  return THEMES[colorKey] || DEFAULT_THEME;
}

export function getIcon(iconKey) {
  return PROJECT_ICONS[iconKey] || DEFAULT_ICON;
}
