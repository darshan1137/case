package in.codinggurus.mcase.network;

import android.content.Context;
import android.util.Log;

import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

public class ApiClient {
    private static final String TAG = "ApiClient";
    private final String baseUrl;

    public ApiClient(Context context) {
        this.baseUrl = ApiConfig.getBaseUrl();
    }

    public interface ApiCallback {
        void onSuccess(JSONObject response);
        void onError(String error);
    }

    public void login(String email, String password, ApiCallback callback) {
        new Thread(() -> {
            try {
                URL url = new URL(baseUrl + "auth/login");
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("POST");
                conn.setRequestProperty("Content-Type", "application/json");
                conn.setDoOutput(true);

                JSONObject jsonBody = new JSONObject();
                jsonBody.put("email", email);
                jsonBody.put("password", password);

                OutputStream os = conn.getOutputStream();
                os.write(jsonBody.toString().getBytes(StandardCharsets.UTF_8));
                os.close();

                int responseCode = conn.getResponseCode();
                BufferedReader br;
                if (responseCode == 200) {
                    br = new BufferedReader(new InputStreamReader(conn.getInputStream()));
                } else {
                    br = new BufferedReader(new InputStreamReader(conn.getErrorStream()));
                }

                StringBuilder response = new StringBuilder();
                String line;
                while ((line = br.readLine()) != null) {
                    response.append(line);
                }
                br.close();

                JSONObject jsonResponse = new JSONObject(response.toString());
                
                if (responseCode == 200 && jsonResponse.getBoolean("success")) {
                    callback.onSuccess(jsonResponse);
                } else {
                    String error = jsonResponse.optString("error", "Login failed");
                    callback.onError(error);
                }
            } catch (Exception e) {
                Log.e(TAG, "Login error", e);
                callback.onError(e.getMessage());
            }
        }).start();
    }

    public void register(JSONObject userData, ApiCallback callback) {
        new Thread(() -> {
            try {
                URL url = new URL(baseUrl + "users");
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("POST");
                conn.setRequestProperty("Content-Type", "application/json");
                conn.setDoOutput(true);

                OutputStream os = conn.getOutputStream();
                os.write(userData.toString().getBytes(StandardCharsets.UTF_8));
                os.close();

                int responseCode = conn.getResponseCode();
                BufferedReader br;
                if (responseCode == 201 || responseCode == 200) {
                    br = new BufferedReader(new InputStreamReader(conn.getInputStream()));
                } else {
                    br = new BufferedReader(new InputStreamReader(conn.getErrorStream()));
                }

                StringBuilder response = new StringBuilder();
                String line;
                while ((line = br.readLine()) != null) {
                    response.append(line);
                }
                br.close();

                JSONObject jsonResponse = new JSONObject(response.toString());
                
                if ((responseCode == 200 || responseCode == 201) && jsonResponse.getBoolean("success")) {
                    callback.onSuccess(jsonResponse);
                } else {
                    String error = jsonResponse.optString("error", "Registration failed");
                    callback.onError(error);
                }
            } catch (Exception e) {
                Log.e(TAG, "Register error", e);
                callback.onError(e.getMessage());
            }
        }).start();
    }
}
