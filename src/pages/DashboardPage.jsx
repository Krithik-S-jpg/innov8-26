import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, CalendarDays, ChartColumn, Flame, HeartPulse, LifeBuoy, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import AppShell from '../components/layout/AppShell'
import CrisisStatusCard from '../components/crisis/CrisisStatusCard'
import GlassCard from '../components/ui/GlassCard'
import Skeleton from '../components/ui/Skeleton'
import { useAuth } from '../context/AuthContext'
import { useActivityLogger } from '../hooks/useActivityLogger'
import { moodApi, wellnessApi } from '../services/api'
import { averageMood, calculateStreak, formatDate } from '../utils/mood'

function DashboardPage() {
  const { user } = useAuth()
  const [entries, setEntries] = useState([])
  const [wellness, setWellness] = useState(null)
  const [loading, setLoading] = useState(true)
  useActivityLogger('dashboard')

  useEffect(() => {
    const loadEntries = async () => {
      if (!user?.userId) {
        setLoading(false)
        return
      }

      try {
        const [moodResponse, wellnessResponse] = await Promise.all([
          moodApi.getMoodByUser(user.userId),
          wellnessApi.getDashboard(user.userId),
        ])
        setEntries(Array.isArray(moodResponse.data) ? moodResponse.data : [])
        setWellness(wellnessResponse.data || null)
      } catch (error) {
        toast.error(error?.response?.data || 'Unable to load mood entries.')
      } finally {
        setLoading(false)
      }
    }

    loadEntries()
  }, [user?.userId])

  const metrics = useMemo(() => {
    const totalEntries = entries.length
    const avgScore = wellness?.sevenDayAverage || averageMood(entries)
    const streak = wellness?.checkInStreakDays ?? calculateStreak(entries)

    return [
      { label: 'Total Mood Entries', value: totalEntries, icon: CalendarDays },
      { label: '7 Day Average', value: avgScore, icon: ChartColumn },
      { label: 'Current Streak', value: `${streak} day${streak === 1 ? '' : 's'}`, icon: Flame },
    ]
  }, [entries, wellness])

  const recentEntries = entries.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5)
  const trendLabel = wellness?.moodTrend?.replaceAll('_', ' ') || 'NO DATA'
  const recommendations = Array.isArray(wellness?.recommendations) ? wellness.recommendations : []
  const quickActions = Array.isArray(wellness?.quickActions) ? wellness.quickActions : []

  const actionLinks = {
    LOG_MOOD: { label: 'Log Mood', to: '/mood' },
    CREATE_SAFETY_PLAN: { label: 'Create Safety Plan', to: '/safety-plan' },
    OPEN_SAFETY_PLAN: { label: 'Open Safety Plan', to: '/safety-plan' },
    OPEN_CHAT: { label: 'Open Peer Chat', to: '/chat' },
    BREATHING_EXERCISE: { label: 'Breathing Exercise', to: '/resources' },
    CALL_SUPPORT: { label: 'Support Resources', to: '/resources' },
  }

  return (
    <AppShell title="Dashboard">
      {!user?.userId ? (
        <GlassCard>
          <h2 className="text-lg font-semibold text-white">User ID missing from token</h2>
          <p className="mt-2 text-sm text-slate-300">
            Your backend token should include userId, id, or uid claim so protected mood endpoints can be called.
          </p>
        </GlassCard>
      ) : null}

      <div className="mb-5">
        <GlassCard className="bg-gradient-to-r from-blue-500/10 to-violet-500/10">
          <h2 className="text-2xl font-bold text-white">Good morning, {user?.name || 'MindCare User'}.</h2>
          <p className="mt-2 text-sm text-slate-300">How are you feeling today?</p>
          <Link
            to="/mood"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 px-4 py-2 text-sm font-medium text-white transition duration-300 hover:-translate-y-0.5"
          >
            Log Today&apos;s Mood
            <ArrowRight size={16} />
          </Link>
        </GlassCard>
      </div>

      <section className="mb-5 grid gap-4 md:grid-cols-3">
        {loading
          ? [1, 2, 3].map((item) => (
              <GlassCard key={item}>
                <Skeleton className="h-6 w-24" />
                <Skeleton className="mt-4 h-8 w-20" />
              </GlassCard>
            ))
          : metrics.map((metric) => {
              const Icon = metric.icon

              return (
                <GlassCard key={metric.label} className="group hover:-translate-y-1">
                  <p className="text-sm text-slate-300">{metric.label}</p>
                  <div className="mt-3 flex items-center gap-3">
                    <span className="text-2xl font-bold text-white">{metric.value}</span>
                    <Icon size={16} className="text-blue-300 transition-transform duration-300 group-hover:scale-110" />
                  </div>
                </GlassCard>
              )
            })}
      </section>

      <section className="mb-5">
        <CrisisStatusCard />
      </section>

      <section className="mb-5 grid gap-5 xl:grid-cols-[1fr_0.8fr]">
        <GlassCard>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
                <Sparkles size={18} className="text-cyan-300" />
                Wellness Suggestions
              </h3>
              <p className="mt-2 text-sm text-slate-300">Mood trend: {trendLabel}</p>
            </div>
            <HeartPulse className="text-rose-300" size={26} />
          </div>

          <div className="mt-4 space-y-3">
            {loading
              ? [1, 2].map((item) => <Skeleton key={item} className="h-14 w-full" />)
              : recommendations.map((item) => (
                  <p key={item} className="rounded-xl border border-white/10 bg-slate-900/40 p-4 text-sm leading-6 text-slate-200">
                    {item}
                  </p>
                ))}

            {!loading && recommendations.length === 0 ? (
              <p className="rounded-xl border border-white/10 p-4 text-sm text-slate-300">
                Add a mood entry to unlock personalized suggestions.
              </p>
            ) : null}
          </div>
        </GlassCard>

        <GlassCard>
          <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
            <LifeBuoy size={18} className="text-emerald-300" />
            Quick Actions
          </h3>

          <div className="mt-4 grid gap-3">
            {loading
              ? [1, 2, 3].map((item) => <Skeleton key={item} className="h-12 w-full" />)
              : quickActions.map((action) => {
                  const target = actionLinks[action] || { label: action.replaceAll('_', ' '), to: '/dashboard' }

                  return (
                    <Link
                      key={action}
                      to={target.to}
                      className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-900/40 px-4 py-3 text-sm font-medium text-slate-100 transition hover:border-emerald-400/40 hover:bg-emerald-500/10"
                    >
                      {target.label}
                      <ArrowRight size={16} />
                    </Link>
                  )
                })}
          </div>

          <p className="mt-4 rounded-xl border border-cyan-400/20 bg-cyan-500/10 p-4 text-sm leading-6 text-cyan-50">
            {wellness?.breathingExercise || 'Try a short breathing exercise when things feel heavy.'}
          </p>
        </GlassCard>
      </section>

      <section>
        <GlassCard>
          <h3 className="text-lg font-semibold text-white">Recent Mood Entries</h3>

          <div className="mt-4 space-y-3">
            {loading
              ? [1, 2, 3, 4, 5].map((item) => (
                  <div key={item} className="rounded-xl border border-white/10 p-4">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="mt-2 h-4 w-full" />
                  </div>
                ))
              : null}

            {!loading && recentEntries.length === 0 ? (
              <p className="rounded-xl border border-white/10 p-4 text-sm text-slate-300">
                No entries yet. Start by logging your first mood.
              </p>
            ) : null}

            {!loading
              ? recentEntries.map((entry) => (
                  <article key={entry.id || `${entry.createdAt}-${entry.moodScore}`} className="rounded-xl border border-white/10 bg-slate-900/40 p-4 transition hover:border-blue-400/30">
                    <div className="flex items-center justify-between text-sm">
                      <p className="font-medium text-white">Score {entry.moodScore}/10</p>
                      <p className="text-slate-400">{formatDate(entry.createdAt)}</p>
                    </div>
                    <p className="mt-2 text-sm text-slate-300">{entry.note || 'No note for this entry.'}</p>
                  </article>
                ))
              : null}
          </div>
        </GlassCard>
      </section>
    </AppShell>
  )
}

export default DashboardPage
