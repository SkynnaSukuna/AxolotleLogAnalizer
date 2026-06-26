import { useState } from 'react';
import { useNotes } from '../../hooks/useNotes';
import { NoteEditor } from './NoteEditor';
import type { Note } from '../../types';

interface MyNotesProps {
  logId: string;
  projectId?: string;
  selectedErrorSnippet?: string;
}

export function MyNotes({ logId, projectId, selectedErrorSnippet }: MyNotesProps) {
  const { notes, addNote, updateNote, deleteNote } = useNotes(projectId);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = notes
    ? notes.filter(
        (n) =>
          !searchTerm ||
          n.cause.toLowerCase().includes(searchTerm.toLowerCase()) ||
          n.solution.toLowerCase().includes(searchTerm.toLowerCase()) ||
          n.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase())),
      )
    : [];

  const handleSave = async (data: {
    errorSnippet: string;
    cause: string;
    solution: string;
    tags: string[];
    isGlobal: boolean;
  }) => {
    if (!projectId) return;
    if (editingId) {
      await updateNote(editingId, data);
      setEditingId(null);
    } else {
      await addNote({ logId, projectId, ...data });
    }
    setShowEditor(false);
  };

  return (
    <div className="my-notes">
      <div className="notes-toolbar">
        <input
          className="input"
          placeholder="Поиск по заметкам..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button
          className="btn btn-sm btn-primary"
          onClick={() => {
            setEditingId(null);
            setShowEditor(!showEditor);
          }}
        >
          + Заметка
        </button>
      </div>
      {showEditor && (
        <NoteEditor
          initial={{
            errorSnippet: selectedErrorSnippet,
            cause: '',
            solution: '',
            tags: [],
            isGlobal: false,
          }}
          onSave={handleSave}
          onCancel={() => setShowEditor(false)}
        />
      )}
      <div className="notes-list">
        {filtered.length === 0 && (
          <div className="notes-empty">Нет заметок</div>
        )}
        {filtered.map((note: Note) => (
          <div key={note.id} className="note-item">
            <div className="note-item-header">
              <span className="note-item-cause">{note.cause || 'Без причины'}</span>
              <div className="note-item-actions">
                {note.isGlobal && <span className="notes-global-badge">Глоб</span>}
                <button
                  className="btn btn-sm btn-icon"
                  onClick={() => {
                    setEditingId(note.id);
                    setShowEditor(true);
                  }}
                >
                  ✏
                </button>
                <button
                  className="btn btn-sm btn-icon btn-danger"
                  onClick={() => deleteNote(note.id)}
                >
                  ×
                </button>
              </div>
            </div>
            {note.errorSnippet && (
              <div className="note-item-preview">{note.errorSnippet.slice(0, 100)}</div>
            )}
            {note.solution && (
              <div className="note-item-solution">
                <span className="note-item-label">Решение:</span> {note.solution.slice(0, 200)}
              </div>
            )}
            {note.tags.length > 0 && (
              <div className="note-item-tags">
                {note.tags.map((tag) => (
                  <span key={tag} className="notes-tag" style={{ background: '#6b7280', color: '#fff' }}>
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
