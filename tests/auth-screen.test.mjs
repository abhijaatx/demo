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
  assert.match(screen, /If an account matches, we’ll send a reset email\./u);
  assert.match(page, /robots: \{ index: false, follow: false \}/u);
  assert.doesNotMatch(`${screen}\n${client}`, /console\.(log|error)|password.*log|log.*password/iu);
  assert.doesNotMatch(`${screen}\n${client}`, /dangerouslySetInnerHTML|innerHTML|eval\(/u);
});

test("auth forms expose labels, native submit behavior, and error/status semantics", async () => {
  const [screen, css] = await Promise.all([
    readWebFile("components/auth-screen.tsx"),
    readFile(new URL("../apps/web/app/globals.css", import.meta.url), "utf8")
  ]);

  assert.match(screen, /<form className="auth-form" onSubmit=/u);
  assert.match(screen, /<Input[\s\S]*label="Email address"/u);
  assert.match(screen, /<InlineAlert title="Could not continue">/u);
  assert.match(screen, /role="status"/u);
  assert.match(css, /\.auth-page \{[^}]*min-height: 100vh/iu);
  assert.match(css, /\.auth-form \{[^}]*display: grid/iu);
});
