package in.codinggurus.mcase;

import android.app.ProgressDialog;
import android.content.Intent;
import android.os.Bundle;
import android.widget.Button;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

import com.google.android.material.textfield.TextInputEditText;

import org.json.JSONObject;

import in.codinggurus.mcase.network.ApiClient;
import in.codinggurus.mcase.utils.ThemeManager;

public class RegisterActivity extends AppCompatActivity {

    private TextInputEditText nameInput, emailInput, phoneInput, passwordInput, confirmPasswordInput;
    private Button registerButton;
    private TextView loginLink;
    private ApiClient apiClient;
    private ProgressDialog progressDialog;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        ThemeManager.initTheme(this);
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_register);

        apiClient = new ApiClient(this);

        nameInput = findViewById(R.id.name_input);
        emailInput = findViewById(R.id.email_input);
        phoneInput = findViewById(R.id.phone_input);
        passwordInput = findViewById(R.id.password_input);
        confirmPasswordInput = findViewById(R.id.confirm_password_input);
        registerButton = findViewById(R.id.register_button);
        loginLink = findViewById(R.id.login_link);

        progressDialog = new ProgressDialog(this);
        progressDialog.setMessage("Creating account...");
        progressDialog.setCancelable(false);

        registerButton.setOnClickListener(v -> handleRegister());
        loginLink.setOnClickListener(v -> finish());
    }

    private void handleRegister() {
        String name = nameInput.getText().toString().trim();
        String email = emailInput.getText().toString().trim();
        String phone = phoneInput.getText().toString().trim();
        String password = passwordInput.getText().toString().trim();
        String confirmPassword = confirmPasswordInput.getText().toString().trim();

        if (name.isEmpty()) {
            nameInput.setError("Name is required");
            return;
        }

        if (email.isEmpty()) {
            emailInput.setError("Email is required");
            return;
        }

        if (phone.isEmpty()) {
            phoneInput.setError("Phone is required");
            return;
        }

        if (password.isEmpty()) {
            passwordInput.setError("Password is required");
            return;
        }

        if (password.length() < 6) {
            passwordInput.setError("Password must be at least 6 characters");
            return;
        }

        if (!password.equals(confirmPassword)) {
            confirmPasswordInput.setError("Passwords do not match");
            return;
        }

        progressDialog.show();

        try {
            JSONObject userData = new JSONObject();
            userData.put("name", name);
            userData.put("email", email);
            userData.put("phone", phone);
            userData.put("password", password);
            userData.put("role", "citizen");
            userData.put("active", true);

            apiClient.register(userData, new ApiClient.ApiCallback() {
                @Override
                public void onSuccess(JSONObject response) {
                    runOnUiThread(() -> {
                        progressDialog.dismiss();
                        Toast.makeText(RegisterActivity.this, "Registration successful! Please login.", Toast.LENGTH_LONG).show();
                        finish();
                    });
                }

                @Override
                public void onError(String error) {
                    runOnUiThread(() -> {
                        progressDialog.dismiss();
                        Toast.makeText(RegisterActivity.this, error, Toast.LENGTH_LONG).show();
                    });
                }
            });
        } catch (Exception e) {
            progressDialog.dismiss();
            Toast.makeText(this, "Error creating account", Toast.LENGTH_SHORT).show();
        }
    }
}
