import { expect, test } from "@playwright/test";
import { adminEmail, adminPassword } from "./credentials";

test("admin can login and see the responsive dashboard", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "เข้าสู่ระบบ" })).toBeVisible();
  await expect(page.locator("form")).toHaveAttribute("data-hydrated", "true");
  await page.getByLabel("E-mail *").fill(adminEmail);
  await page.getByLabel("Password *").fill(adminPassword);
  await page.getByRole("button", { name: "เข้าสู่ระบบ" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await expect(page.getByText("Projects", { exact: true })).toBeVisible();
  const meetingsButton = page.getByRole("button", { name: "การประชุม Meeting workspace" });
  await expect(meetingsButton).toBeVisible();
  await meetingsButton.click();
  await expect(page).toHaveURL(/\/meetings$/);
  await expect(page.getByRole("heading", { name: "รายการการประชุม" })).toBeVisible();
});

test("logout redirects to one login base path", async ({ page }) => {
  await page.goto("/login");
  await expect(page.locator("form")).toHaveAttribute("data-hydrated", "true");
  await page.getByLabel("E-mail *").fill(adminEmail);
  await page.getByLabel("Password *").fill(adminPassword);
  await page.getByRole("button", { name: "เข้าสู่ระบบ" }).click();
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

  await page.locator("#tour-profile").click();
  await page.getByRole("menuitem", { name: "ออกจากระบบ" }).click();
  await page.getByRole("button", { name: "ออกจากระบบ" }).click();

  await expect(page).toHaveURL(/\/login$/);
  await expect(page).not.toHaveURL(/\/signmeetingpro\/signmeetingpro\//);
  await expect(page.getByRole("heading", { name: "เข้าสู่ระบบ" })).toBeVisible();
});

test("invalid credentials are rejected without exposing details", async ({ page }) => {
  await page.goto("/login");
  await expect(page.locator("form")).toHaveAttribute("data-hydrated", "true");
  await page.getByLabel("E-mail *").fill("invalid@example.com");
  await page.getByLabel("Password *").fill("invalid-password");
  await page.getByRole("button", { name: "เข้าสู่ระบบ" }).click();
  await expect(page.getByText("อีเมลหรือรหัสผ่านไม่ถูกต้อง", { exact: true })).toBeVisible();
});

test("protected meeting pages require a valid session", async ({ page }) => {
  await page.goto("/meetings");
  await expect(page).toHaveURL(/\/login$/);

  await page.goto("/meetings/not-a-real-meeting");
  await expect(page).toHaveURL(/\/login$/);
});
