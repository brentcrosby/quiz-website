import { shuffle } from './shuffle.js';

function normalizeOption(value) {
  return (value ?? '').toString().trim();
}

function dedupeOptions(options) {
  const seen = new Set();
  const unique = [];
  for (const option of options) {
    const normalized = normalizeOption(option);
    if (!normalized) {
      continue;
    }
    const key = normalized.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    unique.push(normalized);
  }
  return unique;
}

function normalizeBooleanAnswer(value) {
  return String(value).toLowerCase() === 'false' ? 'False' : 'True';
}

export function buildPracticeQuestion(item) {
  if (!item) {
    return null;
  }
  const kind = item.kind === 'trueFalse' ? 'trueFalse' : 'multipleChoice';
  const correctAnswer =
    kind === 'trueFalse'
      ? normalizeBooleanAnswer(item.correctAnswer)
      : normalizeOption(item.correctAnswer);
  const baseOptions =
    kind === 'trueFalse'
      ? ['True', 'False']
      : [correctAnswer, ...(item.distractors ?? [])];
  const uniqueOptions = dedupeOptions(baseOptions);
  const shuffled = shuffle(uniqueOptions);
  return {
    id: item.id,
    prompt: item.prompt,
    kind,
    correctAnswer,
    options: shuffled.map((option, index) => ({
      id: `${item.id}-${index}`,
      label: option,
      value: option,
      isCorrect: normalizeOption(option) === correctAnswer
    })),
    source: {
      ...item,
      kind,
      correctAnswer,
      distractors:
        kind === 'multipleChoice'
          ? (item.distractors ?? []).map((value) => normalizeOption(value))
          : []
    }
  };
}

export function buildPracticeQuestions(items) {
  return items
    .map((item) => buildPracticeQuestion(item))
    .filter(Boolean);
}

export function reshuffleQuestion(question) {
  if (!question?.source) {
    return question;
  }
  return buildPracticeQuestion(question.source);
}
