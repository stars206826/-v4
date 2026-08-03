package com.aistudio.app;

import android.app.AlarmManager;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.PowerManager;
import android.util.Log;

import androidx.core.app.NotificationCompat;

public class AlarmReceiver extends BroadcastReceiver {

    public static final String CHANNEL_ID = "plan_reminder_silent_channel";
    private static final String TAG = "AlarmReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        Log.e(TAG, "[TRACE-A] AlarmReceiver triggered!");

        PowerManager powerManager = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
        PowerManager.WakeLock wakeLock = null;
        if (powerManager != null) {
            wakeLock = powerManager.newWakeLock(
                    PowerManager.SCREEN_BRIGHT_WAKE_LOCK | PowerManager.ACQUIRE_CAUSES_WAKEUP,
                    "aistudio:desktop_popup_wakelock"
            );
            wakeLock.acquire(15 * 1000L); // auto-releases after 15s
        }

        try {
            String title = intent.getStringExtra("title");
            String body = intent.getStringExtra("body");
            int notifId = intent.getIntExtra("notifId", (int) System.currentTimeMillis());

            if (title == null) title = "⏰ 计划提醒";
            if (body == null) body = "您有一个待办计划到期了";

            createSilentNotificationChannel(context);

            // Build the alert intent for AlarmAlertActivity
            Intent alertIntent = new Intent(context, AlarmAlertActivity.class);
            alertIntent.putExtra("title", title);
            alertIntent.putExtra("body", body);
            alertIntent.putExtra("notifId", notifId);
            alertIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);

            // PRIMARY: directly startActivity.
            // setAlarmClock grants a temporary background-activity-start exemption.
            // This works even when screen is ON and phone is unlocked,
            // where setFullScreenIntent only shows a small heads-up banner.
            try {
                Log.e(TAG, "[TRACE-A] Attempting direct startActivity for AlarmAlertActivity");
                context.startActivity(alertIntent);
                Log.e(TAG, "[TRACE-A] direct startActivity dispatched");
            } catch (Exception e) {
                Log.e(TAG, "[TRACE-A] Direct startActivity failed: " + e);
            }

            // BACKUP: post notification with full-screen intent.
            // This handles the screen-off/locked case where startActivity
            // might not wake the screen on all ROMs.
            showFullScreenNotification(context, notifId, title, body, alertIntent);

        } catch (Exception e) {
            Log.e(TAG, "Error in onReceive", e);
        }
        // NOTE: do NOT release the wake lock here. Releasing it right after
        // startActivity is dispatched lets the CPU sleep again before
        // AlarmAlertActivity finishes drawing on slow devices. The lock was
        // acquired with a 15s timeout and will auto-release by itself.
    }

    private void createSilentNotificationChannel(Context context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager manager = context.getSystemService(NotificationManager.class);
            if (manager != null && manager.getNotificationChannel(CHANNEL_ID) == null) {
                NotificationChannel channel = new NotificationChannel(
                        CHANNEL_ID,
                        "静音桌面提醒",
                        NotificationManager.IMPORTANCE_HIGH
                );
                channel.setDescription("到期时的静音桌面弹窗提醒");
                channel.enableLights(true);
                channel.setLightColor(0xFFC86D51);
                channel.setSound(null, null);
                channel.enableVibration(false);
                channel.setLockscreenVisibility(NotificationCompat.VISIBILITY_PUBLIC);

                manager.createNotificationChannel(channel);
            }
        }
    }

    private void showFullScreenNotification(Context context, int notifId, String title, String body, Intent alertIntent) {
        NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager == null) return;

        PendingIntent fullScreenIntent = PendingIntent.getActivity(
                context,
                notifId,
                alertIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID)
                .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
                .setContentTitle(title)
                .setContentText(body)
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setSound(null)
                .setVibrate(null)
                .setAutoCancel(true)
                .setContentIntent(fullScreenIntent)
                .setFullScreenIntent(fullScreenIntent, true);

        manager.notify(notifId, builder.build());
        Log.e(TAG, "[TRACE-A] fullScreenIntent notification posted, id=" + notifId);
    }

    public static void scheduleAlarm(Context context, int notifId, String title, String body, long triggerAtMillis) {
        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);

        Intent intent = new Intent(context, AlarmReceiver.class);
        intent.putExtra("title", title);
        intent.putExtra("body", body);
        intent.putExtra("notifId", notifId);

        PendingIntent pendingIntent;
        if (Build.VERSION.SDK_INT >= 34) {
            // Android 14+ requires the PendingIntent CREATOR to explicitly opt in
            // to background activity launches when the alarm fires. Without this,
            // the receiver's startActivity is blocked ("Background activity launch
            // blocked") even though setAlarmClock was used.
            android.os.Bundle piOptions = android.app.ActivityOptions.makeBasic()
                    .setPendingIntentCreatorBackgroundActivityLaunchAllowed(true)
                    .toBundle();
            pendingIntent = PendingIntent.getBroadcast(
                    context,
                    notifId,
                    intent,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE,
                    piOptions
            );
        } else {
            pendingIntent = PendingIntent.getBroadcast(
                    context,
                    notifId,
                    intent,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            AlarmManager.AlarmClockInfo alarmClockInfo = new AlarmManager.AlarmClockInfo(
                    triggerAtMillis,
                    pendingIntent
            );
            alarmManager.setAlarmClock(alarmClockInfo, pendingIntent);
        } else {
            alarmManager.setExact(AlarmManager.RTC_WAKEUP, triggerAtMillis, pendingIntent);
        }
    }

    public static void cancelAlarm(Context context, int notifId) {
        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        Intent intent = new Intent(context, AlarmReceiver.class);
        PendingIntent pendingIntent = PendingIntent.getBroadcast(
                context,
                notifId,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        if (alarmManager != null) {
            alarmManager.cancel(pendingIntent);
        }
    }
}
