import { Category, PlanItem, PriorityInfo, PriorityLevel } from '../types';

export const PRIORITY_MAP: Record<PriorityLevel, PriorityInfo> = {
  P1: {
    level: 'P1',
    label: '紧急且重要',
    color: 'bg-red-500',
    badgeBg: 'bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300',
    badgeText: 'text-red-600 dark:text-red-400',
    border: 'border-l-4 border-l-red-500',
    weight: 1,
  },
  P2: {
    level: 'P2',
    label: '重要不紧急',
    color: 'bg-amber-500',
    badgeBg: 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300',
    badgeText: 'text-amber-600 dark:text-amber-400',
    border: 'border-l-4 border-l-amber-500',
    weight: 2,
  },
  P3: {
    level: 'P3',
    label: '紧急不重要',
    color: 'bg-blue-500',
    badgeBg: 'bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300',
    badgeText: 'text-blue-600 dark:text-blue-400',
    border: 'border-l-4 border-l-blue-500',
    weight: 3,
  },
  P4: {
    level: 'P4',
    label: '普通/顺便',
    color: 'bg-slate-400',
    badgeBg: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300',
    badgeText: 'text-slate-500 dark:text-slate-400',
    border: 'border-l-4 border-l-slate-300 dark:border-l-slate-600',
    weight: 4,
  },
};

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'work', name: '工作项目', icon: 'Briefcase', color: '#3b82f6' },
  { id: 'study', name: '学习提升', icon: 'GraduationCap', color: '#8b5cf6' },
  { id: 'life', name: '日常生活', icon: 'Home', color: '#10b981' },
  { id: 'health', name: '健康运动', icon: 'HeartPulse', color: '#ef4444' },
  { id: 'finance', name: '理财购物', icon: 'ShoppingCart', color: '#f59e0b' },
];

export function getInitialPlans(): PlanItem[] {
  const now = new Date();
  
  const formatDate = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatTime = (d: Date) => {
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${mins}`;
  };

  const todayStr = formatDate(now);

  // Today + 15 mins for testing reminder!
  const soonDate = new Date(now.getTime() + 15 * 60 * 1000);
  const soonTimeStr = formatTime(soonDate);

  // Today later
  const todayLater = new Date(now.getTime() + 3 * 360 * 1000);
  const todayLaterTimeStr = formatTime(todayLater);

  // Tomorrow
  const tomorrow = new Date(now.getTime() + 24 * 3600 * 1000);
  const tomorrowStr = formatDate(tomorrow);

  // Yesterday (overdue)
  const yesterday = new Date(now.getTime() - 24 * 3600 * 1000);
  const yesterdayStr = formatDate(yesterday);

  return [
    {
      id: 'plan-1',
      title: '准备季度总结汇报 PPT',
      description: '收集本月项目进度，梳理核心指标与下一步规划。',
      dueDate: todayStr,
      dueTime: soonTimeStr,
      priority: 'P1',
      categoryId: 'work',
      completed: false,
      reminderEnabled: true,
      repeat: 'none',
      tags: ['汇报', '重点'],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'plan-2',
      title: '30分钟有氧慢跑 & 拉伸',
      description: '保持身体健康，跑步后记录运动心率。',
      dueDate: todayStr,
      dueTime: todayLaterTimeStr,
      priority: 'P2',
      categoryId: 'health',
      completed: false,
      reminderEnabled: true,
      repeat: 'daily',
      tags: ['打卡', '锻炼'],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'plan-3',
      title: '阅读《TypeScript 深度进阶》',
      description: '完成第 4 章泛型与类型推导的练习题。',
      dueDate: tomorrowStr,
      dueTime: '20:00',
      priority: 'P2',
      categoryId: 'study',
      completed: false,
      reminderEnabled: true,
      repeat: 'none',
      tags: ['前端', '自我提升'],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'plan-4',
      title: '取包裹 & 购买本周生鲜蔬菜',
      description: '前往小区驿站取快递，顺便去超市采购牛奶和苹果。',
      dueDate: todayStr,
      dueTime: '18:30',
      priority: 'P3',
      categoryId: 'life',
      completed: false,
      reminderEnabled: false,
      repeat: 'none',
      tags: ['家务'],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'plan-5',
      title: '缴纳本月水电费',
      description: '在手机支付宝完成账单结清，避免停水停电。',
      dueDate: yesterdayStr,
      dueTime: '10:00',
      priority: 'P1',
      categoryId: 'finance',
      completed: false,
      reminderEnabled: true,
      repeat: 'monthly',
      tags: ['待办'],
      createdAt: new Date(now.getTime() - 48 * 3600 * 1000).toISOString(),
    },
    {
      id: 'plan-6',
      title: '晨间思考与日计划制定',
      description: '写下今天最优先要处理的三件事。',
      dueDate: todayStr,
      dueTime: '08:00',
      priority: 'P4',
      categoryId: 'life',
      completed: true,
      completedAt: new Date().toISOString(),
      reminderEnabled: true,
      repeat: 'daily',
      tags: ['习惯'],
      createdAt: new Date().toISOString(),
    },
  ];
}
