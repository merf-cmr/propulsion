import { Bell } from 'lucide-react'
import TopBar from '../components/layout/TopBar'

export default function NotificationsPage() {
  return (
    <div className="pb-24">
      <TopBar title="Notifications" />
      <div className="py-24 text-center px-4">
        <Bell size={48} className="text-gray-200 mx-auto mb-4" />
        <p className="font-semibold text-navy">Pas de notifications</p>
        <p className="text-sm text-gray-400 mt-1">Les notifications push arrivent en V2. En attendant, consulte les annonces.</p>
      </div>
    </div>
  )
}
