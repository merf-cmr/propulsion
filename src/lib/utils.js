import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function getInitials(firstName, lastName) {
  return `${(firstName || '')[0] || ''}${(lastName || '')[0] || ''}`.toUpperCase()
}

export function formatWhatsAppUrl(number, message = '') {
  const clean = (number || '').replace(/\D/g, '')
  const encoded = encodeURIComponent(message)
  return `https://wa.me/${clean}${message ? `?text=${encoded}` : ''}`
}

export function formatMailtoUrl(email, subject = '', body = '') {
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

export function getProfileCompletion(profile) {
  const level1 = ['photo_url', 'whatsapp', 'city', 'status', 'sectors']
  const level2 = ['description', 'country', 'linkedin_url']
  const level3 = ['birth_date', 'career_summary', 'challenge', 'main_lesson', 'current_situation', 'propulsion_goal']

  const allFields = [...level1, ...level2, ...level3]
  const filled = allFields.filter((f) => {
    const val = profile?.[f]
    if (Array.isArray(val)) return val.length > 0
    return val !== null && val !== undefined && val !== ''
  })

  return Math.round((filled.length / allFields.length) * 100)
}

export function getWhatsAppMessage(member, visitor) {
  const visitorName = visitor ? `${visitor.first_name} ${visitor.last_name}` : ''
  const memberName = `${member.first_name} ${member.last_name}`
  const civility = member.status === 'Étudiant' ? '' : (member.first_name ? `M./Mme ` : '')
  return `Bonjour ${civility}${memberName}, je suis ${visitorName}, membre Propulsion.`
}

export function debounce(fn, delay) {
  let timer
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

export function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}
