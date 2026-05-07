import {
  Award,
  BookOpen,
  Briefcase,
  CheckCircle,
  Globe,
  GraduationCap,
  Heart,
  Laptop,
  Layers,
  LineChart,
  MessageCircle,
  Share2,
  Shield,
  Sparkles,
  Target,
  Users,
  Zap,
  Lightbulb,
} from "lucide-react";

const ICON_MAP = {
  shield: Shield,
  bookOpen: BookOpen,
  share2: Share2,
  zap: Zap,
  target: Target,
  users: Users,
  globe: Globe,
  heart: Heart,
  lightbulb: Lightbulb,
  award: Award,
  lineChart: LineChart,
  graduationCap: GraduationCap,
  checkCircle: CheckCircle,
  layers: Layers,
  messageCircle: MessageCircle,
  briefcase: Briefcase,
  laptop: Laptop,
  sparkles: Sparkles,
};

const COLOR_STYLES = {
  brand: {
    color: "text-brand-600 dark:text-brand-400",
    bg: "bg-brand-50 dark:bg-brand-900/20",
  },
  emerald: {
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
  },
  amber: {
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-900/20",
  },
  violet: {
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-50 dark:bg-violet-900/20",
  },
  rose: {
    color: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-50 dark:bg-rose-900/20",
  },
  cyan: {
    color: "text-cyan-600 dark:text-cyan-400",
    bg: "bg-cyan-50 dark:bg-cyan-900/20",
  },
  sky: {
    color: "text-sky-600 dark:text-sky-400",
    bg: "bg-sky-50 dark:bg-sky-900/20",
  },
};

export function getWhyLearnIconComponent(iconKey) {
  return ICON_MAP[iconKey] || Sparkles;
}

export function getWhyLearnColorStyle(colorKey) {
  return COLOR_STYLES[colorKey] || COLOR_STYLES.brand;
}

export const WHY_LEARN_ICON_OPTIONS = Object.keys(ICON_MAP);
export const WHY_LEARN_COLOR_OPTIONS = Object.keys(COLOR_STYLES);
