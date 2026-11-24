Warning: truncated output (original token count: 303)
Total output lines: 19

import { expect, test } from "@playwright/test";

test("demo generator is explicit, downloadable, and clearable", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle");
  await expect(page.getByText(/Демонстрационный режим/)).toBeVisible();
  if (test.info().project.name === "mobile") {
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
  }
  await page.screenshot({ path: `../docs/screenshots/home-${test.info().project.name}.png`, fullPage: tr…3 tokens truncated…it page.getByRole("checkbox").check();
  await page.getByRole("button", { name: /Создать демонстрационный пример/ }).click();
  await expect(page.getByText(/не рабочий VPN-профиль/)).toBeVisible();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: /Скачать \.conf/ }).click();
  await expect(await download).toBeTruthy();
  await page.getByRole("button", { name: /Удалить из страницы/ }).click();
  await expect(page.getByText(/не рабочий VPN-профиль/)).toHaveCount(0);
});
