// PoliceOS API — dokumenty użytkownika + system dostępu na zaproszenie (MariaDB).
//
// Przeglądarka wysyła token Discorda w nagłówku `x-discord-token`. API pyta
// Discorda, do kogo ten token należy, i dopiero wtedy działa na danych tego
// konta — nikt nie odczyta cudzych dokumentów ani nie podszyje się pod
// właściciela, podając cudze ID.
//
// Endpointy (POST, JSON { action, ... }):
//   /api/documents — list | save | remove            (wymaga dostępu)
//   /api/access    — check | redeem                  (każdy zalogowany)
//                    createInvite | myInvites | cancelInvite (wymaga dostępu)
//                    adminOverview | adminGrant | adminRevoke | adminCancelInvite (tylko właściciel)
//   /api/mdt       — kartoteka osób, pojazdów i wpisów (wymaga dostępu) — patrz mdt.js
//
// Użytkownik bazy potrzebuje SELECT / INSERT / DELETE oraz UPDATE na `mdt_persons` i `mdt_vehicles`.
//
// Konfiguracja przez zmienne środowiskowe (na serwerze: /etc/policeos-api.env):
//   DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, PORT, OWNER_DISCORD_ID

import http from 'node:http';
import crypto from 'node:crypto';
import mysql from 'mysql2/promise';
import { createMdtHandlers } from './mdt.js';

const PORT = Number(process.env.PORT ?? 3003);
const OWNER_DISCORD_ID = process.env.OWNER_DISCORD_ID ?? '';
const MAX_BODY_BYTES = 512 * 1024;
const MAX_DOCUMENTS_LISTED = 500;
const AUTH_CACHE_MS = 5 * 60 * 1000;
const MAX_INVITES_PER_USER = 5;
const REDEEM_WINDOW_MS = 10 * 60 * 1000;
const REDEEM_MAX_ATTEMPTS = 10;
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const pool = mysql.createPool({
  host: process.env.DB_HOST ?? '127.0.0.1',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME ?? 'policeos',
  connectionLimit: 5,
  charset: 'utf8mb4',
  dateStrings: true,
});

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// token → { discordId, username, expiresAt }; ogranicza zapytania do Discorda.
const authCache = new Map();

