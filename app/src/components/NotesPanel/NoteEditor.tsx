import { useState, useEffect } from 'react';
import { TagInput } from './TagInput';

interface NoteEditorProps {
  initial: {
    errorSnippet?: string;
    cause?: string;
    solution?: string;
    tags?: string[];
    isGlobal?: boolean;
  };
  onSave: (data: {
    errorSnippet: string;
    cause: string;
    solution: string;
    tags: string[];
    isGlobal: boolean;
  }) => void;
  onCancel: () => void;
}

export function NoteEditor({ initial, onSave, onCancel }: NoteEditorProps) {
  const [errorSnippet, setErrorSnippet] = useState(initial.errorSnippet ?? '');
  const [cause, setCause] = useState(initial.cause ?? '');
  const [solution, setSolution] = useState(initial.solution ?? '');
  const [tags, setTags] = useState<string[]>(initial.tags ?? []);
  const [isGlobal, setIsGlobal] = useState(initial.isGlobal ?? false);

  useEffect(() => {
    setErrorSnippet(initial.errorSnippet ?? '');
    setCause(initial.cause ?? '');
    setSolution(initial.solution ?? '');
    setTags(initial.tags ?? []);
    setIsGlobal(initial.isGlobal ?? false);
  }, [initial]);

  const handleSave = () => {
    if (!cause.trim() && !solution.trim()) return;
    onSave({
      errorSnippet: errorSnippet.trim(),
      cause: cause.trim(),
      solution: solution.trim(),
      tags,
      isGlobal,
    });
  };

  return (
    <div className="note-editor">
      <div className="input-group">
        <label className="input-label">Фрагмент ошибки</label>
        <textarea
          className="input note-editor-textarea"
          rows={3}
          value={errorSnippet}
          onChange={(e) => setErrorSnippet(e.target.value)}
          placeholder="Текст ошибки (автоматически из выделенного)"
        />
      </div>
      <div className="input-group">
        <label className="input-label">Причина</label>
        <input
          className="input"
          value={cause}
          onChange={(e) => setCause(e.target.value)}
          placeholder="Краткое описание причины"
        />
      </div>
      <div className="input-group">
        <label className="input-label">Решение</label>
        <textarea
          className="input note-editor-textarea"
          rows={3}
          value={solution}
          onChange={(e) => setSolution(e.target.value)}
          placeholder="Как исправить эту ошибку"
        />
      </div>
      <div className="input-group">
        <label className="input-label">Теги</label>
        <TagInput selected={tags} onChange={setTags} />
      </div>
      <label className="notes-global-label">
        <input
          type="checkbox"
          checked={isGlobal}
          onChange={(e) => setIsGlobal(e.target.checked)}
        />
        <span>Глобальная заметка (применяется ко всем проектам)</span>
      </label>
      <div className="note-editor-actions">
        <button className="btn btn-sm" onClick={onCancel}>
          Отмена
        </button>
        <button className="btn btn-sm btn-primary" onClick={handleSave}>
          Сохранить
        </button>
      </div>
    </div>
  );
}
