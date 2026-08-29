# Neon database record

> **Documentation only:** This file records how the hosted PostgreSQL database was configured
> manually in the Neon Console. The application does not import, parse, or execute this document.
> It is not a migration, bootstrap script, deployment step, or promise that the live database will
> be modified automatically when this file changes. The live Neon databases remain the source of
> truth.

## Hosted environments

The Neon project has two branches:

- `production` is the parent branch used only by the deployed production application.
- `dev-database-persistence` is a disposable child branch used by local development and the live
  database integration test.

The development branch was reset from `production` after the production database was hardened.
The branches therefore began with the same schema and privileges, while subsequent data and manual
changes remain isolated. The `blind_journal_app` password was rotated independently on both
branches after the reset.

Application and test traffic uses a pooled Neon connection as `blind_journal_app`. Administrative
SQL was run manually in the Neon SQL Editor as `neondb_owner`. Owner credentials are not used by
the application or stored in Vercel.

## Application role

The restricted application role was originally created manually with a password in the SQL
statement. That password was later rotated from the Neon **Roles** page because the original value
remained visible in SQL Editor history.

No password is recorded here. If the role ever has to be recreated in a new project, the safer
manual sequence is to create it without a password and then use **Postgres database > Roles >
blind_journal_app > Reset password** to generate one:

```sql
CREATE ROLE blind_journal_app
WITH
  LOGIN
  NOSUPERUSER
  NOCREATEDB
  NOCREATEROLE
  NOREPLICATION;
```

The application role was intentionally created through SQL rather than Neon's **Add role** action
so it would not receive Neon's elevated `neon_superuser` membership.

## Tables and indexes

The following objects were created manually in the `public` schema. This is a normalized record of
the final table design rather than an executable repository-managed schema.

```sql
CREATE TABLE public.users (
  id uuid PRIMARY KEY,
  username text NOT NULL,
  display_name text NOT NULL,
  auth_key_hash text NOT NULL,
  key_schedule_version smallint NOT NULL,
  salt text NOT NULL,
  entry_count integer NOT NULL DEFAULT 0,
  encrypted_bytes bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT users_username_unique UNIQUE (username),
  CONSTRAINT users_username_valid CHECK (
    username = lower(btrim(username))
    AND char_length(username) BETWEEN 1 AND 64
    AND username ~ '^[a-z0-9._-]+$'
  ),
  CONSTRAINT users_display_name_valid CHECK (
    char_length(display_name) BETWEEN 1 AND 64
    AND display_name ~ '^[A-Za-z0-9._-]+$'
  ),
  CONSTRAINT users_auth_key_hash_valid CHECK (
    char_length(auth_key_hash) = 44
    AND auth_key_hash ~ '^[A-Za-z0-9+/]{43}=$'
  ),
  CONSTRAINT users_key_schedule_supported CHECK (key_schedule_version = 1),
  CONSTRAINT users_salt_valid CHECK (
    char_length(salt) = 24
    AND salt ~ '^[A-Za-z0-9+/]{22}==$'
  ),
  CONSTRAINT users_entry_count_valid CHECK (entry_count BETWEEN 0 AND 500),
  CONSTRAINT users_encrypted_bytes_valid CHECK (
    encrypted_bytes BETWEEN 0 AND 67108864
  )
);

CREATE TABLE public.sessions (
  session_hash text PRIMARY KEY,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at timestamptz NOT NULL,

  CONSTRAINT sessions_user_id_foreign_key
    FOREIGN KEY (user_id)
    REFERENCES public.users (id)
    ON DELETE RESTRICT,
  CONSTRAINT sessions_hash_valid CHECK (
    char_length(session_hash) = 64
    AND session_hash ~ '^[0-9a-f]{64}$'
  ),
  CONSTRAINT sessions_expiration_valid CHECK (expires_at > created_at)
);

CREATE INDEX sessions_user_id_index ON public.sessions (user_id);
CREATE INDEX sessions_expiration_index ON public.sessions (expires_at);

CREATE TABLE public.journal_entries (
  user_id uuid NOT NULL,
  id uuid NOT NULL,
  encryption_version smallint NOT NULL,
  wrapped_key_base64 text NOT NULL,
  ciphertext_base64 text NOT NULL,
  iv_base64 text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  storage_bytes integer GENERATED ALWAYS AS (
    octet_length(wrapped_key_base64)
    + octet_length(ciphertext_base64)
    + octet_length(iv_base64)
  ) STORED,

  PRIMARY KEY (user_id, id),
  CONSTRAINT journal_entries_user_id_foreign_key
    FOREIGN KEY (user_id)
    REFERENCES public.users (id)
    ON DELETE RESTRICT,
  CONSTRAINT journal_entries_encryption_version_supported CHECK (encryption_version = 1),
  CONSTRAINT journal_entries_wrapped_key_valid CHECK (
    char_length(wrapped_key_base64) = 56
    AND wrapped_key_base64 ~ '^[A-Za-z0-9+/]{54}==$'
  ),
  CONSTRAINT journal_entries_iv_valid CHECK (
    char_length(iv_base64) = 16
    AND iv_base64 ~ '^[A-Za-z0-9+/]{16}$'
  ),
  CONSTRAINT journal_entries_ciphertext_valid CHECK (
    char_length(ciphertext_base64) BETWEEN 24 AND 4194328
    AND char_length(ciphertext_base64) % 4 = 0
    AND ciphertext_base64 ~ '^[A-Za-z0-9+/]+={0,2}$'
  ),
  CONSTRAINT journal_entries_timestamps_valid CHECK (updated_at >= created_at)
);

CREATE INDEX journal_entries_pagination_index
  ON public.journal_entries (user_id, updated_at DESC, id DESC);
```

