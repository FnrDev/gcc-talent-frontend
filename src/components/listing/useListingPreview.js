import { useEffect, useMemo, useState } from 'react'

/**
 * A short, unfiltered slice of a listing for the landing page — no URL sync,
 * no pagination. Loading is derived from which params the held result belongs
 * to, matching useListingQuery and useResource.
 */
function useListingPreview(fetcher, params, resultKey) {
  const key = useMemo(() => JSON.stringify(params), [params])
  const [result, setResult] = useState({ key: null, items: [] })

  useEffect(() => {
    let cancelled = false

    fetcher(JSON.parse(key))
      .then((response) => {
        if (!cancelled) setResult({ key, items: response?.data?.[resultKey] ?? [] })
      })
      .catch(() => {
        if (!cancelled) setResult({ key, items: [] })
      })

    return () => {
      cancelled = true
    }
  }, [key, fetcher, resultKey])

  return { items: result.items, loading: result.key !== key }
}

export default useListingPreview
