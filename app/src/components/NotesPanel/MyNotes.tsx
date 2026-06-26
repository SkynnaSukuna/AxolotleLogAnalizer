import { useState } from 'react';
import { useNotes } from '../../hooks/useNotes';
import { NoteEditor } from './NoteEditor';
import type { Note, NoteStatus } from '../../types';

const STATUS_STYLES: Record<NoteStatus, { label: string; color: string; bg: string }> = {
  open: { label: 'Открыто', color: '#2563eb', bg: '#dbeafe' },
  in_progress: { label: 'В работе', color: '#a16207', bg: '#fef9c3' },
  resolved: { label: 'Решено', color: '#15803d', bg: '#dcfce7' },
  wontfix: { label: 'Не баг', color: '#4b5563', bg: '#f3f4f6' },
};

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
  const [changingStatusId, setChangingStatusId] = useState<string | null>(null);

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
    status: NoteStatus;
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
            errorSnippet: editingId
              ? notes?.find((n) => n.id === editingId)?.errorSnippet
              : selectedErrorSnippet,
            cause: notes?.find((n) => n.id === editingId)?.cause ?? '',
            solution: notes?.find((n) => n.id === editingId)?.solution ?? '',
            tags: notes?.find((n) => n.id === editingId)?.tags ?? [],
            isGlobal: notes?.find((n) => n.id === editingId)?.isGlobal ?? false,
            status: notes?.find((n) => n.id === editingId)?.status ?? 'open',
          }}
          onSave={handleSave}
          onCancel={() => {
            setEditingId(null);
            setShowEditor(false);
          }}
        />
      )}
      <div className="notes-list" onClick={() => setChangingStatusId(null)}>
        {filtered.length === 0 && (
          <div className="notes-empty">Нет заметок</div>
        )}
        {filtered.map((note: Note) => {
          const st = STATUS_STYLES[note.status] ?? STATUS_STYLES.open;
          return (
            <div key={note.id} className="note-item">
              <div className="note-item-header">
                <span className="note-item-cause">{note.cause || 'Без причины'}</span>
                <div className="note-item-actions">
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      setChangingStatusId(changingStatusId === note.id ? null : note.id);
                    }}
                    style={{
                      fontSize: '0.65rem',
                      fontWeight: 600,
                      padding: '2px 6px',
                      borderRadius: 4,
                      color: st.color,
                      background: st.bg,
                      marginRight: 4,
                      cursor: 'pointer',
                      position: 'relative',
                    }}
                  >
                    {st.label}
                    {changingStatusId === note.id && (
                      <span
                        style={{
                          position: 'absolute',
                          top: '100%',
                          right: 0,
                          zIndex: 100,
                          background: 'var(--bg-primary)',
                          border: '1px solid var(--border-color)',
                          borderRadius: 6,
                          padding: 4,
                          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                          whiteSpace: 'nowrap',
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {(Object.entries(STATUS_STYLES) as [NoteStatus, typeof STATUS_STYLES['open']][]).map(
                          ([key, s]) => (
                            <div
                              key={key}
                              onClick={async () => {
                                await updateNote(note.id, { status: key });
                                setChangingStatusId(null);
                              }}
                              style={{
                                padding: '4px 10px',
                                borderRadius: 4,
                                color: s.color,
                                background: key === note.status ? s.bg : 'transparent',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                fontWeight: key === note.status ? 700 : 500,
                              }}
                            >
                              {s.label}
                            </div>
                          ),
                        )}
                      </span>
                    )}
                  </span>
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
          );
        })}
      </div>
    </div>
  );
}
