import { test, expect } from "@playwright/test";

test("Test1", async ({ page }) => {
  await page.goto("https://playwright.dev/");

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Playwright/);
});

test("Test2", async ({ page }) => {
  await test.step("Test2 Step1", async () => {
    await page.goto("https://playwright.dev/");
  });

  await test.step("Test2 Step2", async () => {
    // Click the get started link.
    await page.getByRole("link", { name: "Get started" }).click();
  });

  await test.step("Test2 Step3", async () => {
    // Expects page to have a heading with the name of Installation.
    await expect(
      page.getByRole("heading", { name: "Installation" })
    ).toBeVisible();
  });
});
