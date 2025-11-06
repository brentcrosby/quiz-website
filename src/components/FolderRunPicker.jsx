import { useEffect, useMemo, useState } from 'react';

export function FolderRunPicker({ type, sets, onRun }) {
  const [selectedIds, setSelectedIds] = useState(() => new Set(sets.map((set) => set.id)));

  useEffect(() => {
    setSelectedIds(new Set(sets.map((set) => set.id)));
  }, [sets]);

  const handleToggle = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedIds(new Set(sets.map((set) => set.id)));
  };

  const handleClearAll = () => {
    setSelectedIds(new Set());
  };

  const selectedSets = useMemo(() => sets.filter((set) => selectedIds.has(set.id)), [sets, selectedIds]);
  const totalItems = useMemo(
    () => selectedSets.reduce((sum, set) => sum + (set.items?.length ?? 0), 0),
    [selectedSets]
  );

  if (!sets.length) {
    return <p className="empty-state">This folder does not have any sets of this type yet.</p>;
  }

  return (
    <div className="folder-run stack">
      <p className="muted small">
        {type === 'practice'
          ? 'Select the practice tests you want to combine, then launch a shared session.'
          : 'Select the flashcard sets you want to combine, then launch a shared session.'}
      </p>
      <div className="folder-run__controls">
        <button
          type="button"
          className="button ghost compact"
          onClick={handleClearAll}
          disabled={selectedIds.size === 0}
        >
          Clear All
        </button>
        <button
          type="button"
          className="button ghost compact"
          onClick={handleSelectAll}
          disabled={selectedIds.size === sets.length}
        >
          Select All
        </button>
      </div>
      <ul className="folder-run__list">
        {sets.map((set) => {
          const checked = selectedIds.has(set.id);
          const itemCount = set.items?.length ?? 0;
          return (
            <li key={set.id} className={`folder-run__item ${checked ? 'is-selected' : ''}`}>
              <label>
                <input type="checkbox" checked={checked} onChange={() => handleToggle(set.id)} />
                <span className="folder-run__item-title">{set.title}</span>
              </label>
              <span className="folder-run__item-meta">
                {itemCount} {itemCount === 1 ? 'item' : 'items'}
              </span>
            </li>
          );
        })}
      </ul>
      <div className="folder-run__summary">
        <strong>
          {selectedIds.size} {selectedIds.size === 1 ? 'set' : 'sets'} selected
        </strong>
        <span>
          Includes {totalItems} {totalItems === 1 ? 'item' : 'items'}
        </span>
      </div>
      <button type="button" className="button" disabled={!selectedIds.size} onClick={() => onRun(Array.from(selectedIds))}>
        Run {type === 'practice' ? 'Practice Tests' : 'Flashcards'}
      </button>
    </div>
  );
}
