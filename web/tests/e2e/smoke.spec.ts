import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("Asclepius web smoke @smoke", () => {
  test("dashboard renders with accessible landmarks", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Asclepius FHIR console" })).toBeVisible();
    await expect(page.locator("#main-content")).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });

  test("dev auth page is reachable", async ({ page }) => {
    await page.goto("/auth");
    await expect(page.getByRole("heading", { name: "Dev authentication" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Issue token" })).toBeVisible();
  });
});
