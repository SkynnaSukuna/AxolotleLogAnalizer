import type { CSSProperties, MouseEvent } from 'react';
import type { BlockType } from '../../types/logTypes';
import { BLOCK_STYLES, SEARCH_HIGHLIGHT_BG, matchesSearch } from '../../utils/logHighlighter';

interface BlockLineProps {
  text: string;
  blockType: BlockType;
  isBlockStart: boolean;
  searchQuery: string;
  isHighlighted?: boolean;
  style?: CSSProperties;
  onClick?: () => void;
  onContextMenu?: (e: MouseEvent) => void;
  hasNote?: boolean;
  noteCount?: number;
}

export function BlockLine({
  text,
  blockType,
  isBlockStart,
  searchQuery,
  isHighlighted = false,
  style,
  onClick,
  onContextMenu,
  hasNote,
  noteCount,
}: BlockLineProps) {
  const s = BLOCK_STYLES[blockType];
  const hasMatch = matchesSearch(text, searchQuery);

  let bg = s.bg;
  if (hasMatch) bg = SEARCH_HIGHLIGHT_BG;

  return (
    <div
      className={isHighlighted ? 'log-line-highlighted' : undefined}
      style={{
        ...style,
        display: 'flex',
        alignItems: 'center',
        padding: '0 12px',
        paddingLeft: blockType !== 'info' ? 9 : 12,
        fontSize: '0.8125rem',
        fontFamily: 'var(--font-mono)',
        lineHeight: 1,
        whiteSpace: 'nowrap',
        background: bg,
        color: s.color,
        borderLeft: blockType !== 'info' ? s.borderLeft : '3px solid transparent',
        borderTop: isBlockStart ? s.borderTop : 'none',
        cursor: onClick ? 'pointer' : onContextMenu ? 'context-menu' : undefined,
        transition: 'background 120ms ease',
      }}
      onClick={onClick}
      onContextMenu={onContextMenu}
      title={text}
    >
      {hasNote && (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 14,
            height: 14,
            borderRadius: '50%',
            background: 'var(--accent)',
            color: '#fff',
            fontSize: '0.6rem',
            fontWeight: 700,
            marginRight: 4,
            flexShrink: 0,
          }}
          title={`${noteCount ?? 1} заметка(и) в базе знаний`}
        >
          {noteCount ?? 1}
        </span>
      )}
      {text || '\u00A0'}
    </div>
  );
}
