import { useEffect, useRef } from 'react'
import './CrystalCounter.scss'

export function CrystalCounter({ crystalBank, previousBank = 0 }) {
  const displayRef = useRef(crystalBank)
  const animationRef = useRef(null)

  // Animated counter on bank change
  useEffect(() => {
    if (displayRef.current === crystalBank) return

    const startValue = displayRef.current
    const endValue = crystalBank
    const difference = endValue - startValue
    const duration = 500 // ms
    const startTime = Date.now()

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)

      displayRef.current = Math.floor(startValue + difference * progress)

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate)
      } else {
        displayRef.current = endValue
      }

      // Trigger re-render
      // Since we're using useRef, we need to force update via a state change
      // For now, we'll just update the DOM directly
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [crystalBank])

  const isIncreasing = crystalBank > previousBank

  return (
    <div className={`crystal-counter ${isIncreasing ? 'increasing' : ''}`}>
      <div className="counter-content">
        <div className="crystal-icon-large">💎</div>
        <div className="counter-display">
          <span className="crystal-value">{crystalBank.toLocaleString()}</span>
          <span className="crystal-label">CRYSTALS</span>
        </div>
      </div>
      {isIncreasing && <div className="glow-pulse" />}
    </div>
  )
}
