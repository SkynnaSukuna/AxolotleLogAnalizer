import { db } from '../db/schema';
import type { KnowledgeBase, Note, TagDef } from '../types';

export async function exportKnowledgeBase(): Promise<string> {
  const notes = await db.notes.toArray();
  const tags = await db.tags.toArray();

  const kb: KnowledgeBase = {
    version: 1,
    exportedAt: new Date().toISOString(),
    notes: notes.map(({ id, ...rest }) => rest as Note),
    tags: tags.map(({ id, ...rest }) => rest as TagDef),
  };

  return JSON.stringify(kb, null, 2);
}

export async function importKnowledgeBase(json: string): Promise<{ notes: number; tags: number }> {
  const kb: KnowledgeBase = JSON.parse(json);

  if (!kb.version || !kb.notes || !kb.tags) {
    throw new Error('Invalid knowledge base format');
  }

  let notesCount = 0;
  let tagsCount = 0;

  for (const tag of kb.tags) {
    const exists = await db.tags.where('name').equals(tag.name).first();
    if (!exists) {
      await db.tags.add({
        id: `tag_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        name: tag.name,
        color: tag.color,
        createdAt: tag.createdAt ? new Date(tag.createdAt) : new Date(),
      });
      tagsCount++;
    }
  }

  for (const note of kb.notes) {
    await db.notes.add({
      id: `note_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      logId: note.logId,
      projectId: note.projectId,
      stackTraceHash: note.stackTraceHash,
      fuzzyHash: note.fuzzyHash,
      errorSnippet: note.errorSnippet,
      cause: note.cause,
      solution: note.solution,
      tags: note.tags ?? [],
      isGlobal: note.isGlobal ?? false,
      status: note.status ?? 'open',
      createdAt: note.createdAt ? new Date(note.createdAt) : new Date(),
      updatedAt: note.updatedAt ? new Date(note.updatedAt) : new Date(),
    });
    notesCount++;
  }

  return { notes: notesCount, tags: tagsCount };
}

export async function downloadKnowledgeBase(): Promise<void> {
  const json = await exportKnowledgeBase();
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `knowledge-base-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function uploadKnowledgeBase(): Promise<string> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) {
        reject(new Error('No file selected'));
        return;
      }
      try {
        const text = await file.text();
        resolve(text);
      } catch {
        reject(new Error('Failed to read file'));
      }
    };
    input.click();
  });
}
