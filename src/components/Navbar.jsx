import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Agreement01Icon,
  Briefcase02Icon,
  Cancel01Icon,
  DashboardSquare01Icon,
  Edit02Icon,
  JobSearchIcon,
  Logout01Icon,
  FileSearchIcon,
  Menu02Icon,
  PackageAddIcon,
  PackageCheckIcon,
  Search01Icon,
  UserCircleIcon,
  Wallet02Icon,
  WorkHistoryIcon,
} from '@hugeicons/core-free-icons'
import { useAuth } from '../context/AuthContext'
import BrandLogo from '@/components/BrandLogo'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { resolveCategoryIcon } from '@/components/landing/categories'
import { useCategories } from '@/context/CategoryContext'
import { cn } from '@/lib/utils'

const clientLinks = [
  { labelKey: 'links.postJob', to: '/jobs/new', roles: ['client'], showToGuests: true },
  { labelKey: 'links.myJobs', to: '/jobs/mine', roles: ['client'] },
  { labelKey: 'links.myOrders', to: '/orders', roles: ['client'] },
  { labelKey: 'links.myContracts', to: '/contracts', roles: ['client'] },
  { labelKey: 'links.wallet', to: '/wallet', roles: ['client'] },
  { labelKey: 'links.browseServices', to: '/services' },
  { labelKey: 'links.browseFreelancers', to: '/search?type=freelancers' },
  { labelKey: 'links.howItWorks', to: '/#how-it-works' },
]

const freelancerLinks = [
  { labelKey: 'links.browseJobs', to: '/jobs' },
  { labelKey: 'links.createService', to: '/services/new', roles: ['freelancer'] },
  { labelKey: 'links.myProposals', to: '/proposals', roles: ['freelancer'] },
  { labelKey: 'links.myContracts', to: '/contracts', roles: ['freelancer'] },
  { labelKey: 'links.wallet', to: '/wallet', roles: ['freelancer'] },
  { labelKey: 'links.becomeFreelancer', to: '/sign-up', guestOnly: true },
  { labelKey: 'links.howItWorks', to: '/#how-it-works' },
]

// The four destinations the pill shows as plain links on mobile, where the
// mega-menus collapse into the sheet.
const primaryLinks = [
  { labelKey: 'nav.services', to: '/services' },
  { labelKey: 'nav.jobs', to: '/jobs' },
  { labelKey: 'links.browseFreelancers', to: '/search?type=freelancers' },
  { labelKey: 'links.howItWorks', to: '/#how-it-works' },
]

function linkIsVisible(link, user) {
  if (link.guestOnly) return !user
  if (link.roles) return user ? link.roles.includes(user.role) : Boolean(link.showToGuests)
  return true
}

