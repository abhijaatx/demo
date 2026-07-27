import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { DatabaseMembershipRepository } from "../packages/database/dist/index.js";
import {
  AuthorizationDeniedError,
  InvitationConflictError,
  InvitationValidationError
} from "../packages/domain/dist/index.js";

const ownerId = "018f0f7e-9b7d-7c4b-8c1b-1c0f2e6e0001";
const memberId = "018f0f7e-9b7d-7c4b-8c1b-1c0f2e6e0002";
const workspaceId = "018f0f7e-9b7d-7c4b-8c1b-1c0f2e6e0003";
const invitationId = "018f0f7e-9b7d-7c4b-8c1b-1c0f2e6e0004";
const invitationRow = {
  id: invitationId,
  workspace_id: workspaceId,
  email: "member@example.com",
  role: "editor",
  expires_at: "2026-07-19T00:00:00.000Z",
  created_at: "2026-07-12T00:00:00.000Z"
};

test("invitation creation stores only a hash and authorizes owner/admin", async () => {
  const calls = [];
  const client = {
    query: async (text, values = []) => {
      calls.push({ text, values });
      if (text === "BEGIN" || text === "COMMIT" || text === "ROLLBACK") return { rows: [] };
      if (text.includes("SELECT role FROM memberships")) return { rows: [{ role: "owner" }] };
      if (text.includes("INSERT INTO workspace_invitations")) return { rows: [invitationRow] };
      if (text.includes("INSERT INTO workspace_audit_events")) return { rows: [] };
      throw new Error("Unexpected invitation query");
    },
    release: () => undefined
  };
  const repository = new DatabaseMembershipRepository({ connect: async () => client });
  const expiresAt = new Date(Date.now() + 86_400_000);
  const created = await repository.createInvitation(
    workspaceId,
    ownerId,
    "Member@Example.com",
    "editor",
    expiresAt
  );
  assert.equal(created.invitation.email, "member@example.com");
  assert.match(created.token, /^[A-Za-z0-9_-]{32,}$/u);
  const insert = calls.find(({ text }) => text.includes("INSERT INTO workspace_invitations"));
  assert.ok(insert);
  assert.notEqual(insert.values[5], created.token);
  assert.match(insert.values[5], /^[a-f0-9]{64}$/u);
});

test("expired or email-mismatched invitations fail closed without membership changes", async () => {
  const calls = [];
  const client = {
    query: async (text, values = []) => {
      calls.push({ text, values });
      if (text === "BEGIN" || text === "COMMIT" || text === "ROLLBACK") return { rows: [] };
      if (text.includes("FROM workspace_invitations")) return { rows: [] };
      throw new Error("Unexpected accept query");
    },
    release: () => undefined
  };
  const repository = new DatabaseMembershipRepository({ connect: async () => client });
  await assert.rejects(
    repository.acceptInvitation("short", memberId, "member@example.com"),
    InvitationValidationError
  );
  const result = await repository.acceptInvitation("A".repeat(43), memberId, "member@example.com");
  assert.equal(result, null);
  assert.equal(
    calls.some(({ text }) => text.includes("INSERT INTO memberships")),
    false
  );
});

test("final owner cannot leave or be removed, and unauthorized actors are denied", async () => {
  const client = {
    query: async (text) => {
      if (text === "BEGIN" || text === "ROLLBACK" || text === "COMMIT") return { rows: [] };
      if (text.includes("SELECT role FROM memberships")) return { rows: [{ role: "owner" }] };
      if (text.includes("SELECT count(*)")) return { rows: [{ count: "1" }] };
      return { rows: [] };
    },
    release: () => undefined
  };
  const repository = new DatabaseMembershipRepository({ connect: async () => client });
  await assert.rejects(repository.leaveWorkspace(ownerId, workspaceId), InvitationConflictError);
  await assert.rejects(
    repository.removeMember(ownerId, workspaceId, memberId),
    InvitationConflictError
  );

  const unauthorizedClient = {
    query: async (text) => {
      if (text === "BEGIN" || text === "ROLLBACK") return { rows: [] };
      if (text.includes("SELECT role FROM memberships")) return { rows: [{ role: "viewer" }] };
      return { rows: [] };
    },
    release: () => undefined
  };
  const unauthorized = new DatabaseMembershipRepository({
    connect: async () => unauthorizedClient
  });
  await assert.rejects(
    unauthorized.removeMember(memberId, workspaceId, ownerId),
    AuthorizationDeniedError
  );

  const adminClient = {
    query: async (text, values = []) => {
      if (text === "BEGIN" || text === "ROLLBACK") return { rows: [] };
      if (text.includes("SELECT role FROM memberships")) {
        return { rows: [{ role: values[1] === ownerId ? "admin" : "owner" }] };
      }
      throw new Error("Admin must not remove an owner");
    },
    release: () => undefined
  };
  const admin = new DatabaseMembershipRepository({ connect: async () => adminClient });
  await assert.rejects(
    admin.removeMember(ownerId, workspaceId, memberId),
    AuthorizationDeniedError
  );
});

