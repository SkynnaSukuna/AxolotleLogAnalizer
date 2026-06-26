import { useState, useMemo, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import type { BlockType, TabType, VirtualItem } from '../../types/logTypes';
import type { Note } from '../../types';
import { parseLogIntoBlocks } from '../../utils/logParser';
import { computeStackTraceHash, fuzzyHashFromText } from '../../utils/stackTraceHash';
import { VirtualList } from './VirtualList';
import type { VirtualListHandle } from './VirtualList';
import { BlockLine } from './BlockLine';
import { CollapsedErrorBlock } from './CollapsedErrorBlock';
import { FilterBar } from './FilterBar';
import { TabBar } from './TabBar';
import { db } from '../../db/schema';
import { CustomContextMenu } from '../ui/CustomContextMenu';
import type { ContextMenuItem } from '../ui/CustomContextMenu';

export interface LogViewerHandle {
  scrollToLine: (lineNumber: number) => void;
  scrollToBlock: (blockId: number) => void;
}

interface ContextData {
  blockId: number;
  blockType: BlockType;
  blockLines: string[];
  lineText: string;
  originalIndex: number;
  stackTraceHash: string;
}

interface LogViewerProps {
  content: string;
  logId?: string;
  projectId?: string;
  onErrorContextMenu?: (errorSnippet: string, blockId: number) => void;
  onPinError?: (blockId: number, errorText: string, stackTraceHash: string) => void;
  onBookmarkLine?: (lineNumber: number, text: string) => void;
}

const ROW_HEIGHT = 28;

const BLOCK_TYPE_TO_CHIP: Record<BlockType, string> = {
  info: 'INFO',
  warn: 'WARN',
  error: 'ERROR',
};

export const LogViewer = forwardRef<LogViewerHandle, LogViewerProps>(function LogViewer({
  content,
  logId,
  projectId,
  onErrorContextMenu,
  onPinError,
  onBookmarkLine,
}, ref) {
  const blocks = useMemo(() => parseLogIntoBlocks(content ?? ''), [content]);

  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [levelFilter, setLevelFilter] = useState<BlockType | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setSearchQuery(value), 250);
  }, []);

  const [collapsedIds, setCollapsedIds] = useState<Set<number>>(new Set());

  const toggleBlock = useCallback((id: number) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const [pendingBlock, setPendingBlock] = useState<number | null>(null);
  const listRef = useRef<VirtualListHandle>(null);
  const allItemsRef = useRef<VirtualItem[]>([]);

  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const handleLineClick = useCallback((blockId: number) => {
    setActiveTab('all');
    setPendingBlock(blockId);
  }, []);

  useEffect(() => {
    if (pendingBlock === null) return;
    setCollapsedIds((prev) => {
      if (prev.has(pendingBlock)) {
        const next = new Set(prev);
        next.delete(pendingBlock);
        return next;
      }
      return prev;
    });
    const timer = setTimeout(() => {
      setPendingBlock(null);
    }, 50);
    return () => clearTimeout(timer);
  }, [pendingBlock]);

  /* ── compute matched notes for error blocks ── */
  const [allNotes, setAllNotes] = useState<Note[]>([]);
  useEffect(() => {
    db.notes.toArray().then(setAllNotes);
  }, [logId]);

  const matchMap = useMemo(() => {
    const map = new Map<number, Note[]>();
    if (!allNotes.length) return map;

    for (const block of blocks) {
      if (block.type !== 'error') continue;
      const blockText = block.lines.join('\n');
      const { exact, fuzzy } = computeStackTraceHash(blockText);

      const matches = allNotes.filter((n) => {
        if (n.stackTraceHash === exact) return true;
        if (n.fuzzyHash === fuzzy) return true;
        if (n.fuzzyHash && fuzzy && n.fuzzyHash.split('::')[0] === fuzzy.split('::')[0]) return true;
        return false;
      });

      if (matches.length > 0) {
        map.set(block.id, matches);
      }
    }
    return map;
  }, [blocks, allNotes]);

  /* ── context menu ── */
  const [contextMenu, setContextMenu] = useState<{
    position: { x: number; y: number };
    data: ContextData;
  } | null>(null);

  const ctxDataRef = useRef<{
    onErrorContextMenu?: (errorSnippet: string, blockId: number) => void;
    onPinError?: (blockId: number, errorText: string, stackTraceHash: string) => void;
    onBookmarkLine?: (lineNumber: number, text: string) => void;
  }>({});

  ctxDataRef.current.onErrorContextMenu = onErrorContextMenu;
  ctxDataRef.current.onPinError = onPinError;
  ctxDataRef.current.onBookmarkLine = onBookmarkLine;

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, blockId: number, lineText: string, blockLines: string[], blockType: BlockType, originalIndex: number) => {
      e.preventDefault();
      e.stopPropagation();
      const hash = fuzzyHashFromText(blockLines.join('\n'));
      setContextMenu({
        position: { x: e.clientX, y: e.clientY },
        data: {
          blockId,
          blockType,
          blockLines,
          lineText,
          originalIndex,
          stackTraceHash: hash,
        },
      });
    },
    [],
  );

  const handleContextMenuClose = useCallback(() => {
    setContextMenu(null);
  }, []);

  /* ── build menu items from context ── */
  const menuItems = useMemo<ContextMenuItem<ContextData>[]>(() => {
    if (!contextMenu) return [];
    const ctx = contextMenu.data;
    const items: ContextMenuItem<ContextData>[] = [];

    const callbacks = ctxDataRef.current;

    if (callbacks.onBookmarkLine) {
      items.push({
        type: 'action',
        id: 'bookmark-line',
        label: 'Закрепить строку',
        icon: '\uD83D\uDCCC',
        onClick: (data) => {
          callbacks.onBookmarkLine!(data.originalIndex, data.lineText);
        },
      });
    }

    if (ctx.blockType === 'error' && callbacks.onPinError) {
      items.push({
        type: 'action',
        id: 'pin-block',
        label: 'Закрепить весь блок',
        icon: '\uD83D\uDCCC',
        onClick: (data) => {
          callbacks.onPinError!(data.blockId, data.blockLines.join('\n'), data.stackTraceHash);
        },
      });
    }

    if (callbacks.onErrorContextMenu) {
      items.push({
        type: 'action',
        id: 'add-note',
        label: 'Добавить заметку к строке',
        icon: '\uD83D\uDCDD',
        onClick: (data) => {
          callbacks.onErrorContextMenu!(data.blockLines.join('\n'), data.blockId);
        },
      });
    }

    items.push(
      {
        type: 'action',
        id: 'copy-line',
        label: 'Копировать строку',
        icon: '\uD83D\uDCCB',
        onClick: async ({ lineText }) => {
          try {
            await navigator.clipboard.writeText(lineText);
          } catch { /* ignore */ }
        },
      },
      {
        type: 'action',
        id: 'copy-block',
        label: 'Копировать весь блок',
        icon: '\uD83D\uDCCB',
        onClick: async ({ blockLines }) => {
          try {
            await navigator.clipboard.writeText(blockLines.join('\n'));
          } catch { /* ignore */ }
        },
      },
    );

    items.push({ type: 'separator' });

    items.push({
      type: 'action',
      id: 'scroll-to',
      label: 'Перейти к строке',
      icon: '\uD83D\uDD0D',
      onClick: ({ originalIndex }) => {
        const all = allItemsRef.current;
        const idx = all.findIndex(
          (it) => it.kind === 'line' && it.originalIndex === originalIndex,
        );
        if (idx >= 0) {
          listRef.current?.scrollToIndex(idx, 'smooth');
        }
      },
    });

    return items;
  }, [contextMenu]);

  const allItems = useMemo<VirtualItem[]>(() => {
    const items: VirtualItem[] = [];

    for (const block of blocks) {
      if (activeTab === 'errors' && block.type !== 'error') continue;
      if (activeTab === 'warnings' && block.type !== 'warn') continue;
      if (activeTab === 'all' && levelFilter && block.type !== levelFilter) continue;

      if (searchQuery) {
        const anyMatch = block.lines.some((l) =>
          l.toLowerCase().includes(searchQuery.toLowerCase()),
        );
        if (!anyMatch) continue;
      }

      if (block.type === 'error' && collapsedIds.has(block.id)) {
        items.push({
          kind: 'collapsed',
          block,
          summaryText: block.lines[0],
          lineCount: block.lines.length - 1,
        });
        continue;
      }

      for (let i = 0; i < block.lines.length; i++) {
        items.push({
          kind: 'line',
          blockId: block.id,
          blockType: block.type,
          text: block.lines[i],
          isBlockStart: i === 0,
          originalIndex: block.startIndex + i,
        });
      }
    }

    allItemsRef.current = items;
    return items;
  }, [blocks, activeTab, levelFilter, searchQuery, collapsedIds]);

  const tabCounts = useMemo(() => {
    const errCount = blocks.filter((b) => b.type === 'error').length;
    const warnCount = blocks.filter((b) => b.type === 'warn').length;
    return { all: blocks.length, errors: errCount, warnings: warnCount };
  }, [blocks]);

  const scrollAndHighlight = useCallback((originalIndex: number) => {
    const all = allItemsRef.current;
    const idx = all.findIndex(
      (it) => it.kind === 'line' && it.originalIndex === originalIndex,
    );
    if (idx < 0) return;
    if (listRef.current) {
      listRef.current.scrollToIndex(idx, 'smooth');
    }
    setHighlightedIndex(originalIndex);
    clearTimeout(highlightTimerRef.current);
    highlightTimerRef.current = setTimeout(() => {
      setHighlightedIndex(null);
    }, 2000);
  }, []);

  useImperativeHandle(ref, () => ({
    scrollToLine: (lineNumber: number) => {
      scrollAndHighlight(lineNumber);
    },
    scrollToBlock: (blockId: number) => {
      const all = allItemsRef.current;
      const first = all.find(
        (it) => it.kind === 'line' && it.blockId === blockId,
      );
      if (first && first.kind === 'line') {
        scrollAndHighlight(first.originalIndex);
      }
    },
  }), [scrollAndHighlight]);

  useEffect(() => {
    return () => {
      clearTimeout(debounceRef.current);
      clearTimeout(highlightTimerRef.current);
    };
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
        background: 'var(--bg-primary)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius)',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} counts={tabCounts} />

      {activeTab === 'all' && (
        <FilterBar
          activeFilter={levelFilter}
          onFilterChange={setLevelFilter}
          searchValue={searchInput}
          onSearchChange={handleSearchChange}
        />
      )}

      <VirtualList
        ref={listRef}
        items={allItems}
        itemHeight={ROW_HEIGHT}
        overscan={10}
        style={{ flex: 1, minHeight: 0 }}
        renderItem={(raw, _index, style) => {
          const item = raw as VirtualItem;

          if (item.kind === 'collapsed') {
            const matches = matchMap.get(item.block.id);
            return (
              <CollapsedErrorBlock
                key={`c${item.block.id}`}
                block={item.block}
                summaryText={item.summaryText}
                lineCount={item.lineCount}
                onToggle={() => toggleBlock(item.block.id)}
                style={style}
                matchedNotes={matches}
              />
            );
          }

          return (
            <BlockLine
              key={`l${item.originalIndex}`}
              text={item.text}
              blockType={item.blockType}
              isBlockStart={item.isBlockStart}
              searchQuery={searchQuery}
              isHighlighted={highlightedIndex !== null && item.originalIndex === highlightedIndex}
              style={style}
              onClick={
                activeTab === 'errors' || activeTab === 'warnings'
                  ? () => handleLineClick(item.blockId)
                  : undefined
              }
              onContextMenu={(e: React.MouseEvent) => {
                const block = blocks.find((b) => b.id === item.blockId);
                if (block) {
                  handleContextMenu(
                    e,
                    item.blockId,
                    item.text,
                    block.lines,
                    item.blockType,
                    item.originalIndex,
                  );
                }
              }}
              hasNote={item.blockType === 'error' && matchMap.has(item.blockId)}
              noteCount={matchMap.get(item.blockId)?.length}
            />
          );
        }}
      />

      <div
        style={{
          padding: '3px 12px',
          borderTop: '1px solid var(--border-color)',
          background: 'var(--bg-secondary)',
          fontSize: '0.7rem',
          color: 'var(--text-muted)',
          display: 'flex',
          justifyContent: 'space-between',
          flexShrink: 0,
          fontFamily: 'var(--font-sans)',
        }}
      >
        <span>{blocks.length} blocks</span>
        <span>
          {allItems.length} lines visible
          {blocks.filter((b) => b.type === 'error').length > 0 &&
            ` · ${collapsedIds.size} error blocks collapsed`}
          {matchMap.size > 0 && ` · ${matchMap.size} совпадений с БЗ`}
        </span>
      </div>

      {contextMenu && (
        <CustomContextMenu
          items={menuItems}
          data={contextMenu.data}
          position={contextMenu.position}
          onClose={handleContextMenuClose}
        />
      )}
    </div>
  );
});
