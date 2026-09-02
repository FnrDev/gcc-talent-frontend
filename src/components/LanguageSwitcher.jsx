import { useTranslation } from 'react-i18next'
import { HugeiconsIcon } from '@hugeicons/react'
import { Globe02Icon } from '@hugeicons/core-free-icons'

import { Button } from '@/components/ui/button'
import { LANGUAGES, setLanguage } from '@/i18n'

/**
 * Toggles between the two supported languages.
 *
 * With exactly two options a dropdown costs an extra click for no gain, so the
 * button names the language you would switch *to* — the label is the action.
 * That label is always in the other language, so it carries its own `lang` for
 * correct shaping and font fallback.
 */
function LanguageSwitcher({ className }) {
  const { i18n, t } = useTranslation()

  const current = i18n.language in LANGUAGES ? i18n.language : 'en'
  const next = current === 'ar' ? 'en' : 'ar'
  const nextLabel = LANGUAGES[next].label

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={className}
      onClick={() => setLanguage(next)}
      aria-label={t('language.switchTo', { language: nextLabel })}
    >
      <HugeiconsIcon icon={Globe02Icon} strokeWidth={2} />
      <span lang={next}>{nextLabel}</span>
    </Button>
  )
}

export default LanguageSwitcher
