package com.aistudio.app;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import android.util.Log;
import android.app.AlarmManager;
import androidx.core.app.NotificationManagerCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Custom Capacitor plugin that bridges JS code to native Android AlarmManager.
 * This provides 100% reliable background notifications by using setAlarmClock.
 */
@CapacitorPlugin(name = "NativeAlarm")
public class NativeAlarmPlugin extends Plugin {

    private static final String TAG = "NativeAlarmPlugin";

    @PluginMethod
    public void scheduleAlarm(PluginCall call) {
        try {
            int notifId = call.getInt("notifId", 0);
            String title = call.getString("title", "⏰ 计划提醒");
            String body = call.getString("body", "您有一个待办计划到期了");
            Double triggerAtDouble = call.getDouble("triggerAt");
            long triggerAt = triggerAtDouble != null ? triggerAtDouble.longValue() : 0L;

            if (triggerAt <= System.currentTimeMillis()) {
                call.reject("triggerAt must be in the future");
                return;
            }

            Context context = getContext();
            AlarmReceiver.scheduleAlarm(context, notifId, title, body, triggerAt);

            // Persist for boot recovery
            persistAlarm(context, notifId, title, body, triggerAt);

            JSObject result = new JSObject();
            result.put("success", true);
            result.put("notifId", notifId);
            result.put("triggerAt", triggerAt);
            call.resolve(result);

            Log.d(TAG, "Alarm scheduled via plugin: id=" + notifId);
        } catch (Exception e) {
            Log.e(TAG, "Error scheduling alarm", e);
            call.reject("Error scheduling alarm: " + e.getMessage());
        }
    }

    @PluginMethod
    public void cancelAlarm(PluginCall call) {
        try {
            int notifId = call.getInt("notifId", 0);
            Context context = getContext();
            AlarmReceiver.cancelAlarm(context, notifId);
            removePersistedAlarm(context, notifId);

            JSObject result = new JSObject();
            result.put("success", true);
            call.resolve(result);
        } catch (Exception e) {
            call.reject("Error cancelling alarm: " + e.getMessage());
        }
    }

    @PluginMethod
    public void cancelAllAlarms(PluginCall call) {
        try {
            Context context = getContext();
            SharedPreferences prefs = context.getSharedPreferences("scheduled_alarms", Context.MODE_PRIVATE);
            String alarmsJson = prefs.getString("alarms", "[]");
            JSONArray alarms = new JSONArray(alarmsJson);

            for (int i = 0; i < alarms.length(); i++) {
                JSONObject alarm = alarms.getJSONObject(i);
                int notifId = alarm.getInt("notifId");
                AlarmReceiver.cancelAlarm(context, notifId);
            }

            prefs.edit().putString("alarms", "[]").apply();

            JSObject result = new JSObject();
            result.put("success", true);
            result.put("cancelled", alarms.length());
            call.resolve(result);

            Log.d(TAG, "All alarms cancelled: " + alarms.length());
        } catch (Exception e) {
            call.reject("Error cancelling all alarms: " + e.getMessage());
        }
    }

    @PluginMethod
    public void testNotification(PluginCall call) {
        try {
            Context context = getContext();
            // Fire a notification immediately for testing
            AlarmReceiver.scheduleAlarm(
                    context,
                    99999,
                    "✅ 通知测试成功！",
                    "恭喜！后台提醒功能已正常工作，即使退出App也能收到提醒。",
                    System.currentTimeMillis() + 3000 // 3 seconds from now
            );

            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", "Test notification will arrive in 3 seconds");
            call.resolve(result);
        } catch (Exception e) {
            call.reject("Error sending test notification: " + e.getMessage());
        }
    }

    @PluginMethod
    public void checkPermissions(PluginCall call) {
        Context context = getContext();
        JSObject result = new JSObject();

        // Check full-screen intent permission (Android 14+ / API 34+)
        // On Android 13 and below, USE_FULL_SCREEN_INTENT is auto-granted from manifest
        boolean canUseFullScreenIntent = true;
        if (Build.VERSION.SDK_INT >= 34) {
            NotificationManager nm = context.getSystemService(NotificationManager.class);
            if (nm != null) {
                canUseFullScreenIntent = nm.canUseFullScreenIntent();
            }
        }

        boolean canScheduleExactAlarms = true;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            if (alarmManager != null) {
                canScheduleExactAlarms = alarmManager.canScheduleExactAlarms();
            }
        }

