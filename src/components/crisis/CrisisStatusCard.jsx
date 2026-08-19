import { useEffect, useState } from 'react'
import { AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import GlassCard from '../ui/GlassCard'
import { useAuth } from '../../context/AuthContext'
import { crisisApi, resourcesApi } from '../../services/api'

function CrisisStatusCard() {
  const { user } = useAuth()
  const [crisisData, setCrisisData] = useState(null)
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkCrisisStatus = async () => {
      if (!user?.userId) {
        setLoading(false)
        return
      }

      try {
        const [response, resourceResponse] = await Promise.all([
          crisisApi.checkCrisisStatus(user.userId),
          resourcesApi.getIndiaResources(),
        ])
        setCrisisData(response.data)
        setResources(Array.isArray(resourceResponse.data) ? resourceResponse.data : [])
      } catch (error) {
        toast.error(error?.response?.data?.message || 'Unable to check crisis status.')
      } finally {
        setLoading(false)
      }
    }

    checkCrisisStatus()
  }, [user?.userId])

  if (loading || !crisisData) {
    return (
      <GlassCard className="animate-pulse">
        <div className="h-32 bg-slate-800/50 rounded-xl" />
      </GlassCard>
    )
  }

  const crisisLevel = crisisData.crisisLevel || 'LOW'
  const message = crisisData.message || "You're doing well"

  let bgGradient = 'from-green-500/20 to-emerald-500/20'
  let borderColor = 'border-green-400/30'
  let badgeColor = 'bg-green-500/20 text-green-300'
  let messageColor = 'text-green-300'
  let isPulsing = false

  if (crisisLevel === 'MEDIUM') {
    bgGradient = 'from-yellow-500/20 to-orange-500/20'
    borderColor = 'border-yellow-400/30'
    badgeColor = 'bg-yellow-500/20 text-yellow-300'
    messageColor = 'text-yellow-300'
  } else if (crisisLevel === 'HIGH') {
    bgGradient = 'from-red-500/20 to-rose-500/20'
    borderColor = 'border-red-400/30'
    badgeColor = 'bg-red-500/20 text-red-300'
    messageColor = 'text-red-300'
    isPulsing = true
  }

  return (
    <GlassCard className={`bg-gradient-to-br ${bgGradient} border ${borderColor} ${isPulsing ? 'animate-pulse' : ''}`}>
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Wellness Check</h3>
          <p className={`mt-2 text-sm ${messageColor}`}>{message}</p>
        </div>
        <div className={`rounded-lg border border-white/10 px-3 py-1 text-xs font-medium ${badgeColor}`}>
          {crisisLevel}
        </div>
      </div>

      {crisisLevel === 'HIGH' && (
        <div className="mt-4 rounded-lg border border-red-400/30 bg-red-900/20 p-4">
          <div className="mb-3 flex items-center gap-2">
            <AlertCircle size={18} className="text-red-300" />
            <p className="font-medium text-red-200">Crisis Helplines</p>
          </div>
          <div className="space-y-2 text-sm text-red-100">
            {resources.slice(0, 4).map((resource) => (
              <p key={`${resource.name}-${resource.phone}`}>
                <strong>{resource.name}:</strong> <span className="font-mono">{resource.phone}</span>
              </p>
            ))}
          </div>
        </div>
      )}

      <p className="mt-3 text-xs text-slate-400">This is checked automatically based on your mood patterns</p>
    </GlassCard>
  )
}

export default CrisisStatusCard
