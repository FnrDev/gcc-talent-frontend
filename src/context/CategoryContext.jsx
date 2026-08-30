import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

import { getCategories } from '@/services/jobService'

const CategoryContext = createContext(null)

function getCategoryErrorMessage(error) {
  const message = error?.response?.data?.message

  return typeof message === 'string' && message.trim()
    ? message
    : 'We could not load categories right now. Please try again.'
}

export function CategoryProvider({ children }) {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const requestSequence = useRef(0)

  const refreshCategories = useCallback(async () => {
    const requestId = ++requestSequence.current
    setLoading(true)
    setError('')

    try {
      const result = await getCategories()

      if (requestId !== requestSequence.current) return
      setCategories(Array.isArray(result) ? result : [])
    } catch (requestError) {
      if (requestId !== requestSequence.current) return
      setCategories([])
      setError(getCategoryErrorMessage(requestError))
    } finally {
      if (requestId === requestSequence.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    // The marketplace taxonomy is shared by the shell and landing-page sections.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshCategories()

    return () => {
      requestSequence.current += 1
    }
  }, [refreshCategories])

  const value = useMemo(
    () => ({ categories, loading, error, refreshCategories }),
    [categories, error, loading, refreshCategories],
  )

  return <CategoryContext.Provider value={value}>{children}</CategoryContext.Provider>
}

// Hooks and their provider intentionally share this small context module.
// eslint-disable-next-line react-refresh/only-export-components
export function useCategories() {
  const context = useContext(CategoryContext)

  if (!context) {
    throw new Error('useCategories must be used within a CategoryProvider.')
  }

  return context
}
