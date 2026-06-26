type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
}

const MAX_LOGS = 1000;
const FLUSH_INTERVAL = 8000;

const logs: LogEntry[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function toEntry(level: LogLevel, ...args: unknown[]): LogEntry {
  const message = args
    .map((a) => (typeof a === 'string' ? a : JSON.stringify(a, null, 0)))
    .join(' ');
  return {
    timestamp: new Date().toISOString(),
    level: level.toUpperCase().padEnd(5),
    message,
  };
}

function addEntry(level: LogLevel, ...args: unknown[]) {
  const entry = toEntry(level, ...args);
  logs.push(entry);
  if (logs.length > MAX_LOGS) logs.shift();

  const prefix = `[${entry.timestamp}] [${entry.level}]`;
  switch (level) {
    case 'error':
      console.error(prefix, ...args);
      break;
    case 'warn':
      console.warn(prefix, ...args);
      break;
    default:
      console.log(prefix, ...args);
      break;
  }

  scheduleFlush();
}

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(async () => {
    flushTimer = null;
    await flushToDisk();
  }, FLUSH_INTERVAL);
}

let flushing = false;

async function flushToDisk() {
  if (flushing || logs.length === 0) return;
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    flushing = true;
    await invoke('append_logs', { entries: [...logs] }).catch(() => {});
  } catch {
    // not in Tauri — skip
  } finally {
    flushing = false;
  }
}

function formatAll(): string {
  const header = [
    'AxolotleLogAnalyzer Logs',
    `Generated: ${new Date().toISOString()}`,
    `Entries: ${logs.length}`,
    '='.repeat(60),
    '',
  ].join('\n');

  const body = logs
    .map((e) => `[${e.timestamp}] [${e.level}] ${e.message}`)
    .join('\n');

  return header + '\n' + body;
}

export const logger = {
  debug: (...args: unknown[]) => addEntry('debug', ...args),
  info: (...args: unknown[]) => addEntry('info', ...args),
  warn: (...args: unknown[]) => addEntry('warn', ...args),
  error: (...args: unknown[]) => addEntry('error', ...args),

  getAll: (): LogEntry[] => [...logs],

  download: () => {
    const blob = new Blob([formatAll()], {
      type: 'text/plain;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
};
