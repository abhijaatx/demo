"use client";

import { Button, Card, InlineAlert, Input, Stack } from "@supademo/ui";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { createAuthClient, type AuthClient } from "../src/lib/auth-client";

type AuthView = "sign-in" | "sign-up" | "verify" | "forgot" | "reset" | "signed-in";

const proofCards = [
  {
    company: "VRIFY",
    logo: "https://cdn.supademo.com/logos/vrify.svg",
    quote:
      "Supademo has allowed us to rapidly increase our onboarding and knowledge creation at VRIFY.",
    name: "Nova Siegmann",
    role: "Sr. Manager, Product Enablement",
    metric: "75%",
    metricLabel: "Faster content production"
  },
  {
    company: "beehiiv",
    logo: "https://cdn.supademo.com/logos/beehiiv.avif",
    quote:
      "We've driven several thousand signups through our demo experience so far. Supademo is a key part of our lead generation strategy.",
    name: "EJ White",
    role: "Head of Growth",
    metric: "50%",
    metricLabel: "Better conversion rates"
  },
  {
    company: "Easy",
    logo: "https://cdn.supademo.com/logos/easy.svg",
    quote:
      "Supademo has been a huge asset across multiple departments and workflows across Easy Software.",
    name: "Felix True",
    role: "Head of Presales",
    metric: "$100k+",
    metricLabel: "Contracts closed"
  },
  {
    company: "Bullhorn",
    logo: "https://cdn.supademo.com/logos/bullhorn.svg",
    quote:
      "Supademo helps us meet customers where they are — delivering quick, clear, and interactive training that saves us hours.",
    name: "Robert Hoffmann",
    role: "Instructional Designer",
    metric: "50%",
    metricLabel: "Faster content creation"
  },
  {
    company: "Spare",
    logo: "https://cdn.supademo.com/logos/spare.svg",
    quote:
      "Supademo has become an invaluable part of various workflows at Spare. Supademo has made a massive impact for us.",
    name: "Kristoffer Vik Hansen",
    role: "Co-founder & CEO",
    metric: "10x",
    metricLabel: "Workflow efficiency"
  },
  {
    company: "RB2B",
    logo: "https://cdn.supademo.com/logos/rb2b.svg",
    quote:
      "Supademo has allowed us to deliver the same high quality demos as we would in person, while letting users explore at their own pace.",
    name: "Robb Clarke",
    role: "Head of AI",
    metric: "60+",
    metricLabel: "Hours of sales calls saved"
  }
] as const;

const proofTrustLogos = [
  { name: "Siemens", src: "https://cdn.supademo.com/logos/simens.svg" },
  { name: "Tealium", src: "https://cdn.supademo.com/logos/tealium.svg" },
  { name: "Plaid", src: "https://cdn.supademo.com/logos/plaid.svg" },
  { name: "beehiiv", src: "https://cdn.supademo.com/logos/beehiiv.avif" },
  { name: "Hewlett Packard Enterprise", src: "https://cdn.supademo.com/logos/hpe.svg" },
  { name: "Opentrons", src: "https://cdn.supademo.com/logos/opentrons.svg" },
  { name: "Tennr", src: "https://cdn.supademo.com/logos/tennr.svg" },
  { name: "Lightspeed", src: "https://cdn.supademo.com/logos/lightspeed.svg" }
] as const;

function SignupProof() {
  return (
    <aside className="auth-proof" aria-label="Supademo customer proof">
      <div className="auth-proof-intro">
        <h2>Modern teams scale with Supademo</h2>
        <img
          className="auth-proof-badges-image"
          src="https://cdn.supademo.com/g2-badges.svg"
          alt="G2 Review Badges"
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
        />
      </div>
      <div className="auth-proof-card-viewport" aria-label="Customer results">
        <div className="auth-proof-cards">
          {proofCards.map((card) => (
            <article key={card.company}>
              <img
                className="auth-proof-card-logo"
                src={card.logo}
                alt={`${card.company} logo`}
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
              />
              <p>“{card.quote}”</p>
              <strong>{card.name}</strong>
              <small>{card.role}</small>
              <em>
                {card.metric}
                <small>{card.metricLabel}</small>
              </em>
              <span className="auth-proof-card-arrow" aria-hidden="true">
                ↗
              </span>
            </article>
          ))}
        </div>
      </div>
      <div className="auth-proof-trust">
        <p>Trusted by 200,000 professionals and 3,000 companies</p>
        <div>
          {proofTrustLogos.map((logo) => (
            <img
              key={logo.name}
              src={logo.src}
              alt={logo.name}
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
            />
          ))}
        </div>
      </div>
    </aside>
  );
}

