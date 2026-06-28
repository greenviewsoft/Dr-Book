// book-appointment — Appwrite Function (Node).
//
// This is the SECURITY BOUNDARY for public booking. Patients are anonymous,
// so the row must be created server-side (with a server API key) and
// permissioned to the doctor only. Client-side validation is UX only.
//
// Required Function environment variables (set in the Appwrite console):
//   APPWRITE_ENDPOINT    e.g. https://nyc.cloud.appwrite.io/v1
//   APPWRITE_PROJECT_ID  your project id
//   APPWRITE_API_KEY     a server API key with TablesDB read/write scopes
//   APPWRITE_DATABASE_ID the database holding the tables below
//   DOCTOR_USER_ID       the doctor's Appwrite account $id (permission anchor)
//
// Tables (TablesDB): doctors, holidays, appointments, daily_counters
// daily_counters.next_serial stores the number of serials already issued for
// that date (0-based). incrementRowColumn(max = daily_limit) both assigns the
// serial atomically and enforces the daily cap.

import { Client, TablesDB, Query, ID, Permission, Role } from "appwrite";

const DATABASE_ID = process.env.APPWRITE_DATABASE_ID;
const DOCTOR_USER_ID = process.env.DOCTOR_USER_ID;

const TABLES = {
  doctors: "doctors",
  holidays: "holidays",
  appointments: "appointments",
  daily_counters: "daily_counters",
};

const TZ = "Asia/Dhaka";

function makeDb() {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);
  return new TablesDB(client);
}

function todayISO() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (t) => parts.find((p) => p.type === t).value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function weekdayKey(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][
    new Date(Date.UTC(y, m - 1, d)).getUTCDay()
  ];
}

function computeDisplayTime(startTime, serial, slotMinutes) {
  const [h, m] = startTime.split(":").map(Number);
  const total = h * 60 + m + (serial - 1) * (slotMinutes || 1);
  const hh = String(Math.floor(total / 60) % 24).padStart(2, "0");
  const mm = String(total % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

export default async function ({ req, res, log, error }) {
  if (req.method !== "POST") {
    return res.json({ ok: false, error: "FAILED" }, 405);
  }

  // --- Parse + validate input ---
  let p;
  try {
  p = typeof req.body === "object" ? req.body : JSON.parse(req.bodyRaw || req.body || "{}");
  } catch {
    return res.json({ ok: false, error: "INVALID_INPUT" }, 400);
  }

  const name = (p.name || "").toString().trim();
  const phone = (p.phone || "").toString().replace(/[\s-]/g, "");
  const age = Number(p.age);
  const problem = (p.problem || "").toString().trim();
  const date = (p.date || "").toString().trim();

  if (
    !name ||
    !/^01\d{9}$/.test(phone) ||
    Number.isNaN(age) ||
    age < 0 ||
    age > 150 ||
    !/^\d{4}-\d{2}-\d{2}$/.test(date)
  ) {
    return res.json({ ok: false, error: "INVALID_INPUT" }, 400);
  }

  if (!DATABASE_ID || !DOCTOR_USER_ID) {
    error("Missing APPWRITE_DATABASE_ID or DOCTOR_USER_ID env var");
    return res.json({ ok: false, error: "CONFIG_MISSING" }, 500);
  }

  const db = makeDb();

  // --- Doctor settings ---
  const doctorsRes = await db.listRows({
    databaseId: DATABASE_ID,
    tableId: TABLES.doctors,
    queries: [Query.limit(1)],
  });
  const cfg = doctorsRes.rows[0];
  if (!cfg) return res.json({ ok: false, error: "CONFIG_MISSING" }, 500);

  const limit = Number(cfg.daily_limit) || 0;
  const workingDays = cfg.working_days || [];
  const slot = Number(cfg.slot_duration_minutes) || 1;

  // --- Date rules (Asia/Dhaka) ---
  if (date < todayISO())
    return res.json({ ok: false, error: "PAST_DATE" }, 400);
  if (!workingDays.includes(weekdayKey(date)))
    return res.json({ ok: false, error: "NOT_WORKING_DAY" }, 400);

  const holRes = await db.listRows({
    databaseId: DATABASE_ID,
    tableId: TABLES.holidays,
    queries: [Query.equal("date", date), Query.limit(1)],
  });
  if (holRes.rows.length > 0)
    return res.json({ ok: false, error: "HOLIDAY" }, 400);

  // --- Spam dedupe (same phone + date, not cancelled) ---
  const dupRes = await db.listRows({
    databaseId: DATABASE_ID,
    tableId: TABLES.appointments,
    queries: [
      Query.equal("patient_phone", phone),
      Query.equal("appointment_date", date),
      Query.notEqual("status", "cancelled"),
      Query.limit(1),
    ],
  });
  if (dupRes.rows.length > 0) {
    const existing = dupRes.rows[0];
    return res.json({
      ok: true,
      duplicate: true,
      serial: existing.serial_number,
      date,
      displayTime: computeDisplayTime(
        cfg.daily_start,
        existing.serial_number,
        slot
      ),
    });
  }

  // --- Ensure the daily counter row exists (idempotent) ---
  const counterRowId = "d" + date.replaceAll("-", "");
  try {
    await db.createRow({
      databaseId: DATABASE_ID,
      tableId: TABLES.daily_counters,
      rowId: counterRowId,
      data: { date, next_serial: 0 },
      permissions: [Permission.read(Role.any())],
    });
  } catch (e) {
    // Row already exists for this date — that's expected.
    log(`counter exists for ${date}: ${e?.message || e}`);
  }

  // Pre-check to avoid a guaranteed over-limit increment.
  let issued = 0;
  try {
    const c = await db.getRow({
      databaseId: DATABASE_ID,
      tableId: TABLES.daily_counters,
      rowId: counterRowId,
    });
    issued = Number(c.next_serial) || 0;
  } catch {
    /* ignore */
  }
  if (issued >= limit) return res.json({ ok: false, error: "NO_SLOTS" }, 400);

  // --- Atomic serial assignment + cap (max guards against races) ---
  let serial;
  try {
    const row = await db.incrementRowColumn({
      databaseId: DATABASE_ID,
      tableId: TABLES.daily_counters,
      rowId: counterRowId,
      column: "next_serial",
      value: 1,
      max: limit,
    });
    serial = Number(row.next_serial);
  } catch (e) {
    // Exceeded the daily cap (concurrent booking raced ahead).
    log(`increment capped for ${date}: ${e?.message || e}`);
    return res.json({ ok: false, error: "NO_SLOTS" }, 400);
  }

  const displayTime = computeDisplayTime(cfg.daily_start, serial, slot);

  // --- Create the appointment (readable/editable only by the doctor) ---
  try {
    await db.createRow({
      databaseId: DATABASE_ID,
      tableId: TABLES.appointments,
      rowId: ID.unique(),
      data: {
        patient_name: name,
        patient_phone: phone,
        patient_age: age,
        problem,
        appointment_date: date,
        serial_number: serial,
        status: "pending",
        created_at: new Date().toISOString(),
        doctor_id: DOCTOR_USER_ID,
      },
      permissions: [
        Permission.read(Role.user(DOCTOR_USER_ID)),
        Permission.update(Role.user(DOCTOR_USER_ID)),
        Permission.delete(Role.user(DOCTOR_USER_ID)),
      ],
    });
  } catch (e) {
    error(`Failed to create appointment: ${e?.message || e}`);
    return res.json({ ok: false, error: "FAILED" }, 500);
  }

  return res.json({ ok: true, serial, date, displayTime });
}
