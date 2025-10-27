import { useEffect, useMemo, useState } from 'react';
import { shuffle } from '../utils/shuffle.js';

const initialState = {
  pairs: [],
  bankOrder: [],
  filled: {}
};

export function MatchTab({ items, isActive }) {
  const [state, setState] = useState(initialState);
  const [correctCount, setCorrectCount] = useState(0);

  const reset = () => {
    const pairs = shuffle(
      items.map((item) => ({
        id: item.id,
        term: item.term,
        def: item.def
      }))
    );
    setState({
      pairs,
      bankOrder: shuffle(pairs.map((pair) => pair.id)),
      filled: {}
    });
    setCorrectCount(0);
  };

  useEffect(() => {
    if (!isActive) {
      return;
    }
    if (!items.length) {
      setState(initialState);
      setCorrectCount(0);
      return;
    }
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, isActive]);

  const filledValues = useMemo(() => new Set(Object.values(state.filled)), [state.filled]);

  const pairMap = useMemo(() => {
    const map = new Map();
    state.pairs.forEach((pair) => {
      map.set(pair.id, pair);
    });
    return map;
  }, [state.pairs]);

  useEffect(() => {
    if (!state.pairs.length) {
      setCorrectCount(0);
      return;
    }
    const value = state.pairs.reduce((acc, pair) => {
      return acc + (state.filled[pair.id] === pair.id ? 1 : 0);
    }, 0);
    setCorrectCount(value);
  }, [state.filled, state.pairs]);

  const handleAssign = (termId, definitionId) => {
    setState((prev) => {
      const nextFilled = { ...prev.filled };
      Object.entries(nextFilled).forEach(([key, current]) => {
        if (current === definitionId) {
          delete nextFilled[key];
        }
      });
      nextFilled[termId] = definitionId;
      return {
        ...prev,
        filled: nextFilled
      };
    });
  };

  const handleUnassign = (termId) => {
    setState((prev) => {
      const nextFilled = { ...prev.filled };
      delete nextFilled[termId];
      return {
        ...prev,
        filled: nextFilled
      };
    });
  };

  const handleDrop = (event, termId) => {
    event.preventDefault();
    const definitionId = event.dataTransfer.getData('text/plain');
    if (!definitionId) {
      return;
    }
    handleAssign(termId, definitionId);
  };

  const handlePromptPick = (termId) => {
    const assignedId = state.filled[termId];
    const available = state.bankOrder
      .map((id) => pairMap.get(id))
      .filter((pair) => pair && (!filledValues.has(pair.id) || pair.id === assignedId));
    if (assignedId && pairMap.has(assignedId)) {
      const current = pairMap.get(assignedId);
      if (!available.find((pair) => pair.id === assignedId)) {
        available.unshift(current);
      }
    }
    if (!available.length) {
      return;
    }
    const choice = window.prompt(
      'Choose definition by number:\n' +
        available.map((pair, index) => `${index + 1}. ${pair.def}`).join('\n')
    );
    const idx = Number.parseInt(choice, 10) - 1;
    if (Number.isNaN(idx) || idx < 0 || idx >= available.length) {
      return;
    }
    handleAssign(termId, available[idx].id);
  };

  const bankDefinitions = state.bankOrder
    .map((id) => pairMap.get(id))
    .filter((pair) => pair && !filledValues.has(pair.id));

  return (
    <section
      id="tab-match"
      className={`tab-panel stack ${isActive ? 'active' : ''}`}
      role="tabpanel"
      aria-label="Match"
      hidden={!isActive}
    >
      {!items.length ? (
        <p className="empty-state">Add some terms in the Edit tab first.</p>
      ) : (
        <>
          <div className="match-columns">
            <div className="card stack">
              <div className="tab-summary">
                <strong>Terms</strong>
                <small className="muted">
                  {correctCount} / {state.pairs.length} correct
                </small>
              </div>
              <div className="stack">
                {state.pairs.map((pair) => {
                  const assignedId = state.filled[pair.id];
                  const assigned = assignedId ? pairMap.get(assignedId) : null;
                  const statusClass =
                    assignedId == null
                      ? ''
                      : assignedId === pair.id
                        ? 'correct'
                        : 'incorrect';
                  const canChoose = state.bankOrder.some((id) => {
                    const target = pairMap.get(id);
                    return target && (!filledValues.has(id) || id === assignedId);
                  });
                  return (
                    <div
                      key={pair.id}
                      className={`slot ${assigned ? 'filled' : ''} ${statusClass}`}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={(event) => handleDrop(event, pair.id)}
                      role="group"
                      aria-label={`Term ${pair.term}`}
                      tabIndex={0}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault();
                          handlePromptPick(pair.id);
                        }
                      }}
                    >
                      <div>
                        <div>
                          <strong>{pair.term}</strong>
                        </div>
                        {assigned ? (
                          <div className="chip">{assigned.def}</div>
                        ) : (
                          <div className="muted small">Drop definition here</div>
                        )}
                      </div>
                      <div className="stack" style={{ alignItems: 'flex-end', gap: '6px' }}>
                        <button
                          type="button"
                          className="button ghost"
                          onClick={() => handlePromptPick(pair.id)}
                          disabled={!canChoose}
                        >
                          Choose
                        </button>
                        {assigned && (
                          <button
                            type="button"
                            className="button ghost danger"
                            onClick={() => handleUnassign(pair.id)}
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="card stack">
              <div className="tab-summary">
                <strong>Definitions</strong>
                <div className="tab-actions">
                  <button
                    type="button"
                    className="button secondary"
                    onClick={() =>
                      setState((prev) => ({
                        ...prev,
                        bankOrder: shuffle(prev.bankOrder)
                      }))
                    }
                  >
                    Reshuffle
                  </button>
                  <button type="button" className="button ghost" onClick={reset}>
                    Reset
                  </button>
                </div>
              </div>
              <div className="grid">
                {bankDefinitions.length === 0 ? (
                  <p className="empty-state">All definitions are placed.</p>
                ) : (
                  bankDefinitions.map((pair) => (
                    <div
                      key={pair.id}
                      className="chip"
                      draggable
                      onDragStart={(event) => {
                        event.dataTransfer.setData('text/plain', pair.id);
                      }}
                    >
                      {pair.def}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          <div className="notice">
            Drag a definition chip into a term slot. Keyboard: focus a term and press Enter to
            choose from the remaining definitions.
          </div>
        </>
      )}
    </section>
  );
}
