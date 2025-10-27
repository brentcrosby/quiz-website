export function Header({ onToggleTheme, onNewSet, onOpenLibrary, onOpenQuickAdd }) {
  return (
    <header className="app-header">
      <div className="header-copy">
        <h1 className="title">Study Sets • Quiz Builder</h1>
        <p className="subtitle">
          Create, practice, and export flashcards. Build match activities, multiple choice quizzes,
          and rapid-fire study cards from the same set of terms.
        </p>
      </div>
      <div className="header-actions">
        <button type="button" className="button ghost" onClick={onToggleTheme}>
          Theme
        </button>
        <button type="button" className="button secondary" onClick={onOpenLibrary}>
          Set Library
        </button>
        <button type="button" className="button secondary" onClick={onOpenQuickAdd}>
          Quick Add
        </button>
        <button type="button" className="button" onClick={onNewSet}>
          New Set
        </button>
      </div>
    </header>
  );
}
