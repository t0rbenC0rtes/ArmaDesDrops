import './TwitchStatus.scss'

/**
 * Displays live Twitch IRC connection status
 * Shows connected/disconnected/error states with a pulsing indicator
 */
export function TwitchStatus({ twitchStatus, onReconnect }) {
  const isConnected = twitchStatus === 'connected'
  const isError = twitchStatus === 'error'

  return (
    <div className={`twitch-status-panel status-${twitchStatus}`}>
      <div className="status-header">
        <div className="status-indicator" />
        <span className="channel-name">#laemso</span>
      </div>

      <div className="status-info">
        {isConnected && (
          <p className="status-message">✓ Connected to Twitch Chat</p>
        )}
        {twitchStatus === 'connecting' && (
          <p className="status-message">⋯ Connecting to Twitch Chat...</p>
        )}
        {twitchStatus === 'disconnected' && (
          <p className="status-message">✕ Disconnected from Twitch</p>
        )}
        {isError && (
          <div className="status-error">
            <p className="status-message error-msg">⚠ Connection Error</p>
            <button className="btn-reconnect" onClick={onReconnect}>
              Reconnect
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