export interface AuthScreenProps {
  readonly client?: AuthClient;
  readonly initialView?: AuthView;
  readonly signupSurface?: boolean;
}

type AuthFormValues = Readonly<{
  view: AuthView;
  signupSurface: boolean;
  signupStep: "email" | "password";
  email: string;
  password: string;
  code: string;
  confirmPassword: string;
}>;

/**
 * Keep the auth form responsive when the API is unavailable and give people a
 * useful next step instead of submitting values the server will reject. The
 * rules intentionally mirror the bounded server-side auth validators.
 */
function validateAuthForm(values: AuthFormValues): string | undefined {
  const email = values.email.trim();
  if (email.length === 0) return "Enter your email address.";
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(email)) {
    return "Enter a valid email address.";
  }

  if (values.view === "forgot") return undefined;

  if (values.view === "verify" || values.view === "reset") {
    const code = values.code.trim();
    if (!/^\d{4,12}$/u.test(code)) return "Enter the verification code from your email.";
  }

  if (values.signupSurface && values.view === "sign-up" && values.signupStep === "email") {
    return undefined;
  }

  if (values.view === "verify") return undefined;

  if (
    values.password.length < 8 ||
    values.password.length > 128 ||
    /[\r\n]/u.test(values.password)
  ) {
    return "Your password must be 8–128 characters long.";
  }

  if (values.view === "reset" && values.password !== values.confirmPassword) {
    return "The passwords must match.";
  }

  return undefined;
}

