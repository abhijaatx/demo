"use client";

import { Button, Card, InlineAlert, Input, Select, Skeleton, Stack, Switch } from "@supademo/ui";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  createProfileClient,
  type ProfileClient,
  type UserProfile,
  type UserProfilePatch
} from "../src/lib/profile-client";

const timezoneOptions = [
  "UTC",
  "Asia/Kolkata",
  "America/Los_Angeles",
  "America/New_York",
  "Europe/London",
  "Europe/Berlin",
  "Australia/Sydney"
] as const;

const emptyPreferences = {
  theme: "system" as const,
  locale: "en-US",
  reducedMotion: false,
  emailNotifications: true
};

export interface ProfileSettingsScreenProps {
  readonly client?: ProfileClient;
}

export function ProfileSettingsScreen({ client }: ProfileSettingsScreenProps) {
  const clientRef = useRef<ProfileClient>(client ?? createProfileClient());
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [timezone, setTimezone] = useState("UTC");
  const [theme, setTheme] = useState<"system" | "light" | "dark">("system");
  const [reducedMotion, setReducedMotion] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [status, setStatus] = useState<"loading" | "ready" | "saving" | "error" | "denied">(
    "loading"
  );
  const [message, setMessage] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    let active = true;
    void clientRef.current
      .getProfile()
      .then((loaded) => {
        if (!active) return;
        setProfile(loaded);
        setDisplayName(loaded.displayName);
        setAvatarUrl(loaded.avatarUrl ?? "");
        setTimezone(loaded.timezone);
        setTheme(loaded.preferences.theme);
        setReducedMotion(loaded.preferences.reducedMotion);
        setEmailNotifications(loaded.preferences.emailNotifications);
        setStatus("ready");
      })
      .catch((caught: unknown) => {
        if (!active) return;
        setStatus(
          caught instanceof Error && "status" in caught && caught.status === 401
            ? "denied"
            : "error"
        );
        setError(
          caught instanceof Error && "status" in caught && caught.status === 401
            ? "Sign in to manage your profile."
            : "Your profile could not be loaded. Try again."
        );
      });
    return () => {
      active = false;
    };
  }, []);

  const save = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!displayName.trim()) {
      setError("Enter a display name.");
      return;
    }
    setStatus("saving");
    setError(undefined);
    setMessage(undefined);
    const patch: UserProfilePatch = {
      displayName: displayName.trim(),
      avatarUrl: avatarUrl.trim() || null,
      timezone,
      preferences: {
        theme,
        locale: profile?.preferences.locale ?? emptyPreferences.locale,
        reducedMotion,
        emailNotifications
      }
    };
    try {
      const updated = await clientRef.current.updateProfile(patch);
      setProfile(updated);
      setDisplayName(updated.displayName);
      setAvatarUrl(updated.avatarUrl ?? "");
      setTimezone(updated.timezone);
      setTheme(updated.preferences.theme);
      setReducedMotion(updated.preferences.reducedMotion);
      setEmailNotifications(updated.preferences.emailNotifications);
      setMessage("Profile updated.");
      setStatus("ready");
    } catch {
      setError("Your profile could not be saved. Check the fields and try again.");
      setStatus("ready");
    }
  };

  if (status === "loading") {
    return (
      <div className="content-wrap profile-settings" aria-busy="true">
        <Skeleton variant="text" lines={2} />
        <div className="profile-settings-grid">
          <Skeleton variant="rect" />
          <Skeleton variant="rect" />
        </div>
      </div>
    );
  }

  if (status === "denied") {
    return (
      <div className="content-wrap profile-settings" role="alert">
        <InlineAlert title="Sign in required">{error}</InlineAlert>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="content-wrap profile-settings" role="alert">
        <InlineAlert title="Could not load profile">{error}</InlineAlert>
        <div className="profile-settings-actions">
          <Button variant="secondary" onClick={() => window.location.reload()}>
            Try again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="content-wrap profile-settings">
      <div className="profile-settings-heading">
        <div>
          <p className="eyebrow">Account settings</p>
          <h1>Profile</h1>
          <p className="profile-settings-description">
            Keep your name and preferences up to date for your Supademo workspace.
          </p>
        </div>
      </div>
      {error ? <InlineAlert title="Could not save profile">{error}</InlineAlert> : null}
      {message ? (
        <div className="profile-settings-success" role="status">
          {message}
        </div>
      ) : null}
      <form className="profile-settings-form" onSubmit={(event) => void save(event)} noValidate>
        <div className="profile-settings-grid">
          <Card title="Your profile" description="This information is visible to your team.">
            <Stack gap="4">
              <Input label="Email address" type="email" value={profile?.email ?? ""} readOnly />
              <Input
                label="Display name"
                value={displayName}
                onChange={(event) => setDisplayName(event.currentTarget.value)}
                autoComplete="name"
                maxLength={120}
                required
              />
              <Input
                label="Avatar URL"
                description="Use an HTTPS image URL. Leave blank to use your initials."
                type="url"
                value={avatarUrl}
                onChange={(event) => setAvatarUrl(event.currentTarget.value)}
                maxLength={2_048}
                inputMode="url"
              />
              <Select
                label="Timezone"
                value={timezone}
                onChange={(event) => setTimezone(event.currentTarget.value)}
              >
                {timezoneOptions.includes(timezone as (typeof timezoneOptions)[number]) ? null : (
                  <option value={timezone}>{timezone}</option>
                )}
                {timezoneOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </Select>
            </Stack>
          </Card>
          <Card title="Preferences" description="Choose how Supademo feels while you work.">
            <Stack gap="4">
              <Select
                label="Appearance"
                value={theme}
                onChange={(event) => setTheme(event.currentTarget.value as typeof theme)}
              >
                <option value="system">Use system setting</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </Select>
              <Switch
                label="Reduce motion"
                description="Use fewer animations and transitions."
                checked={reducedMotion}
                onChange={(event) => setReducedMotion(event.currentTarget.checked)}
              />
              <Switch
                label="Email notifications"
                description="Receive useful account and workspace updates."
                checked={emailNotifications}
                onChange={(event) => setEmailNotifications(event.currentTarget.checked)}
              />
            </Stack>
          </Card>
        </div>
        <div className="profile-settings-actions">
          <Button type="submit" loading={status === "saving"} loadingLabel="Saving profile">
            Save changes
          </Button>
        </div>
      </form>
    </div>
  );
}
