import { useState } from 'react'
import { Star, Search, Calendar } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import AdminLayout from '../../components/admin/AdminLayout'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/authStore'
import Avatar from '../../components/ui/Avatar'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import Modal from '../../components/ui/Modal'
import { formatDate } from '../../lib/utils'
import toast from 'react-hot-toast'

function useMemberOfDayHistory() {
  return useQuery({
    queryKey: ['admin-member-of-day'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('member_of_day')
        .select(`
          id, custom_note, featured_date,
          profile:profiles!member_of_day_profile_id_fkey(id,first_name,last_name,photo_url,city,status)
        `)
        .order('featured_date', { ascending: false })
        .limit(20)
      if (error) throw error
      return data
    },
  })
}

function useSetMemberOfDay() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ profile_id, custom_note, featured_date, created_by }) => {
      const { error } = await supabase.from('member_of_day').upsert(
        { profile_id, custom_note, featured_date, created_by },
        { onConflict: 'featured_date' }
      )
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-member-of-day'] })
      qc.invalidateQueries({ queryKey: ['member-of-day'] })
    },
  })
}

function useMemberSearch(search) {
  return useQuery({
    queryKey: ['member-search', search],
    queryFn: async () => {
      if (!search || search.length < 2) return []
      const { data, error } = await supabase
        .from('profiles')
        .select('id,first_name,last_name,photo_url,city,status')
        .eq('is_active', true)
        .or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%`)
        .limit(10)
      if (error) throw error
      return data
    },
    enabled: search.length >= 2,
  })
}

export default function AdminMemberOfDayPage() {
  const { data: history = [], isLoading } = useMemberOfDayHistory()
  const setMemberOfDay = useSetMemberOfDay()
  const profile = useAuthStore((s) => s.profile)

  const [modal, setModal] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedMember, setSelectedMember] = useState(null)
  const [note, setNote] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)

  const { data: searchResults = [] } = useMemberSearch(search)

  const handleSave = async () => {
    if (!selectedMember) { toast.error('Sélectionne un membre.'); return }
    setLoading(true)
    try {
      await setMemberOfDay.mutateAsync({
        profile_id: selectedMember.id,
        custom_note: note.trim(),
        featured_date: date,
        created_by: profile.id,
      })
      toast.success('Membre du jour défini.')
      setModal(false)
      setSelectedMember(null)
      setNote('')
    } catch {
      toast.error("Erreur lors de l'enregistrement.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold text-navy">Membre du Jour</h1>
        <button onClick={() => setModal(true)} className="btn-primary h-9 px-3 text-sm flex items-center gap-1.5">
          <Star size={15} /> Définir
        </button>
      </div>

      {isLoading ? (
        <LoadingSpinner className="py-16" />
      ) : history.length === 0 ? (
        <div className="py-16 text-center text-gray-400">
          <Star size={40} className="mx-auto mb-3 text-gray-200" />
          <p className="text-sm">Aucun membre du jour défini.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((item) => (
            <div key={item.id} className="card p-4">
              <div className="flex items-center gap-3">
                <Avatar profile={item.profile} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-navy">
                    {item.profile?.first_name} {item.profile?.last_name}
                  </p>
                  <p className="text-xs text-gray-500">{item.profile?.status} · {item.profile?.city}</p>
                  {item.custom_note && (
                    <p className="text-xs text-gray-400 italic mt-1">"{item.custom_note}"</p>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="flex items-center gap-1 text-orange-propulsion">
                    <Calendar size={14} />
                    <span className="text-xs font-medium">{formatDate(item.featured_date)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="Définir le membre du jour">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-navy mb-1.5">Date de mise en avant</label>
            <input
              type="date"
              className="input"
              value={date}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-navy mb-1.5">Rechercher un membre</label>
            <div className="relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="search" className="input pl-10" placeholder="Nom du membre..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>

            {searchResults.length > 0 && (
              <div className="mt-2 border border-gray-100 rounded-btn overflow-hidden">
                {searchResults.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => { setSelectedMember(m); setSearch('') }}
                    className={`flex items-center gap-2 w-full p-3 hover:bg-gray-50 text-left border-b border-gray-50 last:border-0 transition-colors ${selectedMember?.id === m.id ? 'bg-violet-light' : ''}`}
                  >
                    <Avatar profile={m} size="sm" />
                    <div>
                      <p className="text-sm font-medium text-navy">{m.first_name} {m.last_name}</p>
                      <p className="text-xs text-gray-400">{m.city}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {selectedMember && (
              <div className="mt-2 flex items-center gap-2 p-3 bg-violet-light rounded-btn">
                <Avatar profile={selectedMember} size="sm" />
                <p className="text-sm font-medium text-violet flex-1">
                  {selectedMember.first_name} {selectedMember.last_name} ✓
                </p>
                <button onClick={() => setSelectedMember(null)} className="text-xs text-gray-500">Changer</button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-navy mb-1.5">Note personnalisée (optionnelle)</label>
            <textarea
              className="input resize-none"
              rows={3}
              placeholder="Pourquoi ce membre est-il mis en avant aujourd'hui ?"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <button onClick={handleSave} className="btn-primary w-full" disabled={loading || !selectedMember}>
            {loading ? <LoadingSpinner size="sm" /> : 'Confirmer'}
          </button>
        </div>
      </Modal>
    </AdminLayout>
  )
}
