import { useMemo } from 'react'

import ListingPage from '@/components/listing/ListingPage'
import JobCard from '@/components/listing/JobCard'
import useListingQuery from '@/components/listing/useListingQuery'
import useCategories from '@/components/listing/useCategories'
import { getJobs } from '@/services/jobService'

// Module constants so their identity is stable across renders — the listing
// query memoises on them.
const FILTER_KEYS = ['search', 'category', 'budgetType', 'experienceLevel', 'sort']

const SEO = {
  title: 'Hiring talent in the GCC',
  paragraphs: [
    'Every job on this page has been posted by a verified client and is open for proposals right now. Filter by category, budget type, and experience level to narrow the board down to the work that actually fits how you want to be engaged — a fixed-price project with a defined scope, or an hourly retainer you can grow into.',
    'Budget ranges are set by the client before posting, so the number you see is the number they have planned for. Where a range is wide, it usually means the scope is still being shaped and a well-argued proposal can move it. The proposal count tells you how much competition you are walking into: a job with three proposals and a clear brief is a better use of your time than one with forty.',
    'Submitting a proposal is free. You will be asked for your rate, your delivery estimate, and a short note on how you would approach the work — clients on this marketplace consistently report that the note matters more than the rate. Once a client accepts, the platform creates a contract with milestone-based escrow, so funds are committed before you start and released as you deliver.',
    'If you are new here, complete your profile before you apply. Clients filter proposals by profile completeness and rating, and a profile with a portfolio, verified skills, and a clear headline is the single biggest factor in getting a first contract.',
  ],
}

const PROMO = {
  eyebrow: 'For Clients',
  title: 'Post a job and get proposals within 24 hours',
  description: 'Describe what you need and let qualified freelancers come to you.',
  actionLabel: 'Post a Job',
  actionTo: '/sign-up',
}

function JobsPage() {
  const categories = useCategories()

  const listing = useListingQuery({
    fetcher: getJobs,
    resultKey: 'jobs',
    filterKeys: FILTER_KEYS,
    limit: 9,
  })

  const filterDefinitions = useMemo(
    () => [
      { key: 'search', type: 'search', placeholder: 'Search jobs by title, skill, or keyword' },
      {
        key: 'category',
        type: 'select',
        label: 'All categories',
        options: categories.map((category) => ({ value: category._id, label: category.name })),
      },
      {
        key: 'budgetType',
        type: 'select',
        label: 'Any budget type',
        options: [
          { value: 'fixed', label: 'Fixed price' },
          { value: 'hourly', label: 'Hourly' },
        ],
      },
      {
        key: 'experienceLevel',
        type: 'select',
        label: 'Any experience',
        options: [
          { value: 'entry', label: 'Entry level' },
          { value: 'intermediate', label: 'Intermediate' },
          { value: 'expert', label: 'Expert' },
        ],
      },
      {
        key: 'sort',
        type: 'select',
        label: 'Newest first',
        options: [
          { value: 'oldest', label: 'Oldest first' },
          { value: 'budget_high', label: 'Highest budget' },
          { value: 'budget_low', label: 'Lowest budget' },
          { value: 'proposals_low', label: 'Fewest proposals' },
        ],
      },
    ],
    [categories],
  )

  return (
    <ListingPage
      title="Find work"
      subtitle="Browse open jobs from verified clients across the GCC."
      noun="jobs"
      listing={listing}
      filterDefinitions={filterDefinitions}
      renderItem={(job) => <JobCard key={job._id} job={job} />}
      emptyTitle="No jobs match your filters"
      emptyDescription="Try widening the budget type or experience level, or clear the filters to see every open job."
      seo={SEO}
      promo={PROMO}
    />
  )
}

export default JobsPage
