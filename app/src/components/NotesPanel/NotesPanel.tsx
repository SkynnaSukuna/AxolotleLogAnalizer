import { useState, useCallback } from 'react';
import { PinnedErrors } from './PinnedErrors';
import { MyNotes } from './MyNotes';
import { Bookmarks } from './Bookmarks';
import { SimilaritySearch } from './SimilaritySearch';
import { downloadKnowledgeBase, uploadKnowledgeBase, importKnowledgeBase } from '../../utils/knowledgeBase';

type NotesTab = 'pinned' | 'notes' | 'bookmarks';

interface NotesPanelProps {
  logId?: string;
  projectId?: string;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onNavigateToLine?: (lineNumber: number) => void;
  onNavigateToBlock?: (blockId: number) => void;
  onNavigateToLog?: (logId: string, projectId: string) => void;
  selectedErrorSnippet?: string;
}

export function NotesPanel({
  logId,
  projectId,
  collapsed,
  onToggleCollapse,
  onNavigateToLine,
  onNavigateToBlock,
  onNavigateToLog,
  selectedErrorSnippet,
}: NotesPanelProps) {
  const [activeTab, setActiveTab] = useState<NotesTab>('notes');
  const [showSimilarity, setShowSimilarity] = useState(false);
  const [importMessage, setImportMessage] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      await downloadKnowledgeBase();
    } finally {
      setIsExporting(false);
    }
  }, []);

  const handleImport = useCallback(async () => {
    try {
      const json = await uploadKnowledgeBase();
      const result = await importKnowledgeBase(json);
      setImportMessage(`Импортировано: ${result.notes} заметок, ${result.tags} тегов`);
      setTimeout(() => setImportMessage(''), 3000);
    } catch (e) {
      setImportMessage(`Ошибка: ${e instanceof Error ? e.message : 'Неизвестная ошибка'}`);
      setTimeout(() => setImportMessage(''), 3000);
    }
  }, []);

  if (collapsed) {
    return (
      <div className="notes-panel notes-panel-collapsed">
        <button className="notes-panel-toggle" onClick={onToggleCollapse} title="Открыть панель заметок">
          📋
        </button>
      </div>
    );
  }

  return (
    <div className="notes-panel">
      <div className="notes-panel-header">
        <span className="notes-panel-title">База знаний</span>
        <div className="notes-panel-header-actions">
          <button
            className="btn btn-sm btn-icon"
            onClick={handleExport}
            disabled={isExporting}
            title="Экспорт"
          >
            ⬇
          </button>
          <button className="btn btn-sm btn-icon" onClick={handleImport} title="Импорт">
            ⬆
          </button>
          <button
            className="btn btn-sm btn-icon"
            onClick={() => setShowSimilarity(!showSimilarity)}
            title="Поиск похожих"
          >
            🔍
          </button>
          <button className="notes-panel-toggle" onClick={onToggleCollapse} title="Свернуть">
            ▸
          </button>
        </div>
      </div>

      {importMessage && (
        <div className="notes-import-message">{importMessage}</div>
      )}

      {showSimilarity && selectedErrorSnippet && (
        <SimilaritySearch
          errorSnippet={selectedErrorSnippet}
          onNavigateToLog={onNavigateToLog}
          onClose={() => setShowSimilarity(false)}
        />
      )}

      <div className="notes-tabs">
        <button
          className={`notes-tab ${activeTab === 'pinned' ? 'active' : ''}`}
          onClick={() => setActiveTab('pinned')}
        >
          📌 Закреплённые
        </button>
        <button
          className={`notes-tab ${activeTab === 'notes' ? 'active' : ''}`}
          onClick={() => setActiveTab('notes')}
        >
          📝 Заметки
        </button>
        <button
          className={`notes-tab ${activeTab === 'bookmarks' ? 'active' : ''}`}
          onClick={() => setActiveTab('bookmarks')}
        >
          🔖 Важные места
        </button>
      </div>

      <div className="notes-panel-content">
        {activeTab === 'pinned' && (
          <PinnedErrors
            logId={logId}
            onNavigate={onNavigateToBlock}
          />
        )}
        {activeTab === 'notes' && (
          <MyNotes
            logId={logId ?? ''}
            projectId={projectId}
            selectedErrorSnippet={selectedErrorSnippet}
          />
        )}
        {activeTab === 'bookmarks' && (
          <Bookmarks
            logId={logId}
            onNavigate={onNavigateToLine}
          />
        )}
      </div>
    </div>
  );
}
