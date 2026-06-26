import Dexie, { type EntityTable } from 'dexie';
import type { Project, LogEntry, ChatSession, Note, Settings, PinnedError, Bookmark, TagDef, AIConfig } from '../types';

export class AppDatabase extends Dexie {
  projects!: EntityTable<Project, 'id'>;
  logs!: EntityTable<LogEntry, 'id'>;
  chats!: EntityTable<ChatSession, 'id'>;
  notes!: EntityTable<Note, 'id'>;
  pinnedErrors!: EntityTable<PinnedError, 'id'>;
  bookmarks!: EntityTable<Bookmark, 'id'>;
  tags!: EntityTable<TagDef, 'id'>;
  settings!: EntityTable<Settings, 'id'>;
  aiConfigs!: EntityTable<AIConfig, 'id'>;

  constructor() {
    super('AxolotleLogAnalyzerDB');

    this.version(1).stores({
      projects: '++id, name, createdAt, updatedAt',
      logs: '++id, projectId, fileName, status, *tags, hash, createdAt, updatedAt',
      chats: '++id, logId, title, createdAt',
      notes: '++id, logId, stackTraceHash, createdAt, updatedAt',
      settings: 'id',
    });

    this.version(2).stores({
      projects: '++id, name, createdAt, updatedAt',
      logs: '++id, projectId, fileName, status, *tags, hash, createdAt, updatedAt',
      chats: '++id, logId, title, createdAt',
      notes: '++id, logId, stackTraceHash, createdAt, updatedAt',
      settings: 'id',
    });

    this.version(3).stores({
      projects: '++id, name, createdAt, updatedAt',
      logs: '++id, projectId, fileName, status, *tags, hash, createdAt, updatedAt',
      chats: '++id, logId, title, createdAt',
      notes: '++id, logId, stackTraceHash, createdAt, updatedAt',
      settings: 'id',
    });

    this.version(4).stores({
      projects: '++id, name, createdAt, updatedAt',
      logs: '++id, projectId, fileName, status, *tags, hash, createdAt, updatedAt',
      chats: '++id, logId, title, createdAt',
      notes: '++id, logId, projectId, stackTraceHash, fuzzyHash, isGlobal, *tags, createdAt, updatedAt',
      pinnedErrors: '++id, logId, projectId, stackTraceHash, pinnedAt',
      bookmarks: '++id, logId, projectId, lineNumber, createdAt',
      tags: '++id, name, createdAt',
      settings: 'id',
    });

    this.version(5).stores({
      projects: '++id, name, createdAt, updatedAt',
      logs: '++id, projectId, fileName, status, *tags, hash, createdAt, updatedAt',
      chats: '++id, logId, title, createdAt',
      notes: '++id, logId, projectId, stackTraceHash, fuzzyHash, isGlobal, status, *tags, createdAt, updatedAt',
      pinnedErrors: '++id, logId, projectId, stackTraceHash, pinnedAt',
      bookmarks: '++id, logId, projectId, lineNumber, createdAt',
      tags: '++id, name, createdAt',
      settings: 'id',
      aiConfigs: '++id, name, provider, lastUsedAt',
    });

    this.version(6).stores({
      projects: '++id, name, createdAt, updatedAt',
      logs: '++id, projectId, fileName, status, *tags, hash, createdAt, updatedAt',
      chats: '++id, logId, title, createdAt',
      notes: '++id, logId, projectId, stackTraceHash, fuzzyHash, isGlobal, status, *tags, createdAt, updatedAt',
      pinnedErrors: '++id, logId, projectId, stackTraceHash, pinnedAt',
      bookmarks: '++id, logId, projectId, lineNumber, createdAt',
      tags: '++id, name, createdAt',
      settings: 'id',
      aiConfigs: '++id, name, provider, lastUsedAt',
    });
  }
}

export const db = new AppDatabase();
