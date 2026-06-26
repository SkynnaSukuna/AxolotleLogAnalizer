import { useCallback, useRef, useEffect, useState } from 'react';
import type { LogEntry, LogStatus } from '../../types';
import { Badge } from '../ui/Badge';
import { StatusDropdown } from '../ui/StatusDropdown';

interface LogItemProps {
  log: LogEntry;
  isSelected: boolean;
  onSelect: (log: LogEntry) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onContextMenu?: (e: React.MouseEvent, log: LogEntry) => void;
  onStatusChange?: (logId: string, status: LogStatus) => void;
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
  onStatusChange,
}: LogItemProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [statusPickerOpen, setStatusPickerOpen] = useState(false);
  const badgeRef = useRef<HTMLSpanElement>(null);

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
        <span ref={badgeRef} style={{ position: 'relative', display: 'inline-block' }}>
          <Badge
            status={log.status}
            onClick={() => setStatusPickerOpen((p) => !p)}
          />
          {statusPickerOpen && badgeRef.current && (
            <StatusDropdown
              current={log.status}
              onChange={(s) => {
                onStatusChange?.(log.id, s);
                setStatusPickerOpen(false);
              }}
              onClose={() => setStatusPickerOpen(false)}
              style={{
                top: (badgeRef.current.getBoundingClientRect().bottom + 4),
                left: badgeRef.current.getBoundingClientRect().left,
              }}
            />
          )}
        </span>
      </div>
      <p className="log-preview">{getPreview(log.content)}</p>
      <span className="log-date">
        {log.createdAt.toLocaleDateString()} {log.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </span>
    </div>
  );
}
