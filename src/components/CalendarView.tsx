import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  Briefcase,
} from 'lucide-react';
import { Category, PlanItem } from '../types';
import { PRIORITY_MAP } from '../data/initialData';
import { PlanCard } from './PlanCard';

interface CalendarViewProps {
  plans: PlanItem[];
  categories: Category[];
  onToggleComplete: (id: string) => void;
  onEditPlan: (plan: PlanItem) => void;
  onDeletePlan: (id: string) => void;
  onAddPlanForDate: (dateStr: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  plans,
  categories,
  onToggleComplete,
  onEditPlan,
  onDeletePlan,
  onAddPlanForDate,
}) => {
  const [currentMonthDate, setCurrentMonthDate] = React.useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = React.useState<string>(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  });

  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth(); // 0 - 11

  const prevMonth = () => {
    setCurrentMonthDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonthDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentMonthDate(today);
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    setSelectedDateStr(`${y}-${m}-${d}`);
  };

  // Generate calendar days
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 = Sun

  const daysArray: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    daysArray.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    daysArray.push(day);
  }

  // Format date helper
  const formatDateString = (day: number) => {
    const mStr = String(month + 1).padStart(2, '0');
    const dStr = String(day).padStart(2, '0');
    return `${year}-${mStr}-${dStr}`;
  };

  // Group plans by date string
  const plansByDate = React.useMemo(() => {
    const map: Record<string, PlanItem[]> = {};
    plans.forEach((p) => {
      if (!map[p.dueDate]) {
        map[p.dueDate] = [];
      }
      map[p.dueDate].push(p);
    });
    return map;
  }, [plans]);

  const selectedDayPlans = plansByDate[selectedDateStr] || [];

  const todayStr = (() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate()
    ).padStart(2, '0')}`;
  })();

  return (
    <div className="space-y-4">
      {/* Calendar Header Card */}
      <div className="bg-white dark:bg-[#262420] rounded-2xl p-4 border border-[#E5E0D3] dark:border-[#3F3B35] shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-[#C86D51]" />
            <h2 className="text-base font-bold text-[#2D2A26] dark:text-[#F2EFE9]">
              {year}年 {month + 1}月
            </h2>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={goToToday}
              className="px-2.5 py-1 text-xs font-semibold bg-[#C86D51]/10 text-[#C86D51] dark:text-[#E07A5F] hover:bg-[#C86D51]/20 rounded-lg transition-colors"
            >
              今天
            </button>
            <button
              onClick={prevMonth}
              className="p-1.5 text-[#7C776E] hover:text-[#2D2A26] dark:hover:text-[#F2EFE9] rounded-lg hover:bg-[#F1EDE4] dark:hover:bg-[#302D28]"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextMonth}
              className="p-1.5 text-[#7C776E] hover:text-[#2D2A26] dark:hover:text-[#F2EFE9] rounded-lg hover:bg-[#F1EDE4] dark:hover:bg-[#302D28]"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Weekday Titles */}
        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {['日', '一', '二', '三', '四', '五', '六'].map((wk, idx) => (
            <div
              key={wk}
              className={`text-[11px] font-bold py-1 ${
                idx === 0 || idx === 6 ? 'text-[#D9A05B]' : 'text-[#7C776E]'
              }`}
            >
              {wk}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1">
          {daysArray.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="h-12 rounded-xl bg-[#F8F6F0]/50 dark:bg-[#1C1B18]/50" />;
            }

            const dateStr = formatDateString(day);
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selectedDateStr;
            const dayPlans = plansByDate[dateStr] || [];
            const hasP1 = dayPlans.some((p) => p.priority === 'P1' && !p.completed);

            return (
              <button
                key={dateStr}
                type="button"
                onClick={() => setSelectedDateStr(dateStr)}
                className={`h-12 rounded-xl p-1 relative flex flex-col items-center justify-between transition-all border ${
                  isSelected
                    ? 'bg-[#C86D51] text-white border-[#C86D51] font-bold shadow-md scale-[1.03] z-10'
                    : isToday
                    ? 'border-[#60775A] text-[#60775A] dark:text-[#81A078] font-bold bg-[#FAF3E5] dark:bg-[#382B1B]'
                    : 'border-transparent hover:bg-[#F1EDE4] dark:hover:bg-[#302D28] text-[#2D2A26] dark:text-[#F2EFE9]'
                }`}
              >
                <span className="text-xs">{day}</span>

                {/* Plan dots preview */}
                <div className="flex items-center gap-0.5 max-w-full overflow-hidden mb-0.5">
                  {dayPlans.slice(0, 3).map((p, idx) => {
                    const dotColor =
                      p.priority === 'P1'
                        ? 'bg-[#C05238]'
                        : p.priority === 'P2'
                        ? 'bg-[#D9A05B]'
                        : 'bg-[#60775A]';
                    return (
                      <span
                        key={idx}
                        className={`w-1.5 h-1.5 rounded-full ${
                          isSelected ? 'bg-white' : dotColor
                        } ${p.completed ? 'opacity-40' : 'opacity-100'}`}
                      />
                    );
                  })}
                  {dayPlans.length > 3 && (
                    <span className={`text-[8px] leading-none ${isSelected ? 'text-white' : 'text-[#7C776E]'}`}>
                      +
                    </span>
                  )}
                </div>

                {hasP1 && !isSelected && (
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-[#C05238] rounded-full animate-ping" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Day Schedule Detail Inspector */}
      <div className="bg-white dark:bg-[#262420] rounded-2xl p-4 border border-[#E5E0D3] dark:border-[#3F3B35] shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-[#F1EDE4] dark:border-[#302D28] pb-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-[#2D2A26] dark:text-[#F2EFE9]">
              {selectedDateStr} 当日计划日程
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#F1EDE4] dark:bg-[#302D28] text-[#615C53] dark:text-[#A39E93] font-medium">
              共 {selectedDayPlans.length} 项
            </span>
          </div>

          <button
            onClick={() => onAddPlanForDate(selectedDateStr)}
            className="px-3 py-1 bg-[#C86D51] hover:bg-[#B55B40] text-white font-bold text-xs rounded-xl flex items-center gap-1 shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            添加此日计划
          </button>
        </div>

        {/* Selected Day List */}
        {selectedDayPlans.length === 0 ? (
          <div className="text-center py-8 text-[#7C776E] dark:text-[#A39E93] space-y-2">
            <Briefcase className="w-8 h-8 mx-auto opacity-40" />
            <p className="text-xs">该日期暂无计划日程，点击右上角按钮添加</p>
          </div>
        ) : (
          <div className="space-y-2">
            {selectedDayPlans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                categories={categories}
                onToggleComplete={onToggleComplete}
                onEdit={onEditPlan}
                onDelete={onDeletePlan}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
