# Frontend API contract

Set `VITE_API_BASE_URL` to the backend API base URL. The client sends cookies with requests and sends `Authorization: Bearer <token>` when the current session supplies a token.

`POST /auth/password-reset-requests`

```json
{ "email": "person@example.com" }
```

Always return a generic success response to prevent account enumeration.

`POST /users/invitations`

```json
{ "name": "Ada Lovelace", "email": "ada@example.com", "role": "Member" }
```

`PATCH /users/:id`

```json
{ "name": "Ada Lovelace", "role": "Manager", "status": "Active" }
```

The user endpoints should return either the user object or `{ "user": { ... } }`. A `204 No Content` response is also supported.

## Two-factor authentication and sessions

The browser demo implements RFC 6238 TOTP verification locally. A production API should own the authenticator secret and recovery-code lifecycle; it must not trust a client-submitted secret as proof of enrollment.

`POST /auth/totp/enrollments`

Start an enrollment for the authenticated account. The server creates and stores a pending secret and returns it once for QR rendering:

```json
{ "secret": "BASE32SECRET", "issuer": "SecureFlow", "account": "person@example.com" }
```

The client builds an `otpauth://totp/...` URI and renders the QR code locally.

`POST /auth/totp/enrollments/confirm`

Verify a current 6-digit TOTP before enabling MFA. Return one-time recovery codes only after successful verification:

```json
{ "code": "123456" }
```

```json
{ "enabled": true, "recoveryCodes": ["ABCD-E", "FGHI-J"] }
```

`POST /auth/login` should accept either a current 6-digit TOTP or one unused recovery code. Recovery codes must be stored hashed and invalidated atomically when used. `DELETE /auth/totp` disables MFA only after password and/or current-factor reauthentication.

`GET /auth/sessions` returns active sessions for the authenticated account:

```json
{ "sessions": [{ "id": "session-id", "device": "Browser / device", "createdAt": "2026-11-16T10:00:00Z", "lastActive": "2026-11-16T10:30:00Z", "isCurrent": true }] }
```

`POST /auth/sessions/revoke-all` revokes every session, including the current token, and returns `204 No Content` or `{ "revoked": true }`.
