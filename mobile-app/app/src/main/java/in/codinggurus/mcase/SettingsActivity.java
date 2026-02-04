package in.codinggurus.mcase;

import android.app.AlertDialog;
import android.content.Intent;
import android.os.Bundle;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.widget.Toolbar;

import in.codinggurus.mcase.models.User;
import in.codinggurus.mcase.utils.SessionManager;
import in.codinggurus.mcase.utils.ThemeManager;

public class SettingsActivity extends AppCompatActivity {

    private SessionManager sessionManager;
    private TextView userNameText, userEmailText;
    private LinearLayout themeOption, logoutOption;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_settings);

        sessionManager = new SessionManager(this);

        Toolbar toolbar = findViewById(R.id.toolbar);
        setSupportActionBar(toolbar);
        if (getSupportActionBar() != null) {
            getSupportActionBar().setDisplayHomeAsUpEnabled(true);
            getSupportActionBar().setTitle("Settings");
        }

        userNameText = findViewById(R.id.user_name_text);
        userEmailText = findViewById(R.id.user_email_text);
        themeOption = findViewById(R.id.theme_option);
        logoutOption = findViewById(R.id.logout_option);

        loadUserData();

        themeOption.setOnClickListener(v -> showThemeDialog());
        logoutOption.setOnClickListener(v -> handleLogout());
    }

    private void loadUserData() {
        User user = sessionManager.getUser();
        if (user != null) {
            userNameText.setText(user.getName());
            userEmailText.setText(user.getEmail());
        }
    }

    private void showThemeDialog() {
        String[] themes = {"Light Mode", "Dark Mode", "System Default"};
        int currentTheme = ThemeManager.getSavedTheme(this);
        
        new AlertDialog.Builder(this)
            .setTitle("Theme Settings")
            .setSingleChoiceItems(themes, currentTheme, (dialog, which) -> {
                ThemeManager.saveTheme(this, which);
                dialog.dismiss();
                recreate();
            })
            .setNegativeButton("Cancel", null)
            .show();
    }

    private void handleLogout() {
        new AlertDialog.Builder(this)
            .setTitle("Logout")
            .setMessage("Are you sure you want to logout?")
            .setPositiveButton("Yes", (dialog, which) -> {
                sessionManager.logout();
                Intent intent = new Intent(SettingsActivity.this, LoginActivity.class);
                intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
                startActivity(intent);
                finish();
            })
            .setNegativeButton("No", null)
            .show();
    }

    @Override
    public boolean onSupportNavigateUp() {
        onBackPressed();
        return true;
    }
}
