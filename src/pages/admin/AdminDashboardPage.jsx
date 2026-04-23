import { useQuery } from '@tanstack/react-query'
import { Users, UserCheck, UserX, TrendingUp, Globe, Briefcase } from 'lucide-react'
import AdminLayout from '../../components/admin/AdminLayout'
import { supabase } from '../../lib/supabase'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { formatDate } from '../../lib/utils'

function useAdminStats() {
  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [
        { count: total },
        { count: active },
        { count: inactive },
        { data: recentMembers },
        { data: sectorData },
        { data: countryData },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_active', false),
        supabase.from('profiles').select('first_name,last_name,email,created_at,is_active').order('created_at', { ascending: false }).limit(5),
        supabase.from('profiles').select('sectors').eq('is_active', true),
        supabase.from('profiles').select('country').eq('is_active', true).not('country', 'is', null),
      ])

      // Sector frequency
      const sectorCount = {}
      sectorData?.forEach((r) => r.sectors?.forEach((s) => { sectorCount[s] = (sectorCount[s] || 0) + 1 }))
      const topSectors = Object.entries(sectorCount).sort((a, b) => b[1] - a[1]).slice(0, 5)

      // Country frequency
      const countryCount = {}
      countryData?.forEach((r) => { if (r.country) countryCount[r.country] = (countryCount[r.country] || 0) + 1 })
      const topCountries = Object.entries(countryCount).sort((a, b) => b[1] - a[1]).slice(0, 5)

      return { total, active, inactive, recentMembers, topSectors, topCountries }
    },
  })
}

export default function AdminDashboardPage() {
  const { data: stats, isLoading } = useAdminStats()

  return (
    <AdminLayout>
      <h1 className="text-lg font-bold text-navy mb-4">Tableau de bord</h1>

      {isLoading ? (
        <LoadingSpinner className="py-16" />
      ) : (
        <div className="space-y-6">
          {/* Stats cards */}
          <div className="grid grid-cols-3 gap-3">
            <StatCard icon={Users} value={stats?.total} label="Total" color="navy" />
            <StatCard icon={UserCheck} value={stats?.active} label="Actifs" color="green" />
            <StatCard icon={UserX} value={stats?.inactive} label="Inactifs" color="red" />
          </div>

          {/* Recent members */}
          <div className="card p-4">
            <h2 className="font-semibold text-navy mb-3 flex items-center gap-2">
              <TrendingUp size={16} className="text-violet" /> Derniers inscrits
            </h2>
            <div className="space-y-2">
              {stats?.recentMembers?.map((m) => (
                <div key={m.email} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-navy">{m.first_name} {m.last_name}</p>
                    <p className="text-xs text-gray-400">{m.email}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${m.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-propulsion'}`}>
                      {m.is_active ? 'Actif' : 'Inactif'}
                    </span>
                    <p className="text-xs text-gray-400 mt-0.5">{formatDate(m.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top sectors */}
          {stats?.topSectors?.length > 0 && (
            <div className="card p-4">
              <h2 className="font-semibold text-navy mb-3 flex items-center gap-2">
                <Briefcase size={16} className="text-violet" /> Top secteurs
              </h2>
              <div className="space-y-2">
                {stats.topSectors.map(([sector, count]) => (
                  <div key={sector} className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 flex-1 truncate">{sector}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-100 rounded-full h-2">
                        <div
                          className="bg-violet rounded-full h-2"
                          style={{ width: `${(count / stats.topSectors[0][1]) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-navy w-6 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top countries */}
          {stats?.topCountries?.length > 0 && (
            <div className="card p-4">
              <h2 className="font-semibold text-navy mb-3 flex items-center gap-2">
                <Globe size={16} className="text-violet" /> Top pays
              </h2>
              <div className="space-y-2">
                {stats.topCountries.map(([country, count]) => (
                  <div key={country} className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 flex-1">{country}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-100 rounded-full h-2">
                        <div
                          className="bg-blue-propulsion rounded-full h-2"
                          style={{ width: `${(count / stats.topCountries[0][1]) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-navy w-6 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  )
}

function StatCard({ icon: Icon, value, label, color }) {
  const colors = {
    navy: 'bg-navy text-white',
    green: 'bg-green-500 text-white',
    red: 'bg-red-propulsion text-white',
  }
  return (
    <div className={`rounded-card p-3 flex flex-col items-center gap-1 ${colors[color]}`}>
      <Icon size={18} />
      <p className="text-xl font-bold">{value ?? '—'}</p>
      <p className="text-xs font-medium opacity-80">{label}</p>
    </div>
  )
}