export function AuthScreen({
  client,
  initialView = "sign-in",
  signupSurface = false
}: AuthScreenProps) {
  const router = useRouter();
  const clientRef = useRef<AuthClient>(client ?? createAuthClient());
  const [view, setView] = useState<AuthView>(initialView);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [signupStep, setSignupStep] = useState<"email" | "password">(
    signupSurface ? "email" : "password"
  );
  const [message, setMessage] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  const goToSignIn = (): void => {
    setView("sign-in");
    setPassword("");
    setCode("");
    setConfirmPassword("");
    setError(undefined);
    setMessage(undefined);
  };

  const submit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setError(undefined);
    setMessage(undefined);

    const validationError = validateAuthForm({
      view,
      signupSurface,
      signupStep,
      email,
      password,
      code,
      confirmPassword
    });
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    const normalizedEmail = email.trim();
    try {
      if (signupSurface && view === "sign-up" && signupStep === "email") {
        setSignupStep("password");
        return;
      }
      const result =
        view === "sign-in"
          ? await clientRef.current.signIn(normalizedEmail, password)
          : view === "sign-up"
            ? await clientRef.current.signUp(normalizedEmail, password)
            : view === "verify"
              ? await clientRef.current.confirmEmail(normalizedEmail, code.trim())
              : view === "forgot"
                ? await clientRef.current.requestPasswordReset(normalizedEmail)
                : view === "reset"
                  ? await resetPassword(normalizedEmail)
                  : await clientRef.current.refreshSession();
      setMessage(result.message);
      if (view === "sign-up") {
        if (result.verificationRequired === false) {
          const signedIn = await clientRef.current.signIn(normalizedEmail, password);
          setMessage(signedIn.message);
          router.replace("/home");
          return;
        } else {
          setView("verify");
        }
      }
      if (view === "verify" || view === "reset") {
        setView("sign-in");
        setPassword("");
        setCode("");
        setConfirmPassword("");
      }
      if (view === "sign-in") {
        router.replace("/home");
        return;
      }
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

  const resetPassword = async (emailValue: string) => {
    if (password !== confirmPassword) {
      throw new Error("The passwords must match.");
    }
    return clientRef.current.resetPassword(emailValue, code.trim(), password);
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
            <a className="button button-primary auth-workspace-link" href="/home">
              Continue to workspace
            </a>
            <Button variant="secondary" loading={loading} onClick={() => void signOut()}>
              Sign out
            </Button>
          </Stack>
        </Card>
      </main>
    );
  }

  const heading =
    signupSurface && view === "sign-up"
      ? "Exceptional product demos in minutes, not days"
      : view === "sign-in"
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
        ? signupSurface && signupStep === "email"
          ? "Continue"
          : "Create account"
        : view === "verify"
          ? "Verify email"
          : view === "forgot"
            ? "Send reset email"
            : "Update password";
  const emailLabel = signupSurface ? "Work email" : "Email address";

  return (
    <main className={`auth-page${signupSurface ? " auth-page-signup" : ""}`}>
      <div className="auth-card-wrap">
        <h1 className="sr-only">{heading}</h1>
        <div className="auth-brand" aria-label="Supademo">
          {signupSurface ? (
            <span className="auth-brand-mark" aria-hidden="true">
              S
            </span>
          ) : null}
          <span>{signupSurface ? "" : "supademo"}</span>
        </div>
        <Card
          title={heading}
          description={
            signupSurface && view === "sign-up" && signupStep === "email"
              ? undefined
              : view === "forgot"
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
              label={emailLabel}
              description={
                signupSurface && view === "sign-up" && signupStep === "email"
                  ? "Use an organization email to easily collaborate with teammates"
                  : undefined
              }
              type="email"
              placeholder={signupSurface ? "name@company.com" : undefined}
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
            {view !== "forgot" &&
            view !== "verify" &&
            (!signupSurface || view !== "sign-up" || signupStep === "password") ? (
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
          {signupSurface && view === "sign-up" && signupStep === "email" ? (
            <>
              <div className="auth-divider">
                <span>or continue with</span>
              </div>
              <div className="auth-provider-grid" aria-label="Single sign-on options">
                {(["Google", "Microsoft", "SSO"] as const).map((provider) => (
                  <Button
                    key={provider}
                    type="button"
                    variant="secondary"
                    onClick={() =>
                      setError(`${provider} sign-in is not configured in this environment.`)
                    }
                  >
                    <span
                      className={`auth-provider-icon auth-provider-icon-${provider.toLowerCase()}`}
                      aria-hidden="true"
                    >
                      {provider === "Google" ? (
                        <img
                          src="https://cdn.supademo.com/google.svg"
                          alt=""
                          loading="lazy"
                          decoding="async"
                          referrerPolicy="no-referrer"
                        />
                      ) : provider === "Microsoft" ? (
                        <img
                          src="https://cdn.supademo.com/microsoft.svg"
                          alt=""
                          loading="lazy"
                          decoding="async"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        "◎"
                      )}
                    </span>
                    {provider}
                  </Button>
                ))}
              </div>
            </>
          ) : null}
          <div className="auth-links" aria-label="Account options">
            {view === "sign-in" ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setError(undefined);
                  setMessage(undefined);
                  setView("forgot");
                }}
              >
                Forgot password?
              </Button>
            ) : null}
            {view === "sign-in" ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setError(undefined);
                  setMessage(undefined);
                  setView("sign-up");
                }}
              >
                Create an account
              </Button>
            ) : null}
            {view === "sign-up" || view === "forgot" ? (
              signupSurface && view === "sign-up" ? (
                <a className="auth-route-link" href="/auth">
                  Already have an account? Log in
                </a>
              ) : (
                <Button variant="ghost" size="sm" onClick={goToSignIn}>
                  Back to sign in
                </Button>
              )
            ) : null}
            {view === "verify" ? (
              <Button variant="ghost" size="sm" onClick={goToSignIn}>
                Back to sign in
              </Button>
            ) : null}
            {view === "forgot" ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setError(undefined);
                  setMessage(undefined);
                  setView("reset");
                }}
              >
                I have a reset code
              </Button>
            ) : null}
            {view === "reset" ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setError(undefined);
                  setMessage(undefined);
                  setView("forgot");
                }}
              >
                Request a new code
              </Button>
            ) : null}
          </div>
          {signupSurface && view === "sign-up" && signupStep === "email" ? (
            <p className="auth-terms auth-terms-after-links">
              By continuing, you acknowledge that you understand and agree to the
              <a href="/terms-of-service"> Terms &amp; Conditions</a> and{" "}
              <a href="/privacy-policy">Privacy Policy</a>.
            </p>
          ) : null}
        </Card>
      </div>
      {signupSurface ? <SignupProof /> : null}
    </main>
  );
}
