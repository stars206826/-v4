import { PlanItem } from '../types';

export function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    return Promise.resolve(false);
  }

  if (Notification.permission === 'granted') {
    return Promise.resolve(true);
  }

  if (Notification.permission !== 'denied') {
    return Notification.requestPermission().then((permission) => permission === 'granted');
  }

  return Promise.resolve(false);
}

export function sendDesktopNotification(title: string, body: string, icon?: string) {
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon: icon || '/favicon.ico',
        tag: 'android-reminder-' + Date.now(),
        requireInteraction: true,
      });
    } catch (e) {
      console.warn('Desktop notification error:', e);
    }
  }
}

// Checks if a plan item is due right now (or past due and hasn't been triggered yet)
export function isPlanDueNow(plan: PlanItem, now = new Date()): boolean {
  if (plan.completed || !plan.reminderEnabled || plan.reminderTriggered) {
    return false;
  }

  // Handle Snoozed time first if present
  if (plan.reminderSnoozedUntil) {
    const snoozedTime = new Date(plan.reminderSnoozedUntil).getTime();
    return now.getTime() >= snoozedTime;
  }

  // Check due date & time
  if (!plan.dueDate || !plan.dueTime) return false;

  const [year, month, day] = plan.dueDate.split('-').map(Number);
  const [hours, minutes] = plan.dueTime.split(':').map(Number);

  const planDateTime = new Date(year, month - 1, day, hours, minutes, 0, 0);

  // Trigger if current time is equal to or slightly past the due time (within a reasonable window, e.g., 2 minutes past)
  const diffMs = now.getTime() - planDateTime.getTime();
  return diffMs >= 0 && diffMs <= 1000 * 60 * 60 * 24; // Up to 24h past if not marked triggered
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

    // Check if time is past today
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
