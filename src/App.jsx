import { useEffect, useMemo, useRef, useState } from 'react';
import { Header } from './components/Header.jsx';
import { SetList } from './components/SetList.jsx';
import { QuickImport } from './components/QuickImport.jsx';
import { EditTab } from './components/EditTab.jsx';
import { MatchTab } from './components/MatchTab.jsx';
import { MultipleChoiceTab } from './components/MultipleChoiceTab.jsx';
import { FlashcardsTab } from './components/FlashcardsTab.jsx';
import { PracticeTestTab } from './components/PracticeTestTab.jsx';
import { PracticeQuickQuizTab } from './components/PracticeQuickQuizTab.jsx';
import { useTheme } from './context/ThemeContext.jsx';
import { useToast } from './context/ToastContext.jsx';
import { useStudySets } from './hooks/useStudySets.js';
import { createId } from './utils/id.js';
import { shuffle } from './utils/shuffle.js';

const SET_TYPES = {
  FLASHCARD: 'flashcard',
  PRACTICE: 'practice'
};

const TABS_BY_TYPE = {
  [SET_TYPES.FLASHCARD]: [
    { id: 'edit', label: 'Edit' },
    { id: 'match', label: 'Match' },
    { id: 'mc', label: 'Multiple Choice' },
    { id: 'flash', label: 'Flashcards' }
  ],
  [SET_TYPES.PRACTICE]: [
    { id: 'edit', label: 'Edit' },
    { id: 'practice-test', label: 'Practice Test' },
    { id: 'practice-quick', label: 'Quick Quiz' }
  ]
};

const createEmptyItem = (type = SET_TYPES.FLASHCARD) => {
  if (type === SET_TYPES.PRACTICE) {
    return {
      id: createId('question'),
      prompt: '',
      kind: 'multipleChoice',
      correctAnswer: '',
      distractors: ['']
    };
  }
  return {
    id: createId('row'),
    term: '',
    def: ''
  };
};

const createEmptyDraft = (type = SET_TYPES.FLASHCARD) => ({
  id: null,
  type,
  title: '',
  items:
    type === SET_TYPES.PRACTICE
      ? [createEmptyItem(SET_TYPES.PRACTICE)]
      : [createEmptyItem()]
});

const isEmptyFlashcardDraftItem = (item) => {
  const term = item.term?.trim() ?? '';
  const def = item.def?.trim() ?? '';
  return !term && !def;
};

const isEmptyPracticeDraftItem = (item) => {
  const prompt = item.prompt?.trim() ?? '';
  const correct = item.correctAnswer?.trim() ?? '';
  const hasDistractors = Array.isArray(item.distractors)
    ? item.distractors.some((value) => value?.trim())
    : false;
  return !prompt && !correct && !hasDistractors;
};

const cleanItems = (items, type = SET_TYPES.FLASHCARD) => {
  if (type === SET_TYPES.PRACTICE) {
    return items
      .map((item) => {
        const kind = item.kind === 'trueFalse' ? 'trueFalse' : 'multipleChoice';
        return {
          id: item.id ?? createId('question'),
          prompt: item.prompt?.trim() ?? '',
          kind,
          correctAnswer: item.correctAnswer?.trim() ?? '',
          distractors:
            kind === 'multipleChoice'
              ? (Array.isArray(item.distractors)
                  ? item.distractors.map((value) => value?.trim()).filter(Boolean)
                  : [])
              : []
        };
      })
      .filter((item) => {
        if (!item.prompt || !item.correctAnswer) {
          return false;
        }
        if (item.kind === 'multipleChoice') {
          return item.distractors.length > 0;
        }
        return true;
      });
  }

  return items
    .map((item) => ({
      id: item.id ?? createId('row'),
      term: item.term?.trim() ?? '',
      def: item.def?.trim() ?? ''
    }))
    .filter((item) => item.term && item.def);
};

function draftFromSet(set) {
  if (!set) {
    return createEmptyDraft();
  }
  const type = set.type === SET_TYPES.PRACTICE ? SET_TYPES.PRACTICE : SET_TYPES.FLASHCARD;
  const sanitizedItems = cleanItems(Array.isArray(set.items) ? set.items : [], type);
  const items = sanitizedItems.length ? sanitizedItems : [createEmptyItem(type)];
  return {
    id: set.id ?? null,
    type,
    title: set.title ?? '',
    items:
      type === SET_TYPES.PRACTICE
        ? items.map((item) => ({
            id: item.id ?? createId('question'),
            prompt: item.prompt ?? '',
            kind: item.kind === 'trueFalse' ? 'trueFalse' : 'multipleChoice',
            correctAnswer: item.correctAnswer ?? '',
            distractors:
              item.kind === 'multipleChoice'
                ? (() => {
                    const list = Array.isArray(item.distractors)
                      ? item.distractors.map((value) => value ?? '')
                      : [];
                    return list.length ? list : [''];
                  })()
                : []
          }))
        : items.map((item) => ({
            id: item.id ?? createId('row'),
            term: item.term ?? '',
            def: item.def ?? ''
          }))
  };
}

