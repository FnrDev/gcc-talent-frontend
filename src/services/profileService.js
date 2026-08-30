// MOCK DATA — the back-end has GET /profile/:userId (profile.controller.js
// getPublicProfile) but no public browse or per-user reviews wired to it yet.
// Swap each body for the commented call once those land; the shapes here are
// what a public profile page needs.
// import api from './api'

import { delay } from './mock/query'
import { clients, freelancers } from './mock/users'
import { profileFor } from './mock/profiles'
import { getReviewsForUser } from './mock/reviews'
import { gigs } from './mock/gigs'
import { jobs } from './mock/jobs'

function findUser(userId) {
  return [...freelancers, ...clients].find((user) => user._id === userId) ?? null
}

// GET /profile/:userId — returns the user, their role-specific profile, the
// work they currently have listed, and their reviews.
async function getPublicProfile(userId) {
  // return (await api.get(`/profile/${userId}`)).data
  await delay()

  const user = findUser(userId)
  const profile = profileFor(userId)

  if (!user || !profile) {
    const error = new Error('Profile not found.')
    error.status = 404
    throw error
  }

  const listings =
    profile.role === 'freelancer'
      ? gigs.filter((gig) => gig.seller._id === userId)
      : jobs.filter((job) => job.client._id === userId)

  const reviews = getReviewsForUser(userId)

  return {
    success: true,
    data: {
      user,
      profile,
      listings,
      reviews,
      stats: {
        reviewCount: user.ratingCount,
        ratingAvg: user.ratingAvg,
        // Shown as the "% rating" pill: the share of the maximum score.
        ratingPercent: Math.round((user.ratingAvg / 5) * 100),
        completed: profile.role === 'freelancer' ? profile.completedContracts : profile.jobsPosted,
      },
    },
  }
}

export { getPublicProfile }
