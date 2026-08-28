import { neon } from "@neondatabase/serverless";
import { expect, type Page, test } from "@playwright/test";

const passphrase = "correct horse battery staple";
const lifecycleUsername = `e2e-life-${crypto.randomUUID().slice(0, 8)}`;
const mobileUsername = `e2e-mobile-${crypto.randomUUID().slice(0, 8)}`;
const testUsernames = [lifecycleUsername, mobileUsername];

async function createAccount(page: Page, username: string) {
  await page.goto("/en/sign-up");
  await page.getByRole("textbox", { name: "Username" }).fill(username);
  await page.getByLabel("Passphrase", { exact: true }).fill(passphrase);
  await page.getByLabel("Confirm passphrase").fill(passphrase);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/en\/journal$/);
}

test.afterAll(async () => {
  const databaseUrl = process.env["DATABASE_URL"];
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to clean up the browser test account.");
  }

  const sql = neon(databaseUrl);
  for (const username of testUsernames) {
    const users = await sql`SELECT id FROM users WHERE username = ${username} LIMIT 1`;
    const userId = users[0]?.["id"];
    if (typeof userId === "string") {
      await sql.transaction([
        sql`DELETE FROM journal_entries WHERE user_id = ${userId}::uuid`,
        sql`DELETE FROM sessions WHERE user_id = ${userId}::uuid`,
        sql`DELETE FROM users WHERE id = ${userId}::uuid`,
      ]);
    }
  }
});

test("persists created and updated content across reload and fresh sign-in", async ({ page }) => {
  await createAccount(page, lifecycleUsername);
  await expect(page.getByRole("heading", { level: 1, name: "Your entries" })).toBeVisible();
  await page.getByRole("button", { name: "Create your first entry" }).click();

  await page.getByRole("textbox", { name: "Entry title" }).fill("Browser test entry");
  await page.getByRole("textbox", { name: "Journal entry" }).fill("Encrypted browser content");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(
    page.getByRole("article", { name: "Browser test entry" }).getByRole("status"),
  ).toHaveText("Saved and encrypted");

  await page.reload();
  await expect(page.getByRole("heading", { level: 1, name: "Unlock Blind Journal" })).toBeVisible();
  await page.getByLabel("Passphrase", { exact: true }).fill(passphrase);
  await page.getByRole("button", { name: "Unlock journal" }).click();

  await expect(page.getByRole("textbox", { name: "Entry title" })).toHaveValue(
    "Browser test entry",
  );
  await expect(page.getByRole("textbox", { name: "Journal entry" })).toContainText(
    "Encrypted browser content",
  );

  await page.getByRole("textbox", { name: "Entry title" }).fill("Updated browser entry");
  await page.getByRole("textbox", { name: "Journal entry" }).fill("Updated encrypted content");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(
    page.getByRole("article", { name: "Updated browser entry" }).getByRole("status"),
  ).toHaveText("Saved and encrypted");

  await page.getByRole("button", { name: lifecycleUsername }).click();
  const logoutResponse = page.waitForResponse(
    (response) => response.url().endsWith("/api/v1/auth/logout") && response.ok(),
  );
  await page.getByRole("menuitem", { name: "Sign out" }).click();
  await logoutResponse;
  await expect(
    page.getByRole("heading", { level: 1, name: "Sign in to your journal" }),
  ).toBeVisible();

  await page.getByRole("textbox", { name: "Username" }).fill(lifecycleUsername);
  await page.getByLabel("Passphrase", { exact: true }).fill(passphrase);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/en\/journal$/);
  await expect(page.getByRole("textbox", { name: "Entry title" })).toHaveValue(
    "Updated browser entry",
  );
  await expect(page.getByRole("textbox", { name: "Journal entry" })).toContainText(
    "Updated encrypted content",
  );

  await page.getByRole("button", { name: "Delete entry" }).click();
  const deleteDialog = page.getByRole("alertdialog", { name: "Delete this entry?" });
  await expect(deleteDialog).toBeVisible();
  await deleteDialog.getByRole("button", { name: "Delete" }).click();
  await expect(
    page.getByRole("heading", { level: 2, name: "Your journal is ready" }),
  ).toBeVisible();
});

test("keeps unauthorized and failed authentication flows in Spanish", async ({ page }) => {
  await page.goto("/es/journal");

  await expect(page).toHaveURL(/\/es\/?$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "es");
  await expect(
    page.getByRole("heading", { level: 1, name: "Inicia sesión en tu diario" }),
  ).toBeVisible();

  await page
    .getByRole("textbox", { name: "Nombre de usuario" })
    .fill(`missing-${crypto.randomUUID().slice(0, 8)}`);
  await page.getByLabel("Frase de contraseña", { exact: true }).fill(passphrase);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();

  await expect(page).toHaveURL(/\/es\/?$/);
  await expect(
    page.getByText("El nombre de usuario o la frase de contraseña son incorrectos.", {
      exact: true,
    }),
  ).toBeVisible();
});

test("uses the compact journal navigation on a mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await createAccount(page, mobileUsername);

  const mobileHeader = page.locator("header");
  await expect(mobileHeader.getByRole("combobox", { name: "Journal entries" })).toBeVisible();
  await expect(mobileHeader.getByRole("button", { name: "New entry" })).toBeVisible();
  await expect(mobileHeader.getByRole("button", { name: "Account menu" })).toBeVisible();
  await expect(page.getByRole("complementary", { name: "Journal navigation" })).toBeHidden();
});
