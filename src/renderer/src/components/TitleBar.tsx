// Frameless-window title bar with draggable region + custom window controls.
export function TitleBar() {
  const w = window.citrine?.window;
  return (
    <div className="titlebar">
      <div className="tab">
        <span className="dot" />
        <span>Citrine Space chat</span>
      </div>
      <div className="spacer" />
      <div className="winbtns">
        <button className="winbtn" title="Minimize" onClick={() => w?.minimize()}>—</button>
        <button className="winbtn" title="Maximize" onClick={() => w?.maximize()}>▢</button>
        <button className="winbtn close" title="Close" onClick={() => w?.close()}>✕</button>
      </div>
    </div>
  );
}
