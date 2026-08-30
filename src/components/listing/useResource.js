import { useEffect, useState } from 'react'

/**
 * Fetches one record by id and tracks loading/error. Kept separate from
 * useListingQuery because a detail page has no filters or pagination.
 *
 * Pass `resultKey` to pull one key out of the response payload, or omit it to
 * receive the whole payload — a page that needs several keys should make one
 * call and destructure rather than one call per key.
 *
 * Like useListingQuery, loading is derived from which id the held result
 * belongs to rather than set from inside the effect.
 */
function useResource(fetcher, id, resultKey) {
  const [result, setResult] = useState({ key: null, data: null, error: null })

  useEffect(() => {
    let cancelled = false

    fetcher(id)
      .then((response) => {
        if (cancelled) return
        const payload = resultKey ? response?.data?.[resultKey] : response?.data
        setResult({ key: id, data: payload ?? null, error: null })
      })
      .catch((error) => {
        if (cancelled) return
        setResult({
          key: id,
          data: null,
          error: error?.response?.data?.message || error?.message || 'Something went wrong.',
        })
      })

    return () => {
      cancelled = true
    }
  }, [fetcher, id, resultKey])

  return { data: result.data, error: result.error, loading: result.key !== id }
}

export default useResource
