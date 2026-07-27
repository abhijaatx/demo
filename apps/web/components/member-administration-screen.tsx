"use client";

import { Button, Card, InlineAlert, Input, Modal, Select, Skeleton, Stack } from "@supademo/ui";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import {
  createMembershipClient,
  type AssignableMemberRole,
  type MembershipClient,
  type PendingInvitation,
  type WorkspaceMember
} from "../src/lib/membership-client";
import {
  createWorkspaceClient,
  type WorkspaceClient,
  type WorkspaceSummary
} from "../src/lib/workspace-client";

type ScreenStatus = "loading" | "ready" | "error" | "denied";
type PendingAction =
  | { readonly kind: "remove"; readonly member: WorkspaceMember }
  | { readonly kind: "revoke"; readonly invitation: PendingInvitation };

export interface MemberAdministrationScreenProps {
  readonly membershipClient?: MembershipClient;
  readonly workspaceClient?: WorkspaceClient;
}

export function MemberAdministrationScreen({
  membershipClient,
  workspaceClient
}: MemberAdministrationScreenProps) {
  const membershipRef = useRef<MembershipClient>(membershipClient ?? createMembershipClient());
  const workspaceRef = useRef<WorkspaceClient>(workspaceClient ?? createWorkspaceClient());
  const [workspace, setWorkspace] = useState<WorkspaceSummary | null>(null);
  const [members, setMembers] = useState<readonly WorkspaceMember[]>([]);
  const [pending, setPending] = useState<readonly PendingInvitation[]>([]);
  const [status, setStatus] = useState<ScreenStatus>("loading");
  const [error, setError] = useState<string | undefined>();
  const [message, setMessage] = useState<string | undefined>();
  const [email, setEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<AssignableMemberRole>("editor");
  const [busy, setBusy] = useState<string | undefined>();
  const [confirmation, setConfirmation] = useState<PendingAction | null>(null);

  const load = useCallback(async () => {
    setStatus("loading");
    setError(undefined);
    try {
      const current = await workspaceRef.current.getCurrent();
      const [loadedMembers, loadedPending] = await Promise.all([
        membershipRef.current.listMembers(current.workspaceId),
        membershipRef.current.listPendingInvitations(current.workspaceId)
      ]);
      setWorkspace(current);
      setMembers(loadedMembers);
      setPending(loadedPending);
      setStatus("ready");
    } catch (caught) {
      const clientError = caught instanceof Error && "status" in caught ? caught : undefined;
      setStatus(clientError?.status === 401 || clientError?.status === 403 ? "denied" : "error");
      setError(
        clientError?.status === 403
          ? "You don’t have permission to view members in this workspace."
          : clientError?.status === 401
            ? "Sign in to manage workspace members."
            : "Workspace members could not be loaded. Try again."
      );
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const canInvite = workspace?.capabilities.includes("member:invite") ?? false;
  const canUpdate = workspace?.capabilities.includes("member:update") ?? false;
  const canRemove = workspace?.capabilities.includes("member:remove") ?? false;

  const invite = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!workspace || !email.trim()) {
      setError("Enter an email address.");
      return;
    }
    setBusy("invite");
    setError(undefined);
    setMessage(undefined);
    try {
      await membershipRef.current.invite(workspace.workspaceId, email.trim(), inviteRole);
      setEmail("");
      setMessage("Invitation sent.");
      const invitations = await membershipRef.current.listPendingInvitations(workspace.workspaceId);
      setPending(invitations);
    } catch {
      setError("The invitation could not be sent. Check the email and try again.");
    } finally {
      setBusy(undefined);
    }
  };

  const updateRole = async (member: WorkspaceMember, role: AssignableMemberRole): Promise<void> => {
    if (!workspace) return;
    setBusy(`role:${member.userId}`);
    setError(undefined);
    setMessage(undefined);
    try {
      const updated = await membershipRef.current.updateRole(
        workspace.workspaceId,
        member.userId,
        role
      );
      setMembers((current) =>
        current.map((item) => (item.userId === updated.userId ? updated : item))
      );
      setMessage(`${updated.displayName} is now a ${updated.role}.`);
    } catch {
      setError("The role could not be changed. The member list was left unchanged.");
    } finally {
      setBusy(undefined);
    }
  };

  const confirmAction = async (): Promise<void> => {
    if (!workspace || !confirmation) return;
    const action = confirmation;
    setBusy(
      `${action.kind}:${action.kind === "remove" ? action.member.userId : action.invitation.id}`
    );
    setError(undefined);
    setMessage(undefined);
    try {
      if (action.kind === "remove") {
        await membershipRef.current.remove(workspace.workspaceId, action.member.userId);
        setMembers((current) => current.filter((member) => member.userId !== action.member.userId));
        setMessage(`${action.member.displayName} was removed from the workspace.`);
      } else {
        await membershipRef.current.revokeInvitation(workspace.workspaceId, action.invitation.id);
        setPending((current) => current.filter((item) => item.id !== action.invitation.id));
        setMessage(`Invitation for ${action.invitation.email} was revoked.`);
      }
      setConfirmation(null);
    } catch {
      setError("That change could not be completed. The current list was kept.");
    } finally {
      setBusy(undefined);
    }
  };

  const resend = async (invitation: PendingInvitation): Promise<void> => {
    if (!workspace) return;
    setBusy(`resend:${invitation.id}`);
    setError(undefined);
    try {
      await membershipRef.current.resendInvitation(workspace.workspaceId, invitation.id);
      setMessage(`A new invitation was sent to ${invitation.email}.`);
      setPending(await membershipRef.current.listPendingInvitations(workspace.workspaceId));
    } catch {
      setError("The invitation could not be resent. Try again.");
    } finally {
      setBusy(undefined);
    }
  };

  if (status === "loading") {
    return (
      <div className="content-wrap member-settings" aria-busy="true">
        <Skeleton variant="text" lines={2} />
        <Skeleton variant="rect" />
        <Skeleton variant="rect" />
      </div>
    );
  }

  if (status === "error" || status === "denied") {
    return (
      <div className="content-wrap member-settings" role="alert">
        <InlineAlert title={status === "denied" ? "Members unavailable" : "Could not load members"}>
          {error}
        </InlineAlert>
        {status === "error" ? (
          <div className="member-settings-actions">
            <Button variant="secondary" onClick={() => void load()}>
              Try again
            </Button>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="content-wrap member-settings">
      <div className="member-settings-heading">
        <div>
          <p className="eyebrow">Workspace settings</p>
          <h1>Members</h1>
          <p>Manage who can create, edit, and view demos in {workspace?.workspaceName}.</p>
        </div>
      </div>
      {error ? <InlineAlert title="Could not update members">{error}</InlineAlert> : null}
      {message ? (
        <div className="profile-settings-success" role="status">
          {message}
        </div>
      ) : null}

      <div className="member-settings-grid">
        <Card
          title="People"
          description={`${members.length} workspace member${members.length === 1 ? "" : "s"}.`}
        >
          <div className="member-table-wrap">
            <table className="member-table">
              <thead>
                <tr>
                  <th scope="col">Member</th>
                  <th scope="col">Role</th>
                  <th scope="col">
                    <span className="ui-sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => {
                  const canEditMember = canUpdate && member.role !== "owner";
                  return (
                    <tr key={member.userId}>
                      <td data-label="Member">
                        <strong>{member.displayName}</strong>
                        <small>{member.email}</small>
                      </td>
                      <td data-label="Role">
                        {member.role === "owner" ? (
                          <span className="member-role-label">Owner</span>
                        ) : (
                          <Select
                            aria-label={`Role for ${member.displayName}`}
                            value={member.role}
                            disabled={!canEditMember || busy === `role:${member.userId}`}
                            onChange={(event) =>
                              void updateRole(
                                member,
                                event.currentTarget.value as AssignableMemberRole
                              )
                            }
                          >
                            <option value="admin">Admin</option>
                            <option value="editor">Editor</option>
                            <option value="viewer">Viewer</option>
                          </Select>
                        )}
                      </td>
                      <td className="member-table-actions" data-label="Actions">
                        {canRemove && member.role !== "owner" ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={busy === `remove:${member.userId}`}
                            onClick={() => setConfirmation({ kind: "remove", member })}
                          >
                            Remove
                          </Button>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Invite people" description="Choose a role before sending an invitation.">
          {canInvite ? (
            <form
              className="member-invite-form"
              onSubmit={(event) => void invite(event)}
              noValidate
            >
              <Stack gap="3">
                <Input
                  label="Email address"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.currentTarget.value)}
                  maxLength={320}
                  required
                />
                <Select
                  label="Role"
                  value={inviteRole}
                  onChange={(event) =>
                    setInviteRole(event.currentTarget.value as AssignableMemberRole)
                  }
                >
                  <option value="admin">Admin</option>
                  <option value="editor">Editor</option>
                  <option value="viewer">Viewer</option>
                </Select>
                <Button type="submit" loading={busy === "invite"} loadingLabel="Sending invitation">
                  Send invitation
                </Button>
              </Stack>
            </form>
          ) : (
            <InlineAlert title="Invite permission required">
              Ask a workspace owner or admin to invite another person.
            </InlineAlert>
          )}
        </Card>
      </div>

      <Card title="Pending invitations" description="Invitations expire after seven days.">
        {pending.length === 0 ? (
          <p className="member-empty">No invitations are waiting for a response.</p>
        ) : (
          <div className="member-table-wrap">
            <table className="member-table">
              <thead>
                <tr>
                  <th scope="col">Email</th>
                  <th scope="col">Role</th>
                  <th scope="col">
                    <span className="ui-sr-only">Invitation actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {pending.map((invitation) => (
                  <tr key={invitation.id}>
                    <td data-label="Email">{invitation.email}</td>
                    <td data-label="Role">
                      <span className="member-role-label">{invitation.role}</span>
                    </td>
                    <td className="member-table-actions" data-label="Actions">
                      {canInvite ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={busy === `resend:${invitation.id}`}
                          onClick={() => void resend(invitation)}
                        >
                          Resend
                        </Button>
                      ) : null}
                      {canRemove ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={busy === `revoke:${invitation.id}`}
                          onClick={() => setConfirmation({ kind: "revoke", invitation })}
                        >
                          Revoke
                        </Button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={confirmation !== null}
        onClose={() => setConfirmation(null)}
        title={confirmation?.kind === "remove" ? "Remove member?" : "Revoke invitation?"}
        description={
          confirmation?.kind === "remove"
            ? "This person will lose access to this workspace and its demos."
            : "This invitation link will stop working immediately."
        }
      >
        <div className="member-confirmation-actions">
          <Button
            variant="secondary"
            onClick={() => setConfirmation(null)}
            disabled={busy !== undefined}
          >
            Cancel
          </Button>
          <Button
            loading={busy !== undefined}
            loadingLabel="Updating members"
            onClick={() => void confirmAction()}
          >
            {confirmation?.kind === "remove" ? "Remove member" : "Revoke invitation"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
