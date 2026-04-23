import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { cn } from '../../lib/utils'

export default function TopBar({ title, back = false, actions, className }) {
  const navigate = useNavigate()

  return (
    <header className={cn('sticky top-0 z-30 bg-white border-b border-gray-100 px-4 h-14 flex items-center gap-3', className)}>
      {back && (
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors min-h-touch min-w-touch flex items-center justify-center"
        >
          <ArrowLeft size={20} className="text-navy" />
        </button>
      )}
      <h1 className="flex-1 text-base font-bold text-navy truncate">{title}</h1>
      {actions && <div className="flex items-center gap-1">{actions}</div>}
    </header>
  )
}
