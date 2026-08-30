// Mock gigs. The shape matches the Gig domain the back-end already anticipates:
// Contract.source carries `gig` + `tier` of 'basic' | 'standard' | 'premium'
// (see back-end/models/Contract.js), so packages use exactly those tier names.

import { categoryById, skillsByIds } from './taxonomy'
import { freelancers } from './users'

const TIERS = ['basic', 'standard', 'premium']

function seller(index) {
  return freelancers[index]
}

function gallery(...indexes) {
  return indexes.map((n) => ({ url: `/placeholders/gig-${n}.svg`, alt: 'Service preview' }))
}

// Expands a compact [price, deliveryDays, revisions, features[]] tuple per tier
// into the package objects the UI and the future API both use.
function packages(tuples) {
  return tuples.map(([price, deliveryDays, revisions, features], i) => ({
    tier: TIERS[i],
    title: ['Basic', 'Standard', 'Premium'][i],
    price,
    currency: 'BHD',
    deliveryDays,
    revisions,
    features,
  }))
}

export const gigs = [
  {
    _id: '6650e1000000000000000001',
    title: 'Design a modern logo and full brand identity kit',
    description:
      'I will craft a distinctive logo and the brand system around it — colour palette, typography scale, and usage rules — delivered as print-ready and web-ready files.\n\nEvery project starts with a short discovery call so the marks I present are grounded in your positioning rather than in trend. You receive the working source files, not just flattened exports, so your team can keep building on the system after handover.',
    seller: seller(0),
    category: categoryById('6650a1000000000000000002'),
    skills: skillsByIds(['6650b1000000000000000005', '6650b1000000000000000006', '6650b1000000000000000007']),
    gallery: gallery(2, 3, 1),
    packages: packages([
      [15, 3, 2, ['1 logo concept', 'PNG + SVG files', 'Social media avatar']],
      [45, 5, 4, ['3 logo concepts', 'Full colour palette', 'Typography scale', 'Source files']],
      [100, 7, 'unlimited', ['5 logo concepts', 'Complete brand guidelines PDF', 'Stationery mockups', 'Source files', 'Commercial rights']],
    ]),
    ratingAvg: 4.9, ratingCount: 187, ordersCompleted: 214,
    isFeatured: true, status: 'active',
    createdAt: '2026-07-02T09:15:00.000Z',
  },
  {
    _id: '6650e1000000000000000002',
    title: 'Build a production-ready React and Node.js web application',
    description:
      'Full-stack delivery of a web application: React front end, Node/Express API, MongoDB persistence, and deployment to your hosting of choice.\n\nI work in reviewable increments — you see a running deployment at the end of every milestone rather than one large drop at the end. Handover includes environment setup docs and a walkthrough recording.',
    seller: seller(1),
    category: categoryById('6650a1000000000000000001'),
    skills: skillsByIds(['6650b1000000000000000001', '6650b1000000000000000002', '6650b1000000000000000003']),
    gallery: gallery(1, 4, 5),
    packages: packages([
      [70, 7, 1, ['Single page + API endpoint', 'Responsive layout', 'Deployment']],
      [210, 14, 3, ['Up to 6 pages', 'Auth + database', 'Admin dashboard', 'Deployment + docs']],
      [530, 30, 5, ['Unlimited pages', 'Auth, payments, admin', 'Automated tests', 'CI/CD pipeline', '30 days support']],
    ]),
    ratingAvg: 4.8, ratingCount: 96, ordersCompleted: 108,
    isFeatured: true, status: 'active',
    createdAt: '2026-07-11T12:40:00.000Z',
  },
  {
    _id: '6650e1000000000000000003',
    title: 'Professional Arabic and English voice over for your brand',
    description:
      'Broadcast-quality voice over in Modern Standard Arabic, Gulf dialect, or neutral English — recorded in a treated booth and delivered mastered.\n\nScript timing notes come back with the first draft, so if a line runs long for your edit you know before the final mix.',
    seller: seller(2),
    category: categoryById('6650a1000000000000000004'),
    skills: skillsByIds(['6650b1000000000000000011', '6650b1000000000000000012']),
    gallery: gallery(3, 6),
    packages: packages([
      [10, 2, 1, ['Up to 150 words', 'WAV + MP3', 'Commercial use']],
      [30, 3, 3, ['Up to 500 words', 'Two dialect options', 'Background music mix']],
      [70, 5, 'unlimited', ['Up to 1500 words', 'Full mix and master', 'Sync to your video', 'Broadcast rights']],
    ]),
    ratingAvg: 4.7, ratingCount: 158, ordersCompleted: 176,
    isFeatured: false, status: 'active',
    createdAt: '2026-06-24T08:05:00.000Z',
  },
  {
    _id: '6650e1000000000000000004',
    title: 'Edit and colour grade your short-form social video',
    description:
      'Vertical edits built for retention: hook in the first two seconds, captions burned in, colour graded to a consistent look across the whole set.\n\nSend raw footage and a reference reel; you get back a cut that matches the pacing of the reference rather than a generic template.',
    seller: seller(3),
    category: categoryById('6650a1000000000000000003'),
    skills: skillsByIds(['6650b1000000000000000008', '6650b1000000000000000009', '6650b1000000000000000010']),
    gallery: gallery(5, 2, 4),
    packages: packages([
      [15, 2, 2, ['1 video up to 60s', 'Captions', 'Basic colour']],
      [40, 4, 3, ['3 videos up to 90s', 'Motion titles', 'Full colour grade', 'Sound design']],
      [110, 7, 'unlimited', ['10 videos', 'Custom motion graphics pack', 'Thumbnail set', 'Source project files']],
    ]),
    ratingAvg: 5.0, ratingCount: 64, ordersCompleted: 71,
    isFeatured: true, status: 'active',
    createdAt: '2026-08-01T15:20:00.000Z',
  },
  {
    _id: '6650e1000000000000000005',
    title: 'Run and optimise your Meta and Google ad campaigns',
    description:
      'Campaign build, creative testing, and weekly optimisation against a cost-per-result target you set.\n\nReporting is a single dashboard you can read in two minutes — spend, results, and the one change I am making next week, with the reasoning.',
    seller: seller(4),
    category: categoryById('6650a1000000000000000005'),
    skills: skillsByIds(['6650b1000000000000000015', '6650b1000000000000000016', '6650b1000000000000000014']),
    gallery: gallery(6, 1),
    packages: packages([
      [55, 5, 1, ['1 campaign setup', 'Audience research', 'Pixel install']],
      [160, 14, 2, ['3 campaigns', 'Creative testing', 'Weekly optimisation', 'Reporting dashboard']],
      [340, 30, 4, ['Full funnel build', 'Landing page audit', 'Bi-weekly strategy calls', 'Monthly report']],
    ]),
    ratingAvg: 4.6, ratingCount: 41, ordersCompleted: 52,
    isFeatured: false, status: 'active',
    createdAt: '2026-07-19T10:00:00.000Z',
  },
  {
    _id: '6650e1000000000000000006',
    title: 'Develop a cross-platform Flutter mobile app',
    description:
      'One Flutter codebase shipped to both the App Store and Google Play, with offline-first data handling and push notifications.\n\nStore submission is included — provisioning profiles, screenshots, and listing copy, which is usually where first-time launches stall.',
    seller: seller(5),
    category: categoryById('6650a1000000000000000006'),
    skills: skillsByIds(['6650b1000000000000000017', '6650b1000000000000000018']),
    gallery: gallery(4, 3, 6),
    packages: packages([
      [120, 10, 1, ['Up to 4 screens', 'iOS + Android build', 'Basic state management']],
      [320, 21, 3, ['Up to 12 screens', 'API integration', 'Push notifications', 'Store submission']],
      [790, 45, 5, ['Unlimited screens', 'Offline sync', 'In-app purchases', 'Analytics', '60 days support']],
    ]),
    ratingAvg: 4.8, ratingCount: 78, ordersCompleted: 84,
    isFeatured: false, status: 'active',
    createdAt: '2026-06-30T13:30:00.000Z',
  },
  {
    _id: '6650e1000000000000000007',
    title: 'Write conversion-focused Arabic and English web copy',
    description:
      'Landing page and website copy written natively in both languages — not translated — so each version carries its own rhythm and cultural register.\n\nYou get two headline directions per page so the choice stays with you.',
    seller: seller(2),
    category: categoryById('6650a1000000000000000004'),
    skills: skillsByIds(['6650b1000000000000000011', '6650b1000000000000000012', '6650b1000000000000000013']),
    gallery: gallery(2, 5),
    packages: packages([
      [25, 3, 2, ['1 landing page', 'Both languages', 'SEO meta tags']],
      [60, 6, 3, ['Up to 5 pages', 'Both languages', 'Tone of voice notes']],
      [140, 12, 'unlimited', ['Full site copy', 'Messaging framework', 'Email sequence', 'Ongoing edits']],
    ]),
    ratingAvg: 4.9, ratingCount: 112, ordersCompleted: 129,
    isFeatured: false, status: 'active',
    createdAt: '2026-08-08T07:45:00.000Z',
  },
  {
    _id: '6650e1000000000000000008',
    title: 'Design a high-converting Figma UI kit for your product',
    description:
      'A component library your developers can build against: tokens, states, responsive rules, and a documented handoff.\n\nBuilt with auto-layout and variables throughout, so the kit stays maintainable once your own designers take it over.',
    seller: seller(0),
    category: categoryById('6650a1000000000000000002'),
    skills: skillsByIds(['6650b1000000000000000007', '6650b1000000000000000006']),
    gallery: gallery(1, 6, 3),
    packages: packages([
      [35, 4, 2, ['Core components', 'Light theme', 'Figma file']],
      [90, 8, 4, ['Full component set', 'Light + dark themes', 'Design tokens', 'Handoff notes']],
      [200, 15, 'unlimited', ['Full design system', 'Responsive rules', 'Prototype flows', 'Team training call']],
    ]),
    ratingAvg: 4.9, ratingCount: 55, ordersCompleted: 61,
    isFeatured: true, status: 'active',
    createdAt: '2026-07-27T11:10:00.000Z',
  },
  {
    _id: '6650e1000000000000000009',
    title: 'Build a fast, SEO-ready Webflow marketing site',
    description:
      'A CMS-driven Webflow build your marketing team can edit without a developer, scoring green on Core Web Vitals at launch.\n\nIncludes a 30-minute recorded walkthrough of the CMS structure so content updates do not come back to me.',
    seller: seller(1),
    category: categoryById('6650a1000000000000000001'),
    skills: skillsByIds(['6650b1000000000000000004', '6650b1000000000000000014']),
    gallery: gallery(5, 1),
    packages: packages([
      [85, 6, 2, ['Up to 5 sections', 'Responsive', 'On-page SEO']],
      [200, 12, 3, ['Up to 8 pages', 'CMS collections', 'Animations', 'SEO setup']],
      [410, 21, 5, ['Unlimited pages', 'Multi-language', 'CMS training', 'Performance tuning']],
    ]),
    ratingAvg: 4.7, ratingCount: 38, ordersCompleted: 44,
    isFeatured: false, status: 'active',
    createdAt: '2026-08-14T16:25:00.000Z',
  },
  {
    _id: '6650e1000000000000000010',
    title: 'Produce animated explainer video with motion graphics',
    description:
      'Script, storyboard, and a fully animated explainer in your brand style, with Arabic or English narration.\n\nStoryboard approval happens before any animation starts, which keeps revision rounds cheap.',
    seller: seller(3),
    category: categoryById('6650a1000000000000000003'),
    skills: skillsByIds(['6650b1000000000000000009', '6650b1000000000000000010']),
    gallery: gallery(3, 4),
    packages: packages([
      [75, 7, 1, ['Up to 30s', 'Stock assets', 'One revision round']],
      [180, 14, 3, ['Up to 60s', 'Custom illustrations', 'Voice over', 'Sound design']],
      [390, 25, 5, ['Up to 120s', 'Full custom animation', 'Two language versions', 'Source files']],
    ]),
    ratingAvg: 5.0, ratingCount: 29, ordersCompleted: 33,
    isFeatured: false, status: 'active',
    createdAt: '2026-08-20T09:55:00.000Z',
  },
  {
    _id: '6650e1000000000000000011',
    title: 'Technical SEO audit with a prioritised fix roadmap',
    description:
      'A crawl-backed audit of indexation, site architecture, Core Web Vitals, and schema, ending in a ranked list of fixes with estimated impact and effort.\n\nThe deliverable is written for a developer to action directly, not a PDF that needs translating first.',
    seller: seller(4),
    category: categoryById('6650a1000000000000000005'),
    skills: skillsByIds(['6650b1000000000000000014']),
    gallery: gallery(6, 2),
    packages: packages([
      [45, 4, 1, ['Up to 100 pages', 'Crawl report', 'Top 10 fixes']],
      [110, 8, 2, ['Up to 1000 pages', 'Full technical audit', 'Schema plan', 'Prioritised roadmap']],
      [260, 15, 3, ['Unlimited pages', 'Competitor gap analysis', 'Content plan', 'Implementation support']],
    ]),
    ratingAvg: 4.6, ratingCount: 24, ordersCompleted: 27,
    isFeatured: false, status: 'active',
    createdAt: '2026-07-05T14:15:00.000Z',
  },
  {
    _id: '6650e1000000000000000012',
    title: 'Native iOS app development in Swift and SwiftUI',
    description:
      'A native SwiftUI app built to Apple Human Interface Guidelines, with proper accessibility support and a clean, testable architecture.\n\nWidgets, Live Activities, and App Clips are available as add-ons if your launch needs them.',
    seller: seller(5),
    category: categoryById('6650a1000000000000000006'),
    skills: skillsByIds(['6650b1000000000000000018']),
    gallery: gallery(4, 5, 1),
    packages: packages([
      [150, 12, 1, ['Up to 5 screens', 'SwiftUI', 'TestFlight build']],
      [370, 24, 3, ['Up to 15 screens', 'API + persistence', 'Unit tests', 'App Store submission']],
      [900, 50, 5, ['Full app', 'Widgets + notifications', 'Full test suite', 'CI pipeline', '90 days support']],
    ]),
    ratingAvg: 4.8, ratingCount: 19, ordersCompleted: 22,
    isFeatured: false, status: 'active',
    createdAt: '2026-08-25T10:35:00.000Z',
  },
].map((gig) => ({
  ...gig,
  isHidden: false,
  // Denormalised for card display and price filtering — the API will compute
  // this the same way, from the cheapest package.
  startingPrice: Math.min(...gig.packages.map((p) => p.price)),
  fastestDelivery: Math.min(...gig.packages.map((p) => p.deliveryDays)),
  updatedAt: gig.createdAt,
}))
