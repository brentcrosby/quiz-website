import { useState } from 'react';
import { parseQuickImport } from '../utils/parseImport.js';

const SAMPLE_TEXT = `Locke : natural rights and consent
Montesquieu : separation of powers
Articles of Confederation : weak central government without taxing or commerce power`;

export function QuickImport({ onImport, onAfterImport }) {
  const [value, setValue] = useState('');

  const handleParse = () => {
    const items = parseQuickImport(value);
    if (!items.length) {
      return;
    }
    onImport(items);
    setValue('');
    if (onAfterImport) {
      onAfterImport();
    }
  };

  return (
    <section className="quick-import stack">
      <p className="muted small">
        Paste one term per line. Use <strong>:</strong> or <strong>-</strong> between the term and definition.
      </p>
      <textarea
        id="quickImport"
        placeholder={SAMPLE_TEXT}
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
      <div className="quick-import__actions">
        <button type="button" className="button" onClick={handleParse}>
          Add Items
        </button>
        <button type="button" className="button ghost" onClick={() => setValue('')}>
          Clear
        </button>
      </div>
      <div className="quick-import__hint muted small">
        CSV works too—only the first comma is used as a separator.
      </div>
    </section>
  );
}
