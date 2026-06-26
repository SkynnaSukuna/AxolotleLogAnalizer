import { db } from './schema';
import { getDefaultModel, getDefaultBaseUrl } from '../ai/analyzeLogWithAI';
import type { AIConfig, AIProvider, AIProviderConfig } from '../types';

export const DEFAULT_CONFIGS: Omit<AIConfig, 'id' | 'createdAt'>[] = [
  {
    name: 'OpenAI (GPT-4o)',
    provider: 'openai',
    apiKey: '',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o',
    temperature: 0.3,
    maxTokens: 2000,
  },
  {
    name: 'Anthropic (Claude)',
    provider: 'anthropic',
    apiKey: '',
    baseUrl: 'https://api.anthropic.com/v1',
    model: 'claude-sonnet-4-20250514',
    temperature: 0.3,
    maxTokens: 2000,
  },
  {
    name: 'Ollama (локальный)',
    provider: 'ollama',
    apiKey: '',
    baseUrl: 'http://localhost:11434',
    model: 'llama3',
    temperature: 0.3,
    maxTokens: 2000,
  },
  {
    name: 'Grok (xAI)',
    provider: 'grok',
    apiKey: '',
    baseUrl: 'https://api.x.ai/v1',
    model: 'grok-2-1212',
    temperature: 0.3,
    maxTokens: 2000,
  },
  {
    name: 'Custom',
    provider: 'custom',
    apiKey: '',
    baseUrl: '',
    model: '',
    temperature: 0.3,
    maxTokens: 2000,
  },
];

export async function getActiveConfig(): Promise<AIConfig | undefined> {
  const all = await db.aiConfigs
    .orderBy('lastUsedAt')
    .reverse()
    .toArray();
  return all[0];
}

export async function getAllConfigs(): Promise<AIConfig[]> {
  return db.aiConfigs.orderBy('name').toArray();
}

export async function saveConfig(config: {
  id?: number;
  name: string;
  provider: AIProvider;
  apiKey: string;
  baseUrl: string;
  model: string;
  temperature: number;
  maxTokens: number;
  customHeaders?: Record<string, string>;
}): Promise<number | undefined> {
  if (config.id) {
    await db.aiConfigs.update(config.id, {
      ...config,
      lastUsedAt: new Date(),
    });
    return config.id;
  }
  return db.aiConfigs.add({
    ...config,
    lastUsedAt: new Date(),
    createdAt: new Date(),
  } as AIConfig);
}

export async function deleteConfig(id: number | undefined): Promise<void> {
  if (!id) return;
  await db.aiConfigs.delete(id);
}

export async function setActiveConfig(id: number | undefined): Promise<void> {
  if (!id) return;
  await db.aiConfigs.update(id, { lastUsedAt: new Date() });
}

export async function resetToDefaults(): Promise<(number | undefined)[]> {
  await db.aiConfigs.clear();
  const ids: (number | undefined)[] = [];
  for (const cfg of DEFAULT_CONFIGS) {
    const id = await db.aiConfigs.add({
      ...cfg,
      lastUsedAt: new Date(),
      createdAt: new Date(),
    } as AIConfig);
    ids.push(id);
  }
  return ids;
}

export function toProviderConfig(cfg: AIConfig | undefined): AIProviderConfig {
  if (!cfg) {
    return { provider: 'openai' as AIProvider, apiKey: '', model: 'gpt-4o' };
  }
  return {
    provider: cfg.provider,
    apiKey: cfg.apiKey,
    baseUrl: cfg.baseUrl || undefined,
    model: cfg.model || undefined,
    temperature: cfg.temperature,
    maxTokens: cfg.maxTokens,
    customHeaders: cfg.customHeaders,
  };
}

export function getDefaultConfigForProvider(provider: AIProvider): {
  name: string;
  baseUrl: string;
  model: string;
} {
  return {
    name: DEFAULT_CONFIGS.find((c) => c.provider === provider)?.name ?? provider,
    baseUrl: getDefaultBaseUrl(provider),
    model: getDefaultModel(provider),
  };
}
