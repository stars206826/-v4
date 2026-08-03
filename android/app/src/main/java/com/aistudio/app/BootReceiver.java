package com.aistudio.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.util.Log;

import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Re-schedules all pending alarms after device reboot.
 * Android cancels all AlarmManager alarms on reboot, so we need to re-register them.
 */
public class BootReceiver extends BroadcastReceiver {

    private static final String TAG = "BootReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();
        if (Intent.ACTION_BOOT_COMPLETED.equals(action)
                || "android.intent.action.QUICKBOOT_POWERON".equals(action)
                || "com.htc.intent.action.QUICKBOOT_POWERON".equals(action)
                || Intent.ACTION_MY_PACKAGE_REPLACED.equals(action)) {
            Log.d(TAG, "Received " + action + ", rescheduling alarms...");
            rescheduleAlarms(context);
        }
    }

    private void rescheduleAlarms(Context context) {
        try {
            SharedPreferences prefs = context.getSharedPreferences("scheduled_alarms", Context.MODE_PRIVATE);
            String alarmsJson = prefs.getString("alarms", "[]");
            JSONArray alarms = new JSONArray(alarmsJson);

            long now = System.currentTimeMillis();
            int rescheduled = 0;

            for (int i = 0; i < alarms.length(); i++) {
                JSONObject alarm = alarms.getJSONObject(i);
                int notifId = alarm.getInt("notifId");
                String title = alarm.getString("title");
                String body = alarm.getString("body");
                long triggerAt = alarm.getLong("triggerAt");

                if (triggerAt > now) {
                    AlarmReceiver.scheduleAlarm(context, notifId, title, body, triggerAt);
                    rescheduled++;
                }
            }
            Log.d(TAG, "Rescheduled " + rescheduled + " alarms after boot.");
        } catch (Exception e) {
            Log.e(TAG, "Error rescheduling alarms after boot", e);
        }
    }
}
