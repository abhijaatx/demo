import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readWebFile = (path) => readFile(new URL(`../apps/web/${path}`, import.meta.url), "utf8");

test("auth screen covers sign-up, verification, sign-in, sign-out, recovery, reset, and refresh flows", async () => {
  const [screen, client, page] = await Promise.all([
    readWebFile("components/auth-screen.tsx"),
    readWebFile("src/lib/auth-client.ts"),
    readWebFile("app/auth/page.tsx")
  ]);

  for (const label of [
    "Create account",
    "Verify email",
    "Sign in",
    "Sign out",
    "Forgot password?",
    "Send reset email",
    "Update password",
    "Refresh session"
  ]) {
    assert.match(screen, new RegExp(label.replace(/[?]/gu, "\\$&"), "u"));
  }
  for (const operation of [
    "sign-up",
    "verify-email",
    "sign-in",
    "sign-out",
    "forgot-password",
    "reset-password",
    "refresh-session"
  ]) {
    assert.match(client, new RegExp(operation, "u"));
  }
  assert.match(screen, /current-password/u);
  assert.match(screen, /new-password/u);
  assert.match(screen, /autoComplete="one-time-code"/u);
  assert.match(client, /credentials: "include"/u);
  assert.match(client, /cache: "no-store"/u);
  assert.match(client, /response\.text\(\)/u);
  assert.match(client, /publicAuthErrorMessage/u);
  assert.match(screen, /verificationRequired === false/u);
  assert.match(screen, /router\.replace\("\/home"\)/u);
  assert.match(screen, /If an account matches, we’ll send a reset email\./u);
  assert.match(page, /robots: \{ index: false, follow: false \}/u);
  assert.doesNotMatch(`${screen}\n${client}`, /console\.(log|error)|password.*log|log.*password/iu);
  assert.doesNotMatch(`${screen}\n${client}`, /dangerouslySetInnerHTML|innerHTML|eval\(/u);
});

test("auth client surfaces bounded API errors instead of hiding origin and validation failures", async () => {
  const client = await readWebFile("src/lib/auth-client.ts");
  assert.match(client, /length <= 240/u);
  assert.match(client, /origin_not_allowed|Authentication could not be completed/u);
  assert.match(client, /Unable to reach the authentication service/u);
  assert.match(client, /catch \{/u);
  assert.doesNotMatch(client, /response\.json\(\)/u);
});

test("auth forms expose labels, native submit behavior, and error/status semantics", async () => {
  const [screen, css] = await Promise.all([
    readWebFile("components/auth-screen.tsx"),
    readFile(new URL("../apps/web/app/globals.css", import.meta.url), "utf8")
  ]);

  assert.match(screen, /<form className="auth-form" onSubmit=/u);
  assert.match(screen, /label=\{emailLabel\}/u);
  assert.match(screen, /<InlineAlert title="Could not continue">/u);
  assert.match(screen, /role="status"/u);
  assert.match(css, /\.auth-page \{[^}]*min-height: 100vh/iu);
  assert.match(css, /\.auth-form \{[^}]*display: grid/iu);
});

test("auth form validates bounded credentials before advancing or calling the API", async () => {
  const screen = await readWebFile("components/auth-screen.tsx");
  assert.match(screen, /Enter your email address\./u);
  assert.match(screen, /Enter a valid email address\./u);
  assert.match(screen, /Your password must be 8–128 characters long\./u);
  assert.match(screen, /Enter the verification code from your email\./u);
  assert.match(screen, /The passwords must match\./u);
  assert.match(screen, /validateAuthForm\(/u);
  assert.match(screen, /I have a reset code/u);
});

test("dedicated signup route starts in the signup flow and keeps login navigation explicit", async () => {
  const [page, screen] = await Promise.all([
    readWebFile("app/signup/page.tsx"),
    readWebFile("components/auth-screen.tsx")
  ]);
  assert.match(page, /initialView="sign-up"/u);
  assert.match(page, /signupSurface/u);
  assert.match(page, /robots: \{ index: false, follow: false \}/u);
  assert.match(screen, /href="\/auth"/u);
  assert.match(screen, /auth-provider-grid/u);
  assert.match(screen, /signupStep/u);
  assert.doesNotMatch(`${page}\n${screen}`, /dangerouslySetInnerHTML|innerHTML|eval\(/u);
});

test("signup surface includes the reference proof panel without user-controlled media", async () => {
  const [screen, css] = await Promise.all([
    readWebFile("components/auth-screen.tsx"),
    readFile(new URL("../apps/web/app/globals.css", import.meta.url), "utf8")
  ]);
  assert.match(screen, /auth-proof/u);
  assert.match(screen, /g2-badges\.svg/u);
  assert.match(screen, /proofCards/u);
  assert.match(screen, /referrerPolicy="no-referrer"/u);
  assert.match(
    css,
    /\.auth-page-signup \{[^}]*grid-template-columns: minmax\(0, 1fr\) minmax\(0, 1fr\)/su
  );
  assert.match(css, /\.auth-proof-cards \{[^}]*transform: translateX/su);
  assert.match(
    css,
    /@media \(max-width: 800px\)[\s\S]*\.auth-page-signup \.auth-proof \{\s*display: none/su
  );
  assert.doesNotMatch(`${screen}\n${css}`, /dangerouslySetInnerHTML|innerHTML|eval\(/u);
});

test("public login alias uses the shared sign-in flow", async () => {
  const page = await readWebFile("app/login/page.tsx");
  assert.match(page, /AuthScreen initialView="sign-in"/u);
  assert.match(page, /title: "Sign in \| Supademo"/u);
  assert.match(page, /robots: \{ index: false, follow: false \}/u);
  assert.doesNotMatch(page, /dangerouslySetInnerHTML|innerHTML|eval\(/u);
});
