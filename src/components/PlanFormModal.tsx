import React from 'react';
import {
  X,
  Calendar as CalendarIcon,
  Clock,
  Tag,
  Bell,
  Repeat,
  AlignLeft,
  Plus,
  FolderPlus,
} from 'lucide-react';
import { Category, PlanItem, PriorityLevel } from '../types';
import { PRIORITY_MAP } from '../data/initialData';

interface PlanFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (plan: Omit<PlanItem, 'id' | 'createdAt'> & { id?: string }) => void;
  editingPlan?: PlanItem | null;
  categories: Category[];
  onOpenCategoryManager: () => void;
  initialDate?: string;
}

export const PlanFormModal: React.FC<PlanFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingPlan,
  categories,
  onOpenCategoryManager,
  initialDate,
}) => {
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [dueDate, setDueDate] = React.useState('');
  const [dueTime, setDueTime] = React.useState('');
  const [priority, setPriority] = React.useState<PriorityLevel>('P2');
  const [categoryId, setCategoryId] = React.useState(categories[0]?.id || 'work');
  const [reminderEnabled, setReminderEnabled] = React.useState(true);
  const [repeat, setRepeat] = React.useState<'none' | 'daily' | 'weekly' | 'monthly'>('none');
  const [tagsInput, setTagsInput] = React.useState('');

  // Initialize form state
  React.useEffect(() => {
    if (editingPlan) {
      setTitle(editingPlan.title || '');
      setDescription(editingPlan.description || '');
      setDueDate(editingPlan.dueDate || getTodayStr());
      setDueTime(editingPlan.dueTime || '12:00');
      setPriority(editingPlan.priority || 'P2');
      setCategoryId(editingPlan.categoryId || categories[0]?.id || 'work');
      setReminderEnabled(editingPlan.reminderEnabled ?? true);
      setRepeat(editingPlan.repeat || 'none');
      setTagsInput(editingPlan.tags ? editingPlan.tags.join(', ') : '');
    } else {
      const now = new Date();
      const nextHour = new Date(now.getTime() + 60 * 60 * 1000);
      const defaultTime = `${String(nextHour.getHours()).padStart(2, '0')}:00`;

      setTitle('');
      setDescription('');
      setDueDate(initialDate || getTodayStr());
      setDueTime(defaultTime);
      setPriority('P2');
      setCategoryId(categories[0]?.id || 'work');
      setReminderEnabled(true);
      setRepeat('none');
      setTagsInput('');
    }
  }, [editingPlan, isOpen, initialDate, categories]);

  function getTodayStr() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function getTomorrowStr() {
    const d = new Date(Date.now() + 24 * 3600 * 1000);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const parsedTags = tagsInput
      .split(/[,，\s]+/)
      .map((t) => t.trim())
      .filter(Boolean);

    onSave({
      id: editingPlan?.id,
      title: title.trim(),
      description: description.trim(),
      dueDate: dueDate || getTodayStr(),
      dueTime: dueTime || '12:00',
      priority,
      categoryId,
      completed: editingPlan ? editingPlan.completed : false,
      reminderEnabled,
      repeat,
      tags: parsedTags,
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#1C1B18]/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
      <div className="w-full sm:max-w-lg bg-white dark:bg-[#262420] rounded-t-3xl sm:rounded-3xl shadow-2xl border border-[#E5E0D3] dark:border-[#3F3B35] max-h-[90vh] overflow-y-auto no-scrollbar flex flex-col transition-all">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/95 dark:bg-[#262420]/95 backdrop-blur-md px-6 py-4 border-b border-[#E5E0D3] dark:border-[#3F3B35] flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#2D2A26] dark:text-[#F2EFE9] flex items-center gap-2">
              {editingPlan ? '编辑计划日程' : '新建计划日程'}
            </h2>
            <p className="text-xs text-[#7C776E] dark:text-[#A39E93]">设定到期时间与重要程度，定时铃声提醒</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-[#7C776E] hover:text-[#2D2A26] dark:hover:text-[#F2EFE9] rounded-full hover:bg-[#F1EDE4] dark:hover:bg-[#302D28] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 flex-1">
          {/* Title Input */}
          <div>
            <label className="text-xs font-bold text-[#2D2A26] dark:text-[#F2EFE9] mb-1 block">
              计划标题 <span className="text-[#C05238]">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="例如：准备明天下午3点的月度总结会"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-[#E5E0D3] dark:border-[#3F3B35] bg-[#FAF8F3] dark:bg-[#1C1B18] text-[#2D2A26] dark:text-[#F2EFE9] text-sm focus:outline-none focus:ring-2 focus:ring-[#C86D51]/40"
              autoFocus
            />
          </div>

          {/* Priority Level Selector */}
          <div>
            <label className="text-xs font-bold text-[#2D2A26] dark:text-[#F2EFE9] mb-2 block">
              重要性级别 (四象限法)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(PRIORITY_MAP) as PriorityLevel[]).map((level) => {
                const info = PRIORITY_MAP[level];
                const isSelected = priority === level;
                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setPriority(level)}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all ${
                      isSelected
                        ? 'bg-[#FAF3E5] dark:bg-[#382B1B] border-[#C86D51] text-[#2D2A26] dark:text-[#F2EFE9] font-bold ring-2 ring-[#C86D51]/30'
                        : 'border-[#E5E0D3] dark:border-[#3F3B35] hover:bg-[#F1EDE4] dark:hover:bg-[#302D28] text-[#7C776E] dark:text-[#A39E93]'
                    }`}
                  >
                    <span className={`w-3 h-3 rounded-full ${
                      level === 'P1' ? 'bg-[#C05238]' : level === 'P2' ? 'bg-[#B57C2A]' : level === 'P3' ? 'bg-[#4F7347]' : 'bg-[#7C776E]'
                    }`} />
                    <div>
                      <span className="text-xs font-bold">{info.level}</span>
                      <span className="text-[11px] block text-[#7C776E] dark:text-[#A39E93] font-normal">
                        {info.label}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date & Time Picker */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Date */}
            <div>
              <label className="text-xs font-bold text-[#2D2A26] dark:text-[#F2EFE9] mb-1 flex items-center gap-1">
                <CalendarIcon className="w-3.5 h-3.5 text-[#C86D51]" />
                执行日期
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#E5E0D3] dark:border-[#3F3B35] bg-[#FAF8F3] dark:bg-[#1C1B18] text-[#2D2A26] dark:text-[#F2EFE9] text-sm focus:outline-none focus:ring-2 focus:ring-[#C86D51]/40"
              />
              <div className="flex gap-1.5 mt-1.5">
                <button
                  type="button"
                  onClick={() => setDueDate(getTodayStr())}
                  className="text-[10px] px-2 py-0.5 rounded bg-[#F1EDE4] dark:bg-[#302D28] hover:bg-[#FAF3E5] text-[#2D2A26] dark:text-[#F2EFE9]"
                >
                  今天
                </button>
                <button
                  type="button"
                  onClick={() => setDueDate(getTomorrowStr())}
                  className="text-[10px] px-2 py-0.5 rounded bg-[#F1EDE4] dark:bg-[#302D28] hover:bg-[#FAF3E5] text-[#2D2A26] dark:text-[#F2EFE9]"
                >
                  明天
                </button>
              </div>
            </div>

            {/* Time */}
            <div>
              <label className="text-xs font-bold text-[#2D2A26] dark:text-[#F2EFE9] mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#C86D51]" />
                提醒时间
              </label>
              <input
                type="time"
                required
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#E5E0D3] dark:border-[#3F3B35] bg-[#FAF8F3] dark:bg-[#1C1B18] text-[#2D2A26] dark:text-[#F2EFE9] text-sm focus:outline-none focus:ring-2 focus:ring-[#C86D51]/40"
              />
              <div className="flex gap-1.5 mt-1.5">
                <button
                  type="button"
                  onClick={() => setDueTime('09:00')}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-[#F1EDE4] dark:bg-[#302D28] hover:bg-[#FAF3E5] text-[#2D2A26] dark:text-[#F2EFE9]"
                >
                  09:00
                </button>
                <button
                  type="button"
                  onClick={() => setDueTime('14:00')}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-[#F1EDE4] dark:bg-[#302D28] hover:bg-[#FAF3E5] text-[#2D2A26] dark:text-[#F2EFE9]"
                >
                  14:00
                </button>
                <button
                  type="button"
                  onClick={() => setDueTime('20:00')}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-[#F1EDE4] dark:bg-[#302D28] hover:bg-[#FAF3E5] text-[#2D2A26] dark:text-[#F2EFE9]"
                >
                  20:00
                </button>
              </div>
            </div>
          </div>

          {/* Category & Custom Category */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-[#2D2A26] dark:text-[#F2EFE9]">分类标签</label>
              <button
                type="button"
                onClick={onOpenCategoryManager}
                className="text-[11px] text-[#C86D51] dark:text-[#E07A5F] hover:underline flex items-center gap-0.5"
              >
                <FolderPlus className="w-3 h-3" />
                管理分类
              </button>
            </div>
            <div className="flex items-center flex-wrap gap-2">
              {categories.map((cat) => {
                const isSelected = categoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryId(cat.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 border ${
                      isSelected
                        ? 'bg-[#2D2A26] text-white dark:bg-[#F2EFE9] dark:text-[#1C1B18] border-transparent font-bold shadow-sm'
                        : 'bg-[#F1EDE4] dark:bg-[#302D28] text-[#7C776E] dark:text-[#A39E93] border-[#E5E0D3] dark:border-[#3F3B35] hover:bg-[#E5E0D3]'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reminder Switch & Repeat options */}
          <div className="p-3 bg-[#FAF8F3] dark:bg-[#1C1B18] rounded-2xl border border-[#E5E0D3] dark:border-[#3F3B35] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-[#C86D51]" />
                <div>
                  <span className="text-xs font-bold text-[#2D2A26] dark:text-[#F2EFE9] block">
                    到达设定的时间准时响铃/通知提醒
                  </span>
                  <span className="text-[10px] text-[#7C776E] dark:text-[#A39E93]">
                    触发时播放 Android 音效并弹出警报框
                  </span>
                </div>
              </div>

              {/* Switch */}
              <button
                type="button"
                onClick={() => setReminderEnabled(!reminderEnabled)}
                className={`w-11 h-6 rounded-full transition-colors p-1 relative ${
                  reminderEnabled ? 'bg-[#C86D51]' : 'bg-[#C8C2B3] dark:bg-[#575248]'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    reminderEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Repeat Select */}
            <div className="flex items-center justify-between pt-2 border-t border-[#E5E0D3] dark:border-[#3F3B35]">
              <span className="text-xs font-medium text-[#2D2A26] dark:text-[#F2EFE9] flex items-center gap-1">
                <Repeat className="w-3.5 h-3.5 text-[#D9A05B]" />
                重复周期
              </span>
              <select
                value={repeat}
                onChange={(e) => setRepeat(e.target.value as 'none' | 'daily' | 'weekly' | 'monthly')}
                className="bg-white dark:bg-[#262420] border border-[#E5E0D3] dark:border-[#3F3B35] text-[#2D2A26] dark:text-[#F2EFE9] text-xs rounded-lg px-2 py-1 focus:outline-none"
              >
                <option value="none">不重复 (单次)</option>
                <option value="daily">每天重复</option>
                <option value="weekly">每周重复</option>
                <option value="monthly">每月重复</option>
              </select>
            </div>
          </div>

          {/* Custom Tags */}
          <div>
            <label className="text-xs font-bold text-[#2D2A26] dark:text-[#F2EFE9] mb-1 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-[#60775A]" />
              包含的子标签 (用逗号分隔)
            </label>
            <input
              type="text"
              placeholder="例如：重点, 需复核, 项目A"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[#E5E0D3] dark:border-[#3F3B35] bg-[#FAF8F3] dark:bg-[#1C1B18] text-[#2D2A26] dark:text-[#F2EFE9] text-xs focus:outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-bold text-[#2D2A26] dark:text-[#F2EFE9] mb-1 flex items-center gap-1">
              <AlignLeft className="w-3.5 h-3.5 text-[#7C776E]" />
              详细备注说明
            </label>
            <textarea
              rows={2}
              placeholder="添加相关链接、步骤清单或注意事项..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[#E5E0D3] dark:border-[#3F3B35] bg-[#FAF8F3] dark:bg-[#1C1B18] text-[#2D2A26] dark:text-[#F2EFE9] text-xs focus:outline-none resize-none"
            />
          </div>

          {/* Modal Action Buttons */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-[#E5E0D3] dark:border-[#3F3B35] text-[#2D2A26] dark:text-[#F2EFE9] text-xs font-bold hover:bg-[#F1EDE4] dark:hover:bg-[#302D28] transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#C86D51] to-[#D9A05B] hover:from-[#B55B40] hover:to-[#C88E4A] text-white text-xs font-bold shadow-md shadow-[#C86D51]/20 transition-all flex items-center justify-center gap-1"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              {editingPlan ? '保存修改' : '立即创建计划'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
