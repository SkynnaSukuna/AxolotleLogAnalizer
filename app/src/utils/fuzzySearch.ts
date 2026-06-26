export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = [];
  for (let i = 0; i <= m; i++) {
    dp[i] = [i];
  }
  for (let j = 0; j <= n; j++) {
    dp[0][j] = j;
  }
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : Math.min(dp[i - 1][j - 1] + 1, dp[i - 1][j] + 1, dp[i][j - 1] + 1);
    }
  }
  return dp[m][n];
}

export function similarity(a: string, b: string): number {
  if (!a || !b) return 0;
  const dist = levenshtein(a.toLowerCase(), b.toLowerCase());
  const maxLen = Math.max(a.length, b.length);
  return maxLen === 0 ? 1 : 1 - dist / maxLen;
}

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-zA-Zа-яА-Я0-9_$]+/)
    .filter((t) => t.length > 1);
}

export function tokenSetSimilarity(a: string, b: string): number {
  const ta = new Set(tokenize(a));
  const tb = new Set(tokenize(b));
  if (ta.size === 0 && tb.size === 0) return 1;
  let intersection = 0;
  for (const t of ta) {
    if (tb.has(t)) intersection++;
  }
  const union = ta.size + tb.size - intersection;
  return union === 0 ? 1 : intersection / union;
}

export function fuzzyMatch(query: string, target: string): number {
  const sim = similarity(query, target);
  const tokenSim = tokenSetSimilarity(query, target);
  return Math.max(sim, tokenSim);
}

export interface FuzzyMatchResult<T> {
  item: T;
  score: number;
  matchField: string;
}

export function searchByFields<T>(
  items: T[],
  query: string,
  fields: (keyof T)[],
  threshold = 0.3,
): FuzzyMatchResult<T>[] {
  const q = query.trim();
  if (!q) return [];
  const results: FuzzyMatchResult<T>[] = [];
  const queryTokens = tokenize(q);

  for (const item of items) {
    let bestScore = 0;
    let bestField = fields[0];

    for (const field of fields) {
      const value = String(item[field] ?? '');
      const score = fuzzyMatch(q, value);
      if (score > bestScore) {
        bestScore = score;
        bestField = field;
      }
      if (queryTokens.length > 1) {
        const tokenScore = tokenSetSimilarity(q, value);
        if (tokenScore > bestScore) {
          bestScore = tokenScore;
          bestField = field;
        }
      }
    }

    if (bestScore >= threshold) {
      results.push({ item, score: bestScore, matchField: String(bestField) });
    }
  }

  return results.sort((a, b) => b.score - a.score);
}
