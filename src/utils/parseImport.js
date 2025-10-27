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

