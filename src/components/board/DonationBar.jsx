import { useState, useEffect } from 'react'
import './DonationBar.scss'

export function DonationBar({ donationTotal }) {
  // Simple 5-step progression (descending order: 50 at top, 2 at bottom)
  const thresholds = [50, 25, 10, 5, 2]
  
  // Calculate which step we're at (0-5) by counting how many thresholds we've met
  const getCurrentStep = () => {
    let step = 0
    for (let i = 0; i < thresholds.length; i++) {
      if (donationTotal >= thresholds[i]) {
        step++
      }
    }
    return step
  }
  
  const currentStep = getCurrentStep()
  const fillPercentage = (currentStep / thresholds.length) * 100

  return (
    <div className="donation-bar-container">
      <div className="donation-bar">
        <div className="bar-track">
          <div
            className="bar-fill"
            style={{
              height: `${fillPercentage}%`,
            }}
          />
        </div>
        <div className="step-markers">
          {thresholds.map((threshold, idx) => (
            <div
              key={idx}
              className={`step-marker ${currentStep > idx ? 'active' : ''}`}
              title={`$${threshold}`}
            >
              {threshold}€
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