        boolean notificationsEnabled = NotificationManagerCompat.from(context).areNotificationsEnabled();

        result.put("canUseFullScreenIntent", canUseFullScreenIntent);
        result.put("canScheduleExactAlarms", canScheduleExactAlarms);
        result.put("notificationsEnabled", notificationsEnabled);

        call.resolve(result);
    }

    @PluginMethod
    public void requestOverlayPermission(PluginCall call) {
        // Kept for backward compatibility - now redirects to full-screen intent settings
        requestFullScreenIntentPermission(call);
    }

    @PluginMethod
    public void requestFullScreenIntentPermission(PluginCall call) {
        Context context = getContext();
        if (Build.VERSION.SDK_INT >= 34) {
            NotificationManager nm = context.getSystemService(NotificationManager.class);
            if (nm != null && !nm.canUseFullScreenIntent()) {
                // On Android 14+, open the full-screen intent permission settings
                Intent intent = new Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS);
                intent.putExtra(Settings.EXTRA_APP_PACKAGE, context.getPackageName());
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(intent);
            }
        }
        call.resolve();
    }

    @PluginMethod
    public void requestExactAlarmPermission(PluginCall call) {
        Context context = getContext();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            if (alarmManager != null && !alarmManager.canScheduleExactAlarms()) {
                Intent intent = new Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM, Uri.parse("package:" + context.getPackageName()));
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(intent);
            }
        }
        call.resolve();
    }
    
    @PluginMethod
    public void openAppNotificationSettings(PluginCall call) {
        Context context = getContext();
        Intent intent = new Intent();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            intent.setAction(Settings.ACTION_APP_NOTIFICATION_SETTINGS);
            intent.putExtra(Settings.EXTRA_APP_PACKAGE, context.getPackageName());
        } else {
            intent.setAction(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
            intent.setData(Uri.parse("package:" + context.getPackageName()));
        }
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        context.startActivity(intent);
        call.resolve();
    }

    private void persistAlarm(Context context, int notifId, String title, String body, long triggerAt) {
        try {
            SharedPreferences prefs = context.getSharedPreferences("scheduled_alarms", Context.MODE_PRIVATE);
            String alarmsJson = prefs.getString("alarms", "[]");
            JSONArray alarms = new JSONArray(alarmsJson);

            // Remove existing entry with same notifId
            JSONArray updated = new JSONArray();
            for (int i = 0; i < alarms.length(); i++) {
                JSONObject alarm = alarms.getJSONObject(i);
                if (alarm.getInt("notifId") != notifId) {
                    updated.put(alarm);
                }
            }

            // Add new entry
            JSONObject newAlarm = new JSONObject();
            newAlarm.put("notifId", notifId);
            newAlarm.put("title", title);
            newAlarm.put("body", body);
            newAlarm.put("triggerAt", triggerAt);
            updated.put(newAlarm);

            prefs.edit().putString("alarms", updated.toString()).apply();
        } catch (Exception e) {
            Log.e(TAG, "Error persisting alarm", e);
        }
    }

    private void removePersistedAlarm(Context context, int notifId) {
        try {
            SharedPreferences prefs = context.getSharedPreferences("scheduled_alarms", Context.MODE_PRIVATE);
            String alarmsJson = prefs.getString("alarms", "[]");
            JSONArray alarms = new JSONArray(alarmsJson);

            JSONArray updated = new JSONArray();
            for (int i = 0; i < alarms.length(); i++) {
                JSONObject alarm = alarms.getJSONObject(i);
                if (alarm.getInt("notifId") != notifId) {
                    updated.put(alarm);
                }
            }

            prefs.edit().putString("alarms", updated.toString()).apply();
        } catch (Exception e) {
            Log.e(TAG, "Error removing persisted alarm", e);
        }
    }
}
