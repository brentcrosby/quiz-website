import { useState } from 'react';
import { parseQuickImport, parsePracticeImport } from '../utils/parseImport.js';

const SAMPLE_FLASHCARD_TEXT = `Locke::natural rights and consent
Montesquieu::separation of powers
Articles of Confederation::weak central government without taxing or commerce power`;

const SAMPLE_PRACTICE_TEXT = `Who wrote the Declaration of Independence?::Thomas Jefferson;;George Washington;;Benjamin Franklin;;John Adams
The First Amendment protects free speech.::true`;

export function QuickImport({ onImport, onAfterImport, setType = 'flashcard' }) {
  const [value, setValue] = useState('');

  const handleParse = () => {
    const parser = setType === 'practice' ? parsePracticeImport : parseQuickImport;
    const items = parser(value);
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
      {setType === 'practice' ? (
        <p className="muted small">
          Separate the prompt and answers with <strong>::</strong>. Multiple choice answers use <strong>;;</strong>{' '}
          between options (first one is correct). True/false accepts <strong>true</strong> or <strong>false</strong>.
        </p>
      ) : (
        <p className="muted small">
          Paste one item per line. Use <strong>::</strong> between the term/question and definition/answer.
        </p>
      )}
      <textarea
        id="quickImport"
        placeholder={setType === 'practice' ? SAMPLE_PRACTICE_TEXT : SAMPLE_FLASHCARD_TEXT}
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
      <div className="quick-import__actions">
        <button type="button" className="button" onClick={handleParse}>
          {setType === 'practice' ? 'Add Questions' : 'Add Items'}
        </button>
        <button type="button" className="button ghost" onClick={() => setValue('')}>
          Clear
        </button>
      </div>
      {setType === 'practice' ? (
        <div className="quick-import__hint muted small">
          Example: <strong>What is 2+2?::4;;3;;5;;6</strong>
          <br />True/False: <strong>The sky is blue::true</strong>
        </div>
      ) : (
        <div className="quick-import__hint muted small">
          Example: <strong>Photosynthesis::process plants use to convert light into energy</strong>
        </div>
      )}
    </section>
  );
}
