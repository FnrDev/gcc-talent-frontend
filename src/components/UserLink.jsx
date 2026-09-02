import i18n from '@/i18n'
import { Link } from 'react-router'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { initials } from '@/lib/format'
import { cn } from '@/lib/utils'

/**
 * The single way a person's name is rendered anywhere in the app: as a link to
 * their public profile. Having one component means a name is never accidentally
 * left unclickable, and the profile URL is defined in exactly one place.
 *
 * Falls back to plain text when there is no id to link to (an unpopulated
 * reference, or a deleted account), so callers never have to guard.
 *
 * @param raised  set inside a card whose whole surface is a stretched link —
 *                lifts this above that overlay so the name stays clickable.
 */
function UserLink({
  user,
  showAvatar = false,
  avatarSize = 'sm',
  raised = false,
  className,
  nameClassName,
}) {
  const id = user?._id ?? user?.id
  const name = user?.companyName || user?.name || i18n.t('reviews.unknownUser')

  const content = (
    <>
      {showAvatar && (
        <Avatar size={avatarSize}>
          {user?.avatarUrl && <AvatarImage src={user.avatarUrl} alt="" />}
          <AvatarFallback>{initials(name)}</AvatarFallback>
        </Avatar>
      )}
      <span className={cn('truncate', nameClassName)}>{name}</span>
    </>
  )

  const layout = cn('flex min-w-0 items-center gap-2', raised && 'relative z-10', className)

  if (!id) {
    return <span className={layout}>{content}</span>
  }

  return (
    <Link to={`/profile/${id}`} className={cn(layout, 'hover:text-primary [&_span]:hover:underline')}>
      {content}
    </Link>
  )
}

export default UserLink
