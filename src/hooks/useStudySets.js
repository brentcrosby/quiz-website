import { useCallback, useEffect, useMemo, useState } from 'react';
import { createId } from '../utils/id.js';

const STORAGE_KEY = 'quiz-sets-v2';

function sanitizeItems(items) {
  return items
    .map((item) => ({
      id: item.id ?? createId('item'),
      term: item.term?.trim() ?? '',
      def: item.def?.trim() ?? ''
    }))
    .filter((item) => item.term && item.def);
}

function loadInitialSets() {
  if (typeof window === 'undefined') {
    return {};
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw);
    return Object.fromEntries(
      Object.entries(parsed).map(([id, set]) => [
        id,
        {
          id,
          title: set.title ?? '',
          items: sanitizeItems(set.items ?? [])
        }
      ])
    );
  } catch (error) {
    console.warn('Failed to parse stored sets:', error);
    return {};
  }
}

export function useStudySets() {
  const [sets, setSets] = useState(loadInitialSets);
  const [currentId, setCurrentId] = useState(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sets));
  }, [sets]);

  const saveSet = useCallback(
    ({ id, title, items }) => {
      const trimmedTitle = title.trim();
      if (!trimmedTitle) {
        throw new Error('Please enter a set title');
      }
      const entries = sanitizeItems(items);
      if (!entries.length) {
        throw new Error('Add at least one term with a definition');
      }
      const setId = id ?? currentId ?? createId('set');
      setSets((prev) => ({
        ...prev,
        [setId]: {
          id: setId,
          title: trimmedTitle,
          items: entries
        }
      }));
      setCurrentId(setId);
      return setId;
    },
    [currentId]
  );

  const deleteSet = useCallback((id) => {
    setSets((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setCurrentId((prev) => (prev === id ? null : prev));
  }, []);

  const renameSet = useCallback((id, title) => {
    const trimmed = title.trim();
    if (!trimmed) {
      return;
    }
    setSets((prev) => {
      const target = prev[id];
      if (!target) {
        return prev;
      }
      return {
        ...prev,
        [id]: {
          ...target,
          title: trimmed
        }
      };
    });
  }, []);

  const value = useMemo(
    () => ({
      sets,
      setSets,
      currentId,
      setCurrentId,
      saveSet,
      deleteSet,
      renameSet
    }),
    [sets, currentId, saveSet, deleteSet, renameSet]
  );

  return value;
}
