import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '../lib/supabase'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      session: null,
      loading: true,

      setSession: (session) => set({ session, user: session?.user ?? null }),
      setProfile: (profile) => set({ profile }),
      setLoading: (loading) => set({ loading }),

      initialize: async () => {
        set({ loading: true })
        const { data: { session } } = await supabase.auth.getSession()
        set({ session, user: session?.user ?? null })

        if (session?.user) {
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()
          set({ profile: data })
        }
        set({ loading: false })
      },

      refreshProfile: async () => {
        const { user } = get()
        if (!user) return
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        set({ profile: data })
      },

      signOut: async () => {
        await supabase.auth.signOut()
        set({ user: null, profile: null, session: null })
      },

      isAdmin: () => {
        const { profile } = get()
        return profile?.role === 'admin'
      },

      isProfileComplete: () => {
        const { profile } = get()
        return profile?.profile_completed === true
      },
    }),
    {
      name: 'propulsion-auth',
      partialize: (state) => ({ session: state.session }),
    }
  )
)
