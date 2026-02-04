package in.codinggurus.mcase;

import android.app.ProgressDialog;
import android.content.Intent;
import android.os.Bundle;
import android.widget.Button;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

import com.google.android.material.textfield.TextInputEditText;
import com.google.gson.Gson;

import org.json.JSONObject;

import in.codinggurus.mcase.models.User;
import in.codinggurus.mcase.network.ApiClient;
import in.codinggurus.mcase.utils.SessionManager;
import in.codinggurus.mcase.utils.ThemeManager;

public class LoginActivity extends AppCompatActivity {

    private TextInputEditText emailInput, passwordInput;
    private Button loginButton;
    private TextView registerLink;
    private ApiClient apiClient;
    private SessionManager sessionManager;
    private ProgressDialog progressDialog;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        ThemeManager.initTheme(this);
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_login);

        apiClient = new ApiClient(this);
        sessionManager = new SessionManager(this);

        emailInput = findViewById(R.id.email_input);
        passwordInput = findViewById(R.id.password_input);
        loginButton = findViewById(R.id.login_button);
        registerLink = findViewById(R.id.register_link);

        progressDialog = new ProgressDialog(this);
        progressDialog.setMessage("Logging in...");
        progressDialog.setCancelable(false);

        loginButton.setOnClickListener(v -> handleLogin());
        registerLink.setOnClickListener(v -> {
            startActivity(new Intent(LoginActivity.this, RegisterActivity.class));
        });
    }

    private void handleLogin() {
        String email = emailInput.getText().toString().trim();
        String password = passwordInput.getText().toString().trim();

        if (email.isEmpty()) {
            emailInput.setError("Email is required");
            return;
        }

        if (password.isEmpty()) {
            passwordInput.setError("Password is required");
            return;
        }

        progressDialog.show();

        apiClient.login(email, password, new ApiClient.ApiCallback() {
            @Override
            public void onSuccess(JSONObject response) {
                runOnUiThread(() -> {
                    progressDialog.dismiss();
                    try {
                        JSONObject userJson = response.getJSONObject("user");
                        String token = response.getString("token");

                        User user = new Gson().fromJson(userJson.toString(), User.class);
                        sessionManager.saveLoginSession(user, token);

                        Toast.makeText(LoginActivity.this, "Login successful!", Toast.LENGTH_SHORT).show();
                        
                        Intent intent = new Intent(LoginActivity.this, MainActivity.class);
                        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
                        startActivity(intent);
                        finish();
                    } catch (Exception e) {
                        Toast.makeText(LoginActivity.this, "Error processing response", Toast.LENGTH_SHORT).show();
                    }
                });
            }

            @Override
            public void onError(String error) {
                runOnUiThread(() -> {
                    progressDialog.dismiss();
                    Toast.makeText(LoginActivity.this, error, Toast.LENGTH_LONG).show();
                });
            }
        });
    }
}
