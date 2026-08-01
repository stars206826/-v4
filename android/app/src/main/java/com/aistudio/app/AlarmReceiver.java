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
        Log.d(TAG, "AlarmReceiver triggered on desktop!");

        PowerManager powerManager = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
        PowerManager.WakeLock wakeLock = powerManager.newWakeLock(
                PowerManager.SCREEN_BRIGHT_WAKE_LOCK | PowerManager.ACQUIRE_CAUSES_WAKEUP,
                "aistudio:desktop_popup_wakelock"
        );
        wakeLock.acquire(15 * 1000L); // 15 seconds

        try {
            String title = intent.getStringExtra("title");
            String body = intent.getStringExtra("body");
            int notifId = intent.getIntExtra("notifId", (int) System.currentTimeMillis());

            if (title == null) title = "⏰ 计划提醒";
            if (body == null) body = "您有一个待办计划到期了";

            // 1. Launch the Desktop Pop-up Window Activity immediately (Silent)
            Intent alertIntent = new Intent(context, AlarmAlertActivity.class);
            alertIntent.putExtra("title", title);
            alertIntent.putExtra("body", body);
            alertIntent.putExtra("notifId", notifId);
            alertIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            context.startActivity(alertIntent);

            // 2. Also post a SILENT notification as backup in notification shade
            createSilentNotificationChannel(context);
            showSilentNotification(context, notifId, title, body);

        } catch (Exception e) {
            Log.e(TAG, "Error popping up alarm alert activity", e);
        } finally {
            if (wakeLock.isHeld()) {
                wakeLock.release();
            }
        }
    }

    private void createSilentNotificationChannel(Context context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager manager = context.getSystemService(NotificationManager.class);
            if (manager.getNotificationChannel(CHANNEL_ID) != null) {
                return;
            }

            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "静音桌面提醒",
                    NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("到期时的静音桌面弹窗提醒");
            channel.enableLights(true);
            channel.setLightColor(0xFFC86D51);
            channel.setSound(null, null); // Completely silent as requested
            channel.enableVibration(false); // Silent
            channel.setLockscreenVisibility(NotificationCompat.VISIBILITY_PUBLIC);

            manager.createNotificationChannel(channel);
        }
    }

    private void showSilentNotification(Context context, int notifId, String title, String body) {
        NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);

        Intent alertIntent = new Intent(context, AlarmAlertActivity.class);
        alertIntent.putExtra("title", title);
        alertIntent.putExtra("body", body);
        alertIntent.putExtra("notifId", notifId);
        alertIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);

        PendingIntent contentIntent = PendingIntent.getActivity(
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
                .setSound(null) // Silent
                .setVibrate(null) // Silent
                .setAutoCancel(true)
                .setContentIntent(contentIntent)
                .setFullScreenIntent(contentIntent, true); // Heads-up / Pop-up window

        manager.notify(notifId, builder.build());
    }

    public static void scheduleAlarm(Context context, int notifId, String title, String body, long triggerAtMillis) {
        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);

        Intent intent = new Intent(context, AlarmAlertActivity.class);
        intent.putExtra("title", title);
        intent.putExtra("body", body);
        intent.putExtra("notifId", notifId);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);

        PendingIntent pendingIntent = PendingIntent.getActivity(
                context,
                notifId,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

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
        Intent intent = new Intent(context, AlarmAlertActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(
                context,
                notifId,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        alarmManager.cancel(pendingIntent);
    }
}
