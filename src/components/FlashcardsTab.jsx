import { useEffect, useRef, useState } from 'react';
import { shuffle } from '../utils/shuffle.js';

export function FlashcardsTab({ items, isActive }) {
  const [queue, setQueue] = useState([]);
  const [flipped, setFlipped] = useState(false);
  const [showTermFirst, setShowTermFirst] = useState(true);
  const [readAloudEnabled, setReadAloudEnabled] = useState(false);
  const [speechRate, setSpeechRate] = useState(1);
  const [voice, setVoice] = useState(null);

  const synthRef = useRef(null);
  const supportsSpeech =
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    'SpeechSynthesisUtterance' in window;

  const handleCancelSpeech = () => {
    if (!supportsSpeech) {
      return;
    }
    synthRef.current?.cancel?.();
  };

  const rebuildQueue = () => {
    handleCancelSpeech();
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

  useEffect(() => {
    if (!supportsSpeech) {
      return;
    }
    synthRef.current = window.speechSynthesis;

    const loadVoices = () => {
      const available = synthRef.current.getVoices();
      if (!available.length) {
        return;
      }
      const daniel = available.find((entry) => entry.name?.toLowerCase().includes('daniel'));
      if (daniel) {
        setVoice((prev) => (prev?.name === daniel.name ? prev : daniel));
        return;
      }
      setVoice((prev) => prev ?? available[0]);
    };

    loadVoices();
    const synth = synthRef.current;
    if (!synth) {
      return;
    }
    if (synth.addEventListener) {
      synth.addEventListener('voiceschanged', loadVoices);
    } else if ('onvoiceschanged' in synth) {
      synth.onvoiceschanged = loadVoices;
    }

    return () => {
      if (!synth) {
        return;
      }
      if (synth.removeEventListener) {
        synth.removeEventListener('voiceschanged', loadVoices);
      } else if ('onvoiceschanged' in synth) {
        synth.onvoiceschanged = null;
      }
    };
  }, [supportsSpeech]);

  useEffect(() => {
    if (!supportsSpeech || readAloudEnabled) {
      return;
    }
    synthRef.current?.cancel?.();
  }, [supportsSpeech, readAloudEnabled]);

  const speak = (text) => {
    if (!supportsSpeech || !text?.trim()) {
      return;
    }
    const utterance = new window.SpeechSynthesisUtterance(text);
    utterance.rate = speechRate;
    if (voice) {
      utterance.voice = voice;
    }
    synthRef.current?.cancel();
    synthRef.current?.speak(utterance);
  };

  const handleFlip = () => {
    handleCancelSpeech();
    setFlipped((prev) => !prev);
  };

  const handleGot = () => {
    handleCancelSpeech();
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
    handleCancelSpeech();
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

  useEffect(() => {
    if (!supportsSpeech) {
      return;
    }
    if (!isActive) {
      handleCancelSpeech();
      return;
    }
    if (!readAloudEnabled) {
      handleCancelSpeech();
      return;
    }
    if (!current) {
      handleCancelSpeech();
      return;
    }
    const visibleText = flipped ? back : front;
    if (!visibleText) {
      return;
    }
    speak(visibleText);
  }, [supportsSpeech, isActive, readAloudEnabled, current, flipped, front, back, speechRate, voice]);

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
          <div className="card flash-options">
            <div className="flash-options__row">
              <label className="inline" style={{ gap: '6px' }}>
                <input
                  type="checkbox"
                  checked={showTermFirst}
                  onChange={(event) => setShowTermFirst(event.target.checked)}
                />
                Show term first
              </label>
              <label className="inline" style={{ gap: '6px' }}>
                <input
                  type="checkbox"
                  checked={readAloudEnabled}
                  onChange={(event) => setReadAloudEnabled(event.target.checked)}
                  disabled={!supportsSpeech}
                />
                Read aloud
              </label>
              <span className="muted small">{queue.length} left</span>
            </div>
            {supportsSpeech ? (
              <div className="flash-options__row">
                <label className="inline" style={{ gap: '6px' }} htmlFor="flashcard-speech-rate">
                  Speed
                </label>
                <input
                  id="flashcard-speech-rate"
                  type="range"
                  min="0.5"
                  max="1.5"
                  step="0.1"
                  value={speechRate}
                  onChange={(event) => setSpeechRate(Number(event.target.value))}
                  disabled={!readAloudEnabled}
                  style={{ flex: '1 1 150px' }}
                />
                <span className="muted small">{speechRate.toFixed(1)}×</span>
              </div>
            ) : (
              <p className="muted small">Read aloud is not supported in this browser.</p>
            )}
            <div className="flash-options__actions">
              <button type="button" className="button secondary" onClick={rebuildQueue}>
                Shuffle
              </button>
              <button type="button" className="button ghost" onClick={rebuildQueue}>
                Reset
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
