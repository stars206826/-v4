import React from 'react';
import {
  Category,
  FilterStatus,
  PlanItem,
  SortBy,
  SortOrder,
  ViewMode,
} from './types';
import { DEFAULT_CATEGORIES, getInitialPlans, PRIORITY_MAP } from './data/initialData';
import { HeaderBar } from './components/HeaderBar';
import { PlanCard } from './components/PlanCard';
import { PlanFormModal } from './components/PlanFormModal';
import { CalendarView } from './components/CalendarView';
import { CategoryManagerModal } from './components/CategoryManagerModal';
import { AlarmModal } from './components/AlarmModal';
import { StatsDrawer } from './components/StatsDrawer';
import { BottomNav } from './components/BottomNav';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import { isPlanDueNow, sendDesktopNotification, syncNativeNotifications } from './utils/notifications';
import {
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  Sparkles,
  Inbox,
  Folder,
} from 'lucide-react';

export default function App() {
  // Persistence State
  const [plans, setPlans] = React.useState<PlanItem[]>(() => {
    try {
      const saved = localStorage.getItem('android_plan_reminders_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('LocalStorage load error:', e);
    }
    return getInitialPlans();
  });

  const [categories, setCategories] = React.useState<Category[]>(() => {
    try {
      const saved = localStorage.getItem('android_plan_categories_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('LocalStorage category load error:', e);
    }
    return DEFAULT_CATEGORIES;
  });

  // Save changes to localStorage
  React.useEffect(() => {
    try {
      localStorage.setItem('android_plan_reminders_v1', JSON.stringify(plans));
      syncNativeNotifications(plans);
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  }, [plans]);

  React.useEffect(() => {
    try {
      localStorage.setItem('android_plan_categories_v1', JSON.stringify(categories));
    } catch (e) {
      console.warn('LocalStorage category save error:', e);
    }
  }, [categories]);

  // UI State
  const [currentView, setCurrentView] = React.useState<ViewMode>('list');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [showSearch, setShowSearch] = React.useState(false);
  const [filterStatus, setFilterStatus] = React.useState<FilterStatus>('all');
  const [selectedCategoryId, setSelectedCategoryId] = React.useState<string | null>(null);
  const [sortBy, setSortBy] = React.useState<SortBy>('priority');
  const [sortOrder, setSortOrder] = React.useState<SortOrder>('asc');

  // Modals & Drawers
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingPlan, setEditingPlan] = React.useState<PlanItem | null>(null);
  const [initialFormDate, setInitialFormDate] = React.useState<string | undefined>(undefined);
  const [isCatManagerOpen, setIsCatManagerOpen] = React.useState(false);
  const [isNotifCenterOpen, setIsNotifCenterOpen] = React.useState(false);
  const [activeAlarmPlan, setActiveAlarmPlan] = React.useState<PlanItem | null>(null);

  // Settings
  const [isDarkMode, setIsDarkMode] = React.useState<boolean>(() => {
    const saved = localStorage.getItem('zhishi_dark_mode');
    if (saved !== null) {
      return saved === 'true';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [isAndroidFrame, setIsAndroidFrame] = React.useState(false);

  // Sync html dark class
  React.useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('zhishi_dark_mode', String(isDarkMode));
  }, [isDarkMode]);

  // Real-time Reminder Checking Ticker (Every 10 seconds)
  React.useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      plans.forEach((plan) => {
        if (isPlanDueNow(plan, now) && !activeAlarmPlan) {
          // Trigger alarm modal
          setActiveAlarmPlan(plan);

          // Mark plan as triggered in state so it doesn't repeatedly open until snoozed or reset
          setPlans((prev) =>
            prev.map((p) => (p.id === plan.id ? { ...p, reminderTriggered: true } : p))
          );

          // Send desktop system notification
          sendDesktopNotification(
            `⏰ 计划提醒到点: ${plan.title}`,
            `时间: ${plan.dueTime} | 标签: ${plan.priority}`
          );
        }
      });
    };

    checkReminders();
    const interval = setInterval(checkReminders, 10000);
    return () => clearInterval(interval);
  }, [plans, activeAlarmPlan]);

  // Plan Handlers
  const handleSavePlan = (planData: Omit<PlanItem, 'id' | 'createdAt'> & { id?: string }) => {
    if (planData.id) {
      // Edit
      setPlans((prev) =>
        prev.map((p) =>
          p.id === planData.id
            ? {
                ...p,
                ...planData,
                reminderTriggered: false, // Reset trigger flag on edit
              }
            : p
        )
      );
    } else {
      // Create new
      const newPlan: PlanItem = {
        ...planData,
        id: 'plan-' + Date.now(),
        createdAt: new Date().toISOString(),
        reminderTriggered: false,
      };
      setPlans((prev) => [newPlan, ...prev]);
    }
  };

  const handleToggleComplete = (id: string) => {
    setPlans((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const nextCompleted = !p.completed;
          return {
            ...p,
            completed: nextCompleted,
            completedAt: nextCompleted ? new Date().toISOString() : undefined,
          };
        }
        return p;
      })
    );
  };

  const handleDeletePlan = (id: string) => {
    setPlans((prev) => prev.filter((p) => p.id !== id));
  };

  const handleOpenEdit = (plan: PlanItem) => {
    setEditingPlan(plan);
    setInitialFormDate(undefined);
    setIsFormOpen(true);
  };

  const handleOpenNewForDate = (dateStr?: string) => {
    setEditingPlan(null);
    setInitialFormDate(dateStr);
    setIsFormOpen(true);
  };

  // Alarm Actions
  const handleDismissAlarm = (planId: string) => {
    setActiveAlarmPlan(null);
  };

  const handleSnoozeAlarm = (planId: string, minutes: number) => {
    const snoozedTime = new Date(Date.now() + minutes * 60 * 1000).toISOString();
    setPlans((prev) =>
      prev.map((p) =>
        p.id === planId ? { ...p, reminderSnoozedUntil: snoozedTime, reminderTriggered: false } : p
      )
    );
    setActiveAlarmPlan(null);
  };

  const handleCompleteAlarm = (planId: string) => {
    handleToggleComplete(planId);
    setActiveAlarmPlan(null);
  };

  // Category Actions
  const handleAddCategory = (catData: Omit<Category, 'id'>) => {
    const newCat: Category = {
      ...catData,
      id: 'cat-' + Date.now(),
    };
    setCategories((prev) => [...prev, newCat]);
  };

  const handleDeleteCategory = (catId: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== catId));
  };

  // Filter & Sorting Logic
  const filteredAndSortedPlans = React.useMemo(() => {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate()
    ).padStart(2, '0')}`;

    return plans
      .filter((plan) => {
        // Search query filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = plan.title.toLowerCase().includes(q);
          const matchDesc = plan.description?.toLowerCase().includes(q);
          const matchTag = plan.tags?.some((t) => t.toLowerCase().includes(q));
          if (!matchTitle && !matchDesc && !matchTag) return false;
        }

        // Category Filter
        if (selectedCategoryId && plan.categoryId !== selectedCategoryId) {
          return false;
        }

        // Status Filter
        if (filterStatus === 'today') {
          return plan.dueDate === todayStr;
        }
        if (filterStatus === 'upcoming') {
          return !plan.completed;
        }
        if (filterStatus === 'overdue') {
          if (plan.completed) return false;
          const [y, m, d] = plan.dueDate.split('-').map(Number);
          const [h, min] = (plan.dueTime || '23:59').split(':').map(Number);
          const targetTime = new Date(y, m - 1, d, h, min).getTime();
          return now.getTime() > targetTime;
        }
        if (filterStatus === 'completed') {
          return plan.completed;
        }

        return true;
      })
      .sort((a, b) => {
        let cmp = 0;
        if (sortBy === 'priority') {
          const weightA = PRIORITY_MAP[a.priority]?.weight || 4;
          const weightB = PRIORITY_MAP[b.priority]?.weight || 4;
          cmp = weightA - weightB;
        } else if (sortBy === 'dueDate') {
          const dateA = `${a.dueDate} ${a.dueTime || '00:00'}`;
          const dateB = `${b.dueDate} ${b.dueTime || '00:00'}`;
          cmp = dateA.localeCompare(dateB);
        } else if (sortBy === 'createdAt') {
          cmp = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        } else if (sortBy === 'title') {
          cmp = a.title.localeCompare(b.title, 'zh-CN');
        }

        return sortOrder === 'asc' ? cmp : -cmp;
      });
  }, [plans, searchQuery, selectedCategoryId, filterStatus, sortBy, sortOrder]);

  // Counts for header tabs
  const planCounts = React.useMemo(() => {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate()
    ).padStart(2, '0')}`;

    let overdue = 0;
    let today = 0;
    let upcoming = 0;
    let completed = 0;

    plans.forEach((p) => {
      if (p.completed) {
        completed++;
      } else {
        upcoming++;
        if (p.dueDate === todayStr) today++;

        const [y, m, d] = p.dueDate.split('-').map(Number);
        const [h, min] = (p.dueTime || '23:59').split(':').map(Number);
        const targetTime = new Date(y, m - 1, d, h, min).getTime();
        if (now.getTime() > targetTime) overdue++;
      }
    });

    return { all: plans.length, today, upcoming, overdue, completed };
  }, [plans]);

  return (
    <div className="min-h-screen bg-[#F8F6F0] dark:bg-[#1C1B18] text-[#2D2A26] dark:text-[#F2EFE9] flex flex-col items-center justify-start selection:bg-[#C86D51] selection:text-white font-sans">
      {/* Outer Shell Wrapper */}
      <div
        className={`w-full transition-all duration-300 ${
          isAndroidFrame
            ? 'max-w-md my-0 sm:my-6 rounded-[40px] border-[10px] border-[#2D2A26] dark:border-[#3F3B35] shadow-2xl bg-[#FAF8F3] dark:bg-[#262420] overflow-hidden min-h-[92vh] relative ring-1 ring-[#E5E0D3] dark:ring-[#3F3B35]'
            : 'max-w-xl min-h-screen bg-[#FAF8F3] dark:bg-[#262420] shadow-xl border-x border-[#E5E0D3] dark:border-[#3F3B35]'
        } flex flex-col justify-between`}
      >
        {/* Top Camera Notch cutout for Android Phone mode */}
        {isAndroidFrame && (
          <div className="w-24 h-4 bg-[#2D2A26] dark:bg-[#1C1B18] rounded-b-xl mx-auto absolute top-0 left-1/2 -translate-x-1/2 z-40 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-[#1C1B18] dark:bg-[#302D28]" />
          </div>
        )}

        {/* Top Header & Navigation */}
        <HeaderBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          showSearch={showSearch}
          setShowSearch={setShowSearch}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          sortBy={sortBy}
          setSortBy={setSortBy}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
          unreadRemindersCount={planCounts.overdue}
          openNotificationCenter={() => setIsNotifCenterOpen(true)}
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
          isAndroidFrame={isAndroidFrame}
          setIsAndroidFrame={setIsAndroidFrame}
          planCounts={planCounts}
        />

        {/* Main Content View Switcher */}
        <main className="flex-1 p-4 overflow-y-auto no-scrollbar space-y-4">
          {/* Category Chip Bar (If in List or Category View) */}
          {(currentView === 'list' || currentView === 'categories') && (
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
              <button
                onClick={() => setSelectedCategoryId(null)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold shrink-0 transition-all border ${
                  selectedCategoryId === null
                    ? 'bg-[#C86D51] text-white border-[#C86D51] shadow-sm'
                    : 'bg-[#F1EDE4] text-[#7C776E] dark:bg-[#302D28] dark:text-[#A39E93] hover:text-[#2D2A26] border-[#E5E0D3] dark:border-[#3F3B35]'
                }`}
              >
                全部分类 ({plans.length})
              </button>
              {categories.map((cat) => {
                const count = plans.filter((p) => p.categoryId === cat.id).length;
                const isSelected = selectedCategoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategoryId(isSelected ? null : cat.id)}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold shrink-0 transition-all flex items-center gap-1.5 border ${
                      isSelected
                        ? 'bg-[#2D2A26] text-white dark:bg-[#F2EFE9] dark:text-[#1C1B18] border-[#2D2A26] dark:border-[#F2EFE9] shadow-sm'
                        : 'bg-[#F1EDE4] text-[#7C776E] dark:bg-[#302D28] dark:text-[#A39E93] hover:text-[#2D2A26] border-[#E5E0D3] dark:border-[#3F3B35]'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                    {cat.name} ({count})
                  </button>
                );
              })}
            </div>
          )}

          {/* LIST VIEW */}
          {currentView === 'list' && (
            <div className="space-y-3">
              {filteredAndSortedPlans.length === 0 ? (
                <div className="text-center py-16 px-4 bg-[#F1EDE4]/50 dark:bg-[#1C1B18]/50 rounded-3xl border border-dashed border-[#E5E0D3] dark:border-[#3F3B35] space-y-3">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-[#F1EDE4] dark:bg-[#302D28] flex items-center justify-center text-[#7C776E] dark:text-[#A39E93]">
                    <Inbox className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#2D2A26] dark:text-[#F2EFE9]">暂无符合条件的计划日程</h3>
                    <p className="text-xs text-[#7C776E] dark:text-[#A39E93] mt-1">
                      {searchQuery ? '尝试清除搜索关键词或重置筛选规则' : '点击底部 (+) 按钮添加新的计划与定时提醒'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleOpenNewForDate()}
                    className="px-4 py-2 bg-[#C86D51] hover:bg-[#B55B40] text-white text-xs font-bold rounded-xl shadow-md shadow-[#C86D51]/20 transition-all inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    新建第一个计划
                  </button>
                </div>
              ) : (
                filteredAndSortedPlans.map((plan) => (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    categories={categories}
                    onToggleComplete={handleToggleComplete}
                    onEdit={handleOpenEdit}
                    onDelete={handleDeletePlan}
                    onTriggerAlarmTest={(p) => setActiveAlarmPlan(p)}
                  />
                ))
              )}
            </div>
          )}

          {/* CALENDAR VIEW */}
          {currentView === 'calendar' && (
            <CalendarView
              plans={plans}
              categories={categories}
              onToggleComplete={handleToggleComplete}
              onEditPlan={handleOpenEdit}
              onDeletePlan={handleDeletePlan}
              onAddPlanForDate={handleOpenNewForDate}
            />
          )}

          {/* CATEGORIES MANAGEMENT VIEW */}
          {currentView === 'categories' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-white dark:bg-[#262420] p-4 rounded-2xl border border-[#E5E0D3] dark:border-[#3F3B35]">
                <div>
                  <h2 className="text-sm font-bold text-[#2D2A26] dark:text-[#F2EFE9]">分类标签概览</h2>
                  <p className="text-xs text-[#7C776E] dark:text-[#A39E93]">点击按钮可自定义分类色彩与规则</p>
                </div>
                <button
                  onClick={() => setIsCatManagerOpen(true)}
                  className="px-3 py-1.5 bg-[#C86D51] text-white font-bold text-xs rounded-xl flex items-center gap-1 shadow-sm hover:bg-[#B55B40]"
                >
                  <Plus className="w-4 h-4" />
                  管理分类
                </button>
              </div>

              {/* Categorized List Blocks */}
              {categories.map((cat) => {
                const catPlans = plans.filter((p) => p.categoryId === cat.id);
                return (
                  <div
                    key={cat.id}
                    className="bg-white dark:bg-[#262420] rounded-2xl p-4 border border-[#E5E0D3] dark:border-[#3F3B35] space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-[#F1EDE4] dark:border-[#302D28] pb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                        <h3 className="text-sm font-bold text-[#2D2A26] dark:text-[#F2EFE9]">{cat.name}</h3>
                      </div>
                      <span className="text-xs text-[#7C776E] dark:text-[#A39E93] font-medium">共 {catPlans.length} 项</span>
                    </div>

                    {catPlans.length === 0 ? (
                      <p className="text-xs text-[#7C776E] dark:text-[#A39E93] py-2 text-center">暂无此分类的计划</p>
                    ) : (
                      <div className="space-y-2">
                        {catPlans.map((plan) => (
                          <PlanCard
                            key={plan.id}
                            plan={plan}
                            categories={categories}
                            onToggleComplete={handleToggleComplete}
                            onEdit={handleOpenEdit}
                            onDelete={handleDeletePlan}
                            onTriggerAlarmTest={(p) => setActiveAlarmPlan(p)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* STATS VIEW */}
          {currentView === 'stats' && (
            <StatsDrawer
              plans={plans}
              categories={categories}
              onImportData={(imported) => setPlans(imported)}
            />
          )}
        </main>

        {/* Bottom Navigation */}
        <BottomNav
          currentView={currentView}
          setCurrentView={setCurrentView}
          onOpenNewPlan={() => handleOpenNewForDate()}
          unreadCount={planCounts.overdue}
        />
      </div>

      {/* Modals & Overlays */}
      <PlanFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSavePlan}
        editingPlan={editingPlan}
        categories={categories}
        onOpenCategoryManager={() => setIsCatManagerOpen(true)}
        initialDate={initialFormDate}
      />

      <CategoryManagerModal
        isOpen={isCatManagerOpen}
        onClose={() => setIsCatManagerOpen(false)}
        categories={categories}
        plans={plans}
        onAddCategory={handleAddCategory}
        onDeleteCategory={handleDeleteCategory}
      />

      <NotificationCenterModal
        isOpen={isNotifCenterOpen}
        onClose={() => setIsNotifCenterOpen(false)}
        plans={plans}
        onTriggerTestAlarm={(plan) => setActiveAlarmPlan(plan)}
        onMarkComplete={handleToggleComplete}
      />

      {/* Active Alarm / Reminder Modal */}
      <AlarmModal
        activeAlarmPlan={activeAlarmPlan}
        categories={categories}
        onDismiss={handleDismissAlarm}
        onSnooze={handleSnoozeAlarm}
        onComplete={handleCompleteAlarm}
      />
    </div>
  );
}
