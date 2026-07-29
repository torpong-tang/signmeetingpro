import { expect, test, type Page } from "@playwright/test";
import { adminEmail, adminPassword } from "./credentials";

async function login(page: Page) {
  await page.goto("/login");
  await expect(page.locator("form")).toHaveAttribute("data-hydrated", "true");
  await page.getByLabel("E-mail *").fill(adminEmail);
  await page.getByLabel("Password *").fill(adminPassword);
  await page.getByRole("button", { name: "เข้าสู่ระบบ" }).click();
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
}

async function drawSignature(page: Page) {
  const canvas = page.getByLabel("ช่องเขียนลายมือชื่อ");
  await canvas.scrollIntoViewIfNeeded();
  await canvas.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  const box = await canvas.boundingBox();
  expect(box).toBeTruthy();
  await page.mouse.move(box!.x + 40, box!.y + box!.height / 2);
  await page.mouse.down();
  await page.mouse.move(box!.x + box!.width * 0.35, box!.y + box!.height * 0.35, {
    steps: 8,
  });
  await page.mouse.move(box!.x + box!.width * 0.65, box!.y + box!.height * 0.65, {
    steps: 8,
  });
  await page.mouse.up();
}

async function fillOpenRegistration(page: Page, suffix: string) {
  await page.getByLabel("ชื่อ", { exact: true }).fill(`QA${suffix}`);
  await page.getByLabel("นามสกุล", { exact: true }).fill("Registration");
  await page.getByLabel("ตำแหน่ง", { exact: true }).fill("QA Tester");
  await page
    .getByLabel("หน่วยงาน/สังกัด", { exact: true })
    .fill("TPT Test Team");
  await page.getByLabel("โทรศัพท์", { exact: true }).fill("0890000000");
  await page
    .getByLabel("E-mail", { exact: true })
    .fill(`qa-${suffix.toLowerCase()}@example.com`);
  await drawSignature(page);
}

test("registration actions require confirmation and continuous save resets the form", async ({
  page,
}, testInfo) => {
  await login(page);
  const cookieHeader = (await page.context().cookies())
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");
  const bootstrapResponse = await page.request.get("/api/bootstrap", {
    headers: { cookie: cookieHeader },
  });
  expect(bootstrapResponse.ok()).toBe(true);
  const bootstrap = await bootstrapResponse.json();
  const meeting = bootstrap.meetings.find(
    (record: { title: string }) =>
      record.title === "QA Registration Modes 4 - Group and Open",
  );
  expect(meeting).toBeTruthy();
  const openChannel = meeting.channels.find(
    (channel: { mode: string }) => channel.mode === "OPEN",
  );
  expect(openChannel).toBeTruthy();

  await page.route("**/api/public/register/**", async (route) => {
    if (route.request().method() !== "POST") {
      await route.continue();
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        personNo: 26,
        meetingCode: meeting.meetingCode,
      }),
    });
  });

  await page.goto(`/register/${openChannel.token}`);
  await expect(
    page.getByRole("heading", { name: meeting.title }),
  ).toBeVisible();
  const channelImage = page.getByRole("img", { name: /รูปประกอบ/ });
  await expect(channelImage).toBeVisible();
  const imageLayout = await channelImage.evaluate((image) => {
    const imageBox = image.getBoundingClientRect();
    const frameBox = image.parentElement?.getBoundingClientRect();
    return {
      imageWidth: imageBox.width,
      imageHeight: imageBox.height,
      frameWidth: frameBox?.width || 0,
      frameHeight: frameBox?.height || 0,
      naturalWidth: (image as HTMLImageElement).naturalWidth,
      naturalHeight: (image as HTMLImageElement).naturalHeight,
    };
  });
  expect(imageLayout.imageWidth).toBeLessThanOrEqual(imageLayout.frameWidth);
  expect(imageLayout.imageHeight).toBeLessThanOrEqual(imageLayout.frameHeight);
  expect(imageLayout.imageWidth / imageLayout.imageHeight).toBeCloseTo(
    imageLayout.frameWidth / imageLayout.frameHeight,
    1,
  );

  await fillOpenRegistration(page, "Continue");
  const clearButton = page.getByRole("button", { name: "ล้างลายมือชื่อ" });
  await expect(clearButton).toBeEnabled();

  await clearButton.click();
  let dialog = page.getByRole("alertdialog");
  await expect(
    dialog.getByRole("heading", { name: "ยืนยันการล้างลายมือชื่อ" }),
  ).toBeVisible();
  await dialog.getByRole("button", { name: "ยกเลิก" }).click();
  await expect(clearButton).toBeEnabled();

  await clearButton.click();
  dialog = page.getByRole("alertdialog");
  await dialog.getByRole("button", { name: "ล้างลายมือชื่อ" }).click();
  await expect(clearButton).toBeDisabled();
  await drawSignature(page);

  await page.getByRole("button", { name: "บันทึก(ต่อ)", exact: true }).click();
  dialog = page.getByRole("alertdialog");
  await expect(
    dialog.getByRole("heading", { name: "ยืนยันการบันทึกต่อเนื่อง" }),
  ).toBeVisible();
  await dialog.getByRole("button", { name: "บันทึก(ต่อ)", exact: true }).click();
  await expect(
    page.getByText("กำลังบันทึกการลงทะเบียน...", { exact: true }),
  ).toBeVisible();

  dialog = page.getByRole("alertdialog");
  await expect(
    dialog.getByRole("heading", { name: "ลงทะเบียนสำเร็จ" }),
  ).toBeVisible();
  await expect(dialog.getByText(`${meeting.meetingCode} ลำดับที่ 26`)).toBeVisible();
  await dialog.getByRole("button", { name: "ยืนยัน" }).click();

  await expect(page.getByLabel("ชื่อ", { exact: true })).toHaveValue("");
  await expect(page.getByLabel("นามสกุล", { exact: true })).toHaveValue("");
  await expect(page.getByLabel("ตำแหน่ง", { exact: true })).toHaveValue("");
  await expect(
    page.getByLabel("หน่วยงาน/สังกัด", { exact: true }),
  ).toHaveValue("");
  await expect(clearButton).toBeDisabled();

  await page.getByRole("button", { name: "ปิด", exact: true }).click();
  dialog = page.getByRole("alertdialog");
  await expect(
    dialog.getByRole("heading", { name: "ต้องการปิดหน้าลงทะเบียน?" }),
  ).toBeVisible();
  await dialog.getByRole("button", { name: "ยกเลิก" }).click();
  await expect(page.getByRole("heading", { name: meeting.title })).toBeVisible();

  await fillOpenRegistration(page, "Close");
  await page.getByRole("button", { name: "บันทึก", exact: true }).click();
  dialog = page.getByRole("alertdialog");
  await expect(
    dialog.getByRole("heading", { name: "ยืนยันการบันทึก" }),
  ).toBeVisible();
  await dialog.getByRole("button", { name: "ยกเลิก" }).click();
  await expect(dialog).toBeHidden();

  const screenshotPath = testInfo.outputPath("registration-actions.png");
  await page.screenshot({ path: screenshotPath, fullPage: true });
  await testInfo.attach("registration-actions", {
    path: screenshotPath,
    contentType: "image/png",
  });
});
