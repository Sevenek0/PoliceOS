// Kartoteka MDT — osoby, pojazdy i wpisy (notatki, mandaty, zatrzymania).
// Kartoteka jest wspólna: każdy z dostępem do panelu widzi i edytuje te same dane.
// Wpis może usunąć tylko jego autor albo właściciel panelu.
//
// POST /api/mdt, JSON { action, ... }:
//   search { query }                    — osoby, pojazdy i lista poszukiwanych
//   getPerson { id }                    — osoba + wpisy + pojazdy
//   savePerson { person }               — bez `id` tworzy nową osobę
//   deletePerson { id }                 — usuwa osobę i jej wpisy, pojazdy zostają bez właściciela
//   getVehicle { id } / saveVehicle { vehicle } / deleteVehicle { id }
//   addRecord { personId, record } / deleteRecord { id }

import crypto from 'node:crypto';

const MAX_RESULTS = 50;
const RECORD_KINDS = ['notatka', 'mandat', 'zatrzymanie', 'poszukiwanie', 'inne'];

const newId = () => crypto.randomBytes(8).toString('hex');

function personFromRow(r) {
  return {
    id: r.id, name: r.name, dob: r.dob, ssn: r.ssn, phone: r.phone, address: r.address,
    description: r.description, licenses: r.licenses, wanted: Boolean(r.wanted), wantedReason: r.wanted_reason,
    createdAt: r.created_at, updatedAt: r.updated_at, updatedBy: r.updated_by,
  };
}

function vehicleFromRow(r) {
  return {
    id: r.id, plate: r.plate, model: r.model, color: r.color, ownerId: r.owner_id, ownerName: r.owner_name ?? '',
    stolen: Boolean(r.stolen), notes: r.notes, createdAt: r.created_at, updatedAt: r.updated_at, updatedBy: r.updated_by,
  };
}

function recordFromRow(r) {
  return {
    id: r.id, personId: r.person_id, kind: r.kind, title: r.title, content: r.content,
    fine: Number(r.fine), jailMonths: Number(r.jail_months), docNumber: r.doc_number,
    author: r.author, authorId: r.author_id, createdAt: r.created_at,
  };
}

const VEHICLE_SELECT = `SELECT v.*, p.name AS owner_name FROM mdt_vehicles v LEFT JOIN mdt_persons p ON p.id = v.owner_id`;

