# Users and profiles

TASK-023 adds the application-owned user profile boundary on top of the identity provider from TASK-021.

## Data model

- `users` remains the identity mapping. `identity_subject` is unique and is never accepted from the browser as a profile-owner selector. Email is normalized and uniquely indexed case-insensitively.
- `user_profiles` is keyed by `user_id` and stores display name, optional HTTPS avatar URL, IANA timezone, an allowlisted preferences object, and timestamps.
- Profile deletion cascades when a user is deleted. User deletion itself is not implemented by this task; memberships currently restrict deletion so a future account-deletion workflow must first handle workspace membership, ownership transfer, audit retention, and provider-side account deletion.

## Identity reconciliation

`DatabaseUserProfileRepository.syncIdentity` uses a transaction and `INSERT ... ON CONFLICT (identity_subject)` to create or update the local user mapping. It creates the profile exactly once with deterministic defaults and then reads the joined record. Repeated calls for the same identity subject do not create duplicate users or profiles. The API obtains the subject and email from the authenticated identity context; it does not trust a request-body user ID.

The identity provider must expose a validated email claim for profile synchronization. Tokens without an email claim fail closed at the profile boundary until a trusted provider-side lookup is added.

## API

- `GET /api/v1/me/profile` returns the authenticated user profile.
- `PATCH /api/v1/me/profile` updates display name, avatar URL, timezone, and the complete preferences object.

Both routes require the established authentication middleware. The repository and API use parameterized queries and generic store errors. Unknown fields, unsafe avatar schemes, invalid timezones, unsupported preference keys, control characters, and oversized values are rejected.

## Settings UI

The profile screen is available at `/settings/profile` behind the existing Settings navigation entry. It uses labeled controls, a read-only email field, safe save feedback, loading skeletons, permission-denied messaging, and a simple card layout consistent with the creator workspace.

Avatar URLs are stored as references only; the API never fetches or proxies them. Future avatar upload work must use the media/storage pipeline and must not loosen the HTTPS validation without an explicit threat review.
