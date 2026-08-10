import { randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import {
  AuthProviderOperationError,
  type AuthWorkflowProvider,
  type IdentityClaims,
  type IdentityProvider
} from "@supademo/auth";

const scrypt = promisify(scryptCallback);
const LOCAL_VERIFICATION_CODE = "123456";
const PASSWORD_KEY_LENGTH = 64;

type LocalAccount = Readonly<{
  subject: string;
  email: string;
  passwordHash: string;
}>;

/**
 * Development-only identity provider. It keeps accounts in memory and auto-verifies them because
 * local Docker defaults do not include a mail delivery service. Production must inject a managed
 * identity provider instead of this adapter.
 */
export class LocalAuthProvider implements AuthWorkflowProvider, IdentityProvider {
  readonly kind = "local" as const;
  private readonly accounts = new Map<string, LocalAccount>();

  async signUp(input: {
    readonly email: string;
    readonly password: string;
  }): Promise<{ readonly verificationRequired: false }> {
    if (this.accounts.has(input.email)) {
      throw new AuthProviderOperationError("already_exists");
    }
    const passwordHash = await hashPassword(input.password);
    this.accounts.set(
      input.email,
      Object.freeze({
        subject: randomUUID(),
        email: input.email,
        passwordHash
      })
    );
    return { verificationRequired: false };
  }

  async confirmEmail(input: { readonly email: string; readonly code: string }): Promise<void> {
    if (!this.accounts.has(input.email) || input.code !== LOCAL_VERIFICATION_CODE) {
      throw new AuthProviderOperationError("invalid_code");
    }
  }

  async signIn(input: { readonly email: string; readonly password: string }): Promise<{
    readonly identity: IdentityClaims;
  }> {
    const account = this.accounts.get(input.email);
    if (!account || !(await verifyPassword(input.password, account.passwordHash))) {
      throw new AuthProviderOperationError("invalid_credentials");
    }
    return { identity: this.identityFor(account) };
  }

  async signOut(): Promise<void> {
    return;
  }

  async requestPasswordReset(input: { readonly email: string }): Promise<void> {
    // Keep the local adapter enumeration-resistant; no mail is sent in local mode.
    void input;
  }

  async resetPassword(input: {
    readonly email: string;
    readonly code: string;
    readonly password: string;
  }): Promise<void> {
    const account = this.accounts.get(input.email);
    if (!account || input.code !== LOCAL_VERIFICATION_CODE) {
      throw new AuthProviderOperationError("invalid_code");
    }
    this.accounts.set(
      input.email,
      Object.freeze({ ...account, passwordHash: await hashPassword(input.password) })
    );
  }

  async refreshSession(): Promise<{ readonly identity: IdentityClaims }> {
    throw new AuthProviderOperationError("unavailable");
  }

  async verifyAccessToken(): Promise<IdentityClaims> {
    // Local mode issues opaque HttpOnly sessions, not bearer tokens.
    throw new Error("Local authentication does not accept bearer tokens.");
  }

  private identityFor(account: LocalAccount): IdentityClaims {
    return {
      subject: account.subject,
      email: account.email,
      issuer: "local",
      audience: "local-dev",
      expiresAt: Math.floor(Date.now() / 1000) + 3_600,
      tokenUse: "access",
      provider: "local"
    };
  }
}

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = (await scrypt(password, salt, PASSWORD_KEY_LENGTH)) as Buffer;
  return `${salt.toString("base64url")}.${derived.toString("base64url")}`;
}

async function verifyPassword(password: string, encoded: string): Promise<boolean> {
  const [saltEncoded, hashEncoded] = encoded.split(".");
  if (!saltEncoded || !hashEncoded) return false;
  try {
    const salt = Buffer.from(saltEncoded, "base64url");
    const expected = Buffer.from(hashEncoded, "base64url");
    const actual = (await scrypt(password, salt, expected.length)) as Buffer;
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}
