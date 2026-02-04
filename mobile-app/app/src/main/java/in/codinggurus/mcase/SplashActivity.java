package in.codinggurus.mcase;

import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.view.View;
import android.view.animation.AlphaAnimation;
import android.view.animation.Animation;
import android.view.animation.AnimationUtils;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;

import in.codinggurus.mcase.utils.SessionManager;
import in.codinggurus.mcase.utils.ThemeManager;

public class SplashActivity extends AppCompatActivity {

    private static final int TOTAL_DURATION = 7000;
    
    private TextView wordCapture, wordAssess, wordServe, wordEvolve;
    private TextView brandCase, brandFullForm, tagline;
    private View credit;
    private ImageView logo;
    private SessionManager sessionManager;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        ThemeManager.initTheme(this);
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_splash);

        sessionManager = new SessionManager(this);
        initializeViews();
        startPreloaderAnimation();

        new Handler().postDelayed(() -> {
            if (sessionManager.isLoggedIn()) {
                startActivity(new Intent(SplashActivity.this, MainActivity.class));
            } else {
                startActivity(new Intent(SplashActivity.this, LoginActivity.class));
            }
            finish();
            overridePendingTransition(R.anim.fade_in, R.anim.fade_out);
        }, TOTAL_DURATION);
    }

    private void initializeViews() {
        wordCapture = findViewById(R.id.word_capture);
        wordAssess = findViewById(R.id.word_assess);
        wordServe = findViewById(R.id.word_serve);
        wordEvolve = findViewById(R.id.word_evolve);
        brandCase = findViewById(R.id.brand_case);
        brandFullForm = findViewById(R.id.brand_full_form);
        tagline = findViewById(R.id.tagline);
        credit = findViewById(R.id.credit);
        logo = findViewById(R.id.splash_logo);
    }

    private void startPreloaderAnimation() {
        showWord(wordCapture, 0, "CAPTURE");
        showWord(wordAssess, 1000, "ASSESS");
        showWord(wordServe, 2000, "SERVE");
        showWord(wordEvolve, 3000, "EVOLVE");
        new Handler().postDelayed(this::transitionToBrand, 4000);
        new Handler().postDelayed(this::showLogoAndDetails, 5000);
        new Handler().postDelayed(this::showCredit, 6000);
    }

    private void showWord(TextView textView, int delay, String text) {
        new Handler().postDelayed(() -> {
            textView.setText(text);
            textView.setVisibility(View.VISIBLE);
            
            AlphaAnimation fadeIn = new AlphaAnimation(0.0f, 1.0f);
            fadeIn.setDuration(300);
            textView.startAnimation(fadeIn);
            
            new Handler().postDelayed(() -> {
                AlphaAnimation fadeOut = new AlphaAnimation(1.0f, 0.0f);
                fadeOut.setDuration(300);
                fadeOut.setAnimationListener(new Animation.AnimationListener() {
                    public void onAnimationStart(Animation animation) {}
                    public void onAnimationEnd(Animation animation) {
                        textView.setVisibility(View.INVISIBLE);
                    }
                    public void onAnimationRepeat(Animation animation) {}
                });
                textView.startAnimation(fadeOut);
            }, 700);
        }, delay);
    }

    private void transitionToBrand() {
        wordCapture.setVisibility(View.GONE);
        wordAssess.setVisibility(View.GONE);
        wordServe.setVisibility(View.GONE);
        wordEvolve.setVisibility(View.GONE);
        
        brandCase.setVisibility(View.VISIBLE);
        Animation scaleIn = AnimationUtils.loadAnimation(this, R.anim.scale_in);
        brandCase.startAnimation(scaleIn);
    }

    private void showLogoAndDetails() {
        logo.setVisibility(View.VISIBLE);
        Animation scaleIn = AnimationUtils.loadAnimation(this, R.anim.scale_in);
        logo.startAnimation(scaleIn);
        
        new Handler().postDelayed(() -> {
            brandFullForm.setVisibility(View.VISIBLE);
            AlphaAnimation fadeIn = new AlphaAnimation(0.0f, 1.0f);
            fadeIn.setDuration(500);
            brandFullForm.startAnimation(fadeIn);
        }, 300);
        
        new Handler().postDelayed(() -> {
            tagline.setVisibility(View.VISIBLE);
            Animation slideUp = AnimationUtils.loadAnimation(this, R.anim.slide_up);
            tagline.startAnimation(slideUp);
        }, 600);
    }

    private void showCredit() {
        credit.setVisibility(View.VISIBLE);
        AlphaAnimation fadeIn = new AlphaAnimation(0.0f, 1.0f);
        fadeIn.setDuration(500);
        credit.startAnimation(fadeIn);
    }
}
