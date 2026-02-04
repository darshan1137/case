package in.codinggurus.mcase;

import android.content.Intent;
import android.os.Bundle;
import android.view.Menu;
import android.view.MenuItem;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.widget.Toolbar;

import in.codinggurus.mcase.models.User;
import in.codinggurus.mcase.utils.SessionManager;

public class MainActivity extends AppCompatActivity {

    private SessionManager sessionManager;
    private TextView welcomeText, userNameText, userRoleText;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        sessionManager = new SessionManager(this);

        if (!sessionManager.isLoggedIn()) {
            startActivity(new Intent(this, LoginActivity.class));
            finish();
            return;
        }

        Toolbar toolbar = findViewById(R.id.toolbar);
        setSupportActionBar(toolbar);

        welcomeText = findViewById(R.id.welcome_text);
        userNameText = findViewById(R.id.user_name_text);
        userRoleText = findViewById(R.id.user_role_text);

        loadUserData();
    }

    private void loadUserData() {
        User user = sessionManager.getUser();
        if (user != null) {
            welcomeText.setText("Welcome back!");
            userNameText.setText(user.getName());
            userRoleText.setText(user.getRole() != null ? user.getRole().toUpperCase() : "USER");
        }
    }

    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        getMenuInflater().inflate(R.menu.main_menu, menu);
        return true;
    }

    @Override
    public boolean onOptionsItemSelected(@NonNull MenuItem item) {
        if (item.getItemId() == R.id.action_settings) {
            startActivity(new Intent(this, SettingsActivity.class));
            return true;
        }
        return super.onOptionsItemSelected(item);
    }
}