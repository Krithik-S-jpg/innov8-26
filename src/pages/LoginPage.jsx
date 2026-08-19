import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import AuthLayout from '../components/layout/AuthLayout'
import FloatingInput from '../components/ui/FloatingInput'
import { useAuth } from '../context/AuthContext'

function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [submitting, setSubmitting] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const from = location.state?.from || '/dashboard'

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)

    try {
      await login(form.email.trim(), form.password)
      navigate(from, { replace: true })
    } catch (error) {
      toast.error(error?.response?.data || error?.message || 'Unable to sign in.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Sign in"
      subtitle="Access your MindCare dashboard and continue your daily wellness tracking."
      alternateText="Need an account?"
      alternateLink="/register"
      alternateAction="Create one"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
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
          autoComplete="current-password"
          value={form.password}
          onChange={(event) => setForm((previous) => ({ ...previous, password: event.target.value }))}
        />

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 px-4 py-3 text-sm font-semibold text-white transition duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-600/40 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </AuthLayout>
  )
}

export default LoginPage
