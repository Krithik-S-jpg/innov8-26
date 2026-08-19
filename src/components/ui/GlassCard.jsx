function GlassCard({ className = '', style, children }) {
  return (
    <section
      className={`glass-card rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-xl shadow-black/20 backdrop-blur-xl transition-all duration-300 ${className}`}
      style={style}
    >
      {children}
    </section>
  )
}

export default GlassCard
