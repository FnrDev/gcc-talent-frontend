import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { HugeiconsIcon } from '@hugeicons/react'
import { Search01Icon } from '@hugeicons/core-free-icons'
import { Input } from '@/components/ui/input'
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
    <div className="relative">
      <HugeiconsIcon
        icon={Search01Icon}
        strokeWidth={2}
        className="pointer-events-none absolute top-1/2 start-2.5 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <Input
        type="search"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full ps-8"
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
      <SelectTrigger aria-label={definition.title || definition.label} className="w-full">
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
 * Renders a page's filter definitions as the stacked sidebar rail that
 * BrowseLayout expects. Each definition is
 * { key, type: 'search' | 'select', title, label, placeholder, options: [...] }
 * where `title` is the visible field label and `label` names the "no filter"
 * option, matching how the jobs sidebar labels its own controls.
 */
function FilterPanel({ definitions, filters, onFilterChange, onClear, activeFilterCount }) {
  const { t } = useTranslation()
  const searchDefinition = definitions.find((definition) => definition.type === 'search')
  const selectDefinitions = definitions.filter((definition) => definition.type === 'select')

  return (
    <div className="grid gap-5">
      {searchDefinition ? (
        <label className="grid gap-1.5 text-sm font-medium">
          {searchDefinition.title || t('common.search')}
          <SearchField
            value={filters[searchDefinition.key] ?? ''}
            onChange={(value) => onFilterChange(searchDefinition.key, value)}
            placeholder={searchDefinition.placeholder}
          />
        </label>
      ) : null}

      {selectDefinitions.map((definition) => (
        <label key={definition.key} className="grid gap-1.5 text-sm font-medium">
          {definition.title || definition.label}
          <FilterSelect
            definition={definition}
            value={filters[definition.key] ?? ''}
            onChange={(value) => onFilterChange(definition.key, value)}
          />
        </label>
      ))}

      {activeFilterCount > 0 ? (
        <Button type="button" variant="ghost" className="w-full" onClick={onClear}>
          {t('common.clearFilters')}
        </Button>
      ) : null}
    </div>
  )
}

export default FilterPanel
