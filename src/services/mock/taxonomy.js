// Mock taxonomy mirroring the shapes returned by GET /categories and GET /skills.
// Ids are 24-char hex strings so they are indistinguishable from real ObjectIds.

export const categories = [
  { _id: '6650a1000000000000000001', name: 'Web Development', slug: 'web-development', icon: 'CodeIcon', isFeatured: true },
  { _id: '6650a1000000000000000002', name: 'Graphic Design', slug: 'graphic-design', icon: 'PaintBrush01Icon', isFeatured: true },
  { _id: '6650a1000000000000000003', name: 'Video Editing', slug: 'video-editing', icon: 'Video01Icon', isFeatured: true },
  { _id: '6650a1000000000000000004', name: 'Content Writing', slug: 'content-writing', icon: 'PenTool01Icon', isFeatured: true },
  { _id: '6650a1000000000000000005', name: 'Digital Marketing', slug: 'digital-marketing', icon: 'Megaphone01Icon', isFeatured: true },
  { _id: '6650a1000000000000000006', name: 'Mobile Development', slug: 'mobile-development', icon: 'SmartPhone01Icon', isFeatured: false },
]

export const skills = [
  { _id: '6650b1000000000000000001', name: 'React', category: '6650a1000000000000000001' },
  { _id: '6650b1000000000000000002', name: 'Node.js', category: '6650a1000000000000000001' },
  { _id: '6650b1000000000000000003', name: 'Next.js', category: '6650a1000000000000000001' },
  { _id: '6650b1000000000000000004', name: 'Webflow', category: '6650a1000000000000000001' },
  { _id: '6650b1000000000000000005', name: 'Logo Design', category: '6650a1000000000000000002' },
  { _id: '6650b1000000000000000006', name: 'Brand Identity', category: '6650a1000000000000000002' },
  { _id: '6650b1000000000000000007', name: 'Figma', category: '6650a1000000000000000002' },
  { _id: '6650b1000000000000000008', name: 'Premiere Pro', category: '6650a1000000000000000003' },
  { _id: '6650b1000000000000000009', name: 'After Effects', category: '6650a1000000000000000003' },
  { _id: '6650b1000000000000000010', name: 'Motion Graphics', category: '6650a1000000000000000003' },
  { _id: '6650b1000000000000000011', name: 'Copywriting', category: '6650a1000000000000000004' },
  { _id: '6650b1000000000000000012', name: 'Arabic Translation', category: '6650a1000000000000000004' },
  { _id: '6650b1000000000000000013', name: 'Technical Writing', category: '6650a1000000000000000004' },
  { _id: '6650b1000000000000000014', name: 'SEO', category: '6650a1000000000000000005' },
  { _id: '6650b1000000000000000015', name: 'Meta Ads', category: '6650a1000000000000000005' },
  { _id: '6650b1000000000000000016', name: 'Social Media', category: '6650a1000000000000000005' },
  { _id: '6650b1000000000000000017', name: 'Flutter', category: '6650a1000000000000000006' },
  { _id: '6650b1000000000000000018', name: 'Swift', category: '6650a1000000000000000006' },
]

export function categoryById(id) {
  return categories.find((category) => category._id === id) ?? null
}

export function skillsByIds(ids) {
  return ids.map((id) => skills.find((skill) => skill._id === id)).filter(Boolean)
}