function downloadSetAsJson(set) {
  const blob = new Blob([JSON.stringify(set, null, 2)], {
    type: 'application/json'
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${set.title || 'study-set'}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function Sheet({ title, description, open, onClose, children }) {
  if (!open) {
    return null;
  }
  return (
    <div className="sheet" role="dialog" aria-modal="true">
      <div className="sheet__backdrop" onClick={onClose} aria-hidden="true" />
      <section className="sheet__panel stack">
        <header className="sheet__header">
          <div>
            <h2 className="sheet__title">{title}</h2>
            {description ? <p className="muted small">{description}</p> : null}
          </div>
          <button type="button" className="button ghost" onClick={onClose}>
            Close
          </button>
        </header>
        <div className="sheet__content">{children}</div>
      </section>
    </div>
  );
}

export default function App() {
  const { toggleTheme } = useTheme();
  const { addToast } = useToast();
  const { sets, currentId, setCurrentId, saveSet, deleteSet, renameSet } = useStudySets();

  const [activeTab, setActiveTab] = useState('edit');
  const [draft, setDraft] = useState(createEmptyDraft);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  const savedSets = useMemo(
    () =>
      Object.values(sets).sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' })),
    [sets]
  );

  const preparedItems = useMemo(
    () => cleanItems(draft.items, draft.type),
    [draft.items, draft.type]
  );

  const availableTabs = useMemo(
    () => TABS_BY_TYPE[draft.type] ?? TABS_BY_TYPE[SET_TYPES.FLASHCARD],
    [draft.type]
  );

  const hasInitializedDraftRef = useRef(false);

  useEffect(() => {
    if (!availableTabs.some((tab) => tab.id === activeTab)) {
      setActiveTab('edit');
    }
  }, [availableTabs, activeTab]);

  useEffect(() => {
    if (hasInitializedDraftRef.current) {
      return;
    }
    if (!currentId) {
      hasInitializedDraftRef.current = true;
      return;
    }
    const currentSet = sets[currentId];
    if (!currentSet) {
      hasInitializedDraftRef.current = true;
      return;
    }
    setDraft(draftFromSet(currentSet));
    hasInitializedDraftRef.current = true;
  }, [currentId, sets]);

  useEffect(() => {
    const handleKey = (event) => {
      if (event.key === 'Escape') {
        setLibraryOpen(false);
        setQuickAddOpen(false);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const handleNewSet = () => {
    setCurrentId(null);
    setDraft(createEmptyDraft());
    addToast('Started a fresh set');
  };

  const handleChangeTitle = (value) => {
    setDraft((prev) => ({
      ...prev,
      title: value
    }));
  };

  const handleChangeItem = (index, key, value) => {
    setDraft((prev) => {
      const items = prev.items.slice();
      items[index] = {
        ...items[index],
        [key]: value
      };
      return { ...prev, items };
    });
  };

  const handleChangeType = (nextType) => {
    if (nextType !== SET_TYPES.PRACTICE && nextType !== SET_TYPES.FLASHCARD) {
      return;
    }
    setDraft((prev) => {
      if (prev.type === nextType) {
        return prev;
      }
      const base = createEmptyDraft(nextType);
      return {
        ...base,
        id: prev.id,
        title: prev.title
      };
    });
    setActiveTab('edit');
    addToast(
      nextType === SET_TYPES.PRACTICE
        ? 'Switched to practice tests mode'
        : 'Switched to flashcards mode'
    );
  };

  const updatePracticeItem = (index, updater) => {
    setDraft((prev) => {
      if (prev.type !== SET_TYPES.PRACTICE) {
        return prev;
      }
      const current = prev.items[index];
      if (!current) {
        return prev;
      }
      const baseItem = {
        id: current.id ?? createId('question'),
        prompt: current.prompt ?? '',
        kind: current.kind === 'trueFalse' ? 'trueFalse' : 'multipleChoice',
        correctAnswer: current.correctAnswer ?? '',
        distractors:
          current.kind === 'multipleChoice'
            ? Array.isArray(current.distractors)
              ? current.distractors.slice()
              : ['']
            : []
      };
      const updated = updater(baseItem);
      const sanitized =
        updated.kind === 'trueFalse'
          ? {
              ...updated,
              kind: 'trueFalse',
              correctAnswer:
                updated.correctAnswer?.toLowerCase() === 'false' ? 'False' : 'True',
              distractors: []
            }
          : {
              ...updated,
              kind: 'multipleChoice',
              distractors:
                Array.isArray(updated.distractors) && updated.distractors.length
                  ? updated.distractors.map((value) => value ?? '')
                  : ['']
            };
      const items = prev.items.slice();
      items[index] = sanitized;
      return { ...prev, items };
    });
  };

  const handleChangePracticePrompt = (index, value) => {
    updatePracticeItem(index, (item) => ({
      ...item,
      prompt: value
    }));
  };

  const handleChangePracticeKind = (index, kind) => {
    updatePracticeItem(index, (item) => {
      const nextKind = kind === 'trueFalse' ? 'trueFalse' : 'multipleChoice';
      if (nextKind === 'trueFalse') {
        return {
          ...item,
          kind: 'trueFalse',
          correctAnswer:
            item.correctAnswer?.toLowerCase() === 'false' ? 'False' : 'True',
          distractors: []
        };
      }
      return {
        ...item,
        kind: 'multipleChoice',
        correctAnswer:
          item.correctAnswer === 'True' || item.correctAnswer === 'False'
            ? ''
            : item.correctAnswer ?? '',
        distractors: item.distractors?.length ? item.distractors : ['']
      };
    });
  };

  const handleChangePracticeCorrectAnswer = (index, value) => {
    updatePracticeItem(index, (item) => {
      if (item.kind === 'trueFalse') {
        return {
          ...item,
          correctAnswer: value?.toLowerCase() === 'false' ? 'False' : 'True'
        };
      }
      return {
        ...item,
        correctAnswer: value
      };
    });
  };

  const handleChangePracticeDistractor = (index, distractorIndex, value) => {
    updatePracticeItem(index, (item) => {
      const distractors = Array.isArray(item.distractors)
        ? item.distractors.slice()
        : [];
      distractors[distractorIndex] = value;
      return {
        ...item,
        distractors
      };
    });
  };

  const handleAddPracticeDistractor = (index) => {
    updatePracticeItem(index, (item) => ({
      ...item,
      distractors: [...(item.distractors ?? []), '']
    }));
  };

  const handleRemovePracticeDistractor = (index, distractorIndex) => {
    updatePracticeItem(index, (item) => {
      const distractors = Array.isArray(item.distractors)
        ? item.distractors.slice()
        : [];
      distractors.splice(distractorIndex, 1);
      if (!distractors.length) {
        distractors.push('');
      }
      return {
        ...item,
        distractors
      };
    });
  };

  const handleAddRow = () => {
    setDraft((prev) => ({
      ...prev,
      items: [...prev.items, createEmptyItem(prev.type)]
    }));
  };

  const handleRemoveRow = (index) => {
    setDraft((prev) => {
      const items = prev.items.slice();
      items.splice(index, 1);
      if (!items.length) {
        items.push(createEmptyItem(prev.type));
      }
      return { ...prev, items };
    });
  };

  const handleShuffleRows = () => {
    setDraft((prev) => ({
      ...prev,
      items: shuffle(prev.items)
    }));
  };

  const handleClearRows = () => {
    if (!window.confirm('Clear all rows?')) {
      return;
    }
    setDraft((prev) => ({
      ...prev,
      items: [createEmptyItem(prev.type)]
    }));
  };

  const handleSave = () => {
    try {
      const id = saveSet({
        id: draft.id,
        title: draft.title,
        type: draft.type,
        items: draft.items
      });
      setDraft((prev) => ({
        ...prev,
        id
      }));
      addToast('Set saved');
    } catch (error) {
      alert(error.message);
    }
  };

  const handleExport = () => {
    const set = {
      title: draft.title.trim(),
      type: draft.type,
      items: cleanItems(draft.items, draft.type)
    };
    downloadSetAsJson(set);
  };

  const handleImportSet = (data) => {
    if (!data || typeof data !== 'object') {
      return;
    }
    const importedDraft = draftFromSet({
      id: null,
      type: data.type,
      title: data.title ?? '',
      items: Array.isArray(data.items) ? data.items : []
    });
    setCurrentId(null);
    setDraft(importedDraft);
    addToast('Imported set from file');
  };

  const handleLoadSet = (id) => {
    const set = sets[id];
    if (!set) {
      return;
    }
    setCurrentId(id);
    setDraft(draftFromSet(set));
    addToast('Loaded set');
  };

  const handleRenameSet = (id) => {
    const current = sets[id];
    if (!current) {
      return;
    }
    const name = window.prompt('New title', current.title);
    if (!name) {
      return;
    }
    renameSet(id, name);
    if (draft.id === id) {
      setDraft((prev) => ({
        ...prev,
        title: name
      }));
    }
    addToast('Renamed');
  };

  const handleDeleteSet = (id) => {
    const current = sets[id];
    if (!current) {
      return;
    }
    if (!window.confirm(`Delete "${current.title}"?`)) {
      return;
    }
    deleteSet(id);
    if (draft.id === id) {
      setDraft(createEmptyDraft());
    }
    addToast('Deleted');
  };

  const handleQuickImport = (items) => {
    if (!items.length) {
      return;
    }
    if (draft.type === SET_TYPES.PRACTICE) {
      setDraft((prev) => ({
        ...prev,
        items: [
          ...prev.items.filter((item) => !isEmptyPracticeDraftItem(item)),
          ...items.map((item) => ({
            id: createId('question'),
            prompt: item.prompt,
            kind: item.kind === 'trueFalse' ? 'trueFalse' : 'multipleChoice',
            correctAnswer: item.correctAnswer,
            distractors:
              item.kind === 'multipleChoice'
                ? item.distractors?.length
                  ? item.distractors
                  : ['']
                : []
          }))
        ]
      }));
      addToast('Added imported questions');
      return;
    }
    setDraft((prev) => ({
      ...prev,
      items: [
        ...prev.items.filter((item) => !isEmptyFlashcardDraftItem(item)),
        ...items.map((item) => ({
          id: createId('row'),
          term: item.term,
          def: item.def
        }))
      ]
    }));
    addToast('Added imported rows');
  };

  return (
    <div className="app-shell">
      <Header
        onToggleTheme={toggleTheme}
        onNewSet={handleNewSet}
        onOpenLibrary={() => setLibraryOpen(true)}
        onOpenQuickAdd={() => setQuickAddOpen(true)}
      />
      <div className="workspace">
        <div className="tabbar" role="tablist" aria-label="Modes">
          {availableTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              className={activeTab === tab.id ? 'active' : ''}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <section className="workspace-panels">
          <EditTab
            draft={draft}
            onChangeTitle={handleChangeTitle}
            onChangeType={handleChangeType}
            onChangeItem={handleChangeItem}
            onChangePracticePrompt={handleChangePracticePrompt}
            onChangePracticeKind={handleChangePracticeKind}
            onChangePracticeCorrectAnswer={handleChangePracticeCorrectAnswer}
            onChangePracticeDistractor={handleChangePracticeDistractor}
            onAddPracticeDistractor={handleAddPracticeDistractor}
            onRemovePracticeDistractor={handleRemovePracticeDistractor}
            onAddRow={handleAddRow}
            onRemoveRow={handleRemoveRow}
            onShuffleRows={handleShuffleRows}
            onClearRows={handleClearRows}
            onSave={handleSave}
            onExport={handleExport}
            onImportSet={handleImportSet}
            isActive={activeTab === 'edit'}
          />
          {draft.type === SET_TYPES.PRACTICE ? (
            <>
              <PracticeTestTab items={preparedItems} isActive={activeTab === 'practice-test'} />
              <PracticeQuickQuizTab items={preparedItems} isActive={activeTab === 'practice-quick'} />
            </>
          ) : (
            <>
              <MatchTab items={preparedItems} isActive={activeTab === 'match'} />
              <MultipleChoiceTab items={preparedItems} isActive={activeTab === 'mc'} />
              <FlashcardsTab items={preparedItems} isActive={activeTab === 'flash'} />
            </>
          )}
        </section>
      </div>
      <Sheet
        open={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        title="Set Library"
        description="Open, rename, or remove saved collections."
      >
        <SetList
          sets={savedSets}
          currentId={currentId}
          onLoad={(id) => {
            handleLoadSet(id);
            setLibraryOpen(false);
          }}
          onRename={handleRenameSet}
          onDelete={handleDeleteSet}
        />
      </Sheet>
      <Sheet
        open={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        title="Quick Add"
        description="Paste terms to append them to the current set."
      >
        <QuickImport
          setType={draft.type}
          onImport={handleQuickImport}
          onAfterImport={() => setQuickAddOpen(false)}
        />
      </Sheet>
    </div>
  );
}
