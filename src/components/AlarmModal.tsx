import React from 'react';
import { Bell, CheckCircle2, Clock, X, Volume2, AlertOctagon } from 'lucide-react';
import { Category, PlanItem } from '../types';
import { PRIORITY_MAP } from '../data/initialData';
import { audioPlayer } from '../utils/audio';

interface AlarmModalProps {
  activeAlarmPlan: PlanItem | null;
  categories: Category[];
  onDismiss: (planId: string) => void;
  onSnooze: (planId: string, minutes: number) => void;
  onComplete: (planId: string) => void;
}

export const AlarmModal: React.FC<AlarmModalProps> = ({
  activeAlarmPlan,
  categories,
  onDismiss,
  onSnooze,
  onComplete,
}) => {
  const stopAudioRef = React.useRef({ current: false });

  React.useEffect(() => {
    if (activeAlarmPlan) {
      stopAudioRef.current = { current: false };
      const stopFn = audioPlayer.playAlarmLoop(stopAudioRef.current);
      return () => {
        stopAudioRef.current.current = true;
        stopFn();
      };
    }
  }, [activeAlarmPlan]);

  if (!activeAlarmPlan) return null;

  const priorityInfo = PRIORITY_MAP[activeAlarmPlan.priority] || PRIORITY_MAP.P4;
  const category = categories.find((c) => c.id === activeAlarmPlan.categoryId) || {
    name: '分类',
    color: '#10b981',
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#1C1B18]/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      <div className="w-full max-w-sm bg-[#262420] text-[#F2EFE9] rounded-3xl shadow-2xl border border-[#C86D51]/40 p-6 flex flex-col items-center text-center relative overflow-hidden animate-scaleUp">
        {/* Background Glowing Ring Effect */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#C86D51]/20 rounded-full blur-2xl animate-pulse" />
        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-[#60775A]/20 rounded-full blur-2xl animate-pulse" />

        {/* Pulsing Alarm Bell Icon */}
        <div className="relative mb-4 mt-2">
          <div className="absolute inset-0 rounded-full bg-[#C86D51]/30 animate-ping" style={{ animationDuration: '1.5s' }} />
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#C86D51] to-[#D9A05B] flex items-center justify-center text-white shadow-xl relative z-10">
            <Bell className="w-8 h-8 animate-bounce" />
          </div>
        </div>

        {/* Header Tag */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-bold text-[#D9A05B] bg-[#D9A05B]/10 px-2.5 py-0.5 rounded-full border border-[#D9A05B]/30 flex items-center gap-1">
            <Volume2 className="w-3 h-3" />
            Android 计划提醒已触发
          </span>
        </div>

        {/* Time */}
        <div className="text-2xl font-black text-white tracking-tight flex items-center gap-1.5 mb-2">
          <Clock className="w-5 h-5 text-[#D9A05B]" />
          {activeAlarmPlan.dueTime}
        </div>

        {/* Title */}
        <h2 className="text-lg font-bold text-white mb-2 leading-snug px-2">
          {activeAlarmPlan.title}
        </h2>

        {/* Description if present */}
        {activeAlarmPlan.description && (
          <p className="text-xs text-[#A39E93] bg-[#1C1B18]/80 p-3 rounded-xl mb-4 text-left w-full border border-[#3F3B35] leading-relaxed">
            {activeAlarmPlan.description}
          </p>
        )}

        {/* Priority & Category Badges */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <span className="text-xs px-2.5 py-0.5 rounded-md font-semibold bg-[#FAF3E5] dark:bg-[#382B1B] text-[#2D2A26] dark:text-[#F2EFE9]">
            {priorityInfo.level} {priorityInfo.label}
          </span>
          <span
            className="text-xs px-2.5 py-0.5 rounded-md font-medium text-[#F2EFE9] bg-[#1C1B18] border border-[#3F3B35]"
            style={{ borderLeftColor: category.color, borderLeftWidth: '3px' }}
          >
            {category.name}
          </span>
        </div>

        {/* Actions */}
        <div className="w-full space-y-2.5">
          {/* Complete */}
          <button
            type="button"
            onClick={() => onComplete(activeAlarmPlan.id)}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#C86D51] to-[#D9A05B] hover:from-[#B55B40] hover:to-[#C88E4A] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
            标记已完成
          </button>

          {/* Snooze */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onSnooze(activeAlarmPlan.id, 5)}
              className="py-2.5 rounded-xl bg-[#1C1B18] hover:bg-[#302D28] text-[#D9A05B] text-xs font-semibold border border-[#D9A05B]/30 flex items-center justify-center gap-1.5 transition-colors"
            >
              <Clock className="w-4 h-4" />
              稍后提醒 (+5分钟)
            </button>
            <button
              type="button"
              onClick={() => onDismiss(activeAlarmPlan.id)}
              className="py-2.5 rounded-xl bg-[#1C1B18] hover:bg-[#302D28] text-[#A39E93] text-xs font-semibold border border-[#3F3B35] flex items-center justify-center gap-1.5 transition-colors"
            >
              <X className="w-4 h-4" />
              关闭铃声
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
