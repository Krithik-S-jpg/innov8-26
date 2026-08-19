import { useEffect, useState } from 'react'
import { HeartHandshake, Phone, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import AppShell from '../components/layout/AppShell'
import GlassCard from '../components/ui/GlassCard'
import Skeleton from '../components/ui/Skeleton'
import { useActivityLogger } from '../hooks/useActivityLogger'
import { resourcesApi } from '../services/api'

function ResourcesPage() {
  const [resources, setResources] = useState([])
  const [groundingSteps, setGroundingSteps] = useState([])
  const [loading, setLoading] = useState(true)
  useActivityLogger('resources')

  useEffect(() => {
    const loadResources = async () => {
      try {
        const [resourceResponse, groundingResponse] = await Promise.all([
          resourcesApi.getIndiaResources(),
          resourcesApi.getGroundingSteps(),
        ])
        setResources(Array.isArray(resourceResponse.data) ? resourceResponse.data : [])
        setGroundingSteps(Array.isArray(groundingResponse.data) ? groundingResponse.data : [])
      } catch (error) {
        toast.error(error?.response?.data || 'Unable to load support resources.')
      } finally {
        setLoading(false)
      }
    }

    loadResources()
  }, [])

  return (
    <AppShell title="Support Resources">
      <section className="mb-5">
        <GlassCard className="border-cyan-400/20 bg-cyan-500/10">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Support Resources</h2>
              <p className="mt-2 max-w-3xl text-sm text-cyan-50">
                Public helplines and grounding steps are available here even when someone needs quick access.
              </p>
            </div>
            <ShieldCheck className="text-cyan-200" size={34} />
          </div>
        </GlassCard>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_0.8fr]">
        <GlassCard>
          <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
            <Phone size={18} className="text-emerald-300" />
            India Helplines
          </h3>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {loading
              ? [1, 2, 3, 4].map((item) => (
                  <div key={item} className="rounded-xl border border-white/10 p-4">
                    <Skeleton className="h-5 w-36" />
                    <Skeleton className="mt-3 h-4 w-24" />
                    <Skeleton className="mt-3 h-10 w-full" />
                  </div>
                ))
              : resources.map((resource) => (
                  <article
                    key={`${resource.name}-${resource.phone}`}
                    className={`rounded-xl border p-4 ${
                      resource.emergency
                        ? 'border-red-400/30 bg-red-500/10'
                        : 'border-white/10 bg-slate-900/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h4 className="font-semibold text-white">{resource.name}</h4>
                      <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-slate-200">
                        {resource.availability}
                      </span>
                    </div>
                    <a href={`tel:${resource.phone}`} className="mt-3 inline-flex font-mono text-lg font-bold text-emerald-300">
                      {resource.phone}
                    </a>
                    <p className="mt-3 text-sm leading-6 text-slate-300">{resource.description}</p>
                  </article>
                ))}
          </div>
        </GlassCard>

        <GlassCard>
          <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
            <HeartHandshake size={18} className="text-violet-300" />
            Grounding Exercise
          </h3>
          <div className="mt-5 space-y-3">
            {loading
              ? [1, 2, 3, 4, 5].map((item) => <Skeleton key={item} className="h-12 w-full" />)
              : groundingSteps.map((step, index) => (
                  <div key={step} className="flex gap-3 rounded-xl border border-white/10 bg-slate-900/40 p-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-sm font-bold text-violet-200">
                      {index + 1}
                    </span>
                    <p className="text-sm leading-6 text-slate-200">{step}</p>
                  </div>
                ))}
          </div>
        </GlassCard>
      </section>
    </AppShell>
  )
}

export default ResourcesPage
