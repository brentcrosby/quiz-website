import { useCallback, useEffect, useMemo, useState } from 'react';
import { createId } from '../utils/id.js';

const STORAGE_KEY = 'quiz-sets-v2';

const DEFAULT_TYPE = 'flashcard';

function sanitizeItems(items, type = DEFAULT_TYPE) {
  if (type === 'practice') {
    return items
      .map((item) => {
        const prompt = item.prompt?.trim() ?? '';
        const kind = item.kind === 'trueFalse' ? 'trueFalse' : 'multipleChoice';
        const correctAnswer = item.correctAnswer?.trim() ?? '';
        const distractors = Array.isArray(item.distractors)
          ? item.distractors.map((value) => value?.trim()).filter(Boolean)
          : [];
        if (kind === 'multipleChoice') {
          return {
            id: item.id ?? createId('item'),
            prompt,
            kind,
            correctAnswer,
            distractors
          };
        }
        return {
          id: item.id ?? createId('item'),
          prompt,
          kind,
          correctAnswer,
          distractors: []
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
      Object.entries(parsed).map(([id, set]) => {
        const type = set.type === 'practice' ? 'practice' : DEFAULT_TYPE;
        return [
          id,
          {
            id,
            title: set.title ?? '',
            type,
            items: sanitizeItems(set.items ?? [], type)
          }
        ];
      })
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
    ({ id, title, type = DEFAULT_TYPE, items }) => {
      const trimmedTitle = title.trim();
      if (!trimmedTitle) {
        throw new Error('Please enter a set title');
      }
      const setType = type === 'practice' ? 'practice' : DEFAULT_TYPE;
      const entries = sanitizeItems(items, setType);
      if (!entries.length) {
        throw new Error(
          setType === 'practice'
            ? 'Add at least one complete practice question'
            : 'Add at least one term with a definition'
        );
      }
      const setId = id ?? currentId ?? createId('set');
      setSets((prev) => ({
        ...prev,
        [setId]: {
          id: setId,
          title: trimmedTitle,
          type: setType,
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
