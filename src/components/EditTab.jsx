import { useEffect, useRef, useState } from 'react';

export function EditTab({
  draft,
  onChangeTitle,
  onChangeItem,
  onAddRow,
  onRemoveRow,
  onShuffleRows,
  onClearRows,
  onSave,
  onExport,
  onImportSet,
  isActive
}) {
  const fileInputRef = useRef(null);
  const menuContainerRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }
    const handlePointerDown = (event) => {
      if (!menuContainerRef.current) {
        return;
      }
      if (!menuContainerRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
      }
    };
    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen]);

  const handleToggleMenu = () => {
    setMenuOpen((prev) => !prev);
  };

  const handleExportClick = () => {
    setMenuOpen(false);
    onExport();
  };

  const handleImportClick = () => {
    setMenuOpen(false);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    try {
      const text = await file.text();
      const payload = JSON.parse(text);
      onImportSet(payload);
    } catch (error) {
      alert('Invalid JSON file');
    } finally {
      event.target.value = '';
    }
  };

  return (
    <section
      className={`tab-panel stack edit-tab ${isActive ? 'active' : ''}`}
      id="tab-edit"
      role="tabpanel"
      aria-label="Edit"
      hidden={!isActive}
    >
      <div className="edit-header">
        <div className="edit-header__field">
          <label htmlFor="setTitle" className="edit-label">
            Set title
          </label>
          <input
            id="setTitle"
            placeholder="e.g., Constitution Clauses"
            value={draft.title}
            onChange={(event) => onChangeTitle(event.target.value)}
          />
        </div>
        <div className="edit-header__actions">
          <button type="button" className="button" onClick={onSave}>
            Save Changes
          </button>
          <div className="menu" ref={menuContainerRef}>
            <button
              type="button"
              className="button ghost"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              onClick={handleToggleMenu}
            >
              More
            </button>
            {menuOpen ? (
              <div className="menu__panel" role="menu">
                <button type="button" role="menuitem" onClick={handleExportClick}>
                  Export JSON
                </button>
                <button type="button" role="menuitem" onClick={handleImportClick}>
                  Import JSON
                </button>
              </div>
            ) : null}
          </div>
          <input
            ref={fileInputRef}
            onChange={handleFileChange}
            type="file"
            accept="application/json"
            hidden
          />
        </div>
      </div>
      <div className="edit-toolbar">
        <span className="muted small">
          {draft.items.length} {draft.items.length === 1 ? 'row' : 'rows'}
        </span>
        <div className="edit-toolbar__buttons">
          <button type="button" className="button secondary" onClick={onAddRow}>
            Add Row
          </button>
          <button type="button" className="button ghost" onClick={onShuffleRows}>
            Shuffle
          </button>
          <button type="button" className="button ghost danger" onClick={onClearRows}>
            Clear All
          </button>
        </div>
      </div>
      <div className="edit-rows">
        {draft.items.map((item, index) => {
          const termId = `term-${item.id}`;
          const defId = `def-${item.id}`;
          return (
            <article className="edit-row" key={item.id}>
              <div className="edit-row__grid">
                <div className="edit-field">
                  <label className="edit-label" htmlFor={termId}>
                    Term
                  </label>
                  <input
                    id={termId}
                    placeholder="Enter term"
                    value={item.term}
                    onChange={(event) => onChangeItem(index, 'term', event.target.value)}
                  />
                </div>
                <div className="edit-field">
                  <label className="edit-label" htmlFor={defId}>
                    Definition
                  </label>
                  <textarea
                    id={defId}
                    placeholder="Enter definition"
                    value={item.def}
                    onChange={(event) => onChangeItem(index, 'def', event.target.value)}
                    rows={3}
                  />
                </div>
              </div>
              <button
                type="button"
                className="button ghost edit-row__remove"
                aria-label="Remove row"
                onClick={() => onRemoveRow(index)}
              >
                Remove
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
