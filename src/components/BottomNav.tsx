import React from 'react';
import {
  ListTodo,
  Calendar as CalendarIcon,
  FolderKanban,
  BarChart2,
  Plus,
} from 'lucide-react';
import { ViewMode } from '../types';

interface BottomNavProps {
  currentView: ViewMode;
  setCurrentView: (v: ViewMode) => void;
  onOpenNewPlan: () => void;
  unreadCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentView,
  setCurrentView,
  onOpenNewPlan,
  unreadCount = 0,
}) => {
  const tabs = [
    { id: 'list' as ViewMode, label: '计划列表', icon: ListTodo },
    { id: 'calendar' as ViewMode, label: '日历视图', icon: CalendarIcon },
    { id: 'categories' as ViewMode, label: '分类管理', icon: FolderKanban },
    { id: 'stats' as ViewMode, label: '数据统计', icon: BarChart2 },
  ];

  return (
    <div className="sticky bottom-0 z-30 bg-[#FAF8F3]/95 dark:bg-[#262420]/95 backdrop-blur-md border-t border-[#E5E0D3] dark:border-[#3F3B35] transition-colors">
      <div className="max-w-md mx-auto px-4 py-2 flex items-center justify-between relative">
        {/* Floating Action Button (+) centered floating above */}
        <button
          type="button"
          onClick={onOpenNewPlan}
          className="absolute -top-6 left-1/2 -translate-x-1/2 w-13 h-13 rounded-2xl bg-gradient-to-tr from-[#C86D51] to-[#D9A05B] hover:from-[#B55B40] hover:to-[#C88E4A] text-white shadow-lg shadow-[#C86D51]/30 flex items-center justify-center transition-transform hover:scale-110 active:scale-95 border-2 border-[#FAF8F3] dark:border-[#262420]"
          title="创建新计划提醒"
        >
          <Plus className="w-7 h-7 stroke-[3]" />
        </button>

        {/* Left 2 Tabs */}
        <div className="flex items-center gap-1 w-2/5 justify-around">
          {tabs.slice(0, 2).map((tab) => {
            const Icon = tab.icon;
            const isActive = currentView === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setCurrentView(tab.id)}
                className={`flex flex-col items-center py-1 px-3 rounded-2xl transition-all ${
                  isActive
                    ? 'text-[#C86D51] dark:text-[#E07A5F] font-bold bg-[#C86D51]/10'
                    : 'text-[#7C776E] dark:text-[#A39E93] hover:text-[#2D2A26] dark:hover:text-[#F2EFE9]'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''}`} />
                <span className="text-[10px] mt-0.5">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Center Spacer for Floating Button */}
        <div className="w-12 shrink-0" />

        {/* Right 2 Tabs */}
        <div className="flex items-center gap-1 w-2/5 justify-around">
          {tabs.slice(2, 4).map((tab) => {
            const Icon = tab.icon;
            const isActive = currentView === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setCurrentView(tab.id)}
                className={`flex flex-col items-center py-1 px-3 rounded-2xl transition-all ${
                  isActive
                    ? 'text-[#C86D51] dark:text-[#E07A5F] font-bold bg-[#C86D51]/10'
                    : 'text-[#7C776E] dark:text-[#A39E93] hover:text-[#2D2A26] dark:hover:text-[#F2EFE9]'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''}`} />
                <span className="text-[10px] mt-0.5">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
