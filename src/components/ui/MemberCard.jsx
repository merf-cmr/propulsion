import { MessageCircle, Mail } from 'lucide-react'
import Avatar from './Avatar'
import { formatWhatsAppUrl, formatMailtoUrl, getWhatsAppMessage, cn } from '../../lib/utils'
import { useAuthStore } from '../../stores/authStore'
import { useNavigate } from 'react-router-dom'

export default function MemberCard({ member, compact = false, className }) {
  const profile = useAuthStore((s) => s.profile)
  const navigate = useNavigate()

  const whatsappMsg = getWhatsAppMessage(member, profile)
  const whatsappUrl = formatWhatsAppUrl(member.whatsapp, whatsappMsg)
  const mailUrl = member.email ? formatMailtoUrl(member.email, `Bonjour depuis Propulsion`) : null

  return (
    <div
      className={cn('card p-4 cursor-pointer active:scale-[0.98] transition-transform', className)}
      onClick={() => navigate(`/profile/${member.id}`)}
    >
      <div className="flex items-start gap-3">
        <Avatar profile={member} size={compact ? 'sm' : 'md'} />
        <div className="flex-1 min-w-0">
          <p className="font-bold text-navy text-base truncate">
            {member.first_name} {member.last_name}
          </p>
          <p className="text-xs text-gray-500 truncate">{member.status}</p>
          {member.city && (
            <p className="text-xs text-gray-400 truncate mt-0.5">{member.city}{member.country ? `, ${member.country}` : ''}</p>
          )}
          {member.sectors?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {member.sectors.slice(0, 2).map((s) => (
                <span key={s} className="tag">{s}</span>
              ))}
              {member.sectors.length > 2 && (
                <span className="tag">+{member.sectors.length - 2}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {!compact && (
        <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100" onClick={(e) => e.stopPropagation()}>
          {member.whatsapp && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-whatsapp flex-1 text-sm py-2 h-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <MessageCircle size={16} />
              WhatsApp
            </a>
          )}
          {mailUrl && (
            <a
              href={mailUrl}
              className="flex-1 flex items-center justify-center gap-1.5 border border-blue-propulsion text-blue-propulsion rounded-btn py-2 text-sm font-medium transition-opacity active:opacity-80 min-h-touch"
              onClick={(e) => e.stopPropagation()}
            >
              <Mail size={16} />
              Email
            </a>
          )}
        </div>
      )}
    </div>
  )
}
