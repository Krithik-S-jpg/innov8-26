import { useEffect, useState } from 'react'
import { LifeBuoy, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import AppShell from '../components/layout/AppShell'
import GlassCard from '../components/ui/GlassCard'
import Skeleton from '../components/ui/Skeleton'
import { useAuth } from '../context/AuthContext'
import { useActivityLogger } from '../hooks/useActivityLogger'
import { safetyPlanApi } from '../services/api'

const initialPlan = {
  warningSigns: '',
  copingStrategies: '',
  safePlaces: '',
  peopleToContact: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  professionalContact: '',
  reasonsToStaySafe: '',
}

const fieldGroups = [
  {
    title: 'When I Need Support',
    fields: [
      ['warningSigns', 'Warning signs', 'Thoughts, feelings, or behaviors that tell you support may be needed.'],
      ['copingStrategies', 'Coping strategies', 'Small actions that help you stay grounded.'],
      ['safePlaces', 'Safe places', 'Places where you feel calmer or less alone.'],
    ],
  },
  {
    title: 'People And Contacts',
    fields: [
      ['peopleToContact', 'People to contact', 'Friends, family, mentors, or trusted people.'],
      ['emergencyContactName', 'Emergency contact name', 'Name of your primary support contact.'],
      ['emergencyContactPhone', 'Emergency contact phone', 'Phone number for urgent support.'],
      ['professionalContact', 'Professional contact', 'Counsellor, therapist, doctor, or local support service.'],
    ],
  },
  {
    title: 'Reasons To Stay Safe',
    fields: [['reasonsToStaySafe', 'Reasons to stay safe', 'People, hopes, places, goals, or moments worth holding onto.']],
  },
]

function SafetyPlanPage() {
  const { user } = useAuth()
  const [plan, setPlan] = useState(initialPlan)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  useActivityLogger('safety-plan')

  useEffect(() => {
    const loadPlan = async () => {
      if (!user?.userId) {
        setLoading(false)
        return
      }

      try {
        const response = await safetyPlanApi.getSafetyPlan(user.userId)
        setPlan({ ...initialPlan, ...response.data })
      } catch (error) {
        toast.error(error?.response?.data || 'Unable to load your safety plan.')
      } finally {
        setLoading(false)
      }
    }

    loadPlan()
  }, [user?.userId])

  const updateField = (field, value) => {
    setPlan((current) => ({ ...current, [field]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!user?.userId) {
      toast.error('User ID is missing in JWT token payload.')
      return
    }

    setSaving(true)

    try {
      const response = await safetyPlanApi.saveSafetyPlan(user.userId, plan)
      setPlan({ ...initialPlan, ...response.data })
      toast.success('Safety plan saved.')
    } catch (error) {
      toast.error(error?.response?.data || 'Unable to save your safety plan.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppShell title="Safety Plan">
      <div className="grid gap-5 xl:grid-cols-[1fr_0.7fr]">
        <GlassCard>
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-emerald-500/15 p-3 text-emerald-300">
              <LifeBuoy size={22} />
            </span>
            <div>
              <h2 className="text-2xl font-bold text-white">Personal Safety Plan</h2>
              <p className="mt-1 text-sm text-slate-300">Keep your support steps ready before difficult moments arrive.</p>
            </div>
          </div>

          {loading ? (
            <div className="mt-8 space-y-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-8 space-y-8">
              {fieldGroups.map((group) => (
                <section key={group.title}>
                  <h3 className="text-lg font-semibold text-white">{group.title}</h3>
                  <div className="mt-4 grid gap-4">
                    {group.fields.map(([field, label, placeholder]) => (
                      <label key={field} className="block">
                        <span className="mb-2 block text-sm font-medium text-slate-200">{label}</span>
                        <textarea
                          value={plan[field] || ''}
                          onChange={(event) => updateField(field, event.target.value)}
                          placeholder={placeholder}
                          rows={field.includes('Contact') || field === 'professionalContact' ? 2 : 4}
                          className="w-full rounded-xl border border-white/10 bg-slate-900/70 p-4 text-sm text-slate-100 outline-none transition duration-300 placeholder:text-slate-500 focus:border-emerald-400/70 focus:ring-2 focus:ring-emerald-500/20"
                        />
                      </label>
                    ))}
                  </div>
                </section>
              ))}

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save size={16} />
                {saving ? 'Saving...' : 'Save Safety Plan'}
              </button>
            </form>
          )}
        </GlassCard>

        <GlassCard className="h-fit border-emerald-400/20 bg-emerald-500/10">
          <h3 className="text-lg font-semibold text-white">Quick Reminder</h3>
          <div className="mt-4 space-y-3 text-sm leading-6 text-emerald-50">
            <p>Move near another person or a safer public space when your warning signs show up.</p>
            <p>Use the people and contacts list before things feel urgent.</p>
            <p>If there is immediate danger, call local emergency services right away.</p>
          </div>
        </GlassCard>
      </div>
    </AppShell>
  )
}

export default SafetyPlanPage
