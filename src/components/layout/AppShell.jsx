import { useMemo, useState } from 'react'
import { BarChart3, Cog, HeartHandshake, House, LifeBuoy, LogOut, MessageCircle, Menu, Smile, X } from 'lucide-react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: House },
  { to: '/mood', label: 'Mood Tracker', icon: Smile },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/chat', label: 'Peer Support', icon: MessageCircle },
  { to: '/safety-plan', label: 'Safety Plan', icon: LifeBuoy },
  { to: '/resources', label: 'Resources', icon: HeartHandshake },
  { to: '/settings', label: 'Settings', icon: Cog },
]

function AppShell({ children, title }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const greeting = useMemo(() => {
    const hour = new Date().getHours()

    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-50">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.15),transparent_35%),radial-gradient(circle_at_80%_10%,rgba(139,92,246,0.16),transparent_30%),linear-gradient(170deg,#0f172a_0%,#111a30_65%,#0f172a_100%)]" />

      <div className="relative mx-auto flex min-h-screen max-w-7xl">
        <aside
          className={`fixed inset-y-0 left-0 z-40 h-screen w-72 transform overflow-y-auto border-r border-white/10 bg-slate-900/85 p-4 backdrop-blur-xl transition-transform duration-300 lg:translate-x-0 ${
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="mb-8 flex items-center justify-between">
            <Link to="/dashboard" className="text-2xl font-bold tracking-tight text-white">
              MindCare
            </Link>
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="rounded-xl border border-white/10 p-2 text-slate-300 transition hover:bg-white/10 lg:hidden"
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
          </div>

          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-500/30 to-violet-500/30 text-white shadow-lg shadow-blue-500/10'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`
                  }
                >
                  <Icon size={18} className="transition-transform duration-300 group-hover:scale-110" />
                  {item.label}
                </NavLink>
              )
            })}
          </nav>
        </aside>

        {mobileOpen ? (
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-30 bg-black/40 lg:hidden"
            aria-label="Close menu overlay"
          />
        ) : null}

        <div className="relative z-10 flex min-h-screen flex-1 flex-col px-4 py-4 md:px-6 lg:ml-72">
          <header className="glass-card mb-5 flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="rounded-xl border border-white/10 p-2 text-slate-300 transition hover:bg-white/10 lg:hidden"
                onClick={() => setMobileOpen(true)}
                aria-label="Open menu"
              >
                <Menu size={18} />
              </button>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{location.pathname.replace('/', '') || 'home'}</p>
                <h1 className="text-xl font-bold text-white">{title}</h1>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden text-right sm:block">
                <p className="text-sm text-slate-300">{greeting}</p>
                <p className="text-sm font-semibold text-white">{user?.name || 'MindCare User'}</p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="group inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-200 transition hover:border-red-400/50 hover:text-red-300"
              >
                <LogOut size={16} className="transition-transform duration-300 group-hover:-translate-x-0.5" />
                Logout
              </button>
            </div>
          </header>

          <main className="pb-6">{children}</main>
        </div>
      </div>
    </div>
  )
}

export default AppShell
