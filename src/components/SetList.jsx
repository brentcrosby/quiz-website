import { UNSORTED_FOLDER_NAME } from '../constants/folders.js';

export function SetList({
  sets,
  folders = {},
  onLoad,
  onRename,
  onDelete,
  currentId,
  onCreateFolder,
  onToggleFolder,
  onRunFolder
}) {
  const sections = (() => {
    const map = new Map();
    sets.forEach((set) => {
      const folderName = set.folder?.trim() || UNSORTED_FOLDER_NAME;
      if (!map.has(folderName)) {
        map.set(folderName, []);
      }
      map.get(folderName).push(set);
    });
    Object.keys(folders).forEach((name) => {
      const trimmed = name.trim();
      if (trimmed && !map.has(trimmed)) {
        map.set(trimmed, []);
      }
    });
    return Array.from(map.entries())
      .map(([folder, group]) => {
        const sortedSets = group
          .slice()
          .sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }));
        return {
          folder,
          sets: sortedSets,
          collapsed: folders[folder]?.collapsed ?? false,
          hasFlashcards: sortedSets.some((set) => set.type === 'flashcard'),
          hasPractice: sortedSets.some((set) => set.type === 'practice')
        };
      })
      .sort((a, b) => {
        if (a.folder === UNSORTED_FOLDER_NAME) {
          return b.folder === UNSORTED_FOLDER_NAME ? 0 : -1;
        }
        if (b.folder === UNSORTED_FOLDER_NAME) {
          return 1;
        }
        return a.folder.localeCompare(b.folder, undefined, { sensitivity: 'base' });
      });
  })();
  const totalCount = sets.length;
  return (
    <section className="library stack" aria-live="polite">
      <div className="library-header">
        <div>
          <strong>Saved Sets</strong>
          <p className="muted small">
            {totalCount ? 'Choose a set to load or manage its details.' : 'You have no saved sets yet.'}
          </p>
        </div>
        <div className="library-header__actions">
          {onCreateFolder ? (
            <button type="button" className="button ghost compact" onClick={onCreateFolder}>
              Add Folder
            </button>
          ) : null}
          <span className="pill">{totalCount}</span>
        </div>
      </div>
      {sections.length === 0 ? (
        <p className="empty-state">
          Click <strong>New Set</strong> or use Quick Add to build your first collection.
        </p>
      ) : (
        <div className="library-sections stack">
          {sections.map((section) => (
            <article key={section.folder} className="library-section stack">
              <div className="library-section__header">
                <button
                  type="button"
                  className="library-section__toggle"
                  aria-expanded={!section.collapsed}
                  onClick={() => onToggleFolder && onToggleFolder(section.folder)}
                >
                  <span className="library-section__caret" aria-hidden="true">
                    {section.collapsed ? '▸' : '▾'}
                  </span>
                  <span className="library-section__title">{section.folder}</span>
                  <span className="pill">{section.sets.length}</span>
                </button>
                <div className="library-section__actions">
                  <button
                    type="button"
                    className="button ghost compact"
                    disabled={!section.hasFlashcards}
                    onClick={() => onRunFolder && onRunFolder(section.folder, 'flashcard')}
                  >
                    Run Flashcards
                  </button>
                  <button
                    type="button"
                    className="button ghost compact"
                    disabled={!section.hasPractice}
                    onClick={() => onRunFolder && onRunFolder(section.folder, 'practice')}
                  >
                    Run Practice
                  </button>
                </div>
              </div>
              {section.collapsed ? null : section.sets.length ? (
                <ul className="library-list">
                  {section.sets.map((set) => (
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
              ) : (
                <p className="library-empty-folder">No sets in this folder yet.</p>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
