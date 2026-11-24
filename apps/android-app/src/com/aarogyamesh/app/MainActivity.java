package com.aarogyamesh.app;

import android.Manifest;
import android.app.Activity;
import android.app.ActivityManager;
import android.content.ActivityNotFoundException;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.net.Uri;
import android.os.BatteryManager;
import android.os.Build;
import android.os.Bundle;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.util.Log;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.view.WindowInsetsController;
import android.webkit.ConsoleMessage;
import android.webkit.JavascriptInterface;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

/**
 * Native Android shell for Aarogya Mesh (com.aarogyamesh.app).
 *
 * Hosts both the ASHA Field PWA (/phone/) and Tier-0 Watch / Family SOS companion (/watch/)
 * over a loopback 127.0.0.1 Secure Context with native microphone capture, tel:108 dialing,
 * emergency haptics, hardware telemetry bridge, and out-of-the-box LAN PHC Hub sync.
 */
public class MainActivity extends Activity {
    private static final String TAG = "AarogyaMainActivity";
    private static final int REQ_RECORD_AUDIO = 1001;

    private static final int COLOR_BG_SLATE = 0xFF0F172A;
    private static final int COLOR_DIVIDER = 0xFF1E293B;
    private static final int COLOR_TEAL_ACTIVE = 0xFF0D9488;
    private static final int COLOR_TAB_INACTIVE = 0xFF1E293B;
    private static final int COLOR_TEXT_DARK = 0xFF020617;
    private static final int COLOR_TEXT_MUTED = 0xFFCBD5E1;
    private static final int COLOR_BADGE_TEXT = 0xFF5EEAD4;

    private LocalAssetServer assetServer;
    private WebView webView;
    private AarogyaNativeBridge nativeBridge;
    private PermissionRequest pendingWebPermissionRequest;

    private TextView tabPhone;
    private TextView tabWatch;
    private TextView telemetryBadge;
    private String activeMode = "phone";
    private boolean receiverRegistered = false;

