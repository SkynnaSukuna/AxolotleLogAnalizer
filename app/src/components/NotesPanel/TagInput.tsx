import { useState, useRef, useEffect, useCallback } from 'react';
import { useTagSuggestions } from '../../hooks/useTagSuggestions';

interface TagInputProps {
  selected: string[];
  onChange: (tags: string[]) => void;
}

export function TagInput({ selected, onChange }: TagInputProps) {
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { tagNames, tagMap } = useTagSuggestions();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = tagNames.filter(
    (n) => n.toLowerCase().includes(input.toLowerCase()) && !selected.includes(n),
  );

  const addTag = useCallback(
    (name: string) => {
      const trimmed = name.trim();
      if (trimmed && !selected.includes(trimmed)) {
        onChange([...selected, trimmed]);
      }
      setInput('');
      setShowSuggestions(false);
      inputRef.current?.focus();
    },
    [selected, onChange],
  );

  const removeTag = useCallback(
    (name: string) => {
      onChange(selected.filter((t) => t !== name));
    },
    [selected, onChange],
  );

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  return (
    <div className="notes-tag-input" ref={containerRef}>
      <div className="notes-tags-list">
        {selected.map((tag) => (
          <span
            key={tag}
            className="notes-tag"
            style={{ background: tagMap.get(tag) || '#6b7280', color: '#fff' }}
          >
            {tag}
            <button className="notes-tag-remove" onClick={() => removeTag(tag)}>
              ×
            </button>
          </span>
        ))}
      </div>
      <div style={{ position: 'relative' }}>
        <input
          ref={inputRef}
          className="input notes-tag-field"
          placeholder="Добавить тег..."
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && input.trim()) {
              e.preventDefault();
              addTag(input);
            }
            if (e.key === 'Backspace' && !input && selected.length > 0) {
              removeTag(selected[selected.length - 1]);
            }
          }}
        />
        {showSuggestions && filtered.length > 0 && (
          <div className="notes-tag-suggestions">
            {filtered.map((name) => (
              <div
                key={name}
                className="notes-tag-suggestion"
                onClick={() => addTag(name)}
              >
                <span
                  className="notes-tag-dot"
                  style={{ background: tagMap.get(name) || '#6b7280' }}
                />
                {name}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
