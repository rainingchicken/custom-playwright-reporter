import { test, expect } from "@playwright/test";

test.describe("Describe1", async () => {
  test("Describe1 Test1", async ({ page }) => {
    await page.goto("https://playwright.dev/");

    // Expect a title "to contain" a substring.
    await expect(page).toHaveTitle(/Playwright/);
  });
});
test.describe("Describ2", async () => {
  test("Describe2 Test1", async ({ page }) => {
    await test.step("Describe2 Test1 Step1", async () => {
      await page.goto("https://playwright.dev/");
    });

    await test.step("Describe2 Test1 Step2", async () => {
      // Click the get started link.
      await page.getByRole("link", { name: "Get starteddd" }).click();
    });

    await test.step("Describe2 Test1 Ste3", async () => {
      // Expects page to have a heading with the name of Installation.
      await expect(
        page.getByRole("heading", { name: "Installation" })
      ).toBeVisible();
    });

    await test.step("Describe2 Test1 Step4", async () => {
      // Expects page to have a heading with the name of Installation.
      await expect(
        page.getByRole("heading", { name: "Installation" })
      ).toBeVisible();
    });
  });
});
