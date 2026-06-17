# src/common/errors/

Typed HTTP error classes. All extend `AppError` and are caught by the global `setErrorHandler` in `app.ts`.

## Hierarchy

```
AppError (base)
├── NotFoundError       → 404 NOT_FOUND
├── UnauthorizedError   → 401 UNAUTHORIZED
├── ConflictError       → 409 CONFLICT
└── ValidationError     → 422 VALIDATION_ERROR
```

## AppError shape

```ts
{
  statusCode: number
  code: string // machine-readable, SCREAMING_SNAKE_CASE
  message: string // human-readable
}
```

## Usage in services / controllers

```ts
import { NotFoundError } from '@/common/errors/NotFoundError.js'

if (!user)
  throw new NotFoundError('User not found')
```

The error handler in `app.ts` serialises any `AppError` instance to JSON and sets the correct HTTP status code automatically.

## Adding a new error type

```ts
import { AppError } from './AppError.js'

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(403, 'FORBIDDEN', message)
  }
}
```

No other changes required — the existing error handler handles all `AppError` subclasses.
