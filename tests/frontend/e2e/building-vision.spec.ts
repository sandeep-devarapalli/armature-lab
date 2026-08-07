import { expect, test } from "@playwright/test";

test("building vision presents all views and filters without overflow", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"], {
    origin: "http://127.0.0.1:4173"
  });
  await page.goto("/building-vision");

  await expect(page.getByRole("heading", { name: "The building, without rebuilding it." })).toBeVisible();
  await expect(page.getByText("Showing 16 of 16 views")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Building frontage" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Main café hall" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Café flex room" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Lower stair landing" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Main entrance reception" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Quiet meeting room" })).toHaveCount(0);

  await page.getByRole("button", { name: "Frontage", exact: true }).click();
  await expect(page.getByText("Showing 3 of 16 views")).toBeVisible();
  await expect(page.getByText("Shaded outdoor café seating, main-entrance arrival and Armature identity")).toBeVisible();
  await expect(page.getByText("Movable café tables, weighted market umbrellas, planters and cycle parking within the existing setback.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Street approach identity" })).toBeVisible();
  await expect(page.getByText("Street-readable HSR Founders Club identity and a programmable events display")).toBeVisible();
  await expect(page.getByText("Earlier street-view concept")).toBeVisible();
  await expect(page.getByText("Revised signage concept")).toBeVisible();
  await expect(page.getByText("Warm opal HSR Founders Club lightbox plus a dimmable, programmable LED information strip.")).toBeVisible();

  await page.getByRole("button", { name: "Ground floor", exact: true }).click();
  await expect(page.getByText("Showing 3 of 16 views")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Main entrance reception" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Window café lounge" })).toBeVisible();
  await expect(page.getByText("Retain the existing white-grey marble and dark border; repair, clean and machine-polish only.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Existing kitchen" })).toBeVisible();
  await expect(page.getByText("Retain the kitchen's existing veined marble and double dark border; repair, deep-clean and machine-polish only.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Large team studio" })).toHaveCount(0);

  await page.getByRole("button", { name: "First floor", exact: true }).click();
  await expect(page.getByText("Showing 5 of 16 views")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Main lab commons" })).toBeVisible();
  await expect(page.getByText("Warm off-white with restrained ink-grey work-zone accents; keep the entire staircase white.")).toBeVisible();
  await expect(page.getByText("White staircase finish and railings, windows, doors, beams, columns, floor levels and wall lines.")).toBeVisible();

  await page.getByRole("button", { name: "Second floor", exact: true }).click();
  await expect(page.getByText("Showing 3 of 16 views")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Large team studio" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Main entrance reception" })).toHaveCount(0);

  await expect(page.getByRole("heading", { name: "Use Codex or Claude to propose a revision." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Repository and working references." })).toBeVisible();
  await expect(page.getByRole("link", { name: /GitHub repository/ })).toHaveAttribute(
    "href",
    "https://github.com/sandeep-devarapalli/armature-lab"
  );
  await expect(page.getByRole("link", { name: /Agent instructions/ })).toHaveAttribute(
    "href",
    "https://github.com/sandeep-devarapalli/armature-lab/blob/main/AGENTS.md"
  );
  await expect(page.getByRole("link", { name: /Design system/ })).toHaveAttribute(
    "href",
    "https://github.com/sandeep-devarapalli/armature-lab/blob/main/DESIGN.md"
  );
  await expect(page.getByText("src/pages/BuildingVisionPage.tsx", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Start the agent in this project." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Keep every proposal reversible." })).toBeVisible();
  await expect(page.getByText("Ready-to-paste prompt")).toBeVisible();
  await expect(page.getByText("First describe the proposed change in words. Do not edit files until I approve.", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Copy prompt" }).click();
  await expect(page.getByRole("button", { name: "Copied" })).toBeVisible();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain(
    "Please propose a revision to the Building Vision page."
  );

  expect(await page.evaluate(() =>
    document.documentElement.scrollWidth > document.documentElement.clientWidth
  )).toBe(false);
});
