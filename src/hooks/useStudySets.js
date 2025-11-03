import { useCallback, useEffect, useMemo, useState } from 'react';
import { createId } from '../utils/id.js';

const STORAGE_KEY = 'quiz-sets-v2';
const CURRENT_ID_KEY = 'quiz-sets-current-id';

const DEFAULT_TYPE = 'flashcard';

const DEFAULT_SET_MODULES = import.meta.glob('../../default sets/*.json', {
  eager: true,
  import: 'default'
});

const DEFAULT_SET_ENTRIES = Object.entries(DEFAULT_SET_MODULES)
  .map(([path, data]) => {
    const segments = path.split('/');
    const fileName = segments[segments.length - 1]?.replace(/\.json$/i, '') ?? 'default-set';
    const id = fileName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const type = data.type === 'practice' ? 'practice' : DEFAULT_TYPE;
    return [
      id,
      {
        id,
        title: data.title?.trim() ?? fileName,
        type,
        items: sanitizeItems(data.items ?? [], type)
      }
    ];
  })
  .filter(([, set]) => set.title && set.items.length);

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

function buildDefaultSets() {
  return Object.fromEntries(DEFAULT_SET_ENTRIES);
}

function loadInitialSets() {
  if (typeof window === 'undefined') {
    return buildDefaultSets();
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const defaults = buildDefaultSets();
    if (!raw) {
      return defaults;
    }
    const parsed = JSON.parse(raw);
    const stored = Object.fromEntries(
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
    return {
      ...defaults,
      ...stored
    };
  } catch (error) {
    console.warn('Failed to parse stored sets:', error);
    return buildDefaultSets();
  }
}

function readStoredCurrentId() {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    return window.localStorage.getItem(CURRENT_ID_KEY);
  } catch (error) {
    console.warn('Failed to read stored current set id:', error);
    return null;
  }
}

export function useStudySets() {
  const [sets, setSets] = useState(loadInitialSets);
  const [currentId, setCurrentId] = useState(readStoredCurrentId);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sets));
  }, [sets]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      if (currentId && sets[currentId]) {
        window.localStorage.setItem(CURRENT_ID_KEY, currentId);
      } else {
        window.localStorage.removeItem(CURRENT_ID_KEY);
      }
    } catch (error) {
      console.warn('Failed to persist current set id:', error);
    }
  }, [currentId, sets]);

  useEffect(() => {
    if (currentId && !sets[currentId]) {
      setCurrentId(null);
    }
  }, [sets, currentId]);

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
