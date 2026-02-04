package in.codinggurus.mcase.utils;

import android.content.Context;
import android.content.SharedPreferences;

import com.google.gson.Gson;

import in.codinggurus.mcase.models.User;

public class SessionManager {
    private static final String PREF_NAME = "CaseSession";
    private static final String KEY_IS_LOGGED_IN = "isLoggedIn";
    private static final String KEY_USER_DATA = "userData";
    private static final String KEY_TOKEN = "token";
    
    private final SharedPreferences prefs;
    private final Gson gson;
    
    public SessionManager(Context context) {
        prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
        gson = new Gson();
    }
    
    public void saveLoginSession(User user, String token) {
        SharedPreferences.Editor editor = prefs.edit();
        editor.putBoolean(KEY_IS_LOGGED_IN, true);
        editor.putString(KEY_USER_DATA, gson.toJson(user));
        editor.putString(KEY_TOKEN, token);
        editor.apply();
    }
    
    public boolean isLoggedIn() {
        return prefs.getBoolean(KEY_IS_LOGGED_IN, false);
    }
    
    public User getUser() {
        String json = prefs.getString(KEY_USER_DATA, null);
        if (json != null) {
            return gson.fromJson(json, User.class);
        }
        return null;
    }
    
    public String getToken() {
        return prefs.getString(KEY_TOKEN, null);
    }
    
    public void logout() {
        prefs.edit().clear().apply();
    }
}
