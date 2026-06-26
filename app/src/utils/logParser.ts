/**
 * Minecraft log parser — block-based.
 *
 * Splits the raw log into contiguous *blocks*, where every block starts
 * at a line that matches the pattern  [HH:MM:SS] [Module/LEVEL]:
 * and extends until the next such line (or EOF).
 *
 * Blocks are classified into three visual categories:
 *  - error   (ERROR / FATAL / EXCEPTION)
 *  - warn    (WARN)
 *  - info    (INFO / DEBUG / everything else)
 */

import type { LogBlock, BlockType } from '../types/logTypes';

/** Regex for a standard Minecraft log line containing a severity level */
const LEVEL_RE = /^\[\d{2}:\d{2}:\d{2}(?:\.\d+)?\]\s+\[.+?\/(\w+)\]/;

/** Level keywords that map to error blocks */
const ERROR_LEVELS = new Set(['ERROR', 'FATAL', 'EXCEPTION', 'SEVERE']);

/** Level keywords that map to warn blocks */
const WARN_LEVELS = new Set(['WARN', 'WARNING']);

/**
 * Map a raw level string to a BlockType.
 */
function classifyLevel(raw: string): BlockType {
  const upper = raw.toUpperCase();
  if (ERROR_LEVELS.has(upper)) return 'error';
  if (WARN_LEVELS.has(upper)) return 'warn';
  return 'info';
}

/**
 * Parse a raw Minecraft log into an array of visual blocks.
 *
 * @param logContent  The full log text.
 * @returns           An ordered array of LogBlock objects.
 */
export function parseLogIntoBlocks(logContent: string): LogBlock[] {
  if (!logContent) return [];

  const rawLines = logContent.split('\n');
  const blocks: LogBlock[] = [];

  let current: { type: BlockType; lines: string[]; startIndex: number } | null = null;

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    const match = line.match(LEVEL_RE);

    if (match) {
      // Close previous block
      if (current) {
        blocks.push({
          id: blocks.length,
          type: current.type,
          lines: current.lines,
          startIndex: current.startIndex,
          endIndex: i - 1,
        });
      }

      // Start a new block
      current = {
        type: classifyLevel(match[1]),
        lines: [line],
        startIndex: i,
      };
    } else if (current) {
      // Continuation of the current block
      current.lines.push(line);
    } else {
      // Lines before the first [LEVEL] marker — treat as info
      current = { type: 'info', lines: [line], startIndex: i };
    }
  }

  // Flush the last block
  if (current) {
    blocks.push({
      id: blocks.length,
      type: current.type,
      lines: current.lines,
      startIndex: current.startIndex,
      endIndex: rawLines.length - 1,
    });
  }

  return blocks;
}
