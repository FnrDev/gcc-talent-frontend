import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { signIn } from '../services/authService'
import { useAuth } from '../context/AuthContext'
import BrandLogo from '@/components/BrandLogo'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'

function SigninPage() {
  const { setUser } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  function handleChange(event) {
    setError('')
    setFormData((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const signedInUser = await signIn(formData)
      setUser(signedInUser)
      const requestedPath = location.state?.from
      const destination = typeof requestedPath === 'string' && requestedPath.startsWith('/')
        ? requestedPath
        : '/dashboard'
      navigate(destination, { replace: true })
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          'We could not sign you in. Check your details and try again.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-muted/30 px-4 py-12">
      <Card className="w-full max-w-md shadow-sm">
        <CardHeader className="gap-2 text-center">
          <BrandLogo className="mx-auto mb-1 size-10" />
          <CardTitle className="text-2xl">Welcome back</CardTitle>
          <CardDescription>
            Sign in to manage your work on GCC Talents.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form id="sign-in-form" onSubmit={handleSubmit} noValidate>
            <FieldGroup>
              {location.state?.message ? (
                <Alert>
                  <AlertDescription>{location.state.message}</AlertDescription>
                </Alert>
              ) : null}

              {error ? (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : null}

              <Field>
                <FieldLabel htmlFor="email">Email address</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  aria-invalid={Boolean(error)}
                  required
                />
              </Field>

              <Field>
                <div className="flex items-center justify-between">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <Link
                    className="text-xs font-medium text-foreground underline-offset-4 hover:underline"
                    to="/forgot-password"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleChange}
                  aria-invalid={Boolean(error)}
                  required
                />
              </Field>

              <Button
                type="submit"
                size="lg"
                className="h-10 w-full"
                disabled={submitting || !formData.email || !formData.password}
              >
                {submitting ? (
                  <>
                    <Spinner />
                    Signing in…
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </FieldGroup>
          </form>
        </CardContent>

        <CardFooter className="justify-center text-sm text-muted-foreground">
          New to GCC Talents?{' '}
          <Link className="ml-1 font-medium text-foreground underline-offset-4 hover:underline" to="/sign-up">
            Create an account
          </Link>
        </CardFooter>
      </Card>
    </main>
  )
}

export default SigninPage
