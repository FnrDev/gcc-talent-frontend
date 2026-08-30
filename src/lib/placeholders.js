// Stand-in artwork while the back-end has no image storage. These are derived
// from a record's category rather than stored on it, so no mock field exists
// here that the real API will not return.

const CATEGORY_IMAGES = {
  'web-development': '/placeholders/category-web-development.svg',
  'graphic-design': '/placeholders/category-graphic-design.svg',
  'video-editing': '/placeholders/category-video-editing.svg',
  'content-writing': '/placeholders/category-content-writing.svg',
  'digital-marketing': '/placeholders/category-digital-marketing.svg',
  'mobile-development': '/placeholders/category-mobile-development.svg',
}

const FALLBACK = '/placeholders/gig-1.svg'

export function categoryImage(slug) {
  return CATEGORY_IMAGES[slug] ?? FALLBACK
}
