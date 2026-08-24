import { Link } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { Briefcase01Icon } from '@hugeicons/core-free-icons'

const columns = [
  {
    title: 'Product',
    links: ['Post a Job', 'Browse Freelancers', 'Browse Services', 'Pricing', 'Enterprise'],
  },
  {
    title: 'Features',
    links: ['For Clients', 'For Freelancers', 'Categories', 'Messaging', 'Payments & Escrow'],
  },
  {
    title: 'Company',
    links: ['About', 'Careers', 'Blog', 'Press', 'Contact'],
  },
  {
    title: 'Resources',
    links: ['Help Center', 'Guides', 'API', 'Community', 'Status'],
  },
  {
    title: 'Connect',
    links: ['X (Twitter)', 'LinkedIn', 'Instagram', 'Facebook', 'YouTube'],
  },
]

const legalLinks = ['Privacy Policy', 'Terms of Service', 'Cookie Policy']

function Footer() {
  return (
    <footer className="rounded-t-2xl bg-muted/40">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="flex flex-col items-center gap-10 lg:flex-row lg:items-start lg:justify-center lg:gap-16 lg:pl-10">
          <div className="flex items-center gap-2 lg:w-40">
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <HugeiconsIcon icon={Briefcase01Icon} strokeWidth={2} className="size-4" />
            </span>
            <span className="font-semibold text-foreground">GCC Talents</span>
          </div>

          <div className="inline-grid grid-cols-2 gap-x-12 gap-y-8 sm:grid-cols-3 lg:grid-cols-5">
            {columns.map((column) => (
              <div key={column.title}>
                <p className="text-sm font-medium text-foreground">{column.title}</p>
                <ul className="mt-4 space-y-3">
                  {column.links.map((link) => (
                    <li key={link}>
                      <Link
                        to="#"
                        className="text-sm text-muted-foreground hover:text-foreground"
                      >
                        {link}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 flex flex-wrap gap-x-6 gap-y-2">
          {legalLinks.map((link) => (
            <Link
              key={link}
              to="#"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              {link}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  )
}

export default Footer
