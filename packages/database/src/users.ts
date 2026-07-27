import {
  defaultDisplayName,
  defaultUserPreferences,
  normalizeIdentitySubject,
  normalizeProfileEmail,
  normalizeUserPreferences,
  parseUserProfilePatch,
  UserProfileStoreError,
  type UserIdentityInput,
  type UserProfile,
  type UserProfilePatch,
  type UserProfileRepository
} from "@supademo/domain";
import type { Pool } from "pg";
import { createUuidV7 } from "./ids.js";
import { query } from "./pool.js";
import { withTransaction } from "./transaction.js";

type UserProfileRow = Readonly<{
  user_id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  timezone: string;
  preferences: unknown;
  created_at: Date | string;
  updated_at: Date | string;
}>;

const profileSelect = `
  SELECT
    u.id AS user_id,
    u.email,
    p.display_name,
    p.avatar_url,
    p.timezone,
    p.preferences,
    p.created_at,
    p.updated_at
  FROM users u
  INNER JOIN user_profiles p ON p.user_id = u.id
`;

export class DatabaseUserProfileRepository implements UserProfileRepository {
  constructor(private readonly pool: Pool) {}

  async syncIdentity(input: UserIdentityInput): Promise<UserProfile> {
    const subject = normalizeIdentitySubject(input.subject);
    const email = normalizeProfileEmail(input.email);
    try {
      return await withTransaction(this.pool, async (client) => {
        const userResult = await query<{ id: string }>(
          client,
          `
            INSERT INTO users (id, identity_subject, email)
            VALUES ($1, $2, $3)
            ON CONFLICT (identity_subject)
            DO UPDATE SET email = EXCLUDED.email, updated_at = now()
            RETURNING id
          `,
          [createUuidV7(), subject, email]
        );
        const user = userResult.rows[0];
        if (!user) throw new UserProfileStoreError();

        await query(
          client,
          `
            INSERT INTO user_profiles (user_id, display_name, preferences)
            VALUES ($1, $2, $3::jsonb)
            ON CONFLICT (user_id) DO NOTHING
          `,
          [user.id, defaultDisplayName(email), JSON.stringify(defaultUserPreferences)]
        );
        const profile = await selectProfile(client, user.id);
        if (!profile) throw new UserProfileStoreError();
        return profile;
      });
    } catch (error) {
      if (error instanceof UserProfileStoreError) throw error;
      throw new UserProfileStoreError();
    }
  }

  async updateProfile(
    subjectInput: string,
    patchInput: UserProfilePatch
  ): Promise<UserProfile | null> {
    const subject = normalizeIdentitySubject(subjectInput);
    const patch = parseUserProfilePatch(patchInput);
    try {
      const result = await query<UserProfileRow>(
        this.pool,
        `
          UPDATE user_profiles p
          SET
            display_name = COALESCE($2, p.display_name),
            avatar_url = CASE WHEN $3::boolean THEN $4 ELSE p.avatar_url END,
            timezone = COALESCE($5, p.timezone),
            preferences = COALESCE($6::jsonb, p.preferences),
            updated_at = now()
          FROM users u
          WHERE u.id = p.user_id AND u.identity_subject = $1
          RETURNING
            u.id AS user_id,
            u.email,
            p.display_name,
            p.avatar_url,
            p.timezone,
            p.preferences,
            p.created_at,
            p.updated_at
        `,
        [
          subject,
          patch.displayName ?? null,
          patch.avatarUrl !== undefined,
          patch.avatarUrl ?? null,
          patch.timezone ?? null,
          patch.preferences ? JSON.stringify(patch.preferences) : null
        ]
      );
      const row = result.rows[0];
      return row ? mapProfileRow(row) : null;
    } catch (error) {
      if (error instanceof UserProfileStoreError) throw error;
      throw new UserProfileStoreError();
    }
  }
}

async function selectProfile(
  executor: Parameters<typeof query>[0],
  userId: string
): Promise<UserProfile | null> {
  const result = await query<UserProfileRow>(executor, `${profileSelect} WHERE u.id = $1`, [
    userId
  ]);
  const row = result.rows[0];
  return row ? mapProfileRow(row) : null;
}

function mapProfileRow(row: UserProfileRow): UserProfile {
  if (
    typeof row.user_id !== "string" ||
    typeof row.email !== "string" ||
    typeof row.display_name !== "string" ||
    (row.avatar_url !== null && typeof row.avatar_url !== "string") ||
    typeof row.timezone !== "string"
  ) {
    throw new UserProfileStoreError();
  }
  return Object.freeze({
    userId: row.user_id,
    email: normalizeProfileEmail(row.email),
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    timezone: row.timezone,
    preferences: normalizeUserPreferences(row.preferences),
    createdAt: toIsoString(row.created_at),
    updatedAt: toIsoString(row.updated_at)
  });
}

function toIsoString(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) throw new UserProfileStoreError();
  return date.toISOString();
}
