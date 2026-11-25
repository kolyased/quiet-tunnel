import { defineConfig, devices } from "@playwright/test";

const remoteBaseURL = process.env.PLAYWRIGHT_BASE_URL;

export default defineConfig({
  testDir: "./e2e",
  use: { baseURL: remoteBaseURL ?? "http://127.0.0.1:13001", trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["iPhone 13"], browserName: "chromium" } },
  ],
  ...(remoteBaseURL ? {} : {
    webServer: [
      {
        command: "if [ -x .venv/bin/uvicorn ]; then .venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 18001; else python3 -m uvicorn app.main:app --host 127.0.0.1 --port 18001; fi",
        cwd: "../backend",
        url: "http://127.0.0.1:18001/api/v1/health",
        reuseExistingServer: false,
        timeout: 120_000,
        env: {
          APP_ENV: "development",
          APP_MODE: "mock",
          VPN_PROVIDER: "mock",
          AUTH_PASSWORD_HASH: "scrypt$16384$8$1$j5ACuSNXNtlonLfgkwmWOw$V341VgQ1hjMVcC9Y7oxOiDEXEQoczhh3y0CaCBBmVBk",
          AUTH_SESSION_SECRET: "e2e-only-session-secret-0123456789abcdef",
          ALLOWED_ORIGINS: "http://127.0.0.1:13001",
          RATE_LIMIT_REQUESTS: "20",
          RATE_LIMIT_WINDOW_SECONDS: "60",
        },
      },
      {
        command: "npm run build && PORT=13001 npm run start",
        url: "http://127.0.0.1:13001",
        reuseExistingServer: false,
        timeout: 180_000,
        env: { BACKEND_INTERNAL_URL: "http://127.0.0.1:18001" },
      },
    ],
  }),
});
