import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/schema';
import { searchByFields } from '../../utils/fuzzySearch';
import type { Note, LogEntry, Project } from '../../types';

interface SimilaritySearchProps {
  errorSnippet: string;
  onNavigateToLog?: (logId: string, projectId: string) => void;
  onClose: () => void;
}

export function SimilaritySearch({ errorSnippet, onNavigateToLog, onClose }: SimilaritySearchProps) {
  const [searchText, setSearchText] = useState(errorSnippet);
  const notes = useLiveQuery(() => db.notes.toArray(), []);
  const logs = useLiveQuery(() => db.logs.toArray(), []);
  const projects = useLiveQuery(() => db.projects.toArray(), []);

  const logMap = useMemo(() => {
    const map = new Map<string, LogEntry>();
    logs?.forEach((l) => map.set(l.id, l));
    return map;
  }, [logs]);

  const projectMap = useMemo(() => {
    const map = new Map<string, Project>();
    projects?.forEach((p) => map.set(p.id, p));
    return map;
  }, [projects]);

  const results = useMemo(() => {
    if (!notes || !searchText.trim()) return [];
    return searchByFields<Note>(
      notes,
      searchText,
      ['errorSnippet', 'cause', 'solution'],
      0.25,
    );
  }, [notes, searchText]);

  return (
    <div className="similarity-search">
      <div className="similarity-search-header">
        <span className="similarity-search-title">Поиск похожих случаев</span>
        <button className="btn btn-sm btn-icon" onClick={onClose}>×</button>
      </div>
      <textarea
        className="input similarity-search-input"
        rows={3}
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        placeholder="Текст ошибки для поиска..."
      />
      <div className="similarity-search-results">
        {results.length === 0 && (
          <div className="notes-empty">
            {searchText.trim() ? 'Совпадений не найдено' : 'Введите текст ошибки для поиска'}
          </div>
        )}
        {results.map((r) => {
          const log = logMap.get(r.item.logId);
          const project = log ? projectMap.get(log.projectId) : undefined;
          return (
            <div key={r.item.id} className="similarity-result-item">
              <div className="similarity-result-score">
                {Math.round(r.score * 100)}%
              </div>
              <div className="similarity-result-body">
                <div className="similarity-result-field">
                  {r.matchField === 'errorSnippet' && 'Ошибка'}
                  {r.matchField === 'cause' && 'Причина'}
                  {r.matchField === 'solution' && 'Решение'}
                </div>
                <div className="similarity-result-preview">
                  {r.matchField === 'errorSnippet' && r.item.errorSnippet.slice(0, 120)}
                  {r.matchField === 'cause' && r.item.cause}
                  {r.matchField === 'solution' && r.item.solution}
                </div>
                <div className="similarity-result-meta">
                  {project && <span>{project.name}</span>}
                  {log && <span> · {log.fileName}</span>}
                  <span> · {new Date(r.item.createdAt).toLocaleDateString()}</span>
                </div>
                {r.item.solution && (
                  <div className="similarity-result-solution">
                    Решение: {r.item.solution.slice(0, 150)}
                  </div>
                )}
                {log && onNavigateToLog && (
                  <button
                    className="btn btn-sm"
                    onClick={() => onNavigateToLog(log.id, log.projectId)}
                  >
                    Открыть лог
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
