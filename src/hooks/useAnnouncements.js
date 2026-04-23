import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { PAGE_SIZE } from '../lib/constants'

export function useAnnouncements() {
  return useInfiniteQuery({
    queryKey: ['announcements'],
    queryFn: async ({ pageParam = 0 }) => {
      const { data, error } = await supabase
        .from('announcements')
        .select('id,title,image_url,status,published_at,created_at')
        .eq('status', 'published')
        .not('published_at', 'is', null)
        .order('published_at', { ascending: false })
        .range(pageParam * PAGE_SIZE, (pageParam + 1) * PAGE_SIZE - 1)
      if (error) throw error
      return data
    },
    getNextPageParam: (lastPage, pages) =>
      lastPage.length === PAGE_SIZE ? pages.length : undefined,
    initialPageParam: 0,
  })
}

export function useAnnouncement(id) {
  return useQuery({
    queryKey: ['announcement', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('id', id)
        .eq('status', 'published')
        .single()
      if (error) throw error
      return data
    },
    enabled: !!id,
  })
}

export function useLatestAnnouncement() {
  return useQuery({
    queryKey: ['announcement-latest'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('announcements')
        .select('id,title,created_at,published_at')
        .eq('status', 'published')
        .not('published_at', 'is', null)
        .order('published_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (error) throw error
      return data
    },
  })
}

// Admin hooks
export function useAllAnnouncements() {
  return useQuery({
    queryKey: ['admin-announcements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

export function useUpsertAnnouncement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }) => {
      if (id) {
        const { error } = await supabase.from('announcements').update(data).eq('id', id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('announcements').insert(data)
        if (error) throw error
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-announcements'] })
      qc.invalidateQueries({ queryKey: ['announcements'] })
      qc.invalidateQueries({ queryKey: ['announcement-latest'] })
    },
  })
}

export function useDeleteAnnouncement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('announcements').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-announcements'] })
      qc.invalidateQueries({ queryKey: ['announcements'] })
    },
  })
}
