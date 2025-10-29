export function parseQuickImport(text) {
  return text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      if (!line) {
        return null;
      }
      let term = '';
      let def = '';
      const csvParts = line.split(',');
      if (csvParts.length >= 2 && !line.includes(':') && !line.includes('-')) {
        term = csvParts.shift().trim();
        def = csvParts.join(',').trim();
      } else {
        const pieces = line.split(/\s*[:\-]\s*/);
        if (pieces.length >= 2) {
          term = pieces.shift().trim();
          def = pieces.join(' - ').trim();
        }
      }
      if (!term || !def) {
        return null;
      }
      return { term, def };
    })
    .filter(Boolean);
}

export function parsePracticeImport(text) {
  return text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split('::');
      if (parts.length < 2) {
        return null;
      }
      const prompt = parts.shift().trim();
      const answerSegment = parts.join('::').trim();
      if (!prompt || !answerSegment) {
        return null;
      }
      if (answerSegment.includes(';;')) {
        const answers = answerSegment
          .split(';;')
          .map((entry) => entry.trim())
          .filter(Boolean);
        if (answers.length < 2) {
          return null;
        }
        const [correctAnswer, ...distractors] = answers;
        return {
          prompt,
          kind: 'multipleChoice',
          correctAnswer,
          distractors
        };
      }
      const normalized = answerSegment.toLowerCase();
      if (normalized !== 'true' && normalized !== 'false') {
        return null;
      }
      return {
        prompt,
        kind: 'trueFalse',
        correctAnswer: normalized === 'false' ? 'False' : 'True',
        distractors: []
      };
    })
    .filter(Boolean);
}
