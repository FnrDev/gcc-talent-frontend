import { Link } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Briefcase02Icon,
  DashboardSquare01Icon,
  JobSearchIcon,
  Logout01Icon,
  FileSearchIcon,
  UserCircleIcon,
  WorkHistoryIcon,
} from '@hugeicons/core-free-icons'
import { useAuth } from '../context/AuthContext'
import BrandLogo from '@/components/BrandLogo'
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
import { resolveCategoryIcon } from '@/components/landing/categories'
import { useCategories } from '@/context/CategoryContext'

const clientLinks = [
  { label: 'Post a Job', to: '/jobs/new', roles: ['client'], showToGuests: true },
  { label: 'My Jobs', to: '/jobs/mine', roles: ['client'] },
  { label: 'Browse Freelancers', to: '#' },
  { label: 'How it Works', to: '#' },
]

const freelancerLinks = [
  { label: 'Browse Jobs', to: '/jobs' },
  { label: 'My Proposals', to: '/proposals', roles: ['freelancer'] },
  { label: 'Become a Freelancer', to: '/sign-up', guestOnly: true },
  { label: 'How it Works', to: '#' },
]

function linkIsVisible(link, user) {
  if (link.guestOnly) return !user
  if (link.roles) return user ? link.roles.includes(user.role) : Boolean(link.showToGuests)
  return true
}

function Navbar() {
  const { logout, user } = useAuth()
  const { categories, loading: categoriesLoading, error: categoriesError, refreshCategories } = useCategories()
  const avatarFallback = user?.name
    ?.split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'GT'
  const roleLabel = user?.role === 'client'
    ? 'Client account'
    : user?.role === 'freelancer'
      ? 'Freelancer account'
      : 'Administrator'

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <div className="flex min-w-0 items-center gap-6">
          <Link to="/" className="flex shrink-0 items-center gap-2 font-semibold text-foreground">
            <BrandLogo className="size-7" alt="" />
            GCC Talents
          </Link>

          <div className="hidden md:block">
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger>Categories</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid max-h-80 w-80 grid-cols-1 gap-1 overflow-y-auto p-1 sm:w-96 sm:grid-cols-2">
                      {categoriesLoading ? (
                        <li className="col-span-full px-3 py-4 text-sm text-muted-foreground" aria-live="polite">
                          Loading categories…
                        </li>
                      ) : categoriesError ? (
                        <li className="col-span-full flex items-center justify-between gap-3 px-3 py-2">
                          <span className="text-sm text-muted-foreground">Categories unavailable</span>
                          <Button type="button" size="xs" variant="ghost" onClick={refreshCategories}>
                            Try again
                          </Button>
                        </li>
                      ) : categories.length === 0 ? (
                        <li className="col-span-full px-3 py-4 text-sm text-muted-foreground">
                          No categories available
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
                  <NavigationMenuTrigger>For Clients</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="w-56 p-1">
                      {clientLinks.filter((link) => linkIsVisible(link, user)).map((link) => (
                        <li key={link.label}>
                          <NavigationMenuLink render={<Link to={link.to} />}>
                            {link.label}
                          </NavigationMenuLink>
                        </li>
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuTrigger>For Freelancers</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="w-56 p-1">
                      {freelancerLinks.filter((link) => linkIsVisible(link, user)).map((link) => (
                        <li key={link.label}>
                          <NavigationMenuLink render={<Link to={link.to} />}>
                            {link.label}
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

        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger
              className="rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              aria-label={`Open account menu for ${user.name}`}
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
              <DropdownMenuItem render={<Link to="/dashboard" />}>
                <HugeiconsIcon icon={DashboardSquare01Icon} strokeWidth={2} />
                Dashboard
              </DropdownMenuItem>
              {user.role === 'client' ? (
                <>
                  <DropdownMenuItem render={<Link to="/jobs/new" />}>
                    <HugeiconsIcon icon={Briefcase02Icon} strokeWidth={2} />
                    Post a Job
                  </DropdownMenuItem>
                  <DropdownMenuItem render={<Link to="/jobs/mine" />}>
                    <HugeiconsIcon icon={WorkHistoryIcon} strokeWidth={2} />
                    My Jobs
                  </DropdownMenuItem>
                </>
              ) : null}
              {user.role === 'freelancer' ? (
                <>
                  <DropdownMenuItem render={<Link to="/jobs" />}>
                    <HugeiconsIcon icon={JobSearchIcon} strokeWidth={2} />
                    Browse Jobs
                  </DropdownMenuItem>
                  <DropdownMenuItem render={<Link to="/proposals" />}>
                    <HugeiconsIcon icon={FileSearchIcon} strokeWidth={2} />
                    My Proposals
                  </DropdownMenuItem>
                </>
              ) : null}
              {user.role === 'admin' ? (
                <DropdownMenuItem render={<Link to="/admin" />}>
                  <HugeiconsIcon icon={UserCircleIcon} strokeWidth={2} />
                  Admin Panel
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={logout}>
                <HugeiconsIcon icon={Logout01Icon} strokeWidth={2} />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="flex items-center gap-2">
            <Button variant="ghost" nativeButton={false} render={<Link to="/sign-in" />}>
              Sign In
            </Button>
            <Button nativeButton={false} render={<Link to="/sign-up" />}>
              Join
            </Button>
          </div>
        )}
      </nav>
    </header>
  )
}

export default Navbar
