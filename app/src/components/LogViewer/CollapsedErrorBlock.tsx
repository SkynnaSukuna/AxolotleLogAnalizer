import type { CSSProperties, MouseEvent } from 'react';
import type { LogBlock } from '../../types/logTypes';
import type { Note } from '../../types';
import { COLLAPSED_ERROR_BG, COLLAPSED_ERROR_BORDER } from '../../utils/logHighlighter';

interface CollapsedErrorBlockProps {
  block: LogBlock;
  summaryText: string;
  lineCount: number;
  onToggle: () => void;
  style?: CSSProperties;
  matchedNotes?: Note[];
  onContextMenu?: (e: MouseEvent) => void;
}

export function CollapsedErrorBlock({
  block,
  summaryText,
  lineCount,
  onToggle,
  style,
  matchedNotes,
  onContextMenu,
}: CollapsedErrorBlockProps) {
  return (
    <div
      style={{
        ...style,
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '0 12px 0 9px',
        fontSize: '0.8125rem',
        fontFamily: 'var(--font-mono)',
        lineHeight: 1,
        cursor: 'pointer',
        background: COLLAPSED_ERROR_BG,
        borderLeft: `3px solid ${COLLAPSED_ERROR_BORDER}`,
        borderTop: '1px solid rgba(239, 68, 68, 0.3)',
        borderBottom: '1px solid rgba(239, 68, 68, 0.3)',
        userSelect: 'none',
      }}
      onClick={onToggle}
      onContextMenu={onContextMenu}
      title={summaryText}
    >
      <span
        style={{
          color: 'var(--text-muted)',
          fontSize: '0.65rem',
          flexShrink: 0,
          width: 12,
        }}
      >
        ▶
      </span>

      {matchedNotes && matchedNotes.length > 0 && (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 2,
            padding: '1px 5px',
            borderRadius: 8,
            background: 'var(--accent)',
            color: '#fff',
            fontSize: '0.6rem',
            fontWeight: 600,
            flexShrink: 0,
          }}
          title={matchedNotes.map((n) => n.cause || n.solution).filter(Boolean).join('; ')}
        >
          💡 {matchedNotes.length}
        </span>
      )}

      <span
        style={{
          color: 'var(--danger)',
          fontWeight: 700,
          flexShrink: 0,
          width: 50,
          textTransform: 'uppercase',
          fontSize: '0.68rem',
          letterSpacing: '0.02em',
        }}
      >
        ERROR
      </span>

      <span
        style={{
          color: 'var(--danger)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          flex: 1,
          fontSize: '0.8125rem',
        }}
      >
        {summaryText}
      </span>

      <span
        style={{
          color: 'var(--text-muted)',
          fontSize: '0.68rem',
          fontWeight: 500,
          flexShrink: 0,
          padding: '1px 7px',
          background: 'rgba(239, 68, 68, 0.15)',
          borderRadius: '3px',
          lineHeight: '18px',
        }}
      >
        +{lineCount}
      </span>
    </div>
  );
}
