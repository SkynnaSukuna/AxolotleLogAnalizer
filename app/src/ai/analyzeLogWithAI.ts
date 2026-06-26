import type { AIAnalysisResult, AIProvider, AIProviderConfig } from '../types';
import { SYSTEM_PROMPT } from './systemPrompt';
import { logger } from '../utils/logger';

const DEFAULT_TIMEOUT_MS = 120_000;
const MAX_RETRIES = 1;

function generateId(): string {
  return `ai_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function extractJson(raw: string): string {
  let cleaned = raw.trim();

  const jsonStart = cleaned.indexOf('{');
  const jsonEnd = cleaned.lastIndexOf('}');

  if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
    cleaned = cleaned.slice(jsonStart, jsonEnd + 1);
  }

  cleaned = cleaned
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  return cleaned;
}

function parseAnalysisResponse(
  raw: string,
  logContent: string,
  provider: AIProvider,
  model?: string,
): AIAnalysisResult {
  const cleaned = extractJson(raw);

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(
      `Не удалось распарсить ответ AI. Ответ: ${raw.slice(0, 500)}`,
    );
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Ответ AI не является объектом JSON');
  }

  const lines = logContent.split('\n');
  const validLines = (parsed.highlightedLines as number[] ?? [])
    .filter(
      (n: number) => Number.isInteger(n) && n >= 1 && n <= lines.length,
    )
    .slice(0, 10);

  const urgency = ['Critical', 'High', 'Medium', 'Low'].includes(
    parsed.urgency as string,
  )
    ? (parsed.urgency as AIAnalysisResult['urgency'])
    : 'Low';

  return {
    id: generateId(),
    logId: '',
    timestamp: new Date(),
    verdict: (parsed.verdict as string) ?? 'Не удалось определить',
    rootCause: (parsed.rootCause as string) ?? 'Не указана',
    confidence:
      typeof parsed.confidence === 'number'
        ? Math.max(0, Math.min(100, parsed.confidence))
        : 0,
    urgency,
    needsMoreLogs: Array.isArray(parsed.needsMoreLogs)
      ? (parsed.needsMoreLogs as string[])
      : [],
    suggestedFix: (parsed.suggestedFix as string) ?? 'Не указано',
    highlightedLines: validLines,
    explanation: (parsed.explanation as string) ?? '',
    similarIssues: Array.isArray(parsed.similarIssues)
      ? (parsed.similarIssues as string[])
      : [],
    provider,
    model,
  };
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit & { timeout?: number },
): Promise<Response> {
  const timeout = options.timeout ?? DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort();
    logger.warn(`Request timeout after ${timeout}ms: ${url}`);
  }, timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timer);
  }
}

const PROVIDER_MODELS: Record<string, string[]> = {
  openai: [
    'gpt-4o',
    'gpt-4o-mini',
    'gpt-4-turbo',
    'gpt-4',
    'gpt-3.5-turbo',
  ],
  anthropic: [
    'claude-sonnet-4-20250514',
    'claude-3-5-sonnet-20241022',
    'claude-3-opus-20240229',
    'claude-3-haiku-20240307',
  ],
  grok: ['grok-2-1212', 'grok-beta'],
  ollama: [
    'llama3',
    'llama3.1',
    'mistral',
    'codellama',
    'mixtral',
    'qwen2.5',
  ],
};

export function getModelsForProvider(provider: AIProvider): string[] {
  return PROVIDER_MODELS[provider] ?? [];
}

export function getDefaultModel(provider: AIProvider): string {
  return PROVIDER_MODELS[provider]?.[0] ?? '';
}

export function getDefaultBaseUrl(provider: AIProvider): string {
  switch (provider) {
    case 'openai':
      return 'https://api.openai.com/v1';
    case 'anthropic':
      return 'https://api.anthropic.com/v1';
    case 'grok':
      return 'https://api.x.ai/v1';
    case 'ollama':
      return 'http://localhost:11434';
    default:
      return '';
  }
}

function buildHeaders(
  config: AIProviderConfig,
  extra: Record<string, string> = {},
): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    ...(config.customHeaders ?? {}),
    ...extra,
  };
}

async function callOpenAI(
  config: AIProviderConfig,
  payload: string,
): Promise<string> {
  const baseUrl = (config.baseUrl || getDefaultBaseUrl('openai')).replace(
    /\/+$/,
    '',
  );
  const response = await fetchWithTimeout(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: buildHeaders(config, {
      Authorization: `Bearer ${config.apiKey}`,
    }),
    body: JSON.stringify({
      model: config.model || 'gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: payload },
      ],
      temperature: config.temperature ?? 0.3,
      max_tokens: config.maxTokens ?? 2000,
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(
      `OpenAI API error ${response.status}: ${text || response.statusText}`,
    );
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? '';
}

async function callAnthropic(
  config: AIProviderConfig,
  payload: string,
): Promise<string> {
  const baseUrl = (config.baseUrl || getDefaultBaseUrl('anthropic')).replace(
    /\/+$/,
    '',
  );
  const response = await fetchWithTimeout(`${baseUrl}/messages`, {
    method: 'POST',
    headers: buildHeaders(config, {
      'x-api-key': config.apiKey ?? '',
      'anthropic-version': '2023-06-01',
    }),
    body: JSON.stringify({
      model: config.model || 'claude-sonnet-4-20250514',
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: payload }],
      temperature: config.temperature ?? 0.3,
      max_tokens: config.maxTokens ?? 2000,
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(
      `Anthropic API error ${response.status}: ${text || response.statusText}`,
    );
  }

  const data = await response.json();
  return data.content?.[0]?.text ?? '';
}

async function callOllama(
  config: AIProviderConfig,
  payload: string,
): Promise<string> {
  const baseUrl = (config.baseUrl || getDefaultBaseUrl('ollama')).replace(
    /\/+$/,
    '',
  );
  const response = await fetchWithTimeout(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: buildHeaders(config),
    body: JSON.stringify({
      model: config.model || 'llama3',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: payload },
      ],
      stream: false,
      options: {
        temperature: config.temperature ?? 0.3,
        num_predict: config.maxTokens ?? 2000,
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(
      `Ollama API error ${response.status}: ${text || response.statusText}`,
    );
  }

  const data = await response.json();
  return data.message?.content ?? '';
}

async function callGrok(
  config: AIProviderConfig,
  payload: string,
): Promise<string> {
  const baseUrl = (config.baseUrl || getDefaultBaseUrl('grok')).replace(
    /\/+$/,
    '',
  );
  const response = await fetchWithTimeout(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: buildHeaders(config, {
      Authorization: `Bearer ${config.apiKey}`,
    }),
    body: JSON.stringify({
      model: config.model || 'grok-2-1212',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: payload },
      ],
      temperature: config.temperature ?? 0.3,
      max_tokens: config.maxTokens ?? 2000,
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(
      `Grok API error ${response.status}: ${text || response.statusText}`,
    );
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? '';
}

async function callCustom(
  config: AIProviderConfig,
  payload: string,
): Promise<string> {
  const baseUrl = (config.baseUrl || '').replace(/\/+$/, '');
  if (!baseUrl) throw new Error('Custom provider requires a Base URL');

  const extra: Record<string, string> = {};
  if (config.apiKey) extra.Authorization = `Bearer ${config.apiKey}`;
  const response = await fetchWithTimeout(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: buildHeaders(config, extra),
    body: JSON.stringify({
      model: config.model || 'default',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: payload },
      ],
      temperature: config.temperature ?? 0.3,
      max_tokens: config.maxTokens ?? 2000,
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(
      `Custom API error ${response.status}: ${text || response.statusText}`,
    );
  }

  const data = await response.json();
  return (
    data.choices?.[0]?.message?.content ??
    data.content?.[0]?.text ??
    ''
  );
}

export async function testConnection(
  config: AIProviderConfig,
): Promise<{ ok: boolean; message: string }> {
  try {
    const callers: Record<
      string,
      (c: AIProviderConfig, p: string) => Promise<string>
    > = {
      openai: callOpenAI,
      anthropic: callAnthropic,
      ollama: callOllama,
      grok: callGrok,
      custom: callCustom,
    };
    const caller = callers[config.provider];
    if (!caller)
      throw new Error(`Unknown provider: ${config.provider}`);

    const testPayload =
      'Respond with ONLY the word "ok" if you can read this.';
    const raw = await caller(config, testPayload);
    const ok = raw.trim().toLowerCase().includes('ok');
    logger.info(
      `AI connection test: ${ok ? 'OK' : 'FAILED'} (${config.provider})`,
    );
    return {
      ok,
      message: ok ? 'Соединение успешно' : 'Неожиданный ответ',
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Неизвестная ошибка';
    logger.error(`AI connection test failed: ${message}`);
    return { ok: false, message };
  }
}

const providerCallers: Record<
  AIProvider,
  (config: AIProviderConfig, payload: string) => Promise<string>
> = {
  openai: callOpenAI,
  anthropic: callAnthropic,
  ollama: callOllama,
  grok: callGrok,
  custom: callCustom,
};

const CRITICAL_PATTERNS = [
  /FATAL|CRITICAL|EMERGENCY/i,
  /OutOfMemoryError|OOM|heap\sspace|GC\soverhead|Metaspace/i,
  /NullPointerException|NullPointer/i,
  /StackOverflow|StackOverflowError/i,
  /Exception\sin\sthread/i,
  /panic|SIGSEGV|SIGTERM|SIGKILL|SEGV/i,
  /corruption|corrupted/i,
  /crash\sreport|CrashReport/i,
  /Caused\sby/i,
  /\.\w+Exception/i,
  /ERROR.*\d{4}-\d{2}-\d{2}/i,
  /deadlock|Deadlock/i,
  /exploit|Exploit/i,
];

function isCriticalLine(line: string): boolean {
  return CRITICAL_PATTERNS.some((p) => p.test(line));
}

export interface AnalyzeLogOptions {
  logContent: string;
  logId?: string;
  fileName?: string;
  previousAnalyses?: AIAnalysisResult[];
  config: AIProviderConfig;
  onProgress?: (stage: string) => void;
}

async function callAIWithRetry(
  config: AIProviderConfig,
  payload: string,
  attempt: number,
): Promise<string> {
  const caller = providerCallers[config.provider];
  if (!caller) {
    throw new Error(`Неподдерживаемый провайдер: ${config.provider}`);
  }

  try {
    return await caller(config, payload);
  } catch (err) {
    if (attempt < MAX_RETRIES) {
      logger.warn(
        `AI call failed (attempt ${attempt + 1}), retrying...`,
        err instanceof Error ? err.message : err,
      );
      return callAIWithRetry(config, payload, attempt + 1);
    }
    throw err;
  }
}

export async function analyzeLogWithAI(
  options: AnalyzeLogOptions,
): Promise<AIAnalysisResult> {
  const {
    logContent,
    logId,
    fileName,
    previousAnalyses,
    config,
    onProgress,
  } = options;

  logger.info(
    `Starting AI analysis: file=${fileName ?? 'unknown'}, provider=${config.provider}, model=${config.model ?? 'default'}`,
  );

  onProgress?.('Подготовка данных...');

  const lines = logContent.split('\n');
  const totalLines = lines.length;

  const criticalBlocks: string[] = [];
  let currentBlock: string[] = [];
  for (let i = 0; i < Math.min(totalLines, 10_000); i++) {
    const line = lines[i];
    if (isCriticalLine(line)) {
      if (currentBlock.length > 0)
        criticalBlocks.push(currentBlock.join('\n'));
      currentBlock = [line];
    } else if (currentBlock.length > 0) {
      currentBlock.push(line);
      if (currentBlock.length >= 30) {
        criticalBlocks.push(currentBlock.join('\n'));
        currentBlock = [];
      }
    }
  }
  if (currentBlock.length > 0)
    criticalBlocks.push(currentBlock.join('\n'));

  const truncatedLog =
    lines.length > 3000
      ? lines.slice(0, 3000).join('\n') +
        '\n... [TRUNCATED ' +
        (totalLines - 3000) +
        ' more lines]'
      : logContent;

  const prevCtx = previousAnalyses?.length
    ? `\n\n## Previous analyses:\n${previousAnalyses
        .map(
          (a, i) =>
            `[${i + 1}] ${a.verdict} (urgency: ${a.urgency}, confidence: ${a.confidence}%)`,
        )
        .join('\n')}`
    : '';

  const criticalCtx = criticalBlocks.length
    ? `\n\n## Pre-extracted critical blocks:\n${criticalBlocks
        .map(
          (b, i) =>
            `--- Block ${i + 1} (${b.split('\n')[0].slice(0, 120)}) ---\n${b}`,
        )
        .join('\n\n')}`
    : '';

  const payload = [
    `## File: ${fileName ?? 'unknown.log'}`,
    `## Total lines: ${totalLines}`,
    prevCtx,
    criticalCtx,
    `\n## Log content:\n\`\`\`\n${truncatedLog}\n\`\`\``,
  ]
    .filter(Boolean)
    .join('\n');

  onProgress?.('Отправка запроса к ИИ...');

  try {
    const raw = await callAIWithRetry(config, payload, 0);

    onProgress?.('Обработка ответа...');
    const result = parseAnalysisResponse(
      raw,
      logContent,
      config.provider,
      config.model,
    );
    if (logId) result.logId = logId;

    logger.info(
      `AI analysis complete: verdict="${result.verdict.slice(0, 80)}", urgency=${result.urgency}, confidence=${result.confidence}%`,
    );
    return result;
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Неизвестная ошибка';
    logger.error(`AI analysis failed: ${message}`);

    return {
      id: generateId(),
      logId: logId ?? '',
      timestamp: new Date(),
      verdict: `Ошибка анализа: ${message}`,
      rootCause: 'Ошибка при вызове AI API',
      confidence: 0,
      urgency: 'Low',
      needsMoreLogs: [],
      suggestedFix:
        'Проверьте подключение к API провайдера и правильность API ключа',
      highlightedLines: [],
      explanation: '',
      similarIssues: [],
      provider: config.provider,
      model: config.model,
      error: message,
    };
  }
}
