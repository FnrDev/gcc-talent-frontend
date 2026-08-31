import { useCallback, useEffect, useState } from 'react'

import UserLink from '@/components/UserLink'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { getServiceReviews } from '@/services/serviceService'

const DATE_FORMATTER = new Intl.DateTimeFormat('en-BH', { dateStyle: 'medium' })

function ServiceReviews({ serviceId }) {
  const [reviews, setReviews] = useState([])
  const [rating, setRating] = useState({ average: 0, count: 0 })
  const [pagination, setPagination] = useState(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadReviews = useCallback(async () => {
    setError('')
    try {
      const data = await getServiceReviews(serviceId, { page, limit: 6 })
      setReviews(data.reviews || [])
      setRating(data.rating || { average: 0, count: 0 })
      setPagination(data.pagination)
    } catch (loadError) {
      setError(loadError?.response?.data?.message || 'Reviews could not be loaded.')
    } finally {
      setLoading(false)
    }
  }, [page, serviceId])

  useEffect(() => {
    // The public review API initializes this service section.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadReviews()
  }, [loadReviews])

  return (
    <section className="mt-12" aria-labelledby="service-reviews-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="service-reviews-title" className="font-heading text-xl font-semibold text-foreground">Client reviews</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {rating.count ? `${Number(rating.average).toFixed(1)} from ${rating.count} verified contract reviews` : 'Reviews appear after contracts end.'}
          </p>
        </div>
        <Button size="sm" variant="ghost" onClick={loadReviews}>Refresh</Button>
      </div>

      {error && <Alert variant="destructive" className="mt-4"><AlertDescription>{error}</AlertDescription></Alert>}

      {loading ? (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
      ) : reviews.length ? (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {reviews.map((review) => (
            <article key={review._id} className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
              <div className="flex items-start justify-between gap-3">
                <UserLink user={review.reviewer} showAvatar className="font-medium" />
                <span className="text-sm font-medium text-primary" aria-label={`${review.rating} out of 5 stars`}>
                  {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                </span>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{review.comment}</p>
              <p className="mt-3 text-xs text-muted-foreground">{DATE_FORMATTER.format(new Date(review.createdAt))}</p>
            </article>
          ))}
        </div>
      ) : (
        <p className="mt-4 rounded-xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">No reviews for this service yet.</p>
      )}

      {pagination?.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <Button variant="outline" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>Previous</Button>
          <span className="text-sm text-muted-foreground">Page {page} of {pagination.totalPages}</span>
          <Button variant="outline" disabled={page >= pagination.totalPages} onClick={() => setPage((current) => current + 1)}>Next</Button>
        </div>
      )}
    </section>
  )
}

export default ServiceReviews
