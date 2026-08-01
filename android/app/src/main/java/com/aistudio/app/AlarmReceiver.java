package com.aistudio.app;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.util.Log;

public class AlarmReceiver extends BroadcastReceiver {

    private static final String TAG = "AlarmReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        Log.d(TAG, "AlarmReceiver triggered, starting AlarmFloatingService");

        try {
            String title = intent.getStringExtra("title");
            String body = intent.getStringExtra("body");
            int notifId = intent.getIntExtra("notifId", (int) System.currentTimeMillis());

            Intent serviceIntent = new Intent(context, AlarmFloatingService.class);
            serviceIntent.putExtra("title", title);
            serviceIntent.putExtra("body", body);
            serviceIntent.putExtra("notifId", notifId);

            // In Android 8.0+, starting a background service is restricted.
            // But since this broadcast is triggered by AlarmManager.setAlarmClock,
            // the system grants a temporary exemption (10s) to start a Foreground Service or a standard Service.
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                // Because we are just showing a floating window (and not a true foreground persistent service with a foreground notification),
                // starting a normal service might crash if the exemption doesn't fully apply on heavily modified ROMs.
                // However, setAlarmClock exemption usually allows startService.
                context.startService(serviceIntent);
            } else {
                context.startService(serviceIntent);
            }

        } catch (Exception e) {
            Log.e(TAG, "Error starting AlarmFloatingService", e);
        }
    }

    public static void scheduleAlarm(Context context, int notifId, String title, String body, long triggerAtMillis) {
        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);

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
        alarmManager.cancel(pendingIntent);
    }
}
