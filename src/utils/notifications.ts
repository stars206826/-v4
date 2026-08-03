import { PlanItem } from '../types';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

// Register our custom native alarm plugin
interface NativeAlarmPlugin {
  scheduleAlarm(options: { notifId: number; title: string; body: string; triggerAt: number }): Promise<{ success: boolean }>;
  cancelAlarm(options: { notifId: number }): Promise<{ success: boolean }>;
  cancelAllAlarms(): Promise<{ success: boolean; cancelled: number }>;
  testNotification(): Promise<{ success: boolean; message: string }>;
  checkPermissions(): Promise<{ canUseFullScreenIntent: boolean; canScheduleExactAlarms: boolean; notificationsEnabled: boolean }>;
  requestFullScreenIntentPermission(): Promise<void>;
  requestExactAlarmPermission(): Promise<void>;
  openAppNotificationSettings(): Promise<void>;
  canDrawOverlay(): Promise<{ canDraw: boolean }>;
  requestOverlayPermission(): Promise<void>;
}

const NativeAlarm = registerPlugin<NativeAlarmPlugin>('NativeAlarm');

export async function checkAndRequestAllPermissions(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return true;

  try {
    console.error('[TRACE] checkAndRequestAllPermissions: start');
    let perms = await NativeAlarm.checkPermissions();
    console.error('[TRACE] checkPermissions OK: ' + JSON.stringify(perms));

    // 1. Notification permission (POST_NOTIFICATIONS)
    //    On Android 13+ notifications are OFF by default and must be granted
    //    via the runtime dialog. Actually show the system dialog here
    //    (previous versions only checked and redirected to settings).
    if (!perms.notificationsEnabled) {
      try {
        const status = await LocalNotifications.requestPermissions();
        console.log('[permissions] POST_NOTIFICATIONS request result:', status.display);
      } catch (e) {
        console.warn('[permissions] requestPermissions error:', e);
      }
      // Re-check after the dialog
      perms = await NativeAlarm.checkPermissions();
      if (!perms.notificationsEnabled) {
        const ok = window.confirm('无法弹窗！请开启【通知】权限，否则您无法接收到任何提醒。是否去设置？');
        if (ok) await NativeAlarm.openAppNotificationSettings();
        return false;
      }
    }

    // 2. Full-screen intent permission (Android 14+ special permission)
    //    Without it the alarm still fires while the screen is ON (direct
    //    startActivity path), so we recommend but do NOT hard-block the toggle.
    if (!perms.canUseFullScreenIntent) {
      const ok = window.confirm('为了在锁屏/灭屏时也能直接弹窗，建议开启【全屏通知】权限。是否现在去开启？（不开启时亮屏状态下仍可正常提醒）');
      if (ok) await NativeAlarm.requestFullScreenIntentPermission();
    }

    // 3. Overlay permission ("显示在其他应用上层")
    //    On HONOR/HUAWEI devices this is what unlocks full-screen popups while
    //    the screen is ON. Non-blocking: alarms still work without it
    //    (screen-off full-screen popup + notification fallback).
    try {
      const overlay = await NativeAlarm.canDrawOverlay();
      console.error('[TRACE] overlay canDraw=' + overlay.canDraw);
      if (!overlay.canDraw) {
        const ok = window.confirm('为了在亮屏时也能直接全屏弹窗，建议授予【显示在其他应用上层】权限（荣耀/华为手机必需）。是否现在去开启？');
        if (ok) await NativeAlarm.requestOverlayPermission();
      }
    } catch (e) {
      console.warn('[TRACE] overlay check failed: ' + String(e));
    }

    // Note: native side uses AlarmManager.setAlarmClock(), which does NOT
    // require SCHEDULE_EXACT_ALARM / USE_EXACT_ALARM, so we intentionally
    // do not check or block on canScheduleExactAlarms anymore.

    return true;
  } catch (e) {
    console.error('[TRACE] checkAndRequestAllPermissions ERROR: ' + String(e));
    return true; // Fallback
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  console.error('[TRACE] requestNotificationPermission native=' + Capacitor.isNativePlatform());
  if (Capacitor.isNativePlatform()) {
    // Just trigger the new comprehensive check instead
    return checkAndRequestAllPermissions();
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
  console.error('[TRACE] syncNativeNotifications called, native=' + Capacitor.isNativePlatform() + ', plans=' + plans.length);
  if (!Capacitor.isNativePlatform()) return;

  try {
    // 1. Cancel all existing alarms
    await NativeAlarm.cancelAllAlarms();
    console.error('[TRACE] cancelAllAlarms OK');

    // 2. Schedule new alarms for upcoming plans
    const now = Date.now();
    let scheduled = 0;
    // Sequential unique ids (1,2,3...) avoid the hash-collision problem:
    // identical PendingIntent requestCodes would overwrite each other,
    // causing only the LAST scheduled alarm to fire.
    let nextNotifId = 1;

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
        const notifId = nextNotifId++;
        const title = `⏰ ${plan.title}`;
        const body = `📅 到期时间: ${plan.dueTime} · 优先级: ${plan.priority}`;

        try {
          console.error('[TRACE] scheduleAlarm: id=' + notifId + ' title=' + plan.title + ' at=' + new Date(triggerAt).toLocaleString());
          await NativeAlarm.scheduleAlarm({ notifId, title, body, triggerAt });
          scheduled++;
          console.error('[TRACE] scheduleAlarm OK id=' + notifId);
        } catch (err) {
          console.error('[TRACE] scheduleAlarm FAILED for "' + plan.title + '": ' + String(err));
        }
      }
    }

    console.error('[TRACE] sync done, total scheduled: ' + scheduled);
  } catch (e) {
    console.error('[TRACE] syncNativeNotifications ERROR: ' + String(e));
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