## Quota trigger

The original trigger function ran with the caller's privileges and required the application role
to update the account counters directly. It was later replaced manually with the hardened final
definition below. The final function runs as its owner, uses a fixed safe search path, and fully
qualifies the table it updates.

```sql
CREATE OR REPLACE FUNCTION public.maintain_journal_account_usage()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $$
DECLARE
  maximum_entries CONSTANT integer := 500;
  maximum_encrypted_bytes CONSTANT bigint := 67108864;
  byte_delta bigint;
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.users
    SET
      entry_count = entry_count + 1,
      encrypted_bytes = encrypted_bytes + NEW.storage_bytes
    WHERE id = NEW.user_id
      AND entry_count + 1 <= maximum_entries
      AND encrypted_bytes + NEW.storage_bytes <= maximum_encrypted_bytes;

    IF NOT FOUND THEN
      RAISE EXCEPTION USING
        ERRCODE = '23514',
        MESSAGE = 'Journal account quota exceeded',
        CONSTRAINT = 'journal_entries_account_quota';
    END IF;

    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF NEW.user_id <> OLD.user_id OR NEW.id <> OLD.id THEN
      RAISE EXCEPTION USING
        ERRCODE = '23514',
        MESSAGE = 'Journal entry ownership is immutable',
        CONSTRAINT = 'journal_entries_identity_immutable';
    END IF;

    byte_delta := NEW.storage_bytes - OLD.storage_bytes;

    UPDATE public.users
    SET encrypted_bytes = encrypted_bytes + byte_delta
    WHERE id = NEW.user_id
      AND encrypted_bytes + byte_delta BETWEEN 0 AND maximum_encrypted_bytes;

    IF NOT FOUND THEN
      RAISE EXCEPTION USING
        ERRCODE = '23514',
        MESSAGE = 'Journal account quota exceeded',
        CONSTRAINT = 'journal_entries_account_quota';
    END IF;

    RETURN NEW;
  END IF;

  IF TG_OP = 'DELETE' THEN
    UPDATE public.users
    SET
      entry_count = entry_count - 1,
      encrypted_bytes = encrypted_bytes - OLD.storage_bytes
    WHERE id = OLD.user_id;

    RETURN OLD;
  END IF;

  RAISE EXCEPTION 'Unsupported trigger operation: %', TG_OP;
END;
$$;

CREATE TRIGGER journal_entries_usage_trigger
AFTER INSERT OR UPDATE OR DELETE
ON public.journal_entries
FOR EACH ROW
EXECUTE FUNCTION public.maintain_journal_account_usage();
```

## Final privileges

The schema and object privileges were reconciled manually so the runtime role can perform the
application's work but cannot create schema objects, write generated values, change ownership, or
modify quota counters directly.

```sql
REVOKE CREATE ON SCHEMA public FROM PUBLIC;

GRANT CONNECT ON DATABASE neondb TO blind_journal_app;
GRANT USAGE ON SCHEMA public TO blind_journal_app;

REVOKE ALL ON FUNCTION public.maintain_journal_account_usage() FROM PUBLIC;
GRANT EXECUTE
  ON FUNCTION public.maintain_journal_account_usage()
  TO blind_journal_app;

GRANT SELECT, DELETE ON public.users TO blind_journal_app;
GRANT INSERT (
  id,
  username,
  display_name,
  auth_key_hash,
  key_schedule_version,
  salt
) ON public.users TO blind_journal_app;

GRANT SELECT, DELETE ON public.sessions TO blind_journal_app;
GRANT INSERT (session_hash, user_id, created_at, expires_at)
  ON public.sessions TO blind_journal_app;

GRANT SELECT, DELETE ON public.journal_entries TO blind_journal_app;
GRANT INSERT (
  user_id,
  id,
  encryption_version,
  wrapped_key_base64,
  ciphertext_base64,
  iv_base64,
  created_at,
  updated_at
) ON public.journal_entries TO blind_journal_app;
GRANT UPDATE (
  encryption_version,
  wrapped_key_base64,
  ciphertext_base64,
  iv_base64,
  updated_at
) ON public.journal_entries TO blind_journal_app;
```

The application role has schema `USAGE` but not schema `CREATE`. Its table-wide grants are
`SELECT` and `DELETE`; `INSERT` and `UPDATE` are limited to the listed columns. The trigger function
is owned by `neondb_owner`, uses `SECURITY DEFINER`, and has
`search_path=pg_catalog, pg_temp`.

## Ongoing manual ownership

There is deliberately no migration runner or database infrastructure-as-code layer in this
repository. Future database changes, if any, are the maintainer's responsibility and must be made
intentionally in the Neon Console. The practical sequence is:

1. Make the change on `dev-database-persistence` as `neondb_owner`.
2. Run `pnpm test:database` with `DATABASE_TEST_URL` pointing to that development branch.
3. Review the exact SQL and its effect.
4. Apply the same change to `production` as `neondb_owner`.
5. Update this document so it continues to describe the final live state.

This is an operational convention for a single-maintainer personal project, not an automated
database-management contract.
