import { useState } from 'react'
import { Search, UserCheck, UserX, Plus, Upload, Download } from 'lucide-react'
import AdminLayout from '../../components/admin/AdminLayout'
import { useAllMembers, useToggleMemberActive } from '../../hooks/useMembers'
import { useAuthStore } from '../../stores/authStore'
import Avatar from '../../components/ui/Avatar'
import Modal from '../../components/ui/Modal'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { supabase } from '../../lib/supabase'
import { formatDate } from '../../lib/utils'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'

export default function AdminMembersPage() {
  const { data: members = [], isLoading } = useAllMembers()
  const toggleActive = useToggleMemberActive()
  const profile = useAuthStore((s) => s.profile)
  const [search, setSearch] = useState('')
  const [addModal, setAddModal] = useState(false)
  const [importModal, setImportModal] = useState(false)
  const [loading, setLoading] = useState(false)

  const filtered = members.filter((m) => {
    const q = search.toLowerCase()
    return (
      m.first_name?.toLowerCase().includes(q) ||
      m.last_name?.toLowerCase().includes(q) ||
      m.email?.toLowerCase().includes(q) ||
      m.city?.toLowerCase().includes(q)
    )
  })

  const handleToggle = async (member) => {
    if (member.id === profile?.id) { toast.error("Tu ne peux pas désactiver ton propre compte."); return }
    await toggleActive.mutateAsync({ id: member.id, is_active: !member.is_active })
    toast.success(member.is_active ? 'Compte désactivé.' : 'Compte activé.')
  }

  const exportCSV = () => {
    const rows = members.map((m) => ({
      Prénom: m.first_name, Nom: m.last_name, Email: m.email, WhatsApp: m.whatsapp,
      Ville: m.city, Pays: m.country, Statut: m.status, Secteurs: m.sectors?.join(', '),
      Actif: m.is_active ? 'Oui' : 'Non', Inscription: formatDate(m.created_at),
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Membres')
    XLSX.writeFile(wb, `propulsion-membres-${new Date().toISOString().split('T')[0]}.xlsx`)
    toast.success('Export téléchargé.')
  }

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold text-navy">Membres ({members.length})</h1>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="btn-secondary h-9 px-3 text-sm flex items-center gap-1.5">
            <Download size={15} /> Export
          </button>
          <button onClick={() => setImportModal(true)} className="btn-secondary h-9 px-3 text-sm flex items-center gap-1.5">
            <Upload size={15} /> Import
          </button>
          <button onClick={() => setAddModal(true)} className="btn-primary h-9 px-3 text-sm flex items-center gap-1.5">
            <Plus size={15} /> Ajouter
          </button>
        </div>
      </div>

      <div className="relative mb-4">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="search" className="input pl-10 h-10" placeholder="Rechercher un membre..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {isLoading ? (
        <LoadingSpinner className="py-16" />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Membre</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Ville</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Statut</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Compte</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => (
                  <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar profile={m} size="sm" />
                        <div>
                          <p className="font-medium text-navy">{m.first_name} {m.last_name}</p>
                          <p className="text-xs text-gray-400">{m.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{m.city || '—'}</td>
                    <td className="px-4 py-3">
                      <span className="tag text-xs">{m.status || '—'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${m.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-propulsion'}`}>
                        {m.is_active ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggle(m)}
                        className={`p-1.5 rounded-lg transition-colors ${m.is_active ? 'text-red-propulsion hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}
                        title={m.is_active ? 'Désactiver' : 'Activer'}
                      >
                        {m.is_active ? <UserX size={16} /> : <UserCheck size={16} />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add member modal */}
      <AddMemberModal open={addModal} onClose={() => setAddModal(false)} />

      {/* Import modal */}
      <ImportModal open={importModal} onClose={() => setImportModal(false)} />
    </AdminLayout>
  )
}

function AddMemberModal({ open, onClose }) {
  const [form, setForm] = useState({ email: '', first_name: '', last_name: '', whatsapp: '', city: '', status: 'Membre' })
  const [loading, setLoading] = useState(false)
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const handleAdd = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase.from('profiles').insert({
        ...form,
        email: form.email.toLowerCase().trim(),
        role: 'member',
        is_active: true,
        profile_completed: false,
        sectors: [],
      })
      if (error) throw error
      toast.success('Membre ajouté avec succès.')
      onClose()
    } catch (err) {
      toast.error(err.message || "Erreur lors de l'ajout.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Ajouter un membre">
      <form onSubmit={handleAdd} className="space-y-4">
        {[
          { label: 'Email *', key: 'email', type: 'email' },
          { label: 'Prénom *', key: 'first_name' },
          { label: 'Nom *', key: 'last_name' },
          { label: 'WhatsApp', key: 'whatsapp', type: 'tel' },
          { label: 'Ville', key: 'city' },
        ].map(({ label, key, type = 'text' }) => (
          <div key={key}>
            <label className="block text-sm font-medium text-navy mb-1">{label}</label>
            <input type={type} className="input" value={form[key]} onChange={(e) => set(key, e.target.value)} required={label.includes('*')} />
          </div>
        ))}
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? <LoadingSpinner size="sm" /> : 'Ajouter le membre'}
        </button>
      </form>
    </Modal>
  )
}

function ImportModal({ open, onClose }) {
  const [preview, setPreview] = useState([])
  const [loading, setLoading] = useState(false)
  const [headers, setHeaders] = useState([])
  const [rows, setRows] = useState([])

  const handleFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const wb = XLSX.read(ev.target.result, { type: 'array' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 })
      setHeaders(data[0] || [])
      setRows(data.slice(1, 6))
      setPreview(data.slice(1).map((row) => {
        const obj = {}
        data[0].forEach((h, i) => { obj[h] = row[i] })
        return obj
      }))
    }
    reader.readAsArrayBuffer(file)
  }

  const handleImport = async () => {
    setLoading(true)
    let success = 0, errors = 0
    for (const row of preview) {
      try {
        const email = (row['Email'] || row['email'] || '').toLowerCase().trim()
        if (!email) { errors++; continue }
        const sectors = (row['Secteurs'] || row['secteurs'] || '').split(',').map((s) => s.trim()).filter(Boolean)
        await supabase.from('profiles').upsert({
          email,
          first_name: (row['Prénom'] || row['first_name'] || '').trim(),
          last_name: (row['Nom'] || row['last_name'] || '').trim(),
          whatsapp: (row['WhatsApp'] || row['whatsapp'] || '').trim(),
          city: (row['Ville'] || row['city'] || '').trim(),
          country: (row['Pays'] || row['country'] || '').trim(),
          status: (row['Statut'] || row['status'] || 'Autre').trim(),
          sectors,
          role: 'member',
          is_active: true,
          profile_completed: false,
        }, { onConflict: 'email' })
        success++
      } catch { errors++ }
    }
    toast.success(`Import terminé : ${success} insérés, ${errors} erreurs.`)
    setLoading(false)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Importer des membres" size="xl">
      <div className="space-y-4">
        <div className="border-2 border-dashed border-gray-200 rounded-card p-6 text-center">
          <Upload size={32} className="text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500 mb-3">Glisse ton fichier Excel/CSV ici ou clique pour sélectionner</p>
          <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} className="hidden" id="import-file" />
          <label htmlFor="import-file" className="btn-secondary inline-flex cursor-pointer">
            Sélectionner un fichier
          </label>
        </div>

        {headers.length > 0 && (
          <div>
            <p className="text-sm font-medium text-navy mb-2">Aperçu (5 premières lignes)</p>
            <div className="overflow-x-auto rounded-lg border border-gray-100">
              <table className="text-xs w-full">
                <thead className="bg-gray-50">
                  <tr>{headers.map((h) => <th key={h} className="px-3 py-2 text-left font-medium text-gray-500">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={i} className="border-t border-gray-50">
                      {headers.map((h, j) => <td key={j} className="px-3 py-2 text-gray-600">{row[j] || '—'}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-400 mt-2">Total : {preview.length} lignes détectées</p>
          </div>
        )}

        {preview.length > 0 && (
          <button onClick={handleImport} className="btn-primary w-full" disabled={loading}>
            {loading ? <LoadingSpinner size="sm" /> : `Confirmer l'import (${preview.length} membres)`}
          </button>
        )}
      </div>
    </Modal>
  )
}
