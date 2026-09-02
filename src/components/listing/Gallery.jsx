import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowLeft01Icon, ArrowRight01Icon } from '@hugeicons/core-free-icons'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// Main image plus a thumbnail strip, as in the reference detail layout.
function Gallery({ images = [], title }) {
  const { t } = useTranslation()
  const [active, setActive] = useState(0)

  if (!images.length) {
    return <div className="aspect-16/9 w-full rounded-xl bg-muted" />
  }

  const step = (delta) => {
    setActive((current) => (current + delta + images.length) % images.length)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative overflow-hidden rounded-xl bg-muted ring-1 ring-foreground/10">
        <img
          src={images[active].url}
          alt={images[active].alt ?? title}
          className="aspect-16/9 w-full object-cover"
        />

        {images.length > 1 && (
          <>
            <Button
              variant="outline"
              size="icon"
              aria-label={t('reviews.previousImage')}
              onClick={() => step(-1)}
              className="absolute top-1/2 left-3 -translate-y-1/2 shadow-sm"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} />
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label={t('reviews.nextImage')}
              onClick={() => step(1)}
              className="absolute top-1/2 right-3 -translate-y-1/2 shadow-sm"
            >
              <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
            </Button>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div
          className="flex max-w-full gap-2 overflow-x-auto pb-1"
          role="tablist"
          aria-label={t('reviews.galleryLabel', { title })}
        >
          {images.map((image, index) => (
            <button
              key={image.url + index}
              type="button"
              role="tab"
              aria-selected={index === active}
              aria-label={t('reviews.imageOf', { index: index + 1, total: images.length })}
              onClick={() => setActive(index)}
              className={cn(
                'shrink-0 overflow-hidden rounded-lg ring-1 transition-all focus-visible:ring-3 focus-visible:ring-ring/50',
                index === active ? 'ring-2 ring-primary' : 'ring-foreground/10 hover:ring-foreground/30',
              )}
            >
              <img src={image.url} alt="" className="aspect-16/9 w-24 object-cover sm:w-28" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default Gallery
