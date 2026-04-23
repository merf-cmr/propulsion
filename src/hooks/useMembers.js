import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { PAGE_SIZE } from '../lib/constants'

export function useMembers({ search = '', sector = '', city = '', country = '', status = '' } = {}) {
  return useInfiniteQuery({
    queryKey: ['members', { search, sector, city, country, status }],
    queryFn: async ({ pageParam = 0 }) => {
      let query = supabase
        .from('profiles')
        .select('id,first_name,last_name,photo_url,city,country,status,sectors,description,whatsapp,email,last_login')
        .eq('is_active', true)
        .order('last_login', { ascending: false, nullsFirst: false })
        .range(pageParam * PAGE_SIZE, (pageParam + 1) * PAGE_SIZE - 1)

      if (search) {
        query = query.or(
          `first_name.ilike.%${search}%,last_name.ilike.%${search}%,city.ilike.%${search}%,description.ilike.%${search}%`
        )
      }
      if (sector) query = query.contains('sectors', [sector])
      if (city) query = query.ilike('city', `%${city}%`)
      if (country) query = query.eq('country', country)
      if (status) query = query.eq('status', status)

      const { data, error } = await query
      if (error) throw error
      return data
    },
    getNextPageParam: (lastPage, pages) =>
      lastPage.length === PAGE_SIZE ? pages.length : undefined,
    initialPageParam: 0,
  })
}

export function useMember(id) {
  return useQuery({
    queryKey: ['member', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!id,
  })
}

export function useNewMembers(limit = 5) {
  return useQuery({
    queryKey: ['members-new', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id,first_name,last_name,photo_url,city,country,status,sectors,whatsapp,email')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(limit)
      if (error) throw error
      return data
    },
  })
}

export function useMembersInCity(city, limit = 5) {
  return useQuery({
    queryKey: ['members-city', city, limit],
    queryFn: async () => {
      if (!city) return []
      const { data, error } = await supabase
        .from('profiles')
        .select('id,first_name,last_name,photo_url,city,country,status,sectors,whatsapp,email')
        .eq('is_active', true)
        .ilike('city', `%${city}%`)
        .order('last_login', { ascending: false })
        .limit(limit)
      if (error) throw error
      return data
    },
    enabled: !!city,
  })
}

export function useCommunityStats() {
  return useQuery({
    queryKey: ['community-stats'],
    queryFn: async () => {
      const { count: totalMembers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)

      const { data: countries } = await supabase
        .from('profiles')
        .select('country')
        .eq('is_active', true)
        .not('country', 'is', null)

      const { data: sectors } = await supabase
        .from('profiles')
        .select('sectors')
        .eq('is_active', true)

      const uniqueCountries = new Set(countries?.map((r) => r.country).filter(Boolean)).size
      const uniqueSectors = new Set(
        sectors?.flatMap((r) => r.sectors || []).filter(Boolean)
      ).size

      return { totalMembers: totalMembers || 0, countries: uniqueCountries, sectors: uniqueSectors }
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useMemberOfDay() {
  return useQuery({
    queryKey: ['member-of-day'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0]
      const { data, error } = await supabase
        .from('member_of_day')
        .select(`
          id,
          custom_note,
          featured_date,
          profile:profiles!member_of_day_profile_id_fkey(
            id,first_name,last_name,photo_url,city,country,status,sectors,description,whatsapp,email
          )
        `)
        .lte('featured_date', today)
        .order('featured_date', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (error) throw error
      return data
    },
  })
}

// Admin hooks
export function useAllMembers() {
  return useQuery({
    queryKey: ['admin-members'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

export function useToggleMemberActive() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, is_active }) => {
      const { error } = await supabase.from('profiles').update({ is_active }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-members'] }),
  })
}

export function useCreateMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (memberData) => {
      const { data: { user }, error: authError } = await supabase.auth.admin.createUser({
        email: memberData.email,
        email_confirm: true,
      })
      if (authError) throw authError

      const { error } = await supabase
        .from('profiles')
        .insert({ ...memberData, id: user.id, role: 'member', is_active: true, profile_completed: false })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-members'] }),
  })
}
