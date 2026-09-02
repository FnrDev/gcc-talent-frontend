import { useCallback, useEffect, useState } from "react"
import { Link, useSearchParams } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Alert02Icon,
  ArrowRight01Icon,
  DashboardSquare01Icon,
} from "@hugeicons/core-free-icons"

import AdminSidebar from "@/components/admin/AdminSidebar"
import AuditLogsSection from "@/components/admin/AuditLogsSection"
import JobsSection from "@/components/admin/JobsSection"
import OverviewSection from "@/components/admin/OverviewSection"
import ServicesSection from "@/components/admin/ServicesSection"
import TaxonomySection from "@/components/admin/TaxonomySection"
import UsersSection from "@/components/admin/UsersSection"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { useAuth } from "@/context/AuthContext"

const validSections = new Set(["overview", "users", "jobs", "services", "categories", "skills", "audit-logs"])

const sectionLabels = {
  overview: "Overview",
  users: "Users",
  jobs: "Jobs",
  services: "Services",
  categories: "Categories",
  skills: "Skills",
  "audit-logs": "Audit logs",
}

function AdminPage() {
  const { user, logout } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [accessDenied, setAccessDenied] = useState(false)
  const [notice, setNotice] = useState("")
  const requestedSection = searchParams.get("section")
  const activeSection = validSections.has(requestedSection) ? requestedSection : "overview"

  const handleSectionChange = useCallback((section) => {
    setAccessDenied(false)
    setSearchParams(section === "overview" ? {} : { section })
  }, [setSearchParams])

  const handleAccessDenied = useCallback(() => {
    setAccessDenied(true)
  }, [])

  const showNotice = useCallback((message) => {
    setNotice(message)
  }, [])

  useEffect(() => {
    if (!notice) return undefined
    const timeout = window.setTimeout(() => setNotice(""), 4000)
    return () => window.clearTimeout(timeout)
  }, [notice])

  let content
  if (accessDenied) {
    content = (
      <div className="flex min-h-[70vh] items-center justify-center p-6">
        <Card className="w-full max-w-lg text-center">
          <CardHeader className="items-center">
            <span className="mb-2 flex size-11 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              <HugeiconsIcon icon={Alert02Icon} strokeWidth={2} className="size-5" />
            </span>
            <CardTitle>Admin access is no longer available</CardTitle>
            <CardDescription>
              The server rejected this account&apos;s admin access. Your role or account status may have changed.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col justify-center gap-2 sm:flex-row">
            <Button nativeButton={false} render={<Link to="/dashboard" />}>
              Back to dashboard
              <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
            </Button>
            <Button variant="outline" onClick={logout}>Sign out</Button>
          </CardContent>
        </Card>
      </div>
    )
  } else if (activeSection === "overview") {
    content = <OverviewSection onAccessDenied={handleAccessDenied} />
  } else if (activeSection === "users") {
    content = (
      <UsersSection
        currentAdminId={user?._id}
        onAccessDenied={handleAccessDenied}
        onNotice={showNotice}
      />
    )
  } else if (activeSection === "jobs") {
    content = (
      <JobsSection
        onAccessDenied={handleAccessDenied}
        onNotice={showNotice}
      />
    )
  } else if (activeSection === "services") {
    content = (
      <ServicesSection
        onAccessDenied={handleAccessDenied}
        onNotice={showNotice}
      />
    )
  } else if (activeSection === "audit-logs") {
    content = <AuditLogsSection onAccessDenied={handleAccessDenied} />
  } else {
    content = (
      <TaxonomySection
        key={activeSection}
        mode={activeSection}
        onAccessDenied={handleAccessDenied}
        onNotice={showNotice}
      />
    )
  }

  return (
    <TooltipProvider>
      <SidebarProvider>
        <AdminSidebar
          activeSection={activeSection}
          onSectionChange={handleSectionChange}
          user={user}
          onLogout={logout}
        />
        <SidebarInset className="min-w-0 bg-muted/20">
          <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur sm:px-6">
            <SidebarTrigger className="-ml-1" />
            <span className="h-4 w-px bg-border" aria-hidden="true" />
            <div className="flex min-w-0 items-center gap-2">
              <HugeiconsIcon icon={DashboardSquare01Icon} strokeWidth={2} className="hidden size-4 text-muted-foreground sm:block" />
              <span className="truncate text-sm font-medium">Admin / {sectionLabels[activeSection]}</span>
            </div>
            <Badge variant="outline" className="ml-auto hidden sm:inline-flex">
              <span className="size-1.5 rounded-full bg-chart-4" />
              Live data
            </Badge>
          </header>

          {notice && (
            <div
              role="status"
              className="fixed top-16 right-4 z-40 max-w-sm rounded-lg border bg-background px-4 py-3 text-sm shadow-lg"
            >
              {notice}
            </div>
          )}

          <div className="mx-auto w-full max-w-[90rem] p-4 sm:p-6 lg:p-8">
            {content}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}

export default AdminPage
