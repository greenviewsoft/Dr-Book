// book-appointment — Appwrite Function (Node).
// node-appwrite SDK version (server-side).

import { Client, Databases, Query, ID, Permission, Role } from "node-appwrite";

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
  return new Databases(client);
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
    p = typeof req.body === "object"
      ? req.body
      : JSON.parse(req.bodyRaw || req.body || "{}");
  } catch {
    return res.json({ ok: false, error: "INVALID_INPUT" }, 400);
  }

  const name = (p.name || "").toString().trim();
  const phone = (p.phone || "").toString().replace(/[\s-]/g, "");
  const age = Number(p.age);
  const problem = (p.problem || "").toString().trim();
  const date = (p.date || "").toString().trim();

  log(`Input: name=${name}, phone=${phone}, age=${age}, date=${date}`);

  if (
    !name ||
    !/^01\d{9}$/.test(phone) ||
    Number.isNaN(age) ||
    age < 0 ||
    age > 150 ||
    !/^\d{4}-\d{2}-\d{2}$/.test(date)
  ) {
    log(`Validation failed: name=${name}, phone=${phone}, age=${age}, date=${date}`);
    return res.json({ ok: false, error: "INVALID_INPUT" }, 400);
  }

  if (!DATABASE_ID || !DOCTOR_USER_ID) {
    error("Missing APPWRITE_DATABASE_ID or DOCTOR_USER_ID env var");
    return res.json({ ok: false, error: "CONFIG_MISSING" }, 500);
  }

  const db = makeDb();

  // --- Doctor settings ---
  let cfg;
  try {
    const doctorsRes = await db.listDocuments(DATABASE_ID, TABLES.doctors, [
      Query.limit(1),
    ]);
    cfg = doctorsRes.documents[0];
  } catch (e) {
    error(`Failed to load doctor config: ${e?.message || e}`);
    return res.json({ ok: false, error: "CONFIG_MISSING" }, 500);
  }

  if (!cfg) return res.json({ ok: false, error: "CONFIG_MISSING" }, 500);

  const limit = Number(cfg.daily_limit) || 0;
  const workingDays = cfg.working_days || [];
  const slot = Number(cfg.slot_duration_minutes) || 1;

  log(`Doctor config: limit=${limit}, workingDays=${workingDays}, slot=${slot}`);

  // --- Date rules (Asia/Dhaka) ---
  if (date < todayISO())
    return res.json({ ok: false, error: "PAST_DATE" }, 400);
  if (!workingDays.includes(weekdayKey(date)))
    return res.json({ ok: false, error: "NOT_WORKING_DAY" }, 400);

  // --- Holiday check ---
  const holRes = await db.listDocuments(DATABASE_ID, TABLES.holidays, [
    Query.equal("date", date),
    Query.limit(1),
  ]);
  if (holRes.documents.length > 0)
    return res.json({ ok: false, error: "HOLIDAY" }, 400);

  // --- Spam dedupe (same phone + date, not cancelled) ---
  const dupRes = await db.listDocuments(DATABASE_ID, TABLES.appointments, [
    Query.equal("patient_phone", phone),
    Query.equal("appointment_date", date),
    Query.notEqual("status", "cancelled"),
    Query.limit(1),
  ]);
  if (dupRes.documents.length > 0) {
    const existing = dupRes.documents[0];
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

  // --- Ensure the daily counter document exists ---
  const counterDocId = "d" + date.replaceAll("-", "");
  try {
    await db.createDocument(
      DATABASE_ID,
      TABLES.daily_counters,
      counterDocId,
      { date, next_serial: 0 },
      [Permission.read(Role.any())]
    );
  } catch (e) {
    log(`counter exists for ${date}: ${e?.message || e}`);
  }

  // --- Pre-check slot availability ---
  let issued = 0;
  try {
    const c = await db.getDocument(DATABASE_ID, TABLES.daily_counters, counterDocId);
    issued = Number(c.next_serial) || 0;
  } catch {
    /* ignore */
  }
  if (issued >= limit) return res.json({ ok: false, error: "NO_SLOTS" }, 400);

  // --- Atomic serial increment ---
  let serial;
  try {
    const updated = await db.updateDocument(
      DATABASE_ID,
      TABLES.daily_counters,
      counterDocId,
      { next_serial: issued + 1 }
    );
    serial = Number(updated.next_serial);
  } catch (e) {
    error(`Failed to increment counter: ${e?.message || e}`);
    return res.json({ ok: false, error: "NO_SLOTS" }, 400);
  }

  if (serial > limit) return res.json({ ok: false, error: "NO_SLOTS" }, 400);

  const displayTime = computeDisplayTime(cfg.daily_start, serial, slot);

  // --- Create the appointment ---
  try {
    await db.createDocument(
      DATABASE_ID,
      TABLES.appointments,
      ID.unique(),
      {
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
      [
        Permission.read(Role.user(DOCTOR_USER_ID)),
        Permission.update(Role.user(DOCTOR_USER_ID)),
        Permission.delete(Role.user(DOCTOR_USER_ID)),
      ]
    );
  } catch (e) {
    error(`Failed to create appointment: ${e?.message || e}`);
    return res.json({ ok: false, error: "FAILED" }, 500);
  }

  log(`Appointment created: serial=${serial}, date=${date}`);
  return res.json({ ok: true, serial, date, displayTime });
}