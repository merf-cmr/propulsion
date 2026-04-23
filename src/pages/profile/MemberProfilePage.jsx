import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MessageCircle, Mail, ExternalLink, ArrowLeft } from 'lucide-react'
import { useMember } from '../../hooks/useMembers'
import { useAuthStore } from '../../stores/authStore'
import Avatar from '../../components/ui/Avatar'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { formatWhatsAppUrl, formatMailtoUrl, getWhatsAppMessage } from '../../lib/utils'

const TABS = ['À propos', 'Parcours', 'Questions Propulsion', 'Réseaux']

export default function MemberProfilePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState(0)
  const { data: member, isLoading } = useMember(id)
  const profile = useAuthStore((s) => s.profile)

  if (isLoading) return <LoadingSpinner className="py-32" />
  if (!member) return (
    <div className="py-32 text-center px-4">
      <p className="text-gray-400">Membre introuvable.</p>
      <button onClick={() => navigate(-1)} className="btn-primary mt-4 mx-auto w-fit">Retour</button>
    </div>
  )

  const whatsappMsg = getWhatsAppMessage(member, profile)
  const whatsappUrl = formatWhatsAppUrl(member.whatsapp, whatsappMsg)
  const mailUrl = member.email ? formatMailtoUrl(member.email, 'Bonjour depuis Propulsion', whatsappMsg) : null

  const socials = [
    { url: member.linkedin_url, label: 'LinkedIn', color: 'text-blue-propulsion' },
    { url: member.instagram_url, label: 'Instagram', color: 'text-pink-500' },
    { url: member.facebook_url, label: 'Facebook', color: 'text-blue-600' },
    { url: member.tiktok_url, label: 'TikTok', color: 'text-navy' },
    { url: member.medium_url, label: 'Medium', color: 'text-navy' },
    { url: member.discord_url, label: 'Discord', color: 'text-indigo-500' },
  ].filter((s) => !!s.url)

  return (
    <div className="pb-24">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="fixed top-3 left-3 z-30 bg-white/90 backdrop-blur-sm rounded-full p-2.5 shadow-card"
      >
        <ArrowLeft size={20} className="text-navy" />
      </button>

      {/* Header */}
      <div className="bg-gradient-to-b from-violet to-violet-dark px-4 pt-16 pb-8 text-white text-center">
        <Avatar profile={member} size="xl" className="mx-auto ring-4 ring-white/30" />
        <h1 className="text-xl font-bold mt-3">
          {member.first_name} {member.last_name}
        </h1>
        <p className="text-white/80 text-sm">{member.status}</p>
        {member.city && (
          <p className="text-white/60 text-xs mt-1">
            📍 {member.city}{member.country ? `, ${member.country}` : ''}
          </p>
        )}
        {member.sectors?.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 mt-3">
            {member.sectors.map((s) => (
              <span key={s} className="bg-white/20 text-white text-xs px-2.5 py-1 rounded-full">
                {s}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="px-4 -mt-4 flex gap-3">
        {member.whatsapp && (
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="btn-whatsapp flex-1">
            <MessageCircle size={18} />
            WhatsApp
          </a>
        )}
        {mailUrl && (
          <a
            href={mailUrl}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-propulsion text-white font-semibold rounded-btn py-3 transition-opacity active:opacity-80"
          >
            <Mail size={18} />
            Email
          </a>
        )}
      </div>

      {/* Tabs */}
      <div className="mt-4 border-b border-gray-100 overflow-x-auto">
        <div className="flex px-4 min-w-max">
          {TABS.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveTab(i)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === i
                  ? 'text-violet border-violet'
                  : 'text-gray-400 border-transparent'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4">
        {activeTab === 0 && (
          <div className="space-y-4">
            {member.description && (
              <div className="card p-4">
                <p className="text-sm text-gray-600 leading-relaxed">{member.description}</p>
              </div>
            )}
            <InfoRow label="Statut" value={member.status} />
            <InfoRow label="Ville" value={member.city} />
            <InfoRow label="Pays" value={member.country} />
          </div>
        )}

        {activeTab === 1 && (
          <div className="space-y-4">
            {member.career_summary ? (
              <div className="card p-4">
                <p className="text-sm font-medium text-navy mb-2">Présentation</p>
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{member.career_summary}</p>
              </div>
            ) : (
              <EmptyState text="Ce membre n'a pas encore renseigné son parcours." />
            )}
          </div>
        )}

        {activeTab === 2 && (
          <div className="space-y-3">
            {[
              { label: 'Plus grand défi rencontré', value: member.challenge },
              { label: 'Réaction face au défi', value: member.challenge_reaction },
              { label: 'Première expérience pour gagner de l\'argent', value: member.first_money_exp },
              { label: 'Leçon principale tirée', value: member.main_lesson },
              { label: 'Situation actuelle', value: member.current_situation },
              { label: 'Objectif en intégrant Propulsion', value: member.propulsion_goal },
            ].filter((q) => q.value).map((q) => (
              <div key={q.label} className="card p-4">
                <p className="text-xs font-semibold text-violet mb-2 uppercase tracking-wide">{q.label}</p>
                <p className="text-sm text-gray-700 leading-relaxed">{q.value}</p>
              </div>
            ))}
            {!member.challenge && !member.main_lesson && !member.propulsion_goal && (
              <EmptyState text="Ce membre n'a pas encore répondu aux questions Propulsion." />
            )}
          </div>
        )}

        {activeTab === 3 && (
          <div className="space-y-3">
            {socials.length > 0 ? socials.map((s) => (
              <a
                key={s.label}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="card p-4 flex items-center gap-3 active:scale-[0.98] transition-transform"
              >
                <span className={`w-5 h-5 font-bold text-sm flex items-center justify-center ${s.color}`}>
                  {s.label[0]}
                </span>
                <span className="font-medium text-navy text-sm">{s.label}</span>
                <ExternalLink size={14} className="text-gray-400 ml-auto" />
              </a>
            )) : (
              <EmptyState text="Ce membre n'a pas encore renseigné ses réseaux sociaux." />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function InfoRow({ label, value }) {
  if (!value) return null
  return (
    <div className="flex justify-between items-center py-3 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-navy">{value}</span>
    </div>
  )
}

function EmptyState({ text }) {
  return (
    <div className="py-12 text-center">
      <p className="text-gray-400 text-sm">{text}</p>
    </div>
  )
}