    private final BroadcastReceiver statusReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            updateTelemetryBadge();
        }
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        assetServer = new LocalAssetServer(getAssets());
        try {
            assetServer.start();
        } catch (IOException e) {
            Log.e(TAG, "Failed to start LocalAssetServer", e);
            Toast.makeText(this, "Failed to start local asset server: " + e.getMessage(), Toast.LENGTH_LONG).show();
            finish();
            return;
        }

        // Enable Chrome DevTools Protocol (CDP) inspection for automated testing & debugging.
        WebView.setWebContentsDebuggingEnabled(true);

        View rootView = buildLayout();
        setContentView(rootView);
        configureSystemBars();

        requestMicrophonePermissionIfNeeded();

        // Load ASHA Field App (/phone/) directly in the top-level Secure Context.
        loadMode("phone");
        updateTelemetryBadge();
    }

    private void configureSystemBars() {
        Window window = getWindow();
        if (window == null) {
            return;
        }
        window.setBackgroundDrawableResource(android.R.color.black);
        window.setStatusBarColor(COLOR_BG_SLATE);
        window.setNavigationBarColor(COLOR_BG_SLATE);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            View decor = window.getDecorView();
            if (decor != null) {
                WindowInsetsController controller = window.getInsetsController();
                if (controller != null) {
                    controller.setSystemBarsAppearance(
                            0,
                            WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS
                                    | WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS
                    );
                }
            }
        }
    }

    private View buildLayout() {
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(COLOR_BG_SLATE);
        root.setFitsSystemWindows(true);
        root.setLayoutParams(new ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
        ));

        // Compact native mode switcher bar (ASHA Field <-> Watch / SOS + live telemetry)
        LinearLayout topBar = new LinearLayout(this);
        topBar.setOrientation(LinearLayout.HORIZONTAL);
        topBar.setGravity(Gravity.CENTER_VERTICAL);
        topBar.setBackgroundColor(COLOR_BG_SLATE);
        int padH = dp(10);
        int padV = dp(6);
        topBar.setPadding(padH, padV, padH, padV);
        topBar.setLayoutParams(new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
        ));

        tabPhone = createTabButton("ASHA Field", "Switch to ASHA Field App");
        tabPhone.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                loadMode("phone");
            }
        });

        tabWatch = createTabButton("Watch / SOS", "Switch to Watch and Family SOS");
        tabWatch.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                loadMode("watch");
            }
        });

        LinearLayout.LayoutParams phoneLp = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
        );
        phoneLp.setMarginEnd(dp(6));
        topBar.addView(tabPhone, phoneLp);

        LinearLayout.LayoutParams watchLp = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
        );
        topBar.addView(tabWatch, watchLp);

        View spacer = new View(this);
        topBar.addView(spacer, new LinearLayout.LayoutParams(0, 1, 1.0f));

        telemetryBadge = new TextView(this);
        telemetryBadge.setTextSize(TypedValue.COMPLEX_UNIT_SP, 11f);
        telemetryBadge.setTypeface(Typeface.DEFAULT_BOLD);
        telemetryBadge.setTextColor(COLOR_BADGE_TEXT);
        telemetryBadge.setPadding(dp(8), dp(4), dp(8), dp(4));
        telemetryBadge.setContentDescription("Device battery and connectivity status");
        telemetryBadge.setBackground(pillDrawable(0xFF042F2E, 0xFF0D9488));
        telemetryBadge.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                if (nativeBridge != null) {
                    String summary = Build.MODEL
                            + " • " + nativeBridge.getBatteryPercent() + "%"
                            + " • " + nativeBridge.getNetworkType()
                            + " • " + nativeBridge.getTotalRamMb() + " MB RAM"
                            + " • Hub " + LocalAssetServer.DEFAULT_HUB_URL;
                    Toast.makeText(MainActivity.this, summary, Toast.LENGTH_SHORT).show();
                }
            }
        });
        topBar.addView(telemetryBadge);

        root.addView(topBar);

        View divider = new View(this);
        divider.setBackgroundColor(COLOR_DIVIDER);
        root.addView(divider, new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                dp(1)
        ));

        webView = createConfiguredWebView();
        root.addView(webView, new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                0,
                1.0f
        ));

        return root;
    }

    private TextView createTabButton(String label, String contentDesc) {
        TextView btn = new TextView(this);
        btn.setText(label);
        btn.setContentDescription(contentDesc);
        btn.setTextSize(TypedValue.COMPLEX_UNIT_SP, 12f);
        btn.setTypeface(Typeface.DEFAULT_BOLD);
        btn.setGravity(Gravity.CENTER);
        btn.setPadding(dp(12), dp(5), dp(12), dp(5));
        btn.setClickable(true);
        btn.setFocusable(true);
        return btn;
    }

    private GradientDrawable pillDrawable(int fillColor, int strokeColor) {
        GradientDrawable d = new GradientDrawable();
        d.setShape(GradientDrawable.RECTANGLE);
        d.setCornerRadius(dp(999));
        d.setColor(fillColor);
        d.setStroke(dp(1), strokeColor);
        return d;
    }

    private void updateTabStyles(String mode) {
        activeMode = mode;
        boolean isWatch = "watch".equals(mode);
        if (tabPhone != null) {
            tabPhone.setBackground(pillDrawable(
                    isWatch ? COLOR_TAB_INACTIVE : COLOR_TEAL_ACTIVE,
                    isWatch ? 0xFF334155 : 0xFF14B8A6
            ));
            tabPhone.setTextColor(isWatch ? COLOR_TEXT_MUTED : COLOR_TEXT_DARK);
        }
        if (tabWatch != null) {
            tabWatch.setBackground(pillDrawable(
                    isWatch ? COLOR_TEAL_ACTIVE : COLOR_TAB_INACTIVE,
                    isWatch ? 0xFF14B8A6 : 0xFF334155
            ));
            tabWatch.setTextColor(isWatch ? COLOR_TEXT_DARK : COLOR_TEXT_MUTED);
        }
    }

    private WebView createConfiguredWebView() {
        WebView wv = new WebView(this);
        wv.setBackgroundColor(COLOR_BG_SLATE);
        wv.setOverScrollMode(WebView.OVER_SCROLL_NEVER);

        WebSettings settings = wv.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setAllowContentAccess(true);
        settings.setAllowFileAccess(false);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);
        settings.setSupportZoom(false);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);

        nativeBridge = new AarogyaNativeBridge(this);
        wv.addJavascriptInterface(nativeBridge, "AarogyaNativeBridge");

        wv.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request != null ? request.getUrl() : null;
                if (uri == null) {
                    return false;
                }
                String scheme = uri.getScheme() != null ? uri.getScheme().toLowerCase() : "";
                if ("tel".equals(scheme)) {
                    openDialer(uri);
                    return true;
                }
                if ("sms".equals(scheme) || "smsto".equals(scheme) || "mailto".equals(scheme)) {
                    openExternalIntent(new Intent(Intent.ACTION_VIEW, uri));
                    return true;
                }
                String host = uri.getHost() != null ? uri.getHost().toLowerCase() : "";
                if ("127.0.0.1".equals(host) || "localhost".equals(host)) {
                    syncTabFromPath(uri.getPath());
                    return false;
                }
                if ("http".equals(scheme) || "https".equals(scheme)) {
                    openExternalIntent(new Intent(Intent.ACTION_VIEW, uri));
                    return true;
                }
                return false;
            }

            @Override
            public void onPageStarted(WebView view, String url, android.graphics.Bitmap favicon) {
                super.onPageStarted(view, url, favicon);
                if (url != null) {
                    Uri parsed = Uri.parse(url);
                    syncTabFromPath(parsed.getPath());
                }
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                seedDefaultHubUrlIfUnset(view);
            }
        });

        wv.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                if (request == null) {
                    return;
                }
                runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        handleWebPermissionRequest(request);
                    }
                });
            }

            @Override
            public void onPermissionRequestCanceled(PermissionRequest request) {
                if (pendingWebPermissionRequest == request) {
                    pendingWebPermissionRequest = null;
                }
            }

            @Override
            public boolean onConsoleMessage(ConsoleMessage consoleMessage) {
                if (consoleMessage != null) {
                    Log.d("AarogyaWebView",
                            consoleMessage.messageLevel() + " [" + consoleMessage.sourceId() + ":"
                                    + consoleMessage.lineNumber() + "] " + consoleMessage.message());
                }
                return super.onConsoleMessage(consoleMessage);
            }
        });

        return wv;
    }

    private void handleWebPermissionRequest(PermissionRequest request) {
        Uri origin = request.getOrigin();
        String host = origin != null && origin.getHost() != null ? origin.getHost().toLowerCase() : "";
        boolean isLocalOrigin = "127.0.0.1".equals(host) || "localhost".equals(host);
        if (!isLocalOrigin) {
            Log.w(TAG, "Denied WebView permission request for non-local origin: " + origin);
            request.deny();
            return;
        }

        List<String> audioResources = new ArrayList<>();
        String[] resources = request.getResources();
        if (resources != null) {
            for (String res : resources) {
                if (PermissionRequest.RESOURCE_AUDIO_CAPTURE.equals(res)) {
                    audioResources.add(res);
                }
            }
        }
        if (audioResources.isEmpty()) {
            request.deny();
            return;
        }

        if (checkSelfPermission(Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED) {
            request.grant(audioResources.toArray(new String[0]));
        } else {
            if (pendingWebPermissionRequest != null) {
                pendingWebPermissionRequest.deny();
            }
            pendingWebPermissionRequest = request;
            requestPermissions(new String[]{Manifest.permission.RECORD_AUDIO}, REQ_RECORD_AUDIO);
        }
    }

    private void requestMicrophonePermissionIfNeeded() {
        if (checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[]{Manifest.permission.RECORD_AUDIO}, REQ_RECORD_AUDIO);
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == REQ_RECORD_AUDIO && pendingWebPermissionRequest != null) {
            PermissionRequest req = pendingWebPermissionRequest;
            pendingWebPermissionRequest = null;
            boolean granted = grantResults != null
                    && grantResults.length > 0
                    && grantResults[0] == PackageManager.PERMISSION_GRANTED;
            if (granted) {
                req.grant(new String[]{PermissionRequest.RESOURCE_AUDIO_CAPTURE});
            } else {
                req.deny();
            }
        }
    }

    private void seedDefaultHubUrlIfUnset(WebView view) {
        if (view == null) {
            return;
        }
        String js = "(function(){try{var d='" + LocalAssetServer.DEFAULT_HUB_URL + "';"
                + "if(!localStorage.getItem('aarogya.hubUrl')){localStorage.setItem('aarogya.hubUrl',d);}"
                + "if(!localStorage.getItem('aarogya.watch.hubUrl')){localStorage.setItem('aarogya.watch.hubUrl',d);}"
                + "}catch(e){}})();";
        view.evaluateJavascript(js, null);
    }

    private void loadMode(String mode) {
        if (webView == null || assetServer == null) {
            return;
        }
        String normalized = "watch".equals(mode) ? "watch" : "phone";
        updateTabStyles(normalized);
        String targetUrl = assetServer.getBaseUrl() + "/" + normalized + "/";
        webView.loadUrl(targetUrl);
    }

    private void syncTabFromPath(String path) {
        if (path == null) {
            return;
        }
        if (path.startsWith("/watch")) {
            updateTabStyles("watch");
        } else if (path.startsWith("/phone")) {
            updateTabStyles("phone");
        }
    }

    private void openDialer(Uri telUri) {
        Intent intent = new Intent(Intent.ACTION_DIAL, telUri);
        openExternalIntent(intent);
    }

    private void openExternalIntent(Intent intent) {
        try {
            startActivity(intent);
        } catch (ActivityNotFoundException e) {
            Toast.makeText(this, "No app available to handle action", Toast.LENGTH_SHORT).show();
        }
    }

    private void updateTelemetryBadge() {
        if (telemetryBadge == null || nativeBridge == null) {
            return;
        }
        int pct = nativeBridge.getBatteryPercent();
        String net = nativeBridge.getNetworkType();
        String label = (pct >= 0 ? pct + "%" : "--%") + " · " + net;
        telemetryBadge.setText(label);
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (webView != null) {
            webView.onResume();
        }
        if (!receiverRegistered) {
            IntentFilter filter = new IntentFilter();
            filter.addAction(Intent.ACTION_BATTERY_CHANGED);
            filter.addAction("android.net.conn.CONNECTIVITY_CHANGE");
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                registerReceiver(statusReceiver, filter, Context.RECEIVER_NOT_EXPORTED);
            } else {
                registerReceiver(statusReceiver, filter);
            }
            receiverRegistered = true;
        }
        updateTelemetryBadge();
    }

    @Override
    protected void onPause() {
        if (receiverRegistered) {
            try {
                unregisterReceiver(statusReceiver);
            } catch (IllegalArgumentException ignored) {
            }
            receiverRegistered = false;
        }
        if (webView != null) {
            webView.onPause();
        }
        super.onPause();
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
            return;
        }
        // Minimize cleanly instead of tearing down local server & WebView state.
        moveTaskToBack(true);
    }

    @Override
    protected void onDestroy() {
        if (pendingWebPermissionRequest != null) {
            pendingWebPermissionRequest.deny();
            pendingWebPermissionRequest = null;
        }
        if (webView != null) {
            webView.removeJavascriptInterface("AarogyaNativeBridge");
            webView.stopLoading();
            webView.destroy();
            webView = null;
        }
        if (assetServer != null) {
            assetServer.stop();
            assetServer = null;
        }
        super.onDestroy();
    }

    private int dp(int value) {
        return Math.round(TypedValue.applyDimension(
                TypedValue.COMPLEX_UNIT_DIP,
                value,
                getResources().getDisplayMetrics()
        ));
    }

    /**
     * Native JavaScript bridge exposed to WebView pages as window.AarogyaNativeBridge.
     */
    public final class AarogyaNativeBridge {
        private final Context appContext;

        AarogyaNativeBridge(Context context) {
            this.appContext = context.getApplicationContext();
        }

        @JavascriptInterface
        public int getBatteryPercent() {
            try {
                BatteryManager bm = (BatteryManager) appContext.getSystemService(Context.BATTERY_SERVICE);
                if (bm != null) {
                    int cap = bm.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY);
                    if (cap >= 0 && cap <= 100) {
                        return cap;
                    }
                }
                Intent intent = appContext.registerReceiver(null, new IntentFilter(Intent.ACTION_BATTERY_CHANGED));
                if (intent != null) {
                    int level = intent.getIntExtra(BatteryManager.EXTRA_LEVEL, -1);
                    int scale = intent.getIntExtra(BatteryManager.EXTRA_SCALE, -1);
                    if (level >= 0 && scale > 0) {
                        return (int) Math.round((level * 100.0) / scale);
                    }
                }
            } catch (Exception e) {
                Log.w(TAG, "Battery query failed", e);
            }
            return -1;
        }

        @JavascriptInterface
        public boolean isCharging() {
            try {
                Intent intent = appContext.registerReceiver(null, new IntentFilter(Intent.ACTION_BATTERY_CHANGED));
                if (intent != null) {
                    int status = intent.getIntExtra(BatteryManager.EXTRA_STATUS, -1);
                    return status == BatteryManager.BATTERY_STATUS_CHARGING
                            || status == BatteryManager.BATTERY_STATUS_FULL;
                }
            } catch (Exception ignored) {
            }
            return false;
        }

        @JavascriptInterface
        public long getTotalRamMb() {
            try {
                ActivityManager am = (ActivityManager) appContext.getSystemService(Context.ACTIVITY_SERVICE);
                if (am != null) {
                    ActivityManager.MemoryInfo mi = new ActivityManager.MemoryInfo();
                    am.getMemoryInfo(mi);
                    return mi.totalMem / (1024L * 1024L);
                }
            } catch (Exception ignored) {
            }
            return -1L;
        }

        @JavascriptInterface
        public long getAvailableRamMb() {
            try {
                ActivityManager am = (ActivityManager) appContext.getSystemService(Context.ACTIVITY_SERVICE);
                if (am != null) {
                    ActivityManager.MemoryInfo mi = new ActivityManager.MemoryInfo();
                    am.getMemoryInfo(mi);
                    return mi.availMem / (1024L * 1024L);
                }
            } catch (Exception ignored) {
            }
            return -1L;
        }

        @JavascriptInterface
        public int getCpuCores() {
            return Runtime.getRuntime().availableProcessors();
        }

        @JavascriptInterface
        public boolean isOnline() {
            try {
                ConnectivityManager cm = (ConnectivityManager) appContext.getSystemService(Context.CONNECTIVITY_SERVICE);
                if (cm == null) {
                    return false;
                }
                Network active = cm.getActiveNetwork();
                if (active == null) {
                    return false;
                }
                NetworkCapabilities caps = cm.getNetworkCapabilities(active);
                return caps != null && caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET);
            } catch (Exception e) {
                return false;
            }
        }

        @JavascriptInterface
        public String getNetworkType() {
            try {
                ConnectivityManager cm = (ConnectivityManager) appContext.getSystemService(Context.CONNECTIVITY_SERVICE);
                if (cm == null) {
                    return "OFFLINE";
                }
                Network active = cm.getActiveNetwork();
                if (active == null) {
                    return "OFFLINE";
                }
                NetworkCapabilities caps = cm.getNetworkCapabilities(active);
                if (caps == null || !caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)) {
                    return "OFFLINE";
                }
                if (caps.hasTransport(NetworkCapabilities.TRANSPORT_WIFI)) {
                    return "WIFI";
                }
                if (caps.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR)) {
                    return "CELLULAR";
                }
                if (caps.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET)) {
                    return "ETHERNET";
                }
                return "ONLINE";
            } catch (Exception e) {
                return "OFFLINE";
            }
        }

        @JavascriptInterface
        public void vibrateEmergency() {
            try {
                Vibrator vibrator = (Vibrator) appContext.getSystemService(Context.VIBRATOR_SERVICE);
                if (vibrator == null || !vibrator.hasVibrator()) {
                    return;
                }
                long[] pattern = new long[]{0, 280, 120, 280, 120, 480};
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    vibrator.vibrate(VibrationEffect.createWaveform(pattern, -1));
                } else {
                    vibrator.vibrate(pattern, -1);
                }
            } catch (Exception e) {
                Log.w(TAG, "Emergency vibration failed", e);
            }
        }

        @JavascriptInterface
        public void vibratePulse(long durationMs) {
            try {
                long clamped = Math.max(10L, Math.min(durationMs, 2000L));
                Vibrator vibrator = (Vibrator) appContext.getSystemService(Context.VIBRATOR_SERVICE);
                if (vibrator == null || !vibrator.hasVibrator()) {
                    return;
                }
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    vibrator.vibrate(VibrationEffect.createOneShot(clamped, VibrationEffect.DEFAULT_AMPLITUDE));
                } else {
                    vibrator.vibrate(clamped);
                }
            } catch (Exception ignored) {
            }
        }

        @JavascriptInterface
        public void dialEmergency(final String number) {
            final String target = (number == null || number.trim().isEmpty()) ? "108" : number.trim();
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    openDialer(Uri.parse("tel:" + Uri.encode(target)));
                }
            });
        }

        @JavascriptInterface
        public void switchMode(final String mode) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    loadMode(mode);
                }
            });
        }

        @JavascriptInterface
        public String getDefaultHubUrl() {
            return LocalAssetServer.DEFAULT_HUB_URL;
        }

        @JavascriptInterface
        public String getActiveMode() {
            return activeMode;
        }

        @JavascriptInterface
        public void showToast(final String message) {
            if (message == null || message.isEmpty()) {
                return;
            }
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    Toast.makeText(MainActivity.this, message, Toast.LENGTH_SHORT).show();
                }
            });
        }

        @JavascriptInterface
        public String getDeviceInfoJson() {
            int port = assetServer != null ? assetServer.getPort() : -1;
            return "{"
                    + "\"model\":\"" + escapeJson(Build.MODEL) + "\","
                    + "\"manufacturer\":\"" + escapeJson(Build.MANUFACTURER) + "\","
                    + "\"androidVersion\":\"" + escapeJson(Build.VERSION.RELEASE) + "\","
                    + "\"sdkInt\":" + Build.VERSION.SDK_INT + ","
                    + "\"batteryPercent\":" + getBatteryPercent() + ","
                    + "\"charging\":" + isCharging() + ","
                    + "\"totalRamMb\":" + getTotalRamMb() + ","
                    + "\"availableRamMb\":" + getAvailableRamMb() + ","
                    + "\"cpuCores\":" + getCpuCores() + ","
                    + "\"online\":" + isOnline() + ","
                    + "\"networkType\":\"" + escapeJson(getNetworkType()) + "\","
                    + "\"defaultHubUrl\":\"" + escapeJson(LocalAssetServer.DEFAULT_HUB_URL) + "\","
                    + "\"localServerPort\":" + port + ","
                    + "\"activeMode\":\"" + escapeJson(activeMode) + "\""
                    + "}";
        }

        private String escapeJson(String s) {
            if (s == null) {
                return "";
            }
            return s.replace("\\", "\\\\").replace("\"", "\\\"");
        }
    }
}
