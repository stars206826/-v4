import React from 'react';
import {
  Bell,
  Search,
  Smartphone,
  Sun,
  Moon,
  X,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  SlidersHorizontal,
} from 'lucide-react';
import { FilterStatus, SortBy, SortOrder } from '../types';

interface HeaderBarProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  showSearch: boolean;
  setShowSearch: (show: boolean) => void;
  filterStatus: FilterStatus;
  setFilterStatus: (s: FilterStatus) => void;
  sortBy: SortBy;
  setSortBy: (s: SortBy) => void;
  sortOrder: SortOrder;
  setSortOrder: (o: SortOrder) => void;
  unreadRemindersCount: number;
  openNotificationCenter: () => void;
  isDarkMode: boolean;
  setIsDarkMode: (dark: boolean) => void;
  isAndroidFrame: boolean;
  setIsAndroidFrame: (frame: boolean) => void;
  planCounts: {
    all: number;
    today: number;
    upcoming: number;
    overdue: number;
    completed: number;
  };
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  searchQuery,
  setSearchQuery,
  showSearch,
  setShowSearch,
  filterStatus,
  setFilterStatus,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  unreadRemindersCount,
  openNotificationCenter,
  isDarkMode,
  setIsDarkMode,
  isAndroidFrame,
  setIsAndroidFrame,
  planCounts,
}) => {
  const [currentTime, setCurrentTime] = React.useState('');

  React.useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      const h = String(d.getHours()).padStart(2, '0');
      const m = String(d.getMinutes()).padStart(2, '0');
      setCurrentTime(`${h}:${m}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="bg-[#FAF8F3] dark:bg-[#262420] text-[#2D2A26] dark:text-[#F2EFE9] shadow-sm sticky top-0 z-30 transition-colors border-b border-[#E5E0D3] dark:border-[#3F3B35]">
      {/* Android Top Status Bar */}
      <div className="px-4 py-1 text-xs text-[#7C776E] dark:text-[#A39E93] flex items-center justify-between border-b border-[#E5E0D3]/80 dark:border-[#3F3B35]/80 bg-[#F1EDE4] dark:bg-[#1C1B18]">
        <span className="font-medium text-[#2D2A26] dark:text-[#F2EFE9]">{currentTime}</span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] bg-[#60775A]/20 text-[#60775A] dark:text-[#81A078] px-1.5 py-0.5 rounded font-mono font-semibold">5G</span>
          <div className="w-2.5 h-2.5 rounded-full bg-[#60775A] dark:bg-[#81A078] inline-block animate-pulse" title="系统提醒服务已启用" />
          <span className="text-[11px] font-mono">98%</span>
        </div>
      </div>

      {/* Primary Top Bar */}
      <div className="px-4 py-3 flex items-center justify-between gap-2">
        {!showSearch ? (
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#C86D51] to-[#D9A05B] flex items-center justify-center text-white font-bold shadow-md shadow-[#C86D51]/20">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-[#2D2A26] dark:text-[#F2EFE9] flex items-center gap-1.5">
                智时日程
                <span className="text-[10px] font-medium px-2 py-0.5 bg-[#C86D51]/15 text-[#C86D51] dark:text-[#E07A5F] rounded-full border border-[#C86D51]/30">
                  Natural Tones
                </span>
              </h1>
              <p className="text-[11px] text-[#7C776E] dark:text-[#A39E93]">定时提醒 · 标签分类 · 重要性排序</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center gap-2 bg-[#F1EDE4] dark:bg-[#1C1B18] rounded-full px-3 py-1.5 border border-[#E5E0D3] dark:border-[#3F3B35] animate-fadeIn">
            <Search className="w-4 h-4 text-[#7C776E] dark:text-[#A39E93]" />
            <input
              type="text"
              placeholder="搜索计划标题、分类或标签..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-sm text-[#2D2A26] dark:text-[#F2EFE9] focus:outline-none placeholder:text-[#7C776E] dark:placeholder:text-[#A39E93]"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-[#7C776E] hover:text-[#2D2A26] dark:hover:text-white p-0.5"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => {
                setShowSearch(false);
                setSearchQuery('');
              }}
              className="text-xs text-[#C86D51] dark:text-[#E07A5F] font-semibold hover:underline pl-1"
            >
              取消
            </button>
          </div>
        )}

        {/* Header Right Actions */}
        {!showSearch && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowSearch(true)}
              className="p-2 rounded-xl text-[#2D2A26] dark:text-[#F2EFE9] hover:bg-[#F1EDE4] dark:hover:bg-[#302D28] transition-colors"
              title="搜索计划"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Notification Bell */}
            <button
              onClick={openNotificationCenter}
              className="p-2 rounded-xl text-[#2D2A26] dark:text-[#F2EFE9] hover:bg-[#F1EDE4] dark:hover:bg-[#302D28] transition-colors relative"
              title="提醒中心"
            >
              <Bell className="w-5 h-5" />
              {unreadRemindersCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#C86D51] text-white text-[10px] font-bold flex items-center justify-center animate-bounce shadow-sm">
                  {unreadRemindersCount > 9 ? '9+' : unreadRemindersCount}
                </span>
              )}
            </button>

            {/* Android Frame Toggle */}
            <button
              onClick={() => setIsAndroidFrame(!isAndroidFrame)}
              className={`p-2 rounded-xl transition-colors ${
                isAndroidFrame
                  ? 'bg-[#C86D51]/20 text-[#C86D51] dark:text-[#E07A5F] border border-[#C86D51]/40'
                  : 'text-[#7C776E] dark:text-[#A39E93] hover:bg-[#F1EDE4] dark:hover:bg-[#302D28]'
              }`}
              title={isAndroidFrame ? '切换全屏视图' : '切换安卓手机外框模式'}
            >
              <Smartphone className="w-5 h-5" />
            </button>

            {/* Dark / Light Toggle */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-xl text-[#2D2A26] dark:text-[#F2EFE9] hover:bg-[#F1EDE4] dark:hover:bg-[#302D28] transition-colors"
              title={isDarkMode ? '切换 Natural Tones 亮色模式' : '切换暗夜自然模式'}
            >
              {isDarkMode ? <Sun className="w-5 h-5 text-[#D9A05B]" /> : <Moon className="w-5 h-5 text-[#60775A]" />}
            </button>
          </div>
        )}
      </div>

      {/* Filter & Sort Controls Bar */}
      <div className="px-4 py-2 border-t border-[#E5E0D3] dark:border-[#3F3B35] bg-[#FAF8F3] dark:bg-[#262420] overflow-x-auto no-scrollbar flex items-center justify-between gap-3 text-xs">
        {/* Filter Status Pills */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1 rounded-full font-medium transition-all ${
              filterStatus === 'all'
                ? 'bg-[#2D2A26] text-[#FAF8F3] dark:bg-[#F2EFE9] dark:text-[#1C1B18] font-semibold shadow-sm'
                : 'bg-[#F1EDE4] text-[#7C776E] dark:bg-[#302D28] dark:text-[#A39E93] hover:bg-[#E5E0D3]'
            }`}
          >
            全部 ({planCounts.all})
          </button>
          <button
            onClick={() => setFilterStatus('today')}
            className={`px-3 py-1 rounded-full font-medium transition-all flex items-center gap-1 ${
              filterStatus === 'today'
                ? 'bg-[#C86D51] text-white font-semibold shadow-sm'
                : 'bg-[#F1EDE4] text-[#7C776E] dark:bg-[#302D28] dark:text-[#A39E93] hover:bg-[#E5E0D3]'
            }`}
          >
            <Clock className="w-3 h-3" />
            今天 ({planCounts.today})
          </button>
          <button
            onClick={() => setFilterStatus('upcoming')}
            className={`px-3 py-1 rounded-full font-medium transition-all ${
              filterStatus === 'upcoming'
                ? 'bg-[#60775A] text-white font-semibold shadow-sm'
                : 'bg-[#F1EDE4] text-[#7C776E] dark:bg-[#302D28] dark:text-[#A39E93] hover:bg-[#E5E0D3]'
            }`}
          >
            未完成 ({planCounts.upcoming})
          </button>
          {planCounts.overdue > 0 && (
            <button
              onClick={() => setFilterStatus('overdue')}
              className={`px-3 py-1 rounded-full font-medium transition-all flex items-center gap-1 ${
                filterStatus === 'overdue'
                  ? 'bg-[#C05238] text-white font-semibold shadow-sm'
                  : 'bg-[#F7EBE8] text-[#C05238] dark:bg-[#3A221E] dark:text-[#E07A5F] border border-[#F0C9BF] dark:border-[#5C2B22]'
              }`}
            >
              <AlertCircle className="w-3 h-3" />
              逾期 ({planCounts.overdue})
            </button>
          )}
          <button
            onClick={() => setFilterStatus('completed')}
            className={`px-3 py-1 rounded-full font-medium transition-all flex items-center gap-1 ${
              filterStatus === 'completed'
                ? 'bg-[#60775A] text-white font-semibold shadow-sm'
                : 'bg-[#F1EDE4] text-[#7C776E] dark:bg-[#302D28] dark:text-[#A39E93] hover:bg-[#E5E0D3]'
            }`}
          >
            <CheckCircle2 className="w-3 h-3" />
            已完成 ({planCounts.completed})
          </button>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-1.5 shrink-0 bg-[#F1EDE4] dark:bg-[#1C1B18] p-1 rounded-xl border border-[#E5E0D3] dark:border-[#3F3B35]">
          <SlidersHorizontal className="w-3.5 h-3.5 text-[#7C776E] dark:text-[#A39E93] ml-1" />
          <span className="text-[11px] text-[#7C776E] dark:text-[#A39E93]">排序:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className="bg-[#FAF8F3] dark:bg-[#262420] text-[#C86D51] dark:text-[#E07A5F] font-semibold text-xs rounded-lg px-2 py-0.5 border border-[#E5E0D3] dark:border-[#3F3B35] focus:outline-none cursor-pointer"
          >
            <option value="priority">🔥 重要性优先 (P1-P4)</option>
            <option value="dueDate">📅 日期与时间</option>
            <option value="createdAt">⏱️ 创建时间</option>
            <option value="title">🔤 标题拼音</option>
          </select>

          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="px-2 py-0.5 bg-[#FAF8F3] dark:bg-[#262420] text-[#2D2A26] dark:text-[#F2EFE9] hover:bg-[#E5E0D3] rounded-lg border border-[#E5E0D3] dark:border-[#3F3B35] text-[11px] font-mono font-medium"
            title="切换升序/降序"
          >
            {sortOrder === 'asc' ? '↑ 升序' : '↓ 降序'}
          </button>
        </div>
      </div>
    </header>
  );
};
