import { expect, test } from "@playwright/test";
import { readFile, writeFile } from "node:fs/promises";
import { adminEmail, adminPassword } from "./credentials";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await expect(page.locator("form")).toHaveAttribute("data-hydrated", "true");
  await page.getByLabel("E-mail *").fill(adminEmail);
  await page.getByLabel(/^(Password|รหัสผ่าน) \*$/).fill(adminPassword);
  await page.getByRole("button", { name: /^(เข้าสู่ระบบ|Sign in)$/ }).click();
  await expect(page.getByRole("heading", { name: /^(Dashboard|แดชบอร์ด)$/ })).toBeVisible();
}

test("persistent QA meetings expose QR names and attachment management", async ({ page }) => {
  await login(page);
  await expect(page.locator("#tour-menu-home")).toBeVisible();
  await expect(page.locator("#tour-menu-groups")).toBeVisible();

  await page.locator("#tour-menu-home").click();
  await expect(page).toHaveURL(/\/meetings$/);
  const meetingsPage = page;
  await expect(meetingsPage.getByRole("heading", { name: "รายการการประชุม" })).toBeVisible();
  await meetingsPage.getByPlaceholder("Live Search รหัส หัวข้อ โครงการ หรือสถานที่...").fill("QA SignMeetingPro Full Flow");

  const qaRows = meetingsPage.locator("tbody tr").filter({ hasText: "QA SignMeetingPro Full Flow" });
  await expect(qaRows).toHaveCount(4);
  await expect(meetingsPage.getByText("พบจำนวนรายการทั้งสิ้น 4 รายการ", { exact: true })).toBeVisible();
  if ((page.viewportSize()?.width || 0) >= 1024) {
    const meetingCodeHeader = meetingsPage.getByRole("columnheader", { name: /รหัส/ });
    await expect(meetingCodeHeader).toHaveAttribute("aria-sort", "descending");
    await meetingCodeHeader.getByRole("button").click();
    await expect(meetingCodeHeader).toHaveAttribute("aria-sort", "ascending");
  }

  const firstMeetingRecord = meetingsPage
    .locator("tr:visible, article:visible")
    .filter({ hasText: "QA SignMeetingPro Full Flow 1" });
  await expect(firstMeetingRecord).toHaveCount(1);
  await firstMeetingRecord
    .getByRole("button", { name: /^MTG-/ })
    .click();
  await expect(page).toHaveURL(/\/meetings\/[^/?]+$/);
  await expect(page.getByText("หน่วยงาน/สังกัด", { exact: true })).toHaveCount(2);
  await expect(page.getByText("QA Operations Team Registration", { exact: true })).toBeVisible();
  await expect(page.getByText("QA Partner Team Registration", { exact: true })).toBeVisible();
  await expect(page.getByRole("img", { name: /QR Code/ })).toHaveCount(2);
  await page.getByRole("button", { name: "กลับรายการการประชุม" }).click();
  await expect(page).toHaveURL(/\/meetings\?q=QA(\+|%20)SignMeetingPro(\+|%20)Full(\+|%20)Flow/);
  await expect(firstMeetingRecord).toHaveCount(1);

  await firstMeetingRecord
    .getByRole("button", { name: /^แก้ไข MTG-/ })
    .click();
  const editDialog = page.getByRole("dialog", { name: /แก้ไข MTG-/ });
  await expect(editDialog.getByText("รูปประกอบ QR Code ตาม Channel", { exact: true })).toBeVisible();
  await expect(editDialog.getByRole("button", { name: "เลือกรูป" })).toHaveCount(2);
  await editDialog.getByRole("button", { name: "ปิด", exact: true }).last().click();

  await firstMeetingRecord
    .getByRole("button", { name: "สร้างการประชุมซ้ำ" })
    .click();
  const copyDialog = page.getByRole("dialog", {
    name: "สร้างการประชุมใหม่",
  });
  await expect(copyDialog.getByRole("combobox", { name: "เลือกโครงการ" })).toBeDisabled();
  await expect(
    copyDialog.getByText("ล็อกตามโครงการของการประชุมต้นฉบับ"),
  ).toBeVisible();
  await copyDialog
    .getByRole("button", { name: "ปิด", exact: true })
    .last()
    .click();

  await firstMeetingRecord
    .getByRole("button", { name: /^เปิดผู้ลงทะเบียน \d+ คน$/ })
    .click();
  const attendanceDialog = page.getByRole("dialog", { name: /ผู้ลงทะเบียน MTG-/ });
  await expect(attendanceDialog.getByText("พบผู้ลงทะเบียนทั้งหมด")).toBeVisible();
  const channelTwoSection = attendanceDialog.locator("section").filter({
    hasText: "QR Channel 2",
  });
  const channelOneSection = attendanceDialog.locator("section").filter({
    hasText: "QR Channel 1",
  });
  await expect(channelTwoSection).toHaveCount(1);
  await expect(channelOneSection).toHaveCount(1);
  await expect(
    channelTwoSection.getByRole("columnheader", {
      name: /หน่วยงาน\/สังกัด/,
    }),
  ).toBeVisible();
  await expect(
    channelOneSection.getByRole("columnheader", {
      name: /หน่วยงาน\/สังกัด/,
    }),
  ).toBeVisible();
  await expect(channelTwoSection.locator("tbody tr")).toHaveCount(1);
  await expect(channelOneSection.locator("tbody tr")).toHaveCount(1);
  await expect(attendanceDialog.locator("tbody tr")).toHaveCount(2);
  await expect(
    attendanceDialog.getByText("พบจำนวนรายการทั้งสิ้น 1 รายการ", {
      exact: true,
    }),
  ).toHaveCount(2);
  const exportButton = attendanceDialog.getByRole("button", { name: "Export PDF", exact: true });
  await expect(exportButton).toBeVisible();
  const downloadPromise = page.waitForEvent("download");
  await exportButton.click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^MTG-.*-attendance-portrait\.pdf$/);
  const downloadedPath = await download.path();
  expect(downloadedPath).toBeTruthy();
  expect((await readFile(downloadedPath!)).subarray(0, 4).toString()).toBe("%PDF");
  await attendanceDialog
    .getByRole("button", { name: "ปิด", exact: true })
    .last()
    .click();

  await firstMeetingRecord.getByRole("button", { name: "จัดการไฟล์ประกอบ" }).click();
  const mediaDialog = page.getByRole("dialog", { name: /ไฟล์ประกอบ/ });
  await expect(mediaDialog.getByText("qa-meeting-1.png", { exact: true })).toBeVisible();
  const mediaThumbnail = mediaDialog.getByRole("img", {
    name: "รูปตัวอย่าง qa-meeting-1.png",
  });
  await expect(mediaThumbnail).toBeVisible();
  await expect
    .poll(() =>
      mediaThumbnail.evaluate(
        (image: HTMLImageElement) => image.naturalWidth,
      ),
    )
    .toBeGreaterThan(0);
  await expect(mediaDialog.getByText("qa-meeting-1.pdf", { exact: true })).toBeVisible();
  await mediaDialog
    .getByRole("button", { name: "ปิด", exact: true })
    .last()
    .click();
  await page.getByRole("button", { name: "กลับ Dashboard" }).click();
  await page.locator("#tour-menu-groups").click();
  const groupsDialog = page.getByRole("dialog", { name: "กลุ่มและผู้เข้าร่วมประชุม" });
  for (const groupName of ["QA Operations Team", "QA Partner Team", "QA Guest Team"]) {
    const groupCard = groupsDialog.locator("article").filter({ hasText: groupName });
    await expect(groupCard).toHaveCount(1);
    await expect(groupCard.getByText("5 รายชื่อ", { exact: true })).toBeVisible();
  }
});

