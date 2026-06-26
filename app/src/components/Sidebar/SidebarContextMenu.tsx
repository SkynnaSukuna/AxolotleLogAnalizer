import { useMemo } from 'react';
import { CustomContextMenu, type ContextMenuItem } from '../ui/CustomContextMenu';
import type { Project, LogEntry, LogStatus } from '../../types';

type SidebarItem = Project | LogEntry;

const STATUS_LABELS: Record<LogStatus, string> = {
  new: 'Новый',
  in_progress: 'В работе',
  resolved: 'Решено',
  archived: 'Архив',
};

const STATUS_ORDER: LogStatus[] = ['new', 'in_progress', 'resolved', 'archived'];

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
  onChangeStatus?: (logId: string, status: LogStatus) => void;
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
  onChangeStatus,
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

    const log = data as LogEntry;
    const currentStatus = log.status ?? 'new';

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
        type: 'submenu',
        id: 'change-status',
        label: 'Сменить статус',
        icon: '\uD83D\uDD04',
        children: STATUS_ORDER.map((key) => ({
          type: 'action' as const,
          id: `status-${key}`,
          label: (key === currentStatus ? '\u2713 ' : '') + STATUS_LABELS[key],
          onClick: () => {
            console.log('[SidebarContextMenu] status click — logId:', log.id, 'status:', key);
            onChangeStatus?.(log.id, key);
          },
        })),
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
  }, [type, data, onRename, onDelete, onAddLog, onOpen, onCopyPath, onProperties, onChangeStatus]);

  return (
    <CustomContextMenu
      items={items}
      data={data}
      position={position}
      onClose={onClose}
    />
  );
}
