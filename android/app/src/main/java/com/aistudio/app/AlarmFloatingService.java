package com.aistudio.app;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.graphics.PixelFormat;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;
import android.view.Gravity;
import android.view.LayoutInflater;
import android.view.View;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.TextView;
import android.util.Log;

import androidx.core.app.NotificationCompat;

public class AlarmFloatingService extends Service {

    private static final String TAG = "AlarmFloatingService";
    public static final String CHANNEL_ID = "plan_reminder_silent_channel";

    private WindowManager windowManager;
    private View floatingView;
    private PowerManager.WakeLock wakeLock;

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent == null) return START_NOT_STICKY;

        final String title = intent.getStringExtra("title") != null ? intent.getStringExtra("title") : "⏰ 计划提醒";
        final String body = intent.getStringExtra("body") != null ? intent.getStringExtra("body") : "您有一个待办计划到期了";
        final int notifId = intent.getIntExtra("notifId", (int) System.currentTimeMillis());

        Log.d(TAG, "Starting floating window service for: " + title);

        // Turn on screen
        PowerManager powerManager = (PowerManager) getSystemService(Context.POWER_SERVICE);
        if (powerManager != null) {
            wakeLock = powerManager.newWakeLock(
                    PowerManager.SCREEN_BRIGHT_WAKE_LOCK | PowerManager.ACQUIRE_CAUSES_WAKEUP | PowerManager.ON_AFTER_RELEASE,
                    "aistudio:floating_popup_wakelock"
            );
            wakeLock.acquire(3 * 60 * 1000L); // Max 3 minutes
        }

        showFloatingWindow(title, body, notifId);
        showSilentNotification(this, notifId, title, body);

        return START_NOT_STICKY;
    }

    private void showFloatingWindow(final String title, final String body, final int notifId) {
        if (floatingView != null) {
            return; // Already showing
        }

        windowManager = (WindowManager) getSystemService(WINDOW_SERVICE);
        LayoutInflater inflater = (LayoutInflater) getSystemService(LAYOUT_INFLATER_SERVICE);
        floatingView = inflater.inflate(R.layout.activity_alarm_alert, null);

        int layoutType;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            layoutType = WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY;
        } else {
            layoutType = WindowManager.LayoutParams.TYPE_PHONE;
        }

        WindowManager.LayoutParams params = new WindowManager.LayoutParams(
                WindowManager.LayoutParams.MATCH_PARENT,
                WindowManager.LayoutParams.MATCH_PARENT,
                layoutType,
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED |
                WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON |
                WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON |
                WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD |
                WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED,
                PixelFormat.TRANSLUCENT
        );

        params.gravity = Gravity.CENTER;

        TextView tvTitle = floatingView.findViewById(R.id.tv_alarm_title);
        TextView tvBody = floatingView.findViewById(R.id.tv_alarm_body);
        tvTitle.setText(title);
        tvBody.setText(body);

        Button btnDismiss = floatingView.findViewById(R.id.btn_dismiss);
        Button btnSnooze = floatingView.findViewById(R.id.btn_snooze);

        btnDismiss.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                removeViewAndStop(notifId);
            }
        });

        btnSnooze.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                long snoozeTime = System.currentTimeMillis() + 5 * 60 * 1000L;
                AlarmReceiver.scheduleAlarm(
                        AlarmFloatingService.this,
                        notifId > 0 ? notifId + 1000 : (int) (System.currentTimeMillis() % 100000),
                        title,
                        "稍后提醒: " + body,
                        snoozeTime
                );
                removeViewAndStop(notifId);
            }
        });

        try {
            windowManager.addView(floatingView, params);
        } catch (Exception e) {
            Log.e(TAG, "Failed to add floating view (Permission denied?)", e);
            stopSelf();
        }
    }

    private void removeViewAndStop(int notifId) {
        if (floatingView != null && windowManager != null) {
            try {
                windowManager.removeView(floatingView);
            } catch (Exception e) {
                // Ignore
            }
            floatingView = null;
        }
        
        NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager != null) {
            manager.cancel(notifId);
        }
        
        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
        }
        
        stopSelf();
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        if (floatingView != null && windowManager != null) {
            try {
                windowManager.removeView(floatingView);
            } catch (Exception e) {
                // Ignore
            }
        }
        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
        }
    }

    private void showSilentNotification(Context context, int notifId, String title, String body) {
        NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager == null) return;

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            if (manager.getNotificationChannel(CHANNEL_ID) == null) {
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

        Intent launchIntent = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
        PendingIntent contentIntent = null;
        if (launchIntent != null) {
            launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            contentIntent = PendingIntent.getActivity(context, notifId, launchIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        }

        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID)
                .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
                .setContentTitle(title)
                .setContentText(body)
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setSound(null)
                .setVibrate(null)
                .setAutoCancel(true);

        if (contentIntent != null) {
            builder.setContentIntent(contentIntent);
        }

        manager.notify(notifId, builder.build());
    }
}
