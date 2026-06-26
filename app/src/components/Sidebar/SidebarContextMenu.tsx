import { useMemo } from 'react';
import { CustomContextMenu, type ContextMenuItem } from '../ui/CustomContextMenu';
import type { Project, LogEntry } from '../../types';

type SidebarItem = Project | LogEntry;

interface SidebarContextMenuProps {
  type: 'project' | 'log';
  data: SidebarItem;
  position: { x: number; y: number };
  onClose: () => void;
  onRename: () => void;
  onDelete: () => void;
  onAddLog?: () => void;
  onOpen?: () => void;
  onCopyPath?: () => void;
  onProperties?: () => void;
}

export function SidebarContextMenu({
  type,
  data,
  position,
  onClose,
  onRename,
  onDelete,
  onAddLog,
  onOpen,
  onCopyPath,
  onProperties,
}: SidebarContextMenuProps) {
  const items = useMemo<ContextMenuItem<SidebarItem>[]>(() => {
    if (type === 'project') {
      return [
        {
          type: 'action',
          id: 'rename',
          label: 'Переименовать проект',
          icon: '\u270F\uFE0F',
          onClick: () => onRename(),
        },
        {
          type: 'action',
          id: 'delete',
          label: 'Удалить проект',
          icon: '\uD83D\uDDD1\uFE0F',
          onClick: () => onDelete(),
        },
        { type: 'separator' },
        {
          type: 'action',
          id: 'add-log',
          label: 'Создать новый лог',
          icon: '\uD83D\uDCC4',
          onClick: () => onAddLog?.(),
        },
        { type: 'separator' },
        {
          type: 'action',
          id: 'properties',
          label: 'Свойства проекта',
          icon: '\u2139\uFE0F',
          onClick: () => onProperties?.(),
        },
      ];
    }

    return [
      {
        type: 'action',
        id: 'open',
        label: 'Открыть',
        icon: '\uD83D\uDCC2',
        onClick: () => onOpen?.(),
      },
      {
        type: 'action',
        id: 'rename',
        label: 'Переименовать лог',
        icon: '\u270F\uFE0F',
        onClick: () => onRename(),
      },
      {
        type: 'action',
        id: 'delete',
        label: 'Удалить лог',
        icon: '\uD83D\uDDD1\uFE0F',
        onClick: () => onDelete(),
      },
      { type: 'separator' },
      {
        type: 'action',
        id: 'copy-path',
        label: 'Скопировать путь',
        icon: '\uD83D\uDCCB',
        onClick: () => onCopyPath?.(),
      },
      { type: 'separator' },
      {
        type: 'action',
        id: 'properties',
        label: 'Свойства',
        icon: '\u2139\uFE0F',
        onClick: () => onProperties?.(),
      },
    ];
  }, [type, onRename, onDelete, onAddLog, onOpen, onCopyPath, onProperties]);

  return (
    <CustomContextMenu
      items={items}
      data={data}
      position={position}
      onClose={onClose}
    />
  );
}
