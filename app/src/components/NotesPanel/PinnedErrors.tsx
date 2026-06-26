import { usePinnedErrors } from '../../hooks/useNotes';
import type { PinnedError } from '../../types';

interface PinnedErrorsProps {
  logId?: string;
  onNavigate?: (blockId: number) => void;
  onUnpin?: (id: string) => void;
}

export function PinnedErrors({ logId, onNavigate, onUnpin }: PinnedErrorsProps) {
  const { pinned, unpinError } = usePinnedErrors(logId);

  if (!pinned || pinned.length === 0) {
    return <div className="notes-empty">Нет закреплённых ошибок</div>;
  }

  return (
    <div className="notes-list">
      {pinned.map((p: PinnedError) => (
        <div key={p.id} className="pinned-error-item">
          <div className="pinned-error-header">
            <span className="pinned-error-icon">📌</span>
            <div className="pinned-error-text">{p.errorText}</div>
            <button
              className="btn btn-sm btn-icon btn-danger"
              title="Открепить"
              onClick={() => {
                unpinError(p.id);
                onUnpin?.(p.id);
              }}
            >
              ×
            </button>
          </div>
          {p.note && <div className="pinned-error-note">{p.note}</div>}
          <button
            className="btn btn-sm"
            onClick={() => onNavigate?.(p.blockId)}
            style={{ marginTop: 4 }}
          >
            Перейти
          </button>
        </div>
      ))}
    </div>
  );
}
