import { useCallback, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/schema';

const TAG_COLORS = [
  '#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16',
];

export function useTagSuggestions() {
  const tags = useLiveQuery(() => db.tags.toArray(), []);

  const addTag = useCallback(async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const exists = tags?.find((t) => t.name.toLowerCase() === trimmed.toLowerCase());
    if (exists) return exists.id;
    const usedColors = new Set(tags?.map((t) => t.color) ?? []);
    const color = TAG_COLORS.find((c) => !usedColors.has(c)) || '#6b7280';
    const id = `tag_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    await db.tags.add({ id, name: trimmed, color, createdAt: new Date() });
    return id;
  }, [tags]);

  const deleteTag = useCallback(async (id: string) => {
    await db.tags.delete(id);
  }, []);

  const tagNames = useMemo(() => tags?.map((t) => t.name) ?? [], [tags]);
  const tagMap = useMemo(() => {
    const map = new Map<string, string>();
    tags?.forEach((t) => map.set(t.name, t.color));
    return map;
  }, [tags]);

  return { tags, addTag, deleteTag, tagNames, tagMap };
}
