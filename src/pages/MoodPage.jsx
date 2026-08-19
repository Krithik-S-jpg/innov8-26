import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import AppShell from '../components/layout/AppShell'
import GlassCard from '../components/ui/GlassCard'
import Skeleton from '../components/ui/Skeleton'
import { useAuth } from '../context/AuthContext'
import { useActivityLogger, useTypingSpeedTracker } from '../hooks/useActivityLogger'
import { moodApi } from '../services/api'
import { formatDate, getMoodTone } from '../utils/mood'

const MAX_NOTE_LENGTH = 280

function MoodPage() {
  const { user } = useAuth()
  const [score, setScore] = useState(6)
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [history, setHistory] = useState([])

  useActivityLogger('mood')
  const { handleTyping, reset: resetTypingTracker } = useTypingSpeedTracker()

  useEffect(() => {
    const loadHistory = async () => {
      if (!user?.userId) {
        setLoading(false)
        return
      }

      try {
        const response = await moodApi.getMoodByUser(user.userId)
        const rows = Array.isArray(response.data) ? response.data : []
        setHistory(rows.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)))
      } catch (error) {
        toast.error(error?.response?.data || 'Unable to fetch mood history.')
      } finally {
        setLoading(false)
      }
    }

    loadHistory()
  }, [user?.userId])

  const tone = useMemo(() => getMoodTone(score), [score])

  const handleSave = async (event) => {
    event.preventDefault()

    if (!user?.userId) {
      toast.error('User ID is missing in JWT token payload.')
      return
    }

    setSaving(true)

    try {
      await moodApi.addMood({ userId: user.userId, moodScore: score, note })
      toast.success('Mood saved successfully.')

      const response = await moodApi.getMoodByUser(user.userId)
      const rows = Array.isArray(response.data) ? response.data : []
      setHistory(rows.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)))
      setNote('')
      resetTypingTracker()
    } catch (error) {
      toast.error(error?.response?.data || 'Unable to save mood.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppShell title="Mood Tracker">
      <section className="mb-5 grid gap-5 xl:grid-cols-[1.2fr_1fr]">
        <GlassCard className="bg-gradient-to-br from-slate-900/70 to-slate-800/60">
          <h2 className="text-xl font-semibold text-white">How are you feeling right now?</h2>
          <p className="mt-2 text-sm text-slate-300">Pick a score from 1 to 10 and describe what is influencing your state.</p>

          <form className="mt-6 space-y-5" onSubmit={handleSave}>
            <div className={`rounded-2xl border border-white/10 bg-gradient-to-br ${tone.gradient} p-4`}>
              <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
                {Array.from({ length: 10 }, (_, index) => index + 1).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setScore(value)}
                    className={`rounded-xl border px-3 py-3 text-sm font-semibold transition duration-300 ${
                      score === value
                        ? 'border-blue-300 bg-blue-400/30 text-white shadow-md shadow-blue-500/30'
                        : 'border-white/10 bg-slate-900/50 text-slate-300 hover:border-white/25 hover:text-white'
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
              <p className={`mt-4 text-sm font-medium ${tone.text}`}>{tone.label}</p>
            </div>

            <div>
              <label htmlFor="mood-note" className="mb-2 block text-sm font-medium text-slate-200">
                Note
              </label>
              <textarea
                id="mood-note"
                value={note}
                maxLength={MAX_NOTE_LENGTH}
                onChange={(event) => {
                  setNote(event.target.value)
                  handleTyping(event.target.value)
                }}
                placeholder="Describe your thoughts, triggers, or highlights from today..."
                className="h-36 w-full rounded-xl border border-white/10 bg-slate-900/70 p-4 text-sm text-slate-100 outline-none transition duration-300 focus:border-blue-400/70 focus:ring-2 focus:ring-blue-500/20"
              />
              <p className="mt-2 text-right text-xs text-slate-400">
                {note.length}/{MAX_NOTE_LENGTH}
              </p>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 px-5 py-3 text-sm font-semibold text-white transition duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/40 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Save Entry'}
            </button>
          </form>
        </GlassCard>

        <GlassCard>
          <h3 className="text-lg font-semibold text-white">Current Score</h3>
          <p className="mt-3 text-6xl font-bold text-white">{score}</p>
          <div className="mt-4 h-3 rounded-full bg-slate-800">
            <div
              className="h-3 rounded-full bg-gradient-to-r from-blue-400 via-violet-400 to-cyan-300 transition-all duration-500"
              style={{ width: `${score * 10}%` }}
            />
          </div>
          <p className="mt-3 text-sm text-slate-300">Tracking consistency and honest notes creates better analytics over time.</p>
        </GlassCard>
      </section>

      <section>
        <GlassCard>
          <h3 className="text-lg font-semibold text-white">History</h3>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {loading
              ? [1, 2, 3, 4].map((item) => (
                  <div key={item} className="rounded-xl border border-white/10 p-4">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="mt-2 h-3 w-full" />
                    <Skeleton className="mt-3 h-2 w-full" />
                  </div>
                ))
              : null}

            {!loading && history.length === 0 ? (
              <p className="rounded-xl border border-white/10 p-4 text-sm text-slate-300">No mood history yet.</p>
            ) : null}

            {!loading
              ? history.map((entry) => (
                  <article
                    key={entry.id || `${entry.createdAt}-${entry.moodScore}`}
                    className="rounded-xl border border-white/10 bg-slate-900/40 p-4 transition duration-300 hover:-translate-y-0.5 hover:border-blue-400/30"
                  >
                    <div className="flex items-center justify-between text-sm">
                      <p className="font-semibold text-white">{formatDate(entry.createdAt)}</p>
                      <p className="text-slate-300">Score {entry.moodScore}/10</p>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-slate-800">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-violet-500"
                        style={{ width: `${Number(entry.moodScore) * 10}%` }}
                      />
                    </div>
                    <p className="mt-3 max-h-10 overflow-hidden text-sm text-slate-300">{entry.note || 'No note provided.'}</p>
                  </article>
                ))
              : null}
          </div>
        </GlassCard>
      </section>
    </AppShell>
  )
}

export default MoodPage