function Navbar() {
  const { t } = useTranslation()
  const { logout, user } = useAuth()
  const { categories, loading: categoriesLoading, error: categoriesError, refreshCategories } = useCategories()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  // The pill only deepens its shadow on scroll — it never changes colour, so it
  // reads the same over the hero's blue as it does over paper.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const avatarFallback = user?.name
    ?.split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'GT'
  const roleLabel = user?.role === 'client'
    ? t('nav.clientAccount')
    : user?.role === 'freelancer'
      ? t('nav.freelancerAccount')
      : t('nav.administrator')

  const closeMenu = () => setMenuOpen(false)

  return (
    // A floating pill rather than a full-width bar: it reads as an object on the
    // page, so the same header works over the hero's blue and over paper without
    // needing two colour schemes.
    <header className="sticky top-0 z-40 w-full px-4 pt-8">
      <div
        className={cn(
          'mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-3 rounded-full bg-white/95 ps-4 pe-2 ring-1 ring-ink/5 backdrop-blur-md transition-shadow duration-300',
          scrolled
            ? 'shadow-[0_12px_36px_-14px_rgba(6,24,43,0.45)]'
            : 'shadow-[0_8px_26px_-16px_rgba(6,24,43,0.4)]',
        )}
      >
        <div className="flex min-w-0 items-center gap-4">
          <Link
            to="/"
            className="flex shrink-0 items-center gap-2 font-display text-base font-bold text-foreground"
          >
            <BrandLogo className="size-7" alt="" />
            {t('nav.brand')}
          </Link>

          <div className="hidden lg:block">
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="rounded-full">{t('nav.categories')}</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid max-h-80 w-80 grid-cols-1 gap-1 overflow-y-auto p-1 sm:w-96 sm:grid-cols-2">
                      {categoriesLoading ? (
                        <li className="col-span-full px-3 py-4 text-sm text-muted-foreground" aria-live="polite">
                          {t('nav.loadingCategories')}
                        </li>
                      ) : categoriesError ? (
                        <li className="col-span-full flex items-center justify-between gap-3 px-3 py-2">
                          <span className="text-sm text-muted-foreground">{t('nav.categoriesUnavailable')}</span>
                          <Button type="button" size="xs" variant="ghost" onClick={refreshCategories}>
                            {t('common.tryAgain')}
                          </Button>
                        </li>
                      ) : categories.length === 0 ? (
                        <li className="col-span-full px-3 py-4 text-sm text-muted-foreground">
                          {t('nav.noCategories')}
                        </li>
                      ) : categories.map((category) => (
                        <li key={category._id || category.slug || category.name}>
                          <NavigationMenuLink
                            render={<Link to={`/jobs?category=${encodeURIComponent(category._id)}`} />}
                          >
                            <HugeiconsIcon icon={resolveCategoryIcon(category)} strokeWidth={2} />
                            {category.name}
                          </NavigationMenuLink>
                        </li>
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuLink className="rounded-full" render={<Link to="/services" />}>
                    {t('nav.services')}
                  </NavigationMenuLink>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuLink className="rounded-full" render={<Link to="/jobs" />}>
                    {t('nav.jobs')}
                  </NavigationMenuLink>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuTrigger className="rounded-full">{t('nav.forClients')}</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="w-56 p-1">
                      {clientLinks.filter((link) => linkIsVisible(link, user)).map((link) => (
                        <li key={link.labelKey}>
                          <NavigationMenuLink render={<Link to={link.to} />}>
                            {t(link.labelKey)}
                          </NavigationMenuLink>
                        </li>
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuTrigger className="rounded-full">{t('nav.forFreelancers')}</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="w-56 p-1">
                      {freelancerLinks.filter((link) => linkIsVisible(link, user)).map((link) => (
                        <li key={link.labelKey}>
                          <NavigationMenuLink render={<Link to={link.to} />}>
                            {t(link.labelKey)}
                          </NavigationMenuLink>
                        </li>
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <LanguageSwitcher className="hidden rounded-full sm:inline-flex" />

          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            nativeButton={false}
            render={<Link to="/search" aria-label={t('nav.searchMarketplace')} />}
          >
            <HugeiconsIcon icon={Search01Icon} strokeWidth={2} />
            <span className="sr-only">{t('nav.searchMarketplace')}</span>
          </Button>

          {user ? (
            <DropdownMenu>
            <DropdownMenuTrigger
              className="rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              aria-label={t('nav.openAccountMenu', { name: user.name })}
            >
              <Avatar size="sm">
                {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt="" /> : null}
                <AvatarFallback>{avatarFallback}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <div className="px-2 py-2 text-xs" aria-hidden="true">
                <span className="block truncate text-sm font-medium text-foreground">{user.name}</span>
                <span className="mt-0.5 block truncate font-normal text-muted-foreground">{user.email}</span>
                <span className="mt-1 block font-normal text-muted-foreground">{roleLabel}</span>
              </div>
              <DropdownMenuSeparator />
              {user.role === 'client' || user.role === 'freelancer' ? (
                <>
                  <DropdownMenuItem render={<Link to={`/profile/${user._id}`} />}>
                    <HugeiconsIcon icon={UserCircleIcon} strokeWidth={2} />
                    {t('nav.viewProfile')}
                  </DropdownMenuItem>
                  <DropdownMenuItem render={<Link to="/profile/edit" />}>
                    <HugeiconsIcon icon={Edit02Icon} strokeWidth={2} />
                    {t('nav.editProfile')}
                  </DropdownMenuItem>
                </>
              ) : null}
              <DropdownMenuItem render={<Link to="/dashboard" />}>
                <HugeiconsIcon icon={DashboardSquare01Icon} strokeWidth={2} />
                {t('nav.dashboard')}
              </DropdownMenuItem>
              {user.role === 'client' || user.role === 'freelancer' ? (
                <>
                  <DropdownMenuItem render={<Link to="/contracts" />}>
                    <HugeiconsIcon icon={Agreement01Icon} strokeWidth={2} />
                    {t('links.myContracts')}
                  </DropdownMenuItem>
                  <DropdownMenuItem render={<Link to="/wallet" />}>
                    <HugeiconsIcon icon={Wallet02Icon} strokeWidth={2} />
                    {t('links.wallet')}
                  </DropdownMenuItem>
                </>
              ) : null}
              {user.role === 'client' ? (
                <>
                  <DropdownMenuItem render={<Link to="/jobs/new" />}>
                    <HugeiconsIcon icon={Briefcase02Icon} strokeWidth={2} />
                    {t('links.postJob')}
                  </DropdownMenuItem>
                  <DropdownMenuItem render={<Link to="/jobs/mine" />}>
                    <HugeiconsIcon icon={WorkHistoryIcon} strokeWidth={2} />
                    {t('links.myJobs')}
                  </DropdownMenuItem>
                  <DropdownMenuItem render={<Link to="/orders" />}>
                    <HugeiconsIcon icon={PackageCheckIcon} strokeWidth={2} />
                    {t('links.myOrders')}
                  </DropdownMenuItem>
                </>
              ) : null}
              {user.role === 'freelancer' ? (
                <>
                  <DropdownMenuItem render={<Link to="/jobs" />}>
                    <HugeiconsIcon icon={JobSearchIcon} strokeWidth={2} />
                    {t('links.browseJobs')}
                  </DropdownMenuItem>
                  <DropdownMenuItem render={<Link to="/services/new" />}>
                    <HugeiconsIcon icon={PackageAddIcon} strokeWidth={2} />
                    {t('links.createService')}
                  </DropdownMenuItem>
                  <DropdownMenuItem render={<Link to="/proposals" />}>
                    <HugeiconsIcon icon={FileSearchIcon} strokeWidth={2} />
                    {t('links.myProposals')}
                  </DropdownMenuItem>
                </>
              ) : null}
              {user.role === 'admin' ? (
                <DropdownMenuItem render={<Link to="/admin" />}>
                  <HugeiconsIcon icon={UserCircleIcon} strokeWidth={2} />
                  {t('nav.adminPanel')}
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={logout}>
                <HugeiconsIcon icon={Logout01Icon} strokeWidth={2} />
                {t('common.signOut')}
              </DropdownMenuItem>
            </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden items-center gap-1.5 sm:flex">
              <Button variant="ghost" className="rounded-full px-3.5" nativeButton={false} render={<Link to="/sign-in" />}>
                {t('common.signIn')}
              </Button>
              <Button
                className="rounded-full bg-ink px-4 text-white hover:bg-ink/90"
                nativeButton={false}
                render={<Link to="/sign-up" />}
              >
                {t('common.join')}
              </Button>
            </div>
          )}

          {/* Everything above collapses below `lg`, so the sheet is the only nav
              on phones — the previous header offered none at all there. */}
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger
              render={
                <Button variant="ghost" size="icon" className="rounded-full lg:hidden" aria-label={t('nav.openMenu')} />
              }
            >
              <HugeiconsIcon icon={Menu02Icon} strokeWidth={2} />
            </SheetTrigger>
            <SheetContent side="right" showCloseButton={false} className="w-80 max-w-[88vw] gap-0 overflow-y-auto p-0">
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <SheetTitle className="flex items-center gap-2 font-display text-base font-bold">
                  <BrandLogo className="size-6" alt="" />
                  {t('nav.brand')}
                </SheetTitle>
                <SheetClose
                  render={<Button variant="ghost" size="icon-sm" aria-label={t('nav.closeMenu')} />}
                >
                  <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
                </SheetClose>
              </div>
              <SheetDescription className="sr-only">{t('nav.menu')}</SheetDescription>

              <nav className="flex flex-col gap-1 p-3">
                {primaryLinks.map((link) => (
                  <Link
                    key={link.labelKey}
                    to={link.to}
                    onClick={closeMenu}
                    className="rounded-xl px-3 py-2.5 text-base text-foreground transition-colors hover:bg-vellum"
                  >
                    {t(link.labelKey)}
                  </Link>
                ))}
              </nav>

              {categories.length > 0 ? (
                <div className="border-t border-border p-3">
                  <p className="px-3 pb-2 text-xs font-medium text-muted-foreground">{t('nav.categories')}</p>
                  <div className="flex flex-wrap gap-1.5 px-1">
                    {categories.slice(0, 8).map((category) => (
                      <Link
                        key={category._id || category.slug || category.name}
                        to={`/jobs?category=${encodeURIComponent(category._id)}`}
                        onClick={closeMenu}
                        className="rounded-full bg-vellum px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-accent"
                      >
                        {category.name}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="border-t border-border p-3">
                <p className="px-3 pb-1 text-xs font-medium text-muted-foreground">{t('nav.forClients')}</p>
                {clientLinks.filter((link) => linkIsVisible(link, user)).map((link) => (
                  <Link
                    key={link.labelKey}
                    to={link.to}
                    onClick={closeMenu}
                    className="block rounded-xl px-3 py-2 text-sm text-foreground transition-colors hover:bg-vellum"
                  >
                    {t(link.labelKey)}
                  </Link>
                ))}
                <p className="mt-2 px-3 pb-1 text-xs font-medium text-muted-foreground">{t('nav.forFreelancers')}</p>
                {freelancerLinks.filter((link) => linkIsVisible(link, user)).map((link) => (
                  <Link
                    key={link.labelKey}
                    to={link.to}
                    onClick={closeMenu}
                    className="block rounded-xl px-3 py-2 text-sm text-foreground transition-colors hover:bg-vellum"
                  >
                    {t(link.labelKey)}
                  </Link>
                ))}
              </div>

              <div className="mt-auto flex flex-col gap-2 border-t border-border p-4">
                <LanguageSwitcher className="w-full justify-start rounded-xl sm:hidden" />
                {user ? (
                  <Button
                    variant="outline"
                    className="w-full rounded-xl"
                    nativeButton={false}
                    render={<Link to="/dashboard" onClick={closeMenu} />}
                  >
                    {t('nav.dashboard')}
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 rounded-xl"
                      nativeButton={false}
                      render={<Link to="/sign-in" onClick={closeMenu} />}
                    >
                      {t('common.signIn')}
                    </Button>
                    <Button
                      className="flex-1 rounded-xl bg-ink text-white hover:bg-ink/90"
                      nativeButton={false}
                      render={<Link to="/sign-up" onClick={closeMenu} />}
                    >
                      {t('common.join')}
                    </Button>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}

export default Navbar
