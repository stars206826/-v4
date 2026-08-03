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

            // PRIMARY: launch AlarmAlertActivity via a PendingIntent-mediated send.
            // A direct context.startActivity() from a BroadcastReceiver is blocked by
            // Android 14+ BAL hardening ("Background activity launch blocked") on
            // HONOR devices, so instead we create an activity PendingIntent with the
            // creator-side opt-in and send it with the sender-side opt-in.
            try {
                Log.e(TAG, "[TRACE-A] Attempting PI-mediated startActivity");
                PendingIntent alertPI;
                if (Build.VERSION.SDK_INT >= 34) {
                    android.os.Bundle creatorOpts = android.app.ActivityOptions.makeBasic()
                            .setPendingIntentCreatorBackgroundActivityStartMode(
                                    android.app.ActivityOptions.MODE_BACKGROUND_ACTIVITY_START_ALLOWED)
                            .toBundle();
                    alertPI = PendingIntent.getActivity(
                            context,
                            notifId,
                            alertIntent,
                            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE,
                            creatorOpts
                    );
                    android.os.Bundle senderOpts = android.app.ActivityOptions.makeBasic()
                            .setPendingIntentBackgroundActivityStartMode(
                                    android.app.ActivityOptions.MODE_BACKGROUND_ACTIVITY_START_ALLOWED)
                            .toBundle();
                    alertPI.send(context, 0, null, null, null, null, senderOpts);
                } else {
                    alertPI = PendingIntent.getActivity(
                            context,
                            notifId,
                            alertIntent,
                            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
                    );
                    alertPI.send();
                }
                Log.e(TAG, "[TRACE-A] PI-mediated startActivity dispatched");
            } catch (Exception e) {
                Log.e(TAG, "[TRACE-A] PI-mediated startActivity failed: " + e);
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
        if (alarmManager == null) return;

        // Broadcast receiver as the alarm operation: guarantees the notification
        // is always posted (screen-off FSI full-screen popup + heads-up fallback),
        // while onReceive also attempts to launch AlarmAlertActivity directly.
        Intent intent = new Intent(context, AlarmReceiver.class);
        intent.putExtra("title", title);
        intent.putExtra("body", body);
        intent.putExtra("notifId", notifId);

        PendingIntent pendingIntent = PendingIntent.getBroadcast(
                context,
                notifId,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        AlarmManager.AlarmClockInfo alarmClockInfo = new AlarmManager.AlarmClockInfo(
                triggerAtMillis,
                pendingIntent
        );
        alarmManager.setAlarmClock(alarmClockInfo, pendingIntent);
        Log.e(TAG, "[TRACE-A] scheduleAlarm: broadcast-PI alarm set for " + triggerAtMillis + " id=" + notifId);
    }

    public static void cancelAlarm(Context context, int notifId) {
        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (alarmManager == null) return;

        // Cancel the current activity-PI alarm
        Intent alertIntent = new Intent(context, AlarmAlertActivity.class);
        alertIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent activityPI = PendingIntent.getActivity(
                context,
                notifId,
                alertIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        alarmManager.cancel(activityPI);

        // Also cancel legacy broadcast-PI alarms from older app versions
        Intent legacyIntent = new Intent(context, AlarmReceiver.class);
        PendingIntent legacyPI = PendingIntent.getBroadcast(
                context,
                notifId,
                legacyIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        alarmManager.cancel(legacyPI);
    }
}
