import { useAuth } from '../context/AuthContext'
import UserLink from '@/components/UserLink'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

function Dashboard() {
  const { user } = useAuth()
  const firstName = user?.name?.trim().split(/\s+/)[0] || 'there'

  return (
    <main className="mx-auto min-h-[calc(100vh-3.5rem)] max-w-6xl px-4 py-10">
      <div className="mb-8">
        <p className="text-sm font-medium text-primary">Dashboard</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Welcome back, {firstName}</h1>
        <p className="mt-2 text-muted-foreground">
          Here is your GCC Talents account overview.
        </p>
      </div>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Account details</CardTitle>
          <CardDescription>Your active profile information.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Name</p>
            <UserLink user={user} className="mt-1" nameClassName="font-medium" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Email</p>
            <p className="mt-1 font-medium">{user?.email}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Role</p>
            <Badge className="mt-1 capitalize" variant="secondary">
              {user?.role}
            </Badge>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Status</p>
            <Badge className="mt-1 capitalize" variant="outline">
              {user?.status || 'active'}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}

export default Dashboard
