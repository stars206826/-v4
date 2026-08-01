import React from 'react';
import {
  Bell,
  BellOff,
  Check,
  Clock,
  Edit3,
  MoreVertical,
  Repeat,
  Trash2,
  AlertCircle,
  Tag,
  Briefcase,
  GraduationCap,
  Home,
  HeartPulse,
  ShoppingCart,
  Folder,
} from 'lucide-react';
import { Category, PlanItem } from '../types';
import { PRIORITY_MAP } from '../data/initialData';
import { formatFriendlyDate } from '../utils/notifications';

interface PlanCardProps {
  plan: PlanItem;
  categories: Category[];
  onToggleComplete: (id: string) => void;
  onEdit: (plan: PlanItem) => void;
  onDelete: (id: string) => void;
  onTriggerAlarmTest?: (plan: PlanItem) => void;
}

export const PlanCard: React.FC<PlanCardProps> = ({
  plan,
  categories,
  onToggleComplete,
  onEdit,
  onDelete,
  onTriggerAlarmTest,
}) => {
  const [showMenu, setShowMenu] = React.useState(false);
  const priorityInfo = PRIORITY_MAP[plan.priority] || PRIORITY_MAP.P4;
  const category = categories.find((c) => c.id === plan.categoryId) || {
    id: 'other',
    name: '其它',
    color: '#64748b',
    icon: 'Folder',
  };

  const { text: dateText, isOverdue, isToday } = formatFriendlyDate(plan.dueDate, plan.dueTime);

  // Helper icon for category
  const renderCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Briefcase':
        return <Briefcase className="w-3.5 h-3.5" />;
      case 'GraduationCap':
        return <GraduationCap className="w-3.5 h-3.5" />;
      case 'Home':
        return <Home className="w-3.5 h-3.5" />;
      case 'HeartPulse':
        return <HeartPulse className="w-3.5 h-3.5" />;
      case 'ShoppingCart':
        return <ShoppingCart className="w-3.5 h-3.5" />;
      default:
        return <Folder className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div
      className={`group relative rounded-2xl p-4 transition-all duration-200 border ${
        plan.completed
          ? 'opacity-65 border-[#E5E0D3] dark:border-[#3F3B35] bg-[#F8F6F0]/60 dark:bg-[#1C1B18]/60'
          : `bg-white dark:bg-[#262420] border-[#E5E0D3] dark:border-[#3F3B35] shadow-sm hover:shadow-md hover:border-[#C86D51]/50`
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox Button */}
        <button
          type="button"
          onClick={() => onToggleComplete(plan.id)}
          className={`mt-0.5 shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
            plan.completed
              ? 'bg-[#60775A] border-[#60775A] text-white scale-100'
              : 'border-[#C8C2B3] dark:border-[#575248] hover:border-[#60775A] dark:hover:border-[#81A078] bg-transparent'
          }`}
          title={plan.completed ? '标记为未完成' : '标记为已完成'}
        >
          {plan.completed && <Check className="w-4 h-4 stroke-[3]" />}
        </button>

        {/* Content Body */}
        <div className="flex-1 min-w-0">
          {/* Top Line: Priority & Category Pills */}
          <div className="flex items-center flex-wrap gap-1.5 mb-1.5">
            {/* Priority Badge */}
            <span
              className={`text-[11px] font-semibold px-2 py-0.5 rounded-md inline-flex items-center gap-1 ${
                plan.priority === 'P1'
                  ? 'bg-[#F7EBE8] text-[#C05238] dark:bg-[#3A221E] dark:text-[#E07A5F] border border-[#F0C9BF] dark:border-[#5C2B22]'
                  : plan.priority === 'P2'
                  ? 'bg-[#FAF3E5] text-[#B57C2A] dark:bg-[#382B1B] dark:text-[#E6B06C] border border-[#F2DEB9] dark:border-[#574328]'
                  : plan.priority === 'P3'
                  ? 'bg-[#EFF4EE] text-[#4F7347] dark:bg-[#212E1E] dark:text-[#81A078] border border-[#C8DBC4] dark:border-[#354831]'
                  : 'bg-[#F1EDE4] text-[#7C776E] dark:bg-[#302D28] dark:text-[#A39E93] border border-[#E5E0D3] dark:border-[#3F3B35]'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${
                plan.priority === 'P1' ? 'bg-[#C05238]' : plan.priority === 'P2' ? 'bg-[#B57C2A]' : plan.priority === 'P3' ? 'bg-[#4F7347]' : 'bg-[#7C776E]'
              }`} />
              {priorityInfo.level} {priorityInfo.label}
            </span>

            {/* Category Pill */}
            <span
              className="text-[11px] font-medium px-2 py-0.5 rounded-md text-[#2D2A26] dark:text-[#F2EFE9] bg-[#F1EDE4] dark:bg-[#302D28] border border-[#E5E0D3] dark:border-[#3F3B35] flex items-center gap-1"
              style={{ borderLeftColor: category.color, borderLeftWidth: '3px' }}
            >
              {renderCategoryIcon(category.icon)}
              {category.name}
            </span>

            {/* Repeat Indicator */}
            {plan.repeat && plan.repeat !== 'none' && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[#FAF3E5] text-[#B57C2A] dark:bg-[#382B1B] dark:text-[#E6B06C] border border-[#F2DEB9] dark:border-[#574328] flex items-center gap-0.5">
                <Repeat className="w-3 h-3" />
                {plan.repeat === 'daily' && '每天'}
                {plan.repeat === 'weekly' && '每周'}
                {plan.repeat === 'monthly' && '每月'}
              </span>
            )}
          </div>

          {/* Title */}
          <h3
            className={`text-sm font-semibold tracking-tight text-[#2D2A26] dark:text-[#F2EFE9] mb-1 leading-snug ${
              plan.completed ? 'line-through text-[#9E988D] dark:text-[#7C776E]' : ''
            }`}
          >
            {plan.title}
          </h3>

          {/* Description if present */}
          {plan.description && (
            <p className="text-xs text-[#615C53] dark:text-[#B5B0A5] line-clamp-2 mb-2 leading-relaxed">
              {plan.description}
            </p>
          )}

          {/* Date, Reminder & Tags Row */}
          <div className="flex items-center flex-wrap gap-2 text-xs text-[#7C776E] dark:text-[#A39E93] mt-2 pt-1 border-t border-[#F1EDE4] dark:border-[#302D28]">
            {/* Due Date Pill */}
            <div
              className={`flex items-center gap-1 font-medium px-2 py-0.5 rounded-md ${
                isOverdue && !plan.completed
                  ? 'bg-[#F7EBE8] text-[#C05238] dark:bg-[#3A221E] dark:text-[#E07A5F] border border-[#F0C9BF] dark:border-[#5C2B22] font-semibold'
                  : isToday && !plan.completed
                  ? 'bg-[#FAF3E5] text-[#C86D51] dark:bg-[#382B1B] dark:text-[#E07A5F] border border-[#F2DEB9] dark:border-[#574328]'
                  : 'bg-[#F1EDE4] dark:bg-[#302D28] text-[#615C53] dark:text-[#A39E93]'
              }`}
            >
              {isOverdue && !plan.completed ? (
                <AlertCircle className="w-3.5 h-3.5" />
              ) : (
                <Clock className="w-3.5 h-3.5" />
              )}
              <span>{dateText}</span>
            </div>

            {/* Reminder status badge */}
            <div
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] ${
                plan.reminderEnabled
                  ? 'text-[#C86D51] dark:text-[#E07A5F] bg-[#FAF3E5] dark:bg-[#382B1B]'
                  : 'text-[#9E988D]'
              }`}
              title={plan.reminderEnabled ? '已开启到点铃声与通知提醒' : '提醒已关闭'}
            >
              {plan.reminderEnabled ? (
                <>
                  <Bell className="w-3 h-3 text-[#C86D51]" />
                  <span>按时提醒</span>
                </>
              ) : (
                <BellOff className="w-3 h-3" />
              )}
            </div>

            {/* Tags */}
            {plan.tags && plan.tags.length > 0 && (
              <div className="flex items-center gap-1">
                <Tag className="w-3 h-3 text-[#7C776E]" />
                {plan.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] bg-[#F1EDE4] dark:bg-[#302D28] text-[#615C53] dark:text-[#A39E93] px-1.5 py-0.5 rounded"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action Menu Trigger */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 text-[#7C776E] hover:text-[#2D2A26] dark:hover:text-white rounded-lg hover:bg-[#F1EDE4] dark:hover:bg-[#302D28] transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {/* Dropdown Menu */}
          {showMenu && (
            <div
              className="absolute right-0 top-8 w-40 bg-white dark:bg-[#262420] rounded-xl shadow-xl border border-[#E5E0D3] dark:border-[#3F3B35] py-1.5 z-20 animate-scaleUp"
              onMouseLeave={() => setShowMenu(false)}
            >
              <button
                type="button"
                onClick={() => {
                  setShowMenu(false);
                  onEdit(plan);
                }}
                className="w-full text-left px-3 py-1.5 text-xs text-[#2D2A26] dark:text-[#F2EFE9] hover:bg-[#F1EDE4] dark:hover:bg-[#302D28] flex items-center gap-2"
              >
                <Edit3 className="w-3.5 h-3.5 text-[#C86D51]" />
                编辑计划
              </button>

              {onTriggerAlarmTest && (
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    onTriggerAlarmTest(plan);
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-[#D9A05B] dark:text-[#E6B06C] hover:bg-[#FAF3E5] dark:hover:bg-[#382B1B] flex items-center gap-2"
                >
                  <Bell className="w-3.5 h-3.5" />
                  模拟响铃提醒
                </button>
              )}

              <div className="my-1 border-t border-[#E5E0D3] dark:border-[#3F3B35]" />

              <button
                type="button"
                onClick={() => {
                  setShowMenu(false);
                  onDelete(plan.id);
                }}
                className="w-full text-left px-3 py-1.5 text-xs text-[#C05238] dark:text-[#E07A5F] hover:bg-[#F7EBE8] dark:hover:bg-[#3A221E] flex items-center gap-2 font-medium"
              >
                <Trash2 className="w-3.5 h-3.5" />
                删除计划
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
