import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { HugeiconsIcon } from '@hugeicons/react'
import { Search01Icon } from '@hugeicons/core-free-icons'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

/**
 * The hero search bar, styled to match the jobs page it was modelled on.
 *
 * Typing still debounces into the URL so results follow along, and submitting
 * flushes the pending draft immediately instead of waiting out the timer.
 */
function HeroSearch({ value, onChange, placeholder, buttonLabel }) {
  const { t } = useTranslation()
  const [draft, setDraft] = useState(value)
  const [syncedValue, setSyncedValue] = useState(value)

  // Adjusting state during render (React's documented pattern): when the URL
  // value changes from elsewhere — back button, clear all — the draft follows
  // without a second render pass or a lost cursor.
  if (value !== syncedValue) {
    setSyncedValue(value)
    setDraft(value)
  }

  useEffect(() => {
    if (draft === value) return
    const timer = setTimeout(() => onChange(draft), 350)
    return () => clearTimeout(timer)
  }, [draft, value, onChange])

  function submit(event) {
    event.preventDefault()
    if (draft !== value) onChange(draft)
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row" role="search">
      <div className="relative flex-1">
        <HugeiconsIcon
          icon={Search01Icon}
          strokeWidth={2}
          className="pointer-events-none absolute top-1/2 start-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          type="search"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          className="h-11 ps-9"
          placeholder={placeholder}
          aria-label={placeholder}
        />
      </div>
      <Button type="submit" size="lg" className="h-11 px-5">
        {buttonLabel ?? t('common.search')}
      </Button>
    </form>
  )
}

export default HeroSearch
