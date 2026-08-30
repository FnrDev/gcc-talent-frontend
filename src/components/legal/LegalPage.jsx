import { useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router'
import BrandLogo from '@/components/BrandLogo'
import Footer from '@/components/landing/Footer'
import LegalContactLink from '@/components/legal/LegalContactLink'
import { cn } from '@/lib/utils'

const documents = [
  { path: '/privacy', label: 'Privacy Policy' },
  { path: '/terms', label: 'Terms of Service' },
]

function Contents({ path, sections, hash }) {
  return (
    <ol className="space-y-1">
      {sections.map((section, index) => (
        <li key={section.id}>
          <Link
            to={`${path}#${section.id}`}
            aria-current={hash === `#${section.id}` ? 'location' : undefined}
            className={cn(
              'mr-0 flex gap-3 rounded-md px-3 py-2 text-sm leading-5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
              hash === `#${section.id}` && 'bg-primary/5 font-medium text-primary',
            )}
          >
            <span className="w-4 shrink-0 text-xs tabular-nums opacity-60" aria-hidden="true">
              {String(index + 1).padStart(2, '0')}
            </span>
            {section.title}
          </Link>
        </li>
      ))}
    </ol>
  )
}

function LegalPage({ path, title, description, sections }) {
  const { pathname, hash, key } = useLocation()
  const headingRef = useRef(null)
  const relatedDocument = documents.find((document) => document.path !== path)

  useEffect(() => {
    const previousTitle = document.title
    document.title = `${title} | GCC Talents`
    return () => { document.title = previousTitle }
  }, [title])

  useEffect(() => () => {
    // Do not carry a long legal document's scroll position into another page.
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [])

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      let targetId = ''
      try {
        targetId = decodeURIComponent(hash.slice(1))
      } catch {
        // Invalid fragments should not stop a public legal page from rendering.
      }

      const target = targetId ? document.getElementById(targetId) : null
      if (target) {
        target.scrollIntoView({ block: 'start', behavior: 'auto' })
        target.focus({ preventScroll: true })
      } else {
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
        headingRef.current?.focus({ preventScroll: true })
      }
    })
    return () => window.cancelAnimationFrame(frame)
  }, [pathname, hash, key])

  return (
    <div className="min-h-svh bg-background">
      <a
        href="#legal-content"
        className="sr-only z-50 rounded-md bg-background p-3 text-sm shadow focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link to="/" className="flex shrink-0 items-center gap-2 font-semibold" aria-label="GCC Talents home">
            <BrandLogo className="size-7" alt="" />
            GCC Talents
          </Link>
          <Link to="/" className="rounded-md px-2 py-2 text-sm text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring">
            Back to home <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </header>

      <main id="legal-content" aria-labelledby="legal-title" tabIndex={-1} className="mx-auto max-w-6xl scroll-mt-24 px-4 py-10 outline-none sm:px-6 sm:py-14">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold tracking-[0.18em] text-primary uppercase">GCC Talents · Legal</p>
          <h1 id="legal-title" ref={headingRef} tabIndex={-1} className="mt-4 scroll-mt-24 text-4xl font-semibold tracking-tight text-foreground outline-none sm:text-5xl">
            {title}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">{description}</p>
          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
            <span className="rounded-full border border-primary/15 bg-primary/5 px-2.5 py-1 font-medium text-primary">Kingdom of Bahrain</span>
            <span>Last updated <time dateTime="2026-08-27">27 August 2026</time></span>
          </div>
        </div>

        <nav aria-label="Legal documents" className="mt-8 flex gap-2 border-b pb-4">
          {documents.map((document) => (
            <Link
              key={document.path}
              to={document.path}
              aria-current={path === document.path ? 'page' : undefined}
              className={cn(
                'mr-0 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                path === document.path ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              {document.label}
            </Link>
          ))}
        </nav>

        <div className="mt-8 grid items-start gap-8 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-12">
          <aside className="sticky top-24 hidden max-h-[calc(100svh-7rem)] overflow-y-auto lg:block">
            <p className="mb-3 px-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase">On this page</p>
            <nav aria-label="On this page"><Contents path={path} sections={sections} hash={hash} /></nav>
          </aside>

          <div className="min-w-0 max-w-3xl">
            <details className="mb-6 rounded-xl border bg-muted/20 p-4 lg:hidden">
              <summary className="cursor-pointer rounded-sm text-sm font-medium focus-visible:outline-2 focus-visible:outline-ring">On this page</summary>
              <nav aria-label="On this page" className="mt-3"><Contents path={path} sections={sections} hash={hash} /></nav>
            </details>

            <aside aria-label="Contact GCC Talents" className="mb-10 rounded-xl border bg-muted/20 p-5 text-sm leading-6">
              <p className="font-semibold">Questions? We’re here to help.</p>
              <p className="mt-1 text-muted-foreground [&_a]:font-medium [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4 [&_a]:break-words">Contact <LegalContactLink /> for support, privacy requests, or questions about these policies.</p>
            </aside>

            <article aria-label={title}>
              {sections.map((section, index) => (
                <section key={section.id} id={section.id} tabIndex={-1} aria-labelledby={`${section.id}-heading`} className="mb-9 scroll-mt-24 border-b pb-9 outline-none last:mb-0 last:border-0">
                  <h2 id={`${section.id}-heading`} className="flex items-baseline gap-3 text-xl font-semibold tracking-tight text-foreground">
                    <span aria-hidden="true" className="shrink-0 text-xs font-medium tabular-nums text-primary/60">{String(index + 1).padStart(2, '0')}</span>
                    {section.title}
                  </h2>
                  <div className="mt-4 space-y-4 text-sm leading-7 text-muted-foreground sm:text-base [&_a]:font-medium [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4 [&_a]:break-words [&_li]:pl-1 [&_strong]:font-medium [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
                    {section.content}
                  </div>
                </section>
              ))}
            </article>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-muted/20 p-5 text-sm">
              <Link to={relatedDocument.path} className="font-medium text-primary underline-offset-4 hover:underline">Read the {relatedDocument.label} <span aria-hidden="true">→</span></Link>
              <Link to={`${path}#legal-content`} className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">Back to top <span aria-hidden="true">↑</span></Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default LegalPage
