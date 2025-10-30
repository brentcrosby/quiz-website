import { useEffect, useRef, useState } from 'react';

export function Header({ onToggleTheme, onNewSet, onOpenLibrary, onOpenQuickAdd }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const createMenuHandler = (handler) => () => {
    setMenuOpen(false);
    handler();
  };

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!menuRef.current || menuRef.current.contains(event.target)) {
        return;
      }
      setMenuOpen(false);
    };
    window.addEventListener('pointerdown', handlePointerDown);
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 701px)');
    const handleChange = (event) => {
      if (event.matches) {
        setMenuOpen(false);
      }
    };
    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      mediaQuery.addListener(handleChange);
    }
    return () => {
      if (typeof mediaQuery.removeEventListener === 'function') {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  return (
    <header className="app-header">
      <h1 className="title">Study Sets • Quiz Builder</h1>
      <div className="header-actions header-actions--desktop">
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
      <div className="header-menu" ref={menuRef}>
        <button
          type="button"
          className="button secondary header-menu__trigger"
          onClick={() => setMenuOpen((previous) => !previous)}
          aria-expanded={menuOpen}
          aria-haspopup="true"
        >
          Menu
        </button>
        <div className={`header-menu__dropdown${menuOpen ? ' is-open' : ''}`}>
          <button
            type="button"
            className="button ghost compact"
            onClick={createMenuHandler(onToggleTheme)}
          >
            Theme
          </button>
          <button
            type="button"
            className="button ghost compact"
            onClick={createMenuHandler(onOpenLibrary)}
          >
            Set Library
          </button>
          <button
            type="button"
            className="button ghost compact"
            onClick={createMenuHandler(onOpenQuickAdd)}
          >
            Quick Add
          </button>
          <button type="button" className="button compact" onClick={createMenuHandler(onNewSet)}>
            New Set
          </button>
        </div>
      </div>
    </header>
  );
}
