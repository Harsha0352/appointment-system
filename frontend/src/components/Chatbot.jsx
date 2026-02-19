import React, { useState, useRef, useEffect } from 'react'
import { sendChat } from '../api'

export default function Chatbot() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const boxRef = useRef()

  useEffect(() => {
    if (boxRef.current) boxRef.current.scrollTop = boxRef.current.scrollHeight
  }, [messages, open])

  async function send() {
    const m = text.trim()
    if (!m) return
    setMessages((s) => [...s, { role: 'user', text: m }])
    setText('')
    setSending(true)
    try {
      const res = await sendChat(m)
      const reply = res.reply || ''
      setMessages((s) => [...s, { role: 'assistant', text: reply }])
    } catch (e) {
      setMessages((s) => [...s, { role: 'assistant', text: 'Error: ' + (e.message || e) }])
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      {!open && (
        <button className="chat-launcher" onClick={() => setOpen(true)}>
          <span style={{ fontSize: '24px' }}>💬</span>
        </button>
      )}

      {open && (
        <div className="chat-window">
          <div className="chat-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Appointment Assistant</span>
            <button onClick={() => setOpen(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', fontSize: '18px' }}>✕</button>
          </div>

          <div className="chat-messages" ref={boxRef}>
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '20px' }}>
                Hi! I can help you book appointments or check your status.
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`message ${m.role}`}>
                {m.text}
              </div>
            ))}
            {sending && <div className="text-muted" style={{ marginLeft: '16px', fontSize: '12px' }}>Assistant is typing...</div>}
          </div>

          <div className="chat-input-area">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type your message..."
              onKeyDown={(e) => { if (e.key === 'Enter') send() }}
            />
            <button onClick={send} disabled={sending}>Send</button>
          </div>
        </div>
      )}
    </>
  )
}
