import { useState, useRef, useEffect, useCallback, useLayoutEffect } from 'react';

export type ContextMenuAction<T = unknown> = {
  type: 'action';
  id: string;
  label: string;
  icon?: string;
  disabled?: boolean;
  onClick: (data: T) => void;
};

export type ContextMenuSeparator = {
  type: 'separator';
};

export type ContextMenuItem<T = unknown> = ContextMenuAction<T> | ContextMenuSeparator;

interface CustomContextMenuProps<T> {
  items: ContextMenuItem<T>[];
  data: T;
  position: { x: number; y: number };
  onClose: () => void;
  id?: string;
}

export function CustomContextMenu<T>({
  items,
  data,
  position,
  onClose,
  id,
}: CustomContextMenuProps<T>) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ x: position.x, y: position.y });
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    const el = menuRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let x = position.x;
    let y = position.y;

    if (x + rect.width > vw - 8) x = Math.max(4, vw - rect.width - 8);
    if (y + rect.height > vh - 8) y = Math.max(4, vh - rect.height - 8);

    setCoords({ x, y });
    setReady(true);
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleAction = useCallback(
    (item: ContextMenuAction<T>) => {
      if (item.disabled) return;
      item.onClick(data);
      onClose();
    },
    [data, onClose],
  );

  return (
    <div
      ref={menuRef}
      id={id}
      className={`custom-context-menu${ready ? ' visible' : ' custom-context-menu-hidden'}`}
      role="menu"
      style={{
        position: 'fixed',
        left: coords.x,
        top: coords.y,
        zIndex: 9999,
        minWidth: 180,
      }}
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
    >
      {items.map((item, i) => {
        if (item.type === 'separator') {
          return <div key={`sep-${i}`} className="custom-context-menu-separator" />;
        }
        return (
          <div
            key={item.id}
            className={`custom-context-menu-item${item.disabled ? ' disabled' : ''}`}
            role="menuitem"
            tabIndex={item.disabled ? -1 : 0}
            onClick={() => handleAction(item)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleAction(item);
              }
            }}
          >
            {item.icon && <span className="custom-context-menu-icon">{item.icon}</span>}
            <span className="custom-context-menu-label">{item.label}</span>
          </div>
        );
      })}
    </div>
  );
}