test("attendance actions stay at the end and expose guarded edit and delete flows", async ({ page }) => {
  await login(page);
  await page.goto("/meetings");
  await expect(page).toHaveURL(/\/meetings$/);

  await page.getByRole("button", { name: /^เปิดผู้ลงทะเบียน [1-9]\d* คน$/ }).first().click();
  const attendanceDialog = page.getByRole("dialog", { name: /ผู้ลงทะเบียน MTG-/ });
  await expect(attendanceDialog).toBeVisible();

  const populatedTable = attendanceDialog
    .locator("table:has(button[aria-label^='แก้ไข '])")
    .first();
  await expect(populatedTable).toBeVisible();
  const headers = await populatedTable.locator("thead th").allTextContents();
  expect(headers.at(-1)?.trim()).toBe("จัดการ");

  await attendanceDialog.getByRole("button", { name: /^แก้ไข / }).first().click();
  const editDialog = page.getByRole("dialog", { name: "แก้ไขผู้ลงทะเบียน" });
  await expect(editDialog).toBeVisible();
  await expect(editDialog.getByLabel("ชื่อ *")).toBeVisible();
  await expect(editDialog.getByLabel("นามสกุล *")).toBeVisible();
  await expect(editDialog.getByLabel("ตำแหน่ง *")).toBeVisible();
  await expect(editDialog.getByText(/QR Channel .*ลำดับลงทะเบียน/)).toBeVisible();
  await editDialog.getByRole("button", { name: "ปิด", exact: true }).last().click();

  await attendanceDialog.getByRole("button", { name: /^ลบ / }).first().click();
  const confirmDialog = page.getByRole("alertdialog", { name: "ยืนยันการลบผู้ลงทะเบียน" });
  await expect(confirmDialog).toContainText("รายการและลายเซ็นจะถูกลบถาวร");
  await confirmDialog.getByRole("button", { name: "ยกเลิก" }).click();
});

