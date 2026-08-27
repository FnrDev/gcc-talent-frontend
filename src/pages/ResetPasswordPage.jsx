import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { resetPassword } from '../services/authService'
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
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'

function ResetPasswordPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [token, setToken] = useState(() => {
    const tokens = new URLSearchParams(location.search).getAll('token')
    return tokens.length === 1 ? tokens[0] : ''
  })
  const [newPassword, setNewPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [error, setError] = useState('')
  const [resetComplete, setResetComplete] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const requestPending = useRef(false)

  const hasValidToken = /^[a-f0-9]{64}$/.test(token)
  const passwordTooLong = new TextEncoder().encode(newPassword).length > 72
  const passwordsMatch = !passwordConfirmation || newPassword === passwordConfirmation
  const isFormInvalid =
    newPassword.length < 8 || passwordTooLong || !passwordConfirmation || !passwordsMatch

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search)
    if (!searchParams.has('token')) return

    // Keep the secret only in component memory, never in history state or storage.
    searchParams.delete('token')
    const search = searchParams.toString()
    navigate({ pathname: location.pathname, search: search ? `?${search}` : '' }, { replace: true })
  }, [location.pathname, location.search, navigate])

  async function handleSubmit(event) {
    event.preventDefault()

    if (requestPending.current || !hasValidToken || isFormInvalid) return

    setError('')
    requestPending.current = true
    setSubmitting(true)

    try {
      await resetPassword(token, newPassword)
      logout()
      setNewPassword('')
      setPasswordConfirmation('')
      setToken('')
      setResetComplete(true)
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          'We could not reset your password. Check your connection and try again.',
      )
      if (requestError?.response?.data?.code === 'INVALID_RESET_TOKEN') {
        setToken('')
        setNewPassword('')
        setPasswordConfirmation('')
      }
    } finally {
      requestPending.current = false
      setSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-muted/30 px-4 py-12">
      <Card className="w-full max-w-md shadow-sm">
        <CardHeader className="gap-2 text-center">
          <BrandLogo className="mx-auto mb-1 size-10" />
          <CardTitle className="text-2xl">
            {resetComplete ? 'Password reset' : hasValidToken ? 'Choose a new password' : 'Request a new reset link'}
          </CardTitle>
          <CardDescription>
            {resetComplete
              ? 'Your new password is ready. Sign in to continue to GCC Talents.'
              : hasValidToken
                ? 'Use a strong password that you do not use for another account.'
                : 'Open the link in your reset email, or request a new one below.'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {resetComplete ? (
            <div className="space-y-5">
              <Alert role="status">
                <AlertDescription>
                  Password reset successfully. Please sign in with your new password.
                </AlertDescription>
              </Alert>
              <Button className="h-10 w-full" nativeButton={false} render={<Link to="/sign-in" />}>
                Sign in
              </Button>
            </div>
          ) : !hasValidToken ? (
            <div className="space-y-5">
              <Alert variant="destructive">
                <AlertDescription>
                  {error || 'This reset link is missing or invalid. Request a new email to continue.'}
                </AlertDescription>
              </Alert>
              <Button className="h-10 w-full" nativeButton={false} render={<Link to="/forgot-password" />}>
                Request a new reset link
              </Button>
            </div>
          ) : (
            <form id="reset-password-form" onSubmit={handleSubmit} noValidate aria-busy={submitting}>
              <FieldGroup>
                {error ? (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                ) : null}

                <Field data-invalid={passwordTooLong || undefined}>
                  <FieldLabel htmlFor="new-password">New password</FieldLabel>
                  <Input
                    id="new-password"
                    name="newPassword"
                    type="password"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(event) => {
                      setNewPassword(event.target.value)
                      setError('')
                    }}
                    disabled={submitting}
                    aria-invalid={passwordTooLong}
                    aria-describedby={passwordTooLong ? 'new-password-error' : 'new-password-hint'}
                    minLength={8}
                    required
                  />
                  <FieldDescription id="new-password-hint">Use 8 or more characters.</FieldDescription>
                  {passwordTooLong ? (
                    <FieldError id="new-password-error">
                      This password is too long. Use at most 72 bytes; emoji and some letters use more than one byte.
                    </FieldError>
                  ) : null}
                </Field>

                <Field data-invalid={!passwordsMatch || undefined}>
                  <FieldLabel htmlFor="confirm-password">Confirm new password</FieldLabel>
                  <Input
                    id="confirm-password"
                    name="passwordConfirmation"
                    type="password"
                    autoComplete="new-password"
                    value={passwordConfirmation}
                    onChange={(event) => {
                      setPasswordConfirmation(event.target.value)
                      setError('')
                    }}
                    disabled={submitting}
                    aria-invalid={!passwordsMatch}
                    aria-describedby={!passwordsMatch ? 'confirm-password-error' : undefined}
                    required
                  />
                  {!passwordsMatch ? (
                    <FieldError id="confirm-password-error">Passwords do not match.</FieldError>
                  ) : null}
                </Field>

                <Button
                  type="submit"
                  size="lg"
                  className="h-10 w-full"
                  disabled={submitting || isFormInvalid}
                >
                  {submitting ? <><Spinner /> Resetting password…</> : 'Reset password'}
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  Link expired?{' '}
                  <Link className="font-medium text-foreground underline-offset-4 hover:underline" to="/forgot-password">
                    Request a new one
                  </Link>
                </p>
              </FieldGroup>
            </form>
          )}
        </CardContent>

        {!resetComplete ? (
          <CardFooter className="justify-center text-sm">
            <Link className="font-medium text-foreground underline-offset-4 hover:underline" to="/sign-in">
              Back to sign in
            </Link>
          </CardFooter>
        ) : null}
      </Card>
    </main>
  )
}

export default ResetPasswordPage
