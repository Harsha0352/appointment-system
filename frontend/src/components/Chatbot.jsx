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
    <div>
      <div className="chat-toggle">
        <button onClick={() => setOpen((o) => !o)}>{open ? 'Close Help' : 'Chat with assistant'}</button>
      </div>

      {open && (
        <div className="chatbox">
          <div className="chat-header">Assistant</div>
          <div className="chat-body" ref={boxRef}>
            {messages.map((m, i) => (
              <div key={i} className={`chat-msg ${m.role}`}>
                <div className="chat-role">{m.role === 'user' ? 'You' : 'Assistant'}</div>
                <div className="chat-text">{m.text}</div>
              </div>
            ))}
          </div>
          <div className="chat-input">
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Ask about appointments..." onKeyDown={(e)=>{if(e.key==='Enter') send()}} />
            <button onClick={send} disabled={sending}>{sending ? '...' : 'Send'}</button>
          </div>
        </div>
      )}
    </div>
  )
}
