import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, X, LayoutList, LayoutGrid, SlidersHorizontal } from 'lucide-react'
import { useMembers } from '../../hooks/useMembers'
import MemberCard from '../../components/ui/MemberCard'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { SECTORS, STATUSES, COUNTRIES } from '../../lib/constants'
import { debounce } from '../../lib/utils'
import Modal from '../../components/ui/Modal'

export default function ExplorerPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchInput, setSearchInput] = useState(searchParams.get('q') || '')
  const [search, setSearch] = useState(searchParams.get('q') || '')
  const [sector, setSector] = useState(searchParams.get('sector') || '')
  const [city, setCity] = useState(searchParams.get('city') || '')
  const [country, setCountry] = useState('')
  const [status, setStatus] = useState('')
  const [grid, setGrid] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const loaderRef = useRef()

  const debouncedSearch = useCallback(debounce((val) => setSearch(val), 300), [])

  const handleSearchChange = (val) => {
    setSearchInput(val)
    debouncedSearch(val)
  }

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useMembers({ search, sector, city, country, status })

  const members = data?.pages.flatMap((p) => p) ?? []
  const total = members.length
  const hasFilters = !!(search || sector || city || country || status)

  // Infinite scroll observer
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

  const clearFilters = () => {
    setSearch('')
    setSearchInput('')
    setSector('')
    setCity('')
    setCountry('')
    setStatus('')
  }

  return (
    <div className="pb-24">
      {/* Sticky search bar */}
      <div className="sticky top-0 z-20 bg-surface border-b border-gray-100 px-4 pt-12 pb-3 space-y-2">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            className="input pl-11 pr-10 h-12"
            placeholder="Cherche un membre, une ville, un secteur..."
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
          {searchInput && (
            <button
              onClick={() => handleSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
            >
              <X size={16} className="text-gray-400" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {/* Filter button */}
          <button
            onClick={() => setFiltersOpen(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium flex-shrink-0 ${
              hasFilters ? 'bg-violet text-white border-violet' : 'bg-white text-gray-600 border-gray-200'
            }`}
          >
            <SlidersHorizontal size={14} />
            Filtres {hasFilters && '•'}
          </button>

          {/* Quick sector chips */}
          {['Informatique & Tech', 'Finance & Banque', 'Commerce & Distribution', 'Éducation & Formation'].map((s) => (
            <button
              key={s}
              onClick={() => setSector(sector === s ? '' : s)}
              className={`px-3 py-1.5 rounded-full border text-xs font-medium flex-shrink-0 transition-colors ${
                sector === s ? 'bg-violet text-white border-violet' : 'bg-white text-gray-600 border-gray-200'
              }`}
            >
              {s.split(' & ')[0]}
            </button>
          ))}

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="px-3 py-1.5 rounded-full border border-red-200 text-red-propulsion text-xs font-medium flex-shrink-0"
            >
              Réinitialiser
            </button>
          )}
        </div>
      </div>

      {/* Results header */}
      <div className="px-4 py-3 flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {isLoading ? 'Recherche...' : `${total}${hasNextPage ? '+' : ''} membre${total !== 1 ? 's' : ''} trouvé${total !== 1 ? 's' : ''}`}
        </p>
        <button
          onClick={() => setGrid((g) => !g)}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          {grid ? <LayoutList size={20} className="text-gray-500" /> : <LayoutGrid size={20} className="text-gray-500" />}
        </button>
      </div>

      {/* Members list */}
      {isLoading ? (
        <LoadingSpinner className="py-16" />
      ) : members.length === 0 ? (
        <div className="px-4 py-16 text-center">
          <p className="text-4xl mb-3">🔍</p>
          <p className="font-semibold text-navy">Aucun membre trouvé</p>
          <p className="text-sm text-gray-400 mt-1">Essaie d'autres mots-clés ou filtres.</p>
        </div>
      ) : (
        <div className={`px-4 ${grid ? 'grid grid-cols-2 gap-3' : 'space-y-3'}`}>
          {members.map((m) => (
            <MemberCard key={m.id} member={m} compact={grid} />
          ))}
        </div>
      )}

      {/* Infinite scroll loader */}
      <div ref={loaderRef} className="h-4" />
      {isFetchingNextPage && <LoadingSpinner className="py-4" />}

      {/* Filters modal */}
      <Modal open={filtersOpen} onClose={() => setFiltersOpen(false)} title="Filtres de recherche">
        <div className="space-y-5">
          <FilterGroup label="Statut">
            <div className="grid grid-cols-2 gap-2">
              {STATUSES.map((s) => (
                <Chip key={s} label={s} active={status === s} onClick={() => setStatus(status === s ? '' : s)} />
              ))}
            </div>
          </FilterGroup>

          <FilterGroup label="Secteur d'activité">
            <div className="flex flex-wrap gap-2">
              {SECTORS.map((s) => (
                <Chip key={s} label={s} active={sector === s} onClick={() => setSector(sector === s ? '' : s)} />
              ))}
            </div>
          </FilterGroup>

          <FilterGroup label="Ville">
            <input
              type="text"
              className="input"
              placeholder="ex : Douala, Paris..."
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </FilterGroup>

          <FilterGroup label="Pays">
            <select className="input" value={country} onChange={(e) => setCountry(e.target.value)}>
              <option value="">Tous les pays</option>
              {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </FilterGroup>

          <div className="flex gap-3 pt-2">
            <button onClick={clearFilters} className="btn-secondary flex-1">Réinitialiser</button>
            <button onClick={() => setFiltersOpen(false)} className="btn-primary flex-1">Appliquer</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function FilterGroup({ label, children }) {
  return (
    <div>
      <p className="text-sm font-semibold text-navy mb-2">{label}</p>
      {children}
    </div>
  )
}

function Chip({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
        active ? 'bg-violet text-white border-violet' : 'bg-white text-gray-600 border-gray-200'
      }`}
    >
      {label}
    </button>
  )
}
