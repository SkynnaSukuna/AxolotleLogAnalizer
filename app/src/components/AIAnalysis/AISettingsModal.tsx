import { useState, useEffect, useCallback, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import type { AIProvider, AIConfig } from '../../types';
import { testConnection, getModelsForProvider, getDefaultModel, getDefaultBaseUrl } from '../../ai';
import { db } from '../../db/schema';
import { getAllConfigs, saveConfig, deleteConfig, setActiveConfig, resetToDefaults, getDefaultConfigForProvider } from '../../db/aiConfigs';

const providerOptions: { value: AIProvider; label: string; icon: string }[] = [
  { value: 'openai', label: 'OpenAI', icon: '🤖' },
  { value: 'anthropic', label: 'Anthropic', icon: '🧠' },
  { value: 'grok', label: 'Grok', icon: '⚡' },
  { value: 'ollama', label: 'Ollama', icon: '🖥' },
  { value: 'custom', label: 'Custom', icon: '🔧' },
];

interface AISettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export function AISettingsModal({ open, onClose }: AISettingsModalProps) {
  const configs = useLiveQuery(() => getAllConfigs(), []);
  const activeConfig = configs?.find((c) => c.id && c.lastUsedAt) ?? configs?.[0];

  const [selectedId, setSelectedId] = useState<number | undefined>();
  const [name, setName] = useState('');
  const [provider, setProvider] = useState<AIProvider>('openai');
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [baseUrl, setBaseUrl] = useState('');
  const [model, setModel] = useState('');
  const [temperature, setTemperature] = useState(0.3);
  const [maxTokens, setMaxTokens] = useState(2000);
  const [customHeaders, setCustomHeaders] = useState<Record<string, string>>({});
  const [headerKeyInput, setHeaderKeyInput] = useState('');
  const [headerValInput, setHeaderValInput] = useState('');

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const models = getModelsForProvider(provider);

  /* ── load selected config ── */
  useEffect(() => {
    if (!open) return;
    if (!configs || configs.length === 0) return;

    const target = configs.find((c) => c.id === selectedId) ?? activeConfig;
    if (!target) return;

    setSelectedId((target as any).id);
    setName(target.name);
    setProvider(target.provider);
    setApiKey(target.apiKey);
    setBaseUrl(target.baseUrl);
    setModel(target.model);
    setTemperature(target.temperature);
    setMaxTokens(target.maxTokens);
    setCustomHeaders(target.customHeaders ?? {});
    setTestResult(null);
    setDirty(false);
  }, [open, configs, selectedId]);

  const resetForm = useCallback((cfg?: AIConfig) => {
    if (cfg) {
      setSelectedId((cfg as any).id);
      setName(cfg.name);
      setProvider(cfg.provider);
      setApiKey(cfg.apiKey);
      setBaseUrl(cfg.baseUrl);
      setModel(cfg.model);
      setTemperature(cfg.temperature);
      setMaxTokens(cfg.maxTokens);
      setCustomHeaders(cfg.customHeaders ?? {});
    }
    setDirty(false);
    setTestResult(null);
  }, []);

  const handleProviderChange = useCallback((p: AIProvider) => {
    setProvider(p);
    const def = getDefaultConfigForProvider(p);
    setName(def.name);
    setBaseUrl(def.baseUrl);
    setModel(def.model);
    setCustomHeaders({});
    setDirty(true);
  }, []);

  const handleAddHeader = useCallback(() => {
    if (!headerKeyInput.trim()) return;
    setCustomHeaders((prev) => ({ ...prev, [headerKeyInput.trim()]: headerValInput.trim() }));
    setHeaderKeyInput('');
    setHeaderValInput('');
    setDirty(true);
  }, [headerKeyInput, headerValInput]);

  const handleRemoveHeader = useCallback((key: string) => {
    setCustomHeaders((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setDirty(true);
  }, []);

  const handleTest = useCallback(async () => {
    setTesting(true);
    setTestResult(null);
    const result = await testConnection({
      provider,
      apiKey,
      baseUrl,
      model,
      temperature,
      maxTokens,
      customHeaders,
    });
    setTestResult(result);
    setTesting(false);
  }, [provider, apiKey, baseUrl, model, temperature, maxTokens, customHeaders]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const id = await saveConfig({
        id: selectedId === 0 ? undefined : selectedId,
        name,
        provider,
        apiKey,
        baseUrl,
        model,
        temperature,
        maxTokens,
        customHeaders: Object.keys(customHeaders).length > 0 ? customHeaders : undefined,
      });
      setSelectedId(id);
      await setActiveConfig(id);
      setDirty(false);
    } finally {
      setSaving(false);
    }
  }, [selectedId, name, provider, apiKey, baseUrl, model, temperature, maxTokens, customHeaders]);

  const handleDelete = useCallback(async () => {
    if (!selectedId || selectedId === 0 || !configs) return;
    if (configs.length <= 1) return;
    await deleteConfig(selectedId);
    const remaining = configs.filter((c) => (c as any).id !== selectedId);
    if (remaining.length > 0) resetForm(remaining[0]);
  }, [selectedId, configs, resetForm]);

  const handleResetDefaults = useCallback(async () => {
    const ids = await resetToDefaults();
    const first = await db.aiConfigs.get(ids[0]);
    if (first) resetForm(first);
  }, [resetForm]);

  const handleNewConfig = useCallback(() => {
    setSelectedId(0);
    setName('Новая конфигурация');
    setProvider('openai');
    setApiKey('');
    setBaseUrl(getDefaultBaseUrl('openai'));
    setModel(getDefaultModel('openai'));
    setTemperature(0.3);
    setMaxTokens(2000);
    setCustomHeaders({});
    setDirty(true);
    setTestResult(null);
  }, []);

  if (!open) return null;

  const showKeyField = provider !== 'ollama';
  const headerEntries = Object.entries(customHeaders);

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.5)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius)',
          width: 560, maxWidth: '92vw',
          maxHeight: '88vh', overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 18px', borderBottom: '1px solid var(--border-color)',
            flexShrink: 0,
          }}
        >
          <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>
            ⚙ Настройки AI анализа
          </span>
          <button onClick={onClose} className="modal-close-btn">✕</button>
        </div>

        {/* Body (scrollable) */}
        <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto', flex: 1 }}>
          {/* Config selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="input-group" style={{ flex: 1 }}>
              <label className="input-label">Конфигурация</label>
              <select
                value={selectedId ?? ''}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '__new__') {
                    handleNewConfig();
                  } else {
                    const cfg = configs?.find((c) => (c as any).id === parseInt(val));
                    if (cfg) resetForm(cfg);
                  }
                }}
                className="input"
                style={{ cursor: 'pointer' }}
              >
                {configs?.map((c) => (
                  <option key={(c as any).id} value={(c as any).id}>
                    {c.name} ({c.provider}) {(c as any).id === (activeConfig as any)?.id ? '✓' : ''}
                  </option>
                ))}
                <option disabled>──────────</option>
                <option value="__new__">+ Новая конфигурация</option>
              </select>
            </div>
            {configs && configs.length > 1 && selectedId && selectedId !== 0 && (
              <button
                onClick={handleDelete}
                className="btn btn-sm btn-danger"
                title="Удалить конфигурацию"
                style={{ marginTop: 18, flexShrink: 0 }}
              >
                🗑
              </button>
            )}
          </div>

          {/* Name */}
          <div className="input-group">
            <label className="input-label">Название</label>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setDirty(true); }}
              className="input"
              placeholder="Например: Домашний Ollama, Production OpenAI"
            />
          </div>

          {/* Provider */}
          <div className="input-group">
            <label className="input-label">Провайдер</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4 }}>
              {providerOptions.map((o) => (
                <button
                  key={o.value}
                  onClick={() => handleProviderChange(o.value)}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                    padding: '6px 4px',
                    border: `1px solid ${provider === o.value ? 'var(--accent)' : 'var(--border-color)'}`,
                    borderRadius: 'var(--radius)',
                    background: provider === o.value ? 'var(--bg-active)' : 'var(--bg-tertiary)',
                    cursor: 'pointer', transition: 'all var(--transition)',
                    color: provider === o.value ? 'var(--accent)' : 'var(--text-secondary)',
                    fontSize: '0.65rem',
                  }}
                >
                  <span style={{ fontSize: '1.1rem' }}>{o.icon}</span>
                  <span>{o.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* API Key */}
          {showKeyField && (
            <div className="input-group">
              <label className="input-label">API Key</label>
              <div style={{ display: 'flex', gap: 4 }}>
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => { setApiKey(e.target.value); setDirty(true); }}
                  className="input"
                  placeholder={`${provider} API ключ`}
                  style={{ fontFamily: showKey ? 'var(--font-mono)' : 'inherit' }}
                />
                <button
                  onClick={() => setShowKey(!showKey)}
                  className="btn btn-sm"
                  style={{ flexShrink: 0, width: 36 }}
                  title={showKey ? 'Скрыть ключ' : 'Показать ключ'}
                >
                  {showKey ? '🙈' : '👁'}
                </button>
              </div>
            </div>
          )}

          {/* Base URL */}
          <div className="input-group">
            <label className="input-label">Base URL</label>
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => { setBaseUrl(e.target.value); setDirty(true); }}
              className="input"
              placeholder={getDefaultBaseUrl(provider) || 'https://your-api.example.com/v1'}
            />
          </div>

          {/* Model */}
          <div className="input-group">
            <label className="input-label">Модель</label>
            {models.length > 0 ? (
              <select
                value={model}
                onChange={(e) => { setModel(e.target.value); setDirty(true); }}
                className="input"
                style={{ cursor: 'pointer' }}
              >
                {models.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={model}
                onChange={(e) => { setModel(e.target.value); setDirty(true); }}
                className="input"
                placeholder="Название модели"
              />
            )}
          </div>

          {/* Temperature + Max Tokens */}
          <div style={{ display: 'flex', gap: 16 }}>
            <div className="input-group" style={{ flex: 1 }}>
              <label className="input-label">
                Temperature: <strong>{temperature.toFixed(2)}</strong>
              </label>
              <input
                type="range" min="0" max="1" step="0.05"
                value={temperature}
                onChange={(e) => { setTemperature(parseFloat(e.target.value)); setDirty(true); }}
                style={{ width: '100%', accentColor: 'var(--accent)' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                <span>Точный (0)</span>
                <span>Креативный (1)</span>
              </div>
            </div>
            <div className="input-group" style={{ flex: 1 }}>
              <label className="input-label">
                Max Tokens: <strong>{maxTokens}</strong>
              </label>
              <input
                type="range" min="256" max="8192" step="256"
                value={maxTokens}
                onChange={(e) => { setMaxTokens(parseInt(e.target.value)); setDirty(true); }}
                style={{ width: '100%', accentColor: 'var(--accent)' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                <span>256</span>
                <span>8192</span>
              </div>
            </div>
          </div>

          {/* Custom Headers */}
          <div className="input-group">
            <label className="input-label">
              Дополнительные заголовки (опционально)
            </label>
            {headerEntries.map(([k, v]) => (
              <div key={k} style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                <input
                  type="text"
                  value={k}
                  readOnly
                  className="input"
                  style={{ flex: 1, fontSize: '0.7rem', fontFamily: 'var(--font-mono)' }}
                />
                <input
                  type="text"
                  value={v}
                  readOnly
                  className="input"
                  style={{ flex: 1, fontSize: '0.7rem', fontFamily: 'var(--font-mono)' }}
                />
                <button className="btn btn-sm btn-danger" onClick={() => handleRemoveHeader(k)}>×</button>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 4 }}>
              <input
                type="text"
                value={headerKeyInput}
                onChange={(e) => setHeaderKeyInput(e.target.value)}
                className="input"
                placeholder="Заголовок"
                style={{ flex: 1, fontSize: '0.7rem' }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddHeader(); }}
              />
              <input
                type="text"
                value={headerValInput}
                onChange={(e) => setHeaderValInput(e.target.value)}
                className="input"
                placeholder="Значение"
                style={{ flex: 1, fontSize: '0.7rem' }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddHeader(); }}
              />
              <button className="btn btn-sm" onClick={handleAddHeader}>+</button>
            </div>
          </div>

          {/* Test */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <button
              onClick={handleTest}
              disabled={testing}
              className="btn btn-sm"
              style={{
                background: testing ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
                borderColor: testing ? 'var(--border-color)' : 'var(--accent)',
                color: testing ? 'var(--text-muted)' : 'var(--accent)',
                cursor: testing ? 'not-allowed' : 'pointer',
              }}
            >
              {testing ? '🔄 Тестируем...' : '🔌 Протестировать соединение'}
            </button>
            {testResult && (
              <span
                style={{
                  fontSize: '0.75rem',
                  color: testResult.ok ? 'var(--success)' : 'var(--danger)',
                  wordBreak: 'break-word',
                }}
              >
                {testResult.ok ? '✓ Соединение успешно' : `✗ ${testResult.message}`}
              </span>
            )}
          </div>

          {/* Reset */}
          <div style={{ marginTop: 4 }}>
            <button
              onClick={handleResetDefaults}
              className="btn btn-sm"
              style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}
            >
              ↺ Сбросить к настройкам по умолчанию
            </button>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex', justifyContent: 'flex-end', gap: 8,
            padding: '12px 18px', borderTop: '1px solid var(--border-color)',
            flexShrink: 0,
          }}
        >
          <button onClick={onClose} className="btn btn-sm">
            Отмена
          </button>
          <button
            onClick={handleSave}
            disabled={saving || (!dirty && selectedId !== 0)}
            className="btn btn-sm btn-primary"
            style={{
              cursor: (saving || (!dirty && selectedId !== 0)) ? 'not-allowed' : 'pointer',
              opacity: (saving || (!dirty && selectedId !== 0)) ? 0.6 : 1,
            }}
          >
            {saving ? '💾 Сохранение...' : '💾 Сохранить настройки'}
          </button>
        </div>
      </div>
    </div>
  );
}
