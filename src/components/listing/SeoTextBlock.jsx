import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowDown01Icon } from '@hugeicons/core-free-icons'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// The long-form section beneath the results in the reference layout: collapsed
// to a few lines behind a fade, expanded on request.
function SeoTextBlock({ title, paragraphs }) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)

  return (
    <section className="border-t border-border pt-8">
      <h2 className="mb-3 font-heading text-lg font-semibold text-foreground">{title}</h2>

      <div className="relative">
        <div
          className={cn(
            'space-y-3 text-sm leading-relaxed text-muted-foreground',
            !expanded && 'max-h-40 overflow-hidden',
          )}
        >
          {paragraphs.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>

        {!expanded && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-background to-transparent" />
        )}
      </div>

      <div className="mt-2 flex justify-center">
        <Button variant="link" size="sm" onClick={() => setExpanded((value) => !value)}>
          {expanded ? t('common.showLess') : t('common.readMore')}
          <HugeiconsIcon
            icon={ArrowDown01Icon}
            strokeWidth={2}
            data-icon="inline-end"
            className={cn('transition-transform', expanded && 'rotate-180')}
          />
        </Button>
      </div>
    </section>
  )
}

export default SeoTextBlock
