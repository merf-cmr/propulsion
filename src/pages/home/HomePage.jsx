import { useNavigate } from 'react-router-dom'
import { Users, Globe, Briefcase, ChevronRight, Star } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { useNewMembers, useMembersInCity, useCommunityStats, useMemberOfDay } from '../../hooks/useMembers'
import { useLatestAnnouncement } from '../../hooks/useAnnouncements'
import MemberCard from '../../components/ui/MemberCard'
import Avatar from '../../components/ui/Avatar'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { formatDate } from '../../lib/utils'

export default function HomePage() {
  const navigate = useNavigate()
  const profile = useAuthStore((s) => s.profile)

  const { data: latestAnnouncement } = useLatestAnnouncement()
  const { data: memberOfDay } = useMemberOfDay()
  const { data: newMembers = [], isLoading: loadingNew } = useNewMembers(8)
  const { data: cityMembers = [], isLoading: loadingCity } = useMembersInCity(profile?.city, 8)
  const { data: stats } = useCommunityStats()

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="bg-violet px-4 pt-12 pb-6">
        <p className="text-white/70 text-sm">Bienvenue,</p>
        <h1 className="text-white text-xl font-bold">{profile?.first_name} {profile?.last_name} 👋</h1>
      </div>

      <div className="px-4 -mt-3 space-y-4">
        {/* Annonce épinglée */}
        {latestAnnouncement && (
          <div
            className="card p-4 border-l-4 border-violet cursor-pointer active:scale-[0.99] transition-transform"
            onClick={() => navigate(`/announcements/${latestAnnouncement.id}`)}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-violet uppercase tracking-wide mb-1">Annonce</p>
                <p className="font-bold text-navy text-sm line-clamp-2">{latestAnnouncement.title}</p>
                <p className="text-xs text-gray-400 mt-1">{formatDate(latestAnnouncement.published_at)}</p>
              </div>
              <ChevronRight size={18} className="text-gray-400 flex-shrink-0 mt-1" />
            </div>
          </div>
        )}

        {/* Membre du Jour */}
        {memberOfDay?.profile && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Star size={16} className="text-orange-propulsion fill-orange-propulsion" />
              <h2 className="font-bold text-navy text-sm">Membre du Jour</h2>
            </div>
            <div
              className="card p-4 bg-gradient-to-br from-violet to-violet-dark text-white cursor-pointer active:scale-[0.99] transition-transform"
              onClick={() => navigate(`/profile/${memberOfDay.profile.id}`)}
            >
              <div className="flex items-center gap-4">
                <Avatar profile={memberOfDay.profile} size="lg" className="ring-4 ring-white/30" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-lg leading-tight">
                    {memberOfDay.profile.first_name} {memberOfDay.profile.last_name}
                  </p>
                  <p className="text-white/80 text-sm">{memberOfDay.profile.status}</p>
                  <p className="text-white/70 text-xs mt-0.5">{memberOfDay.profile.city}</p>
                </div>
              </div>
              {memberOfDay.custom_note && (
                <p className="text-white/85 text-sm mt-3 italic border-t border-white/20 pt-3">
                  "{memberOfDay.custom_note}"
                </p>
              )}
            </div>
          </div>
        )}

        {/* Nouveaux membres */}
        <Section
          title="Nouveaux membres"
          onSeeAll={() => navigate('/explorer')}
          loading={loadingNew}
          empty={newMembers.length === 0}
        >
          <HorizontalScroll>
            {newMembers.map((m) => (
              <MemberCard key={m.id} member={m} compact className="w-72 flex-shrink-0" />
            ))}
          </HorizontalScroll>
        </Section>

        {/* Membres dans ta ville */}
        {profile?.city && (
          <Section
            title={`À ${profile.city}`}
            onSeeAll={() => navigate(`/explorer?city=${encodeURIComponent(profile.city)}`)}
            loading={loadingCity}
            empty={cityMembers.length === 0}
            emptyText="Pas encore de membres enregistrés dans ta ville."
          >
            <HorizontalScroll>
              {cityMembers.map((m) => (
                <MemberCard key={m.id} member={m} compact className="w-72 flex-shrink-0" />
              ))}
            </HorizontalScroll>
          </Section>
        )}

        {/* Stats communauté */}
        {stats && (
          <div>
            <h2 className="font-bold text-navy text-sm mb-3">La communauté en chiffres</h2>
            <div className="grid grid-cols-3 gap-3">
              <StatCard icon={Users} value={stats.totalMembers} label="Membres" color="violet" />
              <StatCard icon={Globe} value={stats.countries} label="Pays" color="blue" />
              <StatCard icon={Briefcase} value={stats.sectors} label="Secteurs" color="orange" />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Section({ title, onSeeAll, loading, empty, emptyText = 'Aucun membre pour le moment.', children }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-navy text-sm">{title}</h2>
        <button onClick={onSeeAll} className="text-xs text-violet font-medium flex items-center gap-0.5">
          Voir tout <ChevronRight size={14} />
        </button>
      </div>
      {loading ? (
        <LoadingSpinner className="py-6" />
      ) : empty ? (
        <p className="text-sm text-gray-400 py-4 text-center">{emptyText}</p>
      ) : children}
    </div>
  )
}

function HorizontalScroll({ children }) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory">
      {children}
    </div>
  )
}

function StatCard({ icon: Icon, value, label, color }) {
  const colors = {
    violet: 'bg-violet-light text-violet',
    blue: 'bg-blue-50 text-blue-propulsion',
    orange: 'bg-orange-50 text-orange-propulsion',
  }
  return (
    <div className={`card p-3 flex flex-col items-center gap-1 ${colors[color]}`}>
      <Icon size={20} />
      <p className="text-xl font-bold">{value}</p>
      <p className="text-xs font-medium opacity-80">{label}</p>
    </div>
  )
}
