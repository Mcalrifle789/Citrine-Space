import { useEffect, useRef, useState } from 'react';
import { initApi, api, type AppConfig, type ChatMsg } from './lib/api';
import { THEMES, applyTheme } from './themes';
import { COMMANDS } from './commands';
import { TitleBar } from './components/TitleBar';
import { Starfield } from './components/Starfield';
import { Chat, type Message } from './components/Chat';
import { Composer, type Attachment } from './components/Composer';
import { Bookshelf } from './components/Bookshelf';
import { ThemePopup } from './components/ThemePopup';
import { ModelPopup } from './components/ModelPopup';
import { McpPopup } from './components/McpPopup';
import { AgentPopup } from './components/AgentPopup';

type Popup = null | 'model' | 'themes' | 'mcp' | 'agents';
const uid = () => Math.random().toString(36).slice(2);

export default function App() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [bootError, setBootError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [thinking, setThinking] = useState(false);
  const [popup, setPopup] = useState<Popup>(null);
  const [themeId, setThemeId] = useState('deep-space');
  const [plusUnlocked, setPlusUnlocked] = useState(false);
  const [railHidden, setRailHidden] = useState(false);
  const [activeModel, setActiveModel] = useState<{ provider: string; model: string } | null>(null);
  const [selectedAgents, setSelectedAgents] = useState<Set<string>>(new Set());
  const [workingAgents, setWorkingAgents] = useState<Set<string>>(new Set());
  const [mcpContext, setMcpContext] = useState<Set<string>>(new Set());
  const abortRef = useRef<AbortController | null>(null);

  async function refreshConfig() {
    const c = await api.config();
    setConfig(c);
    return c;
  }

  useEffect(() => {
    (async () => {
      const boot = await initApi();
      if (!boot.ok) { setBootError('Gateway not reachable. Launch with `citrine s`.'); return; }
      try {
        const c = await refreshConfig();
        const tId = c.settings.theme || 'deep-space';
        const theme = THEMES.find((t) => t.id === tId) || THEMES[0];
        applyTheme(theme); setThemeId(theme.id);
        setPlusUnlocked(!!c.settings.backgroundsPlus);
        setActiveModel(c.settings.activeModel || null);
      } catch (e) { setBootError(String((e as Error).message)); }
    })();
  }, []);

  function addAssistantNote(content: string) {
    setMessages((m) => [...m, { id: uid(), role: 'assistant', content }]);
  }

  function handleCommand(name: string) {
    switch (name) {
      case 'model': case 'models': case 'provider': case 'pricing': setPopup('model'); break;
      case 'themes': setPopup('themes'); break;
      case 'backgrounds-plus': setPopup('themes'); break;
      case 'mcp': case 'connect': setPopup('mcp'); break;
      case 'agent-x': case 'agent': case 'agents': setPopup('agents'); break;
      case 'bookshelf': setRailHidden((v) => !v); break;
      case 'new': case 'clear': setMessages([]); break;
      case 'help':
        addAssistantNote('Available commands:\n' + COMMANDS.map((c) => `  ${c.name}${c.args ? ' ' + c.args : ''}  —  ${c.desc}`).join('\n'));
        break;
      default:
        addAssistantNote(`/${name} is registered but not yet wired in this build. Try /model, /themes, /mcp, or /agent-x.`);
    }
  }

  async function pickModel(provider: string, model: string) {
    setActiveModel({ provider, model });
    setPopup(null);
    await api.saveSettings({ activeModel: { provider, model } }).catch(() => {});
  }

  async function pickTheme(t: (typeof THEMES)[number]) {
    applyTheme(t); setThemeId(t.id); setPopup(null);
    await api.saveSettings({ theme: t.id }).catch(() => {});
  }

  async function unlockPlus() {
    // v1: simulate the purchase unlock. Real payment flow is a later pass.
    setPlusUnlocked(true);
    await api.saveSettings({ backgroundsPlus: true }).catch(() => {});
  }

  async function handleSubmit(text: string, attachments: Attachment[]) {
    if (!activeModel) { addAssistantNote('No model selected yet. Open **/model** to choose one (models are listed newest-first with pricing).'); return; }

    const attachBlocks = attachments
      .map((a) => a.content ? `\n\n--- attached: ${a.name} ---\n${a.content}` : `\n\n--- attached: ${a.name} (binary/linked) ---`)
      .join('');
    const userContent = text + attachBlocks;

    const userMsg: Message = { id: uid(), role: 'user', content: text || '(files attached)', attachments: attachments.map((a) => a.name) };
    setMessages((m) => [...m, userMsg]);
    setThinking(true);

    // Build the outgoing conversation.
    const sys: ChatMsg[] = [];
    if (mcpContext.size) sys.push({ role: 'system', content: `The user has these apps connected via MCP and may want you to use them: ${[...mcpContext].join(', ')}.` });
    if (selectedAgents.size && config) {
      const names = config.agents.filter((a) => selectedAgents.has(a.id));
      sys.push({ role: 'system', content: `Work as a team of collaborating agents. Have them discuss and combine their perspectives:\n${names.map((a) => `- ${a.name}: ${a.description}`).join('\n')}` });
      setWorkingAgents(new Set(selectedAgents));
    }
    const history: ChatMsg[] = messages.map((m) => ({ role: m.role, content: m.content }));
    const outgoing: ChatMsg[] = [...sys, ...history, { role: 'user', content: userContent }];

    const assistantId = uid();
    setMessages((m) => [...m, { id: assistantId, role: 'assistant', content: '', streaming: true }]);
    const ac = new AbortController();
    abortRef.current = ac;
    let first = true;

    await api.chat(
      { provider: activeModel.provider, model: activeModel.model, messages: outgoing },
      {
        delta: (t) => {
          if (first) { setThinking(false); first = false; }
          setMessages((m) => m.map((x) => (x.id === assistantId ? { ...x, content: x.content + t } : x)));
        },
        done: () => {
          setThinking(false); setWorkingAgents(new Set());
          setMessages((m) => m.map((x) => (x.id === assistantId ? { ...x, streaming: false } : x)));
        },
        error: (msg) => {
          setThinking(false); setWorkingAgents(new Set());
          setMessages((m) => m.map((x) => (x.id === assistantId ? { ...x, streaming: false, content: x.content || `⚠ ${msg}` } : x)));
        },
      },
      ac.signal,
    ).catch((e) => { setThinking(false); addAssistantNote(`⚠ ${String(e.message)}`); });
  }

  const modelLabel = activeModel ? activeModel.model : '';
  const apps = config ? Object.values(config.appMcps).filter((m) => m.connected).length : 0;

  if (bootError) {
    return (
      <div className="app"><TitleBar />
        <div style={{ display: 'grid', placeItems: 'center', flex: 1, padding: 40, textAlign: 'center' }}>
          <div><div className="welcome"><div className="wordmark">citrine</div></div>
            <p className="note" style={{ maxWidth: 420 }}>{bootError}</p></div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <Starfield />
      <TitleBar />
      <div className="body">
        <div className="main">
          <Chat messages={messages} thinking={thinking} username={config?.account?.username || 'user'} />
          <Composer
            status={{ model: modelLabel, provider: activeModel?.provider || '', apps, skills: COMMANDS.length }}
            disabled={false}
            onSubmit={handleSubmit}
            onCommand={handleCommand}
          />
        </div>
        <div className={`rail ${railHidden ? 'hidden' : ''}`}>
          <Bookshelf
            mcps={config ? Object.values(config.appMcps) : []}
            agents={config?.agents || []}
            workingAgents={workingAgents}
            onInsertMcp={(name) => setMcpContext((s) => new Set(s).add(name))}
            onOpenMcp={() => setPopup('mcp')}
            onOpenAgents={() => setPopup('agents')}
          />
        </div>
      </div>

      {popup === 'model' && <ModelPopup active={activeModel} onPick={pickModel} onClose={() => setPopup(null)} />}
      {popup === 'themes' && <ThemePopup current={themeId} plusUnlocked={plusUnlocked} onPick={pickTheme} onClose={() => setPopup(null)} onWantPlus={unlockPlus} />}
      {popup === 'mcp' && <McpPopup connected={config ? config.appMcps : {}} onConnected={refreshConfig} onClose={() => setPopup(null)} />}
      {popup === 'agents' && (
        <AgentPopup
          agents={config?.agents || []}
          selected={selectedAgents}
          active={activeModel}
          onToggle={(id) => setSelectedAgents((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; })}
          onCreated={refreshConfig}
          onClose={() => setPopup(null)}
        />
      )}
    </div>
  );
}
