import { useState } from 'react';
import type { AIAnalysisResult, AIAnalysisUrgency } from '../../types';

interface AIVerdictCardProps {
  analysis: AIAnalysisResult;
  onHighlightLines?: (lines: number[]) => void;
  onReAnalyze?: (analysis: AIAnalysisResult) => void;
}

const urgencyColors: Record<AIAnalysisUrgency, { bg: string; border: string; text: string; label: string }> = {
  Critical: { bg: 'rgba(239,68,68,0.12)', border: '#ef4444', text: '#ef4444', label: 'Критично' },
  High: { bg: 'rgba(245,158,11,0.12)', border: '#f59e0b', text: '#f59e0b', label: 'Высокая' },
  Medium: { bg: 'rgba(59,130,246,0.12)', border: '#3b82f6', text: '#3b82f6', label: 'Средняя' },
  Low: { bg: 'rgba(34,197,94,0.12)', border: '#22c55e', text: '#22c55e', label: 'Низкая' },
};

const providerLabels: Record<string, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  grok: 'Grok',
  ollama: 'Ollama',
  custom: 'Custom',
};

function confidenceColor(score: number): string {
  if (score >= 80) return 'var(--success)';
  if (score >= 50) return 'var(--warning)';
  return 'var(--danger)';
}

const SHARED_BTN: Record<string, string | number> = {
  fontSize: '0.7rem',
  padding: '3px 8px',
  borderRadius: 'var(--radius)',
  border: '1px solid var(--border-color)',
  background: 'var(--bg-tertiary)',
  color: 'var(--text-primary)',
  cursor: 'pointer',
  fontWeight: 500,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
};

export function AIVerdictCard({ analysis, onHighlightLines, onReAnalyze }: AIVerdictCardProps) {
  const [showReasoning, setShowReasoning] = useState(false);
  const colors = urgencyColors[analysis.urgency];

  return (
    <div
      style={{
        border: `1px solid ${colors.border}`,
        borderRadius: 'var(--radius)',
        background: colors.bg,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          borderBottom: `1px solid ${colors.border}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <span
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '2px 8px', borderRadius: 10,
              fontSize: '0.7rem', fontWeight: 600,
              background: colors.border, color: '#fff',
              flexShrink: 0,
            }}
          >
            {colors.label}
          </span>

          <span
            style={{
              fontWeight: 600, fontSize: '0.8125rem', color: 'var(--text-primary)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}
            title={analysis.verdict}
          >
            {analysis.verdict}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            {providerLabels[analysis.provider] ?? analysis.provider}
            {analysis.model ? ` · ${analysis.model}` : ''}
          </span>
          <span
            style={{
              fontSize: '0.7rem', fontWeight: 600,
              color: confidenceColor(analysis.confidence),
              fontFamily: 'var(--font-mono)',
            }}
          >
            {analysis.confidence}%
          </span>
        </div>
      </div>

      <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {analysis.error && (
          <div style={{ fontSize: '0.75rem', color: 'var(--danger)' }}>
            {analysis.error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 12px', fontSize: '0.75rem' }}>
          <span style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Причина:</span>
          <span style={{ color: 'var(--text-primary)' }}>{analysis.rootCause}</span>

          {analysis.suggestedFix && analysis.suggestedFix !== 'Не указано' && (
            <>
              <span style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Решение:</span>
              <span style={{ color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>{analysis.suggestedFix}</span>
            </>
          )}
        </div>

        {analysis.similarIssues.length > 0 && (
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            Похожие проблемы: {analysis.similarIssues.join(' · ')}
          </div>
        )}

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 2 }}>
          {analysis.highlightedLines.length > 0 && (
            <button
              style={SHARED_BTN}
              onClick={() => {
                setShowReasoning(!showReasoning);
                onHighlightLines?.(analysis.highlightedLines);
              }}
            >
              {showReasoning ? 'Скрыть' : 'Почему ИИ так считает?'}
              {analysis.highlightedLines.length > 0 && (
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                  ({analysis.highlightedLines.length})
                </span>
              )}
            </button>
          )}

          <button style={SHARED_BTN} onClick={() => onReAnalyze?.(analysis)}>
            Повторить анализ
          </button>

          <span style={{ marginLeft: 'auto', fontSize: '0.65rem', color: 'var(--text-muted)', alignSelf: 'center' }}>
            {analysis.timestamp.toLocaleString('ru-RU')}
          </span>
        </div>

        {showReasoning && (
          <div
            style={{
              fontSize: '0.7rem', color: 'var(--text-secondary)',
              background: 'var(--bg-tertiary)', padding: '8px 10px',
              borderRadius: 'var(--radius)', lineHeight: 1.6,
            }}
          >
            {analysis.explanation ? (
              analysis.explanation
            ) : (
              <>
                Подсвечены строки:{' '}
                <span style={{ fontFamily: 'var(--font-mono)' }}>
                  {analysis.highlightedLines.join(', ')}
                </span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