async function identityFromToken(token) {
  const cached = authCache.get(token);
  if (cached && cached.expiresAt > Date.now()) return cached;

  const res = await fetch('https://discord.com/api/users/@me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  const data = await res.json();
  if (typeof data.id !== 'string') return null;

  const identity = {
    discordId: data.id,
    username: String(data.global_name ?? data.username ?? '').slice(0, 100),
    expiresAt: Date.now() + AUTH_CACHE_MS,
  };
  if (authCache.size > 1000) authCache.clear();
  authCache.set(token, identity);
  return identity;
}

const isOwner = (discordId) => OWNER_DISCORD_ID !== '' && discordId === OWNER_DISCORD_ID;

async function isAuthorized(discordId) {
  if (isOwner(discordId)) return true;
  const [rows] = await pool.query('SELECT 1 FROM access WHERE discord_id = ? LIMIT 1', [discordId]);
  return rows.length > 0;
}

function str(v, max = 500) {
  return typeof v === 'string' ? v.slice(0, max) : '';
}

function normalizeCode(v) {
  return str(v, 16).trim().toUpperCase();
}

function randomCode() {
  const bytes = crypto.randomBytes(8);
  let code = '';
  for (const b of bytes) code += CODE_ALPHABET[b % CODE_ALPHABET.length];
  return code;
}

// Prosty limit prób aktywacji kodu (ochrona przed zgadywaniem).
const redeemAttempts = new Map();

function allowRedeemAttempt(discordId) {
  const now = Date.now();
  const recent = (redeemAttempts.get(discordId) ?? []).filter((t) => now - t < REDEEM_WINDOW_MS);
  if (recent.length >= REDEEM_MAX_ATTEMPTS) return false;
  recent.push(now);
  if (redeemAttempts.size > 5000) redeemAttempts.clear();
  redeemAttempts.set(discordId, recent);
  return true;
}

// ---------- Dokumenty ----------

function rowToDocument(row) {
  let values = {};
  try {
    values = JSON.parse(row.values);
  } catch {
    // uszkodzony wpis — zwracamy dokument bez pól
  }
  return {
    id: row.id,
    generatorId: row.generator_id,
    generatorTitle: row.generator_title,
    generatorIcon: row.generator_icon,
    docNumber: row.doc_number,
    date: row.date,
    unit: row.unit,
    values,
    savedAt: Number(row.saved_at),
  };
}

async function handleDocuments({ discordId }, body) {
  if (!(await isAuthorized(discordId))) throw new HttpError(403, 'Brak dostępu do panelu.');

  switch (body.action) {
    case 'list': {
      const [rows] = await pool.query(
        'SELECT * FROM documents WHERE discord_id = ? ORDER BY saved_at DESC LIMIT ?',
        [discordId, MAX_DOCUMENTS_LISTED]
      );
      return { documents: rows.map(rowToDocument) };
    }

    case 'save': {
      const doc = body.document;
      const id = str(doc?.id, 100);
      if (!doc || !id || !str(doc.generatorId) || !str(doc.docNumber)) {
        throw new HttpError(400, 'Niekompletny dokument.');
      }
      const values = doc.values && typeof doc.values === 'object' ? doc.values : {};
      const savedAt = typeof doc.savedAt === 'number' ? Math.floor(doc.savedAt) : Date.now();
      // INSERT IGNORE: dokument o tym ID już istnieje → nic nie nadpisujemy
      // (zapobiega przejęciu cudzego wiersza przez podanie jego ID).
      await pool.query(
        `INSERT IGNORE INTO documents
          (id, discord_id, generator_id, generator_title, generator_icon, doc_number, date, unit, \`values\`, saved_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          discordId,
          str(doc.generatorId, 100),
          str(doc.generatorTitle),
          str(doc.generatorIcon, 100),
          str(doc.docNumber, 100),
          str(doc.date, 50),
          str(doc.unit),
          JSON.stringify(values),
          savedAt,
        ]
      );
      return { ok: true };
    }

    case 'remove': {
      const id = str(body.id, 100);
      if (!id) throw new HttpError(400, 'Brak ID dokumentu.');
      await pool.query('DELETE FROM documents WHERE id = ? AND discord_id = ?', [id, discordId]);
      return { ok: true };
    }

    default:
      throw new HttpError(400, 'Nieznana akcja.');
  }
}

// ---------- Dostęp i zaproszenia ----------

async function handleAccess({ discordId, username }, body) {
  const owner = isOwner(discordId);

  switch (body.action) {
    case 'check':
      return { authorized: await isAuthorized(discordId), owner };

    case 'redeem': {
      if (await isAuthorized(discordId)) return { ok: true };
      if (!allowRedeemAttempt(discordId)) {
        throw new HttpError(429, 'Zbyt wiele prób — spróbuj ponownie za kilka minut.');
      }
      const code = normalizeCode(body.code);
      const [invites] = await pool.query('SELECT created_by FROM invites WHERE code = ?', [code]);
      if (!code || invites.length === 0) {
        throw new HttpError(400, 'Kod jest nieprawidłowy albo został już wykorzystany.');
      }
      try {
        await pool.query(
          'INSERT INTO access (discord_id, username, invited_by, invite_code) VALUES (?, ?, ?, ?)',
          [discordId, username || null, invites[0].created_by, code]
        );
      } catch (err) {
        if (err?.code === 'ER_DUP_ENTRY') {
          throw new HttpError(400, 'Kod jest nieprawidłowy albo został już wykorzystany.');
        }
        throw err;
      }
      return { ok: true };
    }

    case 'createInvite': {
      if (!(await isAuthorized(discordId))) throw new HttpError(403, 'Brak dostępu do panelu.');
      if (!owner) {
        const [[{ n }]] = await pool.query('SELECT COUNT(*) AS n FROM invites WHERE created_by = ?', [discordId]);
        if (Number(n) >= MAX_INVITES_PER_USER) {
          throw new HttpError(400, `Osiągnięto limit ${MAX_INVITES_PER_USER} zaproszeń.`);
        }
      }
      for (let attempt = 0; attempt < 5; attempt++) {
        const code = randomCode();
        try {
          await pool.query('INSERT INTO invites (code, created_by) VALUES (?, ?)', [code, discordId]);
          return { code };
        } catch (err) {
          if (err?.code !== 'ER_DUP_ENTRY') throw err;
        }
      }
      throw new HttpError(500, 'Nie udało się wygenerować kodu.');
    }

    case 'myInvites': {
      if (!(await isAuthorized(discordId))) throw new HttpError(403, 'Brak dostępu do panelu.');
      const [rows] = await pool.query(
        `SELECT i.code, i.created_at, a.discord_id AS used_by, a.username AS used_by_username, a.created_at AS used_at
           FROM invites i LEFT JOIN access a ON a.invite_code = i.code
          WHERE i.created_by = ? ORDER BY i.created_at DESC`,
        [discordId]
      );
      return {
        invites: rows.map((r) => ({
          code: r.code,
          createdAt: r.created_at,
          usedBy: r.used_by ?? null,
          usedByUsername: r.used_by_username ?? null,
          usedAt: r.used_at ?? null,
        })),
      };
    }

    case 'cancelInvite': {
      if (!(await isAuthorized(discordId))) throw new HttpError(403, 'Brak dostępu do panelu.');
      const code = normalizeCode(body.code);
      const [result] = await pool.query(
        `DELETE FROM invites WHERE code = ? AND created_by = ?
           AND NOT EXISTS (SELECT 1 FROM access WHERE invite_code = ?)`,
        [code, discordId, code]
      );
      if (result.affectedRows === 0) throw new HttpError(400, 'Nie można anulować tego kodu.');
      return { ok: true };
    }

    case 'adminOverview': {
      if (!owner) throw new HttpError(403, 'Tylko dla właściciela.');
      const [access] = await pool.query(
        'SELECT discord_id, username, invited_by, created_at FROM access ORDER BY created_at DESC'
      );
      const [invites] = await pool.query(
        `SELECT i.code, i.created_by, i.created_at, a.discord_id AS used_by, a.username AS used_by_username, a.created_at AS used_at
           FROM invites i LEFT JOIN access a ON a.invite_code = i.code
          ORDER BY i.created_at DESC`
      );
      return {
        access: access.map((r) => ({
          discordId: r.discord_id,
          username: r.username ?? null,
          invitedBy: r.invited_by ?? null,
          createdAt: r.created_at,
        })),
        invites: invites.map((r) => ({
          code: r.code,
          createdBy: r.created_by,
          usedBy: r.used_by ?? null,
          usedByUsername: r.used_by_username ?? null,
          createdAt: r.created_at,
          usedAt: r.used_at ?? null,
        })),
      };
    }

    case 'adminGrant': {
      if (!owner) throw new HttpError(403, 'Tylko dla właściciela.');
      const target = str(body.discordId, 32).trim();
      if (!/^\d{5,32}$/.test(target)) throw new HttpError(400, 'Nieprawidłowe ID Discorda.');
      await pool.query(
        'INSERT IGNORE INTO access (discord_id, username, invited_by) VALUES (?, ?, ?)',
        [target, str(body.username, 100).trim() || null, 'owner']
      );
      return { ok: true };
    }

    case 'adminRevoke': {
      if (!owner) throw new HttpError(403, 'Tylko dla właściciela.');
      const target = str(body.discordId, 32);
      const [rows] = await pool.query('SELECT invite_code FROM access WHERE discord_id = ?', [target]);
      await pool.query('DELETE FROM access WHERE discord_id = ?', [target]);
      // Kod, którym ta osoba weszła, znika razem z dostępem — inaczej wróciłby do puli „aktywnych”.
      if (rows[0]?.invite_code) await pool.query('DELETE FROM invites WHERE code = ?', [rows[0].invite_code]);
      return { ok: true };
    }

    case 'adminCancelInvite': {
      if (!owner) throw new HttpError(403, 'Tylko dla właściciela.');
      const code = normalizeCode(body.code);
      await pool.query(
        'DELETE FROM invites WHERE code = ? AND NOT EXISTS (SELECT 1 FROM access WHERE invite_code = ?)',
        [code, code]
      );
      return { ok: true };
    }

    default:
      throw new HttpError(400, 'Nieznana akcja.');
  }
}

// ---------- HTTP ----------

const { handleMdt } = createMdtHandlers({ pool, HttpError, isAuthorized, isOwner, str });

const ROUTES = {
  '/api/documents': handleDocuments,
  '/api/access': handleAccess,
  '/api/mdt': handleMdt,
};

// Bez tokenu Discorda — handler dostaje adres IP (do limitu prób) zamiast tożsamości.
const PUBLIC_ROUTES = {};

function send(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error('too_large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const publicHandler = PUBLIC_ROUTES[req.url ?? ''];
  const handler = ROUTES[req.url ?? ''];
  if (!handler && !publicHandler) return send(res, 404, { error: 'Nie znaleziono.' });
  if (req.method !== 'POST') return send(res, 405, { error: 'Metoda niedozwolona.' });

  try {
    const token = req.headers['x-discord-token'];
    if (!publicHandler && (typeof token !== 'string' || !token)) {
      return send(res, 401, { error: 'Brak tokenu Discord — zaloguj się ponownie.' });
    }

    let body;
    try {
      body = JSON.parse(await readBody(req));
    } catch (err) {
      if (err instanceof Error && err.message === 'too_large') {
        return send(res, 413, { error: 'Dokument jest za duży.' });
      }
      return send(res, 400, { error: 'Nieprawidłowe dane.' });
    }
    if (!body || typeof body !== 'object') return send(res, 400, { error: 'Nieprawidłowe dane.' });

    if (publicHandler) {
      // nginx ustawia X-Real-IP; API słucha tylko na 127.0.0.1, więc nagłówka nie da się podrobić z zewnątrz.
      const ip = String(req.headers['x-real-ip'] ?? req.socket.remoteAddress ?? '');
      return send(res, 200, await publicHandler(ip, body));
    }

    const identity = await identityFromToken(token);
    if (!identity) return send(res, 401, { error: 'Sesja Discord wygasła — zaloguj się ponownie.' });

    send(res, 200, await handler(identity, body));
  } catch (err) {
    if (err instanceof HttpError) return send(res, err.status, { error: err.message });
    console.error(err);
    send(res, 500, { error: 'Błąd serwera.' });
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`PoliceOS API nasłuchuje na 127.0.0.1:${PORT}`);
});
