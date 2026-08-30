import { HugeiconsIcon } from '@hugeicons/react'

import { cn } from '@/lib/utils'

/**
 * The key/value table in the detail sidebar. Each row is
 * { icon, label, value } — value may be any node.
 */
function SpecList({ rows, className }) {
  return (
    <dl className={cn('divide-y divide-border overflow-hidden rounded-xl ring-1 ring-foreground/10', className)}>
      {rows.filter(Boolean).map((row) => (
        <div key={row.label} className="flex items-center gap-3 px-3 py-2.5">
          <dt className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
            {row.icon && (
              <HugeiconsIcon icon={row.icon} strokeWidth={2} className="size-4 shrink-0" aria-hidden="true" />
            )}
            <span className="truncate">{row.label}</span>
          </dt>
          <dd className="ml-auto text-right text-sm font-medium text-foreground">{row.value}</dd>
        </div>
      ))}
    </dl>
  )
}

export default SpecList
