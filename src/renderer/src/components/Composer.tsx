import { useMemo, useRef, useState, type DragEvent, type KeyboardEvent } from 'react';
import { COMMANDS, type Command } from '../commands';
import { SlashMenu } from './SlashMenu';
import { MagneticButton } from './MagneticButton';

export interface Attachment { name: string; content?: string; kind: string; }

// The bottom composer: prompt input, live slash-command palette, drag-and-drop
// attachments, status bar, and the magnetic send button.
export function Composer({
  status, disabled, onSubmit, onCommand,
}: {
  status: { model: string; provider: string; apps: number; skills: number };
  disabled: boolean;
  onSubmit: (text: string, attachments: Attachment[]) => void;
  onCommand: (name: string) => void;
}) {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [slashIndex, setSlashIndex] = useState(0);
  const [dragging, setDragging] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const slashActive = text.startsWith('/') && !text.includes(' ');
  const matches = useMemo<Command[]>(() => {
    if (!slashActive) return [];
    const q = text.slice(1).toLowerCase();
    return COMMANDS.filter((c) => c.name.slice(1).toLowerCase().startsWith(q));
  }, [text, slashActive]);

  function pickCommand(c: Command) {
    setText('');
    setSlashIndex(0);
    onCommand(c.name.slice(1));
  }

  function submit() {
    const t = text.trim();
    if (!t && attachments.length === 0) return;
    onSubmit(t, attachments);
    setText('');
    setAttachments([]);
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (slashActive && matches.length) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setSlashIndex((i) => (i + 1) % matches.length); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); setSlashIndex((i) => (i - 1 + matches.length) % matches.length); return; }
      if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); pickCommand(matches[Math.min(slashIndex, matches.length - 1)]); return; }
      if (e.key === 'Escape') { setText(''); return; }
    }
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
  }

  async function onDrop(e: DragEvent) {
    e.preventDefault(); setDragging(false);
    const files = Array.from(e.dataTransfer.files);
    const next: Attachment[] = [];
    for (const f of files) {
      const kind = f.type || 'file';
      let content: string | undefined;
      if (kind.startsWith('text') || /\.(md|txt|json|csv|js|ts|py|html|css|log)$/i.test(f.name)) {
        try { content = (await f.text()).slice(0, 20000); } catch { /* ignore */ }
      }
      next.push({ name: f.name, content, kind });
    }
    setAttachments((a) => [...a, ...next]);
  }

  return (
    <div className="composer">
      {attachments.length > 0 && (
        <div className="attachments">
          {attachments.map((a, i) => (
            <span key={i} className="chip">📎 {a.name}{a.content ? '' : ' (linked)'}
              <button onClick={() => setAttachments((x) => x.filter((_, j) => j !== i))}>✕</button>
            </span>
          ))}
        </div>
      )}
      <div className="statusbar">
        <span>◆</span>
        <span>Citrine Space chat v1.0.0</span>
        <span className="sep">|</span>
        <span><b>{status.skills}</b> skills loaded</span>
        <span className="sep">|</span>
        <span><b>{status.apps}</b> apps connected</span>
        <span className="sep">|</span>
        <span>Model: <b>{status.model || 'none — /model'}</b></span>
      </div>
      <div
        className={`inputwrap ${dragging ? 'drag' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        style={{ position: 'relative' }}
      >
        {slashActive && <SlashMenu commands={matches} activeIndex={Math.min(slashIndex, Math.max(matches.length - 1, 0))} onPick={pickCommand} />}
        <span className="lead">citrine&gt;</span>
        <textarea
          ref={taRef}
          value={text}
          disabled={disabled}
          placeholder={dragging ? 'Drop files, folders, PDFs, images…' : 'Ask anything. Automate anything. Connect anything.   ( / for commands )'}
          onChange={(e) => { setText(e.target.value); setSlashIndex(0); }}
          onKeyDown={onKeyDown}
          rows={1}
          onInput={(e) => { const el = e.currentTarget; el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 160) + 'px'; }}
        />
        <MagneticButton className="icon primary" strength={0.5} title="Send" onClick={submit}>❯</MagneticButton>
      </div>
    </div>
  );
}
