import { useRef } from 'react';

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
      className={`tab-panel stack ${isActive ? 'active' : ''}`}
      id="tab-edit"
      role="tabpanel"
      aria-label="Edit"
      hidden={!isActive}
    >
      <div className="grid">
        <div className="card stack">
          <label htmlFor="setTitle">
            Set Title
            <input
              id="setTitle"
              placeholder="e.g., Constitution Clauses"
              value={draft.title}
              onChange={(event) => onChangeTitle(event.target.value)}
            />
          </label>
          <div className="inline">
            <button type="button" className="button" onClick={onSave}>
              Save Set
            </button>
            <button type="button" className="button secondary" onClick={onExport}>
              Export JSON
            </button>
            <input
              ref={fileInputRef}
              onChange={handleFileChange}
              type="file"
              accept="application/json"
              hidden
            />
            <button
              type="button"
              className="button ghost"
              onClick={() => fileInputRef.current?.click()}
            >
              Import JSON
            </button>
          </div>
        </div>
        <div className="card stack">
          <div className="tab-summary">
            <strong>Items</strong>
            <div className="tab-actions">
              <button type="button" className="button secondary" onClick={onAddRow}>
                Add
              </button>
              <button type="button" className="button ghost" onClick={onShuffleRows}>
                Shuffle
              </button>
              <button type="button" className="button ghost danger" onClick={onClearRows}>
                Clear
              </button>
            </div>
          </div>
          <div className="rows">
            {draft.items.map((item, index) => (
              <div className="row" key={item.id}>
                <input
                  className="term"
                  placeholder="Term"
                  value={item.term}
                  onChange={(event) => onChangeItem(index, 'term', event.target.value)}
                />
                <input
                  className="def"
                  placeholder="Definition"
                  value={item.def}
                  onChange={(event) => onChangeItem(index, 'def', event.target.value)}
                />
                <button
                  type="button"
                  className="button ghost"
                  aria-label="Remove row"
                  onClick={() => onRemoveRow(index)}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
