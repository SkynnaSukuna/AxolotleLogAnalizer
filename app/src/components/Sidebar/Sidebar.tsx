import { useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/schema';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { ProjectTree } from './ProjectTree';
import { ThemeSwitcher } from './ThemeSwitcher';
import { Button } from '../ui/Button';
import { logger } from '../../utils/logger';
import type { Project, LogEntry } from '../../types';

const MIN_WIDTH = 48;
const MAX_WIDTH = 600;
const DEFAULT_WIDTH = 320;

interface SidebarProps {
  onSelectLog?: (log: LogEntry) => void;
  onSelectProject?: (project: Project) => void;
}

export function Sidebar({ onSelectLog, onSelectProject }: SidebarProps) {
  const [width, setWidth] = useLocalStorage('sidebar-width', DEFAULT_WIDTH);
  const [collapsed, setCollapsed] = useLocalStorage('sidebar-collapsed', false);
  const [activeProjectId, setActiveProjectId] = useLocalStorage<string | undefined>('sidebar-active-project', undefined);
  const [selectedLogId, setSelectedLogId] = useLocalStorage<string | undefined>('sidebar-active-log', undefined);

  const settings = useLiveQuery(() => db.settings.get('global'));

  const handleSelectProject = useCallback(async (project: Project) => {
    logger.info(`Project selected: ${project.name}`);
    setActiveProjectId(project.id);
    setSelectedLogId(undefined);
    onSelectProject?.(project);
    if (settings) {
      await db.settings.update('global', { lastProjectId: project.id });
    }
  }, [setActiveProjectId, setSelectedLogId, onSelectProject, settings]);

  const handleSelectLog = useCallback((log: LogEntry) => {
    setSelectedLogId(log.id);
    onSelectLog?.(log);
  }, [setSelectedLogId, onSelectLog]);

  const handleAddLog = useCallback(async (projectId: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = '.log,.txt,.json,.csv';
    input.onchange = async () => {
      const files = Array.from(input.files ?? []);
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
        logger.info(`Log added: ${file.name} (${Math.round(file.size / 1024)} KB)`);
      }
    };
    input.click();
  }, []);

  const handleDeleteProject = useCallback(async (projectId: string) => {
    logger.info(`Deleting project: ${projectId}`);
    await db.projects.delete(projectId);
    const logs = await db.logs.where('projectId').equals(projectId).toArray();
    await db.logs.bulkDelete(logs.map((l) => l.id));
    if (activeProjectId === projectId) {
      setActiveProjectId(undefined);
    }
  }, [activeProjectId, setActiveProjectId]);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = width;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = startWidth + (moveEvent.clientX - startX);
      setWidth(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, newWidth)));
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [width, setWidth]);

  if (collapsed) {
    return (
      <aside className="sidebar sidebar-collapsed">
        <div className="sidebar-collapsed-content">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(false)}
            title="Развернуть панель"
          >
            ▶
          </Button>
        </div>
      </aside>
    );
  }

  return (
    <aside className="sidebar" style={{ width }}>
      <div className="sidebar-header">
        <div className="sidebar-header-left">
          <span className="sidebar-logo">📋 AxolotleLogAnalyzer</span>
        </div>
        <div style={{ display: 'flex', gap: 2 }}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => logger.download()}
            title="Скачать логи приложения"
            style={{ fontSize: '0.75rem' }}
          >
            📋
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(true)}
            title="Свернуть панель"
          >
            ◀
          </Button>
        </div>
      </div>

      <div className="sidebar-content">
        <ThemeSwitcher />

        <ProjectTree
          activeProjectId={activeProjectId}
          selectedLogId={selectedLogId}
          onSelectProject={handleSelectProject}
          onSelectLog={handleSelectLog}
          onDeleteProject={handleDeleteProject}
          onAddLog={handleAddLog}
        />
      </div>

      <div
        className="sidebar-resize-handle"
        onMouseDown={handleResizeStart}
        title="Изменить ширину"
      />
    </aside>
  );
}
