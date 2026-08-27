BEGIN;

CREATE TABLE users (
  id uuid CONSTRAINT users_id_not_null NOT NULL,
  username text CONSTRAINT users_username_not_null NOT NULL,
  display_name text CONSTRAINT users_display_name_not_null NOT NULL,
  auth_key_hash text CONSTRAINT users_auth_key_hash_not_null NOT NULL,
  key_schedule_version smallint CONSTRAINT users_key_schedule_version_not_null NOT NULL,
  salt text CONSTRAINT users_salt_not_null NOT NULL,
  entry_count integer DEFAULT 0 CONSTRAINT users_entry_count_not_null NOT NULL,
  encrypted_bytes bigint DEFAULT 0 CONSTRAINT users_encrypted_bytes_not_null NOT NULL,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP CONSTRAINT users_created_at_not_null NOT NULL,
  CONSTRAINT users_pkey PRIMARY KEY (id),
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

CREATE TABLE sessions (
  session_hash text CONSTRAINT sessions_session_hash_not_null NOT NULL,
  user_id uuid CONSTRAINT sessions_user_id_not_null NOT NULL,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP CONSTRAINT sessions_created_at_not_null NOT NULL,
  expires_at timestamptz CONSTRAINT sessions_expires_at_not_null NOT NULL,
  CONSTRAINT sessions_pkey PRIMARY KEY (session_hash),
  CONSTRAINT sessions_user_id_foreign_key
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE RESTRICT,
  CONSTRAINT sessions_hash_valid CHECK (
    char_length(session_hash) = 64
    AND session_hash ~ '^[0-9a-f]{64}$'
  ),
  CONSTRAINT sessions_expiration_valid CHECK (expires_at > created_at)
);

CREATE INDEX sessions_expiration_index ON sessions (expires_at);
CREATE INDEX sessions_user_id_index ON sessions (user_id);

CREATE TABLE journal_entries (
  user_id uuid CONSTRAINT journal_entries_user_id_not_null NOT NULL,
  id uuid CONSTRAINT journal_entries_id_not_null NOT NULL,
  encryption_version smallint CONSTRAINT journal_entries_encryption_version_not_null NOT NULL,
  wrapped_key_base64 text CONSTRAINT journal_entries_wrapped_key_base64_not_null NOT NULL,
  ciphertext_base64 text CONSTRAINT journal_entries_ciphertext_base64_not_null NOT NULL,
  iv_base64 text CONSTRAINT journal_entries_iv_base64_not_null NOT NULL,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP CONSTRAINT journal_entries_created_at_not_null NOT NULL,
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP CONSTRAINT journal_entries_updated_at_not_null NOT NULL,
  storage_bytes integer GENERATED ALWAYS AS (
    octet_length(wrapped_key_base64)
    + octet_length(ciphertext_base64)
    + octet_length(iv_base64)
  ) STORED,
  CONSTRAINT journal_entries_pkey PRIMARY KEY (user_id, id),
  CONSTRAINT journal_entries_user_id_foreign_key
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE RESTRICT,
  CONSTRAINT journal_entries_encryption_version_supported CHECK (encryption_version = 1),
  CONSTRAINT journal_entries_wrapped_key_valid CHECK (
    char_length(wrapped_key_base64) = 56
    AND wrapped_key_base64 ~ '^[A-Za-z0-9+/]{54}==$'
  ),
  CONSTRAINT journal_entries_ciphertext_valid CHECK (
    char_length(ciphertext_base64) BETWEEN 24 AND 4194328
    AND char_length(ciphertext_base64) % 4 = 0
    AND ciphertext_base64 ~ '^[A-Za-z0-9+/]+={0,2}$'
  ),
  CONSTRAINT journal_entries_iv_valid CHECK (
    char_length(iv_base64) = 16
    AND iv_base64 ~ '^[A-Za-z0-9+/]{16}$'
  ),
  CONSTRAINT journal_entries_timestamps_valid CHECK (updated_at >= created_at)
);

CREATE INDEX journal_entries_pagination_index
  ON journal_entries (user_id, updated_at DESC, id DESC);

CREATE FUNCTION maintain_journal_account_usage()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  maximum_entries CONSTANT integer := 500;
  maximum_encrypted_bytes CONSTANT bigint := 67108864;
  byte_delta bigint;
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE users
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

    UPDATE users
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
    UPDATE users
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
AFTER INSERT OR UPDATE OR DELETE ON journal_entries
FOR EACH ROW
EXECUTE FUNCTION maintain_journal_account_usage();

GRANT USAGE ON SCHEMA public TO blind_journal_app;
GRANT SELECT, DELETE ON users TO blind_journal_app;
GRANT INSERT (
  id,
  username,
  display_name,
  auth_key_hash,
  key_schedule_version,
  salt
) ON users TO blind_journal_app;
GRANT UPDATE (entry_count, encrypted_bytes) ON users TO blind_journal_app;

GRANT SELECT, DELETE ON sessions TO blind_journal_app;
GRANT INSERT (session_hash, user_id, created_at, expires_at)
  ON sessions TO blind_journal_app;

GRANT SELECT, DELETE ON journal_entries TO blind_journal_app;
GRANT INSERT (
  user_id,
  id,
  encryption_version,
  wrapped_key_base64,
  ciphertext_base64,
  iv_base64,
  created_at,
  updated_at
) ON journal_entries TO blind_journal_app;
GRANT UPDATE (
  encryption_version,
  wrapped_key_base64,
  ciphertext_base64,
  iv_base64,
  updated_at
) ON journal_entries TO blind_journal_app;

COMMIT;
