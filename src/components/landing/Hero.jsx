import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Search01Icon,
  Shield01Icon,
  CheckmarkBadge01Icon,
  Message01Icon,
  ArrowRight01Icon,
} from '@hugeicons/core-free-icons'

import { Button } from '@/components/ui/button'
import useCategories from '@/components/listing/useCategories'
import DitheredWaves from './DitheredWaves'
import { cn } from '@/lib/utils'

// Same ramp CallToAction uses, so the two animated panels read as one system.
const WAVE_COLORS = ['#2B4447', '#3A5457', '#D9D2C6', '#F6F0EA']

const TARGETS = [
  { value: 'services', label: 'Find services', placeholder: 'Try "logo design" or "React developer"' },
  { value: 'jobs', label: 'Find work', placeholder: 'Try "mobile app" or "content writing"' },
]

const TRUST = [
  { icon: Shield01Icon, label: 'Escrow-protected payments' },
  { icon: CheckmarkBadge01Icon, label: 'Verified freelancers' },
  { icon: Message01Icon, label: 'Support around the clock' },
]

function Hero() {
  const navigate = useNavigate()
  const categories = useCategories()
  const [query, setQuery] = useState('')
  const [target, setTarget] = useState('services')

  const active = TARGETS.find((option) => option.value === target)

  const submit = (event) => {
    event.preventDefault()
    const trimmed = query.trim()
    navigate(trimmed ? `/${target}?search=${encodeURIComponent(trimmed)}` : `/${target}`)
  }

  return (
    <section className="px-4 pt-4 pb-10">
      <div className="relative mx-auto flex min-h-[30rem] max-w-7xl flex-col items-center justify-center overflow-hidden rounded-3xl px-4 py-16 text-center sm:min-h-[36rem] sm:px-6 sm:py-20">
        {/* Animated backdrop. The fallback gradient shows when WebGL2 is absent. */}
        <div className="absolute inset-0" aria-hidden="true">
          <DitheredWaves
            colors={WAVE_COLORS}
            fallbackClassName="bg-gradient-to-br from-primary to-primary/70"
          />
        </div>
        {/* Scrim: the hero carries small text and a form, so it needs more
            contrast than a headline-only panel would. */}
        <div
          className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/40 to-black/60"
          aria-hidden="true"
        />

        <div className="relative flex w-full max-w-3xl flex-col items-center gap-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur-sm">
            <span className="size-1.5 rounded-full bg-white" />
            Now hiring across the GCC
          </span>

          <div className="flex flex-col gap-4">
            <h1 className="text-4xl font-semibold tracking-tight text-balance text-white sm:text-5xl lg:text-6xl">
              Find the right talent, anywhere in the GCC
            </h1>
            <p className="mx-auto max-w-xl text-base text-pretty text-white/80 sm:text-lg">
              Hire trusted freelancers or land your next contract — with escrow on every
              milestone, so neither side is exposed.
            </p>
          </div>

          {/* Search: one card, so the toggle and field read as a single control */}
          <div className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 p-2 backdrop-blur-md">
            <div
              role="tablist"
              aria-label="What are you looking for?"
              className="mb-2 flex gap-1 rounded-xl bg-black/20 p-1"
            >
              {TARGETS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  role="tab"
                  aria-selected={target === option.value}
                  onClick={() => setTarget(option.value)}
                  className={cn(
                    'flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    target === option.value
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-white/80 hover:bg-white/10 hover:text-white',
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {/* Input and button share one pill. Kept apart, the button sat on
                the dark scrim where a dark-teal fill all but disappeared;
                inside the light pill it becomes the clear focal point. The
                whole pill takes the focus ring, so it reads as one control. */}
            <form
              onSubmit={submit}
              className="flex items-center gap-1 rounded-xl bg-card p-1.5 shadow-2xl shadow-black/25 ring-1 ring-black/5 transition-shadow focus-within:ring-2 focus-within:ring-primary/50"
            >
              <HugeiconsIcon
                icon={Search01Icon}
                strokeWidth={2}
                className="ml-2.5 size-5 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={active.placeholder}
                aria-label={active.label}
                className="h-11 min-w-0 flex-1 bg-transparent px-2 text-base text-foreground outline-none placeholder:text-muted-foreground"
              />
              <Button type="submit" size="lg" className="h-11 shrink-0 px-4 text-base sm:px-5">
                Search
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  strokeWidth={2}
                  data-icon="inline-end"
                  className="hidden sm:block"
                />
              </Button>
            </form>
          </div>

          {/* Category shortcuts */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="text-sm text-white/60">Popular:</span>
            {categories.slice(0, 5).map((category) => (
              <Link
                key={category._id}
                to={`/${target}?category=${category._id}`}
                className="rounded-full border border-white/25 bg-white/10 px-3 py-1 text-sm text-white/90 backdrop-blur-sm transition-colors hover:bg-white/20 hover:text-white"
              >
                {category.name}
              </Link>
            ))}
          </div>

          {/* Trust strip */}
          <ul className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 border-t border-white/15 pt-6 text-sm text-white/75">
            {TRUST.map((item) => (
              <li key={item.label} className="flex items-center gap-2">
                <HugeiconsIcon icon={item.icon} strokeWidth={2} className="size-4" />
                {item.label}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

export default Hero
