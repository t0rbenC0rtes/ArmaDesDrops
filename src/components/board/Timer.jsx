import { useEffect, useState } from 'react'
import './Timer.scss'

export function Timer({ duration = 45, isRunning = false, onComplete }) {
  const [secondsLeft, setSecondsLeft] = useState(duration)

  useEffect(() => {
    if (!isRunning) return

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          onComplete?.()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isRunning, onComplete])

  useEffect(() => {
    setSecondsLeft(duration)
  }, [duration])

  const percentage = (secondsLeft / duration) * 100
  const isLow = secondsLeft <= 15
  const isWarning = secondsLeft <= 30 && secondsLeft > 15

  let timerClass = 'timer'
  if (isLow) timerClass += ' timer--critical'
  else if (isWarning) timerClass += ' timer--warning'

  return (
    <div className={timerClass}>
      <div className="timer-circle">
        <svg className="timer-svg" viewBox="0 0 100 100">
          <circle className="timer-bg" cx="50" cy="50" r="45" />
          <circle
            className="timer-progress"
            cx="50"
            cy="50"
            r="45"
            style={{
              strokeDashoffset: 282.7 - (282.7 * percentage) / 100,
            }}
          />
        </svg>
        <div className="timer-content">
          <span className="timer-value">{secondsLeft}</span>
          <span className="timer-unit">s</span>
        </div>
      </div>

      {isWarning && <div className="pulse-ring pulse-ring-1" />}
      {isWarning && <div className="pulse-ring pulse-ring-2" />}
      {isLow && <div className="pulse-ring pulse-ring-critical" />}
    </div>
  )
}
