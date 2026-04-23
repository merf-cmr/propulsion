import { useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Megaphone, Calendar } from 'lucide-react'
import { useAnnouncements } from '../../hooks/useAnnouncements'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import TopBar from '../../components/layout/TopBar'
import { formatDate } from '../../lib/utils'

export default function AnnouncementsPage() {
  const navigate = useNavigate()
  const loaderRef = useRef()
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useAnnouncements()

  const announcements = data?.pages.flatMap((p) => p) ?? []

  useEffect(() => {
    const el = loaderRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { rootMargin: '200px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  return (
    <div className="pb-24">
      <TopBar title="Annonces" />

      {isLoading ? (
        <LoadingSpinner className="py-16" />
      ) : announcements.length === 0 ? (
        <div className="py-24 text-center px-4">
          <Megaphone size={48} className="text-gray-200 mx-auto mb-4" />
          <p className="font-semibold text-navy">Aucune annonce pour le moment</p>
          <p className="text-sm text-gray-400 mt-1">Les annonces de la communauté apparaîtront ici.</p>
        </div>
      ) : (
        <div className="px-4 pt-4 space-y-3">
          {announcements.map((a) => (
            <div
              key={a.id}
              className="card overflow-hidden cursor-pointer active:scale-[0.99] transition-transform"
              onClick={() => navigate(`/announcements/${a.id}`)}
            >
              {a.image_url && (
                <img
                  src={a.image_url}
                  alt={a.title}
                  className="w-full h-40 object-cover"
                  loading="lazy"
                />
              )}
              <div className="p-4">
                <h2 className="font-bold text-navy text-base line-clamp-2">{a.title}</h2>
                <div className="flex items-center gap-1.5 mt-2 text-gray-400">
                  <Calendar size={13} />
                  <span className="text-xs">{formatDate(a.published_at)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div ref={loaderRef} className="h-4" />
      {isFetchingNextPage && <LoadingSpinner className="py-4" />}
    </div>
  )
}
