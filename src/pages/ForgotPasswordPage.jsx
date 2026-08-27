import { useRef, useState } from 'react'
import { Link } from 'react-router'
import { requestPasswordReset } from '../services/authService'
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
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'

function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const requestPending = useRef(false)

  async function handleSubmit(event) {
    event.preventDefault()

    if (requestPending.current) return

    const normalizedEmail = email.trim()

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setEmailError('Enter a valid email address.')
      return
    }

    setEmailError('')
    setError('')
    requestPending.current = true
    setSubmitting(true)

    try {
      await requestPasswordReset(normalizedEmail)
      setSent(true)
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          'We could not request a reset link. Check your connection and try again.',
      )
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
          <CardTitle className="text-2xl">{sent ? 'Check your email' : 'Forgot your password?'}</CardTitle>
          <CardDescription>
            {sent
              ? 'Follow the link in your email to choose a new password.'
              : 'Enter your account email and we will send you a password reset link.'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {sent ? (
            <div className="space-y-5">
              <Alert role="status">
                <AlertDescription>
                  If an account with that email exists, you will receive a password reset link shortly.
                </AlertDescription>
              </Alert>
              <p className="text-sm text-muted-foreground">
                Reset links expire after 30 minutes. If you do not see the email, check your
                spam folder or wait a minute before requesting another link.
              </p>
              <Button
                className="h-10 w-full"
                variant="outline"
                onClick={() => setSent(false)}
              >
                Request another link
              </Button>
            </div>
          ) : (
            <form id="forgot-password-form" onSubmit={handleSubmit} noValidate aria-busy={submitting}>
              <FieldGroup>
                {error ? (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                ) : null}

                <Field data-invalid={Boolean(emailError) || undefined}>
                  <FieldLabel htmlFor="reset-email">Email address</FieldLabel>
                  <Input
                    id="reset-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value)
                      setEmailError('')
                      setError('')
                    }}
                    disabled={submitting}
                    aria-invalid={Boolean(emailError)}
                    aria-describedby={emailError ? 'reset-email-error' : undefined}
                    required
                  />
                  {emailError ? <FieldError id="reset-email-error">{emailError}</FieldError> : null}
                </Field>

                <Button
                  type="submit"
                  size="lg"
                  className="h-10 w-full"
                  disabled={submitting || !email.trim()}
                >
                  {submitting ? <><Spinner /> Sending reset link…</> : 'Send reset link'}
                </Button>
              </FieldGroup>
            </form>
          )}
        </CardContent>

        <CardFooter className="justify-center text-sm">
          <Link className="font-medium text-foreground underline-offset-4 hover:underline" to="/sign-in">
            Back to sign in
          </Link>
        </CardFooter>
      </Card>
    </main>
  )
}

export default ForgotPasswordPage