export function createMdtHandlers({ pool, HttpError, isAuthorized, isOwner, str }) {
  const int = (v, max) => Math.min(max, Math.max(0, Math.floor(Number(v) || 0)));
  const flag = (v) => (v ? 1 : 0);

  async function requirePerson(id) {
    const [rows] = await pool.query('SELECT * FROM mdt_persons WHERE id = ?', [id]);
    if (rows.length === 0) throw new HttpError(404, 'Nie ma takiej osoby w kartotece.');
    return rows[0];
  }

  async function personInput(p) {
    const name = str(p?.name, 150).trim();
    if (name.length < 2) throw new HttpError(400, 'Podaj imię i nazwisko.');
    return [
      name, str(p.dob, 20), str(p.ssn, 50).trim(), str(p.phone, 50), str(p.address, 200),
      str(p.description, 2000), str(p.licenses, 200), flag(p.wanted), p.wanted ? str(p.wantedReason, 300) : '',
    ];
  }

  async function vehicleInput(v) {
    const plate = str(v?.plate, 20).trim().toUpperCase();
    if (plate.length < 2) throw new HttpError(400, 'Podaj numer rejestracyjny.');
    const ownerId = str(v.ownerId, 16) || null;
    if (ownerId) await requirePerson(ownerId);
    return [plate, str(v.model, 100), str(v.color, 50), ownerId, flag(v.stolen), str(v.notes, 2000)];
  }

  async function handleMdt({ discordId, username }, body) {
    if (!(await isAuthorized(discordId))) throw new HttpError(403, 'Brak dostępu do panelu.');
    const author = username || discordId;

    switch (body.action) {
      case 'search': {
        const q = str(body.query, 100).trim();
        const like = `%${q}%`;
        const [persons] = q
          ? await pool.query(
            'SELECT * FROM mdt_persons WHERE name LIKE ? OR ssn LIKE ? OR phone LIKE ? ORDER BY name LIMIT ?',
            [like, like, like, MAX_RESULTS])
          : await pool.query('SELECT * FROM mdt_persons ORDER BY COALESCE(updated_at, created_at) DESC LIMIT ?', [MAX_RESULTS]);
        const [vehicles] = q
          ? await pool.query(`${VEHICLE_SELECT} WHERE v.plate LIKE ? OR v.model LIKE ? OR p.name LIKE ? ORDER BY v.plate LIMIT ?`,
            [like, like, like, MAX_RESULTS])
          : await pool.query(`${VEHICLE_SELECT} ORDER BY COALESCE(v.updated_at, v.created_at) DESC LIMIT ?`, [MAX_RESULTS]);
        const [wanted] = await pool.query('SELECT * FROM mdt_persons WHERE wanted = 1 ORDER BY name LIMIT ?', [MAX_RESULTS]);
        const [stolen] = await pool.query(`${VEHICLE_SELECT} WHERE v.stolen = 1 ORDER BY v.plate LIMIT ?`, [MAX_RESULTS]);
        return {
          persons: persons.map(personFromRow),
          vehicles: vehicles.map(vehicleFromRow),
          wanted: wanted.map(personFromRow),
          stolen: stolen.map(vehicleFromRow),
        };
      }

      case 'getPerson': {
        const person = await requirePerson(str(body.id, 16));
        const [records] = await pool.query('SELECT * FROM mdt_records WHERE person_id = ? ORDER BY created_at DESC', [person.id]);
        const [vehicles] = await pool.query(`${VEHICLE_SELECT} WHERE v.owner_id = ? ORDER BY v.plate`, [person.id]);
        return { person: personFromRow(person), records: records.map(recordFromRow), vehicles: vehicles.map(vehicleFromRow) };
      }

      case 'savePerson': {
        const values = await personInput(body.person);
        const id = str(body.person.id, 16);
        if (id) {
          await requirePerson(id);
          await pool.query(
            `UPDATE mdt_persons SET name = ?, dob = ?, ssn = ?, phone = ?, address = ?, description = ?, licenses = ?,
               wanted = ?, wanted_reason = ?, updated_at = NOW(), updated_by = ? WHERE id = ?`,
            [...values, author, id]
          );
          return { id };
        }
        const created = newId();
        await pool.query(
          `INSERT INTO mdt_persons (id, name, dob, ssn, phone, address, description, licenses, wanted, wanted_reason, updated_by)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [created, ...values, author]
        );
        return { id: created };
      }

      case 'deletePerson': {
        const person = await requirePerson(str(body.id, 16));
        await pool.query('DELETE FROM mdt_records WHERE person_id = ?', [person.id]);
        await pool.query('UPDATE mdt_vehicles SET owner_id = NULL WHERE owner_id = ?', [person.id]);
        await pool.query('DELETE FROM mdt_persons WHERE id = ?', [person.id]);
        return { ok: true };
      }

      case 'getVehicle': {
        const [rows] = await pool.query(`${VEHICLE_SELECT} WHERE v.id = ?`, [str(body.id, 16)]);
        if (rows.length === 0) throw new HttpError(404, 'Nie ma takiego pojazdu w kartotece.');
        return { vehicle: vehicleFromRow(rows[0]) };
      }

      case 'saveVehicle': {
        const values = await vehicleInput(body.vehicle);
        const id = str(body.vehicle.id, 16);
        if (id) {
          const [res] = await pool.query(
            `UPDATE mdt_vehicles SET plate = ?, model = ?, color = ?, owner_id = ?, stolen = ?, notes = ?,
               updated_at = NOW(), updated_by = ? WHERE id = ?`,
            [...values, author, id]
          );
          if (res.affectedRows === 0) throw new HttpError(404, 'Nie ma takiego pojazdu w kartotece.');
          return { id };
        }
        const created = newId();
        await pool.query(
          `INSERT INTO mdt_vehicles (id, plate, model, color, owner_id, stolen, notes, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [created, ...values, author]
        );
        return { id: created };
      }

      case 'deleteVehicle': {
        await pool.query('DELETE FROM mdt_vehicles WHERE id = ?', [str(body.id, 16)]);
        return { ok: true };
      }

      case 'addRecord': {
        const person = await requirePerson(str(body.personId, 16));
        const r = body.record ?? {};
        const kind = RECORD_KINDS.includes(r.kind) ? r.kind : 'inne';
        const title = str(r.title, 200).trim();
        if (!title) throw new HttpError(400, 'Podaj tytuł wpisu.');
        const id = newId();
        await pool.query(
          `INSERT INTO mdt_records (id, person_id, kind, title, content, fine, jail_months, doc_number, author, author_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [id, person.id, kind, title, str(r.content, 4000), int(r.fine, 10_000_000), int(r.jailMonths, 10_000),
            str(r.docNumber, 100), author, discordId]
        );
        return { id };
      }

      case 'deleteRecord': {
        const id = str(body.id, 16);
        const [res] = isOwner(discordId)
          ? await pool.query('DELETE FROM mdt_records WHERE id = ?', [id])
          : await pool.query('DELETE FROM mdt_records WHERE id = ? AND author_id = ?', [id, discordId]);
        if (res.affectedRows === 0) throw new HttpError(403, 'Wpis może usunąć tylko jego autor.');
        return { ok: true };
      }

      default:
        throw new HttpError(400, 'Nieznana akcja.');
    }
  }

  return { handleMdt };
}
