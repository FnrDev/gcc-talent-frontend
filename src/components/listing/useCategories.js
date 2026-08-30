import { useEffect, useState } from 'react'

import { getCategories } from '@/services/taxonomyService'

// Categories drive the filter dropdown on both browse pages. They change
// rarely, so a plain fetch-once hook is enough.
function useCategories() {
  const [categories, setCategories] = useState([])

  useEffect(() => {
    let cancelled = false

    getCategories()
      .then((response) => {
        if (!cancelled) setCategories(response?.data?.categories ?? [])
      })
      .catch(() => {
        if (!cancelled) setCategories([])
      })

    return () => {
      cancelled = true
    }
  }, [])

  return categories
}

export default useCategories
