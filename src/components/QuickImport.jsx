import { useEffect, useRef, useState } from 'react';
import { parseQuickImport, parsePracticeImport } from '../utils/parseImport.js';

const SAMPLE_FLASHCARD_TEXT = `Locke::natural rights and consent
Montesquieu::separation of powers
Articles of Confederation::weak central government without taxing or commerce power`;

const SAMPLE_PRACTICE_TEXT = `Who wrote the Declaration of Independence?::Thomas Jefferson;;George Washington;;Benjamin Franklin;;John Adams
The First Amendment protects free speech.::true`;

const FLASHCARD_AI_PROMPT = `Format flashcards as plain text with no labels or numbering. Each line should be "Term::Definition" using "::" between the prompt and answer. Avoid extra commentary. Example:\nPhotosynthesis::process plants use to convert light into energy\nCell::basic unit of life`;

const PRACTICE_AI_PROMPT = `Format practice questions as plain text with no numbering. For multiple choice, output "Question::Correct Answer;;Distractor 1;;Distractor 2;;Distractor 3" and keep the correct answer first with distractors separated by ";;". For true/false, output "Question::true" or "Question::false". Example:\nWhat is 2+2?::4;;3;;5;;6\nThe sky is blue::true`;

const PROMPT_CONFIG = [
  {
    key: 'flashcard',
    label: 'AI prompt for flashcards',
    text: FLASHCARD_AI_PROMPT
  },
  {
    key: 'practice',
    label: 'AI prompt for practice tests',
    text: PRACTICE_AI_PROMPT
  }
];

export function QuickImport({ onImport, onAfterImport, setType = 'flashcard' }) {
  const [value, setValue] = useState('');
  const [copiedPrompt, setCopiedPrompt] = useState(null);
  const copyResetRef = useRef(null);

  useEffect(() => () => {
    if (copyResetRef.current) {
      window.clearTimeout(copyResetRef.current);
    }
  }, []);

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

  const handleCopyPrompt = async (key, text) => {
    let copied = false;
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        copied = true;
      } catch (error) {
        copied = false;
      }
    }
    if (!copied && typeof document !== 'undefined') {
      try {
        const scratch = document.createElement('textarea');
        scratch.value = text;
        scratch.setAttribute('readonly', '');
        scratch.style.position = 'absolute';
        scratch.style.left = '-9999px';
        document.body.appendChild(scratch);
        scratch.select();
        copied = document.execCommand('copy');
        document.body.removeChild(scratch);
      } catch (error) {
        copied = false;
      }
    }
    if (copied) {
      setCopiedPrompt(key);
      if (copyResetRef.current) {
        window.clearTimeout(copyResetRef.current);
      }
      copyResetRef.current = window.setTimeout(() => {
        setCopiedPrompt(null);
        copyResetRef.current = null;
      }, 2000);
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
      <div className="quick-import__prompts stack">
        <p className="muted small">Need AI help? Copy one of these prompts so responses paste straight into Quick Add.</p>
        {PROMPT_CONFIG.map((prompt) => (
          <div key={prompt.key} className="quick-import__prompt stack">
            <div className="quick-import__prompt-header">
              <strong className="small">{prompt.label}</strong>
              <button
                type="button"
                className="button ghost"
                onClick={() => handleCopyPrompt(prompt.key, prompt.text)}
              >
                {copiedPrompt === prompt.key ? 'Copied!' : 'Copy Prompt'}
              </button>
            </div>
            <textarea readOnly value={prompt.text} rows={prompt.key === 'practice' ? 6 : 5} />
          </div>
        ))}
      </div>
    </section>
  );
}
