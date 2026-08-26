import { Link } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  BookOpen01Icon,
  Briefcase01Icon,
  DashboardSquare01Icon,
  FolderLibraryIcon,
  Home01Icon,
  Logout01Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar"

const adminNavigation = [
  { id: "overview", label: "Overview", icon: DashboardSquare01Icon },
  { id: "users", label: "Users", icon: UserGroupIcon },
  { id: "categories", label: "Categories", icon: FolderLibraryIcon },
  { id: "skills", label: "Skills", icon: BookOpen01Icon },
]

function initials(name) {
  return (name || "Admin")
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
}

function AdminSidebar({ activeSection, onSectionChange, user, onLogout }) {
  const { setOpenMobile } = useSidebar()

  function handleSectionChange(section) {
    onSectionChange(section)
    setOpenMobile(false)
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              tooltip="GCC Talents Admin"
              render={<Link to="/" />}
              className="group-data-[collapsible=icon]:justify-center"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <HugeiconsIcon icon={Briefcase01Icon} strokeWidth={2} />
              </span>
              <span className="grid flex-1 text-left leading-tight">
                <span className="truncate font-semibold">GCC Talents</span>
                <span className="truncate text-xs text-muted-foreground">Administration</span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminNavigation.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    isActive={activeSection === item.id}
                    tooltip={item.label}
                    onClick={() => handleSectionChange(item.id)}
                  >
                    <HugeiconsIcon icon={item.icon} strokeWidth={2} />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Back to marketplace" render={<Link to="/" />}>
                  <HugeiconsIcon icon={Home01Icon} strokeWidth={2} />
                  <span>Back to marketplace</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter className="p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={<div />}
              className="group-data-[collapsible=icon]:justify-center"
            >
              <Avatar size="sm" className="shrink-0">
                <AvatarFallback>{initials(user?.name)}</AvatarFallback>
              </Avatar>
              <span className="grid min-w-0 flex-1 text-left leading-tight">
                <span className="truncate font-medium">{user?.name || "Administrator"}</span>
                <span className="truncate text-xs text-muted-foreground">{user?.email}</span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Sign out" onClick={onLogout}>
              <HugeiconsIcon icon={Logout01Icon} strokeWidth={2} />
              <span>Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

export default AdminSidebar
