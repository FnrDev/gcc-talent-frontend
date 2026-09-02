import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import BrandLogo from '@/components/BrandLogo'

const columns = [
  {
    titleKey: 'footer.product',
    links: ['links.postJob', 'links.browseFreelancers', 'links.browseServices', 'footer.pricing', 'footer.enterprise'],
  },
  {
    titleKey: 'footer.features',
    links: ['nav.forClients', 'nav.forFreelancers', 'nav.categories', 'footer.messaging', 'footer.payments'],
  },
  {
    titleKey: 'footer.company',
    links: ['footer.about', 'footer.careers', 'footer.blog', 'footer.press', 'footer.contact'],
  },
  {
    titleKey: 'footer.resources',
    links: ['footer.helpCenter', 'footer.guides', 'footer.api', 'footer.community', 'footer.status'],
  },
  {
    // Platform names stay as they are in every language.
    titleKey: 'footer.connect',
    links: ['X (Twitter)', 'LinkedIn', 'Instagram', 'Facebook', 'YouTube'],
    untranslated: true,
  },
]

const legalLinks = [
  { labelKey: 'footer.privacyPolicy', to: '/privacy' },
  { labelKey: 'footer.termsOfService', to: '/terms' },
  { labelKey: 'footer.cookiePolicy', to: '/privacy#cookies' },
]

function Footer() {
  const { t } = useTranslation()

  return (
    <footer className="rounded-t-2xl bg-muted/40">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="flex flex-col items-center gap-10 lg:flex-row lg:items-start lg:justify-center lg:gap-16 lg:ps-10">
          <div className="flex items-center gap-2 lg:w-40">
            <BrandLogo className="size-7" alt="" />
            <span className="font-semibold text-foreground">{t('nav.brand')}</span>
          </div>

          <div className="inline-grid grid-cols-2 gap-x-12 gap-y-8 sm:grid-cols-3 lg:grid-cols-5">
            {columns.map((column) => (
              <div key={column.titleKey}>
                <p className="text-sm font-medium text-foreground">{t(column.titleKey)}</p>
                <ul className="mt-4 space-y-3">
                  {column.links.map((link) => (
                    <li key={link}>
                      <Link
                        to="#"
                        className="text-sm text-muted-foreground hover:text-foreground"
                      >
                        {column.untranslated ? link : t(link)}
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
              key={link.to}
              to={link.to}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              {t(link.labelKey)}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  )
}

export default Footer
