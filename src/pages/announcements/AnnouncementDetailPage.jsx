import { useParams } from 'react-router-dom'
import { Calendar } from 'lucide-react'
import { useAnnouncement } from '../../hooks/useAnnouncements'
import TopBar from '../../components/layout/TopBar'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { formatDate } from '../../lib/utils'

export default function AnnouncementDetailPage() {
  const { id } = useParams()
  const { data: announcement, isLoading } = useAnnouncement(id)

  if (isLoading) return (
    <div>
      <TopBar title="Annonce" back />
      <LoadingSpinner className="py-16" />
    </div>
  )

  if (!announcement) return (
    <div>
      <TopBar title="Annonce" back />
      <div className="py-24 text-center text-gray-400">Annonce introuvable.</div>
    </div>
  )

  return (
    <div className="pb-24">
      <TopBar title="Annonce" back />

      {announcement.image_url && (
        <img
          src={announcement.image_url}
          alt={announcement.title}
          className="w-full h-52 object-cover"
        />
      )}

      <div className="px-4 py-4">
        <h1 className="text-xl font-bold text-navy mb-2">{announcement.title}</h1>
        <div className="flex items-center gap-1.5 text-gray-400 mb-6">
          <Calendar size={14} />
          <span className="text-sm">{formatDate(announcement.published_at)}</span>
        </div>

        {announcement.content && (
          <div
            className="prose prose-sm max-w-none text-gray-700 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: renderContent(announcement.content) }}
          />
        )}
      </div>
    </div>
  )
}

function renderContent(content) {
  if (typeof content === 'string') return content
  if (content?.type === 'doc' && content?.content) {
    return tiptapToHtml(content)
  }
  return ''
}

function tiptapToHtml(node) {
  if (!node) return ''
  if (node.type === 'doc') return node.content?.map(tiptapToHtml).join('') ?? ''
  if (node.type === 'paragraph') {
    const inner = node.content?.map(tiptapToHtml).join('') ?? ''
    return `<p>${inner || '<br>'}</p>`
  }
  if (node.type === 'text') {
    let text = node.text || ''
    if (node.marks) {
      for (const mark of node.marks) {
        if (mark.type === 'bold') text = `<strong>${text}</strong>`
        if (mark.type === 'italic') text = `<em>${text}</em>`
        if (mark.type === 'link') text = `<a href="${mark.attrs?.href}" target="_blank" rel="noopener noreferrer" class="text-violet underline">${text}</a>`
      }
    }
    return text
  }
  if (node.type === 'bulletList') return `<ul class="list-disc pl-4 space-y-1">${node.content?.map(tiptapToHtml).join('') ?? ''}</ul>`
  if (node.type === 'orderedList') return `<ol class="list-decimal pl-4 space-y-1">${node.content?.map(tiptapToHtml).join('') ?? ''}</ol>`
  if (node.type === 'listItem') return `<li>${node.content?.map(tiptapToHtml).join('') ?? ''}</li>`
  if (node.type === 'heading') return `<h${node.attrs?.level || 2} class="font-bold text-navy mt-4 mb-2">${node.content?.map(tiptapToHtml).join('') ?? ''}</h${node.attrs?.level || 2}>`
  if (node.type === 'image') return `<img src="${node.attrs?.src}" alt="${node.attrs?.alt || ''}" class="rounded-lg w-full my-3" />`
  return node.content?.map(tiptapToHtml).join('') ?? ''
}
