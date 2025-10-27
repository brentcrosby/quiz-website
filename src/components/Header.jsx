export function Header({ onToggleTheme, onNewSet }) {
  return (
    <header>
      <div>
        <h1 className="title">Study Sets • Quiz Builder</h1>
        <p className="subtitle">
          Create, practice, and export flashcards. Build match activities, multiple choice quizzes,
          and rapid-fire study cards from the same set of terms.
        </p>
      </div>
      <div className="toolbar">
        <button type="button" className="button secondary" onClick={onToggleTheme}>
          Theme
        </button>
        <button type="button" className="button" onClick={onNewSet}>
          New Set
        </button>
      </div>
    </header>
  );
}

