import { expect, test } from "@playwright/test";

const password = "quiet-tunnel-e2e-password";

test("owner can generate and clear a mock profile without sending a private key", async ({ page }) => {
  const generationRequest = page.waitForRequest((request) => request.url().includes("/api/v1/generate") && request.method() === "POST");
  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
  await page.getByLabel("Пароль").fill(password);
  await page.getByRole("button", { name: "Войти" }).click();
  await expect(page).toHaveURL(/\/$/);

  await expect(page.getByText(/MOCK/).first()).toBeVisible();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: /Создать конфигурацию/ }).click();
  const request = await generationRequest;
  const body = request.postDataJSON() as Record<string, unknown>;
  expect(body).toEqual({ public_key: expect.any(String), format: "wireguard", platform: "android", terms_accepted: true });
  expect(JSON.stringify(body)).not.toContain("private_key");
  await expect(page.locator("section.result")).toBeVisible();
  await expect(page.getByText(/Mock выдаёт фиктивные параметры/).last()).toBeVisible();

  const downloadWait = page.waitForEvent("download");
  await page.getByRole("button", { name: /Скачать \.conf/ }).click();
  const download = await downloadWait;
  expect(download.suggestedFilename()).toMatch(/\.conf$/);
  await page.getByRole("button", { name: "Показать конфигурацию" }).click();
  await expect(page.locator("pre.config-text")).toContainText("PrivateKey =");
  await expect(page.locator("pre.config-text")).toContainText("198.51.100.1:51820");
  await page.getByRole("button", { name: "Удалить профиль" }).first().click();
  await expect(page.locator("pre.config-text")).toHaveCount(0);
});

test("application remains within viewport on mobile", async ({ page, isMobile }) => {
  test.skip(!isMobile, "Mobile-only layout check");
  await page.goto("/");
  await page.getByLabel("Пароль").fill(password);
  await page.getByRole("button", { name: "Войти" }).click();
  await expect(page).toHaveURL(/\/$/);
  const dimensions = await page.evaluate(() => ({ document: document.documentElement.scrollWidth, viewport: document.documentElement.clientWidth }));
  expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport);
});
