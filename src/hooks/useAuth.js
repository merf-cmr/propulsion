import { useState } from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export function useOTP() {
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState('email') // 'email' | 'otp'
  const [email, setEmail] = useState('')

  const sendOTP = async (emailInput) => {
    setLoading(true)
    try {
      // Verify email exists in profiles
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, is_active')
        .eq('email', emailInput.toLowerCase().trim())
        .maybeSingle()

      if (profileError) throw profileError

      if (!profile) {
        toast.error("Cet email n'est pas enregistré dans la communauté Propulsion. Contacte un administrateur.")
        return false
      }

      if (!profile.is_active) {
        toast.error("Ton compte est désactivé. Contacte un administrateur.")
        return false
      }

      const { error } = await supabase.auth.signInWithOtp({
        email: emailInput.toLowerCase().trim(),
        options: { shouldCreateUser: false },
      })

      if (error) throw error

      setEmail(emailInput.toLowerCase().trim())
      setStep('otp')
      toast.success('Code envoyé ! Vérifie ta boîte mail.')
      return true
    } catch (err) {
      toast.error(err.message || 'Une erreur est survenue.')
      return false
    } finally {
      setLoading(false)
    }
  }

  const verifyOTP = async (token) => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email',
      })

      if (error) throw error

      // Update last_login
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase
          .from('profiles')
          .update({ last_login: new Date().toISOString() })
          .eq('id', user.id)
      }

      return true
    } catch (err) {
      toast.error('Code invalide ou expiré. Réessaie.')
      return false
    } finally {
      setLoading(false)
    }
  }

  return { loading, step, email, sendOTP, verifyOTP, setStep }
}
