import { Link } from 'react-router-dom'
import AmbientBackground from '../background/AmbientBackground'

function AuthLayout({ title, subtitle, children, alternateText, alternateLink, alternateAction }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-10 text-slate-100">
      <AmbientBackground />
      <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.04] p-8 shadow-2xl shadow-black/30 backdrop-blur-xl">
        <Link to="/" className="inline-block text-xs uppercase tracking-[0.22em] text-blue-300 transition hover:text-blue-200">
          MindCare
        </Link>
        <h1 className="mt-3 text-3xl font-bold text-white">{title}</h1>
        <p className="mt-2 text-sm text-slate-300">{subtitle}</p>

        <div className="mt-8">{children}</div>

        <p className="mt-6 text-sm text-slate-300">
          {alternateText}{' '}
          <Link to={alternateLink} className="font-medium text-blue-300 transition hover:text-violet-300">
            {alternateAction}
          </Link>
        </p>
      </div>
    </div>
  )
}

export default AuthLayout
