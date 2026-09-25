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
