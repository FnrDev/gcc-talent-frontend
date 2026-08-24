import { Link } from 'react-router'
import { Button } from '@/components/ui/button'

function PromoBanner({ eyebrow, title, description, actionLabel, actionTo }) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-4">
      <div className="flex flex-col items-center gap-4 rounded-xl border border-primary/20 bg-primary/5 px-6 py-10 text-center sm:flex-row sm:justify-between sm:text-left">
        <div>
          <p className="text-sm font-medium text-primary">{eyebrow}</p>
          <h3 className="mt-1 text-xl font-semibold text-foreground">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        <Button
          size="lg"
          className="shrink-0"
          nativeButton={false}
          render={<Link to={actionTo} />}
        >
          {actionLabel}
        </Button>
      </div>
    </section>
  )
}

export default PromoBanner
