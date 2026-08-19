import { useState } from 'react'
import { LifeBuoy } from 'lucide-react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import AppShell from '../components/layout/AppShell'
import GlassCard from '../components/ui/GlassCard'
import { useAuth } from '../context/AuthContext'
import { useActivityLogger } from '../hooks/useActivityLogger'
import { userApi } from '../services/api'

function SettingsPage() {
  const { user } = useAuth()
  const [email, setEmail] = useState('')
  const [saving, setSaving] = useState(false)
  useActivityLogger('settings')

  const handleSaveTrustedContact = async (e) => {
    e.preventDefault()

    if (!user?.userId) {
      toast.error('User ID is missing in JWT token payload.')
      return
    }

    if (!email) {
      toast.error('Please enter a valid email address.')
      return
    }

    setSaving(true)

    try {
      await userApi.setTrustedContact(user.userId, email)
      toast.success('Trusted contact saved successfully!')
      setEmail('')
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to save trusted contact.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppShell title="Settings">
      <div className="max-w-2xl">
        <GlassCard>
          <h2 className="text-2xl font-bold text-white">Settings</h2>

          <div className="mt-8 space-y-6">
            <section>
              <h3 className="mb-2 text-lg font-semibold text-white">Trusted Contact</h3>
              <p className="mb-4 text-sm text-slate-400">
                Add someone you trust. They will be notified if we detect you may need support. No details are shared — just a gentle nudge.
              </p>

              <form onSubmit={handleSaveTrustedContact} className="space-y-4">
                <div>
                  <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-200">
                    Trusted contact email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="someone@example.com"
                    className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3 text-slate-100 outline-none transition duration-300 placeholder:text-slate-500 focus:border-blue-400/70 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 px-6 py-2.5 text-sm font-semibold text-white transition duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/40 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </form>
            </section>

            <section className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-4">
              <div className="flex items-start gap-3">
                <LifeBuoy size={20} className="mt-0.5 text-emerald-300" />
                <div>
                  <h3 className="text-lg font-semibold text-white">Safety Plan</h3>
                  <p className="mt-2 text-sm leading-6 text-emerald-50">
                    Add coping steps, safe places, and emergency contacts so support is ready when you need it.
                  </p>
                  <Link
                    to="/safety-plan"
                    className="mt-4 inline-flex rounded-xl border border-emerald-300/30 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-400/10"
                  >
                    Open Safety Plan
                  </Link>
                </div>
              </div>
            </section>
          </div>
        </GlassCard>
      </div>
    </AppShell>
  )
}

export default SettingsPage
