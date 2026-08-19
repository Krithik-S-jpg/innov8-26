function AmbientBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -left-20 top-10 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />
      <div className="absolute right-0 top-1/3 h-96 w-96 rounded-full bg-violet-500/20 blur-3xl" />
      <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="mesh-grid absolute inset-0 opacity-40" />
      <div className="floating-particles absolute inset-0" />
    </div>
  )
}

export default AmbientBackground
