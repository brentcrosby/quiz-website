import { useEffect, useRef, useState } from 'react';

export function EditTab({
  draft,
  onChangeTitle,
  onChangeType,
  onChangeItem,
  onChangePracticePrompt,
  onChangePracticeKind,
  onChangePracticeCorrectAnswer,
  onChangePracticeDistractor,
  onAddPracticeDistractor,
  onRemovePracticeDistractor,
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
  const isPracticeSet = draft.type === 'practice';

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
        <div className="edit-header__field">
          <label htmlFor="setType" className="edit-label">
            Set type
          </label>
          <select
            id="setType"
            value={draft.type}
            onChange={(event) => onChangeType && onChangeType(event.target.value)}
          >
            <option value="flashcard">Flashcards</option>
            <option value="practice">Practice Test</option>
          </select>
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
          {draft.items.length}{' '}
          {isPracticeSet
            ? draft.items.length === 1
              ? 'question'
              : 'questions'
            : draft.items.length === 1
              ? 'row'
              : 'rows'}
        </span>
        <div className="edit-toolbar__buttons">
          <button type="button" className="button secondary" onClick={onAddRow}>
            {isPracticeSet ? 'Add Question' : 'Add Row'}
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
          if (!isPracticeSet) {
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
          }

          const promptId = `prompt-${item.id}`;
          const typeId = `kind-${item.id}`;
          const correctId = `correct-${item.id}`;
          const questionKind = item.kind === 'trueFalse' ? 'trueFalse' : 'multipleChoice';

          return (
            <article className="edit-row" key={item.id}>
              <div className="edit-row__grid">
                <div className="edit-field" style={{ gridColumn: '1 / -1' }}>
                  <label className="edit-label" htmlFor={promptId}>
                    Question
                  </label>
                  <textarea
                    id={promptId}
                    placeholder="Enter question prompt"
                    value={item.prompt}
                    onChange={(event) =>
                      onChangePracticePrompt &&
                      onChangePracticePrompt(index, event.target.value)
                    }
                    rows={3}
                  />
                </div>
                <div className="edit-field">
                  <label className="edit-label" htmlFor={typeId}>
                    Question type
                  </label>
                  <select
                    id={typeId}
                    value={questionKind}
                    onChange={(event) =>
                      onChangePracticeKind &&
                      onChangePracticeKind(index, event.target.value)
                    }
                  >
                    <option value="multipleChoice">Multiple choice</option>
                    <option value="trueFalse">True / False</option>
                  </select>
                </div>
                <div className="edit-field">
                  <label className="edit-label" htmlFor={correctId}>
                    Correct answer
                  </label>
                  {questionKind === 'trueFalse' ? (
                    <select
                      id={correctId}
                      value={item.correctAnswer === 'False' ? 'False' : 'True'}
                      onChange={(event) =>
                        onChangePracticeCorrectAnswer &&
                        onChangePracticeCorrectAnswer(index, event.target.value)
                      }
                    >
                      <option value="True">True</option>
                      <option value="False">False</option>
                    </select>
                  ) : (
                    <input
                      id={correctId}
                      placeholder="Enter the correct answer"
                      value={item.correctAnswer}
                      onChange={(event) =>
                        onChangePracticeCorrectAnswer &&
                        onChangePracticeCorrectAnswer(index, event.target.value)
                      }
                    />
                  )}
                </div>
                {questionKind === 'multipleChoice' ? (
                  <div className="edit-field" style={{ gridColumn: '1 / -1' }}>
                    <span className="edit-label">Incorrect options</span>
                    <div className="stack" style={{ gap: '8px' }}>
                      {item.distractors?.map((option, optionIndex) => {
                        const optionId = `${item.id}-d-${optionIndex}`;
                        return (
                          <div key={optionId} className="inline" style={{ alignItems: 'stretch' }}>
                            <input
                              id={optionId}
                              placeholder="Enter an incorrect option"
                              value={option}
                              onChange={(event) =>
                                onChangePracticeDistractor &&
                                onChangePracticeDistractor(index, optionIndex, event.target.value)
                              }
                            />
                            <button
                              type="button"
                              className="button ghost"
                              onClick={() =>
                                onRemovePracticeDistractor &&
                                onRemovePracticeDistractor(index, optionIndex)
                              }
                              aria-label="Remove option"
                            >
                              Remove
                            </button>
                          </div>
                        );
                      })}
                      <div>
                        <button
                          type="button"
                          className="button secondary"
                          onClick={() =>
                            onAddPracticeDistractor && onAddPracticeDistractor(index)
                          }
                        >
                          Add Option
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="edit-field" style={{ gridColumn: '1 / -1' }}>
                    <span className="muted small">
                      Learners will see both True and False. Choose which is correct above.
                    </span>
                  </div>
                )}
              </div>
              <button
                type="button"
                className="button ghost edit-row__remove"
                aria-label="Remove question"
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
