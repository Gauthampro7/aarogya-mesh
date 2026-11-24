package com.aarogyamesh.app;

import android.content.res.AssetManager;
import android.util.Log;

import java.io.BufferedInputStream;
import java.io.BufferedReader;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.ServerSocket;
import java.net.Socket;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Lightweight pure-Java loopback HTTP/1.1 asset server bound strictly to 127.0.0.1.
 *
 * Serving bundled PWA assets over http://127.0.0.1:<port> gives Android WebView a
 * genuine W3C Secure Context so IndexedDB, crypto.randomUUID(), Service Workers,
 * and offline getUserMedia() microphone recording work natively without internet.
 */
public final class LocalAssetServer {
    private static final String TAG = "LocalAssetServer";

    /**
     * Preferred port inside the IANA ephemeral range (49152-65535) so the WebView
     * origin stays stable across normal app restarts (preserving IndexedDB & localStorage).
     * Automatically falls back to OS-assigned ephemeral port 0 if busy.
     */
    private static final int PREFERRED_PORT = 49842;
    private static final int SOCKET_TIMEOUT_MS = 10_000;

    public static final String DEFAULT_HUB_URL = "http://192.168.1.14:8000";

    private static final String HUB_PRESEED_SCRIPT =
            "<script>(function(){try{var d=\"" + DEFAULT_HUB_URL + "\";"
            + "if(!localStorage.getItem(\"aarogya.hubUrl\")){localStorage.setItem(\"aarogya.hubUrl\",d);}"
            + "if(!localStorage.getItem(\"aarogya.watch.hubUrl\")){localStorage.setItem(\"aarogya.watch.hubUrl\",d);}"
            + "}catch(e){}})();</script>";

    private static final String LANDING_SHELL_HTML =
            "<!doctype html>\n"
            + "<html lang=\"en\">\n"
            + "<head>\n"
            + "<meta charset=\"UTF-8\">\n"
            + "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1.0\">\n"
            + "<meta name=\"theme-color\" content=\"#0f172a\">\n"
            + "<title>Aarogya Mesh</title>\n"
            + HUB_PRESEED_SCRIPT + "\n"
            + "<style>\n"
            + "*{box-sizing:border-box;margin:0;padding:0}\n"
            + "html,body{width:100%;height:100%;overflow:hidden;background:#0f172a;color:#f8fafc;"
            + "font-family:system-ui,-apple-system,sans-serif}\n"
            + ".shell{display:flex;flex-direction:column;width:100%;height:100%}\n"
            + ".bar{display:flex;align-items:center;justify-content:space-between;gap:8px;"
            + "padding:6px 10px;background:#0f172a;border-bottom:1px solid #1e293b;flex-shrink:0}\n"
            + ".brand{font-size:13px;font-weight:800;color:#5eead4;letter-spacing:.2px;white-space:nowrap}\n"
            + ".tabs{display:flex;gap:6px;flex:1;justify-content:flex-end}\n"
            + ".tab{border:1px solid #334155;background:#1e293b;color:#cbd5e1;border-radius:999px;"
            + "padding:5px 11px;font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap}\n"
            + ".tab.active{background:#0d9488;border-color:#14b8a6;color:#020617}\n"
            + "iframe{flex:1;width:100%;height:100%;border:0;background:#0f172a}\n"
            + "</style>\n"
            + "</head>\n"
            + "<body>\n"
            + "<div class=\"shell\">\n"
            + "  <header class=\"bar\">\n"
            + "    <span class=\"brand\">Aarogya Mesh</span>\n"
            + "    <nav class=\"tabs\">\n"
            + "      <button id=\"tab-phone\" class=\"tab active\" type=\"button\">ASHA Field</button>\n"
            + "      <button id=\"tab-watch\" class=\"tab\" type=\"button\">Watch / SOS</button>\n"
            + "    </nav>\n"
            + "  </header>\n"
            + "  <iframe id=\"app-frame\" src=\"/phone/\" allow=\"microphone; autoplay; clipboard-read; clipboard-write\"></iframe>\n"
            + "</div>\n"
            + "<script>\n"
            + "(function(){\n"
            + "  var frame=document.getElementById('app-frame');\n"
            + "  var bPhone=document.getElementById('tab-phone');\n"
            + "  var bWatch=document.getElementById('tab-watch');\n"
            + "  function activate(mode){\n"
            + "    var isWatch=(mode==='watch');\n"
            + "    frame.src=isWatch?'/watch/':'/phone/';\n"
            + "    bPhone.classList.toggle('active',!isWatch);\n"
            + "    bWatch.classList.toggle('active',isWatch);\n"
            + "  }\n"
            + "  bPhone.addEventListener('click',function(){activate('phone');});\n"
            + "  bWatch.addEventListener('click',function(){activate('watch');});\n"
            + "})();\n"
            + "</script>\n"
            + "</body>\n"
            + "</html>\n";

