-- Sahlio MVP — SQLite schema (simplified from the PostgreSQL design for easy self-hosting)

CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  phone         TEXT UNIQUE NOT NULL,
  full_name     TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'client', -- client | provider | admin
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS providers (
  id                TEXT PRIMARY KEY,
  user_id           TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  bio               TEXT,
  is_pro_subscriber INTEGER NOT NULL DEFAULT 0,
  rating_avg        REAL NOT NULL DEFAULT 0,
  rating_count      INTEGER NOT NULL DEFAULT 0,
  base_lat          REAL,
  base_lng          REAL,
  travel_radius_km  INTEGER NOT NULL DEFAULT 10,
  created_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS services (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name_ar     TEXT NOT NULL,
  name_fr     TEXT NOT NULL,
  icon        TEXT
);

CREATE TABLE IF NOT EXISTS provider_services (
  provider_id  TEXT NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  service_id   INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  price_hint   REAL,
  PRIMARY KEY (provider_id, service_id)
);

CREATE TABLE IF NOT EXISTS service_requests (
  id              TEXT PRIMARY KEY,
  client_id       TEXT NOT NULL REFERENCES users(id),
  service_id      INTEGER NOT NULL REFERENCES services(id),
  description     TEXT NOT NULL,
  request_lat     REAL NOT NULL,
  request_lng     REAL NOT NULL,
  address_label   TEXT,
  status          TEXT NOT NULL DEFAULT 'pending', -- pending | matched | in_progress | completed | cancelled
  chosen_offer_id TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS offers (
  id           TEXT PRIMARY KEY,
  request_id   TEXT NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
  provider_id  TEXT NOT NULL REFERENCES providers(id),
  price        REAL NOT NULL,
  eta_label    TEXT NOT NULL,
  message      TEXT,
  status       TEXT NOT NULL DEFAULT 'sent', -- sent | accepted | declined
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (request_id, provider_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id          TEXT PRIMARY KEY,
  request_id  TEXT NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
  sender_id   TEXT NOT NULL REFERENCES users(id),
  body        TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS reviews (
  id          TEXT PRIMARY KEY,
  request_id  TEXT NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
  author_id   TEXT NOT NULL REFERENCES users(id),
  target_id   TEXT NOT NULL REFERENCES users(id),
  rating      INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (request_id, author_id)
);

CREATE INDEX IF NOT EXISTS idx_requests_status ON service_requests(status);
CREATE INDEX IF NOT EXISTS idx_offers_request ON offers(request_id);
