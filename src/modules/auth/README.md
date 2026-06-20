# src/modules/auth/

Authentication module — user registration and login.

## Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/auth/register` | Public | Create a new user account |
| POST | `/api/v1/auth/login` | Public | Authenticate and receive a JWT |

## Request / Response shapes

### POST /register

```json
// Body
{ "name": "Alice", "email": "alice@example.com", "password": "secret1234" }

// 201 Response
{ "data": { "id": "<uuid>", "name": "Alice", "email": "alice@example.com" } }
```

### POST /login

```json
// Body
{ "email": "alice@example.com", "password": "secret1234" }

// 200 Response
{ "data": { "token": "<jwt>" } }
```

## JWT payload

```ts
{ sub: string, email: string }
```

`sub` is the user's UUID and is stored in `request.requestContext` as `userId` after `fastify.authenticate` runs on protected routes.

## Key schemas (`schemas/index.ts`)

| Schema | Used for |
|---|---|
| `registerBodySchema` | POST /register body validation |
| `loginBodySchema` | POST /login body validation |
| `authTokensSchema` | Login response data |
| `authUserSchema` | Register response data |
| `JwtPayload` | Type for the JWT payload object |

## Password hashing

`bcryptjs` with the default salt rounds (10). Hashing happens in the service layer; controllers never touch raw passwords beyond passing the request body through.
