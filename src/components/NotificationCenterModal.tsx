import React from 'react';
import { X, Bell, Check, Clock, Volume2, ShieldAlert } from 'lucide-react';
import { PlanItem } from '../types';
import { formatFriendlyDate, requestNotificationPermission } from '../utils/notifications';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  plans: PlanItem[];
  onTriggerTestAlarm: (plan: PlanItem) => void;
  onMarkComplete: (planId: string) => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  plans,
  onTriggerTestAlarm,
  onMarkComplete,
}) => {
  const [hasPermission, setHasPermission] = React.useState<boolean>(
    typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted'
  );

  if (!isOpen) return null;

  const handleRequestPerm = async () => {
    const granted = await requestNotificationPermission();
    setHasPermission(granted);
  };

  // Find upcoming reminders (active plans with reminder enabled)
  const activeReminders = plans.filter((p) => !p.completed && p.reminderEnabled);

  return (
    <div className="fixed inset-0 z-50 bg-[#1C1B18]/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="w-full max-w-md bg-white dark:bg-[#262420] rounded-3xl shadow-2xl border border-[#E5E0D3] dark:border-[#3F3B35] p-6 flex flex-col space-y-4 max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E5E0D3] dark:border-[#3F3B35]">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#C86D51]" />
            <h2 className="text-base font-bold text-[#2D2A26] dark:text-[#F2EFE9]">通知与提醒中心</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#7C776E] hover:text-[#2D2A26] dark:hover:text-[#F2EFE9] rounded-full hover:bg-[#F1EDE4] dark:hover:bg-[#302D28]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* System Permission Switch Card */}
        <div className="p-3.5 bg-[#FAF8F3] dark:bg-[#1C1B18] rounded-2xl border border-[#E5E0D3] dark:border-[#3F3B35] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-[#60775A] shrink-0" />
            <div>
              <span className="text-xs font-bold text-[#2D2A26] dark:text-[#F2EFE9] block">
                系统桌面通知权限
              </span>
              <span className="text-[10px] text-[#7C776E] dark:text-[#A39E93]">
                {hasPermission ? '已授权：到达时间后自动弹出提示' : '点击开启以获取实时浏览器提醒'}
              </span>
            </div>
          </div>

          {!hasPermission ? (
            <button
              onClick={handleRequestPerm}
              className="px-3 py-1.5 bg-[#C86D51] hover:bg-[#B55B40] text-white text-xs font-bold rounded-xl shrink-0"
            >
              请求授权
            </button>
          ) : (
            <span className="text-[11px] font-bold text-[#60775A] dark:text-[#81A078] bg-[#60775A]/10 px-2 py-0.5 rounded-full border border-[#60775A]/30">
              已开启
            </span>
          )}
        </div>

        {/* Upcoming Reminders List */}
        <div className="flex-1 overflow-y-auto no-scrollbar space-y-2 pr-1">
          <span className="text-xs font-bold text-[#7C776E] dark:text-[#A39E93] block mb-1">
            已开启的定时提醒项目 ({activeReminders.length})
          </span>

          {activeReminders.length === 0 ? (
            <div className="text-center py-8 text-[#7C776E] text-xs space-y-1">
              <Clock className="w-8 h-8 mx-auto opacity-30" />
              <p>暂无设置到点提醒的计划</p>
            </div>
          ) : (
            activeReminders.map((plan) => {
              const { text: dateText, isOverdue } = formatFriendlyDate(plan.dueDate, plan.dueTime);
              return (
                <div
                  key={plan.id}
                  className="p-3 rounded-2xl bg-[#FAF8F3] dark:bg-[#1C1B18] border border-[#E5E0D3] dark:border-[#3F3B35] flex items-center justify-between gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-bold text-[#2D2A26] dark:text-[#F2EFE9] block truncate">
                      {plan.title}
                    </span>
                    <span
                      className={`text-[11px] font-semibold flex items-center gap-1 ${
                        isOverdue ? 'text-[#C05238]' : 'text-[#60775A] dark:text-[#81A078]'
                      }`}
                    >
                      <Clock className="w-3 h-3" />
                      {dateText}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => onTriggerTestAlarm(plan)}
                      className="p-1.5 text-[#B57C2A] hover:text-[#94621E] bg-[#FAF3E5] dark:bg-[#382B1B] rounded-lg text-xs font-medium border border-[#F2DEB9] dark:border-[#574328] flex items-center gap-1"
                      title="试听响铃"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      试听
                    </button>
                    <button
                      onClick={() => onMarkComplete(plan.id)}
                      className="p-1.5 text-[#60775A] hover:text-[#4F7347] bg-[#FAF8F3] dark:bg-[#1C1B18] rounded-lg text-xs font-medium border border-[#E5E0D3] dark:border-[#3F3B35] flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      完成
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