test("QR channel images upload securely and remain available through the QR token", async ({ page }) => {
  await login(page);
  const cookieHeader = (await page.context().cookies())
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");
  const authenticatedHeaders = { cookie: cookieHeader };
  const bootstrapResponse = await page.request.get("/api/bootstrap", {
    headers: authenticatedHeaders,
  });
  expect(bootstrapResponse.ok()).toBe(true);
  const bootstrap = await bootstrapResponse.json();
  const meeting = bootstrap.meetings.find((record: { title: string }) =>
    record.title === "QA SignMeetingPro Full Flow 1"
  );
  expect(meeting).toBeTruthy();
  const channel = meeting.channels[0];
  test.skip(channel.hasImage, "Preserve the existing user-managed QR channel image.");

  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
    "base64",
  );
  const adminImageUrl = `/api/meetings/${meeting.id}/channels/${channel.channelNo}/image`;

  try {
    const uploadResponse = await page.request.post(adminImageUrl, {
      headers: authenticatedHeaders,
      multipart: {
        file: {
          name: "qr-channel-test.png",
          mimeType: "image/png",
          buffer: png,
        },
      },
    });
    expect(uploadResponse.status()).toBe(201);

    const adminImageResponse = await page.request.get(adminImageUrl, {
      headers: authenticatedHeaders,
    });
    expect(adminImageResponse.ok()).toBe(true);
    expect(adminImageResponse.headers()["content-type"]).toBe("image/png");

    const publicImageResponse = await page.request.get(
      `/api/public/register/${channel.token}/image`,
    );
    expect(publicImageResponse.ok()).toBe(true);
    expect(publicImageResponse.headers()["content-type"]).toBe("image/png");
  } finally {
    const deleteResponse = await page.request.delete(adminImageUrl, {
      headers: authenticatedHeaders,
    });
    expect(deleteResponse.ok()).toBe(true);
  }
});

