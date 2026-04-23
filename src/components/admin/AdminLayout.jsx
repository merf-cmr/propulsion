import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Users, Megaphone, Star, ArrowLeft } from 'lucide-react'
import { cn } from '../../lib/utils'

const adminTabs = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/admin/members', label: 'Membres', icon: Users },
  { to: '/admin/announcements', label: 'Annonces', icon: Megaphone },
  { to: '/admin/member-of-day', label: 'Membre du Jour', icon: Star },
]

export default function AdminLayout({ children }) {
  const navigate = useNavigate()
  return (
    <div className="min-h-dvh bg-surface">
      <header className="sticky top-0 z-40 bg-navy text-white px-4 h-14 flex items-center gap-3">
        <button onClick={() => navigate('/')} className="p-1.5 rounded-full hover:bg-white/10">
          <ArrowLeft size={20} />
        </button>
        <span className="font-bold text-sm">Administration Propulsion</span>
      </header>

      <nav className="bg-white border-b border-gray-100 overflow-x-auto">
        <div className="flex px-4 min-w-max">
          {adminTabs.map(({ to, label, icon: Icon, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 px-4 py-3.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                  isActive ? 'text-violet border-violet' : 'text-gray-400 border-transparent'
                )
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>

      <main className="p-4">{children}</main>
    </div>
  )
}
