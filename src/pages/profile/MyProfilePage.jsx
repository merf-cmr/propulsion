import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Edit2, Camera, LogOut, ChevronRight, Globe, ExternalLink } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { supabase } from '../../lib/supabase'
import Avatar from '../../components/ui/Avatar'
import TopBar from '../../components/layout/TopBar'
import Modal from '../../components/ui/Modal'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { SECTORS, STATUSES, COUNTRIES } from '../../lib/constants'
import { getProfileCompletion } from '../../lib/utils'
import toast from 'react-hot-toast'

export default function MyProfilePage() {
  const navigate = useNavigate()
  const { profile, refreshProfile, signOut, isAdmin } = useAuthStore()
  const [editModal, setEditModal] = useState(null)
  const [loading, setLoading] = useState(false)
  const fileRef = useRef()
  const [form, setForm] = useState({})

  const completion = getProfileCompletion(profile)

  const openEdit = (section) => {
    setForm({ ...profile })
    setEditModal(section)
  }

  const saveField = async (fields) => {
    setLoading(true)
    try {
      const { error } = await supabase.from('profiles').update(fields).eq('id', profile.id)
      if (error) throw error
      await refreshProfile()
      setEditModal(null)
      toast.success('Profil mis à jour.')
    } catch {
      toast.error("Erreur lors de l'enregistrement.")
    } finally {
      setLoading(false)
    }
  }

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setLoading(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `avatars/${profile.id}.${ext}`
      const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
      if (uploadError) throw uploadError
      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      await saveField({ photo_url: data.publicUrl })
    } catch {
      toast.error("Erreur lors de l'upload de la photo.")
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/login', { replace: true })
  }

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const toggleSector = (s) =>
    setForm((f) => ({
      ...f,
      sectors: f.sectors?.includes(s) ? f.sectors.filter((x) => x !== s) : [...(f.sectors || []), s],
    }))

  return (
    <div className="pb-24">
      <TopBar
        title="Mon Profil"
        actions={
          isAdmin() && (
            <button onClick={() => navigate('/admin')} className="text-xs text-violet font-medium px-3 py-1.5 bg-violet-light rounded-full">
              Admin
            </button>
          )
        }
      />

      {/* Avatar + completion */}
      <div className="bg-gradient-to-b from-violet to-violet-dark px-4 pt-6 pb-8 flex flex-col items-center">
        <div className="relative mb-3">
          <Avatar profile={profile} size="xl" className="ring-4 ring-white/30" />
          <button
            onClick={() => fileRef.current?.click()}
            className="absolute bottom-1 right-1 bg-white text-violet rounded-full p-2 shadow-lg"
          >
            {loading ? <LoadingSpinner size="sm" /> : <Camera size={16} />}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
        </div>
        <h1 className="text-white font-bold text-xl">{profile?.first_name} {profile?.last_name}</h1>
        <p className="text-white/70 text-sm">{profile?.status}</p>

        {/* Completion */}
        <div className="mt-4 w-full max-w-xs">
          <div className="flex justify-between text-white/80 text-xs mb-1.5">
            <span>Complétion du profil</span>
            <span>{completion}%</span>
          </div>
          <div className="bg-white/20 rounded-full h-2">
            <div
              className="bg-white rounded-full h-2 transition-all"
              style={{ width: `${completion}%` }}
            />
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Infos principales */}
        <Section title="Informations" onEdit={() => openEdit('main')}>
          <InfoRow label="Ville" value={profile?.city} />
          <InfoRow label="Pays" value={profile?.country} />
          <InfoRow label="Statut" value={profile?.status} />
          <InfoRow label="WhatsApp" value={profile?.whatsapp} />
        </Section>

        {/* Secteurs */}
        <Section title="Secteurs" onEdit={() => openEdit('sectors')}>
          <div className="flex flex-wrap gap-2 py-2">
            {profile?.sectors?.length > 0
              ? profile.sectors.map((s) => <span key={s} className="tag">{s}</span>)
              : <p className="text-sm text-gray-400">Non renseigné</p>}
          </div>
        </Section>

        {/* Bio */}
        <Section title="Bio" onEdit={() => openEdit('bio')}>
          <p className="text-sm text-gray-600 py-2">{profile?.description || 'Non renseignée'}</p>
        </Section>

        {/* Réseaux */}
        <Section title="Réseaux sociaux" onEdit={() => openEdit('socials')}>
          <div className="space-y-2 py-2">
            <SocialRow label="LinkedIn" value={profile?.linkedin_url} />
            <SocialRow label="Instagram" value={profile?.instagram_url} />
            <SocialRow label="Facebook" value={profile?.facebook_url} />
            <SocialRow label="TikTok" value={profile?.tiktok_url} />
            <SocialRow label="Medium" value={profile?.medium_url} />
            <SocialRow label="Discord" value={profile?.discord_url} />
          </div>
        </Section>

        {/* Questions Propulsion */}
        <Section title="Questions Propulsion" onEdit={() => openEdit('questions')}>
          <p className="text-sm text-gray-400 py-2">
            {profile?.propulsion_goal ? 'Questions renseignées ✓' : 'Pas encore renseignées'}
          </p>
        </Section>

        {/* Déconnexion */}
        <div className="card">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 w-full p-4 text-red-propulsion"
          >
            <LogOut size={20} />
            <span className="font-medium">Se déconnecter</span>
          </button>
        </div>
      </div>

      {/* Edit Modal - Main */}
      <Modal open={editModal === 'main'} onClose={() => setEditModal(null)} title="Modifier mes infos">
        <div className="space-y-4">
          <Field label="Prénom" value={form.first_name} onChange={(v) => set('first_name', v)} />
          <Field label="Nom" value={form.last_name} onChange={(v) => set('last_name', v)} />
          <Field label="Ville" value={form.city} onChange={(v) => set('city', v)} />
          <div>
            <label className="block text-sm font-medium text-navy mb-1.5">Pays</label>
            <select className="input" value={form.country || ''} onChange={(e) => set('country', e.target.value)}>
              <option value="">Sélectionne</option>
              {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-navy mb-1.5">Statut</label>
            <div className="grid grid-cols-2 gap-2">
              {STATUSES.map((s) => (
                <button key={s} type="button" onClick={() => set('status', s)}
                  className={`py-2.5 rounded-btn text-sm font-medium border-2 ${form.status === s ? 'bg-violet text-white border-violet' : 'bg-white text-navy border-gray-200'}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <Field label="WhatsApp" value={form.whatsapp} onChange={(v) => set('whatsapp', v)} type="tel" />
          <button onClick={() => saveField({ first_name: form.first_name, last_name: form.last_name, city: form.city, country: form.country, status: form.status, whatsapp: form.whatsapp })} className="btn-primary w-full" disabled={loading}>
            {loading ? <LoadingSpinner size="sm" /> : 'Enregistrer'}
          </button>
        </div>
      </Modal>

      {/* Edit Modal - Sectors */}
      <Modal open={editModal === 'sectors'} onClose={() => setEditModal(null)} title="Secteurs d'activité">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {SECTORS.map((s) => (
              <button key={s} type="button" onClick={() => toggleSector(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border ${form.sectors?.includes(s) ? 'bg-violet text-white border-violet' : 'bg-white text-gray-600 border-gray-200'}`}>
                {s}
              </button>
            ))}
          </div>
          <button onClick={() => saveField({ sectors: form.sectors })} className="btn-primary w-full" disabled={loading}>
            {loading ? <LoadingSpinner size="sm" /> : 'Enregistrer'}
          </button>
        </div>
      </Modal>

      {/* Edit Modal - Bio */}
      <Modal open={editModal === 'bio'} onClose={() => setEditModal(null)} title="Ma bio">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-navy mb-1.5">
              Bio courte ({(form.description || '').length}/160)
            </label>
            <textarea className="input resize-none" rows={4} maxLength={160}
              value={form.description || ''}
              onChange={(e) => set('description', e.target.value)} />
          </div>
          <button onClick={() => saveField({ description: form.description })} className="btn-primary w-full" disabled={loading}>
            {loading ? <LoadingSpinner size="sm" /> : 'Enregistrer'}
          </button>
        </div>
      </Modal>

      {/* Edit Modal - Socials */}
      <Modal open={editModal === 'socials'} onClose={() => setEditModal(null)} title="Réseaux sociaux">
        <div className="space-y-4">
          <Field label="LinkedIn" value={form.linkedin_url} onChange={(v) => set('linkedin_url', v)} placeholder="https://linkedin.com/in/..." />
          <Field label="Instagram" value={form.instagram_url} onChange={(v) => set('instagram_url', v)} placeholder="https://instagram.com/..." />
          <Field label="Facebook" value={form.facebook_url} onChange={(v) => set('facebook_url', v)} placeholder="https://facebook.com/..." />
          <Field label="TikTok" value={form.tiktok_url} onChange={(v) => set('tiktok_url', v)} placeholder="https://tiktok.com/@..." />
          <Field label="Medium" value={form.medium_url} onChange={(v) => set('medium_url', v)} placeholder="https://medium.com/@..." />
          <Field label="Discord" value={form.discord_url} onChange={(v) => set('discord_url', v)} placeholder="https://discord.gg/..." />
          <button onClick={() => saveField({ linkedin_url: form.linkedin_url, instagram_url: form.instagram_url, facebook_url: form.facebook_url, tiktok_url: form.tiktok_url, medium_url: form.medium_url, discord_url: form.discord_url })} className="btn-primary w-full" disabled={loading}>
            {loading ? <LoadingSpinner size="sm" /> : 'Enregistrer'}
          </button>
        </div>
      </Modal>

      {/* Edit Modal - Questions */}
      <Modal open={editModal === 'questions'} onClose={() => setEditModal(null)} title="Questions Propulsion" size="lg">
        <div className="space-y-4">
          {[
            { label: 'Plus grand défi rencontré', key: 'challenge' },
            { label: 'Comment tu as réagi face à ce défi ?', key: 'challenge_reaction' },
            { label: 'Première expérience pour gagner de l\'argent', key: 'first_money_exp' },
            { label: 'Leçon principale tirée de ton parcours', key: 'main_lesson' },
            { label: 'Situation actuelle', key: 'current_situation' },
            { label: 'Objectif en intégrant Propulsion', key: 'propulsion_goal' },
          ].map(({ label, key }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-navy mb-1.5">{label}</label>
              <textarea className="input resize-none" rows={3} value={form[key] || ''} onChange={(e) => set(key, e.target.value)} />
            </div>
          ))}
          <button onClick={() => saveField({ challenge: form.challenge, challenge_reaction: form.challenge_reaction, first_money_exp: form.first_money_exp, main_lesson: form.main_lesson, current_situation: form.current_situation, propulsion_goal: form.propulsion_goal, propulsion_achievement: form.propulsion_achievement })} className="btn-primary w-full" disabled={loading}>
            {loading ? <LoadingSpinner size="sm" /> : 'Enregistrer'}
          </button>
        </div>
      </Modal>
    </div>
  )
}

function Section({ title, onEdit, children }) {
  return (
    <div className="card">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <h2 className="font-semibold text-navy text-sm">{title}</h2>
        <button onClick={onEdit} className="flex items-center gap-1 text-violet text-xs font-medium min-h-touch px-2">
          <Edit2 size={14} /> Modifier
        </button>
      </div>
      <div className="px-4 pb-4">{children}</div>
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-navy">{value || '—'}</span>
    </div>
  )
}

function SocialRow({ label, value }) {
  if (!value) return (
    <div className="flex items-center gap-2 text-gray-300">
      <Globe size={16} /> <span className="text-xs">{label} — Non renseigné</span>
    </div>
  )
  return (
    <a href={value} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-navy">
      <Globe size={16} className="text-violet" />
      <span className="text-xs text-gray-500 truncate flex-1">{value.replace(/https?:\/\//,'')}</span>
      <ChevronRight size={14} className="text-gray-300" />
    </a>
  )
}

function Field({ label, value, onChange, type = 'text', placeholder }) {
  return (
    <div>
      <label className="block text-sm font-medium text-navy mb-1.5">{label}</label>
      <input type={type} className="input" value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  )
}
