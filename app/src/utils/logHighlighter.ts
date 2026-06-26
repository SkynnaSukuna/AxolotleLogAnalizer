/**
 * Block-level highlighting colours and helpers.
 *
 * Every line belonging to an error block gets a dark-red background,
 * red left-border, and red text.  Warning blocks get a dark-amber
 * background, amber border, and amber text.  Info-blocks stay neutral.
 */

import type { BlockType } from '../types/logTypes';

export interface BlockStyle {
  /** Background colour */
  bg: string;
  /** Text colour (CSS variable) */
  color: string;
  /** Left border shorthand */
  borderLeft: string;
  /** Top border for the first line of the block */
  borderTop: string;
}

export const BLOCK_STYLES: Record<BlockType, BlockStyle> = {
  error: {
    bg: 'rgba(239, 68, 68, 0.13)',
    color: 'var(--danger)',
    borderLeft: '3px solid var(--danger)',
    borderTop: '1px solid rgba(239, 68, 68, 0.3)',
  },
  warn: {
    bg: 'rgba(255, 200, 0, 0.10)',
    color: 'var(--warning)',
    borderLeft: '3px solid var(--warning)',
    borderTop: '1px solid rgba(255, 200, 0, 0.2)',
  },
  info: {
    bg: 'transparent',
    color: 'var(--text-primary)',
    borderLeft: '3px solid transparent',
    borderTop: '1px solid var(--border-color)',
  },
};

/** Background for the collapsed error-block summary bar */
export const COLLAPSED_ERROR_BG = 'rgba(239, 68, 68, 0.15)';
export const COLLAPSED_ERROR_BORDER = 'var(--danger)';

/** Search-match highlight colour */
export const SEARCH_HIGHLIGHT_BG = 'rgba(255, 220, 0, 0.18)';

/**
 * Check whether a string contains a case-insensitive search query.
 */
export function matchesSearch(text: string, query: string): boolean {
  if (!query) return false;
  return text.toLowerCase().includes(query.toLowerCase());
}
