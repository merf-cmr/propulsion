import { cn } from '../../lib/utils'

export default function LoadingSpinner({ size = 'md', className }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' }
  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div className={cn('border-2 border-violet-light border-t-violet rounded-full animate-spin', sizes[size])} />
    </div>
  )
}

export function PageLoader() {
  return (
    <div className="fixed inset-0 bg-surface flex items-center justify-center z-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-3 border-violet-light border-t-violet rounded-full animate-spin" />
        <p className="text-sm text-gray-500 font-medium">Chargement...</p>
      </div>
    </div>
  )
}
