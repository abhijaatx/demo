"use client";

import { Button, Card, InlineAlert, Input, Stack } from "@supademo/ui";
import { useRef, useState, type FormEvent } from "react";
import { createAuthClient, type AuthClient } from "../src/lib/auth-client";

type AuthView = "sign-in" | "sign-up" | "verify" | "forgot" | "reset" | "signed-in";

export interface AuthScreenProps {
  readonly client?: AuthClient;
}

export function AuthScreen({ client }: AuthScreenProps) {
  const clientRef = useRef<AuthClient>(client ?? createAuthClient());
  const [view, setView] = useState<AuthView>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setError(undefined);
    setMessage(undefined);
    setLoading(true);
    try {
      const result =
        view === "sign-in"
          ? await clientRef.current.signIn(email, password)
          : view === "sign-up"
            ? await clientRef.current.signUp(email, password)
            : view === "verify"
              ? await clientRef.current.confirmEmail(email, code)
              : view === "forgot"
                ? await clientRef.current.requestPasswordReset(email)
                : view === "reset"
                  ? await resetPassword()
                  : await clientRef.current.refreshSession();
      setMessage(result.message);
      if (view === "sign-up") setView("verify");
      if (view === "verify" || view === "reset") setView("sign-in");
      if (view === "sign-in") setView("signed-in");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Authentication could not be completed. Try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    if (password !== confirmPassword) {
      throw new Error("The passwords must match.");
    }
    return clientRef.current.resetPassword(email, code, password);
  };

  const refreshSession = async (): Promise<void> => {
    setError(undefined);
    setLoading(true);
    try {
      const result = await clientRef.current.refreshSession();
      setMessage(result.message);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Authentication could not be completed. Try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    setError(undefined);
    setLoading(true);
    try {
      const result = await clientRef.current.signOut();
      setMessage(result.message);
      setView("sign-in");
      setPassword("");
      setCode("");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Authentication could not be completed. Try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (view === "signed-in") {
    return (
      <main className="auth-page">
        <Card
          title="You’re signed in"
          description="Your session is active. Continue to your workspace or refresh it if needed."
        >
          <Stack gap="3">
            {message ? (
              <div className="auth-success" role="status">
                {message}
              </div>
            ) : null}
            <Button
              loading={loading}
              loadingLabel="Refreshing session"
              onClick={() => void refreshSession()}
            >
              Refresh session
            </Button>
            <Button variant="secondary" loading={loading} onClick={() => void signOut()}>
              Sign out
            </Button>
          </Stack>
        </Card>
      </main>
    );
  }

  const heading =
    view === "sign-in"
      ? "Welcome back"
      : view === "sign-up"
        ? "Create your account"
        : view === "verify"
          ? "Verify your email"
          : view === "forgot"
            ? "Reset your password"
            : "Choose a new password";
  const actionLabel =
    view === "sign-in"
      ? "Sign in"
      : view === "sign-up"
        ? "Create account"
        : view === "verify"
          ? "Verify email"
          : view === "forgot"
            ? "Send reset email"
            : "Update password";

  return (
    <main className="auth-page">
      <div className="auth-card-wrap">
        <div className="auth-brand" aria-label="Supademo">
          supademo
        </div>
        <Card
          title={heading}
          description={
            view === "forgot"
              ? "If an account matches, we’ll send a reset email."
              : "Use your account credentials to continue."
          }
        >
          {error ? <InlineAlert title="Could not continue">{error}</InlineAlert> : null}
          {message ? (
            <div className="auth-success" role="status">
              {message}
            </div>
          ) : null}
          <form className="auth-form" onSubmit={(event) => void submit(event)} noValidate>
            <Input
              label="Email address"
              type="email"
              autoComplete={view === "sign-up" ? "email" : "username"}
              value={email}
              onChange={(event) => setEmail(event.currentTarget.value)}
              required
            />
            {view === "verify" || view === "reset" ? (
              <Input
                label="Verification code"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={(event) => setCode(event.currentTarget.value)}
                required
              />
            ) : null}
            {view !== "forgot" && view !== "verify" ? (
              <Input
                label="Password"
                type="password"
                autoComplete={
                  view === "sign-up" || view === "reset" ? "new-password" : "current-password"
                }
                value={password}
                onChange={(event) => setPassword(event.currentTarget.value)}
                required
              />
            ) : null}
            {view === "reset" ? (
              <Input
                label="Confirm new password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.currentTarget.value)}
                required
              />
            ) : null}
            <Button type="submit" loading={loading} loadingLabel="Working…">
              {actionLabel}
            </Button>
          </form>
          <div className="auth-links" aria-label="Account options">
            {view === "sign-in" ? (
              <Button variant="ghost" size="sm" onClick={() => setView("forgot")}>
                Forgot password?
              </Button>
            ) : null}
            {view === "sign-in" ? (
              <Button variant="ghost" size="sm" onClick={() => setView("sign-up")}>
                Create an account
              </Button>
            ) : null}
            {view === "sign-up" || view === "forgot" ? (
              <Button variant="ghost" size="sm" onClick={() => setView("sign-in")}>
                Back to sign in
              </Button>
            ) : null}
            {view === "verify" ? (
              <Button variant="ghost" size="sm" onClick={() => setView("sign-in")}>
                Back to sign in
              </Button>
            ) : null}
            {view === "reset" ? (
              <Button variant="ghost" size="sm" onClick={() => setView("forgot")}>
                Request a new code
              </Button>
            ) : null}
          </div>
        </Card>
      </div>
    </main>
  );
}
