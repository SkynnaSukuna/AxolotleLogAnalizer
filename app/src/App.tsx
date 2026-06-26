import { useEffect, useState, useCallback, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Sidebar } from './components/Sidebar/Sidebar';
import { LogViewer } from './components/LogViewer';
import type { LogViewerHandle } from './components/LogViewer/LogViewer';
import { AIAnalysisPanel, AISettingsModal } from './components/AIAnalysis';
import { NotesPanel } from './components/NotesPanel';
import { FirstUseOverlay } from './components/FirstUseOverlay';
import { seedMockData } from './db/mockData';
import { db } from './db/schema';
import { logger } from './utils/logger';
import type { LogEntry, AIAnalysisResult, LogStatus } from './types';

export default function App() {
  const [ready, setReady] = useState(false);
  const [selectedLog, setSelectedLog] = useState<LogEntry | undefined>(undefined);
  const [analyses, setAnalyses] = useState<AIAnalysisResult[]>([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logViewerRef = useRef<LogViewerHandle>(null);

  /* ── right-side notes panel ── */
  const [notesCollapsed, setNotesCollapsed] = useState(true);
  const [selectedErrorSnippet, setSelectedErrorSnippet] = useState('');
  const [showNoteEditor, setShowNoteEditor] = useState(false);

  /* ── AI panel collapse ── */
  const [aiPanelCollapsed, setAiPanelCollapsed] = useState(true);

  const settings = useLiveQuery(() => db.settings.get('global'));

  useEffect(() => {
    logger.info('App starting, seeding mock data...');
    seedMockData().then(() => {
      logger.info('App ready');
      setReady(true);
    });
  }, []);

  /* ── restore AI panel collapse state from settings ── */
  useEffect(() => {
    if (settings) {
      setAiPanelCollapsed(settings.aiPanelCollapsed ?? true);
    }
  }, [settings?.aiPanelCollapsed]);

  /* ── block default browser context menu globally ── */
  useEffect(() => {
    const prevent = (e: MouseEvent) => e.preventDefault();
    document.addEventListener('contextmenu', prevent);
    return () => document.removeEventListener('contextmenu', prevent);
  }, []);

  /* ── restore last session ── */
  useEffect(() => {
    if (!ready || !settings) return;
    if (settings.lastProjectId) {
      db.logs
        .where('projectId')
        .equals(settings.lastProjectId)
        .last()
        .then((log) => {
          if (log) setSelectedLog(log);
        });
    }
  }, [ready, settings?.lastProjectId]);

  const storedAnalyses = useCallback(async () => {
    if (!selectedLog) return;
    const chats = await db.chats.where('logId').equals(selectedLog.id).toArray();
    const all = chats.flatMap((c) => c.aiAnalysis ?? []);
    setAnalyses(all);
  }, [selectedLog?.id]);

  useEffect(() => {
    storedAnalyses();
  }, [selectedLog]);

  const handleNewAnalysis = useCallback(
    async (result: AIAnalysisResult) => {
      logger.info(
        `AI analysis result: ${result.verdict.slice(0, 60)} (urgency=${result.urgency}, confidence=${result.confidence}%)`,
      );
      setAnalyses((prev) => [...prev, result]);
      if (!selectedLog) return;

      const existing = await db.chats.where('logId').equals(selectedLog.id).first();
      if (existing) {
        await db.chats.update(existing.id, {
          aiAnalysis: [...(existing.aiAnalysis ?? []), result],
        });
      } else {
        await db.chats.add({
          id: `chat_${Date.now()}`,
          logId: selectedLog.id,
          title: `AI Analysis - ${selectedLog.fileName}`,
          messages: [],
          aiAnalysis: [result],
          notes: '',
          createdAt: new Date(),
        });
      }
    },
    [selectedLog],
  );

  const handleErrorContextMenu = useCallback(
    (errorSnippet: string, _blockId: number) => {
      setSelectedErrorSnippet(errorSnippet);
      setShowNoteEditor(true);
      setNotesCollapsed(false);
    },
    [],
  );

  const handlePinError = useCallback(
    async (blockId: number, errorText: string, stackTraceHash: string) => {
      if (!selectedLog) return;
      await db.pinnedErrors.add({
        id: `pin_${Date.now()}`,
        logId: selectedLog.id,
        projectId: selectedLog.projectId,
        blockId,
        errorText: errorText.slice(0, 200),
        stackTraceHash,
        note: '',
        pinnedAt: new Date(),
      });
      setNotesCollapsed(false);
    },
    [selectedLog],
  );

  const handleBookmarkLine = useCallback(
    async (lineNumber: number, text: string) => {
      if (!selectedLog) return;
      await db.bookmarks.add({
        id: `bm_${Date.now()}`,
        logId: selectedLog.id,
        projectId: selectedLog.projectId,
        lineNumber,
        label: `Line ${lineNumber + 1}`,
        context: text.slice(0, 120),
        createdAt: new Date(),
      });
    },
    [selectedLog],
  );

  const handleChangeLogStatus = useCallback(
    async (logId: string, status: LogStatus) => {
      console.log('[App] handleChangeLogStatus — logId:', logId, 'status:', status);
      const updated = await db.logs.update(logId, { status, updatedAt: new Date() });
      console.log('[App] db.logs.update result:', updated, '(1 = ok, 0 = not found)');
      if (selectedLog && selectedLog.id === logId) {
        setSelectedLog({ ...selectedLog, status });
      }
    },
    [selectedLog],
  );

  const handleSelectLog = useCallback(
    async (log: LogEntry) => {
      logger.info(`Log selected: ${log.fileName} (${log.id})`);
      setSelectedLog(log);
      if (settings) {
        await db.settings.update('global', { lastProjectId: log.projectId });
      }
    },
    [settings],
  );

  /* ── AI panel toggle ── */
  const handleToggleAiPanel = useCallback(async () => {
    const next = !aiPanelCollapsed;
    logger.info(`AI panel ${next ? 'hidden' : 'shown'}`);
    setAiPanelCollapsed(next);
    await db.settings.update('global', { aiPanelCollapsed: next });
  }, [aiPanelCollapsed]);

  if (!ready) {
    return (
      <div className="app-loading">
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: 12 }}>📋</div>
          <span>Загрузка AxolotleLogAnalyzer...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <FirstUseOverlay onDismiss={() => setShowOnboarding(false)} />

      <Sidebar onSelectLog={handleSelectLog} />

      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {selectedLog ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              minHeight: 0,
              padding: '20px 24px',
            }}
          >
            {/* ── header with AI panel toggle ── */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 12,
                flexShrink: 0,
              }}
            >
              <h2
                style={{
                  fontSize: '1.125rem',
                  fontWeight: 600,
                }}
              >
                {selectedLog.fileName}
              </h2>
              <button
                className="ai-toggle-header-btn"
                onClick={handleToggleAiPanel}
                title={aiPanelCollapsed ? 'Показать AI анализ' : 'Скрыть AI анализ'}
              >
                {aiPanelCollapsed ? '🤖' : '🧠'}
                <span style={{ fontSize: '0.75rem' }}>
                  {aiPanelCollapsed ? 'Показать AI' : 'Скрыть AI'}
                </span>
              </button>
            </div>

            <div style={{ display: 'flex', gap: 16, flex: 1, minHeight: 0 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <LogViewer
                  ref={logViewerRef}
                  content={selectedLog.content}
                  logId={selectedLog.id}
                  projectId={selectedLog.projectId}
                  currentStatus={selectedLog.status}
                  onErrorContextMenu={handleErrorContextMenu}
                  onPinError={handlePinError}
                  onBookmarkLine={handleBookmarkLine}
                  onChangeLogStatus={handleChangeLogStatus}
                />
              </div>

              {/* ── AI panel (collapsible) ── */}
              <div className={`ai-panel-wrapper${aiPanelCollapsed ? ' collapsed' : ''}`}>
                {aiPanelCollapsed ? (
                  <div className="ai-panel-collapsed">
                    <button
                      className="ai-panel-toggle-btn"
                      onClick={handleToggleAiPanel}
                      title="Показать AI анализ"
                    >
                      🤖
                    </button>
                    {analyses.length > 0 && (
                      <span className="ai-panel-collapsed-count">{analyses.length}</span>
                    )}
                  </div>
                ) : (
                  <div className="ai-panel">
                    <AIAnalysisPanel
                      logId={selectedLog.id}
                      logContent={selectedLog.content}
                      fileName={selectedLog.fileName}
                      analyses={analyses}
                      onNewAnalysis={handleNewAnalysis}
                      onOpenSettings={() => setSettingsOpen(true)}
                      onToggleCollapse={handleToggleAiPanel}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div
            className="main-empty"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              gap: 12,
              padding: 24,
            }}
          >
            <div style={{ fontSize: '4rem', marginBottom: 8 }}>📋</div>
            <h1
              style={{
                fontSize: '1.75rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: 4,
              }}
            >
              AxolotleLogAnalyzer
            </h1>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
              Выберите проект и лог для анализа
            </p>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                alignItems: 'center',
                padding: '20px 32px',
                border: '2px dashed var(--border-color)',
                borderRadius: 12,
                background: 'var(--bg-secondary)',
                maxWidth: 360,
                width: '100%',
              }}
            >
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                🖱 Нажмите на проект слева
              </span>
              <div
                style={{
                  width: '100%',
                  height: 1,
                  background: 'var(--border-color)',
                }}
              />
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                📂 Или перетащите файлы логов в проект
              </span>
            </div>

            <p
              style={{
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                marginTop: 12,
              }}
            >
              {showOnboarding ? '' : '💡 Нажмите «Пропустить» в подсказке, чтобы убрать это сообщение'}
            </p>
          </div>
        )}
      </main>

      <NotesPanel
        logId={selectedLog?.id}
        projectId={selectedLog?.projectId}
        collapsed={notesCollapsed}
        onToggleCollapse={() => setNotesCollapsed(!notesCollapsed)}
        onNavigateToLine={(lineNumber) => {
          logViewerRef.current?.scrollToLine(lineNumber);
        }}
        onNavigateToBlock={(blockId) => {
          logViewerRef.current?.scrollToBlock(blockId);
        }}
        selectedErrorSnippet={showNoteEditor ? selectedErrorSnippet : undefined}
      />

      <AISettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
}
