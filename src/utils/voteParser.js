/**
 * Parse raw IRC message string into structured object
 * @param {string} rawMessage - Raw IRC message from Twitch
 * @returns {Object|null} { username, message } or null if not PRIVMSG
 */
export function parseIRCMessage(rawMessage) {
  // Example PRIVMSG: :username!username@username.tmi.twitch.tv PRIVMSG #channel :message text
  const privmsgRegex = /:([a-zA-Z0-9_]+)!/.exec(rawMessage)
  const messageRegex = /PRIVMSG #[a-zA-Z0-9_]+ :(.*)/.exec(rawMessage)

  if (!privmsgRegex || !messageRegex) {
    return null
  }

  return {
    username: privmsgRegex[1],
    message: messageRegex[1],
  }
}

/**
 * Check if a message is a valid vote command (!a, !b, !c, !d, A!, B!, C!, D!)
 * @param {string} message - Message text to check
 * @returns {number|null} answerId (1–4) or null if not a vote command
 */
export function isVoteCommand(message) {
  if (!message) return null

  const trimmed = message.trim().toLowerCase()

  // Support !a, !b, !c, !d format
  if (trimmed === '!a') return 1
  if (trimmed === '!b') return 2
  if (trimmed === '!c') return 3
  if (trimmed === '!d') return 4

  // Support A!, B!, C!, D! format
  if (trimmed === 'a!') return 1
  if (trimmed === 'b!') return 2
  if (trimmed === 'c!') return 3
  if (trimmed === 'd!') return 4

  // Legacy support for !1, !2, !3, !4
  if (trimmed === '!1') return 1
  if (trimmed === '!2') return 2
  if (trimmed === '!3') return 3
  if (trimmed === '!4') return 4

  return null
}

/**
 * Check if a raw IRC message is a PING
 * @param {string} rawMessage - Raw IRC message
 * @returns {boolean}
 */
export function isPingMessage(rawMessage) {
  return rawMessage.startsWith('PING')
}

/**
 * Generate PONG response for PING
 * @param {string} rawMessage - Raw PING message
 * @returns {string} PONG response
 */
export function generatePongResponse(rawMessage) {
  const pingToken = rawMessage.split(' ')[1] || ''
  return `PONG ${pingToken}\r\n`
}

/**
 * Generate IRC connection handshake messages
 * @param {string} channelName - Twitch channel name (without #)
 * @returns {string[]} Array of IRC commands to send
 */
export function generateHandshakeMessages(channelName) {
  const randomNum = Math.floor(Math.random() * 1000000)
  return [
    'PASS SCHMOOPIIE\r\n',
    `NICK justinfan${randomNum}\r\n`,
    `JOIN #${channelName}\r\n`,
  ]
}
