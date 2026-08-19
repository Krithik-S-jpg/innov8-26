import { useEffect, useMemo, useState } from 'react'
import { Bot, TrendingUp } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import AppShell from '../components/layout/AppShell'
import GlassCard from '../components/ui/GlassCard'
import Skeleton from '../components/ui/Skeleton'
import { useAuth } from '../context/AuthContext'
import { useActivityLogger } from '../hooks/useActivityLogger'
import { moodApi } from '../services/api'
import { formatDate } from '../utils/mood'

const Heatmap = ({ entries }) => {
  const map = new Map()

  entries.forEach((entry) => {
    const key = new Date(entry.createdAt).toISOString().slice(0, 10)
    const existing = map.get(key)

    if (existing) {
      map.set(key, { score: (existing.score + Number(entry.moodScore || 0)) / 2 })
    } else {
      map.set(key, { score: Number(entry.moodScore || 0) })
    }
  })

  const days = Array.from({ length: 28 }, (_, index) => {
    const date = new Date()
    date.setDate(date.getDate() - (27 - index))
    const key = date.toISOString().slice(0, 10)
    const score = map.get(key)?.score || 0
    const opacity = score ? Math.max(0.25, score / 10) : 0.08

    return { key, score, opacity }
  })

  return (
    <div className="grid grid-cols-7 gap-2">
      {days.map((day) => (
        <div
          key={day.key}
          title={`${day.key} - score ${day.score || 0}`}
          className="aspect-square rounded-md border border-white/10 transition hover:scale-105"
          style={{ backgroundColor: `rgba(59,130,246,${day.opacity})` }}
        />
      ))}
    </div>
  )
}

function AnalyticsPage() {
  const { user } = useAuth()
  const [entries, setEntries] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  useActivityLogger('analytics')

  useEffect(() => {
    const loadData = async () => {
      if (!user?.userId) {
        setLoading(false)
        return
      }

      try {
        const [analyticsResponse, moodResponse] = await Promise.all([
          moodApi.getAnalytics(user.userId),
          moodApi.getMoodByUser(user.userId),
        ])

        setAnalytics(analyticsResponse.data)
        const rows = Array.isArray(moodResponse.data) ? moodResponse.data : []
        setEntries(rows.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)))
      } catch (error) {
        toast.error(error?.response?.data || 'Unable to fetch analytics data.')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user?.userId])

  const trendData = useMemo(
    () =>
      entries.map((item) => ({
        date: formatDate(item.createdAt),
        mood: Number(item.moodScore),
      })),
    [entries],
  )

  const trend = useMemo(() => {
    if (entries.length < 2) {
      return 0
    }

    const midpoint = Math.floor(entries.length / 2)
    const firstHalf = entries.slice(0, midpoint)
    const secondHalf = entries.slice(midpoint)

    const avg = (arr) => arr.reduce((sum, item) => sum + Number(item.moodScore || 0), 0) / arr.length

    return Number((avg(secondHalf) - avg(firstHalf)).toFixed(1))
  }, [entries])

  const metrics = [
    {
      label: 'Total Entries',
      value: analytics?.totalEntries ?? 0,
      extra: trend ? `${trend > 0 ? '+' : ''}${trend} trend shift` : 'No trend yet',
    },
    {
      label: 'Average Mood Score',
      value: analytics?.averageMoodScore ? Number(analytics.averageMoodScore).toFixed(1) : '0.0',
      extra: 'Score range 1-10',
    },
    {
      label: 'Highest Mood',
      value: analytics?.highestMood ?? 0,
      extra: 'Best recorded day',
    },
    {
      label: 'Lowest Mood',
      value: analytics?.lowestMood ?? 0,
      extra: 'Support opportunity',
    },
  ]

  const averageProgress = Math.min(100, Math.round(((analytics?.averageMoodScore || 0) / 10) * 100))
  const circumference = 2 * Math.PI * 42
  const strokeOffset = circumference - (averageProgress / 100) * circumference

  return (
    <AppShell title="Analytics">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {loading
          ? [1, 2, 3, 4].map((item) => (
              <GlassCard key={item}>
                <Skeleton className="h-4 w-24" />
                <Skeleton className="mt-3 h-8 w-20" />
                <Skeleton className="mt-3 h-4 w-32" />
              </GlassCard>
            ))
          : metrics.map((metric) => (
              <GlassCard key={metric.label} className="hover:-translate-y-1">
                <p className="text-sm text-slate-300">{metric.label}</p>
                <p className="mt-2 text-3xl font-bold text-white">{metric.value}</p>
                <p className="mt-2 flex items-center gap-1 text-xs text-blue-300">
                  <TrendingUp size={12} />
                  {metric.extra}
                </p>
              </GlassCard>
            ))}
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <GlassCard>
          <h3 className="text-lg font-semibold text-white">Mood Trend</h3>
          <div className="mt-4 h-72">
            {loading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid stroke="rgba(148,163,184,0.2)" strokeDasharray="4 4" />
                  <XAxis dataKey="date" tick={{ fill: '#cbd5e1', fontSize: 12 }} minTickGap={18} />
                  <YAxis tick={{ fill: '#cbd5e1', fontSize: 12 }} domain={[1, 10]} />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(15, 23, 42, 0.95)',
                      border: '1px solid rgba(148, 163, 184, 0.3)',
                      borderRadius: 12,
                    }}
                  />
                  <Line type="monotone" dataKey="mood" stroke="#3B82F6" strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </GlassCard>

        <GlassCard>
          <h3 className="text-lg font-semibold text-white">Average Mood Progress</h3>
          <div className="mt-6 flex items-center justify-center">
            {loading ? (
              <Skeleton className="h-36 w-36 rounded-full" />
            ) : (
              <svg width="120" height="120" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="42" fill="none" stroke="rgba(148,163,184,0.25)" strokeWidth="10" />
                <circle
                  cx="60"
                  cy="60"
                  r="42"
                  fill="none"
                  stroke="#8B5CF6"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeOffset}
                  transform="rotate(-90 60 60)"
                  className="transition-all duration-700"
                />
                <text x="60" y="66" textAnchor="middle" className="fill-white text-xl font-bold">
                  {averageProgress}%
                </text>
              </svg>
            )}
          </div>
          <p className="mt-4 text-center text-sm text-slate-300">Overall emotional baseline for the selected period.</p>
        </GlassCard>
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <GlassCard>
          <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
            <Bot size={18} className="text-violet-300" /> MindCare AI Insight
          </h3>
          <p className="mt-4 rounded-xl border border-violet-400/20 bg-violet-500/10 p-4 text-sm text-violet-100">
            MindCare AI says: {analytics?.message || 'Track more entries to unlock a personalized insight.'}
          </p>
        </GlassCard>

        <GlassCard>
          <h3 className="text-lg font-semibold text-white">Weekly Mood Heatmap</h3>
          <p className="mt-2 text-sm text-slate-300">Last 28 days activity map</p>
          <div className="mt-5">
            {loading ? <Skeleton className="h-40 w-full" /> : <Heatmap entries={entries} />}
          </div>
        </GlassCard>
      </section>
    </AppShell>
  )
}

export default AnalyticsPage
