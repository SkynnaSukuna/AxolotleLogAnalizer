export type LogStatus = 'new' | 'in_progress' | 'resolved' | 'archived';

export type ThemeMode = 'light' | 'dark' | 'terminal' | 'ide';

export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  color?: string;
  icon?: string;
}

export interface LogEntry {
  id: string;
  projectId: string;
  fileName: string;
  originalFileName: string;
  content: string;
  size: number;
  createdAt: Date;
  updatedAt: Date;
  status: LogStatus;
  tags: string[];
  hash?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface ChatSession {
  id: string;
  logId: string;
  title: string;
  messages: ChatMessage[];
  aiAnalysis: AIAnalysisResult[];
  notes: string;
  createdAt: Date;
}

export interface Note {
  id: string;
  logId: string;
  projectId: string;
  stackTraceHash: string;
  fuzzyHash: string;
  errorSnippet: string;
  cause: string;
  solution: string;
  tags: string[];
  isGlobal: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PinnedError {
  id: string;
  logId: string;
  projectId: string;
  blockId: number;
  errorText: string;
  stackTraceHash: string;
  note: string;
  pinnedAt: Date;
}

export interface Bookmark {
  id: string;
  logId: string;
  projectId: string;
  lineNumber: number;
  label: string;
  context: string;
  createdAt: Date;
}

export interface TagDef {
  id: string;
  name: string;
  color: string;
  createdAt: Date;
}

export interface Settings {
  id: string;
  theme: ThemeMode;
  lastProjectId?: string;
  sidebarWidth: number;
  sidebarCollapsed: boolean;
  notesPanelWidth: number;
  notesPanelCollapsed: boolean;
  aiPanelCollapsed?: boolean;
  ai?: AISettings;
}

export interface TreeNode {
  id: string;
  label: string;
  type: 'project' | 'log';
  children?: TreeNode[];
  data?: Project | LogEntry;
  collapsed?: boolean;
}

export type AIAnalysisUrgency = 'Critical' | 'High' | 'Medium' | 'Low';

export type AIProvider = 'openai' | 'anthropic' | 'ollama' | 'grok' | 'custom';

export interface AIAnalysisResult {
  id: string;
  logId: string;
  timestamp: Date;
  verdict: string;
  rootCause: string;
  confidence: number;
  urgency: AIAnalysisUrgency;
  needsMoreLogs: string[];
  suggestedFix: string;
  highlightedLines: number[];
  explanation: string;
  similarIssues: string[];
  provider: AIProvider;
  model?: string;
  error?: string;
}

export interface AIProviderConfig {
  provider: AIProvider;
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  customHeaders?: Record<string, string>;
}

export interface AISettings {
  provider: AIProvider;
  apiKey: string;
  baseUrl: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

export interface AIConfig {
  id?: number;
  name: string;
  provider: AIProvider;
  apiKey: string;
  baseUrl: string;
  model: string;
  temperature: number;
  maxTokens: number;
  customHeaders?: Record<string, string>;
  lastUsedAt?: Date;
  createdAt: Date;
}

export interface KnowledgeBase {
  version: number;
  exportedAt: string;
  notes: Note[];
  tags: TagDef[];
}
