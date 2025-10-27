import { useEffect, useMemo, useState } from 'react';
import { Header } from './components/Header.jsx';
import { SetList } from './components/SetList.jsx';
import { QuickImport } from './components/QuickImport.jsx';
import { EditTab } from './components/EditTab.jsx';
import { MatchTab } from './components/MatchTab.jsx';
import { MultipleChoiceTab } from './components/MultipleChoiceTab.jsx';
import { FlashcardsTab } from './components/FlashcardsTab.jsx';
import { useTheme } from './context/ThemeContext.jsx';
import { useToast } from './context/ToastContext.jsx';
import { useStudySets } from './hooks/useStudySets.js';
import { createId } from './utils/id.js';
import { shuffle } from './utils/shuffle.js';

const tabs = [
  { id: 'edit', label: 'Edit' },
  { id: 'match', label: 'Match' },
  { id: 'mc', label: 'Multiple Choice' },
  { id: 'flash', label: 'Flashcards' }
];

const createEmptyItem = () => ({
  id: createId('row'),
  term: '',
  def: ''
});

const createEmptyDraft = () => ({
  id: null,
  title: '',
  items: [createEmptyItem(), createEmptyItem()]
});

const cleanItems = (items) =>
  items
    .map((item) => ({
      id: item.id ?? createId('row'),
      term: item.term?.trim() ?? '',
      def: item.def?.trim() ?? ''
    }))
    .filter((item) => item.term && item.def);

function draftFromSet(set) {
  if (!set) {
    return createEmptyDraft();
  }
  const items = set.items.length ? set.items : [createEmptyItem()];
  return {
    id: set.id ?? null,
    title: set.title ?? '',
    items: items.map((item) => ({
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

  const practiceItems = useMemo(() => cleanItems(draft.items), [draft.items]);

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

  const handleAddRow = () => {
    setDraft((prev) => ({
      ...prev,
      items: [...prev.items, createEmptyItem()]
    }));
  };

  const handleRemoveRow = (index) => {
    setDraft((prev) => {
      const items = prev.items.slice();
      items.splice(index, 1);
      if (!items.length) {
        items.push(createEmptyItem());
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
      items: [createEmptyItem()]
    }));
  };

  const handleSave = () => {
    try {
      const id = saveSet({
        id: draft.id,
        title: draft.title,
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
      items: cleanItems(draft.items)
    };
    downloadSetAsJson(set);
  };

  const handleImportSet = (data) => {
    if (!data || typeof data !== 'object') {
      return;
    }
    const items = cleanItems(data.items ?? []);
    setCurrentId(null);
    setDraft({
      id: null,
      title: data.title ?? '',
      items: items.length ? items : [createEmptyItem()]
    });
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
    setDraft((prev) => ({
      ...prev,
      items: [
        ...prev.items,
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
          {tabs.map((tab) => (
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
            onChangeItem={handleChangeItem}
            onAddRow={handleAddRow}
            onRemoveRow={handleRemoveRow}
            onShuffleRows={handleShuffleRows}
            onClearRows={handleClearRows}
            onSave={handleSave}
            onExport={handleExport}
            onImportSet={handleImportSet}
            isActive={activeTab === 'edit'}
          />
          <MatchTab items={practiceItems} isActive={activeTab === 'match'} />
          <MultipleChoiceTab items={practiceItems} isActive={activeTab === 'mc'} />
          <FlashcardsTab items={practiceItems} isActive={activeTab === 'flash'} />
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
          onImport={handleQuickImport}
          onAfterImport={() => setQuickAddOpen(false)}
        />
      </Sheet>
    </div>
  );
}
