import { NavLink } from 'react-router-dom'
import { Home, Search, Megaphone, Bell, User } from 'lucide-react'
import { cn } from '../../lib/utils'

const tabs = [
  { to: '/', label: 'Accueil', icon: Home, exact: true },
  { to: '/explorer', label: 'Explorer', icon: Search },
  { to: '/announcements', label: 'Annonces', icon: Megaphone },
  { to: '/notifications', label: 'Notifs', icon: Bell },
  { to: '/me', label: 'Profil', icon: User },
]

export default function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-white shadow-nav"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-stretch h-16">
        {tabs.map(({ to, label, icon: Icon, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            className={({ isActive }) =>
              cn(
                'flex-1 flex flex-col items-center justify-center gap-0.5 min-h-touch transition-colors',
                isActive ? 'text-violet' : 'text-gray-400'
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={22} strokeWidth={isActive ? 2.5 : 1.75} />
                <span className={cn('text-[10px] font-medium', isActive ? 'text-violet' : 'text-gray-400')}>
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
