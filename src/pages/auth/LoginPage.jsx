import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, ArrowRight, ChevronLeft } from 'lucide-react'
import { useOTP } from '../../hooks/useAuth'
import { useAuthStore } from '../../stores/authStore'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

export default function LoginPage() {
  const navigate = useNavigate()
  const { user, profile } = useAuthStore()
  const { loading, step, email, sendOTP, verifyOTP, setStep } = useOTP()
  const [emailInput, setEmailInput] = useState('')
  const [otp, setOtp] = useState('')

  useEffect(() => {
    if (user && profile) {
      if (!profile.profile_completed) navigate('/onboarding', { replace: true })
      else navigate('/', { replace: true })
    }
  }, [user, profile, navigate])

  const handleSendOTP = async (e) => {
    e.preventDefault()
    await sendOTP(emailInput)
  }

  const handleVerifyOTP = async (e) => {
    e.preventDefault()
    const ok = await verifyOTP(otp)
    if (ok) {
      // authStore will pick up session via supabase listener
    }
  }

  return (
    <div className="min-h-dvh bg-surface flex flex-col">
      {/* Header */}
      <div className="bg-violet px-6 pt-16 pb-12 text-center">
        <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-4xl">🚀</span>
        </div>
        <h1 className="text-white text-2xl font-bold">Propulsion</h1>
        <p className="text-white/75 text-sm mt-1">Communauté africaine des bâtisseurs</p>
      </div>

      {/* Card */}
      <div className="flex-1 px-4 -mt-6">
        <div className="card p-6 shadow-xl">
          {step === 'email' ? (
            <>
              <h2 className="text-navy font-bold text-xl mb-1">Accéder à mon espace</h2>
              <p className="text-gray-500 text-sm mb-6">Saisis ton email pour recevoir ton code de connexion.</p>

              <form onSubmit={handleSendOTP} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-navy mb-1.5">Adresse email</label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      className="input pl-11"
                      placeholder="ton@email.com"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      required
                      autoComplete="email"
                      inputMode="email"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn-primary w-full"
                  disabled={loading || !emailInput}
                >
                  {loading ? <LoadingSpinner size="sm" /> : (
                    <>
                      Recevoir mon code
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </form>

              <p className="text-xs text-gray-400 text-center mt-6">
                Réservé aux membres Propulsion. Pas encore membre ?{' '}
                <span className="text-violet font-medium">Contacte un administrateur.</span>
              </p>
            </>
          ) : (
            <>
              <button
                onClick={() => setStep('email')}
                className="flex items-center gap-1 text-sm text-gray-500 mb-4 -ml-1"
              >
                <ChevronLeft size={18} /> Changer d'email
              </button>
              <h2 className="text-navy font-bold text-xl mb-1">Vérifie ta boîte mail</h2>
              <p className="text-gray-500 text-sm mb-6">
                Code envoyé à <strong className="text-navy">{email}</strong>. Saisis les 6 chiffres reçus.
              </p>

              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-navy mb-1.5">Code à 6 chiffres</label>
                  <input
                    type="text"
                    className="input text-center text-2xl font-bold tracking-widest"
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn-primary w-full"
                  disabled={loading || otp.length !== 6}
                >
                  {loading ? <LoadingSpinner size="sm" /> : 'Valider le code'}
                </button>
              </form>

              <button
                onClick={() => sendOTP(email)}
                className="text-sm text-violet text-center w-full mt-4"
                disabled={loading}
              >
                Renvoyer le code
              </button>
            </>
          )}
        </div>
      </div>

      <p className="text-center text-xs text-gray-400 py-6">
        © 2026 Propulsion · Dr. Claudel Noubissie
      </p>
    </div>
  )
}
