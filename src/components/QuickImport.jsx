import { useState } from 'react';
import { parseQuickImport } from '../utils/parseImport.js';

const SAMPLE_TEXT = `Locke : natural rights and consent
Montesquieu : separation of powers
Articles of Confederation : weak central government without taxing or commerce power`;

export function QuickImport({ onImport }) {
  const [value, setValue] = useState('');

  const handleParse = () => {
    const items = parseQuickImport(value);
    if (!items.length) {
      return;
    }
    onImport(items);
    setValue('');
  };

  return (
    <section className="stack">
      <label className="small" htmlFor="quickImport">
        <strong>Quick Import</strong>{' '}
        <span className="muted">(one per line: Term : Definition)</span>
      </label>
      <textarea
        id="quickImport"
        placeholder={SAMPLE_TEXT}
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
      <div className="inline" style={{ justifyContent: 'space-between' }}>
        <button type="button" className="button secondary" onClick={handleParse}>
          Parse
        </button>
        <button type="button" className="button ghost" onClick={() => setValue('')}>
          Clear
        </button>
      </div>
      <p className="footer">
        Tips: use <span className="kbd">:</span> or <span className="kbd">-</span> between the term
        and definition. CSV works if the first comma separates them.
      </p>
    </section>
  );
}