test("switching QR channel mode clears stale group and organization values", async ({ page }) => {
  await login(page);
  await page.getByRole("button", { name: "การประชุม Meeting workspace" }).click();
  await expect(page).toHaveURL(/\/meetings$/);
  await page.getByRole("button", { name: "สร้างการประชุม", exact: true }).click();

  const createDialog = page.getByRole("dialog", { name: "สร้างการประชุมใหม่" });
  const channelTwo = createDialog
    .getByRole("heading", { name: "QR Channel 2" })
    .locator("..");
  const modeSelect = channelTwo.getByRole("combobox").first();

  await modeSelect.click();
  await page.getByRole("option", { name: "กรอกข้อมูลเอง" }).click();
  await expect(
    channelTwo.getByText(
      "ผู้ลงทะเบียนแบบ OPEN จะกรอกชื่อหน่วยงาน/สังกัดด้วยตนเองในหน้าลงทะเบียน",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(channelTwo.getByLabel("ชื่อหน่วยงาน/สังกัด *")).toHaveCount(0);

  await modeSelect.click();
  await page.getByRole("option", { name: "ระบุกลุ่ม" }).click();
  const groupOrganization = channelTwo.getByPlaceholder("เลือกกลุ่มผู้เข้าร่วมก่อน");
  await expect(groupOrganization).toHaveValue("");
  await expect(groupOrganization).toBeDisabled();

  await createDialog
    .getByRole("button", { name: "ปิด", exact: true })
    .last()
    .click();
});

test("mixed GROUP and OPEN QA meetings retain 25 attendance records and export PDF", async ({ page }, testInfo) => {
  await login(page);
  const cookieHeader = (await page.context().cookies())
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");
  const headers = { cookie: cookieHeader };
  const bootstrapResponse = await page.request.get("/api/bootstrap", { headers });
  expect(bootstrapResponse.ok()).toBe(true);
  const bootstrap = await bootstrapResponse.json();
  const meetings = bootstrap.meetings
    .filter((meeting: { title: string }) =>
      meeting.title.startsWith("QA Registration Modes")
    )
    .sort((left: { title: string }, right: { title: string }) =>
      left.title.localeCompare(right.title)
    );

  expect(meetings).toHaveLength(4);
  expect(
    meetings.reduce(
      (total: number, meeting: { _count: { attendances: number } }) =>
        total + meeting._count.attendances,
      0,
    ),
  ).toBe(25);
  expect(meetings.map((meeting: { channels: Array<{ mode: string }> }) =>
    meeting.channels.map((channel) => channel.mode)
  )).toEqual([
    ["GROUP", "GROUP"],
    ["GROUP", "OPEN"],
    ["GROUP", "GROUP"],
    ["GROUP", "OPEN"],
  ]);
  expect(
    meetings.every((meeting: { _count: { media: number } }) =>
      meeting._count.media >= 2
    ),
  ).toBe(true);
  expect(
    meetings.every((meeting: { organizer: { firstName: string; lastName: string } }) =>
      Boolean(`${meeting.organizer.firstName} ${meeting.organizer.lastName}`.trim())
    ),
  ).toBe(true);

  const mixedMeeting = meetings[1];
  const openChannel = mixedMeeting.channels.find(
    (channel: { mode: string }) => channel.mode === "OPEN",
  );
  expect(openChannel).toBeTruthy();
  expect(openChannel.aliasName).toBe("");

  const attendanceResponse = await page.request.get(
    `/api/meetings/${mixedMeeting.id}/attendance`,
    { headers },
  );
  expect(attendanceResponse.ok()).toBe(true);
  const attendancePayload = await attendanceResponse.json();
  const openAttendances = attendancePayload.attendances.filter(
    (attendance: { channel: { id: string } }) =>
      attendance.channel.id === openChannel.id,
  );
  expect(openAttendances).toHaveLength(3);
  expect(
    openAttendances.every(
      (attendance: { departmentSnapshot: string | null }) =>
        Boolean(attendance.departmentSnapshot?.trim()),
    ),
  ).toBe(true);

  const pdfResponse = await page.request.get(
    `/api/meetings/${mixedMeeting.id}/attendance/pdf`,
    { headers },
  );
  expect(pdfResponse.ok()).toBe(true);
  expect(pdfResponse.headers()["content-type"]).toBe("application/pdf");
  const pdfBytes = await pdfResponse.body();
  expect(pdfBytes.subarray(0, 4).toString()).toBe("%PDF");
  expect(pdfBytes.length).toBeGreaterThan(10_000);
  const pdfPath = testInfo.outputPath("qa-registration-modes-attendance.pdf");
  await writeFile(pdfPath, pdfBytes);
  await testInfo.attach("attendance-pdf", {
    path: pdfPath,
    contentType: "application/pdf",
  });
});

test("attendance order persists per QR channel and PDF keeps Channel 2 before Channel 1", async ({ page }) => {
  await login(page);
  const cookieHeader = (await page.context().cookies())
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");
  const headers = { cookie: cookieHeader };
  const bootstrapResponse = await page.request.get("/api/bootstrap", {
    headers,
  });
  expect(bootstrapResponse.ok()).toBe(true);
  const bootstrap = await bootstrapResponse.json();
  const meeting = bootstrap.meetings.find(
    (record: { title: string }) =>
      record.title === "QA Registration Modes 3 - Group and Group",
  );
  expect(meeting).toBeTruthy();

  const attendanceUrl = `/api/meetings/${meeting.id}/attendance`;
  const initialResponse = await page.request.get(attendanceUrl, { headers });
  expect(initialResponse.ok()).toBe(true);
  const initial = await initialResponse.json();
  const channelTwo = initial.meeting.channels.find(
    (channel: { channelNo: number }) => channel.channelNo === 2,
  );
  const channelOne = initial.meeting.channels.find(
    (channel: { channelNo: number }) => channel.channelNo === 1,
  );
  expect(channelTwo).toBeTruthy();
  expect(channelOne).toBeTruthy();

  const originalChannelTwoIds = initial.attendances
    .filter(
      (attendance: { channel: { id: string } }) =>
        attendance.channel.id === channelTwo.id,
    )
    .map((attendance: { id: string }) => attendance.id);
  const originalChannelOneIds = initial.attendances
    .filter(
      (attendance: { channel: { id: string } }) =>
        attendance.channel.id === channelOne.id,
    )
    .map((attendance: { id: string }) => attendance.id);
  expect(originalChannelTwoIds.length).toBeGreaterThan(1);
  expect(originalChannelOneIds.length).toBeGreaterThan(1);

  const movedChannelTwoIds = [
    originalChannelTwoIds[1],
    originalChannelTwoIds[0],
    ...originalChannelTwoIds.slice(2),
  ];
  const movedChannelOneIds = [
    originalChannelOneIds[1],
    originalChannelOneIds[0],
    ...originalChannelOneIds.slice(2),
  ];
  const channelTwoSecondName = initial.attendances.find(
    (attendance: { id: string }) =>
      attendance.id === originalChannelTwoIds[1],
  );
  const channelOneSecondName = initial.attendances.find(
    (attendance: { id: string }) =>
      attendance.id === originalChannelOneIds[1],
  );

  try {
    await page.getByRole("button", {
      name: "การประชุม Meeting workspace",
    }).click();
    await page
      .getByPlaceholder("Live Search รหัส หัวข้อ โครงการ หรือสถานที่...")
      .fill(meeting.title);
    const meetingRecord = page
      .locator("tr:visible, article:visible")
      .filter({ hasText: meeting.title });
    await expect(meetingRecord).toHaveCount(1);
    await meetingRecord
      .getByRole("button", { name: /^เปิดผู้ลงทะเบียน \d+ คน$/ })
      .click();

    const attendanceDialog = page.getByRole("dialog", {
      name: /ผู้ลงทะเบียน MTG-/,
    });
    const channelTwoSection = attendanceDialog.locator("section").filter({
      hasText: "QR Channel 2",
    });
    const channelOneSection = attendanceDialog.locator("section").filter({
      hasText: "QR Channel 1",
    });
    await expect(channelTwoSection).toHaveCount(1);
    await expect(channelOneSection).toHaveCount(1);

    await channelTwoSection
      .locator("tbody tr")
      .nth(1)
      .getByRole("button", { name: /ขึ้น$/ })
      .click();
    await expect(channelTwoSection.locator("tbody tr").first()).toContainText(
      `${channelTwoSecondName.firstNameSnapshot} ${channelTwoSecondName.lastNameSnapshot}`,
    );

    await channelOneSection
      .locator("tbody tr")
      .nth(1)
      .getByRole("button", { name: /ขึ้น$/ })
      .click();
    await expect(channelOneSection.locator("tbody tr").first()).toContainText(
      `${channelOneSecondName.firstNameSnapshot} ${channelOneSecondName.lastNameSnapshot}`,
    );

    const reorderedResponse = await page.request.get(attendanceUrl, {
      headers,
    });
    expect(reorderedResponse.ok()).toBe(true);
    const reordered = await reorderedResponse.json();

    const reorderedChannelTwoIds = reordered.attendances
      .filter(
        (attendance: { channel: { id: string } }) =>
          attendance.channel.id === channelTwo.id,
      )
      .map((attendance: { id: string }) => attendance.id);
    const reorderedChannelOneIds = reordered.attendances
      .filter(
        (attendance: { channel: { id: string } }) =>
          attendance.channel.id === channelOne.id,
      )
      .map((attendance: { id: string }) => attendance.id);
    expect(reorderedChannelTwoIds).toEqual(movedChannelTwoIds);
    expect(reorderedChannelOneIds).toEqual(movedChannelOneIds);
    expect(
      reordered.attendances.map(
        (attendance: { channel: { channelNo: number } }) =>
          attendance.channel.channelNo,
      ),
    ).toEqual([
      ...Array(movedChannelTwoIds.length).fill(2),
      ...Array(originalChannelOneIds.length).fill(1),
    ]);

    const pdfResponse = await page.request.get(
      `/api/meetings/${meeting.id}/attendance/pdf`,
      { headers },
    );
    expect(pdfResponse.ok()).toBe(true);
    expect(pdfResponse.headers()["content-type"]).toBe("application/pdf");
    expect((await pdfResponse.body()).subarray(0, 4).toString()).toBe(
      "%PDF",
    );
  } finally {
    for (const [channelId, orderedAttendanceIds] of [
      [channelTwo.id, originalChannelTwoIds],
      [channelOne.id, originalChannelOneIds],
    ]) {
      const restoreResponse = await page.request.patch(attendanceUrl, {
        headers,
        data: { channelId, orderedAttendanceIds },
      });
      expect(restoreResponse.ok()).toBe(true);
    }
  }
});

test("QR gallery shows both channel images, aligned QR codes and copy action", async ({ page }, testInfo) => {
  await login(page);
  await page.getByRole("button", { name: "การประชุม Meeting workspace" }).click();
  await page
    .getByPlaceholder("Live Search รหัส หัวข้อ โครงการ หรือสถานที่...")
    .fill("QA Registration Modes 4 - Group and Open");
  const meetingRecord = page
    .locator("tr:visible, article:visible")
    .filter({ hasText: "QA Registration Modes 4 - Group and Open" });
  await expect(meetingRecord).toHaveCount(1);
  await meetingRecord
    .getByRole("button", { name: /^MTG-/ })
    .click();

  await expect(page.getByRole("heading", { name: "QR Code สำหรับลงทะเบียน" })).toBeVisible();
  const channelImages = page.getByRole("img", { name: /รูปประกอบ/ });
  await expect(channelImages).toHaveCount(2);
  for (let index = 0; index < await channelImages.count(); index += 1) {
    const image = channelImages.nth(index);
    const imageBox = await image.boundingBox();
    const frameBox = await image.locator("..").boundingBox();
    expect(imageBox).toBeTruthy();
    expect(frameBox).toBeTruthy();
    expect(imageBox!.width).toBeLessThanOrEqual(frameBox!.width);
    expect(imageBox!.height).toBeLessThanOrEqual(frameBox!.height);
    await expect(image).toHaveCSS("object-fit", "contain");
    await expect(image).toHaveCSS("max-height", "80px");
  }
  const qrImages = page.getByRole("img", { name: /^QR Code/ });
  await expect(qrImages).toHaveCount(2);
  if ((page.viewportSize()?.width || 0) >= 640) {
    const firstBox = await qrImages.nth(0).boundingBox();
    const secondBox = await qrImages.nth(1).boundingBox();
    expect(firstBox).toBeTruthy();
    expect(secondBox).toBeTruthy();
    expect(Math.abs(firstBox!.y - secondBox!.y)).toBeLessThanOrEqual(2);
  }

  const copyButton = page.getByRole("button", { name: "Copy QR Code ทั้งหมด" });
  await expect(copyButton).toBeVisible();
  await copyButton.click();
  await expect(
    page.getByText(
      /คัดลอกรูป QR Code พร้อมรายละเอียดแล้ว|Browser ไม่รองรับการคัดลอกรูป จึงดาวน์โหลด PNG แทน/,
    ),
  ).toBeVisible();

  const screenshotPath = testInfo.outputPath("qr-gallery-with-images.png");
  await page.screenshot({ path: screenshotPath, fullPage: true });
  await testInfo.attach("qr-gallery-with-images", {
    path: screenshotPath,
    contentType: "image/png",
  });
});
