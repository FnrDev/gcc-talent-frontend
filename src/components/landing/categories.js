import {
  Video01Icon,
  CodeIcon,
  PaintBrush01Icon,
  PenTool01Icon,
  Megaphone01Icon,
  SmartPhone01Icon,
  DashboardSquare01Icon,
} from "@hugeicons/core-free-icons"

// Icons are a presentation concern, so they live here keyed by category slug
// rather than in the taxonomy data. Categories themselves come from
// taxonomyService, which means every landing-page category carries a real id
// and can link straight into /services?category=<id>.
export const CATEGORY_ICONS = {
  "video-editing": Video01Icon,
  "web-development": CodeIcon,
  "graphic-design": PaintBrush01Icon,
  "content-writing": PenTool01Icon,
  "digital-marketing": Megaphone01Icon,
  "mobile-development": SmartPhone01Icon,
}

export const FALLBACK_CATEGORY_ICON = DashboardSquare01Icon

export function categoryIcon(slug) {
  return CATEGORY_ICONS[slug] ?? FALLBACK_CATEGORY_ICON
}
