package com.aistudio.app;

import android.app.Activity;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.TextView;

public class AlarmAlertActivity extends Activity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Turn screen on and show on top of lockscreen / launcher / desktop
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
        } else {
            getWindow().addFlags(
                    WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED |
                    WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON |
                    WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON |
                    WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD
            );
        }

        setContentView(R.layout.activity_alarm_alert);

        Intent intent = getIntent();
        final String title = intent.getStringExtra("title");
        final String body = intent.getStringExtra("body");
        final int notifId = intent.getIntExtra("notifId", 0);

        TextView tvTitle = findViewById(R.id.tv_alarm_title);
        TextView tvBody = findViewById(R.id.tv_alarm_body);

        if (title != null) {
            tvTitle.setText(title);
        }
        if (body != null) {
            tvBody.setText(body);
        }

        Button btnDismiss = findViewById(R.id.btn_dismiss);
        Button btnSnooze = findViewById(R.id.btn_snooze);

        btnDismiss.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
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
                        title != null ? title : "⏰ 计划提醒",
                        body != null ? body : "稍后提醒到期",
                        snoozeTime
                );
                finish();
            }
        });
    }
}
