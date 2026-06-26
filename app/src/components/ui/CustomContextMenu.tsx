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

export type ContextMenuSubmenu<T = unknown> = {
  type: 'submenu';
  id: string;
  label: string;
  icon?: string;
  disabled?: boolean;
  children: ContextMenuItem<T>[];
};

export type ContextMenuItem<T = unknown> = ContextMenuAction<T> | ContextMenuSeparator | ContextMenuSubmenu<T>;

interface CustomContextMenuProps<T> {
  items: ContextMenuItem<T>[];
  data: T;
  position: { x: number; y: number };
  onClose: () => void;
  id?: string;
  parentRef?: React.RefObject<HTMLDivElement | null>;
}

function isAction<T>(item: ContextMenuItem<T>): item is ContextMenuAction<T> {
  return item.type === 'action';
}

function isSubmenu<T>(item: ContextMenuItem<T>): item is ContextMenuSubmenu<T> {
  return item.type === 'submenu';
}

export function CustomContextMenu<T>({
  items,
  data,
  position,
  onClose,
  id,
  parentRef,
}: CustomContextMenuProps<T>) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ x: position.x, y: position.y });
  const [ready, setReady] = useState(false);

  const [openSubmenuId, setOpenSubmenuId] = useState<string | null>(null);
  const [submenuCoords, setSubmenuCoords] = useState({ x: 0, y: 0 });
  const submenuTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const submenuRef = useRef<HTMLDivElement>(null);
  const hoverItemRef = useRef<string | null>(null);

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

  /* ── close on outside click ── */
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      const inMenu = menuRef.current?.contains(target);
      const inSubmenu = submenuRef.current?.contains(target);
      const inParent = parentRef?.current?.contains(target);
      if (!inMenu && !inSubmenu && !inParent) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [onClose, parentRef]);

  /* ── Escape key ── */
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (openSubmenuId) {
          setOpenSubmenuId(null);
        } else {
          onClose();
        }
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose, openSubmenuId]);

  useEffect(() => {
    return () => { clearTimeout(submenuTimerRef.current); };
  }, []);

  const handleAction = useCallback(
    (item: ContextMenuAction<T>) => {
      if (item.disabled) return;
      console.log('[CustomContextMenu] action click:', item.id, data);
      item.onClick(data);
      onClose();
    },
    [data, onClose],
  );

  const handleSubmenuClick = useCallback(
    (child: ContextMenuAction<T>) => {
      if (child.disabled) return;
      console.log('[CustomContextMenu] submenu action click:', child.id, data);
      child.onClick(data);
      onClose();
    },
    [data, onClose],
  );

  const handleSubmenuEnter = useCallback((id: string, e: React.MouseEvent) => {
    clearTimeout(submenuTimerRef.current);
    hoverItemRef.current = id;
    const itemEl = e.currentTarget as HTMLElement;
    const rect = itemEl.getBoundingClientRect();
    setSubmenuCoords({ x: rect.right - 4, y: rect.top - 4 });
    submenuTimerRef.current = setTimeout(() => {
      if (hoverItemRef.current === id) {
        setOpenSubmenuId(id);
      }
    }, 80);
  }, []);

  const handleSubmenuLeave = useCallback(() => {
    submenuTimerRef.current = setTimeout(() => {
      if (!submenuRef.current?.matches(':hover')) {
        setOpenSubmenuId(null);
      }
    }, 120);
  }, []);

  const openSubmenuItem = openSubmenuId
    ? (items.find((it) => isSubmenu(it) && it.id === openSubmenuId) as ContextMenuSubmenu<T> | undefined)
    : undefined;

  return (
    <>
      {/* ── main menu ── */}
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

          if (isSubmenu(item)) {
            return (
              <div
                key={item.id}
                className={`custom-context-menu-item${item.disabled ? ' disabled' : ''}${openSubmenuId === item.id ? ' active-submenu' : ''}`}
                role="menuitem"
                tabIndex={item.disabled ? -1 : 0}
                onMouseEnter={(e) => !item.disabled && handleSubmenuEnter(item.id, e)}
                onMouseLeave={handleSubmenuLeave}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {item.icon && <span className="custom-context-menu-icon">{item.icon}</span>}
                  <span className="custom-context-menu-label">{item.label}</span>
                </span>
                <span style={{ fontSize: '0.6rem', marginLeft: 16, opacity: 0.5 }}>▶</span>
              </div>
            );
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

      {/* ── submenu flyout (sibling, NOT child — avoids transform/parent clip) ── */}
      {openSubmenuItem && (
        <div
          ref={submenuRef}
          className="custom-context-menu visible"
          role="menu"
          style={{
            position: 'fixed',
            left: submenuCoords.x,
            top: submenuCoords.y,
            zIndex: 10000,
            minWidth: 140,
          }}
          onMouseEnter={() => clearTimeout(submenuTimerRef.current)}
          onMouseLeave={() => setOpenSubmenuId(null)}
          onClick={(e) => e.stopPropagation()}
          onContextMenu={(e) => e.preventDefault()}
        >
          {openSubmenuItem.children.map((child, i) => {
            if (child.type === 'separator') {
              return <div key={`sub-sep-${i}`} className="custom-context-menu-separator" />;
            }
            if (!isAction(child)) return null;
            return (
              <div
                key={child.id}
                className={`custom-context-menu-item${child.disabled ? ' disabled' : ''}`}
                role="menuitem"
                tabIndex={child.disabled ? -1 : 0}
                onClick={(e) => {
                  e.stopPropagation();
                  console.log('[CustomContextMenu] submenu click — child:', child.id);
                  handleSubmenuClick(child);
                }}
              >
                {child.icon && <span className="custom-context-menu-icon">{child.icon}</span>}
                <span className="custom-context-menu-label">{child.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
