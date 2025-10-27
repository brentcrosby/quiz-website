import { useEffect, useState } from 'react';
import { shuffle } from '../utils/shuffle.js';

export function FlashcardsTab({ items, isActive }) {
  const [queue, setQueue] = useState([]);
  const [flipped, setFlipped] = useState(false);
  const [showTermFirst, setShowTermFirst] = useState(true);

  const rebuildQueue = () => {
    setQueue(shuffle(items.map((item) => ({ id: item.id, term: item.term, def: item.def }))));
    setFlipped(false);
  };

  useEffect(() => {
    if (!isActive) {
      return;
    }
    if (!items.length) {
      setQueue([]);
      setFlipped(false);
      return;
    }
    rebuildQueue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, isActive]);

  useEffect(() => {
    setFlipped(false);
  }, [showTermFirst]);

  const handleFlip = () => {
    setFlipped((prev) => !prev);
  };

  const handleGot = () => {
    setQueue((prev) => {
      if (!prev.length) {
        return prev;
      }
      const [, ...rest] = prev;
      return rest;
    });
    setFlipped(false);
  };

  const handleKeep = () => {
    setQueue((prev) => {
      if (prev.length <= 1) {
        return prev;
      }
      const [first, ...rest] = prev;
      return [...rest, first];
    });
    setFlipped(false);
  };

  const current = queue[0];
  const front = current
    ? showTermFirst
      ? current.term
      : current.def
    : flipped
      ? ''
      : 'All done!';
  const back = current
    ? showTermFirst
      ? current.def
      : current.term
    : '';

  return (
    <section
      id="tab-flash"
      className={`tab-panel stack ${isActive ? 'active' : ''}`}
      role="tabpanel"
      aria-label="Flashcards"
      hidden={!isActive}
    >
      {!items.length ? (
        <p className="empty-state">Add study items to flip through flashcards.</p>
      ) : (
        <>
          <div className="card inline" style={{ justifyContent: 'space-between', gap: '12px' }}>
            <div className="inline" style={{ gap: '12px', flexWrap: 'wrap' }}>
              <label className="inline" style={{ gap: '6px' }}>
                <input
                  type="checkbox"
                  checked={showTermFirst}
                  onChange={(event) => setShowTermFirst(event.target.checked)}
                />
                Show term first
              </label>
              <span className="muted small">{queue.length} left</span>
            </div>
            <div className="inline" style={{ gap: '8px' }}>
              <button type="button" className="button secondary" onClick={rebuildQueue}>
                Shuffle
              </button>
              <button type="button" className="button ghost" onClick={rebuildQueue}>
                Reset
              </button>
            </div>
          </div>
          <div className="flash-wrap">
            <div
              className="flash-card"
              tabIndex={0}
              role="button"
              onClick={handleFlip}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  handleFlip();
                }
              }}
            >
              <div className="flash-term">{front}</div>
              {current && (flipped || !showTermFirst) && (
                <div className="flash-def">{back}</div>
              )}
              {current && !flipped && showTermFirst && (
                <div className="flash-def muted small">(Tap to reveal)</div>
              )}
            </div>
            <div className="flash-controls">
              <button type="button" className="button ok" onClick={handleGot}>
                Got it
              </button>
              <button type="button" className="button secondary" onClick={handleKeep}>
                Keep practicing
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

