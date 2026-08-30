import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { Search01Icon } from '@hugeicons/core-free-icons'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group'
import { useCategories } from '@/context/CategoryContext'
import { selectLandingCategories } from './categories'

function Hero() {
  const navigate = useNavigate()
  const { categories, loading, error, refreshCategories } = useCategories()
  const visibleCategories = selectLandingCategories(categories)
  const [query, setQuery] = useState('')
  const [target, setTarget] = useState('services')

  const submit = (event) => {
    event.preventDefault()
    const trimmed = query.trim()
    navigate(trimmed ? `/${target}?search=${encodeURIComponent(trimmed)}` : `/${target}`)
  }

  return (
    <section className="mx-auto max-w-6xl px-4 pt-10 pb-8 text-center">
      <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
        Find the right talent, anywhere in the GCC
      </h1>
      <p className="mt-2 text-muted-foreground">
        Hire trusted freelancers or find your next job in seconds
      </p>

      <div className="mx-auto mt-5 flex w-fit rounded-lg bg-muted p-0.5">
        {[
          { value: 'services', label: 'Find services' },
          { value: 'jobs', label: 'Find work' },
        ].map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setTarget(option.value)}
            aria-pressed={target === option.value}
            className={
              target === option.value
                ? 'rounded-md bg-background px-3 py-1 text-sm font-medium text-foreground shadow-sm'
                : 'rounded-md px-3 py-1 text-sm font-medium text-muted-foreground hover:text-foreground'
            }
          >
            {option.label}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="mx-auto mt-3 flex max-w-2xl flex-col gap-2 sm:flex-row">
        <InputGroup className="h-10 flex-1">
          <InputGroupAddon>
            <HugeiconsIcon icon={Search01Icon} strokeWidth={2} />
          </InputGroupAddon>
          <InputGroupInput
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={target === 'services' ? 'Search for services or freelancers' : 'Search open jobs'}
            aria-label="Search"
          />
        </InputGroup>
        <Button type="submit" size="lg" className="h-10">
          Search
        </Button>
      </form>

      <div className="mx-auto mt-4 flex max-w-2xl flex-wrap justify-center gap-2">
        {loading ? (
          Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} className="h-7 w-24 rounded-full" />
          ))
        ) : error ? (
          <div role="alert" className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Categories are unavailable.</span>
            <Button type="button" variant="link" size="xs" onClick={refreshCategories}>
              Try again
            </Button>
          </div>
        ) : visibleCategories.length === 0 ? (
          <p className="text-sm text-muted-foreground">No categories are available yet.</p>
        ) : visibleCategories.map((category) => (
          <Badge
            key={category._id || category.slug || category.name}
            variant="outline"
            className="h-7 px-3 text-sm"
            render={<Link to={`/jobs?category=${encodeURIComponent(category._id)}`} />}
          >
            {category.name}
          </Badge>
        ))}
      </div>
    </section>
  )
}

export default Hero
