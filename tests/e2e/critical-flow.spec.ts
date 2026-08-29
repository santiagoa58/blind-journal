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
  const databaseUrl = process.env["DATABASE_TEST_URL"];
  if (!databaseUrl) {
    throw new Error("DATABASE_TEST_URL is required to clean up the browser test account.");
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

test("persists created and updated content across reload and fresh sign-in", async ({
  browserName,
  page,
}) => {
  test.skip(
    browserName === "webkit",
    "Authenticated WebKit coverage requires an HTTPS test server for the production session cookie.",
  );
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

test("renders localized not-found pages", async ({ page }) => {
  await page.goto("/es/esta-pagina-no-existe");

  await expect(page.locator("html")).toHaveAttribute("lang", "es");
  await expect(page.getByRole("heading", { level: 1, name: "Página no encontrada" })).toBeVisible();
  await expect(page.getByText("La página que buscas no existe.", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Volver al inicio" })).toHaveAttribute("href", "/es");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex");
});

test("applies production security headers to documents and API responses", async ({ request }) => {
  const documentResponse = await request.get("/en");
  const documentHeaders = documentResponse.headers();
  const contentSecurityPolicy = documentHeaders["content-security-policy"];

  expect(documentResponse.ok()).toBe(true);
  expect(contentSecurityPolicy).toContain("default-src 'self'");
  expect(contentSecurityPolicy).toMatch(/script-src 'self' 'nonce-[^']+' 'strict-dynamic'/);
  expect(contentSecurityPolicy).toContain("object-src 'none'");
  expect(contentSecurityPolicy).toContain("frame-ancestors 'none'");
  expect(contentSecurityPolicy).not.toContain("upgrade-insecure-requests");
  expect(contentSecurityPolicy).not.toContain("'unsafe-eval'");
  expect(documentHeaders["x-request-id"]).toMatch(
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
  );

  const apiResponse = await request.get("/api/v1/entries");
  expect(apiResponse.status()).toBe(401);
  expect(apiResponse.headers()["content-security-policy"]).toBeUndefined();
  expect(apiResponse.headers()["x-request-id"]).toMatch(
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
  );
});

test("uses the compact journal actions on a mobile viewport", async ({ browserName, page }) => {
  test.skip(
    browserName === "webkit",
    "Authenticated WebKit coverage requires an HTTPS test server for the production session cookie.",
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await createAccount(page, mobileUsername);

  const entrySelect = page.getByRole("combobox", { name: "Journal entries" });
  await expect(entrySelect).toBeDisabled();
  await expect(page.getByRole("button", { name: "New entry" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Account menu" })).toBeVisible();
  await expect(page.getByRole("complementary", { name: "Journal navigation" })).toBeHidden();

  await page.getByRole("button", { name: "New entry" }).click();
  await page.getByRole("textbox", { name: "Entry title" }).fill("First mobile entry");
  await page.getByRole("textbox", { name: "Journal entry" }).fill("Created on a mobile viewport");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(
    page.getByRole("article", { name: "First mobile entry" }).getByRole("status"),
  ).toHaveText("Saved and encrypted");

  await expect(entrySelect).toBeEnabled();
  await page.getByRole("button", { name: "New entry" }).click();
  await page.getByRole("textbox", { name: "Entry title" }).fill("Second mobile entry");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(
    page.getByRole("article", { name: "Second mobile entry" }).getByRole("status"),
  ).toHaveText("Saved and encrypted");

  await entrySelect.click();
  await page.getByRole("option", { name: "First mobile entry" }).click();
  await expect(page.getByRole("textbox", { name: "Entry title" })).toHaveValue(
    "First mobile entry",
  );
  await expect(page.getByRole("textbox", { name: "Journal entry" })).toContainText(
    "Created on a mobile viewport",
  );

  await page.getByRole("button", { name: "Account menu" }).click();
  await page.getByRole("menuitem", { name: "Language: English" }).hover();
  await page.getByRole("menuitemradio", { name: "Español" }).click();

  await expect(page).toHaveURL(/\/es\/journal$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "es");
  await expect(page.getByRole("button", { name: "Menú de la cuenta" })).toBeVisible();
});
