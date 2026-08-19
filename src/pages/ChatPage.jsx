import { useEffect, useRef, useState } from 'react'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { ArrowLeft, LoaderCircle, MessageCircle, PhoneOff, Send } from 'lucide-react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import AppShell from '../components/layout/AppShell'
import GlassCard from '../components/ui/GlassCard'

const WS_URL = import.meta.env.VITE_WS_URL || '/ws'

const CHAT_PHASES = {
  idle: 'idle',
  connecting: 'connecting',
  waiting: 'waiting',
  chatting: 'chatting',
  ended: 'ended',
}

const safeParseMessage = (body) => {
  if (!body) return {}

  if (typeof body === 'object') {
    return body
  }

  try {
    return JSON.parse(body)
  } catch {
    return { content: String(body) }
  }
}

const createMessage = ({ content, senderId = '', type, roomId = '', system = false, own = false }) => ({
  id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
  content,
  senderId,
  type,
  roomId,
  system,
  own,
  createdAt: new Date().toISOString(),
})

function ChatPage() {
  const [phase, setPhase] = useState(CHAT_PHASES.idle)
  const [messages, setMessages] = useState([])
  const [messageText, setMessageText] = useState('')
  const [roomId, setRoomId] = useState('')
  const [connectionError, setConnectionError] = useState('')
  const [peerTyping, setPeerTyping] = useState(false)
  const messagesEndRef = useRef(null)
  const stompClientRef = useRef(null)
  const subscriptionRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const pendingOwnMessageRef = useRef('')
  const [userId] = useState(() => localStorage.getItem('userId') || '')
  const [token] = useState(() => localStorage.getItem('token') || '')

  const isBusy = phase === CHAT_PHASES.connecting || phase === CHAT_PHASES.waiting
  const isChatting = phase === CHAT_PHASES.chatting
  const canConnect = Boolean(userId && token) && (phase === CHAT_PHASES.idle || phase === CHAT_PHASES.ended)

  const disconnectClient = async () => {
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe()
      subscriptionRef.current = null
    }

    const client = stompClientRef.current
    stompClientRef.current = null

    if (client) {
      await client.deactivate()
    }
  }

  const sendSystemMessage = (content) => {
    if (!content) return

    setMessages((current) => [...current, createMessage({ content, type: 'SYSTEM', system: true })])
  }

  const handleBrokerMessage = (frame) => {
    const payload = safeParseMessage(frame.body)
    const normalizedType = String(payload.type || '').toUpperCase()

    if (normalizedType === 'WAITING') {
      setPhase(CHAT_PHASES.waiting)
      sendSystemMessage(payload.content || 'Looking for someone to connect with...')
      return
    }

    if (normalizedType === 'MATCHED') {
      setRoomId(payload.roomId || '')
      setPhase(CHAT_PHASES.chatting)
      sendSystemMessage(payload.content || 'You have been matched anonymously.')
      return
    }

    if (normalizedType === 'CHAT') {
      if (pendingOwnMessageRef.current && payload.content === pendingOwnMessageRef.current) {
        pendingOwnMessageRef.current = ''
        return
      }

      const ownMessage = String(payload.senderId ?? '') === String(userId)

      setMessages((current) => [
        ...current,
        createMessage({
          content: payload.content || '',
          senderId: payload.senderId ?? '',
          type: 'CHAT',
          roomId: payload.roomId || roomId,
          own: ownMessage,
        }),
      ])
      return
    }

    if (normalizedType === 'TYPING') {
      setPeerTyping(true)

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }

      typingTimeoutRef.current = setTimeout(() => setPeerTyping(false), 1800)
      return
    }

    if (normalizedType === 'CANCELLED') {
      sendSystemMessage(payload.content || 'You left the waiting queue.')
      setPhase(CHAT_PHASES.idle)
      disconnectClient().catch(() => {})
      return
    }

    if (normalizedType === 'LEAVE') {
      sendSystemMessage('The other person has left the chat.')
      setPhase(CHAT_PHASES.ended)
      disconnectClient().catch(() => {})
      return
    }

    if (payload.content) {
      sendSystemMessage(payload.content)
    }
  }

  const startConnection = async () => {
    if (!canConnect) {
      if (!userId) {
        toast.error('Your user ID is missing from local storage.')
      } else if (!token) {
        toast.error('Your authentication token is missing.')
      }
      return
    }

    setConnectionError('')
    setMessages([])
    setRoomId('')
    setPeerTyping(false)
    setPhase(CHAT_PHASES.connecting)

    try {
      await disconnectClient()

      const client = new Client({
        webSocketFactory: () => new SockJS(WS_URL),
        reconnectDelay: 0,
        connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
        debug: () => {},
        onConnect: () => {
          subscriptionRef.current = client.subscribe(`/queue/user-${userId}`, handleBrokerMessage)
          client.publish({
            destination: '/app/chat.join',
            body: JSON.stringify({ senderId: userId, type: 'JOIN' }),
          })
          setPhase(CHAT_PHASES.waiting)
        },
        onStompError: () => {
          setConnectionError('Unable to connect to the peer support chat server.')
          setPhase(CHAT_PHASES.idle)
        },
        onWebSocketError: () => {
          setConnectionError('Unable to connect to the peer support chat server.')
          setPhase(CHAT_PHASES.idle)
        },
        onWebSocketClose: () => {
          setPhase((currentPhase) => (currentPhase === CHAT_PHASES.idle ? currentPhase : CHAT_PHASES.ended))
        },
      })

      stompClientRef.current = client
      client.activate()
    } catch {
      setConnectionError('Unable to connect to the peer support chat server.')
      setPhase(CHAT_PHASES.idle)
      toast.error('Unable to connect to the peer support chat server.')
    }
  }

  const handleSendMessage = (event) => {
    event.preventDefault()

    const content = messageText.trim()

    if (!isChatting || !roomId || !content) {
      return
    }

    const client = stompClientRef.current

    if (!client) {
      toast.error('Chat connection is not active.')
      return
    }

    client.publish({
      destination: '/app/chat.send',
      body: JSON.stringify({
        senderId: userId,
        content,
        roomId,
        type: 'CHAT',
      }),
    })

    pendingOwnMessageRef.current = content
    setMessages((current) => [
      ...current,
      createMessage({
        content,
        senderId: userId,
        type: 'CHAT',
        roomId,
        own: true,
      }),
    ])
    setMessageText('')
    setPeerTyping(false)
  }

  const handleEndChat = async () => {
    const client = stompClientRef.current

    if (client && roomId) {
      client.publish({
        destination: '/app/chat.leave',
        body: JSON.stringify({ senderId: userId, roomId, type: 'LEAVE' }),
      })
    }

    await disconnectClient()
    setPhase(CHAT_PHASES.ended)
  }

  const handleCancelWaiting = async () => {
    const client = stompClientRef.current

    if (client) {
      client.publish({
        destination: '/app/chat.cancel',
        body: JSON.stringify({ senderId: userId, type: 'CANCEL' }),
      })
    }

    await disconnectClient()
    setMessages([])
    setRoomId('')
    setPeerTyping(false)
    setPhase(CHAT_PHASES.idle)
  }

  const handleStartNewChat = async () => {
    await disconnectClient()
    setMessages([])
    setMessageText('')
    setRoomId('')
    setPeerTyping(false)
    setConnectionError('')
    setPhase(CHAT_PHASES.idle)
  }

  const handleMessageTextChange = (event) => {
    const value = event.target.value
    setMessageText(value)

    const client = stompClientRef.current
    if (client && isChatting && roomId) {
      client.publish({
        destination: '/app/chat.typing',
        body: JSON.stringify({ senderId: userId, roomId, type: 'TYPING' }),
      })
    }
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, phase])

  useEffect(
    () => () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      disconnectClient().catch(() => {})
    },
    [],
  )

  return (
    <AppShell title="Anonymous Peer Support">
      <div className="mx-auto flex min-h-[calc(100vh-10rem)] max-w-6xl flex-col">
        <section className="mb-5">
          <h2 className="text-3xl font-bold tracking-tight text-white">Anonymous Peer Support</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-300">
            Connect with someone who understands. All conversations are completely anonymous.
          </p>
        </section>

        {phase === CHAT_PHASES.idle ? (
          <div className="flex flex-1 items-center justify-center py-8">
            <GlassCard className="w-full max-w-2xl border-white/10 bg-white/[0.05] p-8 text-center shadow-2xl shadow-black/30">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/15 text-blue-300">
                <MessageCircle size={28} />
              </div>
              <h3 className="mt-6 text-2xl font-semibold text-white">Find Someone to Talk To</h3>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                You will be matched anonymously with someone who has been through similar experiences.
              </p>

              {connectionError ? (
                <p className="mt-4 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {connectionError}
                </p>
              ) : null}

              <button
                type="button"
                onClick={startConnection}
                disabled={!canConnect}
                className="mt-8 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 px-5 py-3 text-sm font-semibold text-white transition duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/30 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <MessageCircle size={16} />
                Connect Anonymously
              </button>

              {!userId || !token ? (
                <p className="mt-4 text-xs text-slate-400">
                  Sign in again if your stored session data is missing.
                </p>
              ) : null}
            </GlassCard>
          </div>
        ) : null}

        {isBusy ? (
          <div className="flex flex-1 items-center justify-center py-8">
            <GlassCard className="w-full max-w-2xl border-white/10 bg-white/[0.05] p-10 text-center shadow-2xl shadow-black/30">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-blue-400/30 bg-blue-500/10 text-blue-300">
                <LoaderCircle size={34} className="animate-spin" />
              </div>
              <h3 className="mt-6 text-2xl font-semibold text-white">Looking for someone to connect with...</h3>
              <p className="mt-3 text-sm text-slate-300">
                Please stay on this screen while we find the right peer match.
              </p>
              <div className="mt-6 flex items-center justify-center gap-2">
                <span className="h-3 w-3 animate-pulse rounded-full bg-blue-400" />
                <span className="h-3 w-3 animate-pulse rounded-full bg-violet-400 [animation-delay:150ms]" />
                <span className="h-3 w-3 animate-pulse rounded-full bg-cyan-300 [animation-delay:300ms]" />
              </div>
              <button
                type="button"
                onClick={handleCancelWaiting}
                className="mt-8 inline-flex items-center gap-2 rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/5"
              >
                <PhoneOff size={16} />
                Cancel Search
              </button>
            </GlassCard>
          </div>
        ) : null}

        {isChatting ? (
          <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/30 backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-4 sm:px-6">
              <div>
                <h3 className="text-lg font-semibold text-white">Anonymous Chat</h3>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  {roomId ? `Room ${roomId}` : 'Anonymous room'}
                </p>
              </div>

              <button
                type="button"
                onClick={handleEndChat}
                className="inline-flex items-center gap-2 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-200 transition hover:bg-red-500/20 hover:text-red-100"
              >
                <PhoneOff size={16} />
                End Chat
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
              <div className="flex min-h-full flex-col gap-3">
                {messages.length === 0 ? (
                  <div className="flex flex-1 items-center justify-center rounded-3xl border border-dashed border-white/10 bg-slate-900/20 p-8 text-center text-sm text-slate-400">
                    Your conversation will appear here.
                  </div>
                ) : null}

                {messages.map((message) => {
                  if (message.system) {
                    return (
                      <div key={message.id} className="flex justify-center">
                        <div className="max-w-2xl rounded-full bg-white/5 px-4 py-2 text-center text-sm italic text-slate-400">
                          {message.content}
                        </div>
                      </div>
                    )
                  }

                  const bubbleClass = message.own
                    ? 'ml-auto rounded-3xl rounded-br-md bg-gradient-to-r from-blue-500 to-violet-500 text-white'
                    : 'mr-auto rounded-3xl rounded-bl-md border border-white/10 bg-slate-800/80 text-slate-100'

                  return (
                    <article key={message.id} className={`max-w-[80%] px-4 py-3 shadow-lg shadow-black/10 ${bubbleClass}`}>
                      <div className="text-sm leading-6">{message.content}</div>
                    </article>
                  )
                })}
                {peerTyping ? (
                  <div className="mr-auto rounded-full border border-white/10 bg-slate-800/80 px-4 py-2 text-xs text-slate-300">
                    Anonymous peer is typing...
                  </div>
                ) : null}
                <div ref={messagesEndRef} />
              </div>
            </div>

            <form onSubmit={handleSendMessage} className="border-t border-white/10 bg-slate-950/40 p-4 sm:p-5">
              <div className="flex items-end gap-3 rounded-2xl border border-white/10 bg-slate-900/70 p-3">
                <input
                  type="text"
                  value={messageText}
                  onChange={handleMessageTextChange}
                  placeholder="Type a message..."
                  className="min-h-12 flex-1 bg-transparent px-1 text-sm text-white outline-none placeholder:text-slate-500"
                />
                <button
                  type="submit"
                  disabled={!messageText.trim()}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 px-4 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Send size={16} />
                  Send
                </button>
              </div>
              <p className="mt-3 text-xs text-slate-400">Press Enter to send your message.</p>
            </form>
          </section>
        ) : null}

        {phase === CHAT_PHASES.ended ? (
          <div className="flex flex-1 items-center justify-center py-8">
            <GlassCard className="w-full max-w-2xl border-white/10 bg-white/[0.05] p-8 text-center shadow-2xl shadow-black/30">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-800 text-slate-300">
                <MessageCircle size={28} />
              </div>
              <h3 className="mt-6 text-2xl font-semibold text-white">This conversation has ended.</h3>
              <p className="mt-3 text-sm text-slate-300">
                You can start a new anonymous chat or return to your dashboard.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <button
                  type="button"
                  onClick={handleStartNewChat}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5"
                >
                  <ArrowLeft size={16} />
                  Start New Chat
                </button>
                <Link
                  to="/dashboard"
                  className="inline-flex items-center justify-center rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/5"
                >
                  Return to Dashboard
                </Link>
              </div>
            </GlassCard>
          </div>
        ) : null}

        <footer className="mt-5 border-t border-white/10 pt-4 text-center text-xs leading-5 text-slate-400">
          MindCare peer support is not a substitute for professional help. If you are in crisis, please contact iCall: 9152987821
        </footer>
      </div>
    </AppShell>
  )
}

export default ChatPage
