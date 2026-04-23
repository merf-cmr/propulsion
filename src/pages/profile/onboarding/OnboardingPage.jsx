import { useState, useRef } from 'react'
import { Camera, ChevronRight, ChevronLeft, SkipForward } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../../lib/supabase'
import { useAuthStore } from '../../../stores/authStore'
import { SECTORS, STATUSES, COUNTRIES } from '../../../lib/constants'
import LoadingSpinner from '../../../components/ui/LoadingSpinner'
import Avatar from '../../../components/ui/Avatar'
import toast from 'react-hot-toast'

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { user, refreshProfile } = useAuthStore()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const fileRef = useRef()

  const [form, setForm] = useState({
    photo_url: '',
    whatsapp: '',
    city: '',
    status: '',
    sectors: [],
    description: '',
    linkedin_url: '',
    country: '',
  })

  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }))
  const toggleSector = (s) =>
    setForm((f) => ({
      ...f,
      sectors: f.sectors.includes(s) ? f.sectors.filter((x) => x !== s) : [...f.sectors, s],
    }))

  const handlePhoto = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const uploadPhoto = async () => {
    if (!photoFile) return form.photo_url
    const ext = photoFile.name.split('.').pop()
    const path = `avatars/${user.id}.${ext}`
    const { error } = await supabase.storage.from('avatars').upload(path, photoFile, { upsert: true })
    if (error) throw error
    const { data } = supabase.storage.from('avatars').getPublicUrl(path)
    return data.publicUrl
  }

  const saveLevel1 = async (e) => {
    e.preventDefault()
    if (!form.whatsapp || !form.city || !form.status || form.sectors.length === 0) {
      toast.error('Complète tous les champs obligatoires.')
      return
    }
    setLoading(true)
    try {
      const photo_url = await uploadPhoto()
      await supabase
        .from('profiles')
        .update({ ...form, photo_url, profile_completed: true })
        .eq('id', user.id)
      await refreshProfile()
      setStep(2)
    } catch (err) {
      toast.error("Erreur lors de l'enregistrement.")
    } finally {
      setLoading(false)
    }
  }

  const saveLevel2 = async (skip = false) => {
    if (!skip) {
      setLoading(true)
      try {
        await supabase
          .from('profiles')
          .update({ description: form.description, linkedin_url: form.linkedin_url, country: form.country })
          .eq('id', user.id)
        await refreshProfile()
      } catch {
        toast.error("Erreur lors de l'enregistrement.")
      } finally {
        setLoading(false)
      }
    }
    navigate('/', { replace: true })
    toast.success('Bienvenue dans Propulsion ! 🚀')
  }

  if (step === 1) {
    return (
      <div className="min-h-dvh bg-surface">
        <div className="bg-violet px-6 pt-12 pb-8 text-white">
          <p className="text-sm text-white/70 mb-1">Étape 1/2 · Obligatoire</p>
          <h1 className="text-2xl font-bold">Complète ton profil</h1>
          <p className="text-white/80 text-sm mt-1">Ces informations permettent aux membres de te trouver.</p>
          <div className="flex gap-1 mt-4">
            <div className="flex-1 h-1 bg-white rounded-full" />
            <div className="flex-1 h-1 bg-white/30 rounded-full" />
          </div>
        </div>

        <form onSubmit={saveLevel1} className="px-4 py-6 space-y-5">
          {/* Photo */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <Avatar
                profile={{ photo_url: photoPreview, first_name: '', last_name: '' }}
                size="xl"
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="absolute bottom-1 right-1 bg-violet text-white rounded-full p-2 shadow-lg"
              >
                <Camera size={16} />
              </button>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
            <p className="text-sm text-gray-500">Ajoute ta photo de profil</p>
          </div>

          {/* WhatsApp */}
          <div>
            <label className="block text-sm font-medium text-navy mb-1.5">Numéro WhatsApp *</label>
            <input
              type="tel"
              className="input"
              placeholder="+237 6XX XXX XXX"
              value={form.whatsapp}
              onChange={(e) => set('whatsapp', e.target.value)}
              required
            />
          </div>

          {/* Ville */}
          <div>
            <label className="block text-sm font-medium text-navy mb-1.5">Ville actuelle *</label>
            <input
              type="text"
              className="input"
              placeholder="ex : Douala, Yaoundé, Paris..."
              value={form.city}
              onChange={(e) => set('city', e.target.value)}
              required
            />
          </div>

          {/* Statut */}
          <div>
            <label className="block text-sm font-medium text-navy mb-2">Statut *</label>
            <div className="grid grid-cols-2 gap-2">
              {STATUSES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => set('status', s)}
                  className={`py-2.5 px-3 rounded-btn text-sm font-medium border-2 transition-colors ${
                    form.status === s
                      ? 'bg-violet text-white border-violet'
                      : 'bg-white text-navy border-gray-200'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Secteurs */}
          <div>
            <label className="block text-sm font-medium text-navy mb-2">
              Secteur(s) d'activité *{' '}
              <span className="text-gray-400 font-normal">(plusieurs possibles)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {SECTORS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleSector(s)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    form.sectors.includes(s)
                      ? 'bg-violet text-white border-violet'
                      : 'bg-white text-gray-600 border-gray-200'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? <LoadingSpinner size="sm" /> : (
              <>Continuer <ChevronRight size={18} /></>
            )}
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-surface">
      <div className="bg-violet px-6 pt-12 pb-8 text-white">
        <button onClick={() => setStep(1)} className="flex items-center gap-1 text-white/70 text-sm mb-3">
          <ChevronLeft size={16} /> Retour
        </button>
        <p className="text-sm text-white/70 mb-1">Étape 2/2 · Recommandé</p>
        <h1 className="text-2xl font-bold">Enrichis ton profil</h1>
        <p className="text-white/80 text-sm mt-1">Ces informations sont optionnelles mais recommandées.</p>
        <div className="flex gap-1 mt-4">
          <div className="flex-1 h-1 bg-white rounded-full" />
          <div className="flex-1 h-1 bg-white rounded-full" />
        </div>
      </div>

      <div className="px-4 py-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-navy mb-1.5">
            Bio courte <span className="text-gray-400">({form.description.length}/160)</span>
          </label>
          <textarea
            className="input resize-none"
            rows={3}
            placeholder="Qui tu es en une phrase..."
            maxLength={160}
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-navy mb-1.5">Pays</label>
          <select className="input" value={form.country} onChange={(e) => set('country', e.target.value)}>
            <option value="">Sélectionne ton pays</option>
            {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-navy mb-1.5">LinkedIn</label>
          <input
            type="url"
            className="input"
            placeholder="https://linkedin.com/in/ton-profil"
            value={form.linkedin_url}
            onChange={(e) => set('linkedin_url', e.target.value)}
          />
        </div>

        <button onClick={() => saveLevel2(false)} className="btn-primary w-full" disabled={loading}>
          {loading ? <LoadingSpinner size="sm" /> : 'Enregistrer et accéder à Propulsion 🚀'}
        </button>

        <button
          onClick={() => saveLevel2(true)}
          className="flex items-center justify-center gap-1.5 w-full text-sm text-gray-500 py-2"
          disabled={loading}
        >
          <SkipForward size={16} /> Passer cette étape
        </button>
      </div>
    </div>
  )
}
