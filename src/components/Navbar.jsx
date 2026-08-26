import { Link } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { Briefcase01Icon } from '@hugeicons/core-free-icons'
import { useAuth } from '../context/AuthContext'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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
import { categories } from '@/components/landing/categories'

const clientLinks = [
  { label: 'Post a Job', to: '#' },
  { label: 'Browse Freelancers', to: '#' },
  { label: 'How it Works', to: '#' },
]

const freelancerLinks = [
  { label: 'Browse Jobs', to: '#' },
  { label: 'Become a Freelancer', to: '/sign-up' },
  { label: 'How it Works', to: '#' },
]

function Navbar() {
  const { logout, user } = useAuth()
  const avatarFallback = user?.name
    ?.split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'GT'

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2 font-semibold text-foreground">
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <HugeiconsIcon icon={Briefcase01Icon} strokeWidth={2} className="size-4" />
            </span>
            GCC Talents
          </Link>

          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger>Categories</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-72 grid-cols-2 gap-1 p-1">
                    {categories.map((category) => (
                      <li key={category.name}>
                        <NavigationMenuLink render={<Link to="/#services" />}>
                          <HugeiconsIcon icon={category.icon} strokeWidth={2} />
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
                    {clientLinks.map((link) => (
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
                    {freelancerLinks.map((link) => (
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

        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger
              className="rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              aria-label={`Open account menu for ${user.name}`}
            >
              <Avatar size="sm">
                <AvatarFallback>{avatarFallback}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem render={<Link to="/dashboard" />}>Dashboard</DropdownMenuItem>
              {user.role === 'admin' ? (
                <DropdownMenuItem render={<Link to="/admin" />}>Admin Panel</DropdownMenuItem>
              ) : null}
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={logout}>
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
