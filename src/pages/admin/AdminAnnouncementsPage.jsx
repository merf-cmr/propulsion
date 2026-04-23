import { useState } from 'react'
import { Plus, Pencil, Trash2, Eye, Archive } from 'lucide-react'
import AdminLayout from '../../components/admin/AdminLayout'
import { useAllAnnouncements, useUpsertAnnouncement, useDeleteAnnouncement } from '../../hooks/useAnnouncements'
import { useAuthStore } from '../../stores/authStore'
import { supabase } from '../../lib/supabase'
import Modal from '../../components/ui/Modal'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import RichTextEditor from '../../components/admin/RichTextEditor'
import { formatDate } from '../../lib/utils'
import toast from 'react-hot-toast'

const STATUS_LABELS = { draft: 'Brouillon', published: 'Publié', archived: 'Archivé' }
const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-600',
  published: 'bg-green-100 text-green-700',
  archived: 'bg-orange-100 text-orange-700',
}

export default function AdminAnnouncementsPage() {
  const { data: announcements = [], isLoading } = useAllAnnouncements()
  const upsert = useUpsertAnnouncement()
  const deleteAnn = useDeleteAnnouncement()
  const profile = useAuthStore((s) => s.profile)

  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({ title: '', content: null, status: 'draft', image_url: '' })
  const [loading, setLoading] = useState(false)

  const openCreate = () => {
    setForm({ title: '', content: null, status: 'draft', image_url: '' })
    setModal('create')
  }

  const openEdit = (ann) => {
    setForm({ id: ann.id, title: ann.title, content: ann.content, status: ann.status, image_url: ann.image_url || '' })
    setModal('create')
  }

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('Le titre est obligatoire.'); return }
    setLoading(true)
    try {
      await upsert.mutateAsync({
        ...form,
        created_by: profile.id,
        published_at: form.status === 'published' ? (form.id ? undefined : new Date().toISOString()) : null,
      })
      toast.success(form.id ? 'Annonce mise à jour.' : 'Annonce créée.')
      setModal(null)
    } catch {
      toast.error("Erreur lors de l'enregistrement.")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Supprimer cette annonce définitivement ?')) return
    await deleteAnn.mutateAsync(id)
    toast.success('Annonce supprimée.')
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const ext = file.name.split('.').pop()
    const path = `announcements/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('announcements').upload(path, file, { upsert: true })
    if (error) { toast.error("Erreur upload image."); return }
    const { data } = supabase.storage.from('announcements').getPublicUrl(path)
    setForm((f) => ({ ...f, image_url: data.publicUrl }))
    toast.success('Image uploadée.')
  }

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold text-navy">Annonces ({announcements.length})</h1>
        <button onClick={openCreate} className="btn-primary h-9 px-3 text-sm flex items-center gap-1.5">
          <Plus size={15} /> Créer
        </button>
      </div>

      {isLoading ? (
        <LoadingSpinner className="py-16" />
      ) : announcements.length === 0 ? (
        <div className="py-24 text-center text-gray-400">
          <p className="text-sm">Aucune annonce. Créez la première !</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((ann) => (
            <div key={ann.id} className="card p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[ann.status]}`}>
                      {STATUS_LABELS[ann.status]}
                    </span>
                    {ann.published_at && (
                      <span className="text-xs text-gray-400">{formatDate(ann.published_at)}</span>
                    )}
                  </div>
                  <p className="font-semibold text-navy line-clamp-2">{ann.title}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => openEdit(ann)} className="p-2 rounded-lg hover:bg-gray-100 text-violet transition-colors">
                    <Pencil size={16} />
                  </button>
                  <button onClick={() => handleDelete(ann.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-propulsion transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modal === 'create'} onClose={() => setModal(null)} title={form.id ? 'Modifier l\'annonce' : 'Nouvelle annonce'} size="xl">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-navy mb-1.5">Titre * (max 100 caractères)</label>
            <input
              type="text"
              className="input"
              maxLength={100}
              placeholder="Titre de l'annonce"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-navy mb-1.5">Image de couverture</label>
            {form.image_url && (
              <img src={form.image_url} alt="" className="w-full h-32 object-cover rounded-lg mb-2" />
            )}
            <input type="file" accept="image/*" onChange={handleImageUpload} className="text-sm text-gray-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-navy mb-1.5">Contenu</label>
            <RichTextEditor content={form.content} onChange={(content) => setForm((f) => ({ ...f, content }))} />
          </div>

          <div>
            <label className="block text-sm font-medium text-navy mb-1.5">Statut</label>
            <div className="flex gap-2">
              {['draft', 'published', 'archived'].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, status: s }))}
                  className={`flex-1 py-2 rounded-btn text-sm font-medium border-2 transition-colors ${
                    form.status === s ? 'bg-violet text-white border-violet' : 'bg-white text-gray-600 border-gray-200'
                  }`}
                >
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>

          <button onClick={handleSave} className="btn-primary w-full" disabled={loading}>
            {loading ? <LoadingSpinner size="sm" /> : 'Enregistrer'}
          </button>
        </div>
      </Modal>
    </AdminLayout>
  )
}
