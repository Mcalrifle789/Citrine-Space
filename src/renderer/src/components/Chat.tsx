import { useEffect, useRef } from 'react';
import logoUrl from '../assets/citrine-logo.png';

export interface Message { id: string; role: 'user' | 'assistant'; content: string; streaming?: boolean; attachments?: string[]; }

function Welcome({ username }: { username: string }) {
  return (
    <div className="welcome">
      <div className="tagline">Citrine Space chat — your agentic AI copilot for any task, any workflow, anywhere.</div>
      <div style={{ color: 'var(--accent)' }}>{username}@citrine:~$ citrine</div>
      <img className="wordmark-logo" src={logoUrl} alt="Citrine Space chat" />
      <div>Agentic AI that connects to any app and helps with any task or workflow.</div>
      <div className="bullets">
        <div>Bring your own keys — use any model from any provider.</div>
        <div>Connect apps via MCP. Automate any task or workflow.</div>
        <div>Spin up agents that collaborate to get things done.</div>
        <div>Private, secure, and fully in your control.</div>
      </div>
      <div className="prompt-line">citrine&gt; Ask anything. Automate anything. Connect anything.</div>
    </div>
  );
}

export function Chat({ messages, thinking, username }: { messages: Message[]; thinking: boolean; username: string }) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, thinking]);

  return (
    <div className="chat">
      {messages.length === 0 && <Welcome username={username} />}
      {messages.map((m) => (
        <div key={m.id} className={`msg ${m.role}`}>
          <div className="who">{m.role === 'user' ? username : 'citrine'}</div>
          <div className="bubble">
            {m.attachments && m.attachments.length > 0 && (
              <div className="attachments">
                {m.attachments.map((a, i) => <span key={i} className="chip">📎 {a}</span>)}
              </div>
            )}
            {m.content}
            {m.streaming && <span className="caret">▍</span>}
          </div>
        </div>
      ))}
      {thinking && (
        <div className="msg assistant">
          <div className="who">citrine</div>
          <div className="bubble">
            <span className="thinking">thinking<span className="d" /><span className="d" /><span className="d" /></span>
          </div>
        </div>
      )}
      <div ref={endRef} />
    </div>
  );
}
