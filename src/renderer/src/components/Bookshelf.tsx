import type { Agent } from './AgentPopup';

// Right-rail bookshelves. App MCP Bookshelf lists connected MCPs; clicking one inserts
// it into chat context. Agent Bookshelf lists agents; active ones glow while working.
export function Bookshelf({
  mcps, agents, workingAgents, onInsertMcp, onOpenMcp, onOpenAgents,
}: {
  mcps: Array<{ id: string; name: string; connected: boolean }>;
  agents: Agent[];
  workingAgents: Set<string>;
  onInsertMcp: (name: string) => void;
  onOpenMcp: () => void;
  onOpenAgents: () => void;
}) {
  const connected = mcps.filter((m) => m.connected);
  return (
    <>
      <div className="shelf">
        <h4>App MCPs <button className="winbtn" style={{ width: 22, height: 20 }} onClick={onOpenMcp}>＋</button></h4>
        <div className="items">
          {connected.length === 0 && <div className="empty">No apps connected. Use <b>/MCP</b> to connect Figma, Canva, Trello…</div>}
          {connected.map((m) => (
            <div key={m.id} className="shelfitem on" title="Insert into chat context" onClick={() => onInsertMcp(m.name)}>
              <span className="badge" />{m.name}
            </div>
          ))}
        </div>
      </div>

      <div className="shelf">
        <h4>Agents <button className="winbtn" style={{ width: 22, height: 20 }} onClick={onOpenAgents}>＋</button></h4>
        <div className="items">
          {agents.length === 0 && <div className="empty">No agents yet. Use <b>/agent-x</b> to create or select agents.</div>}
          {agents.map((a) => (
            <div key={a.id} className={`shelfitem ${workingAgents.has(a.id) ? 'on working' : ''}`} title={a.description} onClick={onOpenAgents}>
              <span className="badge" />{a.name}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
