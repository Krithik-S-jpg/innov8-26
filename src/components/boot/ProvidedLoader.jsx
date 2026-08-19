import { useEffect } from 'react'

export default function ProvidedLoader({ onComplete }) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 7400)
    return () => clearTimeout(timer)
  }, [onComplete])

  return (
    <div className="provided-loader" role="status" aria-label="Loading INNOV8'26">
      <img src="/the-squid-loader.svg" alt="Loading" />
      <button onClick={onComplete}>SKIP →</button>
    </div>
  )
}