    private final AssetManager assets;
    private ServerSocket serverSocket;
    private ExecutorService pool;
    private Thread acceptThread;
    private volatile boolean running;
    private int boundPort = -1;

    public LocalAssetServer(AssetManager assets) {
        this.assets = assets;
    }

    public synchronized int start() throws IOException {
        if (running && boundPort > 0) {
            return boundPort;
        }
        InetAddress loopback = InetAddress.getByName("127.0.0.1");
        ServerSocket ss = new ServerSocket();
        ss.setReuseAddress(true);
        try {
            ss.bind(new InetSocketAddress(loopback, PREFERRED_PORT), 64);
        } catch (IOException busy) {
            Log.w(TAG, "Preferred port " + PREFERRED_PORT + " unavailable; falling back to ephemeral port", busy);
            ss.close();
            ss = new ServerSocket();
            ss.setReuseAddress(true);
            ss.bind(new InetSocketAddress(loopback, 0), 64);
        }

        this.serverSocket = ss;
        this.boundPort = ss.getLocalPort();
        this.pool = Executors.newCachedThreadPool();
        this.running = true;

        final ServerSocket activeSocket = ss;
        this.acceptThread = new Thread(new Runnable() {
            @Override
            public void run() {
                acceptLoop(activeSocket);
            }
        }, "AarogyaLocalAssetServer");
        this.acceptThread.setDaemon(true);
        this.acceptThread.start();

        Log.i(TAG, "Bound strictly to http://127.0.0.1:" + boundPort);
        return boundPort;
    }

    public int getPort() {
        return boundPort;
    }

    public String getBaseUrl() {
        return "http://127.0.0.1:" + boundPort;
    }

    public synchronized void stop() {
        running = false;
        if (serverSocket != null) {
            try {
                serverSocket.close();
            } catch (IOException ignored) {
            }
            serverSocket = null;
        }
        if (pool != null) {
            pool.shutdownNow();
            pool = null;
        }
        boundPort = -1;
    }

    private void acceptLoop(ServerSocket ss) {
        while (running && !ss.isClosed()) {
            try {
                final Socket client = ss.accept();
                ExecutorService currentPool = this.pool;
                if (currentPool != null && !currentPool.isShutdown()) {
                    currentPool.execute(new Runnable() {
                        @Override
                        public void run() {
                            handleClient(client);
                        }
                    });
                } else {
                    client.close();
                }
            } catch (IOException e) {
                if (running) {
                    Log.w(TAG, "Accept error: " + e.getMessage());
                }
            }
        }
    }

