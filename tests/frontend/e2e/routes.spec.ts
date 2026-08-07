import { expect, test } from "@playwright/test";

async function signInDemo(page: import("@playwright/test").Page) {
  await page.goto("/auth");
  await page.getByRole("button", { name: "Open the local member demo" }).click();
  await expect(page.getByRole("heading", { name: /Good to see you/ })).toBeVisible();
}

test("public projects and three themes remain usable", async ({ page }) => {
  await page.goto("/projects");
  await expect(page.getByRole("heading", { name: "Build what the lab needs next." })).toBeVisible();
  await expect(page.getByText("LeRobot + SO-ARM101").first()).toBeVisible();
  await page.getByRole("button", { name: "dark theme" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("button", { name: "sepia theme" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "sepia");
  await page.getByRole("button", { name: "light theme" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});

test("demo member can open booking workspace", async ({ page }) => {
  await signInDemo(page);
  await page.getByRole("link", { name: "Book a resource" }).click();
  await expect(page.getByRole("heading", { name: "Reserve a working block." })).toBeVisible();
  await expect(page.getByText("GPU compute node")).toBeVisible();
});

test("member books and cancels a resource", async ({ page }) => {
  await signInDemo(page);
  await page.goto("/book/gpu-compute");
  await page.getByLabel("Purpose of session").fill("Validate a local perception model.");
  await page.getByRole("button", { name: "Confirm booking" }).click();
  await expect(page.getByRole("heading", { name: "GPU compute node" })).toBeVisible();
  const newStart = new Date(Date.now() + 48 * 60 * 60 * 1000);
  newStart.setMinutes(0, 0, 0);
  const localStart = new Date(
    newStart.getTime() - newStart.getTimezoneOffset() * 60000
  ).toISOString().slice(0, 16);
  await page.getByLabel("New start").fill(localStart);
  await page.getByRole("button", { name: "Reschedule" }).click();
  await expect(page.getByText("Booking rescheduled.")).toBeVisible();
  await page.getByRole("button", { name: "Cancel booking" }).click();
  await expect(page.getByText("cancelled", { exact: true })).toBeVisible();
});

test("one-use code checks a member in and out through kiosk", async ({ page }) => {
  await signInDemo(page);
  await page.goto("/book/gpu-compute");
  await page.getByLabel("Purpose of session").fill("Kiosk attendance validation.");
  await page.getByRole("button", { name: "Confirm booking" }).click();

  await page.goto("/check-in");
  await page.getByRole("button", { name: "Generate check-in code" }).click();
  const checkinToken = await page.locator(".demo-token").textContent();
  expect(checkinToken).toBeTruthy();

  await page.goto("/kiosk");
  await page.getByLabel("Manual token fallback").fill(checkinToken!);
  await page.getByRole("button", { name: "Validate code" }).click();
  await expect(page.getByText(/Check-in accepted/)).toBeVisible();

  await page.goto("/check-in");
  await expect(page.getByRole("heading", { name: "You are checked in." })).toBeVisible();
  await page.getByRole("button", { name: "Generate check-out code" }).click();
  const checkoutToken = await page.locator(".demo-token").textContent();

  await page.goto("/kiosk");
  await page.getByLabel("Manual token fallback").fill(checkoutToken!);
  await page.getByRole("button", { name: "Validate code" }).click();
  await expect(page.getByText(/Check-out recorded/)).toBeVisible();
});

test("staff approves a pending membership application", async ({ page }) => {
  await signInDemo(page);
  await page.goto("/admin/members");
  await expect(page.getByRole("heading", { name: "Member approvals" })).toBeVisible();
  await page.getByRole("button", { name: "Approve" }).click();
  await expect(page.getByText("approved", { exact: true })).toBeVisible();
});

test("staff manages certifications, hours, and booking state", async ({ page }) => {
  await signInDemo(page);
  await page.goto("/admin/members");
  await page.getByLabel("Approved member").selectOption({ label: "Meera Iyer" });
  await page.getByLabel("Certification").selectOption({ label: "Arm cell induction" });
  await page.getByRole("button", { name: "Issue certification" }).click();
  await expect(page.getByText("Certification issued and audited.")).toBeVisible();

  await page.goto("/admin/resources");
  const hoursForm = page.locator("form").filter({ hasText: "Save weekday hours" });
  await hoursForm.locator('select[name="resourceId"]').selectOption({ label: "GPU compute node" });
  await hoursForm.getByRole("button", { name: "Save weekday hours" }).click();
  await expect(page.getByText("Base operating hours updated.")).toBeVisible();

  await page.goto("/admin/bookings");
  await page.getByLabel("Confirmed booking").selectOption({ index: 1 });
  await page.getByLabel("Required reason").fill("Cancelled for supervised maintenance.");
  await page.getByRole("button", { name: "Apply booking action" }).click();
  await expect(page.getByText("Booking state updated and audited.")).toBeVisible();
});

test("approved public profile excludes private contact data", async ({ page }) => {
  await page.goto("/members/anika-builds");
  await expect(page.getByRole("heading", { name: "Anika Rao" })).toBeVisible();
  await expect(page.getByText("anika@example.com")).toHaveCount(0);
  await expect(page.getByText("+91 90000 00000")).toHaveCount(0);
});

test("PWA keeps transactional traffic out of Cache Storage", async ({ page, context }) => {
  await signInDemo(page);
  await page.goto("/book/gpu-compute");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();

  const cachedUrls = await page.evaluate(async () => {
    const keys = await caches.keys();
    const requests = await Promise.all(
      keys.map(async (key) => (await caches.open(key)).keys())
    );
    return requests.flat().map((request) => request.url);
  });
  expect(cachedUrls.some((url) => {
    const parsed = new URL(url);
    return (
      parsed.hostname.includes("supabase") ||
      /^\/(?:auth|rest|functions|booking|bookings|check-in|calendar)(?:\/|$)/.test(parsed.pathname)
    );
  })).toBe(false);
  expect(cachedUrls.some((url) => /\/assets\/index-[^/]+\.js$/.test(url))).toBe(true);

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "armature", exact: true })).toBeVisible();
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole("heading", { name: "armature", exact: true })).toBeVisible();
});

test("mobile home has no horizontal overflow", async ({ page }) => {
  await page.goto("/");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow).toBe(false);
  await expect(page.getByRole("heading", { name: "armature" })).toBeVisible();
});
