import { useEffect, useRef, useState, useCallback } from 'react'
import { parseIRCMessage, isVoteCommand, isPingMessage, generatePongResponse, generateHandshakeMessages } from '../utils/voteParser'

/**
 * Hook for managing Twitch IRC WebSocket connection
 * Reads chat votes and processes them in real time
 * Supports anonymous read-only connection with PING/PONG keepalive
 * Implements exponential backoff reconnect (max 5 retries)
 *
 * @param {Object} config
 * @param {string} config.channelName - Twitch channel name (e.g., 'laemso')
 * @param {Function} config.onVote - Callback(username, answerId) when vote received
 * @param {boolean} config.enabled - Whether to accept votes (default: true)
 * @returns {Object} { status, reconnect, disconnect }
 */
export function useTwitchChat({ channelName = 'laemso', onVote, enabled = true }) {
  const [status, setStatus] = useState('disconnected')
  const wsRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)
  const reconnectAttemptsRef = useRef(0)
  const messageBufferRef = useRef([])
  const enabledRef = useRef(enabled) // Keep current enabled state in ref
  const onVoteRef = useRef(onVote) // Keep current onVote callback in ref

  const IRC_URL = 'wss://irc-ws.chat.twitch.tv:443'
  const MAX_RECONNECT_ATTEMPTS = 5

  // Keep refs in sync with current prop values
  useEffect(() => {
    enabledRef.current = enabled
  }, [enabled])

  useEffect(() => {
    onVoteRef.current = onVote
  }, [onVote])

  /**
   * Send IRC command(s) to server
   */
  const sendCommand = useCallback((command) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(command)
    }
  }, [])

  /**
   * Handle incoming IRC message
   */
  const handleMessage = useCallback(
    (data) => {
      // Handle PING/PONG keepalive
      if (isPingMessage(data)) {
        const pong = generatePongResponse(data)
        sendCommand(pong)
        return
      }

      // Parse PRIVMSG for chat messages
      const parsed = parseIRCMessage(data)
      if (!parsed) return

      const { username, message } = parsed

      // Check if voting is currently enabled using ref (not closure)
      if (enabledRef.current) {
        const answerId = isVoteCommand(message)
        if (answerId !== null && onVoteRef.current) {
          console.log(`[Twitch] Vote received: ${username} → Answer ${answerId}`)
          onVoteRef.current(username, answerId)
        }
      }
    },
    [sendCommand]
  )

  /**
   * Establish WebSocket connection
   */
  const connect = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      console.log('[Twitch] WebSocket already connected')
      return // Already connected
    }

    try {
      setStatus('connecting')

      const ws = new WebSocket(IRC_URL)

      ws.onopen = () => {
        console.log('[Twitch] Connected to IRC')
        setStatus('connected')
        reconnectAttemptsRef.current = 0

        // Send handshake
        const handshake = generateHandshakeMessages(channelName)
        handshake.forEach((msg) => ws.send(msg))
      }

      ws.onmessage = (event) => {
        // Call handleMessage directly with current data
        handleMessage(event.data)
      }

      ws.onerror = (error) => {
        console.error('[Twitch] WebSocket error:', error)
        setStatus('error')
      }

      ws.onclose = () => {
        console.log('[Twitch] Disconnected from IRC')
        setStatus('disconnected')
        wsRef.current = null

        // Attempt reconnect with exponential backoff
        if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttemptsRef.current++
          const delay = Math.pow(2, reconnectAttemptsRef.current) * 1000 // 2s, 4s, 8s, 16s, 32s
          console.log(
            `[Twitch] Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS})`
          )
          reconnectTimeoutRef.current = setTimeout(connect, delay)
        } else {
          console.log('[Twitch] Max reconnect attempts reached')
          setStatus('error')
        }
      }

      wsRef.current = ws
    } catch (error) {
      console.error('[Twitch] Connection error:', error)
      setStatus('error')
    }
  }, [channelName, handleMessage])

  /**
   * Disconnect from Twitch
   */
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }

    reconnectAttemptsRef.current = 0
    setStatus('disconnected')
  }, [])

  /**
   * Manually trigger reconnect
   */
  const reconnect = useCallback(() => {
    disconnect()
    reconnectAttemptsRef.current = 0
    connect()
  }, [connect, disconnect])

  // Auto-connect on mount, cleanup on unmount
  useEffect(() => {
    connect()

    return () => {
      disconnect()
    }
  }, [connect, disconnect])

  // When enabled flag changes, ensure connection is working
  useEffect(() => {
    if (enabled && (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN)) {
      console.log('[Twitch] Enabled flag true, ensuring connection...')
      if (wsRef.current && wsRef.current.readyState === WebSocket.CLOSING) {
        // Wait for close to complete before reconnecting
        setTimeout(() => connect(), 500)
      } else {
        connect()
      }
    } else if (!enabled && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      console.log('[Twitch] Enabled flag false, can close connection if needed')
      // Note: We keep connection open but just don't process votes
    }
  }, [enabled, connect])

  return {
    status, // "connecting" | "connected" | "disconnected" | "error"
    reconnect,
    disconnect,
    isConnected: status === 'connected',
  }
}
