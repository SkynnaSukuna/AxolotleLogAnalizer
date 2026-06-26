export function normalizeStackTrace(text: string): string {
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .map((l) =>
      l
        .replace(/at\s+/, '')
        .replace(/\(.*?\)/g, '')
        .replace(/\d+/g, 'N')
        .replace(/0x[0-9a-fA-F]+/g, 'ADDR')
        .replace(/~[\w-]+/g, '')
        .replace(/\s+/g, ' ')
        .trim(),
    )
    .filter((l) => l.length > 3)
    .join('\n');
}

export function hashCode(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const chr = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

export function computeStackTraceHash(errorBlockText: string): { exact: string; fuzzy: string } {
  const normalized = normalizeStackTrace(errorBlockText);
  return {
    exact: hashCode(normalized),
    fuzzy: computeFuzzyHash(normalized),
  };
}

export function computeFuzzyHash(normalized: string): string {
  const frames = normalized.split('\n').filter((l) => l.length > 0);
  const parts = frames.map((f) => {
    const tokens = f.split(/[.\s/#:]+/).filter(Boolean);
    const sig = tokens
      .filter((t) => /^[A-Z][A-Za-z]*$/.test(t) || /Exception|Error|Fail|Throw/.test(t))
      .slice(0, 3)
      .map((t) => t.substring(0, 4))
      .join('.');
    return sig || tokens.slice(0, 2).map((t) => t.substring(0, 3)).join('.');
  });
  return parts.filter(Boolean).slice(0, 5).join('::');
}

export function fuzzyHashFromText(rawBlock: string): string {
  return computeFuzzyHash(normalizeStackTrace(rawBlock));
}
