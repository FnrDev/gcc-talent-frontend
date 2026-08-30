import { useEffect, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Search01Icon, FilterHorizontalIcon, Cancel01Icon } from '@hugeicons/core-free-icons'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// Typing shouldn't fire a request per keystroke, but the URL should still end
// up holding the final value so the result stays shareable.
function SearchField({ value, onChange, placeholder }) {
  const [draft, setDraft] = useState(value)
  const [syncedValue, setSyncedValue] = useState(value)

  // Adjusting state during render (React's documented pattern) rather than in
  // an effect: when the URL value changes from elsewhere — back button, clear
  // all — the draft follows it without a second render pass or a lost cursor.
  if (value !== syncedValue) {
    setSyncedValue(value)
    setDraft(value)
  }

  useEffect(() => {
    if (draft === value) return
    const timer = setTimeout(() => onChange(draft), 350)
    return () => clearTimeout(timer)
  }, [draft, value, onChange])

  return (
    <div className="relative min-w-0 flex-1 sm:max-w-xs">
      <HugeiconsIcon
        icon={Search01Icon}
        strokeWidth={2}
        className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <Input
        type="search"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="pl-8"
      />
    </div>
  )
}

// The "no filter" choice is a real option with an empty value rather than a
// placeholder, so Select.Value can label it from `items` like any other.
function FilterSelect({ definition, value, onChange }) {
  const items = [{ value: '', label: definition.label }, ...definition.options]

  return (
    <Select items={items} value={value} onValueChange={(next) => onChange(next ?? '')}>
      <SelectTrigger aria-label={definition.label}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {items.map((option) => (
          <SelectItem key={option.value || 'all'} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

/**
 * Renders a page's filter definitions. Each definition is
 * { key, type: 'search' | 'select', label, placeholder, options: [{value,label}] }
 * so Jobs and Services share this component while declaring different filters.
 */
function FilterBar({ definitions, filters, onFilterChange, onClear, activeFilterCount, resultLabel }) {
  const searchDefinition = definitions.find((definition) => definition.type === 'search')
  const selectDefinitions = definitions.filter((definition) => definition.type === 'select')

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {searchDefinition && (
          <SearchField
            value={filters[searchDefinition.key] ?? ''}
            onChange={(value) => onFilterChange(searchDefinition.key, value)}
            placeholder={searchDefinition.placeholder}
          />
        )}

        <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
          <HugeiconsIcon
            icon={FilterHorizontalIcon}
            strokeWidth={2}
            className="hidden size-4 text-muted-foreground sm:block"
            aria-hidden="true"
          />
          {selectDefinitions.map((definition) => (
            <FilterSelect
              key={definition.key}
              definition={definition}
              value={filters[definition.key] ?? ''}
              onChange={(value) => onFilterChange(definition.key, value)}
            />
          ))}
        </div>
      </div>

      <div className="flex min-h-7 items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{resultLabel}</p>
        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={onClear}>
            <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} data-icon="inline-start" />
            Clear filters
          </Button>
        )}
      </div>
    </div>
  )
}

export default FilterBar
