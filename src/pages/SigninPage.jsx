import { useState } from 'react'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()
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
          t('auth.signInFailed'),
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
          <CardTitle className="text-2xl">{t('auth.welcomeBack')}</CardTitle>
          <CardDescription>
            {t('auth.signInSubtitle')}
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
                <FieldLabel htmlFor="email">{t('auth.emailAddress')}</FieldLabel>
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
                  <FieldLabel htmlFor="password">{t('auth.password')}</FieldLabel>
                  <Link
                    className="text-xs font-medium text-foreground underline-offset-4 hover:underline"
                    to="/forgot-password"
                  >
                    {t('auth.forgotPassword')}
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
                    {t('auth.signingIn')}
                  </>
                ) : (
                  t('common.signIn')
                )}
              </Button>
            </FieldGroup>
          </form>
        </CardContent>

        <CardFooter className="justify-center text-sm text-muted-foreground">
          {t('auth.newToPlatform')}{' '}
          <Link className="ms-1 font-medium text-foreground underline-offset-4 hover:underline" to="/sign-up">
            {t('auth.createAccount')}
          </Link>
        </CardFooter>
      </Card>
    </main>
  )
}

export default SigninPage
