import { useState, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/schema';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { LogItem } from './LogItem';
import { Button } from '../ui/Button';
import { SidebarContextMenu } from './SidebarContextMenu';
import { ConfirmModal } from '../ui/ConfirmModal';
import type { Project, LogEntry, LogStatus } from '../../types';

interface ProjectTreeProps {
  activeProjectId?: string;
  selectedLogId?: string;
  onSelectProject: (project: Project) => void;
  onSelectLog: (log: LogEntry) => void;
  onDeleteProject: (projectId: string) => void;
  onAddLog: (projectId: string) => void;
}

export function ProjectTree({ activeProjectId, selectedLogId, onSelectProject, onSelectLog, onDeleteProject, onAddLog }: ProjectTreeProps) {
  const [expandedProjects, setExpandedProjects] = useLocalStorage<Record<string, boolean>>('project-tree-expanded', {});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [dragOverProjectId, setDragOverProjectId] = useState<string | null>(null);

  /* ── context menu state ── */
  const [contextMenu, setContextMenu] = useState<{
    type: 'project' | 'log';
    data: Project | LogEntry;
    position: { x: number; y: number };
  } | null>(null);

  /* ── confirm delete state ── */
  const [confirmDelete, setConfirmDelete] = useState<{
    type: 'project' | 'log';
    name: string;
  } | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  /* ── log rename state ── */
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [editingLogName, setEditingLogName] = useState('');

  /* ── properties modal state ── */
  const [propertiesModal, setPropertiesModal] = useState<{
    type: 'project' | 'log';
    data: Project | LogEntry;
  } | null>(null);

  const projects = useLiveQuery(
    () => db.projects.orderBy('updatedAt').reverse().toArray(),
    [],
    [],
  );

  const logsByProject = useLiveQuery(
    (): Record<string, LogEntry[]> | Promise<Record<string, LogEntry[]>> => {
      if (!projects || projects.length === 0) return {};
      const ids = projects.map((p) => p.id);
      return db.logs
        .filter((l) => ids.includes(l.projectId))
        .toArray()
        .then((allLogs) => {
          const map: Record<string, LogEntry[]> = {};
          for (const l of allLogs) {
            if (!map[l.projectId]) map[l.projectId] = [];
            map[l.projectId].push(l);
          }
          for (const id of ids) {
            if (!map[id]) map[id] = [];
            map[id].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
          }
          return map;
        });
    },
    [projects],
  );

  const toggleProject = useCallback((projectId: string) => {
    setExpandedProjects((prev) => ({
      ...prev,
      [projectId]: !prev[projectId],
    }));
  }, [setExpandedProjects]);

  const handleCreate = useCallback(async () => {
    const id = crypto.randomUUID();
    await db.projects.add({
      id,
      name: 'Новый проект',
      description: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    setExpandedProjects((prev) => ({ ...prev, [id]: true }));
    setEditingId(id);
    setEditName('Новый проект');
  }, [setExpandedProjects]);

  const handleRename = useCallback(async (project: Project) => {
    if (editName.trim() && editName !== project.name) {
      await db.projects.update(project.id, { name: editName.trim(), updatedAt: new Date() });
    }
    setEditingId(null);
  }, [editName]);

  const handleLogRenameCommit = useCallback(async () => {
    if (!editingLogId || !editingLogName.trim()) {
      setEditingLogId(null);
      return;
    }
    await db.logs.update(editingLogId, { fileName: editingLogName.trim(), updatedAt: new Date() });
    setEditingLogId(null);
  }, [editingLogId, editingLogName]);

  const handleDelete = useCallback(async (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    onDeleteProject(projectId);
  }, [onDeleteProject]);

  const handleProjectClick = useCallback((project: Project) => {
    onSelectProject(project);
    toggleProject(project.id);
  }, [onSelectProject, toggleProject]);

  const isExpanded = useCallback((projectId: string): boolean => {
    return expandedProjects[projectId] ?? false;
  }, [expandedProjects]);

  /* ── context menu handlers ── */

  const handleProjectContextMenu = useCallback((e: React.MouseEvent, project: Project) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      type: 'project',
      data: project,
      position: { x: e.clientX, y: e.clientY },
    });
  }, []);

  const handleLogContextMenu = useCallback((e: React.MouseEvent, log: LogEntry) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      type: 'log',
      data: log,
      position: { x: e.clientX, y: e.clientY },
    });
  }, []);

  const handleContextMenuClose = useCallback(() => {
    setContextMenu(null);
  }, []);

  /* ── project actions from context menu ── */

  const handleProjectRename = useCallback(() => {
    if (!contextMenu || contextMenu.type !== 'project') return;
    const project = contextMenu.data as Project;
    setEditingId(project.id);
    setEditName(project.name);
    setContextMenu(null);
  }, [contextMenu]);

  const handleProjectDelete = useCallback(() => {
    if (!contextMenu || contextMenu.type !== 'project') return;
    const project = contextMenu.data as Project;
    setPendingDeleteId(project.id);
    setConfirmDelete({ type: 'project', name: project.name });
    setContextMenu(null);
  }, [contextMenu]);

  const handleProjectAddLog = useCallback(() => {
    if (!contextMenu || contextMenu.type !== 'project') return;
    onAddLog(contextMenu.data.id);
    setContextMenu(null);
  }, [contextMenu, onAddLog]);

  const handleProjectProperties = useCallback(() => {
    if (!contextMenu || contextMenu.type !== 'project') return;
    setPropertiesModal({ type: 'project', data: contextMenu.data });
    setContextMenu(null);
  }, [contextMenu]);

  /* ── log actions from context menu ── */

  const handleLogOpen = useCallback(() => {
    if (!contextMenu || contextMenu.type !== 'log') return;
    onSelectLog(contextMenu.data as LogEntry);
    setContextMenu(null);
  }, [contextMenu, onSelectLog]);

  const handleLogRename = useCallback(() => {
    if (!contextMenu || contextMenu.type !== 'log') return;
    const log = contextMenu.data as LogEntry;
    setEditingLogId(log.id);
    setEditingLogName(log.fileName);
    setContextMenu(null);
  }, [contextMenu]);

  const handleLogDelete = useCallback(() => {
    if (!contextMenu || contextMenu.type !== 'log') return;
    const log = contextMenu.data as LogEntry;
    setPendingDeleteId(log.id);
    setConfirmDelete({ type: 'log', name: log.fileName });
    setContextMenu(null);
  }, [contextMenu]);

  const handleLogCopyPath = useCallback(() => {
    if (!contextMenu || contextMenu.type !== 'log') return;
    const log = contextMenu.data as LogEntry;
    const project = projects?.find((p) => p.id === log.projectId);
    const path = project ? `${project.name}/${log.fileName}` : log.fileName;
    navigator.clipboard.writeText(path).catch(() => {});
    setContextMenu(null);
  }, [contextMenu, projects]);

  const handleLogProperties = useCallback(() => {
    if (!contextMenu || contextMenu.type !== 'log') return;
    setPropertiesModal({ type: 'log', data: contextMenu.data });
    setContextMenu(null);
  }, [contextMenu]);

  /* ── log status change ── */

  const handleLogStatusChange = useCallback(async (logId: string, status: LogStatus) => {
    console.log('[ProjectTree] handleLogStatusChange — logId:', logId, 'status:', status);
    const updated = await db.logs.update(logId, { status, updatedAt: new Date() });
    console.log('[ProjectTree] db.logs.update result:', updated, '(1 = ok, 0 = not found)');
  }, []);

  /* ── confirm delete ── */

  const handleConfirmDelete = useCallback(async () => {
    if (!pendingDeleteId) return;
    if (confirmDelete?.type === 'project') {
      onDeleteProject(pendingDeleteId);
    } else {
      await db.logs.delete(pendingDeleteId);
    }
    setConfirmDelete(null);
    setPendingDeleteId(null);
  }, [confirmDelete, pendingDeleteId, onDeleteProject]);

  const handleCancelDelete = useCallback(() => {
    setConfirmDelete(null);
    setPendingDeleteId(null);
  }, []);

  /* ── drag & drop for logs ── */
  const handleDragOverProject = useCallback((e: React.DragEvent, projectId: string) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
    setDragOverProjectId(projectId);
  }, []);

  const handleDragLeaveProject = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverProjectId(null);
  }, []);

  const handleDropOnProject = useCallback(async (e: React.DragEvent, projectId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverProjectId(null);
    setExpandedProjects((prev) => ({ ...prev, [projectId]: true }));
    const files = Array.from(e.dataTransfer.files);
    for (const file of files) {
      const content = await file.text();
      await db.logs.add({
        id: crypto.randomUUID(),
        projectId,
        fileName: file.name,
        originalFileName: file.name,
        content,
        size: file.size,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'new',
        tags: [],
      });
    }
  }, [setExpandedProjects]);

  const handleAddLog = useCallback((e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    onAddLog(projectId);
  }, [onAddLog]);

  return (
    <div className="project-tree">
      <div className="project-tree-header">
        <span className="project-tree-title">Проекты</span>
        <Button variant="primary" size="sm" onClick={handleCreate}>
          + Создать
        </Button>
      </div>

      <div className="project-tree-items">
        {projects.length === 0 && (
          <div className="project-empty">Нет проектов</div>
        )}

        {projects.map((project) => {
          const expanded = isExpanded(project.id);
          const projectLogs = logsByProject?.[project.id] ?? [];
          const isEditing = editingId === project.id;
          const isDragOver = dragOverProjectId === project.id;

          return (
            <div key={project.id} className="project-tree-node">
              {/* ── project row ── */}
              <div
                className={`project-tree-item${activeProjectId === project.id ? ' active' : ''}${isDragOver ? ' drag-over' : ''}`}
                onClick={() => handleProjectClick(project)}
                onContextMenu={(e) => handleProjectContextMenu(e, project)}
                onDragOver={(e) => handleDragOverProject(e, project.id)}
                onDragLeave={handleDragLeaveProject}
                onDrop={(e) => handleDropOnProject(e, project.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') handleProjectClick(project); }}
              >
                {/* Collapse arrow */}
                <span
                  className={`project-tree-arrow${expanded ? ' expanded' : ''}`}
                  onClick={(e) => { e.stopPropagation(); toggleProject(project.id); }}
                >
                  ▶
                </span>

                <span className="project-tree-icon">📁</span>

                <div className="project-tree-info">
                  {isEditing ? (
                    <input
                      className="project-rename-input"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onBlur={() => handleRename(project)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRename(project);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span
                      className="project-tree-name"
                      onDoubleClick={(e) => { e.stopPropagation(); setEditingId(project.id); setEditName(project.name); }}
                    >
                      {project.name}
                    </span>
                  )}
                </div>

                {projectLogs.length > 0 && (
                  <span className="project-tree-count">{projectLogs.length}</span>
                )}

                <div className="project-tree-actions">
                  {!isEditing && (
                    <button
                      className="project-action-btn"
                      onClick={(e) => { e.stopPropagation(); setEditingId(project.id); setEditName(project.name); }}
                      title="Переименовать"
                    >
                      ✏️
                    </button>
                  )}
                  <button
                    className="project-action-btn danger"
                    onClick={(e) => handleDelete(e, project.id)}
                    title="Удалить проект"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {/* ── log list (children) ── */}
              <div className={`project-tree-children${expanded ? ' expanded' : ''}`}>
                {expanded && (
                  <>
                    {projectLogs.length === 0 ? (
                      <div className="project-tree-empty">
                        <span className="project-tree-empty-text">Логов пока нет</span>
                        <button
                          className="btn btn-sm"
                          onClick={(e) => handleAddLog(e, project.id)}
                        >
                          📂 Загрузить логи
                        </button>
                      </div>
                    ) : (
                      projectLogs.map((log: LogEntry) => (
                        <LogItem
                          key={log.id}
                          log={log}
                          isSelected={selectedLogId === log.id}
                          onSelect={onSelectLog}
                          onContextMenu={handleLogContextMenu}
                          onStatusChange={handleLogStatusChange}
                          isEditing={editingLogId === log.id}
                          editName={editingLogName}
                          onEditNameChange={setEditingLogName}
                          onCommitRename={handleLogRenameCommit}
                          onCancelRename={() => setEditingLogId(null)}
                          onDragOver={(e) => handleDragOverProject(e, project.id)}
                          onDragLeave={handleDragLeaveProject}
                          onDrop={(e) => handleDropOnProject(e, project.id)}
                        />
                      ))
                    )}
                    {projectLogs.length > 0 && (
                      <div className="project-tree-add-log">
                        <button
                          className="btn btn-sm"
                          onClick={(e) => handleAddLog(e, project.id)}
                          style={{ fontSize: '0.7rem', color: 'var(--text-muted)', width: '100%' }}
                        >
                          + Загрузить ещё
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── context menu ── */}
      {contextMenu && (
        <SidebarContextMenu
          type={contextMenu.type}
          data={contextMenu.data}
          position={contextMenu.position}
          onClose={handleContextMenuClose}
          onRename={contextMenu.type === 'project' ? handleProjectRename : handleLogRename}
          onDelete={contextMenu.type === 'project' ? handleProjectDelete : handleLogDelete}
          onAddLog={contextMenu.type === 'project' ? handleProjectAddLog : undefined}
          onOpen={contextMenu.type === 'log' ? handleLogOpen : undefined}
          onCopyPath={contextMenu.type === 'log' ? handleLogCopyPath : undefined}
          onChangeStatus={contextMenu.type === 'log' ? handleLogStatusChange : undefined}
          onProperties={contextMenu.type === 'project' ? handleProjectProperties : handleLogProperties}
        />
      )}

      {/* ── confirm delete modal ── */}
      <ConfirmModal
        open={confirmDelete !== null}
        title={confirmDelete?.type === 'project' ? 'Удалить проект' : 'Удалить лог'}
        message={
          confirmDelete
            ? `Вы уверены, что хотите удалить "${confirmDelete.name}"? ${confirmDelete.type === 'project' ? 'Все логи внутри проекта также будут удалены.' : 'Это действие необратимо.'}`
            : ''
        }
        confirmLabel="Удалить"
        cancelLabel="Отмена"
        danger
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />

      {/* ── properties modal ── */}
      {propertiesModal && (
        <div
          className="modal-overlay"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setPropertiesModal(null); }}
        >
          <div className="modal-window" style={{ width: 400 }}>
            <div className="modal-header">
              <span className="modal-title">
                {propertiesModal.type === 'project' ? '📁 Свойства проекта' : '📄 Свойства лога'}
              </span>
              <button className="modal-close-btn" onClick={() => setPropertiesModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              {propertiesModal.type === 'project' ? (
                (() => {
                  const p = propertiesModal.data as Project;
                  const logCount = logsByProject?.[p.id]?.length ?? 0;
                  return (
                    <div className="properties-grid">
                      <PropertyRow label="Название" value={p.name} />
                      <PropertyRow label="Описание" value={p.description || '—'} />
                      <PropertyRow label="Количество логов" value={String(logCount)} />
                      <PropertyRow label="Создан" value={p.createdAt.toLocaleString()} />
                      <PropertyRow label="Изменён" value={p.updatedAt.toLocaleString()} />
                      <PropertyRow label="ID" value={p.id} />
                    </div>
                  );
                })()
              ) : (
                (() => {
                  const l = propertiesModal.data as LogEntry;
                  return (
                    <div className="properties-grid">
                      <PropertyRow label="Файл" value={l.fileName} />
                      <PropertyRow label="Размер" value={`${(l.size / 1024).toFixed(1)} KB`} />
                      <PropertyRow label="Статус" value={l.status} />
                      <PropertyRow label="Создан" value={l.createdAt.toLocaleString()} />
                      <PropertyRow label="Изменён" value={l.updatedAt.toLocaleString()} />
                      <PropertyRow label="ID" value={l.id} />
                    </div>
                  );
                })()
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PropertyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="property-row">
      <span className="property-row-label">{label}</span>
      <span className="property-row-value">{value}</span>
    </div>
  );
}
