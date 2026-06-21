# Soft Delete vs Hard Delete in Modern Web Applications

## Recommendation

Use **soft delete by default** and **hard delete selectively**.

| Data Type | Strategy |
|------------|------------|
| Users | Soft delete |
| Orders / Transactions | Soft delete |
| HR / Recruitment records | Soft delete |
| Audit logs | Archive instead of deleting |
| Temporary files | Hard delete |
| Cache / sessions | Hard delete |
| Drafts / ephemeral data | Hard delete |
| GDPR deletion requests | Hard delete or anonymize |

---

## Why Soft Delete?

### Recovery

```sql
UPDATE users
SET deleted_at = NOW()
WHERE id = 123;
```

Restore:

```sql
UPDATE users
SET deleted_at = NULL
WHERE id = 123;
```

### Auditability

Track:

- Who deleted the record
- When it was deleted
- Historical data

### Referential Integrity

Soft deletes preserve relationships and historical records.

### Better User Experience

Allows:

- Undo
- Restore
- Trash Bin functionality

---

## Common Schema

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP NULL,
    deleted_by UUID NULL
);
```

---

## Query Active Records

```sql
SELECT *
FROM users
WHERE deleted_at IS NULL;
```

---

## PostgreSQL Unique Index for Soft Deletes

```sql
CREATE UNIQUE INDEX users_email_unique
ON users(email)
WHERE deleted_at IS NULL;
```

---

## Recommended SaaS Pattern

1. Soft delete immediately
2. Keep audit information
3. Allow restore
4. Run scheduled cleanup jobs
5. Hard delete after 90–365 days

Example cleanup:

```sql
DELETE FROM users
WHERE deleted_at < NOW() - INTERVAL '90 days';
```

---

## HR / Recruitment Systems

Strongly recommended to use soft delete because of:

- Historical applications
- Compliance requirements
- Audit trails
- Candidate recovery

---

## Final Recommendation

For FastAPI + PostgreSQL + Vue applications:

- Use `deleted_at`
- Use `deleted_by`
- Filter active records with `deleted_at IS NULL`
- Use partial unique indexes
- Implement retention-based hard deletion

This hybrid approach provides safety, auditability, compliance, and long-term maintainability.
