import { useState } from 'react'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()
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
        state: { message: t('auth.accountReady') },
      })
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          t('auth.signUpFailed'),
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
          <CardTitle className="text-2xl">{t('auth.joinTitle')}</CardTitle>
          <CardDescription>
            {t('auth.joinSubtitle')}
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
                  <FieldLabel htmlFor="name">{t('auth.fullName')}</FieldLabel>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    placeholder={t('auth.yourName')}
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="role">{t('auth.iWantTo')}</FieldLabel>
                  <NativeSelect
                    id="role"
                    name="role"
                    className="w-full"
                    value={formData.role}
                    onChange={handleChange}
                    aria-label={t('auth.accountType')}
                  >
                    <NativeSelectOption value="freelancer">{t('auth.findFreelanceWork')}</NativeSelectOption>
                    <NativeSelectOption value="client">{t('auth.hireTalent')}</NativeSelectOption>
                  </NativeSelect>
                </Field>
              </div>

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
                  required
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="password">{t('auth.password')}</FieldLabel>
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
                <FieldDescription>{t('auth.passwordHint')}</FieldDescription>
              </Field>

              <Field data-invalid={!passwordsMatch || undefined}>
                <FieldLabel htmlFor="passwordConfirmation">{t('auth.confirmPassword')}</FieldLabel>
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
                {!passwordsMatch ? <FieldError>{t('auth.passwordsDoNotMatch')}</FieldError> : null}
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
                    {t('auth.creatingAccount')}
                  </>
                ) : (
                  t('auth.createAccountButton')
                )}
              </Button>
            </FieldGroup>
          </form>
          <p className="mt-5 text-center text-xs leading-6 text-muted-foreground">
            {t('auth.termsPrefix')}{' '}
            <Link to="/terms" target="_blank" rel="noopener noreferrer" className="font-medium text-primary underline underline-offset-4">{t('auth.termsOfService')}<span className="sr-only">{t('auth.opensNewTab')}</span></Link>
            {t('auth.privacyMiddle')}{' '}
            <Link to="/privacy" target="_blank" rel="noopener noreferrer" className="font-medium text-primary underline underline-offset-4">{t('auth.privacyPolicy')}<span className="sr-only">{t('auth.opensNewTab')}</span></Link>.
          </p>
        </CardContent>

        <CardFooter className="justify-center text-sm text-muted-foreground">
          {t('auth.alreadyHaveAccount')}{' '}
          <Link className="ms-1 font-medium text-foreground underline-offset-4 hover:underline" to="/sign-in">
            {t('auth.signIn')}
          </Link>
        </CardFooter>
      </Card>
    </main>
  )
}

export default SignupPage