test("member role changes enforce hierarchy, workspace scope, and append a member audit event", async () => {
  const calls = [];
  const client = {
    query: async (text, values = []) => {
      calls.push({ text, values });
      if (text === "BEGIN" || text === "COMMIT" || text === "ROLLBACK") return { rows: [] };
      if (text.includes("SELECT role FROM memberships")) {
        return { rows: [{ role: values[1] === ownerId ? "owner" : "editor" }] };
      }
      if (text.includes("UPDATE memberships m")) {
        return {
          rows: [
            {
              user_id: memberId,
              workspace_id: workspaceId,
              email: "member@example.com",
              display_name: "Member",
              avatar_url: null,
              role: "viewer",
              created_at: "2026-07-12T00:00:00.000Z"
            }
          ]
        };
      }
      if (text.includes("INSERT INTO workspace_audit_events")) return { rows: [] };
      throw new Error("Unexpected member administration query");
    },
    release: () => undefined
  };
  const repository = new DatabaseMembershipRepository({ connect: async () => client });
  const updated = await repository.updateMemberRole(ownerId, workspaceId, memberId, "viewer");
  assert.equal(updated.role, "viewer");
  const update = calls.find(({ text }) => text.includes("UPDATE memberships m"));
  assert.deepEqual(update.values, [workspaceId, memberId, "viewer"]);
  const audit = calls.find(({ text }) => text.includes("INSERT INTO workspace_audit_events"));
  assert.equal(audit.values[1], workspaceId);
  assert.equal(audit.values[2], ownerId);
  assert.equal(audit.values[3], memberId);
  assert.equal(audit.values[5], "member.role_changed");

  const adminClient = {
    query: async (text, values = []) => {
      if (text === "BEGIN" || text === "ROLLBACK") return { rows: [] };
      if (text.includes("SELECT role FROM memberships")) {
        return { rows: [{ role: values[1] === ownerId ? "admin" : "admin" }] };
      }
      throw new Error("Admin must not mutate privileged peers");
    },
    release: () => undefined
  };
  const adminRepository = new DatabaseMembershipRepository({ connect: async () => adminClient });
  await assert.rejects(
    adminRepository.updateMemberRole(ownerId, workspaceId, memberId, "viewer"),
    AuthorizationDeniedError
  );
});

test("membership migration stores hashed, scoped, expiring invitation records", async () => {
  const migration = await readFile(
    new URL(
      "../packages/database/migrations/2026071200400_membership_lifecycle.sql",
      import.meta.url
    ),
    "utf8"
  );
  assert.match(migration, /token_hash text NOT NULL UNIQUE/u);
  assert.match(migration, /expires_at timestamptz/u);
  assert.match(migration, /role IN \('admin', 'editor', 'viewer'\)/u);
  assert.doesNotMatch(migration, /token text/iu);
});

test("member administration migration and repository remain tenant-scoped", async () => {
  const [migration, source] = await Promise.all([
    readFile(
      new URL(
        "../packages/database/migrations/2026071200500_member_administration.sql",
        import.meta.url
      ),
      "utf8"
    ),
    readFile(new URL("../packages/database/src/memberships.ts", import.meta.url), "utf8")
  ]);
  assert.match(migration, /workspace_audit_events/u);
  assert.match(migration, /workspace_id uuid NOT NULL/u);
  assert.match(source, /WHERE m\.workspace_id = \$1/u);
  assert.match(source, /WHERE workspace_id = \$1 AND accepted_at IS NULL/u);
  assert.match(source, /WHERE workspace_id = \$1\s+ORDER BY created_at DESC/u);
});
