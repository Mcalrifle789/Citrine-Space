import { Modal } from './Modal';
import { THEMES, type Theme } from '../themes';

// /themes — every background with a live thumbnail. Backgrounds Plus entries are
// gated behind the paid plugin flag and show a lock until unlocked.
export function ThemePopup({
  current, plusUnlocked, onPick, onClose, onWantPlus,
}: { current: string; plusUnlocked: boolean; onPick: (t: Theme) => void; onClose: () => void; onWantPlus: () => void }) {
  return (
    <Modal title="/themes" sub={`${THEMES.length} backgrounds · click to apply`} onClose={onClose}>
      <div className="themegrid">
        {THEMES.map((t) => {
          const locked = !!t.plus && !plusUnlocked;
          return (
            <div
              key={t.id}
              className={`themecard ${current === t.id ? 'active' : ''}`}
              onClick={() => (locked ? onWantPlus() : onPick(t))}
            >
              <div className="thumb" style={{ background: t.swatch }} />
              <div className="label">
                <span>{t.name}</span>
                {t.plus && <span className="lock">{locked ? '🔒 Plus' : '✦ Plus'}</span>}
              </div>
            </div>
          );
        })}
      </div>
      <p className="note" style={{ marginTop: 12 }}>
        <b style={{ color: 'var(--accent)' }}>Backgrounds Plus</b> unlocks 20+ extra backgrounds and “create your own”.
        {!plusUnlocked && <> Suggested price: <b>$4.99 one-time</b> (or $2/mo). <a onClick={onWantPlus} style={{ color: 'var(--accent)', cursor: 'pointer' }}>Unlock →</a></>}
      </p>
    </Modal>
  );
}
