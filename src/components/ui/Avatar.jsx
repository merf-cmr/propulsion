import { getInitials } from '../../lib/utils'
import { cn } from '../../lib/utils'

export default function Avatar({ profile, size = 'md', className }) {
  const sizes = {
    sm: 'w-10 h-10 text-sm',
    md: 'w-14 h-14 text-base',
    lg: 'w-20 h-20 text-xl',
    xl: 'w-28 h-28 text-3xl',
  }

  const initials = getInitials(profile?.first_name, profile?.last_name)

  if (profile?.photo_url) {
    return (
      <img
        src={profile.photo_url}
        alt={`${profile.first_name} ${profile.last_name}`}
        className={cn('rounded-full object-cover flex-shrink-0', sizes[size], className)}
        loading="lazy"
      />
    )
  }

  return (
    <div
      className={cn(
        'rounded-full bg-violet-light text-violet font-bold flex items-center justify-center flex-shrink-0',
        sizes[size],
        className
      )}
    >
      {initials || '?'}
    </div>
  )
}
