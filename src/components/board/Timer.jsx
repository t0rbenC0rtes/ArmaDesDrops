import { useEffect, useState, useRef } from 'react'
import './Timer.scss'

export function Timer({ duration = 45, isRunning = false, onComplete }) {
  const [secondsLeft, setSecondsLeft] = useState(duration)
  const [isMuted, setIsMuted] = useState(true)
  const audioRef = useRef(null)
  const musicStartedRef = useRef(false)
  const userInteractedRef = useRef(false)

  // Unmute audio on first user interaction
  useEffect(() => {
    const handleUserInteraction = () => {
      if (!userInteractedRef.current) {
        userInteractedRef.current = true
        setIsMuted(false)
        console.log('[Timer] User interaction detected - enabling audio')
        // Remove listeners after first interaction
        document.removeEventListener('click', handleUserInteraction)
        document.removeEventListener('keydown', handleUserInteraction)
        document.removeEventListener('touchstart', handleUserInteraction)
      }
    }

    document.addEventListener('click', handleUserInteraction)
    document.addEventListener('keydown', handleUserInteraction)
    document.addEventListener('touchstart', handleUserInteraction)

    return () => {
      document.removeEventListener('click', handleUserInteraction)
      document.removeEventListener('keydown', handleUserInteraction)
      document.removeEventListener('touchstart', handleUserInteraction)
    }
  }, [])

  // Handle countdown interval
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

  // Reset when duration changes
  useEffect(() => {
    setSecondsLeft(duration)
    musicStartedRef.current = false
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
  }, [duration])

  // Sync music: Start music when timer reaches 23 seconds
  useEffect(() => {
    if (!audioRef.current) return

    if (isRunning && secondsLeft === 23 && !musicStartedRef.current) {
      // Start music when 23 seconds remain (muted initially)
      audioRef.current.currentTime = 0
      audioRef.current.muted = isMuted
      audioRef.current.play().catch((err) => {
        console.warn('[Timer] Could not autoplay music:', err.message)
      })
      musicStartedRef.current = true
      console.log(
        `[Timer] Music started at timer=23s (climax at 1s, audio ${isMuted ? 'muted' : 'unmuted'})`
      )
    }

    if (!isRunning && audioRef.current) {
      // Stop music if timer stops
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      musicStartedRef.current = false
    }
  }, [isRunning, secondsLeft, isMuted])

  const percentage = (secondsLeft / duration) * 100
  const isLow = secondsLeft <= 15
  const isWarning = secondsLeft <= 30 && secondsLeft > 15

  let timerClass = 'timer'
  if (isLow) timerClass += ' timer--critical'
  else if (isWarning) timerClass += ' timer--warning'

  return (
    <div className={timerClass}>
      {/* Hidden audio element for timer climax - starts muted to bypass autoplay restrictions */}
      <audio
        ref={audioRef}
        src="/TimerMusic.wav"
        preload="auto"
        muted={isMuted}
        onEnded={() => {
          console.log('[Timer] Music ended')
          musicStartedRef.current = false
        }}
      />

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
