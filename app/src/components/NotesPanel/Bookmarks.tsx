import { useState } from 'react';
import { useBookmarks } from '../../hooks/useNotes';
import type { Bookmark } from '../../types';

interface BookmarksProps {
  logId?: string;
  onNavigate?: (lineNumber: number) => void;
}

export function Bookmarks({ logId, onNavigate }: BookmarksProps) {
  const { bookmarks, removeBookmark } = useBookmarks(logId);
  const [search, setSearch] = useState('');

  const filtered = bookmarks
    ? bookmarks.filter(
        (b) =>
          !search ||
          b.label.toLowerCase().includes(search.toLowerCase()) ||
          b.context.toLowerCase().includes(search.toLowerCase()),
      )
    : [];

  if (!logId) {
    return <div className="notes-empty">Выберите лог для просмотра закладок</div>;
  }

  return (
    <div className="bookmarks">
      <input
        className="input"
        placeholder="Поиск по закладкам..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: 8 }}
      />
      {filtered.length === 0 && (
        <div className="notes-empty">
          {search ? 'Нет совпадений' : 'Нет закладок. Выделите строку и создайте закладку.'}
        </div>
      )}
      <div className="notes-list">
        {filtered.map((bm: Bookmark) => (
          <div key={bm.id} className="bookmark-item">
            <div className="bookmark-header">
              <span className="bookmark-icon">🔖</span>
              <span className="bookmark-label">{bm.label}</span>
              <span className="bookmark-line">стр. {bm.lineNumber}</span>
              <button
                className="btn btn-sm btn-icon btn-danger"
                onClick={() => removeBookmark(bm.id)}
              >
                ×
              </button>
            </div>
            {bm.context && <div className="bookmark-context">{bm.context}</div>}
            <button className="btn btn-sm" onClick={() => onNavigate?.(bm.lineNumber)}>
              Перейти
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
