import {
  Video01Icon,
  CodeIcon,
  PaintBrush01Icon,
  PenTool01Icon,
  Megaphone01Icon,
  FolderLibraryIcon,
} from "@hugeicons/core-free-icons"

const ICONS_BY_TOKEN = Object.freeze({
  video: Video01Icon,
  'video-editing': Video01Icon,
  video01icon: Video01Icon,
  code: CodeIcon,
  development: CodeIcon,
  'web-development': CodeIcon,
  it: CodeIcon,
  codeicon: CodeIcon,
  design: PaintBrush01Icon,
  'graphic-design': PaintBrush01Icon,
  paintbrush01icon: PaintBrush01Icon,
  writing: PenTool01Icon,
  'content-writing': PenTool01Icon,
  pentool01icon: PenTool01Icon,
  marketing: Megaphone01Icon,
  'digital-marketing': Megaphone01Icon,
  megaphone01icon: Megaphone01Icon,
  folder: FolderLibraryIcon,
  general: FolderLibraryIcon,
  folderlibraryicon: FolderLibraryIcon,
})

const CATEGORY_ICON_RULES = [
  { pattern: /(^|-)(video|editing|film|animation)(-|$)/, icon: Video01Icon },
  { pattern: /(^|-)(it|web|code|coding|software|developer|development|programming|technology)(-|$)/, icon: CodeIcon },
  { pattern: /(^|-)(graphic|design|illustration|creative)(-|$)/, icon: PaintBrush01Icon },
  { pattern: /(^|-)(content|writing|writer|copywriting)(-|$)/, icon: PenTool01Icon },
  { pattern: /(^|-)(digital|marketing|advertising|social-media)(-|$)/, icon: Megaphone01Icon },
]

function normaliseIdentifier(value) {
  return typeof value === 'string'
    ? value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    : ''
}

export function resolveCategoryIcon(category) {
  const iconToken = normaliseIdentifier(category?.icon)

  if (iconToken && ICONS_BY_TOKEN[iconToken]) {
    return ICONS_BY_TOKEN[iconToken]
  }

  const identifier = normaliseIdentifier(`${category?.slug || ''} ${category?.name || ''}`)
  const matchingRule = CATEGORY_ICON_RULES.find(({ pattern }) => pattern.test(identifier))

  return matchingRule?.icon || FolderLibraryIcon
}

export function selectLandingCategories(categories, limit = 5) {
  if (!Array.isArray(categories)) return []

  const featuredCategories = categories.filter((category) => category.isFeatured)
  return (featuredCategories.length > 0 ? featuredCategories : categories).slice(0, limit)
}
