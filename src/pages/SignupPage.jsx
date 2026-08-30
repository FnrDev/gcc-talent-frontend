import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { signUp } from '../services/authService'
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
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { Spinner } from '@/components/ui/spinner'

function SignupPage() {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'freelancer',
    password: '',
    passwordConfirmation: '',
  })

  const passwordsMatch =
    !formData.passwordConfirmation || formData.password === formData.passwordConfirmation
  const isFormInvalid =
    !formData.name.trim() ||
    !formData.email.trim() ||
    formData.password.length < 8 ||
    !formData.passwordConfirmation ||
    !passwordsMatch

  function handleChange(event) {
    setError('')
    setFormData((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (isFormInvalid) return

    setError('')
    setSubmitting(true)

    try {
      await signUp({
        name: formData.name.trim(),
        email: formData.email.trim(),
        role: formData.role,
        password: formData.password,
      })
      navigate('/sign-in', {
        replace: true,
        state: { message: 'Your account is ready. Sign in to get started.' },
      })
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          'We could not create your account. Please try again.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-muted/30 px-4 py-12">
      <Card className="w-full max-w-lg shadow-sm">
        <CardHeader className="gap-2 text-center">
          <BrandLogo className="mx-auto mb-1 size-10" />
          <CardTitle className="text-2xl">Join GCC Talents</CardTitle>
          <CardDescription>
            Create your account and start building trusted GCC connections.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form id="sign-up-form" onSubmit={handleSubmit} noValidate>
            <FieldGroup>
              {error ? (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : null}

              <div className="grid gap-5 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="name">Full name</FieldLabel>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    placeholder="Your name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="role">I want to</FieldLabel>
                  <NativeSelect
                    id="role"
                    name="role"
                    className="w-full"
                    value={formData.role}
                    onChange={handleChange}
                    aria-label="Account type"
                  >
                    <NativeSelectOption value="freelancer">Find freelance work</NativeSelectOption>
                    <NativeSelectOption value="client">Hire GCC talent</NativeSelectOption>
                  </NativeSelect>
                </Field>
              </div>

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
                  required
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={8}
                />
                <FieldDescription>Use 8 or more characters.</FieldDescription>
              </Field>

              <Field data-invalid={!passwordsMatch || undefined}>
                <FieldLabel htmlFor="passwordConfirmation">Confirm password</FieldLabel>
                <Input
                  id="passwordConfirmation"
                  name="passwordConfirmation"
                  type="password"
                  autoComplete="new-password"
                  value={formData.passwordConfirmation}
                  onChange={handleChange}
                  aria-invalid={!passwordsMatch}
                  required
                />
                {!passwordsMatch ? <FieldError>Passwords do not match.</FieldError> : null}
              </Field>

              <Button
                type="submit"
                size="lg"
                className="h-10 w-full"
                disabled={submitting || isFormInvalid}
              >
                {submitting ? (
                  <>
                    <Spinner />
                    Creating account…
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>
            </FieldGroup>
          </form>
          <p className="mt-5 text-center text-xs leading-6 text-muted-foreground">
            By creating an account, you agree to our{' '}
            <Link to="/terms" target="_blank" rel="noopener noreferrer" className="font-medium text-primary underline underline-offset-4">Terms of Service<span className="sr-only"> (opens in a new tab)</span></Link>
            . Learn how we handle your information in our{' '}
            <Link to="/privacy" target="_blank" rel="noopener noreferrer" className="font-medium text-primary underline underline-offset-4">Privacy Policy<span className="sr-only"> (opens in a new tab)</span></Link>.
          </p>
        </CardContent>

        <CardFooter className="justify-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link className="ml-1 font-medium text-foreground underline-offset-4 hover:underline" to="/sign-in">
            Sign in
          </Link>
        </CardFooter>
      </Card>
    </main>
  )
}

export default SignupPage
