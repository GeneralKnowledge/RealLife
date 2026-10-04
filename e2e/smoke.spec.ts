import { expect, test } from "@playwright/test";

test("home page shows brand and escapes", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("GET OUTSIDE").first()).toBeVisible();
  await expect(page.getByRole("link", { name: /PLAN THE ESCAPE|GET OUTSIDE/i }).first()).toBeVisible();
});

test("outside briefing appears on home and news pages", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Outside briefing/i })).toBeVisible();
  await page.goto("/news");
  await expect(page.getByText("GET OUTSIDE").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: /Outside briefing/i })).toBeVisible();
});

test("admin login and funnel page", async ({ page }) => {
  await page.goto("/admin");
  await page.getByPlaceholder("Admin token").fill("dev-admin-token");
  await page.getByRole("button", { name: "Enter admin" }).click();
  await expect(page.getByText("Conversion funnel")).toBeVisible();
});

test("landing page tracks through to affiliate redirect endpoint", async ({ page }) => {
  await page.goto("/escape/cairngorms-escape");
  await expect(page.getByText("GET OUTSIDE").first()).toBeVisible();
  const book = page.getByRole("link", { name: /PLAN THE ESCAPE/i });
  await expect(book).toHaveAttribute("href", /\/api\/affiliate\//);
});
