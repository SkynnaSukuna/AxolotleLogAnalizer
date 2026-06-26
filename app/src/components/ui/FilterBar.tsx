import { useState } from 'react';
import type { LogStatus } from '../../types';
import { Input } from './Input';

interface FilterBarProps {
  onSearch: (query: string) => void;
  onStatusFilter: (status: LogStatus | null) => void;
  activeStatus: LogStatus | null;
}

const STATUS_FILTERS: { value: LogStatus | null; label: string }[] = [
  { value: null, label: 'Все' },
  { value: 'new', label: 'Новые' },
  { value: 'in_progress', label: 'В работе' },
  { value: 'resolved', label: 'Решено' },
  { value: 'archived', label: 'Архив' },
];

export function FilterBar({ onSearch, onStatusFilter, activeStatus }: FilterBarProps) {
  const [searchValue, setSearchValue] = useState('');

  const handleSearch = (value: string) => {
    setSearchValue(value);
    onSearch(value);
  };

  return (
    <div className="filter-bar">
      <Input
        placeholder="Поиск логов..."
        value={searchValue}
        onChange={(e) => handleSearch(e.target.value)}
      />
      <div className="filter-statuses">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.label}
            className={`filter-chip${activeStatus === f.value ? ' active' : ''}`}
            onClick={() => onStatusFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  );
}
