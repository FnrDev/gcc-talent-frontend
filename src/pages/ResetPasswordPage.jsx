import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()
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
          t('auth.resetFailed'),
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
            {resetComplete ? t('auth.passwordResetTitle') : hasValidToken ? t('auth.chooseNewPassword') : t('auth.requestNewLinkTitle')}
          </CardTitle>
          <CardDescription>
            {resetComplete
              ? t('auth.resetDoneSubtitle')
              : hasValidToken
                ? t('auth.chooseNewSubtitle')
                : t('auth.requestNewSubtitle')}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {resetComplete ? (
            <div className="space-y-5">
              <Alert role="status">
                <AlertDescription>
                  {t('auth.resetSuccess')}
                </AlertDescription>
              </Alert>
              <Button className="h-10 w-full" nativeButton={false} render={<Link to="/sign-in" />}>
                {t('auth.signIn')}
              </Button>
            </div>
          ) : !hasValidToken ? (
            <div className="space-y-5">
              <Alert variant="destructive">
                <AlertDescription>
                  {error || t('auth.invalidResetLink')}
                </AlertDescription>
              </Alert>
              <Button className="h-10 w-full" nativeButton={false} render={<Link to="/forgot-password" />}>
                {t('auth.requestNewResetLink')}
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
                  <FieldLabel htmlFor="new-password">{t('auth.newPassword')}</FieldLabel>
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
                  <FieldDescription id="new-password-hint">{t('auth.passwordHint')}</FieldDescription>
                  {passwordTooLong ? (
                    <FieldError id="new-password-error">
                      This password is too long. Use at most 72 bytes; emoji and some letters use more than one byte.
                    </FieldError>
                  ) : null}
                </Field>

                <Field data-invalid={!passwordsMatch || undefined}>
                  <FieldLabel htmlFor="confirm-password">{t('auth.confirmNewPassword')}</FieldLabel>
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
                    <FieldError id="confirm-password-error">{t('auth.passwordsDoNotMatch')}</FieldError>
                  ) : null}
                </Field>

                <Button
                  type="submit"
                  size="lg"
                  className="h-10 w-full"
                  disabled={submitting || isFormInvalid}
                >
                  {submitting ? <><Spinner /> {t('auth.resettingPassword')}</> : t('auth.resetPasswordButton')}
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  {t('auth.linkExpired')}{' '}
                  <Link className="font-medium text-foreground underline-offset-4 hover:underline" to="/forgot-password">
                    {t('auth.requestNewOne')}
                  </Link>
                </p>
              </FieldGroup>
            </form>
          )}
        </CardContent>

        {!resetComplete ? (
          <CardFooter className="justify-center text-sm">
            <Link className="font-medium text-foreground underline-offset-4 hover:underline" to="/sign-in">
              {t('auth.backToSignIn')}
            </Link>
          </CardFooter>
        ) : null}
      </Card>
    </main>
  )
}

export default ResetPasswordPage
