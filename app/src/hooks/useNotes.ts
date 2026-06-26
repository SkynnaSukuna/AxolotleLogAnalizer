import { useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/schema';
import type { Note, PinnedError, Bookmark } from '../types';
import { computeStackTraceHash } from '../utils/stackTraceHash';

export function useNotes(projectId?: string) {
  const notes = useLiveQuery(
    () => {
      if (projectId) {
        return db.notes
          .filter((n) => n.projectId === projectId || n.isGlobal)
          .reverse()
          .sortBy('updatedAt');
      }
      return db.notes.orderBy('updatedAt').reverse().toArray();
    },
    [projectId],
  );

  const addNote = useCallback(
    async (data: {
      logId: string;
      projectId: string;
      errorSnippet: string;
      cause: string;
      solution: string;
      tags?: string[];
      isGlobal?: boolean;
    }) => {
      const { exact, fuzzy } = computeStackTraceHash(data.errorSnippet);
      const id = `note_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      await db.notes.add({
        id,
        logId: data.logId,
        projectId: data.projectId,
        stackTraceHash: exact,
        fuzzyHash: fuzzy,
        errorSnippet: data.errorSnippet.slice(0, 500),
        cause: data.cause,
        solution: data.solution,
        tags: data.tags ?? [],
        isGlobal: data.isGlobal ?? false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      return id;
    },
    [],
  );

  const updateNote = useCallback(
    async (id: string, data: Partial<Omit<Note, 'id' | 'createdAt'>>) => {
      await db.notes.update(id, { ...data, updatedAt: new Date() });
    },
    [],
  );

  const deleteNote = useCallback(async (id: string) => {
    await db.notes.delete(id);
  }, []);

  const findMatchingNotes = useCallback(
    (errorSnippet: string) => {
      if (!notes) return [];
      const { exact, fuzzy } = computeStackTraceHash(errorSnippet);
      return notes.filter(
        (n) =>
          n.stackTraceHash === exact ||
          n.fuzzyHash === fuzzy ||
          n.fuzzyHash.startsWith(fuzzy.split('::')[0]) ||
          fuzzy.startsWith(n.fuzzyHash.split('::')[0]),
      );
    },
    [notes],
  );

  const searchNotes = useCallback(
    (query: string) => {
      if (!notes || !query) return [];
      const q = query.toLowerCase();
      return notes.filter(
        (n) =>
          n.cause.toLowerCase().includes(q) ||
          n.solution.toLowerCase().includes(q) ||
          n.errorSnippet.toLowerCase().includes(q) ||
          n.tags.some((t) => t.toLowerCase().includes(q)),
      );
    },
    [notes],
  );

  return { notes, addNote, updateNote, deleteNote, findMatchingNotes, searchNotes };
}

export function usePinnedErrors(logId?: string) {
  const pinned = useLiveQuery(
    () => {
      if (logId) {
        return db.pinnedErrors.where('logId').equals(logId).toArray();
      }
      return db.pinnedErrors.orderBy('pinnedAt').reverse().toArray();
    },
    [logId],
  );

  const pinError = useCallback(
    async (data: {
      logId: string;
      projectId: string;
      blockId: number;
      errorText: string;
      stackTraceHash: string;
      note?: string;
    }) => {
      const id = `pin_${Date.now()}`;
      await db.pinnedErrors.add({
        id,
        logId: data.logId,
        projectId: data.projectId,
        blockId: data.blockId,
        errorText: data.errorText.slice(0, 200),
        stackTraceHash: data.stackTraceHash,
        note: data.note ?? '',
        pinnedAt: new Date(),
      });
      return id;
    },
    [],
  );

  const unpinError = useCallback(async (id: string) => {
    await db.pinnedErrors.delete(id);
  }, []);

  const updatePinNote = useCallback(async (id: string, note: string) => {
    await db.pinnedErrors.update(id, { note });
  }, []);

  return { pinned, pinError, unpinError, updatePinNote };
}

export function useBookmarks(logId?: string) {
  const bookmarks = useLiveQuery(
    () => {
      if (logId) {
        return db.bookmarks.where('logId').equals(logId).toArray();
      }
      return db.bookmarks.orderBy('createdAt').reverse().toArray();
    },
    [logId],
  );

  const addBookmark = useCallback(
    async (data: {
      logId: string;
      projectId: string;
      lineNumber: number;
      label: string;
      context: string;
    }) => {
      const id = `bm_${Date.now()}`;
      await db.bookmarks.add({
        id,
        logId: data.logId,
        projectId: data.projectId,
        lineNumber: data.lineNumber,
        label: data.label,
        context: data.context.slice(0, 100),
        createdAt: new Date(),
      });
      return id;
    },
    [],
  );

  const removeBookmark = useCallback(async (id: string) => {
    await db.bookmarks.delete(id);
  }, []);

  return { bookmarks, addBookmark, removeBookmark };
}
