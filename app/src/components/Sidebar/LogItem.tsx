import { useCallback, useRef, useEffect } from 'react';
import type { LogEntry } from '../../types';
import { Badge } from '../ui/Badge';

interface LogItemProps {
  log: LogEntry;
  isSelected: boolean;
  onSelect: (log: LogEntry) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onContextMenu?: (e: React.MouseEvent, log: LogEntry) => void;
  isEditing?: boolean;
  editName?: string;
  onEditNameChange?: (name: string) => void;
  onCommitRename?: () => void;
  onCancelRename?: () => void;
}

export function LogItem({
  log,
  isSelected,
  onSelect,
  onDragOver,
  onDragLeave,
  onDrop,
  onContextMenu,
  isEditing = false,
  editName = '',
  onEditNameChange,
  onCommitRename,
  onCancelRename,
}: LogItemProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const getPreview = useCallback((content: string): string => {
    const cleaned = content.replace(/\s+/g, ' ').trim();
    return cleaned.length > 60 ? cleaned.slice(0, 60) + '...' : cleaned;
  }, []);

  return (
    <div
      className={`log-item${isSelected ? ' selected' : ''}`}
      onClick={() => onSelect(log)}
      onContextMenu={(e) => onContextMenu?.(e, log)}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') onSelect(log); }}
    >
      <div className="log-item-header">
        <span className="log-item-icon">📄</span>
        {isEditing ? (
          <input
            ref={inputRef}
            className="log-rename-input"
            value={editName}
            onChange={(e) => onEditNameChange?.(e.target.value)}
            onBlur={onCommitRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onCommitRename?.();
              if (e.key === 'Escape') onCancelRename?.();
            }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="log-file-name">{log.fileName}</span>
        )}
        <Badge status={log.status} />
      </div>
      <p className="log-preview">{getPreview(log.content)}</p>
      <span className="log-date">
        {log.createdAt.toLocaleDateString()} {log.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </span>
    </div>
  );
}