    private void handleClient(Socket socket) {
        try {
            socket.setSoTimeout(SOCKET_TIMEOUT_MS);
            BufferedReader reader = new BufferedReader(
                    new InputStreamReader(new BufferedInputStream(socket.getInputStream()), StandardCharsets.UTF_8));
            OutputStream out = socket.getOutputStream();

            String requestLine = reader.readLine();
            if (requestLine == null || requestLine.trim().isEmpty()) {
                return;
            }
            // Drain HTTP headers until blank line
            String header;
            while ((header = reader.readLine()) != null && !header.isEmpty()) {
                // No request body expected for GET/HEAD/OPTIONS
            }

            String[] parts = requestLine.split(" ");
            if (parts.length < 2) {
                writeTextResponse(out, 400, "Bad Request", "text/plain; charset=utf-8", "Bad Request", false);
                return;
            }
            String method = parts[0].toUpperCase(Locale.US);
            String rawTarget = parts[1];

            if ("OPTIONS".equals(method)) {
                writeOptionsResponse(out);
                return;
            }
            boolean headOnly = "HEAD".equals(method);
            if (!"GET".equals(method) && !headOnly) {
                writeTextResponse(out, 405, "Method Not Allowed", "text/plain; charset=utf-8", "Method Not Allowed", headOnly);
                return;
            }

            String cleanPath = sanitizePath(rawTarget);
            if (cleanPath == null) {
                writeTextResponse(out, 400, "Bad Request", "text/plain; charset=utf-8", "Invalid path", headOnly);
                return;
            }

            // Route 1: Landing shell at /
            if ("/".equals(cleanPath) || "/index.html".equals(cleanPath)) {
                byte[] body = LANDING_SHELL_HTML.getBytes(StandardCharsets.UTF_8);
                writeBytesResponse(out, 200, "OK", "text/html; charset=utf-8", body, headOnly);
                return;
            }

            // Route 2: Canonical trailing-slash redirects so relative ./dist/* resolves cleanly
            if ("/phone".equals(cleanPath)) {
                writeRedirect(out, "/phone/");
                return;
            }
            if ("/watch".equals(cleanPath)) {
                writeRedirect(out, "/watch/");
                return;
            }

            // Route 3: Favicon fallback to avoid 404 noise in console
            if ("/favicon.ico".equals(cleanPath)) {
                serveAsset(out, "phone/icons/icon-192.png", "image/png", false, headOnly);
                return;
            }

            // Route 4: /phone/* and /watch/* static bundles from APK assets
            if (cleanPath.startsWith("/phone/")) {
                String rel = cleanPath.substring("/phone/".length());
                if (rel.isEmpty()) {
                    rel = "index.html";
                }
                boolean injectPreseed = "index.html".equals(rel);
                serveAsset(out, "phone/" + rel, mimeTypeFor(rel), injectPreseed, headOnly);
                return;
            }

            if (cleanPath.startsWith("/watch/")) {
                String rel = cleanPath.substring("/watch/".length());
                if (rel.isEmpty()) {
                    rel = "index.html";
                }
                boolean injectPreseed = "index.html".equals(rel);
                serveAsset(out, "watch/" + rel, mimeTypeFor(rel), injectPreseed, headOnly);
                return;
            }

            writeTextResponse(out, 404, "Not Found", "text/plain; charset=utf-8", "Not Found: " + cleanPath, headOnly);
        } catch (IOException ignored) {
            // Client disconnected or timed out
        } finally {
            try {
                socket.close();
            } catch (IOException ignored) {
            }
        }
    }

    private void serveAsset(OutputStream out, String assetPath, String mimeType, boolean injectPreseed, boolean headOnly)
            throws IOException {
        byte[] data = readAssetBytes(assetPath);
        if (data == null) {
            writeTextResponse(out, 404, "Not Found", "text/plain; charset=utf-8", "Asset not found: " + assetPath, headOnly);
            return;
        }
        if (injectPreseed) {
            String html = new String(data, StandardCharsets.UTF_8);
            String injected = injectHubPreseed(html);
            data = injected.getBytes(StandardCharsets.UTF_8);
        }
        writeBytesResponse(out, 200, "OK", mimeType, data, headOnly);
    }

    private static String injectHubPreseed(String html) {
        int headIdx = html.indexOf("<head>");
        if (headIdx >= 0) {
            int insertPos = headIdx + "<head>".length();
            return html.substring(0, insertPos) + "\n    " + HUB_PRESEED_SCRIPT + html.substring(insertPos);
        }
        return HUB_PRESEED_SCRIPT + html;
    }

