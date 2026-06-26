import { useState, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import type { AIAnalysisResult, AIConfig } from '../../types';
import { analyzeLogWithAI } from '../../ai/analyzeLogWithAI';
import { getActiveConfig, toProviderConfig } from '../../db/aiConfigs';
import { logger } from '../../utils/logger';
import { AIVerdictCard } from './AIVerdictCard';

interface AIAnalysisPanelProps {
  logId: string;
  logContent: string;
  fileName?: string;
  analyses: AIAnalysisResult[];
  onNewAnalysis: (result: AIAnalysisResult) => void;
  onHighlightLines?: (lines: number[]) => void;
  onOpenSettings?: () => void;
  onToggleCollapse?: () => void;
}

export function AIAnalysisPanel({
  logId,
  logContent,
  fileName,
  analyses,
  onNewAnalysis,
  onHighlightLines,
  onOpenSettings,
  onToggleCollapse,
}: AIAnalysisPanelProps) {
  const activeConfig = useLiveQuery(() => getActiveConfig(), []);
  const providerConfig = toProviderConfig(activeConfig ?? undefined);

  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState('');

  const runAnalysis = useCallback(async () => {
    if (running) return;
    logger.info(`AI analysis triggered: file=${fileName ?? 'unknown'}`);
    setRunning(true);
    setProgress('Начинаем анализ...');

    try {
      const result = await analyzeLogWithAI({
        logContent,
        logId,
        fileName,
        previousAnalyses: analyses,
        config: providerConfig,
        onProgress: setProgress,
      });
      onNewAnalysis(result);
    } finally {
      setRunning(false);
      setProgress('');
    }
  }, [logContent, logId, fileName, analyses, providerConfig, running, onNewAnalysis]);

  const handleReAnalyze = useCallback(async (prev: AIAnalysisResult) => {
    if (running) return;
    setRunning(true);
    setProgress('Повторный анализ...');

    try {
      const result = await analyzeLogWithAI({
        logContent,
        logId,
        fileName,
        previousAnalyses: analyses,
        config: providerConfig,
        onProgress: setProgress,
      });
      onNewAnalysis(result);
    } finally {
      setRunning(false);
      setProgress('');
    }
  }, [logContent, logId, fileName, analyses, providerConfig, running, onNewAnalysis]);

  const sorted = [...analyses].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  const hasKey = !!providerConfig.apiKey || providerConfig.provider === 'ollama';
  const configName = activeConfig?.name ?? 'Не настроено';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}
      >
        <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
          AI Анализ
          {analyses.length > 0 && (
            <span style={{ marginLeft: 6, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              ({analyses.length})
            </span>
          )}
        </span>

        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={onOpenSettings} className="btn btn-sm" title="Настройки AI">
            ⚙
          </button>
          <button
            onClick={runAnalysis}
            disabled={running}
            className="btn btn-sm btn-primary"
            style={{ cursor: running ? 'not-allowed' : 'pointer', opacity: running ? 0.6 : 1 }}
          >
            {running ? 'Анализируем...' : 'Анализировать'}
          </button>
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="btn btn-sm"
              title="Скрыть панель AI"
              style={{ fontSize: '0.85rem', lineHeight: 1 }}
            >
              ▸
            </button>
          )}
        </div>
      </div>

      {activeConfig && (
        <div
          style={{
            padding: '4px 8px', borderRadius: 'var(--radius)',
            background: 'var(--bg-tertiary)', fontSize: '0.65rem',
            color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4,
          }}
        >
          <span>Конфиг:</span>
          <strong style={{ color: 'var(--text-secondary)' }}>{configName}</strong>
          <span style={{ color: 'var(--text-muted)' }}>·</span>
          <span>{activeConfig.provider}</span>
          <span style={{ color: 'var(--text-muted)' }}>·</span>
          <span>{activeConfig.model}</span>
        </div>
      )}

      {!hasKey && !running && (
        <div
          style={{
            padding: '10px 12px', borderRadius: 'var(--radius)',
            background: 'var(--bg-tertiary)', fontSize: '0.7rem',
            color: 'var(--warning)', border: '1px solid var(--warning)',
          }}
        >
          API ключ не настроен. Перейдите в{' '}
          <span
            onClick={onOpenSettings}
            style={{ cursor: 'pointer', textDecoration: 'underline', color: 'var(--accent)' }}
          >
            настройки AI
          </span>
          , чтобы указать провайдера и ключ.
        </div>
      )}

      {running && progress && (
        <div
          style={{
            padding: '8px 12px', borderRadius: 'var(--radius)',
            background: 'var(--bg-tertiary)', fontSize: '0.75rem',
            color: 'var(--text-secondary)',
            display: 'flex', alignItems: 'center', gap: 8,
          }}
        >
          <span className="ai-spinner" />
          {progress}
        </div>
      )}

      {sorted.length === 0 && !running && (
        <div
          style={{
            padding: '16px 12px', textAlign: 'center', fontSize: '0.75rem',
            color: 'var(--text-muted)', border: '1px dashed var(--border-color)',
            borderRadius: 'var(--radius)',
          }}
        >
          Нажмите «Анализировать» для запуска AI-диагностики лога
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {sorted.map((a) => (
          <AIVerdictCard
            key={a.id}
            analysis={a}
            onHighlightLines={onHighlightLines}
            onReAnalyze={handleReAnalyze}
          />
        ))}
      </div>
    </div>
  );
}
