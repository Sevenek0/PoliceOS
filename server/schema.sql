-- PoliceOS — schemat bazy (MariaDB). Uruchamiany przy każdym wdrożeniu,
-- więc wszystkie polecenia muszą być idempotentne (IF NOT EXISTS).

-- Zapisane dokumenty użytkowników ("Moje dokumenty"), przypisane do konta Discord.
CREATE TABLE IF NOT EXISTS documents (
  id              VARCHAR(100) NOT NULL PRIMARY KEY,
  discord_id      VARCHAR(32)  NOT NULL,
  generator_id    VARCHAR(100) NOT NULL,
  generator_title VARCHAR(500) NOT NULL,
  generator_icon  VARCHAR(100) NOT NULL DEFAULT '',
  doc_number      VARCHAR(100) NOT NULL,
  date            VARCHAR(50)  NOT NULL DEFAULT '',
  unit            VARCHAR(500) NOT NULL DEFAULT '',
  `values`        LONGTEXT     NOT NULL,
  saved_at        BIGINT       NOT NULL,
  INDEX idx_documents_owner (discord_id, saved_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Kody zaproszeń. Kod jest „wykorzystany”, gdy istnieje wiersz w `access` z tym invite_code.
CREATE TABLE IF NOT EXISTS invites (
  code        VARCHAR(16) NOT NULL PRIMARY KEY,
  created_by  VARCHAR(32) NOT NULL,
  created_at  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_invites_creator (created_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Kto ma dostęp do panelu (właściciel ma go zawsze, bez wiersza tutaj).
-- UNIQUE na invite_code gwarantuje, że jednego kodu nie da się użyć dwa razy.
CREATE TABLE IF NOT EXISTS access (
  discord_id   VARCHAR(32)  NOT NULL PRIMARY KEY,
  username     VARCHAR(100) NULL,
  invited_by   VARCHAR(32)  NULL,
  invite_code  VARCHAR(16)  NULL,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_access_invite (invite_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