    private byte[] readAssetBytes(String assetPath) {
        InputStream in = null;
        try {
            in = assets.open(assetPath);
            ByteArrayOutputStream buffer = new ByteArrayOutputStream(8192);
            byte[] chunk = new byte[8192];
            int n;
            while ((n = in.read(chunk)) != -1) {
                buffer.write(chunk, 0, n);
            }
            return buffer.toByteArray();
        } catch (IOException e) {
            return null;
        } finally {
            if (in != null) {
                try {
                    in.close();
                } catch (IOException ignored) {
                }
            }
        }
    }

    private static String sanitizePath(String rawTarget) {
        if (rawTarget == null || rawTarget.isEmpty()) {
            return "/";
        }
        int q = rawTarget.indexOf('?');
        String path = q >= 0 ? rawTarget.substring(0, q) : rawTarget;
        int hash = path.indexOf('#');
        if (hash >= 0) {
            path = path.substring(0, hash);
        }
        try {
            path = URLDecoder.decode(path, "UTF-8");
        } catch (Exception e) {
            return null;
        }
        if (!path.startsWith("/") || path.contains("..") || path.contains("\\") || path.indexOf('\0') >= 0) {
            return null;
        }
        while (path.contains("//")) {
            path = path.replace("//", "/");
        }
        return path;
    }

    public static String mimeTypeFor(String path) {
        String lower = path.toLowerCase(Locale.US);
        if (lower.endsWith(".html") || lower.endsWith(".htm")) {
            return "text/html; charset=utf-8";
        }
        if (lower.endsWith(".js") || lower.endsWith(".mjs")) {
            return "application/javascript; charset=utf-8";
        }
        if (lower.endsWith(".css")) {
            return "text/css; charset=utf-8";
        }
        if (lower.endsWith(".svg")) {
            return "image/svg+xml";
        }
        if (lower.endsWith(".png")) {
            return "image/png";
        }
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) {
            return "image/jpeg";
        }
        if (lower.endsWith(".webp")) {
            return "image/webp";
        }
        if (lower.endsWith(".ico")) {
            return "image/x-icon";
        }
        if (lower.endsWith(".webmanifest")) {
            return "application/manifest+json; charset=utf-8";
        }
        if (lower.endsWith(".json") || lower.endsWith(".map")) {
            return "application/json; charset=utf-8";
        }
        if (lower.endsWith(".wasm")) {
            return "application/wasm";
        }
        return "application/octet-stream";
    }

    private static void writeRedirect(OutputStream out, String location) throws IOException {
        String resp = "HTTP/1.1 302 Found\r\n"
                + "Location: " + location + "\r\n"
                + "Content-Length: 0\r\n"
                + "Connection: close\r\n\r\n";
        out.write(resp.getBytes(StandardCharsets.US_ASCII));
        out.flush();
    }

    private static void writeOptionsResponse(OutputStream out) throws IOException {
        String resp = "HTTP/1.1 204 No Content\r\n"
                + "Allow: GET, HEAD, OPTIONS\r\n"
                + "Content-Length: 0\r\n"
                + "Connection: close\r\n\r\n";
        out.write(resp.getBytes(StandardCharsets.US_ASCII));
        out.flush();
    }

    private static void writeTextResponse(OutputStream out, int code, String reason, String contentType, String text, boolean headOnly)
            throws IOException {
        writeBytesResponse(out, code, reason, contentType, text.getBytes(StandardCharsets.UTF_8), headOnly);
    }

    private static void writeBytesResponse(OutputStream out, int code, String reason, String contentType, byte[] body, boolean headOnly)
            throws IOException {
        String header = "HTTP/1.1 " + code + " " + reason + "\r\n"
                + "Content-Type: " + contentType + "\r\n"
                + "Content-Length: " + body.length + "\r\n"
                + "Cache-Control: no-cache\r\n"
                + "X-Content-Type-Options: nosniff\r\n"
                + "Connection: close\r\n\r\n";
        out.write(header.getBytes(StandardCharsets.US_ASCII));
        if (!headOnly && body.length > 0) {
            out.write(body);
        }
        out.flush();
    }
}
