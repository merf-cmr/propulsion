import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './stores/authStore'
import { supabase } from './lib/supabase'
import { PageLoader } from './components/ui/LoadingSpinner'
import Layout from './components/layout/Layout'

import LoginPage from './pages/auth/LoginPage'
import OnboardingPage from './pages/profile/onboarding/OnboardingPage'
import HomePage from './pages/home/HomePage'
import ExplorerPage from './pages/explorer/ExplorerPage'
import AnnouncementsPage from './pages/announcements/AnnouncementsPage'
import AnnouncementDetailPage from './pages/announcements/AnnouncementDetailPage'
import MemberProfilePage from './pages/profile/MemberProfilePage'
import MyProfilePage from './pages/profile/MyProfilePage'
import NotificationsPage from './pages/NotificationsPage'
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import AdminMembersPage from './pages/admin/AdminMembersPage'
import AdminAnnouncementsPage from './pages/admin/AdminAnnouncementsPage'
import AdminMemberOfDayPage from './pages/admin/AdminMemberOfDayPage'

function RequireAuth({ children }) {
  const { user, loading } = useAuthStore()
  if (loading) return <PageLoader />
  if (!user) return <Navigate to="/login" replace />
  return children
}

function RequireProfileComplete({ children }) {
  const { user, profile, loading } = useAuthStore()
  if (loading) return <PageLoader />
  if (!user) return <Navigate to="/login" replace />
  if (profile && !profile.profile_completed) return <Navigate to="/onboarding" replace />
  return children
}

function RequireAdmin({ children }) {
  const { user, profile, loading } = useAuthStore()
  if (loading) return <PageLoader />
  if (!user) return <Navigate to="/login" replace />
  if (profile?.role !== 'admin') return <Navigate to="/" replace />
  return children
}

export default function App() {
  const { initialize, setSession, setProfile, setLoading } = useAuthStore()

  useEffect(() => {
    initialize()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      if (session?.user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
        setProfile(data)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: { fontFamily: 'Inter, sans-serif', fontSize: '14px', maxWidth: '340px' },
        }}
      />
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route path="/onboarding" element={
          <RequireAuth><OnboardingPage /></RequireAuth>
        } />

        <Route path="/" element={
          <RequireProfileComplete><Layout><HomePage /></Layout></RequireProfileComplete>
        } />
        <Route path="/explorer" element={
          <RequireProfileComplete><Layout><ExplorerPage /></Layout></RequireProfileComplete>
        } />
        <Route path="/announcements" element={
          <RequireProfileComplete><Layout><AnnouncementsPage /></Layout></RequireProfileComplete>
        } />
        <Route path="/announcements/:id" element={
          <RequireProfileComplete><Layout><AnnouncementDetailPage /></Layout></RequireProfileComplete>
        } />
        <Route path="/profile/:id" element={
          <RequireProfileComplete><Layout><MemberProfilePage /></Layout></RequireProfileComplete>
        } />
        <Route path="/me" element={
          <RequireProfileComplete><Layout><MyProfilePage /></Layout></RequireProfileComplete>
        } />
        <Route path="/notifications" element={
          <RequireProfileComplete><Layout><NotificationsPage /></Layout></RequireProfileComplete>
        } />

        <Route path="/admin" element={<RequireAdmin><AdminDashboardPage /></RequireAdmin>} />
        <Route path="/admin/members" element={<RequireAdmin><AdminMembersPage /></RequireAdmin>} />
        <Route path="/admin/announcements" element={<RequireAdmin><AdminAnnouncementsPage /></RequireAdmin>} />
        <Route path="/admin/member-of-day" element={<RequireAdmin><AdminMemberOfDayPage /></RequireAdmin>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
