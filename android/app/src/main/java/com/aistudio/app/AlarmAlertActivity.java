package com.aistudio.app;

import android.app.Activity;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.TextView;

import androidx.core.app.NotificationCompat;

public class AlarmAlertActivity extends Activity {

    public static final String CHANNEL_ID = "plan_reminder_silent_channel";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Turn screen on and show on top of lockscreen / launcher / desktop
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
            getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        } else {
            getWindow().addFlags(
                    WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED |
                    WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON |
                    WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON |
                    WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD
            );
        }

        // The alarm now launches this activity directly (system-driven), so the
        // activity itself must wake the screen when the phone was asleep.
        android.os.PowerManager pm = (android.os.PowerManager) getSystemService(Context.POWER_SERVICE);
        if (pm != null) {
            android.os.PowerManager.WakeLock wl = pm.newWakeLock(
                    android.os.PowerManager.SCREEN_BRIGHT_WAKE_LOCK
                            | android.os.PowerManager.ACQUIRE_CAUSES_WAKEUP
                            | android.os.PowerManager.ON_AFTER_RELEASE,
                    "aistudio:alarm_alert_wake"
            );
            wl.acquire(60 * 1000L); // auto-releases after 60s
        }
        android.util.Log.e("AlarmAlertActivity", "[TRACE-A] AlarmAlertActivity onCreate, screen wake requested");

        setContentView(R.layout.activity_alarm_alert);

        Intent intent = getIntent();
        final String title = intent.getStringExtra("title") != null ? intent.getStringExtra("title") : "⏰ 计划提醒";
        final String body = intent.getStringExtra("body") != null ? intent.getStringExtra("body") : "您有一个待办计划到期了";
        final int notifId = intent.getIntExtra("notifId", (int) System.currentTimeMillis());

        TextView tvTitle = findViewById(R.id.tv_alarm_title);
        TextView tvBody = findViewById(R.id.tv_alarm_body);

        tvTitle.setText(title);
        tvBody.setText(body);

        // Post a silent notification as backup
        createSilentNotificationChannel(this);
        showSilentNotification(this, notifId, title, body);

        Button btnDismiss = findViewById(R.id.btn_dismiss);
        Button btnSnooze = findViewById(R.id.btn_snooze);

        btnDismiss.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                // Remove notification when dismissed
                NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
                if (manager != null) {
                    manager.cancel(notifId);
                }
                finish();
            }
        });

        btnSnooze.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                // Snooze 5 minutes (300,000 ms)
                long snoozeTime = System.currentTimeMillis() + 5 * 60 * 1000L;
                AlarmReceiver.scheduleAlarm(
                        AlarmAlertActivity.this,
                        notifId > 0 ? notifId + 1000 : (int) (System.currentTimeMillis() % 100000),
                        title,
                        "稍后提醒: " + body,
                        snoozeTime
                );
                // Remove current notification
                NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
                if (manager != null) {
                    manager.cancel(notifId);
                }
                finish();
            }
        });
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
                channel.setSound(null, null); // Completely silent as requested
                channel.enableVibration(false); // Silent
                channel.setLockscreenVisibility(NotificationCompat.VISIBILITY_PUBLIC);

                manager.createNotificationChannel(channel);
            }
        }
    }

    private void showSilentNotification(Context context, int notifId, String title, String body) {
        NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);

        // Intent to just open the app when the notification is clicked
        Intent launchIntent = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
        if (launchIntent == null) return;
        launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);

        PendingIntent contentIntent = PendingIntent.getActivity(
                context,
                notifId,
                launchIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID)
                .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
                .setContentTitle(title)
                .setContentText(body)
                .setPriority(NotificationCompat.PRIORITY_MAX)
                // CATEGORY_ALARM makes HONOR play the alarm ringtone even when
                // silent; CATEGORY_REMINDER keeps it silent as intended.
                .setCategory(NotificationCompat.CATEGORY_REMINDER)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setSound(null) // Silent
                .setVibrate(null) // Silent
                .setAutoCancel(true)
                .setContentIntent(contentIntent);

        if (manager != null) {
            manager.notify(notifId, builder.build());
        }
    }
}
