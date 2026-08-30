import { Link, useLocation } from 'react-router'
import { useAuth } from '../context/AuthContext'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

function Dashboard() {
  const { user } = useAuth()
  const location = useLocation()
  const firstName = user?.name?.trim().split(/\s+/)[0] || 'there'

  return (
    <main className="mx-auto min-h-[calc(100vh-3.5rem)] max-w-6xl px-4 py-10">
      {location.state?.message ? (
        <Alert className="mb-6 max-w-xl">
          <AlertDescription>{location.state.message}</AlertDescription>
        </Alert>
      ) : null}
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
            <p className="mt-1 font-medium">{user?.name}</p>
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

      <p className="mt-6 text-sm text-muted-foreground">
        {user?.role === 'client' ? (
          <>
            Ready to hire? <Link to="/jobs/new" className="font-medium text-primary underline underline-offset-4">Post a job</Link>
            {' '}or <Link to="/jobs/mine" className="font-medium text-primary underline underline-offset-4">manage your jobs</Link>.
          </>
        ) : user?.role === 'freelancer' ? (
          <>
            Looking for work? <Link to="/jobs" className="font-medium text-primary underline underline-offset-4">Browse jobs</Link>
            {' '}or <Link to="/proposals" className="font-medium text-primary underline underline-offset-4">track your proposals</Link>.
          </>
        ) : null}
      </p>
    </main>
  )
}

export default Dashboard
