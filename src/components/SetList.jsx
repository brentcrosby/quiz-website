export function SetList({ sets, onLoad, onRename, onDelete, currentId }) {
  return (
    <section className="stack">
      <div className="side-header">
        <strong>My Sets</strong>
        <span className="pill">{sets.length}</span>
      </div>
      <div className="set-list" role="list">
        {sets.length === 0 ? (
          <p className="empty-state">
            No saved sets yet. Click <strong>New Set</strong> or use Quick Import to get started.
          </p>
        ) : (
          sets.map((set) => (
            <article
              key={set.id}
              className="set-card"
              aria-current={currentId === set.id ? 'true' : undefined}
            >
              <div>
                <strong>{set.title}</strong>
                <div className="muted small">{set.items.length} items</div>
              </div>
              <div className="inline">
                <button type="button" className="button secondary" onClick={() => onLoad(set.id)}>
                  Open
                </button>
                <button type="button" className="button ghost" onClick={() => onRename(set.id)}>
                  Rename
                </button>
                <button type="button" className="button ghost danger" onClick={() => onDelete(set.id)}>
                  Delete
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

