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

-- ---------- Kartoteka MDT (wspólna dla wszystkich z dostępem) ----------

CREATE TABLE IF NOT EXISTS mdt_persons (
  id             VARCHAR(16)  NOT NULL PRIMARY KEY,
  name           VARCHAR(150) NOT NULL,
  dob            VARCHAR(20)  NOT NULL DEFAULT '',
  ssn            VARCHAR(50)  NOT NULL DEFAULT '',
  phone          VARCHAR(50)  NOT NULL DEFAULT '',
  address        VARCHAR(200) NOT NULL DEFAULT '',
  description    TEXT         NOT NULL,
  licenses       VARCHAR(200) NOT NULL DEFAULT '',
  wanted         TINYINT(1)   NOT NULL DEFAULT 0,
  wanted_reason  VARCHAR(300) NOT NULL DEFAULT '',
  created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME     NULL,
  updated_by     VARCHAR(100) NULL,
  INDEX idx_persons_name (name),
  INDEX idx_persons_ssn (ssn),
  INDEX idx_persons_wanted (wanted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS mdt_vehicles (
  id          VARCHAR(16)  NOT NULL PRIMARY KEY,
  plate       VARCHAR(20)  NOT NULL,
  model       VARCHAR(100) NOT NULL DEFAULT '',
  color       VARCHAR(50)  NOT NULL DEFAULT '',
  owner_id    VARCHAR(16)  NULL,
  stolen      TINYINT(1)   NOT NULL DEFAULT 0,
  notes       TEXT         NOT NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     NULL,
  updated_by  VARCHAR(100) NULL,
  INDEX idx_vehicles_plate (plate),
  INDEX idx_vehicles_owner (owner_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Historia osoby: notatki, mandaty, zatrzymania, poszukiwania.
CREATE TABLE IF NOT EXISTS mdt_records (
  id           VARCHAR(16)  NOT NULL PRIMARY KEY,
  person_id    VARCHAR(16)  NOT NULL,
  kind         VARCHAR(20)  NOT NULL,
  title        VARCHAR(200) NOT NULL,
  content      TEXT         NOT NULL,
  fine         INT          NOT NULL DEFAULT 0,
  jail_months  INT          NOT NULL DEFAULT 0,
  doc_number   VARCHAR(100) NOT NULL DEFAULT '',
  author       VARCHAR(100) NOT NULL,
  author_id    VARCHAR(32)  NOT NULL,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_records_person (person_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
