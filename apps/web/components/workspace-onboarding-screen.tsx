"use client";

import { Button, Card, InlineAlert, Input, Stack } from "@supademo/ui";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import {
  createWorkspaceClient,
  type WorkspaceClient,
  type WorkspaceSummary
} from "../src/lib/workspace-client";

export interface WorkspaceOnboardingScreenProps {
  readonly client?: WorkspaceClient;
}

export function WorkspaceOnboardingScreen({ client }: WorkspaceOnboardingScreenProps) {
  const router = useRouter();
  const clientRef = useRef<WorkspaceClient>(client ?? createWorkspaceClient());
  const [organizationName, setOrganizationName] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [slug, setSlug] = useState("");
  const [created, setCreated] = useState<WorkspaceSummary | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const submit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setError(undefined);
    setSaving(true);
    try {
      setCreated(await clientRef.current.create({ organizationName, workspaceName, slug }));
    } catch {
      setError("We couldn’t create that workspace. Check the names and try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="onboarding-page">
      <div className="onboarding-card-wrap">
        <div className="auth-brand" aria-label="Supademo">
          supademo
        </div>
        <Card
          title="Set up your workspace"
          description="Create a simple home for your team’s demos. You can invite teammates later."
        >
          {error ? <InlineAlert title="Could not create workspace">{error}</InlineAlert> : null}
          {created ? (
            <Stack gap="4">
              <div className="auth-success" role="status">
                {created.workspaceName} is ready.
              </div>
              <Button onClick={() => router.push("/")}>Continue to workspace</Button>
            </Stack>
          ) : (
            <form className="onboarding-form" onSubmit={(event) => void submit(event)} noValidate>
              <Input
                label="Organization name"
                value={organizationName}
                onChange={(event) => setOrganizationName(event.currentTarget.value)}
                maxLength={200}
                required
              />
              <Input
                label="Workspace name"
                value={workspaceName}
                onChange={(event) => setWorkspaceName(event.currentTarget.value)}
                maxLength={200}
                required
              />
              <Input
                label="Workspace URL slug"
                description="Use lowercase letters, numbers, and hyphens."
                value={slug}
                onChange={(event) => setSlug(event.currentTarget.value)}
                maxLength={63}
                pattern="[a-zA-Z0-9-]+"
                required
              />
              <Button type="submit" loading={saving} loadingLabel="Creating workspace">
                Create workspace
              </Button>
            </form>
          )}
        </Card>
      </div>
    </main>
  );
}
