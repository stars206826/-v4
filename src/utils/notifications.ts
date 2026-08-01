import { PlanItem } from '../types';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

export async function requestNotificationPermission(): Promise<boolean> {
  if (Capacitor.isNativePlatform()) {
    try {
      // Create high-importance channel on Android first
      await LocalNotifications.createChannel({
        id: 'default_reminders',
        name: '计划日程提醒',
        description: '日程到期时的定时提醒消息',
        importance: 5, // High importance for heads-up banner & sound
        visibility: 1, // Public on lockscreen
        vibration: true,
        lights: true,
        lightColor: '#C86D51',
      }).catch((err) => console.warn('Channel creation error:', err));

      const result = await LocalNotifications.requestPermissions();
      return result.display === 'granted';
    } catch (e) {
      console.warn('Native request permission error:', e);
      return false;
    }
  }

  // Fallback to web
  if (!('Notification' in window)) {
    return false;
  }
  if (Notification.permission === 'granted') {
    return true;
  }
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return false;
}

export function sendDesktopNotification(title: string, body: string, icon?: string) {
  // Web fallback for actively open app desktop notifications
  if (!Capacitor.isNativePlatform() && 'Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon: icon || '/favicon.ico',
        tag: 'web-reminder-' + Date.now(),
        requireInteraction: true,
      });
    } catch (e) {
      console.warn('Desktop notification error:', e);
    }
  }
}

// Generate a numeric ID from a string to use as Capacitor Notification ID
function hashStringToInt(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

export async function syncNativeNotifications(plans: PlanItem[]) {
  if (!Capacitor.isNativePlatform()) {
    return; // Only sync on Native Android/iOS
  }

  try {
    // 1. Ensure channel exists
    await LocalNotifications.createChannel({
      id: 'default_reminders',
      name: '计划日程提醒',
      description: '日程到期时的定时提醒消息',
      importance: 5,
      visibility: 1,
      vibration: true,
      lights: true,
      lightColor: '#C86D51',
    }).catch(() => {});

    // 2. Cancel all previously scheduled notifications
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel({ notifications: pending.notifications });
    }

    // 3. Schedule new notifications
    const now = new Date().getTime();
    const notificationsToSchedule = [];

    for (const plan of plans) {
      if (plan.completed || !plan.reminderEnabled || plan.reminderTriggered) continue;

      let scheduleTime: Date | null = null;
      if (plan.reminderSnoozedUntil) {
        scheduleTime = new Date(plan.reminderSnoozedUntil);
      } else if (plan.dueDate && plan.dueTime) {
        const [year, month, day] = plan.dueDate.split('-').map(Number);
        const [hours, minutes] = plan.dueTime.split(':').map(Number);
        scheduleTime = new Date(year, month - 1, day, hours, minutes, 0, 0);
      }

      if (scheduleTime && scheduleTime.getTime() > now) {
        notificationsToSchedule.push({
          id: hashStringToInt(plan.id),
          title: `⏰ 计划提醒到点: ${plan.title}`,
          body: `时间: ${plan.dueTime} | 优先级: ${plan.priority}`,
          channelId: 'default_reminders',
          schedule: { 
            at: scheduleTime,
            allowWhileIdle: true // Allow triggering during Android Doze mode / closed app
          },
          actionTypeId: '',
          extra: { planId: plan.id }
        });
      }
    }

    if (notificationsToSchedule.length > 0) {
      await LocalNotifications.schedule({ notifications: notificationsToSchedule });
      console.log('Scheduled native notifications:', notificationsToSchedule.length);
    }
  } catch (e) {
    console.warn('Failed to sync native notifications', e);
  }
}

// Checks if a plan item is due right now (or past due and hasn't been triggered yet)
export function isPlanDueNow(plan: PlanItem, now = new Date()): boolean {
  if (plan.completed || !plan.reminderEnabled || plan.reminderTriggered) {
    return false;
  }

  if (plan.reminderSnoozedUntil) {
    const snoozedTime = new Date(plan.reminderSnoozedUntil).getTime();
    return now.getTime() >= snoozedTime;
  }

  if (!plan.dueDate || !plan.dueTime) return false;

  const [year, month, day] = plan.dueDate.split('-').map(Number);
  const [hours, minutes] = plan.dueTime.split(':').map(Number);

  const planDateTime = new Date(year, month - 1, day, hours, minutes, 0, 0);

  const diffMs = now.getTime() - planDateTime.getTime();
  return diffMs >= 0 && diffMs <= 1000 * 60 * 60 * 24;
}

export function formatFriendlyDate(dueDateStr: string, dueTimeStr?: string): { text: string; isOverdue: boolean; isToday: boolean } {
  if (!dueDateStr) return { text: '无日期', isOverdue: false, isToday: false };

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [y, m, d] = dueDateStr.split('-').map(Number);
  const targetDate = new Date(y, m - 1, d);

  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

  let timePart = dueTimeStr ? ` ${dueTimeStr}` : '';
  let isOverdue = false;
  let isToday = false;

  let text = '';
  if (diffDays === 0) {
    text = `今天${timePart}`;
    isToday = true;

    if (dueTimeStr) {
      const [h, min] = dueTimeStr.split(':').map(Number);
      const targetTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, min);
      if (now.getTime() > targetTime.getTime()) {
        isOverdue = true;
      }
    }
  } else if (diffDays === 1) {
    text = `明天${timePart}`;
  } else if (diffDays === 2) {
    text = `后天${timePart}`;
  } else if (diffDays === -1) {
    text = `昨天${timePart}`;
    isOverdue = true;
  } else if (diffDays < -1) {
    text = `已逾期 ${Math.abs(diffDays)} 天${timePart}`;
    isOverdue = true;
  } else if (diffDays < 7) {
    const weekNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    text = `${weekNames[targetDate.getDay()]}${timePart}`;
  } else {
    text = `${dueDateStr}${timePart}`;
  }

  return { text, isOverdue, isToday };
}
