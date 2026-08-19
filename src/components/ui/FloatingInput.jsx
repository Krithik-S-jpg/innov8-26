import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

function FloatingInput({ id, label, type = 'text', value, onChange, autoComplete, required = true }) {
  const isPasswordField = type === 'password'
  const [showPassword, setShowPassword] = useState(false)
  const resolvedType = isPasswordField && showPassword ? 'text' : type

  return (
    <label htmlFor={id} className="group relative block">
      <input
        id={id}
        type={resolvedType}
        value={value}
        autoComplete={autoComplete}
        onChange={onChange}
        required={required}
        placeholder=" "
        className="peer w-full rounded-xl border border-white/15 bg-slate-900/65 px-4 pb-3 pt-6 text-sm text-slate-100 outline-none transition duration-300 focus:border-blue-400/70 focus:ring-2 focus:ring-blue-500/20 pr-12"
      />
      <span className="pointer-events-none absolute left-4 top-4 origin-left text-sm text-slate-400 transition-all duration-200 peer-placeholder-shown:top-4 peer-placeholder-shown:scale-100 peer-focus:top-2 peer-focus:scale-90 peer-focus:text-blue-300 peer-[&:not(:placeholder-shown)]:top-2 peer-[&:not(:placeholder-shown)]:scale-90">
        {label}
      </span>

      {isPasswordField ? (
        <button
          type="button"
          onClick={() => setShowPassword((current) => !current)}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 transition hover:text-slate-200"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      ) : null}
    </label>
  )
}

export default FloatingInput
