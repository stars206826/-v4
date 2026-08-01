import { PlanItem } from '../types';
import { Capacitor, registerPlugin } from '@capacitor/core';

// Register our custom native alarm plugin
interface NativeAlarmPlugin {
  scheduleAlarm(options: { notifId: number; title: string; body: string; triggerAt: number }): Promise<{ success: boolean }>;
  cancelAlarm(options: { notifId: number }): Promise<{ success: boolean }>;
  cancelAllAlarms(): Promise<{ success: boolean; cancelled: number }>;
  testNotification(): Promise<{ success: boolean; message: string }>;
}

const NativeAlarm = registerPlugin<NativeAlarmPlugin>('NativeAlarm');

// Generate a stable numeric ID from a string
function hashStringToInt(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  // Ensure positive and non-zero (Android notification ID 0 can cause issues)
  return Math.abs(hash) || 1;
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (Capacitor.isNativePlatform()) {
    try {
      // On Android 13+, POST_NOTIFICATIONS is a runtime permission.
      // Capacitor's core handles this, but we also send a test notification
      // to force-create the channel and verify everything works.
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      const result = await LocalNotifications.requestPermissions();
      const granted = result.display === 'granted';

      if (granted) {
        // Send a quick test to verify our native alarm pipeline works
        try {
          await NativeAlarm.testNotification();
          console.log('Native alarm test scheduled successfully');
        } catch (e) {
          console.warn('Native alarm test failed:', e);
        }
      }

      return granted;
    } catch (e) {
      console.warn('Native request permission error:', e);
      return false;
    }
  }

  // Web fallback
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return false;
}

export function sendDesktopNotification(title: string, body: string, icon?: string) {
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

/**
 * Sync all plan reminders to native Android AlarmManager.
 * Uses setAlarmClock() which is the MOST reliable method -
 * it bypasses Doze mode, battery optimization, and works even when app is force-killed.
 */
export async function syncNativeNotifications(plans: PlanItem[]) {
  if (!Capacitor.isNativePlatform()) return;

  try {
    // 1. Cancel all existing alarms
    await NativeAlarm.cancelAllAlarms();
    console.log('[syncNativeNotifications] Cancelled all existing alarms');

    // 2. Schedule new alarms for upcoming plans
    const now = Date.now();
    let scheduled = 0;

    for (const plan of plans) {
      // Only schedule for incomplete plans with reminders enabled
      if (plan.completed || !plan.reminderEnabled) continue;
      // DO NOT check reminderTriggered here - native alarms are independent of in-app state

      let triggerAt: number | null = null;

      if (plan.reminderSnoozedUntil) {
        triggerAt = new Date(plan.reminderSnoozedUntil).getTime();
      } else if (plan.dueDate && plan.dueTime) {
        const [year, month, day] = plan.dueDate.split('-').map(Number);
        const [hours, minutes] = plan.dueTime.split(':').map(Number);
        triggerAt = new Date(year, month - 1, day, hours, minutes, 0, 0).getTime();
      }

      // Only schedule future alarms
      if (triggerAt && triggerAt > now) {
        const notifId = hashStringToInt(plan.id);
        const title = `⏰ ${plan.title}`;
        const body = `📅 到期时间: ${plan.dueTime} · 优先级: ${plan.priority}`;

        try {
          await NativeAlarm.scheduleAlarm({ notifId, title, body, triggerAt });
          scheduled++;
          console.log(`[syncNativeNotifications] Scheduled: "${plan.title}" at ${new Date(triggerAt).toLocaleString()}, id=${notifId}`);
        } catch (err) {
          console.warn(`[syncNativeNotifications] Failed to schedule "${plan.title}":`, err);
        }
      }
    }

    console.log(`[syncNativeNotifications] Total scheduled: ${scheduled}`);
  } catch (e) {
    console.warn('[syncNativeNotifications] Error:', e);
  }
}

// ============ Original utility functions below (unchanged) ============

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
