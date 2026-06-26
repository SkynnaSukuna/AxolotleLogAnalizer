import { useState, useEffect } from 'react';
import { open } from '@tauri-apps/plugin-shell';

const STEPS = [
  {
    title: 'Добро пожаловать в AxolotleLogAnalyzer!',
    text: 'Это приложение поможет вам анализировать логи, находить ошибки и сохранять решения.\n\nСделано Skynna',
    icon: '🚀',
  },
  {
    title: 'Шаг 1: Выберите проект',
    text: 'Слева находится панель проектов. Нажмите на проект, чтобы открыть его логи.',
    icon: '📁',
    hint: 'Уже есть демо-проекты — просто кликните!',
  },
  {
    title: 'Шаг 2: Загрузите логи',
    text: 'Нажмите кнопку «+ Загрузить» или просто перетащите файлы логов мышкой.',
    icon: '📄',
    hint: 'Поддерживаются файлы .log, .txt, .json',
  },
  {
    title: 'Шаг 3: Анализируйте',
    text: 'Кликайте на ошибки, создавайте заметки, ищите похожие случаи. Всё сохраняется автоматически!',
    icon: '🔍',
  },
];

export function FirstUseOverlay({ onDismiss }: { onDismiss: () => void }) {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const key = 'loganalyzer_first_use';
    const shown = localStorage.getItem(key);
    if (shown) {
      onDismiss();
      return;
    }
    localStorage.setItem(key, 'true');
  }, [onDismiss]);

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      setVisible(false);
      onDismiss();
    }
  };

  if (!visible) return null;

  const s = STEPS[step];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)',
      }}
    >
      <div
        style={{
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: 12,
          padding: '32px 40px',
          maxWidth: 460,
          width: '90%',
          textAlign: 'center',
          boxShadow: '0 16px 48px rgba(0,0,0,0.3)',
        }}
      >
        <div style={{ fontSize: '3rem', marginBottom: 16 }}>{s.icon}</div>
        <h2
          style={{
            fontSize: '1.25rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: 8,
          }}
        >
          {s.title}
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 12 }}>
          {s.text}
        </p>
        {'hint' in s && s.hint && (
          <p
            style={{
              fontSize: '0.8rem',
              color: 'var(--accent)',
              background: 'var(--bg-tertiary)',
              padding: '6px 12px',
              borderRadius: 6,
              marginBottom: 16,
              display: 'inline-block',
            }}
          >
            💡 {s.hint}
          </p>
        )}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 6,
            marginBottom: 20,
          }}
        >
          {STEPS.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === step ? 20 : 8,
                height: 8,
                borderRadius: 4,
                background: i === step ? 'var(--accent)' : 'var(--border-color)',
                transition: 'all 200ms ease',
              }}
            />
          ))}
        </div>
        {step === 0 && (
          <div style={{ marginBottom: 16 }}>
            <span
              onClick={() => open('https://t.me/tut_obitaet_skynna')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 18px',
                borderRadius: 8,
                background: 'var(--accent)',
                color: '#fff',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                userSelect: 'none',
              }}
            >
              ✈️ Подпишись на @tut_obitaet_skynna
            </span>
            <div
              style={{
                fontSize: '0.7rem',
                color: 'var(--text-muted)',
                marginTop: 4,
              }}
            >
              там обновления и дев приколы
            </div>
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          <button
            className="btn btn-md"
            onClick={() => {
              setVisible(false);
              onDismiss();
            }}
          >
            Пропустить
          </button>
          <button className="btn btn-md btn-primary" onClick={handleNext}>
            {step < STEPS.length - 1 ? 'Далее →' : 'Начать работу!'}
          </button>
        </div>
      </div>
    </div>
  );
}
