export function SetList({ sets, onLoad, onRename, onDelete, currentId }) {
  return (
    <section className="library stack" aria-live="polite">
      <div className="library-header">
        <div>
          <strong>Saved Sets</strong>
          <p className="muted small">
            {sets.length ? 'Choose a set to load or manage its details.' : 'You have no saved sets yet.'}
          </p>
        </div>
        <span className="pill">{sets.length}</span>
      </div>
      {sets.length === 0 ? (
        <p className="empty-state">
          Click <strong>New Set</strong> or use Quick Add to build your first collection.
        </p>
      ) : (
        <ul className="library-list">
          {sets.map((set) => (
            <li
              key={set.id}
              className={`library-item ${currentId === set.id ? 'is-active' : ''}`}
            >
              <button
                type="button"
                className="library-item__primary"
                aria-current={currentId === set.id ? 'true' : undefined}
                onClick={() => onLoad(set.id)}
              >
                <span className="library-item__title">{set.title}</span>
                <span className="library-item__meta">
                  {set.items.length} {set.items.length === 1 ? 'item' : 'items'} ·{' '}
                  {set.type === 'practice' ? 'Practice test' : 'Flashcards'}
                </span>
              </button>
              <div className="library-item__actions">
                <button type="button" className="button ghost" onClick={() => onRename(set.id)}>
                  Rename
                </button>
                <button type="button" className="button ghost danger" onClick={() => onDelete(set.id)}>
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
