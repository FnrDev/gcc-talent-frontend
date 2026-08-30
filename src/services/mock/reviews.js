// Mock reviews shaped like GET /users/:id/reviews — see models/Review.js
// (contract, reviewer, reviewee, rating, comment, timestamps). `reviewer` is
// populated the way the API populates it onto a public profile.

import { clients, freelancers } from './users'

const REVIEW_TEXT = [
  ['Delivered ahead of the agreed date and the handover notes were genuinely useful — our own team picked it up without a single follow-up question.', 5],
  ['Strong work overall. There was one revision round that took longer than I expected, but the final result was worth the wait.', 4],
  ['Asked the right questions before starting, which saved us from a scope we would have regretted. Would hire again without hesitation.', 5],
  ['Communication was excellent throughout — a weekly update every week, without me having to chase.', 5],
  ['Good quality and fair pricing. Timeline slipped by a few days on our end, not theirs.', 4],
  ['Exactly what was described in the package, no surprises. That sounds like faint praise but it is rarer than it should be.', 5],
  ['Pushed back on one of our decisions and was right to. Appreciated the honesty.', 5],
  ['Solid delivery. I would have liked a bit more detail in the documentation, but everything worked as promised.', 4],
]

// Deterministic so the same profile always shows the same reviews.
function reviewsFor(revieweeId, count, offset) {
  return Array.from({ length: count }, (_, index) => {
    const [comment, rating] = REVIEW_TEXT[(index + offset) % REVIEW_TEXT.length]
    const reviewerPool = revieweeId.startsWith('6650c') ? clients : freelancers
    const reviewer = reviewerPool[(index + offset) % reviewerPool.length]
    const daysAgo = 9 + index * 23

    return {
      _id: `${revieweeId.slice(0, 20)}r${String(index).padStart(3, '0')}`,
      contract: `${revieweeId.slice(0, 20)}c${String(index).padStart(3, '0')}`,
      reviewer,
      reviewee: revieweeId,
      rating,
      comment,
      createdAt: new Date(Date.parse('2026-08-30T00:00:00.000Z') - daysAgo * 86400000).toISOString(),
    }
  })
}

export function getReviewsForUser(userId) {
  const offset = Number.parseInt(userId.slice(-2), 16) || 0
  const count = 3 + (offset % 4)
  return reviewsFor(userId, count, offset)
}
