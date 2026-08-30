import { useCallback, useMemo, useState, useEffect } from 'react'
import { useSearchParams } from 'react-router'

/**
 * Owns everything a browse page needs: filter state, pagination, and the fetch
 * lifecycle. Filter state lives in the URL query string, so a filtered result
 * is shareable and the browser's back button steps through filter changes.
 *
 * @param fetcher    async (params) => ({ data: { [resultKey]: [], pagination } })
 * @param resultKey  the array key inside data — 'jobs' or 'gigs'
 * @param filterKeys the query params this page understands
 * @param defaults   values applied when the URL omits a key
 */
function useListingQuery({ fetcher, resultKey, filterKeys, defaults = {}, limit = 9 }) {
  const [searchParams, setSearchParams] = useSearchParams()

  // `key` records which query the held result belongs to. Loading is then
  // derived rather than set from inside the effect, which keeps the fetch out
  // of the render-cascade the react-hooks rules warn about.
  const [result, setResult] = useState({ key: null, items: [], pagination: null, error: null })

  const filters = useMemo(() => {
    const active = {}
    for (const key of filterKeys) {
      const value = searchParams.get(key) ?? defaults[key] ?? ''
      if (value) active[key] = value
    }
    return active
    // searchParams identity changes on every navigation, which is what we want.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, filterKeys])

  const page = Math.max(1, Number.parseInt(searchParams.get('page') ?? '1', 10) || 1)

  const queryKey = useMemo(() => JSON.stringify({ filters, page, limit }), [filters, page, limit])

  useEffect(() => {
    let cancelled = false

    fetcher({ ...filters, page, limit })
      .then((response) => {
        if (cancelled) return
        setResult({
          key: queryKey,
          items: response?.data?.[resultKey] ?? [],
          pagination: response?.data?.pagination ?? null,
          error: null,
        })
      })
      .catch((error) => {
        if (cancelled) return
        setResult({
          key: queryKey,
          items: [],
          pagination: null,
          error: error?.response?.data?.message || error?.message || 'Something went wrong.',
        })
      })

    // Cleanup runs before the next effect, so a superseded request can never
    // overwrite a newer one.
    return () => {
      cancelled = true
    }
    // queryKey collapses filters/page/limit into one stable string.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey, fetcher, resultKey])

  // Changing any filter returns to page 1 — staying on page 4 of a narrower
  // result set is the classic way to land on an empty page.
  const setFilter = useCallback(
    (key, value) => {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current)
          if (value) next.set(key, value)
          else next.delete(key)
          next.delete('page')
          return next
        },
        { replace: true },
      )
    },
    [setSearchParams],
  )

  const setPage = useCallback(
    (nextPage) => {
      setSearchParams((current) => {
        const next = new URLSearchParams(current)
        if (nextPage > 1) next.set('page', String(nextPage))
        else next.delete('page')
        return next
      })
      window.scrollTo({ top: 0, behavior: 'smooth' })
    },
    [setSearchParams],
  )

  const clearFilters = useCallback(() => {
    setSearchParams(new URLSearchParams(), { replace: true })
  }, [setSearchParams])

  return {
    items: result.items,
    pagination: result.pagination,
    error: result.error,
    loading: result.key !== queryKey,
    filters,
    page,
    setFilter,
    setPage,
    clearFilters,
    activeFilterCount: Object.values(filters).filter(Boolean).length,
  }
}

export default useListingQuery
