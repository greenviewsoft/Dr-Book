import { Query, ID, Permission, Role } from "appwrite";
import { db } from "@/lib/appwrite";
import { DB_ID, TABLES } from "@/lib/constants";

// ---- Appointments ----
export async function listAppointmentsByDate(date) {
  const { rows } = await db.listRows({
    databaseId: DB_ID,
    tableId: TABLES.appointments,
    queries: [
      Query.equal("appointment_date", date),
      Query.orderAsc("serial_number"),
      Query.limit(500),
    ],
  });
  return rows;
}

export async function updateAppointmentStatus(rowId, status) {
  return db.updateRow({
    databaseId: DB_ID,
    tableId: TABLES.appointments,
    rowId,
    data: { status },
  });
}

// ---- Doctor settings (single row) ----
export async function getDoctorConfig() {
  const { rows } = await db.listRows({
    databaseId: DB_ID,
    tableId: TABLES.doctors,
    queries: [Query.limit(1)],
  });
  return rows[0] || null;
}

export async function updateDoctorConfig(rowId, data) {
  return db.updateRow({
    databaseId: DB_ID,
    tableId: TABLES.doctors,
    rowId,
    data,
  });
}

// First-time setup: create the single doctor settings row.
// Read = anyone (the public booking page reads it without login);
// Update/Delete = the logged-in doctor only. Mirrors addHoliday().
export async function createDoctorConfig(data, doctorId) {
  return db.createRow({
    databaseId: DB_ID,
    tableId: TABLES.doctors,
    rowId: ID.unique(),
    data,
    permissions: [
      Permission.read(Role.any()),
      Permission.update(Role.user(doctorId)),
      Permission.delete(Role.user(doctorId)),
    ],
  });
}

// ---- Holidays ----
export async function listHolidays() {
  const { rows } = await db.listRows({
    databaseId: DB_ID,
    tableId: TABLES.holidays,
    queries: [Query.orderAsc("date"), Query.limit(500)],
  });
  return rows;
}

// doctorId = current (logged-in) doctor's $id — rows stay editable by the doctor
// while remaining publicly readable (booking page needs to read holidays).
export async function addHoliday(date, reason, doctorId) {
  return db.createRow({
    databaseId: DB_ID,
    tableId: TABLES.holidays,
    rowId: ID.unique(),
    data: { date, reason: reason || "" },
    permissions: [
      Permission.read(Role.any()),
      Permission.update(Role.user(doctorId)),
      Permission.delete(Role.user(doctorId)),
    ],
  });
}

export async function deleteHoliday(rowId) {
  return db.deleteRow({
    databaseId: DB_ID,
    tableId: TABLES.holidays,
    rowId,
  });
}
