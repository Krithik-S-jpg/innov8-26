import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import AuthLayout from '../components/layout/AuthLayout'
import FloatingInput from '../components/ui/FloatingInput'
import { useAuth } from '../context/AuthContext'

const getStrength = (password) => {
  let score = 0
  if (password.length >= 8) score += 1
  if (/[A-Z]/.test(password)) score += 1
  if (/[0-9]/.test(password)) score += 1
  if (/[^A-Za-z0-9]/.test(password)) score += 1

  if (score <= 1) return { label: 'Weak', width: '25%', color: 'bg-red-500' }
  if (score === 2) return { label: 'Fair', width: '50%', color: 'bg-amber-500' }
  if (score === 3) return { label: 'Good', width: '75%', color: 'bg-blue-500' }
  return { label: 'Strong', width: '100%', color: 'bg-emerald-500' }
}

function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [submitting, setSubmitting] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const strength = useMemo(() => getStrength(form.password), [form.password])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)

    try {
      await register(form.name.trim(), form.email.trim(), form.password)
      navigate('/login', { replace: true })
    } catch (error) {
      toast.error(error?.response?.data || error?.message || 'Registration failed.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Create account"
      subtitle="Set up your secure profile and start tracking your daily emotional health."
      alternateText="Already have an account?"
      alternateLink="/login"
      alternateAction="Sign in"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FloatingInput
          id="name"
          label="Full Name"
          autoComplete="name"
          value={form.name}
          onChange={(event) => setForm((previous) => ({ ...previous, name: event.target.value }))}
        />
        <FloatingInput
          id="email"
          type="email"
          label="Email"
          autoComplete="email"
          value={form.email}
          onChange={(event) => setForm((previous) => ({ ...previous, email: event.target.value }))}
        />
        <FloatingInput
          id="password"
          type="password"
          label="Password"
          autoComplete="new-password"
          value={form.password}
          onChange={(event) => setForm((previous) => ({ ...previous, password: event.target.value }))}
        />

        <div>
          <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
            <span>Password strength</span>
            <span>{form.password ? strength.label : 'Enter a password'}</span>
          </div>
          <div className="h-2 rounded-full bg-slate-800">
            <div
              className={`h-2 rounded-full ${strength.color} transition-all duration-300`}
              style={{ width: form.password ? strength.width : '0%' }}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 px-4 py-3 text-sm font-semibold text-white transition duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-600/40 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Creating account...' : 'Create Account'}
        </button>
      </form>
    </AuthLayout>
  )
}

export default RegisterPage
