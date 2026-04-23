import BottomNav from './BottomNav'
import InstallBanner from '../ui/InstallBanner'

export default function Layout({ children }) {
  return (
    <div className="min-h-dvh bg-surface">
      <InstallBanner />
      <main>{children}</main>
      <BottomNav />
    </div>
  )
}
