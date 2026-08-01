export type PriorityLevel = 'P1' | 'P2' | 'P3' | 'P4';

export interface PriorityInfo {
  level: PriorityLevel;
  label: string;
  color: string; // Tailwind color class
  badgeBg: string;
  badgeText: string;
  border: string;
  weight: number; // for sorting
}

export interface Category {
  id: string;
  name: string;
  icon: string; // Lucide icon name or emoji
  color: string; // Hex or Tailwind color class
}

export interface PlanItem {
  id: string;
  title: string;
  description?: string;
  dueDate: string; // YYYY-MM-DD
  dueTime: string; // HH:mm
  priority: PriorityLevel;
  categoryId: string;
  completed: boolean;
  completedAt?: string;
  reminderEnabled: boolean;
  reminderTriggered?: boolean;
  reminderSnoozedUntil?: string; // ISO string
  repeat?: 'none' | 'daily' | 'weekly' | 'monthly';
  tags?: string[];
  createdAt: string; // ISO string
}

export type SortBy = 'priority' | 'dueDate' | 'createdAt' | 'title' | 'category';
export type SortOrder = 'asc' | 'desc';

export type FilterStatus = 'all' | 'today' | 'upcoming' | 'overdue' | 'completed';

export type ViewMode = 'list' | 'calendar' | 'timeline' | 'categories' | 'stats';
